// ─────────────────────────────────────────
//  routes/admin.js
//  Admin-only endpoints — monitor everything,
//  add/remove doctors, manage users
// ─────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ─────────────────────────────────────────
//  GET /api/admin/dashboard
//  Summary stats — total patients, doctors, appointments by status
// ─────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM vw_admin_dashboard`);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/admin/users
//  View all users with their roles
// ─────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, email, role, is_active, created_at FROM users`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/admin/patients
//  View all patients
// ─────────────────────────────────────────
router.get('/patients', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM patients`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  POST /api/admin/doctors
//  Admin adds a new doctor
//  Body: { email, password, full_name, specialization, dept_id, phone, experience_yrs, available_from, available_to, fee }
// ─────────────────────────────────────────
router.post('/doctors', async (req, res) => {
  const { email, password, full_name, specialization, dept_id, phone, experience_yrs, available_from, available_to, fee } = req.body;

  if (!email || !password || !full_name || !specialization) {
    return res.status(400).json({ message: 'email, password, full_name and specialization are required.' });
  }

  try {
    // Step 1: Create user account
    const [userResult] = await db.query(
      `INSERT INTO users (email, password, role) VALUES (?, ?, 'doctor')`,
      [email, password]
    );

    // Step 2: Create doctor profile
    await db.query(
      `INSERT INTO doctors (user_id, full_name, specialization, dept_id, phone, experience_yrs, available_from, available_to, fee)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, full_name, specialization, dept_id, phone, experience_yrs, available_from, available_to, fee]
    );

    res.status(201).json({ message: 'Doctor added successfully.' });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  DELETE /api/admin/patients/:id
//  Admin deletes a patient (cascades to appointments, records)
// ─────────────────────────────────────────
router.delete('/patients/:id', async (req, res) => {
  try {
    // Get the user_id linked to this patient
    const [rows] = await db.query(
      `SELECT user_id FROM patients WHERE patient_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    // Deleting from users cascades to patients, appointments, records
    await db.query(`DELETE FROM users WHERE user_id = ?`, [rows[0].user_id]);

    res.json({ message: 'Patient deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  DELETE /api/admin/doctors/:id
//  Admin deletes a doctor
// ─────────────────────────────────────────
router.delete('/doctors/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id FROM doctors WHERE doctor_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    await db.query(`DELETE FROM users WHERE user_id = ?`, [rows[0].user_id]);

    res.json({ message: 'Doctor deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  PUT /api/admin/users/:id/deactivate
//  Admin deactivates a user (blocks login)
// ─────────────────────────────────────────
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    await db.query(`UPDATE users SET is_active = 0 WHERE user_id = ?`, [req.params.id]);
    res.json({ message: 'User deactivated. They can no longer log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  PUT /api/admin/users/:id/activate
//  Admin reactivates a user
// ─────────────────────────────────────────
router.put('/users/:id/activate', async (req, res) => {
  try {
    await db.query(`UPDATE users SET is_active = 1 WHERE user_id = ?`, [req.params.id]);
    res.json({ message: 'User reactivated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  PUT /api/admin/appointments/:id/status
//  Admin force-updates any appointment status
//  Body: { status }  — Pending/Confirmed/Completed/Cancelled
// ─────────────────────────────────────────
router.put('/appointments/:id/status', async (req, res) => {
  const { status } = req.body;
  const allowed = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    await db.query(
      `UPDATE appointments SET status = ? WHERE appointment_id = ?`,
      [status, req.params.id]
    );
    res.json({ message: `Appointment status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/admin/records
//  Admin views all medical records
// ─────────────────────────────────────────
router.get('/records', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT mr.record_id, p.full_name AS patient_name, d.full_name AS doctor_name,
              mr.diagnosis, mr.prescription, mr.follow_up_date, mr.created_at
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.patient_id
       JOIN doctors  d ON mr.doctor_id  = d.doctor_id`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/admin/departments
//  View all departments
// ─────────────────────────────────────────
router.get('/departments', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM departments`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  POST /api/admin/departments
//  Admin adds a new department
//  Body: { dept_name, description }
// ─────────────────────────────────────────
router.post('/departments', async (req, res) => {
  const { dept_name, description } = req.body;

  try {
    await db.query(
      `INSERT INTO departments (dept_name, description) VALUES (?, ?)`,
      [dept_name, description]
    );
    res.status(201).json({ message: 'Department added successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
