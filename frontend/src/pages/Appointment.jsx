import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'

const Appointment = () => {

    const { docId } = useParams()
    const {
        doctors,
        currencySymbol,
        backendUrl,
        token,
        getDoctosData
    } = useContext(AppContext)

    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const [docInfo, setDocInfo]   = useState(null)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime]   = useState('')

    const navigate = useNavigate()

    const fetchDocInfo = () => {
        const doc = doctors.find((d) => d.id === Number(docId))
        setDocInfo(doc || null)
    }

    const getAvailableSlots = () => {
        if (!docInfo) return
        setDocSlots([])

        let today = new Date()
        let slotsArray = []

        for (let i = 0; i < 7; i++) {
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            let endTime = new Date()
            endTime.setDate(today.getDate() + i)
            endTime.setHours(21, 0, 0, 0)

            if (today.getDate() === currentDate.getDate()) {
                currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
                currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
            } else {
                currentDate.setHours(10)
                currentDate.setMinutes(0)
            }

            let timeSlots = []
            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })
                timeSlots.push({
                    datetime: new Date(currentDate),
                    time: formattedTime
                })
                currentDate.setMinutes(currentDate.getMinutes() + 30)
            }

            slotsArray.push(timeSlots)
        }

        setDocSlots(slotsArray)
    }

    const bookAppointment = async () => {
        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        if (!docSlots.length || !docSlots[slotIndex]?.length) {
            toast.error("No slots selected")
            return
        }

        if (!slotTime) {
            toast.error("Please select a time slot")
            return
        }

        const date = docSlots[slotIndex][0].datetime

        // Format date as YYYY-MM-DD for SQL DATE column
        const year  = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day   = String(date.getDate()).padStart(2, '0')
        const appointment_date = `${year}-${month}-${day}`

        // Format time as HH:MM:00 for SQL TIME column
        const [timePart, meridiem] = slotTime.split(' ')
        let [hours, minutes] = timePart.split(':').map(Number)
        if (meridiem === 'PM' && hours !== 12) hours += 12
        if (meridiem === 'AM' && hours === 12) hours = 0
        const appointment_time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

        try {
            const { data } = await axios.post(
                backendUrl + '/api/user/book-appointment',
                {
                    doctor_id:        Number(docId),
                    appointment_date,
                    appointment_time,
                    reason: ''
                },
                // ✅ FIX: was Authorization: Bearer — now plain { token } to match authUser middleware
                { headers: { token } }
            )

            if (data.success) {
                toast.success(data.message)
                getDoctosData()
                navigate('/my-appointments')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error("Something went wrong")
        }
    }

    useEffect(() => {
        if (doctors.length > 0) fetchDocInfo()
    }, [doctors, docId])

    useEffect(() => {
        if (docInfo) getAvailableSlots()
    }, [docInfo])

    if (!docInfo) return null

    return (
        <div>

            {/* Doctor Info */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <img
                    className='bg-primary w-full sm:max-w-72 rounded-lg'
                    src={docInfo.image}
                    alt=""
                />
                <div className='flex-1 border rounded-lg p-8 bg-white mt-[-80px] sm:mt-0'>
                    <p className='flex items-center gap-2 text-3xl font-medium'>
                        {docInfo.name}
                        <img className='w-5' src={assets.verified_icon} alt="" />
                    </p>
                    <p className='text-gray-600 mt-1'>
                        {docInfo.degree} - {docInfo.specialization}
                    </p>
                    <p className='text-sm mt-3 text-gray-600'>{docInfo.about}</p>
                    <p className='mt-4 font-medium'>
                        Fee: {currencySymbol}{docInfo.fee}
                    </p>
                </div>
            </div>

            {/* Slots */}
            <div className='mt-8'>
                <p className='font-medium'>Booking Slots</p>

                {/* Days */}
                <div className='flex gap-3 mt-4 overflow-x-auto'>
                    {docSlots.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => setSlotIndex(index)}
                            className={`min-w-16 p-3 text-center rounded-full cursor-pointer
                            ${slotIndex === index ? 'bg-primary text-white' : 'border'}`}
                        >
                            <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                            <p>{item[0]?.datetime.getDate()}</p>
                        </div>
                    ))}
                </div>

                {/* Times */}
                <div className='flex gap-3 mt-4 overflow-x-auto'>
                    {docSlots[slotIndex]?.map((item, index) => (
                        <p
                            key={index}
                            onClick={() => setSlotTime(item.time)}
                            className={`px-4 py-2 border rounded-full cursor-pointer
                            ${slotTime === item.time ? 'bg-primary text-white' : ''}`}
                        >
                            {item.time}
                        </p>
                    ))}
                </div>

                <button
                    onClick={bookAppointment}
                    className='mt-6 bg-primary text-white px-10 py-3 rounded-full'
                >
                    Book Appointment
                </button>
            </div>

            <RelatedDoctors speciality={docInfo.specialization} docId={docInfo.id} />
        </div>
    )
}

export default Appointment
