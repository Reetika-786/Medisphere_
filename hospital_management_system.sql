DROP DATABASE IF EXISTS hospital_db;
CREATE DATABASE hospital_db;
USE hospital_db;

--  TABLE: users
--  Central login table for ALL roles (admin, doctor, patient)
--  Every person must have a row here to log in
-- ------------------------------------------------------------
CREATE TABLE users (
    user_id    INT AUTO_INCREMENT PRIMARY KEY,
    email      VARCHAR(150) NOT NULL UNIQUE,   -- used for login
    password   VARCHAR(255) NOT NULL,          -- store hashed in real apps
    role       ENUM('admin', 'doctor', 'patient') NOT NULL,
    is_active  TINYINT(1) DEFAULT 1,           -- 0 = deactivated by admin
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
--  TABLE: admins
--  Stores extra profile info for admin users
--  Linked to users table via user_id
-- ------------------------------------------------------------
CREATE TABLE admins (
    admin_id  INT AUTO_INCREMENT PRIMARY KEY,
    user_id   INT NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone     VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  TABLE: departments
--  Hospital departments like Cardiology, Neurology etc.
--  Doctors belong to a department
-- ------------------------------------------------------------
CREATE TABLE departments (
    dept_id     INT AUTO_INCREMENT PRIMARY KEY,
    dept_name   VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);
