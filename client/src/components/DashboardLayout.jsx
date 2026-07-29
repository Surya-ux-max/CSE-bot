import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutGrid, Sun, Moon, LogOut, ArrowLeft } from 'lucide-react'
import TechBackground from './TechBackground'

import DoorBlindsTransition from './transition/DoorBlindsTransition'

export default function DashboardLayout({ children, theme, setTheme, currentUser, onBackToHome, title }) {
  const navigate = useNavigate()
  const location = useLocation()
  const transitionMode = (location.pathname.includes('hackathons') || location.pathname.includes('curriculum')) ? 'doors' : 'blinds'

  const storedUser = (() => {
    try {
      const s = localStorage.getItem('sece_user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })()

  const student = currentUser || storedUser || {
    name: 'Suryaprakash S',
    email: 'suryaprakash.s.d@csebot.edu',
    section: 'Section D',
    year: '3rd Year'
  }

  const displaySection = student.section ? ` (${student.section})` : (student.designation ? ` (${student.designation})` : '')
  const isHubsActive = location.pathname === '/hubs'
  const isChatActive = location.pathname === '/dashboard'

  const getBreadcrumbs = () => {
    const path = location.pathname
    if (path === '/dashboard') return 'Workspace > Chitti AI'
    if (path === '/hubs') return 'Workspace > Department Hubs'
    if (path.startsWith('/hubs/messages')) return 'Department Hubs > Message Hub'
    if (path.startsWith('/hubs/calendar')) return 'Department Hubs > Calendar Hub'
    if (path.startsWith('/hubs/meeting')) return 'Department Hubs > Meeting Hub'
    if (path.startsWith('/hubs/hackathons')) return 'Department Hubs > Hackathon Radar'
    if (path.startsWith('/hubs/curriculum')) return 'Department Hubs > Curriculum & Syllabus'
    return 'Workspace'
  }

  return (
    <div className={`min-h-screen font-sans overflow-hidden flex flex-col relative bg-theme-primary text-theme-primary ${theme}`}>
      {/* Dynamic Background Grid & Ambient Glow Orbs */}
      <TechBackground theme={theme} />

      {/* Main Layout Overlay */}
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">

        {/* ─── TOP NAVIGATION BAR ─────────────────────────────────── */}
        <header className="header-theme px-6 py-4 flex items-center justify-between gap-4 shrink-0 shadow-lg">
          {/* Identity & Current View Title */}
          <div className="flex items-center gap-3">
            {!isChatActive && (
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl border-2 border-black hover:bg-[#ffc815] hover:text-black transition-all flex items-center gap-1.5 text-xs font-mono font-bold cursor-pointer bg-theme-input text-theme-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffc815]"
                title="Return to Chitti AI Chat"
                aria-label="Back to Chitti AI"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Chitti AI</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-theme-muted mb-1 font-extrabold">
                <span>{getBreadcrumbs()}</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black leading-none uppercase tracking-tight text-[#f05030] drop-shadow-[2px_2px_0_var(--border-color)] font-display">
                {title || 'Chitti AI Workspace'}
              </h1>
              <span className="text-[10.5px] font-mono text-[#ffc815] font-bold block mt-0.5">
                SECE CSE • {student.name}{displaySection}
              </span>
            </div>
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
            {/* Launcher icon */}
            <button
              onClick={() => navigate(isHubsActive ? '/dashboard' : '/hubs')}
              className={`p-2.5 rounded-2xl border-2 border-black transition-all flex items-center gap-2 text-xs font-mono font-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffc815] ${
                isHubsActive
                  ? 'bg-[#ffc815] text-black shadow-[3px_3px_0_0_var(--border-color)]'
                  : 'bg-theme-input text-theme-primary hover:bg-[#ffc815] hover:text-black hover:shadow-[3px_3px_0_0_var(--border-color)]'
              }`}
              title="Access Department Hubs Launcher"
              aria-label="Toggle Department Hubs Launcher"
            >
              <LayoutGrid className={`w-5 h-5 ${isHubsActive ? 'text-black' : 'text-[#f05030]'}`} />
              <span className="hidden md:inline">Department Hubs</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-2xl border-2 border-black bg-theme-input hover:bg-[#ffc815] hover:text-black transition-all cursor-pointer active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffc815]"
              title="Toggle theme mode"
              aria-label="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#ffc815]" /> : <Moon className="w-4 h-4 text-[#f05030]" />}
            </button>

            {/* Exit/Return to Platform */}
            <button
              onClick={onBackToHome}
              className="p-2.5 rounded-2xl border-2 border-black bg-theme-input text-theme-primary hover:bg-rose-500 hover:text-white transition-all cursor-pointer active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffc815]"
              title="Exit Student Dashboard"
              aria-label="Exit Dashboard"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Viewport for inner pages with Door & Blinds Page Transitions */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 text-left relative">
          <DoorBlindsTransition activeKey={location.pathname} mode={transitionMode}>
            {children}
          </DoorBlindsTransition>
        </main>
      </div>
    </div>
  )
}
