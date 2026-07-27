import React, { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ChatDashboard from './components/ChatDashboard'
import './App.css'

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [currentPage, setCurrentPage] = useState('landing') // 'landing' | 'chat'
  const [transitionState, setTransitionState] = useState('idle') // 'idle' | 'wiping_in' | 'wiping_out'

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

  // Trigger Clip Wipe Transition (Speedy & Smooth)
  const handleNavigate = (targetPage) => {
    if (targetPage === currentPage || transitionState !== 'idle') return

    setTransitionState('wiping_in')

    setTimeout(() => {
      setCurrentPage(targetPage)
      setTransitionState('wiping_out')
    }, 200)

    setTimeout(() => {
      setTransitionState('idle')
    }, 400)
  }

  return (
    <div className="w-full h-full min-h-screen relative overflow-hidden">
      
      {/* ─── CLIP WIPE OVERLAY CURTAIN ───────────────────────────── */}
      {transitionState !== 'idle' && (
        <div
          className={`fixed inset-0 z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 flex flex-col items-center justify-center pointer-events-none shadow-2xl ${
            transitionState === 'wiping_in' ? 'animate-clipWipeEnter' : 'animate-clipWipeExit'
          }`}
        >
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-950/80 border border-amber-300/40 backdrop-blur-md shadow-2xl">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <span className="font-display text-2xl font-bold tracking-widest text-amber-400">
              CHITTI AI
            </span>
          </div>
        </div>
      )}

      {/* ─── ACTIVE SCREEN ────────────────────────────────────────── */}
      {currentPage === 'landing' ? (
        <LandingPage
          onStartChat={() => handleNavigate('chat')}
          theme={theme}
          setTheme={setTheme}
        />
      ) : (
        <ChatDashboard
          onBackToHome={() => handleNavigate('landing')}
          theme={theme}
          setTheme={setTheme}
        />
      )}
    </div>
  )
}
