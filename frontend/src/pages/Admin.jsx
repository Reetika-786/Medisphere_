import React, { useEffect, useState } from "react";
import axios from "axios";

const Admin = () => {
  const [dashboard, setDashboard] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // CHANGED: use env variable instead of hardcoded localhost URL
  // (matches the pattern used in AppContext.jsx)
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // CHANGED: use Authorization Bearer header — standard for SQL/REST backends
  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // -----------------------------
  // FETCH ADMIN DASHBOARD
  // -----------------------------
  const fetchDashboard = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/admin/dashboard",
        authHeader
      );
      if (data.success) {
        setDashboard(data.dashData);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // -----------------------------
  // FETCH APPOINTMENTS
  // -----------------------------
  const fetchAppointments = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/admin/appointments",
        authHeader
      );
      if (data.success) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // -----------------------------
  // FETCH DOCTORS
  // -----------------------------
  const fetchDoctors = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/list"
      );
      if (data.success) {
        setDoctors(data.doctors);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchAppointments();
    fetchDoctors();
  }, []);

  return (
    <div className="p-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* STATS */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <div className="p-4 bg-blue-100 rounded">
            <p>Total Patients</p>
            {/* SQL column: users.total_patients (COUNT from users table) */}
            <h2 className="text-xl font-bold">{dashboard.total_patients}</h2>
          </div>

          <div className="p-4 bg-green-100 rounded">
            <p>Total Doctors</p>
            {/* SQL column: doctors.total_doctors (COUNT from doctors table) */}
            <h2 className="text-xl font-bold">{dashboard.total_doctors}</h2>
          </div>

          <div className="p-4 bg-yellow-100 rounded">
            <p>Appointments</p>
            {/* SQL column: appointments.total_appointments (COUNT from appointments table) */}
            <h2 className="text-xl font-bold">{dashboard.total_appointments}</h2>
          </div>

          <div className="p-4 bg-red-100 rounded">
            <p>Pending</p>
            {/* SQL column: appointments WHERE status = 'pending' */}
            <h2 className="text-xl font-bold">{dashboard.pending}</h2>
          </div>

        </div>
      )}

      {/* DOCTORS TABLE */}
      <h2 className="text-xl font-semibold mb-2">Doctors</h2>
      <div className="overflow-x-auto mb-6">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Name</th>
              <th className="p-2">Speciality</th>
              <th className="p-2">Fee</th>
              <th className="p-2">Availability</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc, i) => (
              <tr key={i} className="text-center border-t">
                {/* SQL columns: doctors.doctor_name, doctors.specialization, doctors.fee */}
                <td className="p-2">{doc.doctor_name}</td>
                <td className="p-2">{doc.specialization}</td>
                <td className="p-2">₹{doc.fee}</td>
                {/* SQL columns: doctors.available_from, doctors.available_to */}
                <td className="p-2">{doc.available_from} - {doc.available_to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* APPOINTMENTS */}
      <h2 className="text-xl font-semibold mb-2">Recent Appointments</h2>
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Patient</th>
              <th className="p-2">Doctor</th>
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((app, i) => (
              <tr key={i} className="text-center border-t">
                {/* SQL columns: appointments.patient_name (JOIN users), appointments.doctor_name (JOIN doctors) */}
                <td className="p-2">{app.patient_name}</td>
                <td className="p-2">{app.doctor_name}</td>
                {/* SQL column: appointments.appointment_date (DATE type) */}
                <td className="p-2">{app.appointment_date}</td>
                {/* SQL column: appointments.status (ENUM: 'pending','confirmed','cancelled') */}
                <td className="p-2">{app.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Admin;
