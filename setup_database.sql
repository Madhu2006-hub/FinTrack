-- FinTrack Database Initialization Script
-- Run this in MySQL (via MySQL Command Line Client, MySQL Workbench, or MySQL Shell)

CREATE DATABASE IF NOT EXISTS fintrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'fintrack_user'@'localhost' IDENTIFIED BY 'change-me-db-password';
ALTER USER 'fintrack_user'@'localhost' IDENTIFIED BY 'change-me-db-password';
GRANT ALL PRIVILEGES ON fintrack.* TO 'fintrack_user'@'localhost';
FLUSH PRIVILEGES;
