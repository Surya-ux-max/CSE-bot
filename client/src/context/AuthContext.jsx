import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children, initialTheme = 'dark' }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sece_auth_user') || localStorage.getItem('sece_user')
      return saved ? JSON.parse(saved) : null
    } catch (err) {
      console.warn('[AuthContext] Failed to parse cached user:', err)
      return null
    }
  })

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('sece_theme') || initialTheme
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    localStorage.setItem('sece_theme', theme)
  }, [theme])

  const login = (userProfile) => {
    setCurrentUser(userProfile)
    try {
      localStorage.setItem('sece_auth_user', JSON.stringify(userProfile))
      localStorage.setItem('sece_user', JSON.stringify(userProfile))
    } catch (err) {
      console.error('[AuthContext] Failed to save user session:', err)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('sece_auth_user')
    localStorage.removeItem('sece_user')
  }

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  const value = {
    currentUser,
    setCurrentUser,
    login,
    logout,
    isAuthenticated: !!currentUser,
    theme,
    setTheme,
    toggleTheme
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
