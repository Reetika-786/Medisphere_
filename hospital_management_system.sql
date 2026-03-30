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

--  TABLE: patients
--  Stores patient profile info
--  Each patient must also exist in the users table
-- ------------------------------------------------------------
CREATE TABLE patients (
    patient_id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL UNIQUE,
    full_name         VARCHAR(150) NOT NULL,
    date_of_birth     DATE,
    gender            ENUM('Male', 'Female', 'Other'),
    phone             VARCHAR(20),
    address           TEXT,
    blood_group       VARCHAR(5),
    emergency_contact VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  TABLE: appointments
--  Core table — tracks every booking between patient & doctor
--  Status flow: Pending -> Confirmed -> Completed
--                       -> Cancelled (at any point before Completed)
-- ------------------------------------------------------------
CREATE TABLE appointments (
    appointment_id   INT AUTO_INCREMENT PRIMARY KEY,
    patient_id       INT NOT NULL,
    doctor_id        INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason           TEXT,                     -- why patient is visiting
    status           ENUM('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Pending',
    doctor_notes     TEXT,                     -- added by doctor after visit
    booked_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    cancelled_at     DATETIME,
    cancel_reason    TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)  REFERENCES doctors(doctor_id)   ON DELETE CASCADE
);

-- ------------------------------------------------------------
--  TABLE: medical_records
--  Created by doctor after completing a visit
--  Contains diagnosis, prescription, follow-up date
-- ------------------------------------------------------------
CREATE TABLE medical_records (
    record_id      INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,        -- one record per appointment
    patient_id     INT NOT NULL,
    doctor_id      INT NOT NULL,
    diagnosis      TEXT,
    prescription   TEXT,
    lab_tests      TEXT,
    follow_up_date DATE,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id)     REFERENCES patients(patient_id)         ON DELETE CASCADE,
    FOREIGN KEY (doctor_id)      REFERENCES doctors(doctor_id)           ON DELETE CASCADE
);
