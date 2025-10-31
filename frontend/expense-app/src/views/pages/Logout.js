import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  CModal,
  CModalHeader,
  CModalBody,
  CModalFooter,
  CButton,
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
} from '@coreui/react'

const LogoutPopup = () => {
  const [visible, setVisible] = useState(true) // 👈 show popup immediately
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch({ type: 'logout' }) // clear redux + localStorage
    setVisible(false)
    navigate('/login') // redirect to login
  }

  const handleCancel = () => {
    setVisible(false)
    navigate(-1) // 👈 go back to previous page if user cancels
  }

  return (
    <CContainer
      fluid
      className="d-flex align-items-center justify-content-center min-vh-100 bg-light"
    >
      <CRow className="justify-content-center w-100 px-3">
        <CCol md={8} lg={6}>
          <CCard className="shadow-lg p-5 rounded-4 border-0 text-center">
            <CCardBody>
              <CCardTitle className="fw-bold fs-3 mb-4 text-primary">
                Logout Confirmation
              </CCardTitle>
              <p className="text-muted fs-6 mb-5">
                Are you sure you want to log out from your account?
              </p>
              <div className="d-flex justify-content-center gap-3">
                <CButton color="secondary" variant="outline" onClick={handleCancel}>
                  Cancel
                </CButton>
                <CButton color="danger" onClick={handleLogout}>
                  Yes, Logout
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default LogoutPopup
