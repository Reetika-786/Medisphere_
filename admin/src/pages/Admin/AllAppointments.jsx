import React, { useEffect, useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { assets } from '../../assets/assets'

const AllAppointments = () => {

  const { aToken, appointments, cancelAppointment, getAllAppointments } = useContext(AdminContext)

  useEffect(() => {
    if (aToken) getAllAppointments()
  }, [aToken])

  // Format SQL DATE → readable
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  // Calculate age from date_of_birth
  const calculateAge = (dob) => {
    if (!dob) return '—'
    return Math.floor((Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365.25))
  }

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>

        {/* Header */}
        <div className='hidden sm:grid grid-cols-[0.5fr_2fr_1fr_2fr_2fr_1fr_1fr] py-3 px-6 border-b bg-gray-50 font-medium text-gray-600'>
          <p>#</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Doctor</p>
          <p>Fees</p>
          <p>Action</p>
        </div>

        {appointments.length === 0 && (
          <p className='text-center text-gray-400 py-10'>No appointments found</p>
        )}

        {appointments.map((item, index) => (
          <div
            key={index}
            className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_2fr_1fr_2fr_2fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
          >
            <p className='max-sm:hidden'>{index + 1}</p>

            {/* ✅ SQL: patient_name instead of item.userData.name */}
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs flex-shrink-0'>
                {(item.patient_name || 'P')[0].toUpperCase()}
              </div>
              <p>{item.patient_name}</p>
            </div>

            {/* ✅ SQL: date_of_birth instead of item.userData.dob */}
            <p className='max-sm:hidden'>{calculateAge(item.date_of_birth)}</p>

            {/* ✅ SQL: appointment_date + appointment_time instead of slotDate + slotTime */}
            <p>{formatDate(item.appointment_date)}, {item.appointment_time}</p>

            {/* ✅ SQL: doctor_name instead of item.docData.name */}
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0'>
                {(item.doctor_name || 'D')[0].toUpperCase()}
              </div>
              <p>{item.doctor_name}</p>
            </div>

            {/* ✅ SQL: fee instead of item.amount */}
            <p>₹{item.fee || '—'}</p>

            {/* ✅ SQL: item.status instead of item.cancelled / item.isCompleted */}
            {item.status === 'Cancelled'
              ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
              : item.status === 'Completed'
                ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                : <img
                    onClick={() => cancelAppointment(item.appointment_id)}
                    className='w-10 cursor-pointer'
                    src={assets.cancel_icon}
                    alt="Cancel"
                  />
            }
          </div>
        ))}
      </div>
    </div>
  )
}

export default AllAppointments
