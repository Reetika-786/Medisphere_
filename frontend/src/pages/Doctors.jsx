import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const SPECIALITIES = [
  "Cardiologist",
  "Neurologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "Dermatologist"
]

// Icon map for specialities
const SPEC_ICONS = {
  "Cardiologist":       "🫀",
  "Neurologist":        "🧠",
  "Orthopedic Surgeon": "🦴",
  "Pediatrician":       "👶",
  "Dermatologist":      "🩺",
}

// Gradient map for doctor cards (cycles through)
const CARD_GRADIENTS = [
  "from-teal-50 to-cyan-50",
  "from-blue-50 to-teal-50",
  "from-emerald-50 to-teal-50",
  "from-cyan-50 to-sky-50",
  "from-teal-50 to-emerald-50",
]

const Doctors = () => {
  const { speciality } = useParams()
  const navigate       = useNavigate()

  const [doctors,    setDoctors]    = useState([])
  const [filterDoc,  setFilterDoc]  = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [loading,    setLoading]    = useState(true)

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true)
        const res  = await fetch(`${backendUrl}/api/doctor/list`)
        const data = await res.json()
        setDoctors(data.doctors || [])
      } catch (error) {
        console.log("Error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  useEffect(() => {
    if (!speciality) {
      setFilterDoc(doctors)
    } else {
      setFilterDoc(
        doctors.filter(doc =>
          doc.specialization?.toLowerCase() === speciality.toLowerCase()
        )
      )
    }
  }, [doctors, speciality])

  return (
    <div className='min-h-screen bg-gray-50'>

      {/* ── PAGE HEADER ── */}
      <div className='bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-10 mb-8 rounded-2xl mx-0'>
        <p className='text-white/80 text-sm font-medium tracking-widest uppercase mb-1'>Medisphere</p>
        <h1 className='text-white text-3xl font-bold'>Find a Doctor</h1>
        <p className='text-white/70 mt-1 text-sm'>
          {filterDoc.length} doctor{filterDoc.length !== 1 ? 's' : ''} available
          {speciality ? ` · ${speciality}` : ' · All specializations'}
        </p>
      </div>

      <div className='flex flex-col sm:flex-row gap-6'>

        {/* ── SIDEBAR FILTER ── */}
        <div className='sm:w-56 flex-shrink-0'>

          {/* Mobile toggle */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className='w-full sm:hidden flex items-center justify-between py-2 px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 mb-3 shadow-sm'
          >
            <span>Filter by Speciality</span>
            <span className='text-teal-500'>{showFilter ? '▲' : '▼'}</span>
          </button>

          <div className={`${showFilter ? 'flex' : 'hidden sm:flex'} flex-col gap-2`}>

            {/* All Doctors */}
            <button
              onClick={() => navigate('/doctors')}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${!speciality
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-600'
                }`}
            >
              🏥 All Doctors
            </button>

            {SPECIALITIES.map((item, i) => (
              <button
                key={i}
                onClick={() =>
                  speciality === item
                    ? navigate('/doctors')
                    : navigate(`/doctors/${item}`)
                }
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${speciality === item
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-600'
                  }`}
              >
                {SPEC_ICONS[item] || '🩺'} {item}
              </button>
            ))}
          </div>
        </div>

        {/* ── DOCTOR GRID ── */}
        <div className='flex-1'>

          {loading ? (
            /* Skeleton loading */
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {[...Array(6)].map((_, i) => (
                <div key={i} className='bg-white rounded-2xl p-5 animate-pulse'>
                  <div className='w-16 h-16 bg-gray-200 rounded-full mb-4' />
                  <div className='h-4 bg-gray-200 rounded w-3/4 mb-2' />
                  <div className='h-3 bg-gray-100 rounded w-1/2 mb-4' />
                  <div className='h-8 bg-gray-100 rounded-xl' />
                </div>
              ))}
            </div>
          ) : filterDoc.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-20 text-center'>
              <p className='text-5xl mb-4'>🔍</p>
              <p className='text-gray-500 text-lg font-medium'>No doctors found</p>
              <p className='text-gray-400 text-sm mt-1'>Try a different specialization</p>
              <button
                onClick={() => navigate('/doctors')}
                className='mt-4 px-6 py-2 bg-teal-500 text-white rounded-full text-sm hover:bg-teal-600 transition-colors'
              >
                View all doctors
              </button>
            </div>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {filterDoc.map((doc, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/appointment/${doc.id || doc.doctor_id}`)}
                  className={`bg-gradient-to-br ${CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
                    border border-white rounded-2xl p-5 cursor-pointer
                    hover:shadow-lg hover:shadow-teal-100 hover:-translate-y-1
                    transition-all duration-200 group relative overflow-hidden`}
                >

                  {/* Background decoration */}
                  <div className='absolute top-0 right-0 w-24 h-24 bg-teal-400/10 rounded-full -mr-8 -mt-8' />

                  {/* Avatar */}
                  <div className='w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500
                    flex items-center justify-center text-white text-xl font-bold mb-4 shadow-md flex-shrink-0'>
                    {doc.image_url
                      ? <img src={doc.image_url} alt={doc.doctor_name} className='w-14 h-14 rounded-full object-cover' />
                      : (doc.doctor_name || doc.name || '?')[0].toUpperCase()
                    }
                  </div>

                  {/* Available badge */}
                  <div className='absolute top-4 right-4 flex items-center gap-1'>
                    <span className='w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse' />
                    <span className='text-xs text-green-600 font-medium'>Available</span>
                  </div>

                  {/* Info */}
                  <h3 className='font-bold text-gray-800 text-base leading-tight group-hover:text-teal-700 transition-colors'>
                    {doc.doctor_name || doc.name}
                  </h3>

                  <p className='text-teal-600 text-xs font-semibold mt-0.5 uppercase tracking-wide'>
                    {SPEC_ICONS[doc.specialization] || '🩺'} {doc.specialization}
                  </p>

                  {doc.dept_name && (
                    <p className='text-gray-400 text-xs mt-0.5'>{doc.dept_name}</p>
                  )}

                  {doc.experience_yrs > 0 && (
                    <p className='text-gray-500 text-xs mt-1'>
                      ⏱ {doc.experience_yrs} yr{doc.experience_yrs !== 1 ? 's' : ''} experience
                    </p>
                  )}

                  {/* Divider */}
                  <div className='border-t border-gray-200 my-3' />

                  {/* Footer */}
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-xs text-gray-400'>Consultation fee</p>
                      <p className='text-teal-600 font-bold text-base'>₹{doc.fee}</p>
                    </div>
                    <button className='px-4 py-1.5 bg-teal-500 text-white text-xs font-semibold
                      rounded-full hover:bg-teal-600 transition-colors shadow-sm shadow-teal-200'>
                      Book Now
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Doctors
