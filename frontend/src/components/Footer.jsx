import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <div className='bg-gray-50 border-t border-gray-200 mt-20'>
      <div className='md:mx-10 px-4'>

        {/* Main footer content */}
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr_1fr] gap-10 py-12 text-sm'>

          {/* Brand section */}
          <div>
            <div className='flex items-center gap-2 mb-4'>
              <div className='w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>M</span>
              </div>
              <span className='text-xl font-bold text-gray-800'>Medisphere</span>
            </div>
            <p className='w-full md:w-4/5 text-gray-500 leading-6'>
              Delivering trusted medical care, expert advice, and compassionate support for every stage of life. Healthcare accessible, reliable, and patient-focused.
            </p>
            {/* Social icons */}
            <div className='flex gap-3 mt-5'>
              <a href='#' className='w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center hover:bg-teal-500 hover:text-white text-teal-600 transition-colors text-xs font-bold'>f</a>
              <a href='#' className='w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center hover:bg-teal-500 hover:text-white text-teal-600 transition-colors text-xs font-bold'>in</a>
              <a href='#' className='w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center hover:bg-teal-500 hover:text-white text-teal-600 transition-colors text-xs font-bold'>tw</a>
            </div>
          </div>

          {/* Company links */}
          <div>
            <p className='text-gray-800 font-semibold mb-4 uppercase tracking-wider text-xs'>Company</p>
            <ul className='flex flex-col gap-2.5 text-gray-500'>
              <li><Link to='/' className='hover:text-teal-500 transition-colors'>Home</Link></li>
              <li><Link to='/about' className='hover:text-teal-500 transition-colors'>About Us</Link></li>
              <li><Link to='/doctors' className='hover:text-teal-500 transition-colors'>All Doctors</Link></li>
              <li><Link to='/contact' className='hover:text-teal-500 transition-colors'>Contact</Link></li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <p className='text-gray-800 font-semibold mb-4 uppercase tracking-wider text-xs'>Quick Links</p>
            <ul className='flex flex-col gap-2.5 text-gray-500'>
              <li><Link to='/login' className='hover:text-teal-500 transition-colors'>Patient Login</Link></li>
              <li><Link to='/my-appointments' className='hover:text-teal-500 transition-colors'>My Appointments</Link></li>
              <li><Link to='/my-profile' className='hover:text-teal-500 transition-colors'>My Profile</Link></li>
              <li><a href='#' className='hover:text-teal-500 transition-colors'>Privacy Policy</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className='text-gray-800 font-semibold mb-4 uppercase tracking-wider text-xs'>Get In Touch</p>
            <ul className='flex flex-col gap-2.5 text-gray-500'>
              <li className='flex items-center gap-2'>
                <span className='text-teal-500'>📞</span>
                +91-998-877-6655
              </li>
              <li className='flex items-center gap-2'>
                <span className='text-teal-500'>✉️</span>
                medisphere@gmail.com
              </li>
              <li className='flex items-center gap-2'>
                <span className='text-teal-500'>📍</span>
                New Delhi, India
              </li>
              <li className='flex items-center gap-2'>
                <span className='text-teal-500'>🕐</span>
                Mon–Sat, 9am–6pm
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className='border-t border-gray-200'>
          <div className='flex flex-col sm:flex-row items-center justify-between py-5 gap-2'>
            <p className='text-sm text-gray-400'>
              Copyright 2024 © Medisphere.com — All Rights Reserved.
            </p>
            <div className='flex gap-4 text-xs text-gray-400'>
              <a href='#' className='hover:text-teal-500 transition-colors'>Privacy Policy</a>
              <span>·</span>
              <a href='#' className='hover:text-teal-500 transition-colors'>Terms of Service</a>
              <span>·</span>
              <a href='#' className='hover:text-teal-500 transition-colors'>Sitemap</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Footer
