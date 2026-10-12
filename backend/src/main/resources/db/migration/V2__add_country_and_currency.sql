-- V2: Add country_code and currency_code to users table
ALTER TABLE users ADD COLUMN country_code VARCHAR(2) NULL;
ALTER TABLE users ADD COLUMN currency_code VARCHAR(3) NOT NULL DEFAULT 'USD';
