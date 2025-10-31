import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CContainer,
  CFormInput,
  CButton,
  CToaster,
  CToast,
  CToastBody,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilCheck, cilX } from '@coreui/icons'

const Profile = () => {
  const navigate = useNavigate()
  const { token, user: userId } = useSelector((state) => state)

  const [userDetails, setUserDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })

  const API_URL = 'http://localhost:5000/api/auth/user'

  // Toast helper
  const showToast = (message, color = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, color }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }

  // Fetch user details
  const fetchUser = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUserDetails(res.data.user)
      setFormData({
        firstName: res.data.user.firstName,
        lastName: res.data.user.lastName,
        email: res.data.user.email,
      })
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to fetch user', 'danger')
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [userId, token])

  // Handle update submission
  const handleUpdate = async () => {
    try {
      const res = await axios.put(`${API_URL}/${userId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUserDetails(res.data.user)
      showToast('Profile updated successfully')
      setEditMode(false)
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.message || 'Failed to update profile', 'danger')
    }
  }

  if (loading && !userDetails) return <p className="text-center mt-5">Loading profile...</p>
  if (!userDetails) return <p className="text-center mt-5">No user details found</p>

  return (
    <>
      {/* Toasts */}
      <CToaster className="position-fixed top-0 end-0 p-3">
        {toasts.map((t) => (
          <CToast key={t.id} visible autohide delay={3000} color={t.color}>
            <CToastBody>{t.message}</CToastBody>
          </CToast>
        ))}
      </CToaster>

      {/* Profile Card */}
      <CContainer className="mt-4">
        <CCard className="shadow-sm rounded-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Profile</strong>
            <CButton color="light" size="sm" onClick={() => setEditMode((prev) => !prev)}>
              <CIcon icon={editMode ? cilX : cilPencil} />
            </CButton>
          </CCardHeader>
          <CCardBody>
            <div className="mb-2">
              <strong>First Name:</strong>{' '}
              {editMode ? (
                <CFormInput
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              ) : (
                userDetails.firstName
              )}
            </div>
            <div className="mb-2">
              <strong>Last Name:</strong>{' '}
              {editMode ? (
                <CFormInput
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              ) : (
                userDetails.lastName
              )}
            </div>
            <div className="mb-2">
              <strong>Email:</strong>{' '}
              {editMode ? (
                <CFormInput
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              ) : (
                userDetails.email
              )}
            </div>

            {editMode && (
              <CButton color="primary" onClick={handleUpdate}>
                <CIcon icon={cilCheck} /> Save Changes
              </CButton>
            )}

            <CButton color="secondary" className="ms-2" onClick={() => navigate(-1)}>
              Back
            </CButton>
          </CCardBody>
        </CCard>
      </CContainer>
    </>
  )
}

export default Profile
