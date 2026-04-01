// ─────────────────────────────────────────
//  routes/appointments.js
//  Book, cancel, confirm, complete appointments
//  + medical records
// ─────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ─────────────────────────────────────────
//  POST /api/appointments
//  Patient books an appointment
//  Body: { patient_id, doctor_id, appointment_date, appointment_time, reason }
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time, reason } = req.body;

  if (!patient_id || !doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ message: 'patient_id, doctor_id, date and time are required.' });
  }

  try {
    // Check if this time slot is already booked for this doctor
    const [conflict] = await db.query(
      `SELECT appointment_id FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
       AND status NOT IN ('Cancelled')`,
      [doctor_id, appointment_date, appointment_time]
    );

    if (conflict.length > 0) {
      return res.status(409).json({ message: 'This time slot is already booked. Please choose another time.' });
    }

    // No conflict — insert the appointment
    const [result] = await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [patient_id, doctor_id, appointment_date, appointment_time, reason]
    );

    res.status(201).json({
      message:        'Appointment booked successfully.',
      appointment_id: result.insertId
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/appointments
//  Admin views all appointments
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM vw_all_appointments`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  GET /api/appointments?status=Pending
//  Admin filters appointments by status
// ─────────────────────────────────────────
router.get('/filter', async (req, res) => {
  const { status, date } = req.query;

  try {
    let query  = `SELECT * FROM vw_all_appointments WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (date) {
      query += ` AND appointment_date = ?`;
      params.push(date);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  PUT /api/appointments/:id/cancel
//  Patient cancels their own appointment
//  Body: { patient_id, cancel_reason }
// ─────────────────────────────────────────
router.put('/:id/cancel', async (req, res) => {
  const { patient_id, cancel_reason } = req.body;

  try {
    // Verify appointment belongs to this patient and is not already done
    const [rows] = await db.query(
      `SELECT status, patient_id FROM appointments WHERE appointment_id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const appt = rows[0];

    // Security check — patient can only cancel their own appointment
    if (appt.patient_id !== parseInt(patient_id)) {
      return res.status(403).json({ message: 'Unauthorized. This is not your appointment.' });
    }

    if (appt.status === 'Cancelled' || appt.status === 'Completed') {
      return res.status(400).json({ message: `Cannot cancel. Appointment is already ${appt.status}.` });
    }

    // All checks passed — cancel it
    await db.query(
      `UPDATE appointments
       SET status = 'Cancelled', cancelled_at = NOW(), cancel_reason = ?
       WHERE appointment_id = ?`,
      [cancel_reason, req.params.id]
    );

    res.json({ message: 'Appointment cancelled successfully.' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  PUT /api/appointments/:id/confirm
//  Doctor confirms a pending appointment
//  Body: { doctor_id }
// ─────────────────────────────────────────
router.put('/:id/confirm', async (req, res) => {
  const { doctor_id } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE appointments SET status = 'Confirmed'
       WHERE appointment_id = ? AND doctor_id = ? AND status = 'Pending'`,
      [req.params.id, doctor_id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: 'No matching pending appointment found.' });
    }

    res.json({ message: 'Appointment confirmed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─────────────────────────────────────────
//  PUT /api/appointments/:id/complete
//  Doctor completes visit + adds notes + medical record
//  Body: { doctor_id, doctor_notes, diagnosis, prescription, lab_tests, follow_up_date }
// ─────────────────────────────────────────
router.put('/:id/complete', async (req, res) => {
  const { doctor_id, doctor_notes, diagnosis, prescription, lab_tests, follow_up_date } = req.body;

  try {
    // Get appointment details first
    const [rows] = await db.query(
      `SELECT * FROM appointments WHERE appointment_id = ? AND doctor_id = ?`,
      [req.params.id, doctor_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found or unauthorized.' });
    }

    const appt = rows[0];

    // Mark appointment as completed
    await db.query(
      `UPDATE appointments SET status = 'Completed', doctor_notes = ?
       WHERE appointment_id = ?`,
      [doctor_notes, req.params.id]
    );

    // Insert medical record for this visit
    await db.query(
      `INSERT INTO medical_records (appointment_id, patient_id, doctor_id, diagnosis, prescription, lab_tests, follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         diagnosis = VALUES(diagnosis),
         prescription = VALUES(prescription),
         lab_tests = VALUES(lab_tests),
         follow_up_date = VALUES(follow_up_date)`,
      [req.params.id, appt.patient_id, doctor_id, diagnosis, prescription, lab_tests, follow_up_date]
    );

    res.json({ message: 'Appointment completed and medical record saved.' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
