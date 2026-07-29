import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Calendar, Rocket, BookOpen, LayoutGrid, ArrowUpRight, Video } from 'lucide-react'
import { animate, stagger } from 'animejs'
import DashboardLayout from '../components/DashboardLayout'
import HubCard from '../components/hubs/HubCard'

export default function HubsLauncher({ theme, setTheme, currentUser, onBackToHome }) {
  const navigate = useNavigate()
  const listRef = useRef(null)

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

  // AnimeJS Entrance animation
  useEffect(() => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll('.anime-view-item')
    if (items.length > 0) {
      try {
        animate(items, {
          translateY: [15, 0],
          opacity: [0, 1],
          delay: stagger(40),
          duration: 350
        })
      } catch (e) {
        console.warn("AnimeJS launcher notice:", e)
      }
    }
  }, [])

  const isPlacementCell = (student.email || '').toLowerCase().includes('placement') ||
                          (student.designation || '').toLowerCase().includes('placement') ||
                          student.role === 'placement_cell' ||
                          (student.name || '').toLowerCase().includes('placement')

  const defaultHubs = [
    {
      id: 'messages',
      title: 'Message Hub',
      badge: 'AI Powered',
      description: 'Gmail-inspired AI communication hub, email draft generator & dedicated mail dispatcher.',
      icon: <Mail className="w-8 h-8 text-[#ffc815]" />,
      color: 'border-[#ffc815]/40 hover:border-[#ffc815] bg-[#ffc815]/10 text-[#ffc815]',
      btnColor: 'bg-[#ffc815] text-black hover:bg-[#ffdf70]',
      route: '/hubs/messages'
    },
    {
      id: 'calendar',
      title: 'Calendar Hub',
      badge: 'Exam & Study Sync',
      description: 'Swap card between personal study reminders and official SECE CAT-1/CAT-2 exam schedules.',
      icon: <Calendar className="w-8 h-8 text-[#f05030]" />,
      color: 'border-[#f05030]/40 hover:border-[#f05030] bg-[#f05030]/10 text-white',
      btnColor: 'bg-[#f05030] text-white hover:bg-[#f37359]',
      route: '/hubs/calendar'
    },
    {
      id: 'hackathons',
      title: 'Hackathon Radar',
      badge: 'CoE & SIH 2026',
      description: 'Live opportunity tracker for Smart India Hackathon, Google Solution Challenge & CoE Labs.',
      icon: <Rocket className="w-8 h-8 text-[#ffc815]" />,
      color: 'border-[#ffc815]/40 hover:border-[#ffc815] bg-[#ffc815]/10 text-white',
      btnColor: 'bg-[#ffc815] text-black hover:bg-[#ffdf70]',
      route: '/hubs/hackathons'
    },
    {
      id: 'curriculum',
      title: 'Curriculum & Syllabi',
      badge: 'All Semesters',
      description: 'Complete course credit distribution, professional electives, and detailed syllabus details across overall semesters.',
      icon: <BookOpen className="w-8 h-8 text-[#f05030]" />,
      color: 'border-[#f05030]/40 hover:border-[#f05030] bg-[#f05030]/10 text-white',
      btnColor: 'bg-[#f05030] text-white hover:bg-[#f37359]',
      route: '/hubs/curriculum'
    },
    {
      id: 'meeting',
      title: 'Meeting Hub',
      badge: 'Google Meet Style',
      description: 'AI-powered meeting scheduler. Create meetings for II CSE D with one line. Join live rooms with mic, camera & chat.',
      icon: <Video className="w-8 h-8 text-[#ffc815]" />,
      color: 'border-[#ffc815]/40 hover:border-[#ffc815] bg-[#ffc815]/10 text-white',
      btnColor: 'bg-[#ffc815] text-black hover:bg-[#ffdf70]',
      route: '/hubs/meeting'
    }
  ]

  const placementHubs = [
    {
      id: 'messages',
      title: 'Message Hub',
      badge: 'Inbox & Broadcasts',
      description: 'Compose broadcasts or review copy-ready announcements drafted by Search Agents for manual email distribution.',
      icon: <Mail className="w-8 h-8 text-[#ffc815]" />,
      color: 'border-[#ffc815]/40 hover:border-[#ffc815] bg-[#ffc815]/10 text-[#ffc815]',
      btnColor: 'bg-[#ffc815] text-black hover:bg-[#ffdf70]',
      route: '/hubs/messages'
    },
    {
      id: 'hackathons',
      title: 'Hackathon Radar',
      badge: 'Hackathon Agent',
      description: 'Live opportunity tracker for Smart India Hackathon (SIH 2026), Google Solution Challenge & CoE Labs.',
      icon: <Rocket className="w-8 h-8 text-[#f05030]" />,
      color: 'border-[#f05030]/40 hover:border-[#f05030] bg-[#f05030]/10 text-white',
      btnColor: 'bg-[#f05030] text-white hover:bg-[#f37359]',
      route: '/hubs/hackathons'
    },
    {
      id: 'meeting',
      title: 'Meeting Hub',
      badge: 'Recruitment Briefings',
      description: 'AI-powered meeting scheduler. Host placement orientation calls & interview briefings with live WebRTC A/V.',
      icon: <Video className="w-8 h-8 text-[#ffc815]" />,
      color: 'border-[#ffc815]/40 hover:border-[#ffc815] bg-[#ffc815]/10 text-white',
      btnColor: 'bg-[#ffc815] text-black hover:bg-[#ffdf70]',
      route: '/hubs/meeting'
    },
    {
      id: 'curriculum',
      title: 'Placement & CoE Hub',
      badge: 'Career & Skills',
      description: 'Explore Centers of Excellence, skill development programs, company rosters, and student achievements.',
      icon: <BookOpen className="w-8 h-8 text-[#f05030]" />,
      color: 'border-[#f05030]/40 hover:border-[#f05030] bg-[#f05030]/10 text-white',
      btnColor: 'bg-[#f05030] text-white hover:bg-[#f37359]',
      route: '/hubs/curriculum'
    }
  ]

  const departmentHubs = isPlacementCell ? placementHubs : defaultHubs

  return (
    <DashboardLayout
      theme={theme}
      setTheme={setTheme}
      currentUser={student}
      onBackToHome={onBackToHome}
      title={isPlacementCell ? "Placement Cell Command Center" : "Department Hubs Launcher"}
    >
      <div ref={listRef} className="max-w-5xl mx-auto space-y-8 text-left py-4">
        
        {/* Header Headline */}
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-2xl bg-[#ffc815] border-2 border-black text-xs font-mono text-black font-black shadow-[2px_2px_0_0_#000]">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isPlacementCell ? "🚀 SECE Placement Cell Command Center" : "SECE CSE Intelligent Department Hubs"}</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black leading-none uppercase tracking-tight font-display text-theme-primary">
            {isPlacementCell ? <>Placement & Hackathon <span className="text-[#f05030]">Broadcast Hub</span></> : <>Access Specialized <span className="text-[#f05030]">Department Hubs</span></>}
          </h2>
          <p className="text-xs sm:text-sm font-mono font-bold max-w-2xl text-theme-secondary">
            {isPlacementCell
              ? "Logged in as Placement Cell. Access your connected Mail Agent to broadcast placement drives, manage SIH 2026 hackathons, or host live recruitment briefings."
              : "Select any hub card below to navigate directly into dedicated tools, AI message generators, exam calendars, or syllabus registries."}
          </p>
        </div>

        {/* Mail Agent Status Callout Banner for Placement Cell */}
        {isPlacementCell && (
          <div className="p-4 rounded-2xl comic-card bg-[#ffc815]/10 border-2 border-[#ffc815] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#ffc815] text-black font-black">✉️</div>
              <div>
                <div className="text-xs font-black uppercase text-theme-primary font-mono">AI Search Copilot Enabled</div>
                <div className="text-[11px] text-theme-secondary font-semibold">
                  Use the Placement Agent and Hackathon Agent in Chat to generate copy-ready templates, then distribute them manually via the Message Hub.
                </div>
              </div>
            </div>
            <button onClick={() => navigate('/hubs/messages')}
              className="px-4 py-2 rounded-xl bg-[#ffc815] text-black font-extrabold text-xs hover:bg-[#ffdf70] transition flex-shrink-0 cursor-pointer">
              Open Message Hub
            </button>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departmentHubs.map(hub => (
            <HubCard key={hub.id} hub={hub} onNavigate={navigate} />
          ))}
        </div>

      </div>
    </DashboardLayout>
  )
}
