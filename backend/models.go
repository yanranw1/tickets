package main

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password,omitempty"`
}

type Event struct {
	ID        int     `json:"id"`
	Name      string  `json:"name"`
	Date      string  `json:"date"`
	Venue     string  `json:"venue"`
	Price     float64 `json:"price"`
	Available int     `json:"available"`
	Total     int     `json:"total"`
}

type CartItem struct {
	EventID  int `json:"event_id"`
	Quantity int `json:"quantity"`
}

type PurchaseRequest struct {
	UserID int        `json:"user_id"`
	Items  []CartItem `json:"items"`
}

type UserTicket struct {
	ID           int     `json:"id"`
	EventID      int     `json:"event_id"`
	EventName    string  `json:"event_name"`
	EventDate    string  `json:"event_date"`
	Venue        string  `json:"venue"`
	Quantity     int     `json:"quantity"`
	TotalPrice   float64 `json:"total_price"`
	PurchaseDate string  `json:"purchase_date"`
	Used         bool    `json:"used"`
}
