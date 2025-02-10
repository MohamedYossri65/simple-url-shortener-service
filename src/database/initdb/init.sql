
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table
CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password VARCHAR(255) NOT NULL,
                       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the urls table
CREATE TABLE urls (
                      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                      original_url TEXT NOT NULL,
                      short_url VARCHAR(255) UNIQUE NOT NULL,
                      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the visits table (Bonus)
CREATE TABLE visits (
                        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        url_id UUID REFERENCES urls(id) ON DELETE CASCADE,
                        visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        user_agent TEXT,
                        ip_address VARCHAR(255)
);
