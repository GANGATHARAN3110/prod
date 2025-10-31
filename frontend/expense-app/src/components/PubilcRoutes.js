// PublicRoute.js
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const PublicRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.isAuthenticated)

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Otherwise, allow access to public route (login/register)
  return children
}

export default PublicRoute
