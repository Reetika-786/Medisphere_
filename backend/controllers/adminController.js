import jwt from "jsonwebtoken"
import db from "../config/mysql.js"

// =========================
// ADMIN LOGIN
// =========================
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body

        if (
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
        ) {
            const token = jwt.sign(
                { role: 'admin', email },
                process.env.JWT_SECRET
            )
            return res.json({ success: true, token })
        }

        res.json({ success: false, message: "Invalid credentials" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// =========================
// ALL APPOINTMENTS
// =========================
const appointmentsAdmin = async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM vw_all_appointments ORDER BY appointment_date DESC"
        )
        res.json({ success: true, appointments: rows })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// =========================
// CANCEL APPOINTMENT
// =========================
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body

        await db.query(
            `UPDATE appointments
             SET status = 'Cancelled', cancelled_at = NOW(),
                 cancel_reason = 'Cancelled by admin'
             WHERE appointment_id = ?`,
            [appointmentId]
        )

        res.json({ success: true, message: "Appointment Cancelled" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// =========================
// ADD DOCTOR
// =========================
const addDoctor = async (req, res) => {
    try {
        const {
            name, email, password, specialization,
            dept_id, phone, experience_yrs,
            available_from, available_to, fee
        } = req.body

        if (!name || !email || !password || !specialization) {
            return res.json({ success: false, message: "Missing required fields" })
        }

        // Check email not already used
        const [existing] = await db.query(
            "SELECT user_id FROM users WHERE email = ?",
            [email]
        )
        if (existing.length > 0) {
            return res.json({ success: false, message: "Email already registered" })
        }

        // Insert into users
        const [userResult] = await db.query(
            "INSERT INTO users (email, password, role) VALUES (?, ?, 'doctor')",
            [email, password]
        )
        const newUserId = userResult.insertId

        // Insert into doctors
        await db.query(
            `INSERT INTO doctors
             (user_id, full_name, specialization, dept_id, phone,
              experience_yrs, available_from, available_to, fee)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newUserId, name, specialization,
                dept_id || null, phone || null,
                experience_yrs || 0,
                available_from || '09:00:00',
                available_to || '17:00:00',
                fee || 500.00
            ]
        )

        res.json({ success: true, message: "Doctor Added Successfully" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// =========================
// ALL DOCTORS
// =========================
const allDoctors = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM vw_doctor_list")
        res.json({ success: true, doctors: rows })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// =========================
// ADMIN DASHBOARD
// =========================
const adminDashboard = async (req, res) => {
    try {
        const [[summary]] = await db.query("SELECT * FROM vw_admin_dashboard")

        const [latestAppointments] = await db.query(
            `SELECT * FROM vw_all_appointments
             ORDER BY booked_at DESC LIMIT 5`
        )

        res.json({
            success: true,
            dashData: {
                doctors: summary.total_doctors,
                patients: summary.total_patients,
                appointments: summary.total_appointments,
                pending: summary.pending,
                confirmed: summary.confirmed,
                completed: summary.completed,
                cancelled: summary.cancelled,
                latestAppointments
            }
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// =========================
// DEACTIVATE / REACTIVATE USER
// =========================
const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.body

        await db.query(
            "UPDATE users SET is_active = NOT is_active WHERE user_id = ?",
            [userId]
        )

        res.json({ success: true, message: "User status updated" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// =========================
// ALL DEPARTMENTS
// =========================
const allDepartments = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM departments")
        res.json({ success: true, departments: rows })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    toggleUserStatus,
    allDepartments
}