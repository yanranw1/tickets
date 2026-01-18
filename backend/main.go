package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	_ "github.com/lib/pq"
	"github.com/gorilla/mux"
)

type Event struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Date      string    `json:"date"`
	Venue     string    `json:"venue"`
	Price     float64   `json:"price"`
	Available int       `json:"available"`
	Total     int       `json:"total"`
}

type CartItem struct {
	EventID  int `json:"event_id"`
	Quantity int `json:"quantity"`
}

type PurchaseRequest struct {
	Items []CartItem `json:"items"`
}

type Server struct {
	db    *sql.DB
	mutex sync.Mutex // Mutex to prevent overselling
}

func main() {
	// Database connection
	connStr := "host=localhost port=5432 user=postgres password=yourpassword dbname=ticketqueen sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	server := &Server{db: db}

	// Setup routes
	r := mux.NewRouter()
	r.HandleFunc("/api/events", server.getEvents).Methods("GET")
	r.HandleFunc("/api/purchase", server.purchaseTickets).Methods("POST")

	// CORS middleware
	http.Handle("/", corsMiddleware(r))

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func (s *Server) getEvents(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`
		SELECT id, name, date, venue, price, available, total 
		FROM events 
		ORDER BY date
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	events := []Event{}
	for rows.Next() {
		var e Event
		err := rows.Scan(&e.ID, &e.Name, &e.Date, &e.Venue, &e.Price, &e.Available, &e.Total)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		events = append(events, e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

func (s *Server) purchaseTickets(w http.ResponseWriter, r *http.Request) {
	var req PurchaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// CRITICAL: Lock mutex to prevent race conditions and overselling
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Start transaction
	tx, err := s.db.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Check availability and reserve tickets
	for _, item := range req.Items {
		var available int
		err := tx.QueryRow("SELECT available FROM events WHERE id = $1 FOR UPDATE", item.EventID).Scan(&available)
		if err != nil {
			http.Error(w, "Event not found", http.StatusNotFound)
			return
		}

		if available < item.Quantity {
			http.Error(w, "Not enough tickets available", http.StatusConflict)
			return
		}

		// Update available tickets
		_, err = tx.Exec("UPDATE events SET available = available - $1 WHERE id = $2", item.Quantity, item.EventID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Insert purchase record
		_, err = tx.Exec(`
			INSERT INTO purchases (event_id, quantity, purchase_date, total_price)
			SELECT id, $1, $2, price * $1
			FROM events WHERE id = $3
		`, item.Quantity, time.Now(), item.EventID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next.ServeHTTP(w, r)
	})
}
