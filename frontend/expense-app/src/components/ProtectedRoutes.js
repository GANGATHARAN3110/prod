import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.isAuthenticated)
  const token = useSelector((state) => state.token)

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
