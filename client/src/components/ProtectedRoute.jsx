import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute Component
 * Guards protected routes against unauthenticated access.
 * Redirects unauthenticated users to /auth with return location context.
 */
export default function ProtectedRoute({ children, allowedRoles = null }) {
  const { currentUser, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />
  }

  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = (currentUser.role || 'student').toLowerCase()
    const isAllowed = allowedRoles.some(r => r.toLowerCase() === userRole)
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
