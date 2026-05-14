import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {

    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage]   = useState(false)

    const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)

    // ✅ FIX: use plain { token } header — matches authUser middleware (req.headers.token)
    // was: { Authorization: `Bearer ${token}` } which middleware doesn't read
    const authHeader = { headers: { token } }

    const updateUserProfileData = async () => {
        try {
            const updateData = {
                full_name:         userData.full_name,
                phone:             userData.phone,
                address:           userData.address,
                gender:            userData.gender,
                date_of_birth:     userData.date_of_birth,
                blood_group:       userData.blood_group,
                emergency_contact: userData.emergency_contact,
            }

            const { data } = await axios.post(
                backendUrl + '/api/user/update-profile',
                updateData,
                authHeader
            )

            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    return userData ? (
        <div className='max-w-lg flex flex-col gap-2 text-sm pt-5'>

            {/* Profile image */}
            {isEdit
                ? <label htmlFor='image'>
                    <div className='inline-block relative cursor-pointer'>
                        <img
                            className='w-36 rounded opacity-75'
                            src={image ? URL.createObjectURL(image) : userData.image}
                            alt=""
                        />
                        <img
                            className='w-10 absolute bottom-12 right-12'
                            src={image ? '' : assets.upload_icon}
                            alt=""
                        />
                    </div>
                    <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                  </label>
                : <img className='w-36 rounded' src={userData.image} alt="" />
            }

            {/* Name */}
            {isEdit
                ? <input
                    className='bg-gray-50 text-3xl font-medium max-w-60'
                    type="text"
                    onChange={(e) => setUserData(prev => ({ ...prev, full_name: e.target.value }))}
                    value={userData.full_name || ''}
                  />
                : <p className='font-medium text-3xl text-[#262626] mt-4'>{userData.full_name}</p>
            }

            <hr className='bg-[#ADADAD] h-[1px] border-none' />

            {/* Contact info */}
            <div>
                <p className='text-gray-600 underline mt-3'>CONTACT INFORMATION</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-[#363636]'>

                    <p className='font-medium'>Email id:</p>
                    <p className='text-blue-500'>{userData.email}</p>

                    <p className='font-medium'>Phone:</p>
                    {isEdit
                        ? <input
                            className='bg-gray-50 max-w-52'
                            type="text"
                            onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                            value={userData.phone || ''}
                          />
                        : <p className='text-blue-500'>{userData.phone}</p>
                    }

                    <p className='font-medium'>Address:</p>
                    {isEdit
                        ? <input
                            className='bg-gray-50'
                            type="text"
                            placeholder='Address'
                            onChange={(e) => setUserData(prev => ({ ...prev, address: e.target.value }))}
                            value={userData.address || ''}
                          />
                        : <p className='text-gray-500'>{userData.address}</p>
                    }

                </div>
            </div>

            {/* Basic info */}
            <div>
                <p className='text-[#797979] underline mt-3'>BASIC INFORMATION</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-gray-600'>

                    <p className='font-medium'>Gender:</p>
                    {isEdit
                        ? <select
                            className='max-w-20 bg-gray-50'
                            onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
                            value={userData.gender || 'Not Selected'}
                          >
                            <option value="Not Selected">Not Selected</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        : <p className='text-gray-500'>{userData.gender}</p>
                    }

                    <p className='font-medium'>Birthday:</p>
                    {isEdit
                        ? <input
                            className='max-w-28 bg-gray-50'
                            type='date'
                            onChange={(e) => setUserData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                            value={userData.date_of_birth || ''}
                          />
                        : <p className='text-gray-500'>{userData.date_of_birth}</p>
                    }

                    <p className='font-medium'>Blood Group:</p>
                    {isEdit
                        ? <input
                            className='bg-gray-50 max-w-20'
                            type="text"
                            placeholder='e.g. A+'
                            onChange={(e) => setUserData(prev => ({ ...prev, blood_group: e.target.value }))}
                            value={userData.blood_group || ''}
                          />
                        : <p className='text-gray-500'>{userData.blood_group}</p>
                    }

                </div>
            </div>

            <div className='mt-10'>
                {isEdit
                    ? <button
                        onClick={updateUserProfileData}
                        className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
                      >Save information</button>
                    : <button
                        onClick={() => setIsEdit(true)}
                        className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
                      >Edit</button>
                }
            </div>

        </div>
    ) : null
}

export default MyProfile
