// ─────────────────────────────────────────
//  routes/doctors.js
//  All doctor-related API endpoints
// ─────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ─────────────────────────────────────────
//  GET /api/doctors
//  List all doctors (patients use this to browse before booking)
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM vw_doctor_list`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/doctors?specialization=Cardiologist
//  Filter doctors by specialization
// ─────────────────────────────────────────
router.get('/search', async (req, res) => {
  const { specialization, dept_name } = req.query;

  try {
    let query  = `SELECT * FROM vw_doctor_list WHERE 1=1`;
    const params = [];

    if (specialization) {
      query += ` AND specialization LIKE ?`;
      params.push(`%${specialization}%`);
    }

    if (dept_name) {
      query += ` AND dept_name LIKE ?`;
      params.push(`%${dept_name}%`);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/doctors/:id
//  Get a specific doctor's profile
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM vw_doctor_list WHERE doctor_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/doctors/:id/appointments
//  Doctor views all their appointments
// ─────────────────────────────────────────
router.get('/:id/appointments', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM vw_doctor_appointments WHERE doctor_id = ?`,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  PUT /api/doctors/:id
//  Doctor updates their own profile
//  Body: { phone, available_from, available_to, fee }
// ─────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { phone, available_from, available_to, fee } = req.body;

  try {
    await db.query(
      `UPDATE doctors SET phone = ?, available_from = ?, available_to = ?, fee = ?
       WHERE doctor_id = ?`,
      [phone, available_from, available_to, fee, req.params.id]
    );

    res.json({ message: 'Doctor profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
