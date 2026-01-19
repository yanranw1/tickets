package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

func (s *Server) signup(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Check if email already exists
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM users WHERE email = ?", user.Email).Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	if count > 0 {
		http.Error(w, "Email already registered", http.StatusConflict)
		return
	}

	// Insert user (in production, hash the password!)
	result, err := s.db.Exec(
		"INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
		user.Username, user.Email, user.Password,
	)
	if err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	user.ID = int(id)
	user.Password = "" // Don't send password back

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var credentials User
	if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var user User
	err := s.db.QueryRow(
		"SELECT id, username, email FROM users WHERE email = ? AND password = ?",
		credentials.Email, credentials.Password,
	).Scan(&user.ID, &user.Username, &user.Email)

	if err == sql.ErrNoRows {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (s *Server) getEvents(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query("SELECT id, name, date, venue, price, available, total FROM events ORDER BY date")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		rows.Scan(&e.ID, &e.Name, &e.Date, &e.Venue, &e.Price, &e.Available, &e.Total)
		events = append(events, e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(events)
}

func (s *Server) purchaseTickets(w http.ResponseWriter, r *http.Request) {
	var req PurchaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	s.mutex.Lock()
	defer s.mutex.Unlock()

	tx, _ := s.db.Begin()
	defer tx.Rollback()

	for _, item := range req.Items {
		var available int
		err := tx.QueryRow("SELECT available FROM events WHERE id = ? FOR UPDATE", item.EventID).Scan(&available)
		if err != nil {
			http.Error(w, "Event not found", http.StatusNotFound)
			return
		}

		if available < item.Quantity {
			http.Error(w, "Not enough tickets", http.StatusConflict)
			return
		}

		_, err = tx.Exec("UPDATE events SET available = available - ? WHERE id = ?", item.Quantity, item.EventID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		for i := 0; i < item.Quantity; i++ {
			_, err = tx.Exec(`
				INSERT INTO purchases (user_id, event_id, quantity, purchase_date, total_price)
				SELECT ?, id, 1, ?, price
				FROM events WHERE id = ?
			`, req.UserID, time.Now(), item.EventID)

			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				print("here", err.Error())
				return
			}

		}

	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func (s *Server) getUserTickets(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["id"]

	rows, err := s.db.Query(`
		SELECT p.id, p.event_id, e.name, e.date, e.venue, p.quantity, p.total_price, p.purchase_date, p.used
		FROM purchases p
		JOIN events e ON p.event_id = e.id
		WHERE p.user_id = ?
		ORDER BY p.purchase_date DESC
	`, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tickets := []UserTicket{}
	for rows.Next() {
		var t UserTicket
		err := rows.Scan(&t.ID, &t.EventID, &t.EventName, &t.EventDate, &t.Venue, &t.Quantity, &t.TotalPrice, &t.PurchaseDate, &t.Used)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		tickets = append(tickets, t)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tickets)
}

func (s *Server) markTicketAsUsed(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	ticketID := vars["id"]

	_, err := s.db.Exec("UPDATE purchases SET used = TRUE WHERE id = ?", ticketID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
