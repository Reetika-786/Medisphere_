-- ============================================
-- Hospital Management System Database Schema
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS hospital_db;
USE hospital_db;

-- ============================================
-- Users Table (login credentials)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role ENUM('admin', 'doctor', 'patient') NOT NULL,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Admins Table
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- Departments Table
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  dept_id INT AUTO_INCREMENT PRIMARY KEY,
  dept_name VARCHAR(100) NOT NULL UNIQUE,
  head_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Doctors Table
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  doctor_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  dept_id INT,
  phone VARCHAR(15),
  experience_yrs INT,
  available_from TIME,
  available_to TIME,
  fee DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (dept_id) REFERENCES departments(dept_id)
);

-- ============================================
-- Patients Table
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  patient_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Other'),
  phone VARCHAR(15),
  address VARCHAR(255),
  blood_group VARCHAR(5),
  emergency_contact VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- Appointments Table
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  appointment_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  reason VARCHAR(255),
  status ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  UNIQUE KEY unique_slot (doctor_id, appointment_date, appointment_time)
);

-- ============================================
-- Medical Records Table
-- ============================================
CREATE TABLE IF NOT EXISTS medical_records (
  record_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_id INT,
  diagnosis TEXT,
  treatment TEXT,
  medications VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
);

-- ============================================
-- VIEW: Doctor List
-- ============================================
DROP VIEW IF EXISTS vw_doctor_list;
CREATE VIEW vw_doctor_list AS
SELECT 
  d.doctor_id,
  d.full_name,
  d.specialization,
  COALESCE(dept.dept_name, 'N/A') AS dept_name,
  d.phone,
  d.experience_yrs,
  d.available_from,
  d.available_to,
  d.fee,
  u.email
FROM doctors d
LEFT JOIN departments dept ON d.dept_id = dept.dept_id
JOIN users u ON d.user_id = u.user_id
WHERE u.is_active = 1;

-- ============================================
-- VIEW: Doctor Appointments
-- ============================================
DROP VIEW IF EXISTS vw_doctor_appointments;
CREATE VIEW vw_doctor_appointments AS
SELECT 
  a.appointment_id,
  a.appointment_date,
  a.appointment_time,
  a.reason,
  a.status,
  p.full_name AS patient_name,
  p.phone AS patient_phone,
  d.full_name AS doctor_name
FROM appointments a
JOIN patients p ON a.patient_id = p.patient_id
JOIN doctors d ON a.doctor_id = d.doctor_id
ORDER BY a.appointment_date DESC, a.appointment_time DESC;

-- ============================================
-- VIEW: Patient History
-- ============================================
DROP VIEW IF EXISTS vw_patient_history;
CREATE VIEW vw_patient_history AS
SELECT 
  a.appointment_id,
  p.patient_id,
  a.appointment_date,
  a.appointment_time,
  a.reason,
  a.status,
  d.full_name AS doctor_name,
  d.specialization
FROM appointments a
JOIN doctors d ON a.doctor_id = d.doctor_id
JOIN patients p ON a.patient_id = p.patient_id
ORDER BY a.appointment_date DESC;

-- ============================================
-- VIEW: All Appointments (Admin)
-- ============================================
DROP VIEW IF EXISTS vw_all_appointments;
CREATE VIEW vw_all_appointments AS
SELECT 
  a.appointment_id,
  a.appointment_date,
  a.appointment_time,
  a.reason,
  a.status,
  p.full_name AS patient_name,
  p.phone AS patient_phone,
  d.full_name AS doctor_name,
  d.specialization
FROM appointments a
JOIN patients p ON a.patient_id = p.patient_id
JOIN doctors d ON a.doctor_id = d.doctor_id
ORDER BY a.appointment_date DESC, a.appointment_time DESC;

-- ============================================
-- VIEW: Admin Dashboard
-- ============================================
DROP VIEW IF EXISTS vw_admin_dashboard;
CREATE VIEW vw_admin_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM patients) AS total_patients,
  (SELECT COUNT(*) FROM doctors) AS total_doctors,
  (SELECT COUNT(*) FROM appointments WHERE status = 'Pending') AS pending_appointments,
  (SELECT COUNT(*) FROM appointments WHERE status = 'Confirmed') AS confirmed_appointments,
  (SELECT COUNT(*) FROM appointments WHERE status = 'Completed') AS completed_appointments,
  (SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled') AS cancelled_appointments;

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample admin
INSERT IGNORE INTO users (email, password, role) VALUES ('admin@hospital.com', 'admin123', 'admin');
INSERT IGNORE INTO admins (user_id, full_name, phone) 
SELECT user_id, 'Admin User', '5550001111' FROM users WHERE email = 'admin@hospital.com' AND user_id NOT IN (SELECT user_id FROM admins);

-- Insert sample department
INSERT IGNORE INTO departments (dept_name) VALUES ('Cardiology');
INSERT IGNORE INTO departments (dept_name) VALUES ('Neurology');
INSERT IGNORE INTO departments (dept_name) VALUES ('General Medicine');
