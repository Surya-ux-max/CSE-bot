import React, { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ChatDashboard from './components/ChatDashboard'
import './App.css'

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [currentPage, setCurrentPage] = useState('landing') // 'landing' | 'chat'

  // Clean UI local storage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cse_bot_theme') || 'dark'
    setTheme(savedTheme)
    localStorage.removeItem('cse_bot_sessions')
  }, [])

  // Apply theme class to HTML element
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('cse_bot_theme', theme)
  }, [theme])

  return (
    <div className="w-full h-full min-h-screen">
      {currentPage === 'landing' ? (
        <LandingPage
          onStartChat={() => setCurrentPage('chat')}
          theme={theme}
          setTheme={setTheme}
        />
      ) : (
        <ChatDashboard
          onBackToHome={() => setCurrentPage('landing')}
          theme={theme}
          setTheme={setTheme}
        />
      )}
    </div>
  )
}
