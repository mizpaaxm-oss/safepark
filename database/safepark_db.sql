-- =========================================================
--  SafePark — Parking Management System
--  MySQL Database Schema
--  Database: safepark_db
-- =========================================================

CREATE DATABASE IF NOT EXISTS safepark_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE safepark_db;

-- ---------------------------------------------------------
-- Table: users  (system/admin accounts)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,           -- store a hashed password in production
  role       ENUM('Administrator','Staff') NOT NULL DEFAULT 'Staff',
  status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: drivers
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(120) NOT NULL,
  phone          VARCHAR(30)  NOT NULL,
  email          VARCHAR(150) NULL,
  license_number VARCHAR(50)  NOT NULL UNIQUE,
  address        VARCHAR(255) NULL,
  status         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: vehicles
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  driver_id     INT UNSIGNED NOT NULL,
  plate_number  VARCHAR(20)  NOT NULL UNIQUE,
  type          ENUM('Car','SUV','Van','Truck','Bike') NOT NULL DEFAULT 'Car',
  brand         VARCHAR(100) NOT NULL,
  color         VARCHAR(40)  NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: parking_slots
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS parking_slots (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slot_code  VARCHAR(20) NOT NULL UNIQUE,
  zone       VARCHAR(5)  NOT NULL,
  floor      VARCHAR(50) NOT NULL DEFAULT 'Ground Floor',
  type       ENUM('Standard','Reserved','Bike') NOT NULL DEFAULT 'Standard',
  status     ENUM('available','occupied','reserved','maintenance') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: parking_records  (vehicle entry / exit log)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS parking_records (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehicle_id  INT UNSIGNED NOT NULL,
  slot_id     INT UNSIGNED NOT NULL,
  entry_time  DATETIME NOT NULL,
  exit_time   DATETIME NULL,
  status      ENUM('parked','completed') NOT NULL DEFAULT 'parked',
  fee         DECIMAL(8,2) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_records_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_records_slot FOREIGN KEY (slot_id) REFERENCES parking_slots(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------
-- Table: payments
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  record_id  INT UNSIGNED NOT NULL,
  amount     DECIMAL(8,2) NOT NULL,
  method     ENUM('Cash','Mobile Money','Card') NOT NULL DEFAULT 'Cash',
  status     ENUM('paid','pending') NOT NULL DEFAULT 'paid',
  paid_at    DATETIME NOT NULL,
  CONSTRAINT fk_payments_record FOREIGN KEY (record_id) REFERENCES parking_records(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- Sample / seed data (mirrors the front-end demo dataset)
-- =========================================================

INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@safepark.com', 'admin123', 'Administrator');
-- NOTE: use password_hash() in PHP and verify with password_verify()
-- when wiring this up to a real authentication API.

INSERT INTO drivers (full_name, phone, email, license_number, address, status) VALUES
('Ahmed Hassan',  '0611223344', 'ahmed.hassan@mail.com',  'DL-10234', 'Hargeisa, Somaliland', 'active'),
('Farah Abdi',    '0629988776', 'farah.abdi@mail.com',    'DL-10399', 'Hargeisa, Somaliland', 'active'),
('Ikram Warsame', '0634455667', 'ikram.warsame@mail.com', 'DL-11021', 'Burao, Somaliland',    'active'),
('Cabdi Rashiid', '0655221199', 'cabdi.rashiid@mail.com', 'DL-11288', 'Berbera, Somaliland',  'inactive'),
('Nasra Xasan',   '0611998877', 'nasra.xasan@mail.com',   'DL-11733', 'Hargeisa, Somaliland', 'active'),
('Yusuf Cali',    '0625566334', 'yusuf.cali@mail.com',    'DL-12045', 'Hargeisa, Somaliland', 'active');

INSERT INTO vehicles (driver_id, plate_number, type, brand, color) VALUES
(1, 'SL-1042-A', 'Car',   'Toyota Corolla', 'White'),
(2, 'SL-2871-B', 'Car',   'Hyundai Accent', 'Silver'),
(3, 'SL-3390-C', 'SUV',   'Toyota RAV4',    'Black'),
(4, 'SL-4021-D', 'Van',   'Toyota Hiace',   'White'),
(5, 'SL-5510-E', 'Bike',  'Honda CB',       'Red'),
(6, 'SL-6684-F', 'Car',   'Kia Sportage',   'Blue'),
(1, 'SL-7742-G', 'Truck', 'Isuzu NPR',      'White');

INSERT INTO parking_slots (slot_code, zone, floor, type, status) VALUES
('A-01','A','Ground Floor','Standard','occupied'),
('A-02','A','Ground Floor','Standard','available'),
('A-03','A','Ground Floor','Standard','occupied'),
('A-04','A','Ground Floor','Bike','occupied'),
('A-05','A','Ground Floor','Reserved','available'),
('A-06','A','Ground Floor','Standard','occupied'),
('B-01','B','Ground Floor','Standard','available'),
('B-02','B','Ground Floor','Standard','occupied'),
('B-03','B','Ground Floor','Standard','available'),
('B-04','B','Ground Floor','Bike','available'),
('B-05','B','Ground Floor','Reserved','available'),
('B-06','B','Ground Floor','Standard','occupied'),
('C-01','C','Level 1','Standard','available'),
('C-02','C','Level 1','Standard','available'),
('C-03','C','Level 1','Standard','available'),
('C-04','C','Level 1','Bike','available'),
('C-05','C','Level 1','Reserved','reserved'),
('C-06','C','Level 1','Standard','available'),
('D-01','D','Level 1','Standard','available'),
('D-02','D','Level 1','Standard','available'),
('D-03','D','Level 1','Standard','available'),
('D-04','D','Level 1','Bike','maintenance'),
('D-05','D','Level 1','Reserved','available'),
('D-06','D','Level 1','Standard','available');

INSERT INTO parking_records (vehicle_id, slot_id, entry_time, exit_time, status, fee) VALUES
(1, 1, NOW() - INTERVAL 3 HOUR,   NULL,                          'parked',    NULL),
(3, 6, NOW() - INTERVAL 1.5 HOUR, NULL,                          'parked',    NULL),
(6, 8, NOW() - INTERVAL 0.5 HOUR, NULL,                          'parked',    NULL),
(2, 3, NOW() - INTERVAL 30 HOUR,  NOW() - INTERVAL 27 HOUR,       'completed', 4.5),
(5, 4, NOW() - INTERVAL 50 HOUR,  NOW() - INTERVAL 48 HOUR,       'completed', 3.0),
(4, 8, NOW() - INTERVAL 75 HOUR,  NOW() - INTERVAL 72 HOUR,       'completed', 4.5),
(7, 12,NOW() - INTERVAL 100 HOUR, NOW() - INTERVAL 96 HOUR,       'completed', 6.0);

INSERT INTO payments (record_id, amount, method, status, paid_at) VALUES
(4, 4.5, 'Mobile Money', 'paid', NOW() - INTERVAL 27 HOUR),
(5, 3.0, 'Cash',         'paid', NOW() - INTERVAL 48 HOUR),
(6, 4.5, 'Mobile Money', 'paid', NOW() - INTERVAL 72 HOUR),
(7, 6.0, 'Cash',         'paid', NOW() - INTERVAL 96 HOUR);

-- =========================================================
-- Helpful indexes for common lookups / reports
-- =========================================================
CREATE INDEX idx_vehicles_plate      ON vehicles(plate_number);
CREATE INDEX idx_records_status      ON parking_records(status);
CREATE INDEX idx_records_entry_time  ON parking_records(entry_time);
CREATE INDEX idx_slots_status        ON parking_slots(status);
