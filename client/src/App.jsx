import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import AuthPage from './auth/auth'
import Dashboard from './pages/Dashboard'
import HubsLauncher from './pages/HubsLauncher'
import MessageHubPage from './pages/MessageHubPage'
import CalendarHubPage from './pages/CalendarHubPage'
import HackathonsPage from './pages/HackathonsPage'
import CurriculumPage from './pages/CurriculumPage'
import MeetingHubPage from './pages/MeetingHubPage'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

// ─── HIGH-PERFORMANCE SHINING CELEBRATORY CONFETTI CANVAS ENGINE ───────
function ConfettiCanvas({ triggerBurst }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!triggerBurst) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Bold, vibrant, glowing celebratory colors
    const colors = ['#FBBF24', '#F59E0B', '#38BDF8', '#06B6D4', '#10B981', '#F43F5E', '#8B5CF6', '#FFFFFF']
    const particles = []
    const particleCount = 160
    const originX = triggerBurst.x || window.innerWidth / 2
    const originY = triggerBurst.y || window.innerHeight / 2

    // Helper to draw 5-pointed star
    const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
      let rot = (Math.PI / 2) * 3
      let x = cx
      let y = cy
      let step = Math.PI / spikes

      ctx.beginPath()
      ctx.moveTo(cx, cy - outerRadius)
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius
        y = cy + Math.sin(rot) * outerRadius
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius
        y = cy + Math.sin(rot) * innerRadius
        ctx.lineTo(x, y)
        rot += step
      }
      ctx.lineTo(cx, cy - outerRadius)
      ctx.closePath()
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 16 + 4
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 4 + 2), // initial upward pop
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        shape: Math.random() > 0.6 ? 'star' : Math.random() > 0.3 ? 'circle' : 'rect',
        alpha: 1,
        gravity: 0.28,
        drag: 0.985
      })
    }

    let animationFrameId
    const startTime = Date.now()

    const render = () => {
      const elapsed = Date.now() - startTime
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.vx *= p.drag
        p.vy = p.vy * p.drag + p.gravity
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotSpeed
        p.alpha = Math.max(0, 1 - elapsed / 1800)

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, p.size, p.size / 2)
          ctx.fill()
        } else if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        }
        ctx.restore()
      })

      if (elapsed < 1800) {
        animationFrameId = requestAnimationFrame(render)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [triggerBurst])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
    />
  )
}

function MainApp() {
  const navigate = useNavigate()
  const { currentUser, login, theme, setTheme } = useAuth()
  const [authRole, setAuthRole] = useState('student')
  const [confettiTrigger, setConfettiTrigger] = useState(null)

  const handleNavigateWithAnimation = (targetPath, clickEvent) => {
    const origin = clickEvent ? { x: clickEvent.clientX, y: clickEvent.clientY } : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    setConfettiTrigger(origin)
    navigate(targetPath)
  }

  const handleOpenAuth = (role = 'student', e) => {
    setAuthRole(role)
    handleNavigateWithAnimation('/auth', e)
  }

  const handleAuthSuccess = (userProfile) => {
    login(userProfile)
    handleNavigateWithAnimation('/dashboard')
  }

  return (
    <div className={`w-full h-full min-h-screen relative overflow-hidden ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-[#f0ebd8] text-slate-950'}`}>
      
      {/* ─── CELEBRATORY CONFETTI EXPLOSION LAYER ─────────────────── */}
      <ConfettiCanvas triggerBurst={confettiTrigger} />

      {/* ─── REACT ROUTER DOM URL PAGE ROUTES ─────────────────────── */}
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            <LandingPage
              onStartChat={(e) => handleNavigateWithAnimation('/dashboard', e)}
              onOpenAuth={(role, e) => handleOpenAuth(role, e)}
              theme={theme}
              setTheme={setTheme}
            />
          }
        />

        {/* Auth Page */}
        <Route
          path="/auth"
          element={
            <AuthPage
              onBackToHome={(e) => handleNavigateWithAnimation('/', e)}
              initialRole={authRole}
              onAuthSuccess={handleAuthSuccess}
              theme={theme}
              setTheme={setTheme}
            />
          }
        />

        {/* Chitti AI Dashboard Home */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard
                onBackToHome={(e) => handleNavigateWithAnimation('/', e)}
                theme={theme}
                setTheme={setTheme}
                currentUser={currentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* Department Hubs Launcher Cards Page */}
        <Route
          path="/hubs"
          element={
            <ProtectedRoute>
              <HubsLauncher
                onBackToHome={(e) => handleNavigateWithAnimation('/', e)}
                theme={theme}
                setTheme={setTheme}
                currentUser={currentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Message Hub Route */}
        <Route
          path="/hubs/messages"
          element={
            <ProtectedRoute>
              <MessageHubPage
                onBackToHome={(e) => handleNavigateWithAnimation('/', e)}
                theme={theme}
                setTheme={setTheme}
                currentUser={currentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Calendar Hub Route */}
        <Route
          path="/hubs/calendar"
          element={
            <ProtectedRoute>
              <CalendarHubPage
                onBackToHome={(e) => handleNavigateWithAnimation('/', e)}
                theme={theme}
                setTheme={setTheme}
                currentUser={currentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Meeting Hub Route */}
        <Route
          path="/hubs/meeting"
          element={
            <ProtectedRoute>
              <MeetingHubPage
                onBackToHome={(e) => handleNavigateWithAnimation('/', e)}
                theme={theme}
                setTheme={setTheme}
                currentUser={currentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Hackathons Radar Route */}
        <Route
          path="/hubs/hackathons"
          element={
            <ProtectedRoute>
              <HackathonsPage
                onBackToHome={(e) => handleNavigateWithAnimation('/', e)}
                theme={theme}
                setTheme={setTheme}
                currentUser={currentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Curriculum Syllabi Route */}
        <Route
          path="/hubs/curriculum"
          element={
            <ProtectedRoute>
              <CurriculumPage
                onBackToHome={(e) => handleNavigateWithAnimation('/', e)}
                theme={theme}
                setTheme={setTheme}
                currentUser={currentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-All Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  )
}
