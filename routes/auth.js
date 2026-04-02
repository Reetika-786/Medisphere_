// ─────────────────────────────────────────
//  routes/auth.js
//  Handles login for Admin, Doctor, Patient
// ─────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ─────────────────────────────────────────
//  POST /api/login
//  Body: { email, password }
//  Returns user info + role if credentials match
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation — both fields required
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Check users table for matching email + password + active account
    const [users] = await db.query(
      `SELECT u.user_id, u.email, u.role,
              CASE u.role
                WHEN 'admin'   THEN (SELECT full_name FROM admins   WHERE user_id = u.user_id)
                WHEN 'doctor'  THEN (SELECT full_name FROM doctors  WHERE user_id = u.user_id)
                WHEN 'patient' THEN (SELECT full_name FROM patients WHERE user_id = u.user_id)
              END AS full_name
       FROM users u
       WHERE u.email = ? AND u.password = ? AND u.is_active = 1`,
      [email, password]
    );

    // No match found — wrong credentials or deactivated
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = users[0];
    res.json({
      message: 'Login successful',
      user: {
        user_id:   user.user_id,
        email:     user.email,
        role:      user.role,
        full_name: user.full_name
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
