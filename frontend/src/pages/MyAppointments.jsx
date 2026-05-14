import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyAppointments = () => {

    const { backendUrl, token } = useContext(AppContext)
    const navigate = useNavigate()

    const [appointments, setAppointments] = useState([])

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const authHeader = { headers: { token } }

    const getUserAppointments = async () => {
        try {
            const { data } = await axios.get(
                backendUrl + '/api/user/appointments',
                authHeader
            )
            setAppointments((data.appointments || []).reverse())
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/user/cancel-appointment',
                { appointment_id: appointmentId },
                authHeader
            )
            if (data.success) {
                toast.success(data.message)
                getUserAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (token) getUserAppointments()
    }, [token])

    return (
        <div>
            <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
            <div>
                {appointments.length === 0 && (
                    <p className='text-gray-500 mt-6 text-sm'>No appointments found.</p>
                )}
                {appointments.map((item, index) => (
                    <div key={item.appointment_id || index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>

                        <div>
                            <img
                                className='w-36 bg-[#EAEFFF]'
                                src={item.doctor_image || ''}
                                alt=""
                            />
                        </div>

                        <div className='flex-1 text-sm text-[#5E5E5E]'>
                            <p className='text-[#262626] text-base font-semibold'>{item.doctor_name}</p>
                            <p>{item.specialization}</p>
                            <p className='text-[#464646] font-medium mt-1'>Address:</p>
                            <p>{item.address_line1 || '-'}</p>
                            <p className='mt-1'>
                                <span className='text-sm text-[#3C3C3C] font-medium'>Date & Time: </span>
                                {formatDate(item.appointment_date)} | {item.appointment_time}
                            </p>
                            {item.reason && (
                                <p className='mt-1'>
                                    <span className='text-sm text-[#3C3C3C] font-medium'>Reason: </span>
                                    {item.reason}
                                </p>
                            )}
                        </div>

                        <div></div>

                        <div className='flex flex-col gap-2 justify-end text-sm text-center'>

                            {item.status === 'Completed' &&
                                <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>
                                    Completed
                                </button>
                            }

                            {item.status === 'Cancelled' &&
                                <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>
                                    Appointment Cancelled
                                </button>
                            }

                            {item.status !== 'Cancelled' && item.status !== 'Completed' &&
                                <button
                                    onClick={() => cancelAppointment(item.appointment_id)}
                                    className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'
                                >
                                    Cancel appointment
                                </button>
                            }

                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MyAppointments
