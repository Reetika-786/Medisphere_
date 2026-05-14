import jwt from "jsonwebtoken";
import db from "../config/mysql.js";

// =============================
// REGISTER USER
// =============================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const selectedRole = role || 'patient'; // ✅ FIX: use role from body

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // Check if email already exists
    const [existing] = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );
    if (existing.length > 0) {
      return res.json({ success: false, message: "Email already registered" });
    }

    // Insert into users with correct role
    const [userResult] = await db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, password, selectedRole]  // ✅ FIX: was hardcoded 'patient'
    );
    const newUserId = userResult.insertId;

    // Insert into correct role table
    if (selectedRole === 'doctor') {
      await db.query(
        "INSERT INTO doctors (user_id, full_name) VALUES (?, ?)",
        [newUserId, name]
      );
    } else if (selectedRole === 'patient') {
      await db.query(
        "INSERT INTO patients (user_id, full_name) VALUES (?, ?)",
        [newUserId, name]
      );
    }
    // admin: no separate table row needed

    const token = jwt.sign(
      { id: newUserId, role: selectedRole },
      process.env.JWT_SECRET
    );

    // ✅ FIX: return role so frontend can redirect correctly
    return res.json({ success: true, token, role: selectedRole });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// =============================
// LOGIN USER
// =============================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const [rows] = await db.query(
      `SELECT user_id, email, role, is_active
       FROM users
       WHERE email = ? AND password = ? AND is_active = 1`,
      [email, password]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }

    const user = rows[0];

    // ✅ FIX: removed role !== 'patient' block — any role can login
    // Frontend handles redirect based on role returned

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET
    );

    // ✅ FIX: return role so frontend can redirect to correct portal
    return res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// =============================
// GET PROFILE
// =============================
const getProfile = async (req, res) => {
  try {
    const userId = req.userId; // set by authUser middleware

    const [rows] = await db.query(
      `SELECT p.patient_id, p.full_name, p.date_of_birth, p.gender,
              p.phone, p.address, p.blood_group, p.emergency_contact,
              u.email
       FROM patients p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Profile not found" });
    }

    return res.json({ success: true, userData: rows[0] });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// =============================
// UPDATE PROFILE
// =============================
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { full_name, date_of_birth, gender, phone, address, blood_group, emergency_contact } = req.body;

    await db.query(
      `UPDATE patients
       SET full_name = ?, date_of_birth = ?, gender = ?,
           phone = ?, address = ?, blood_group = ?, emergency_contact = ?
       WHERE user_id = ?`,
      [full_name, date_of_birth, gender, phone, address, blood_group, emergency_contact, userId]
    );

    return res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// =============================
// BOOK APPOINTMENT
// =============================
const bookAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // Get patient_id from user_id
    const [patientRows] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [userId]
    );
    if (patientRows.length === 0) {
      return res.json({ success: false, message: "Patient not found" });
    }
    const patient_id = patientRows[0].patient_id;

    // Check doctor exists and is active
    const [doctorRows] = await db.query(
      `SELECT d.doctor_id, d.available_from, d.available_to
       FROM doctors d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.doctor_id = ? AND u.is_active = 1`,
      [doctor_id]
    );
    if (doctorRows.length === 0) {
      return res.json({ success: false, message: "Doctor not available" });
    }

    // Check for slot conflict
    const [conflict] = await db.query(
      `SELECT appointment_id FROM appointments
       WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
       AND status NOT IN ('Cancelled')`,
      [doctor_id, appointment_date, appointment_time]
    );
    if (conflict.length > 0) {
      return res.json({ success: false, message: "Slot already booked" });
    }

    // Book it
    await db.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [patient_id, doctor_id, appointment_date, appointment_time, reason || null]
    );

    return res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// =============================
// LIST MY APPOINTMENTS
// =============================
const listAppointment = async (req, res) => {
  try {
    const userId = req.userId;

    const [patientRows] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [userId]
    );
    if (patientRows.length === 0) {
      return res.json({ success: false, message: "Patient not found" });
    }
    const patient_id = patientRows[0].patient_id;

    const [rows] = await db.query(
      "SELECT * FROM vw_patient_history WHERE patient_id = ? ORDER BY appointment_date DESC",
      [patient_id]
    );

    return res.json({ success: true, appointments: rows });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// =============================
// CANCEL APPOINTMENT
// =============================
const cancelAppointment = async (req, res) => {
  try {
    const userId = req.userId;
    const { appointment_id, cancel_reason } = req.body;

    const [patientRows] = await db.query(
      "SELECT patient_id FROM patients WHERE user_id = ?",
      [userId]
    );
    if (patientRows.length === 0) {
      return res.json({ success: false, message: "Patient not found" });
    }
    const patient_id = patientRows[0].patient_id;

    const [appt] = await db.query(
      "SELECT status FROM appointments WHERE appointment_id = ? AND patient_id = ?",
      [appointment_id, patient_id]
    );
    if (appt.length === 0) {
      return res.json({ success: false, message: "Appointment not found" });
    }
    if (appt[0].status === "Completed" || appt[0].status === "Cancelled") {
      return res.json({ success: false, message: "Cannot cancel this appointment" });
    }

    await db.query(
      `UPDATE appointments
       SET status = 'Cancelled', cancelled_at = NOW(), cancel_reason = ?
       WHERE appointment_id = ? AND patient_id = ?`,
      [cancel_reason || "Cancelled by patient", appointment_id, patient_id]
    );

    return res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
};