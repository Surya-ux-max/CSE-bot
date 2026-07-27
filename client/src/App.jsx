import React, { useState, useEffect, useRef } from 'react'
import LandingPage from './components/LandingPage'
import ChatDashboard from './components/ChatDashboard'
import './App.css'

// ─── HIGH-PERFORMANCE SHINING CELEBRATORY CONFETATION CANVAS ENGINE ───────
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
      const step = Math.PI / spikes

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
      ctx.fill()
    }

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 22 + 9
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 8,
        width: Math.random() * 12 + 10,   // Larger particle sizes (10px to 22px)
        height: Math.random() * 14 + 8,
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.35,
        opacity: 1,
        shape: Math.random() > 0.6 ? 'star' : (Math.random() > 0.3 ? 'rect' : 'circle')
      })
    }

    let animId
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let activeCount = 0

      particles.forEach(p => {
        if (p.opacity <= 0) return
        activeCount++
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.38 // Smooth gravity
        p.vx *= 0.965 // Air drag
        p.opacity -= 0.010 // Extended lifespan for cinematic display
        p.rotation += p.spin

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        
        // Shining bold glow effect
        ctx.shadowBlur = 12
        ctx.shadowColor = p.color
        ctx.fillStyle = p.color

        if (p.shape === 'rect') {
          // 3D Ribbon twist effect
          const scaleY = Math.sin(p.rotation)
          ctx.scale(1, scaleY)
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
        } else if (p.shape === 'star') {
          drawStar(ctx, 0, 0, 5, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })

      if (activeCount > 0) {
        animId = requestAnimationFrame(render)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [triggerBurst])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none"
    />
  )
}

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [currentPage, setCurrentPage] = useState('landing') // 'landing' | 'chat'
  const [transitionState, setTransitionState] = useState('idle') // 'idle' | 'wiping_in' | 'wiping_out'
  const [confettiTrigger, setConfettiTrigger] = useState(null)

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

  // Trigger Clip Wipe Transition + Confetti Particle Explosion (Graceful Cinematic Pace)
  const handleNavigate = (targetPage, e) => {
    if (targetPage === currentPage || transitionState !== 'idle') return

    const clickX = e?.clientX || window.innerWidth / 2
    const clickY = e?.clientY || window.innerHeight / 2
    setConfettiTrigger({ id: Date.now(), x: clickX, y: clickY })

    setTransitionState('wiping_in')

    setTimeout(() => {
      setCurrentPage(targetPage)
      setTransitionState('wiping_out')
    }, 420)

    setTimeout(() => {
      setTransitionState('idle')
    }, 850)
  }

  return (
    <div className="w-full h-full min-h-screen relative overflow-hidden">
      
      {/* ─── CELEBRATORY CONFETTI EXPLOSION LAYER ─────────────────── */}
      <ConfettiCanvas triggerBurst={confettiTrigger} />

      {/* ─── CLIP WIPE OVERLAY CURTAIN ───────────────────────────── */}
      {transitionState !== 'idle' && (
        <div
          className={`fixed inset-0 z-50 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 flex flex-col items-center justify-center pointer-events-none shadow-2xl ${
            transitionState === 'wiping_in' ? 'animate-clipWipeEnter' : 'animate-clipWipeExit'
          }`}
        >
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-950/80 border border-amber-300/40 backdrop-blur-md shadow-2xl scale-105 transition-transform">
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
          onStartChat={(e) => handleNavigate('chat', e)}
          theme={theme}
          setTheme={setTheme}
        />
      ) : (
        <ChatDashboard
          onBackToHome={(e) => handleNavigate('landing', e)}
          theme={theme}
          setTheme={setTheme}
        />
      )}
    </div>
  )
}
