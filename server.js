// ─────────────────────────────────────────
//  server.js — Main entry point
//  Starts the Express server and registers
//  all route files
// ─────────────────────────────────────────

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ───────────────────────────
app.use(cors());            // allows requests from any origin (frontend etc.)
app.use(express.json());    // parses incoming JSON body in requests

// ── Routes ──────────────────────────────
app.use('/api',              require('./routes/auth'));
app.use('/api/patients',     require('./routes/patients'));
app.use('/api/doctors',      require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/admin',        require('./routes/admin'));

// ── Root route (health check) ────────────
app.get('/', (req, res) => {
  res.json({ message: 'Hospital Management System API is running.' });
});

// ── Start server ─────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
