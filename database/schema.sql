-- Drop database if exists (for fresh start)
DROP DATABASE IF EXISTS ticketqueen;

-- Create database
CREATE DATABASE ticketqueen;

-- Connect to database
\c ticketqueen;

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    venue VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available INTEGER NOT NULL,
    total INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchases table
CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    quantity INTEGER NOT NULL,
    purchase_date TIMESTAMP NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL
);

-- Insert sample events
INSERT INTO events (name, date, venue, price, available, total) VALUES
('Rock Concert 2026', '2026-03-15', 'Madison Square Garden', 89.99, 150, 500),
('Jazz Night Live', '2026-02-20', 'Blue Note', 45.00, 80, 200),
('Comedy Show Extravaganza', '2026-04-10', 'Laugh Factory', 35.50, 200, 300),
('Classical Symphony', '2026-05-05', 'Carnegie Hall', 125.00, 5, 400);

-- Create indexes for performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_purchases_event ON purchases(event_id);
