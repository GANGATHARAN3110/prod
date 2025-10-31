import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import axios from 'axios'
import { useDispatch } from 'react-redux'

const Login = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotMessage, setForgotMessage] = useState('')

  // ✅ Helper for basic email validation
  const isEmailValid = (email) => /\S+@\S+\.\S+/.test(email)

  // ✅ Login Handler
  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    if (!isEmailValid(email)) {
      setMessage('Please enter a valid email address')
      return
    }

    setLoading(true)
    console.log('🟢 Attempting login with:', { email })

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      })

      console.log('✅ Login successful:', res.data)

      // Dispatch user info to Redux
      dispatch({
        type: 'loginSuccess',
        token: res.data.token,
        user: res.data.user,
      })

      navigate('/')
    } catch (err) {
      console.error('❌ Login error:', err.response?.data || err.message)
      setMessage(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // ✅ Forgot Password Step 1: Request OTP
  const handleRequestOtp = async () => {
    if (!forgotEmail) return setForgotMessage('Email is required')
    try {
      console.log('📧 Requesting OTP for:', forgotEmail)
      await axios.post('http://localhost:5000/api/auth/request-otp', { email: forgotEmail })
      setForgotMessage('OTP sent to your email')
      setForgotStep(2)
    } catch (err) {
      console.error('❌ OTP request failed:', err.response?.data || err.message)
      setForgotMessage(err.response?.data?.message || 'Failed to send OTP')
    }
  }

  // ✅ Forgot Password Step 2: Verify OTP & Reset Password
  const handleResetPassword = async () => {
    if (!otp || !newPassword) return setForgotMessage('All fields are required')
    try {
      console.log('🔄 Resetting password for:', forgotEmail)
      await axios.post('http://localhost:5000/api/auth/reset', {
        email: forgotEmail,
        otp,
        newPassword,
      })
      setForgotMessage('Password reset successful! Please login.')
      setForgotStep(1)
      setShowForgot(false)
    } catch (err) {
      console.error('❌ Password reset failed:', err.response?.data || err.message)
      setForgotMessage(err.response?.data?.message || 'Failed to reset password')
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              {/* LOGIN CARD */}
              <CCard className="p-4">
                <CCardBody>
                  <CForm onSubmit={handleSubmit}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>

                    {/* Email */}
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        type="email"
                        placeholder="Email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        invalid={email && !isEmailValid(email)}
                        required
                      />
                    </CInputGroup>

                    {/* Password */}
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </CInputGroup>

                    {message && <p className="text-danger">{message}</p>}

                    {/* Buttons */}
                    <CRow>
                      <CCol xs={6}>
                        <CButton
                          color="primary"
                          className="px-4"
                          type="submit"
                          disabled={loading || !email || !password || !isEmailValid(email)}
                        >
                          {loading ? 'Logging in...' : 'Login'}
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                        <CButton color="link" className="px-0" onClick={() => setShowForgot(true)}>
                          Forgot password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>

              {/* REGISTER REDIRECT CARD */}
              <CCard className="text-white bg-primary py-5" style={{ width: '44%' }}>
                <CCardBody className="text-center">
                  <div>
                    <h2>Sign up</h2>
                    <p>Don't have an account? Register now.</p>
                    <Link to="/register">
                      <CButton color="primary" className="mt-3" active tabIndex={-1}>
                        Register Now!
                      </CButton>
                    </Link>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>

      {/* FORGOT PASSWORD MODAL */}
      <CModal visible={showForgot} onClose={() => setShowForgot(false)}>
        <CModalHeader>
          <CModalTitle>Forgot Password</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {forgotStep === 1 ? (
            <>
              <CFormInput
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              {forgotMessage && <p className="text-danger">{forgotMessage}</p>}
            </>
          ) : (
            <>
              <CFormInput
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <CFormInput
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
              />
              {forgotMessage && <p className="text-danger">{forgotMessage}</p>}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          {forgotStep === 1 ? (
            <CButton color="primary" onClick={handleRequestOtp}>
              Send OTP
            </CButton>
          ) : (
            <CButton color="primary" onClick={handleResetPassword}>
              Reset Password
            </CButton>
          )}
          <CButton color="secondary" onClick={() => setShowForgot(false)}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default Login
