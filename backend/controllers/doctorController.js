import jwt from "jsonwebtoken"
import db from "../config/mysql.js"

// ===============================
// DOCTOR LOGIN
// ===============================
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body

        const [rows] = await db.query(
            `SELECT u.user_id, u.email, u.role, d.doctor_id
             FROM users u
             JOIN doctors d ON u.user_id = d.user_id
             WHERE u.email = ? AND u.password = ?
             AND u.role = 'doctor' AND u.is_active = 1`,
            [email, password]
        )

        if (rows.length === 0) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const user = rows[0]
        const token = jwt.sign(
            { id: user.user_id, role: user.role, doctor_id: user.doctor_id },
            process.env.JWT_SECRET
        )

        return res.json({ success: true, token })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ===============================
// DOCTOR LIST (public - for patients to browse)
// ===============================
const doctorList = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM vw_doctor_list")

        const doctors = rows.map(doc => ({
            id:             doc.doctor_id,
            name:           doc.doctor_name,
            image:          doc.image_url || '',
            speciality:     doc.specialization,
            specialization: doc.specialization,
            degree:         'MBBS',
            experience:     doc.experience_yrs + ' Years',
            fee:            doc.fee,
            fees:           doc.fee,
            address_line1:  '',
            address_line2:  '',
            available:      true,
            about:          doc.about || ''
        }))

        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ===============================
// DOCTOR DASHBOARD
// ===============================
const doctorDashboard = async (req, res) => {
    try {
        const userId = req.doctorId  // set by authDoctor middleware (user_id)

        // Get doctor_id from user_id
        const [docRows] = await db.query(
            "SELECT doctor_id, fee FROM doctors WHERE user_id = ?",
            [userId]
        )
        if (docRows.length === 0) {
            return res.json({ success: false, message: "Doctor not found" })
        }
        const { doctor_id, fee } = docRows[0]

        // Get all appointments for this doctor
        const [appointments] = await db.query(
            `SELECT a.*, p.full_name AS patient_name, p.gender, p.blood_group
             FROM appointments a
             JOIN patients p ON a.patient_id = p.patient_id
             WHERE a.doctor_id = ?
             ORDER BY a.appointment_date DESC`,
            [doctor_id]
        )

        // Count unique patients
        const uniquePatients = new Set(appointments.map(a => a.patient_id)).size

        // Earnings = fee * completed appointments
        const completed = appointments.filter(a => a.status === 'Completed').length
        const earnings = completed * fee

        res.json({
            success: true,
            dashData: {
                earnings,
                appointments: appointments.length,
                patients: uniquePatients,
                latestAppointments: appointments.slice(0, 5)
            }
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ===============================
// CHANGE AVAILABILITY
// ===============================
const changeAvailablity = async (req, res) => {
    try {
        const userId = req.doctorId

        const [docRows] = await db.query(
            "SELECT doctor_id FROM doctors WHERE user_id = ?",
            [userId]
        )
        if (docRows.length === 0) {
            return res.json({ success: false, message: "Doctor not found" })
        }

        // Toggle is_active in users table
        await db.query(
            `UPDATE users SET is_active = NOT is_active WHERE user_id = ?`,
            [userId]
        )

        res.json({ success: true, message: "Availability Updated" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ===============================
// DOCTOR PROFILE
// ===============================
const doctorProfile = async (req, res) => {
    try {
        const userId = req.doctorId

        const [rows] = await db.query(
            `SELECT d.*, dep.dept_name, u.email, u.is_active
             FROM doctors d
             LEFT JOIN departments dep ON d.dept_id = dep.dept_id
             JOIN users u ON d.user_id = u.user_id
             WHERE d.user_id = ?`,
            [userId]
        )

        if (rows.length === 0) {
            return res.json({ success: false, message: "Doctor not found" })
        }

        res.json({ success: true, profileData: rows[0] })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ===============================
// UPDATE DOCTOR PROFILE
// ===============================
const updateDoctorProfile = async (req, res) => {
    try {
        const userId = req.doctorId
        const { fee, phone, available_from, available_to } = req.body

        await db.query(
            `UPDATE doctors
             SET fee = ?, phone = ?, available_from = ?, available_to = ?
             WHERE user_id = ?`,
            [fee, phone, available_from, available_to, userId]
        )

        res.json({ success: true, message: "Profile Updated" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ===============================
// DOCTOR APPOINTMENTS
// ===============================
const appointmentsDoctor = async (req, res) => {
    try {
        const userId = req.doctorId

        const [docRows] = await db.query(
            "SELECT doctor_id FROM doctors WHERE user_id = ?",
            [userId]
        )
        if (docRows.length === 0) {
            return res.json({ success: false, message: "Doctor not found" })
        }
        const doctor_id = docRows[0].doctor_id

        const [rows] = await db.query(
            `SELECT a.*, p.full_name AS patient_name, p.gender,
                    p.blood_group, p.phone AS patient_phone, p.date_of_birth
             FROM appointments a
             JOIN patients p ON a.patient_id = p.patient_id
             WHERE a.doctor_id = ?
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
            [doctor_id]
        )

        res.json({ success: true, appointments: rows })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ===============================
// CANCEL APPOINTMENT (by doctor)
// ===============================
const appointmentCancel = async (req, res) => {
    try {
        const userId = req.doctorId
        const { appointmentId } = req.body

        const [docRows] = await db.query(
            "SELECT doctor_id FROM doctors WHERE user_id = ?",
            [userId]
        )
        const doctor_id = docRows[0].doctor_id

        await db.query(
            `UPDATE appointments
             SET status = 'Cancelled', cancelled_at = NOW(),
                 cancel_reason = 'Cancelled by doctor'
             WHERE appointment_id = ? AND doctor_id = ?`,
            [appointmentId, doctor_id]
        )

        res.json({ success: true, message: "Appointment Cancelled" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// ===============================
// COMPLETE APPOINTMENT
// ===============================
const appointmentComplete = async (req, res) => {
    try {
        const userId = req.doctorId
        const { appointmentId, doctor_notes } = req.body

        const [docRows] = await db.query(
            "SELECT doctor_id FROM doctors WHERE user_id = ?",
            [userId]
        )
        const doctor_id = docRows[0].doctor_id

        await db.query(
            `UPDATE appointments
             SET status = 'Completed', doctor_notes = ?
             WHERE appointment_id = ? AND doctor_id = ?`,
            [doctor_notes || null, appointmentId, doctor_id]
        )

        res.json({ success: true, message: "Appointment Completed" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginDoctor,
    doctorList,
    doctorDashboard,
    changeAvailablity,
    doctorProfile,
    updateDoctorProfile,
    appointmentsDoctor,
    appointmentCancel,
    appointmentComplete
}