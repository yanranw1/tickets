-- Drop and recreate database for quick reset
DROP DATABASE IF EXISTS ticketqueen;
CREATE DATABASE ticketqueen;
USE ticketqueen;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    venue VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available INT NOT NULL,
    total INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    quantity INT NOT NULL,
    purchase_date TIMESTAMP NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Insert sample events
INSERT INTO events (name, date, venue, price, available, total) VALUES
('Rock Concert 2026', '2026-03-15', 'Madison Square Garden', 89.99, 150, 500),
('Jazz Night Live', '2026-02-20', 'Blue Note', 45.00, 80, 200),
('Comedy Show Extravaganza', '2026-04-10', 'Laugh Factory', 35.50, 200, 300),
('Classical Symphony', '2026-05-05', 'Carnegie Hall', 125.00, 5, 400);

-- Insert sample user (password: password123)
INSERT INTO users (username, email, password) VALUES
('demo', 'demo@example.com', 'password123');

-- Create indexes for faster filtering
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_event ON purchases(event_id);
CREATE INDEX idx_users_email ON users(email);