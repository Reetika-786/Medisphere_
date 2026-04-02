// ─────────────────────────────────────────
//  routes/patients.js
//  All patient-related API endpoints
// ─────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ─────────────────────────────────────────
//  POST /api/patients/register
//  Register a new patient
//  Body: { email, password, full_name, date_of_birth, gender, phone, address, blood_group, emergency_contact }
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { email, password, full_name, date_of_birth, gender, phone, address, blood_group, emergency_contact } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ message: 'Email, password and full name are required.' });
  }

  try {
    // Step 1: Insert into users table
    const [userResult] = await db.query(
      `INSERT INTO users (email, password, role) VALUES (?, ?, 'patient')`,
      [email, password]
    );

    const newUserId = userResult.insertId;

    // Step 2: Insert into patients table using the new user_id
    await db.query(
      `INSERT INTO patients (user_id, full_name, date_of_birth, gender, phone, address, blood_group, emergency_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newUserId, full_name, date_of_birth, gender, phone, address, blood_group, emergency_contact]
    );

    res.status(201).json({ message: 'Patient registered successfully.' });

  } catch (err) {
    // Duplicate email error
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/patients/:id
//  Get a patient's own profile
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM patients WHERE patient_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  PUT /api/patients/:id
//  Update patient profile (phone, address, emergency contact)
//  Body: { phone, address, emergency_contact }
// ─────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { phone, address, emergency_contact } = req.body;

  try {
    await db.query(
      `UPDATE patients SET phone = ?, address = ?, emergency_contact = ?
       WHERE patient_id = ?`,
      [phone, address, emergency_contact, req.params.id]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/patients/:id/history
//  Patient views their full appointment + medical record history
// ─────────────────────────────────────────
router.get('/:id/history', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM vw_patient_history WHERE patient_id = ?`,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
