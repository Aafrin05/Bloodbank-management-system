CREATE DATABASE IF NOT EXISTS blood_bank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE blood_bank;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  age TINYINT UNSIGNED NOT NULL,
  gender ENUM('Female','Male','Other') NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(190) NULL,
  city VARCHAR(100) NOT NULL,
  last_donation_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL UNIQUE,
  units INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_name VARCHAR(120) NOT NULL,
  hospital VARCHAR(160) NOT NULL,
  blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') NOT NULL,
  units INT UNSIGNED NOT NULL,
  contact_phone VARCHAR(30) NOT NULL,
  urgency ENUM('Normal','Urgent','Critical') NOT NULL DEFAULT 'Normal',
  status ENUM('Pending','Approved','Rejected','Completed') NOT NULL DEFAULT 'Pending',
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO inventory (blood_group, units) VALUES
('A+', 24), ('A-', 8), ('B+', 18), ('B-', 6),
('AB+', 10), ('AB-', 4), ('O+', 30), ('O-', 9);
