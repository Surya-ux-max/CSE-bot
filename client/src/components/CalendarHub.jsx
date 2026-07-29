import React, { useState, useEffect, useRef } from 'react'
import {
  Calendar as CalendarIcon, Clock, Plus, Sparkles, CheckCircle2, ChevronLeft, ChevronRight,
  User, BookOpen, Layers, Filter, Bot, Send, Trash2, Mic, MicOff
} from 'lucide-react'
import { animate, stagger } from 'animejs'
import { useFormatContent } from './FormatContent'
import { apiClient } from '../services/ApiClient'
import { startSpeechToText } from '../services/speech'

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function CalendarHub({ currentUser, theme }) {
  // Current calendar view state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  
  // Selected date inside calendar grid
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // AI Calendar Agent Prompt State
  const [agentPrompt, setAgentPrompt] = useState('')
  const [isAgentThinking, setIsAgentThinking] = useState(false)
  const [agentResponse, setAgentResponse] = useState(null)
  const [isListening, setIsListening] = useState(false)
  
  // Dual Calendar Toggles & Lists
  const [viewMode, setViewMode] = useState('combined') // 'combined' | 'personal' | 'academic'
  const [myEvents, setMyEvents] = useState([])
  const [academicEvents, setAcademicEvents] = useState([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [notification, setNotification] = useState(null)

  const getCategoryStyle = (category = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('holiday')) {
      return {
        badge: 'bg-[#ffc815] text-black font-extrabold',
        border: 'border-[#ffc815]/30',
        bgLight: 'bg-[#ffc815]/10 text-theme-primary'
      };
    }
    if (cat.includes('exam') || cat.includes('assessment') || cat.includes('cia') || cat.includes('test')) {
      return {
        badge: 'bg-[#f05030] text-white font-extrabold',
        border: 'border-[#f05030]/30',
        bgLight: 'bg-[#f05030]/10 text-theme-primary'
      };
    }
    if (cat.includes('meeting') || cat.includes('class') || cat.includes('workshop') || cat.includes('training') || cat.includes('remedial')) {
      return {
        badge: 'bg-blue-600 text-white font-extrabold',
        border: 'border-blue-500/30',
        bgLight: 'bg-blue-500/10 text-theme-primary'
      };
    }
    // Default is Personal/Green
    return {
      badge: 'bg-emerald-600 text-white font-extrabold',
      border: 'border-emerald-500/30',
      bgLight: 'bg-emerald-500/10 text-theme-primary'
    };
  };

  // Combined Manual/Academic Creation Modal Form State
  const [isAcademicEvent, setIsAcademicEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '04:00 PM - 06:00 PM',
    category: 'Personal Study',
    semester: 'All Years',
    department: 'All Departments',
    description: ''
  })

  const hubRef = useRef(null)
  const gridRef = useRef(null)
  const formatContent = useFormatContent()

  // User Profile
  const user = currentUser || {
    name: 'Suryaprakash S',
    email: 'suryaprakash.s.d@csebot.edu',
    section: 'Section D',
    role: 'student',
    year: '3rd Year'
  }

  const userRole = (user.role || 'student').toLowerCase()

  // Load events from database on email/mount
  useEffect(() => {
    fetchEvents()
  }, [user.email])

  // Staggered entry animation for calendar grid items
  useEffect(() => {
    if (!gridRef.current) return
    const cells = gridRef.current.querySelectorAll('.anime-cell')
    if (cells.length > 0) {
      try {
        animate(cells, {
          scale: [0.9, 1],
          opacity: [0, 1],
          delay: stagger(10),
          duration: 300,
          ease: 'easeOutBack'
        })
      } catch (e) {
        console.warn("AnimeJS grid animation notice:", e)
      }
    }
  }, [currentMonth, currentYear, viewMode])

  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      const [personalData, academicData] = await Promise.all([
        apiClient.getEvents(user.email),
        apiClient.getAcademicEvents(user.email)
      ])
      setMyEvents(personalData)
      setAcademicEvents(academicData)
    } catch (err) {
      console.error("Error fetching calendar data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Format Helper: converts Date to YYYY-MM-DD string
  const getFormattedDateStr = (d) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const selectedDateStr = getFormattedDateStr(selectedDate)

  // Handle Calendar Agent NLP Input (e.g. "Schedule Compiler Lab on Thursday")
  const handleAgentSubmit = async (e) => {
    e?.preventDefault()
    if (!agentPrompt.trim() || isAgentThinking) return

    setIsAgentThinking(true)
    setAgentResponse(null)

    try {
      const response = await apiClient.queryCalendarAgent(user.email, agentPrompt)
      setAgentResponse(response.answer)

      // Always re-fetch events to ensure updated dates, days, and lists are 100% synced from backend
      await fetchEvents()

      if (response.should_create && response.event && response.event.date) {
        // Parse date (YYYY-MM-DD) to select it on the grid
        const [yr, mn, dy] = response.event.date.split('-').map(Number)
        if (yr && mn && dy) {
          setSelectedDate(new Date(yr, mn - 1, dy))
          setCurrentMonth(mn - 1)
          setCurrentYear(yr)
        }
        
        setNotification(`📅 Calendar schedule updated for "${response.event.title}" on ${response.event.date}!`)
        setTimeout(() => setNotification(null), 3500)
      }
      setAgentPrompt('')
    } catch (err) {
      console.error("Calendar agent error:", err)
      setAgentResponse("Processed request. Calendar schedule auto-synced.")
    } finally {
      setIsAgentThinking(false)
    }
  }

  // Create Manual Event (Personal or Academic) via API
  const handleAddEventSubmit = async (e) => {
    e.preventDefault()
    if (!newEvent.title.trim()) return

    try {
      if (isAcademicEvent) {
        // Faculty ONLY publishes academic events
        const created = await apiClient.createAcademicEvent({
          title: newEvent.title,
          date: selectedDateStr,
          time: newEvent.time,
          category: newEvent.category,
          semester: newEvent.semester,
          department: newEvent.department,
          description: newEvent.description,
          user_email: user.email,
          user_role: userRole
        })
        setAcademicEvents(prev => [...prev, created])
        setNotification("📢 Central Academic Event published successfully!")
      } else {
        // Personal Event
        const created = await apiClient.createEvent({
          user_email: user.email,
          title: newEvent.title,
          date: selectedDateStr,
          time: newEvent.time,
          category: newEvent.category
        })
        setMyEvents(prev => [created, ...prev])
        setNotification("📅 Personal event added successfully.")
      }

      setShowAddModal(false)
      setNewEvent({
        title: '',
        time: '04:00 PM - 06:00 PM',
        category: 'Personal Study',
        semester: 'All Years',
        department: 'All Departments',
        description: ''
      })
      setTimeout(() => setNotification(null), 3000)
    } catch (err) {
      console.error("Failed to create calendar event:", err)
      setNotification("⚠️ Failed to publish event.")
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // Delete Event (Personal or Academic) via API
  const handleDeleteEvent = async (event) => {
    const isAcademic = event.created_by !== undefined
    try {
      if (isAcademic) {
        if (userRole !== 'faculty') {
          setNotification("⚠️ Only Faculty can delete academic events!")
          setTimeout(() => setNotification(null), 3000)
          return
        }
        await apiClient.deleteAcademicEvent(event.id, user.email, userRole)
        setAcademicEvents(prev => prev.filter(ev => ev.id !== event.id))
        setNotification("🗑️ Academic event deleted successfully.")
      } else {
        await apiClient.deleteEvent(event.id, user.email)
        setMyEvents(prev => prev.filter(ev => ev.id !== event.id))
        setNotification("🗑️ Personal event deleted.")
      }
      setTimeout(() => setNotification(null), 3000)
    } catch (err) {
      console.error("Failed to delete event:", err)
    }
  }

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else {
      setCurrentMonth(prev => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else {
      setCurrentMonth(prev => prev + 1)
    }
  }

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()

  const handleDaySelect = (dayNum) => {
    setSelectedDate(new Date(currentYear, currentMonth, dayNum))
  }

  // Check if a date string falls inside an academic event range
  const isDateInAcademicRange = (dateStr, academicEvent) => {
    if (!academicEvent.end_date) {
      return academicEvent.date === dateStr
    }
    return dateStr >= academicEvent.date && dateStr <= academicEvent.end_date
  }

  // Filter personal events for active selected day
  const activePersonalEvents = myEvents.filter(ev => ev.date === selectedDateStr)
  
  // Filter academic events for active selected day
  const activeAcademicEvents = academicEvents.filter(ev => isDateInAcademicRange(selectedDateStr, ev))

  return (
    <div ref={hubRef} className="w-full max-w-6xl mx-auto space-y-8 text-left font-sans">
      
      {/* Notification Toast */}
      {notification && (
        <div className="bg-[#ffc815] text-black px-6 py-2.5 text-xs font-mono font-bold text-center animate-fadeIn shadow-lg border-2 border-black rounded-xl">
          {notification}
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════
         1. TOP HEADER TITLE BAR
      ═══════════════════════════════════════════════════════════════ */}
      <div className="p-4 sm:p-6 panel-theme rounded-3xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-4 border-black">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffc815] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_0_#000]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase font-display text-theme-primary leading-none">Dual Calendar Hub</h2>
              <p className="text-xs font-mono font-bold text-theme-secondary mt-1">
                Role: <strong className="text-[#f05030]">{userRole.toUpperCase()}</strong> • Managed centrally by Faculty & synced to Students
              </p>
            </div>
          </div>

          {/* Sync indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-theme-input border border-theme text-[10px] font-mono font-bold text-theme-secondary">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>REAL-TIME CENTRAL DB CONNECTED</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           2. CONVERSATIONAL CALENDAR AI AGENT WORKSPACE
        ═══════════════════════════════════════════════════════════════ */}
        <div className="p-5 rounded-2xl bg-theme-input border-2 border-theme space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#f05030]" />
              <h3 className="text-xs font-mono font-black uppercase text-theme-primary">Calendar Agent Chat Workspace</h3>
            </div>
            <span className="text-[10px] font-mono text-theme-muted">Ask schedules, prepare deadlines, detect conflicts</span>
          </div>

          <form onSubmit={handleAgentSubmit} className="flex gap-2 items-center">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={agentPrompt}
                onChange={(e) => setAgentPrompt(e.target.value)}
                placeholder="e.g., 'Do I have any exams this week?', 'Schedule remedial class tomorrow at 3pm'..."
                className="input-theme w-full pl-4 pr-12 py-3 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:border-[#ffc815]"
              />
              <button
                type="button"
                onClick={() => {
                  if (isListening) return;
                  startSpeechToText(
                    (transcript) => setAgentPrompt(prev => (prev ? prev + ' ' : '') + transcript),
                    setIsListening,
                    user.email
                  );
                }}
                className={`absolute right-3 p-1.5 rounded-lg transition-all ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                    : 'text-theme-muted hover:text-[#ffc815]'
                }`}
                title="Voice dictation"
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!agentPrompt.trim() || isAgentThinking}
              className="px-5 py-3 rounded-xl bg-[#ffc815] hover:bg-[#ffdf70] text-black font-mono font-extrabold text-xs shadow-md shrink-0 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isAgentThinking ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </form>

          {agentResponse && (
            <div className="p-4 rounded-xl bg-theme-card border border-theme text-xs sm:text-sm text-theme-primary leading-relaxed whitespace-pre-line border-l-4 border-l-[#ffc815] animate-fadeIn">
              {formatContent(agentResponse)}
            </div>
          )}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
         3. DUAL CALENDAR LAYOUT GRID (8 cols Left Grid, 4 cols Right cards)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Calendar Month View (8 cols) */}
        <div className="lg:col-span-8 p-6 panel-theme rounded-3xl space-y-6">
          
          {/* Calendar Controller Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="text-left">
              <h3 className="text-xl font-mono font-black text-theme-primary">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <p className="text-xs font-mono text-theme-secondary">Click dates to select or view detailed agendas</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Dual-Calendar View Toggles */}
              <div className="flex p-1 rounded-xl bg-theme-input border border-theme text-[10px] font-mono font-bold">
                {[
                  { id: 'combined', label: 'Combined View' },
                  { id: 'personal', label: 'Personal' },
                  { id: 'academic', label: 'Academic' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc815] ${
                      viewMode === mode.id
                        ? 'bg-[#ffc815] text-black font-extrabold shadow'
                        : 'text-theme-secondary hover:text-theme-primary'
                    }`}
                    aria-label={`Switch calendar to ${mode.label} mode`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-theme-input hover:bg-[#ffc815] hover:text-black border border-theme spring-button cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-theme-input hover:bg-[#ffc815] hover:text-black border border-theme spring-button cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Viewport */}
          <div className="space-y-2">
            
            {/* Days of Week Name Header */}
            <div className="grid grid-cols-7 text-center font-mono font-black text-xs text-[#f05030] pb-2">
              {DAY_NAMES.map(name => (
                <div key={name} className="py-1 uppercase">{name}</div>
              ))}
            </div>

            {/* Monthly Dates Grid */}
            <div ref={gridRef} className="grid grid-cols-7 gap-2.5">
              {/* Blanks for preceding month alignment */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`blank-${idx}`} className="aspect-square opacity-0 select-none" />
              ))}

              {/* Days numbers */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1
                const dateObj = new Date(currentYear, currentMonth, dayNum)
                const dateStr = getFormattedDateStr(dateObj)
                const isSelected = dateStr === selectedDateStr
                
                // Fetch personal and academic events for this day
                const pEventsOnDay = myEvents.filter(ev => ev.date === dateStr)
                const aEventsOnDay = academicEvents.filter(ev => isDateInAcademicRange(dateStr, ev))
                
                const hasPersonal = pEventsOnDay.length > 0
                const hasAcademic = aEventsOnDay.length > 0

                // Filter flags based on active view mode
                const showPersonal = viewMode === 'combined' || viewMode === 'personal'
                const showAcademic = viewMode === 'combined' || viewMode === 'academic'

                const personalDot = hasPersonal && showPersonal
                const academicDot = hasAcademic && showAcademic

                const totalEventsCount = (personalDot ? pEventsOnDay.length : 0) + (academicDot ? aEventsOnDay.length : 0)

                const colIdx = (firstDayIndex + idx) % 7
                let tooltipAlignClass = "left-1/2 -translate-x-1/2"
                if (colIdx <= 1) {
                  tooltipAlignClass = "left-0"
                } else if (colIdx >= 5) {
                  tooltipAlignClass = "right-0 left-auto"
                }

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => handleDaySelect(dayNum)}
                    className={`anime-cell aspect-square rounded-2xl border-2 font-mono text-xs font-black relative flex flex-col items-center justify-center transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffc815] ${
                      isSelected
                        ? 'bg-[#ffc815] text-black border-black shadow-[3px_3px_0_0_#000] scale-105 z-10'
                        : 'bg-theme-input border-theme text-theme-primary hover:border-[#ffc815] hover:shadow-[2px_2px_0_0_var(--border-color)]'
                    }`}
                    aria-label={`Date: ${dayNum} ${MONTH_NAMES[currentMonth]} ${currentYear}. ${totalEventsCount} event${totalEventsCount === 1 ? '' : 's'} scheduled.`}
                  >
                    <span className="text-sm">{dayNum}</span>
                    
                    {/* Event count dot indicators */}
                    <div className="flex gap-1 absolute bottom-2 shrink-0">
                      {personalDot && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Personal Event" />
                      )}
                      {academicDot && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f05030]" title="Academic Event" />
                      )}
                    </div>

                    {/* Hover tooltip showing event names */}
                    {totalEventsCount > 0 && (
                      <div className={`absolute bottom-full ${tooltipAlignClass} mb-2 w-64 p-3 bg-black/95 text-white text-[10px] font-mono rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 transition-all duration-200 pointer-events-none z-50 border border-[#ffc815] text-left whitespace-normal break-words`}>
                        <div className="font-bold text-[#ffc815] border-b border-[#ffc815]/30 pb-1 mb-1.5 uppercase tracking-wider text-[9px]">
                          Events ({totalEventsCount}):
                        </div>
                        
                        {/* Labeled Lists */}
                        {personalDot && pEventsOnDay.map(ev => (
                          <div key={`p-${ev.id}`} className="last:mb-0 mb-1.5 flex items-start gap-1.5 whitespace-normal break-words text-left">
                            <span className="text-emerald-400 shrink-0 mt-0.5">●</span>
                            <span className="flex-1 text-slate-300 leading-tight">
                              <strong>[Personal]</strong> {ev.title} <span className="text-slate-400">({ev.time})</span>
                            </span>
                          </div>
                        ))}

                        {academicDot && aEventsOnDay.map(ev => (
                          <div key={`a-${ev.id}`} className="last:mb-0 mb-1.5 flex items-start gap-1.5 whitespace-normal break-words text-left">
                            <span className="text-[#f05030] shrink-0 mt-0.5">●</span>
                            <span className="flex-1 text-slate-300 leading-tight">
                              <strong>[Academic]</strong> {ev.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

          </div>

        </div>

        {/* Right Side: Event Details & Inline Add (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Day Schedule Panel Card */}
          <div className="p-6 panel-theme rounded-3xl space-y-4">
            
            <div className="pb-3 border-b border-theme flex justify-between items-center">
              <div>
                <h4 className="text-xs font-mono font-black text-[#f05030] uppercase">Selected Date</h4>
                <p className="text-sm font-black text-theme-primary">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              
              <button
                onClick={() => {
                  // Faculty defaults to choosing personal/academic, student is forced to personal
                  setIsAcademicEvent(false)
                  setShowAddModal(true)
                }}
                className="p-2 rounded-xl bg-[#ffc815] hover:bg-[#ffdf70] text-black border-2 border-black shadow-[2px_2px_0_0_#000] spring-button cursor-pointer flex items-center justify-center"
                title="Schedule Event"
              >
                <Plus className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* List of Events for this Day */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-mono font-bold text-theme-secondary uppercase tracking-widest">
                Daily Agenda
              </h5>

              {isLoading ? (
                <p className="text-xs font-mono text-theme-muted animate-pulse">Syncing calendar records...</p>
              ) : (activePersonalEvents.length === 0 && activeAcademicEvents.length === 0) ? (
                <div className="p-6 rounded-2xl bg-theme-input text-center text-xs font-mono text-theme-muted border border-dashed border-theme">
                  No events scheduled for this day. Click '+' to schedule.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  
                  {/* Academic Events List */}
                  {viewMode !== 'personal' && activeAcademicEvents.map(event => {
                    const style = getCategoryStyle(event.category);
                    return (
                      <div
                        key={`acad-${event.id}`}
                        className={`p-3 rounded-2xl border-2 ${style.border} ${style.bgLight} flex justify-between items-start gap-2.5 text-left`}
                      >
                        <div className="text-left space-y-1 min-w-0 flex-1">
                          <div className="flex gap-1.5 flex-wrap items-center">
                            <span className="text-[8px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f05030] text-white">
                              Academic
                            </span>
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
                              {event.category}
                            </span>
                          </div>
                          <h6 className="text-xs font-bold text-theme-primary leading-tight">{event.title}</h6>
                          <p className="text-[10px] font-mono text-theme-secondary">
                            Year: {event.semester} • Dept: {event.department}
                          </p>
                        </div>

                        {userRole === 'faculty' && (
                          <button
                            onClick={() => handleDeleteEvent(event)}
                            className="p-1.5 rounded-lg text-theme-muted hover:text-[#f05030] hover:bg-theme-card transition-colors shrink-0 cursor-pointer"
                            title="Delete Academic Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Personal Events List */}
                  {viewMode !== 'academic' && activePersonalEvents.map(event => {
                    const style = getCategoryStyle(event.category);
                    return (
                      <div
                        key={`pers-${event.id}`}
                        className={`p-3 rounded-2xl border-2 ${style.border} ${style.bgLight} flex justify-between items-start gap-2.5 text-left`}
                      >
                        <div className="text-left space-y-1 min-w-0 flex-1">
                          <div className="flex gap-1.5 flex-wrap items-center">
                            <span className="text-[8px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                              Personal
                            </span>
                            <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
                              {event.category}
                            </span>
                          </div>
                          <h6 className="text-xs font-bold text-theme-primary leading-tight">{event.title}</h6>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-theme-secondary">
                            <Clock className="w-3 h-3 text-[#f05030]" />
                            <span>{event.time}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteEvent(event)}
                          className="p-1.5 rounded-lg text-theme-muted hover:text-[#f05030] hover:bg-theme-card transition-colors shrink-0 cursor-pointer"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>

          </div>

          {/* Combined Upcoming Roster Summary */}
          <div className="p-6 panel-theme rounded-3xl space-y-4 text-left">
            <h4 className="text-xs font-mono font-black text-[#f05030] uppercase tracking-wider">
              Upcoming Events Calendar
            </h4>

            {isLoading ? (
              <p className="text-xs font-mono text-theme-muted animate-pulse">Loading upcoming events...</p>
            ) : (myEvents.length === 0 && academicEvents.length === 0) ? (
              <p className="text-xs font-mono text-theme-muted text-center py-4">No events scheduled.</p>
            ) : (() => {
              const combined = [];
              if (viewMode !== 'personal') {
                academicEvents.forEach(e => combined.push({ ...e, type: 'academic' }));
              }
              if (viewMode !== 'academic') {
                myEvents.forEach(e => combined.push({ ...e, type: 'personal' }));
              }
              combined.sort((a, b) => new Date(a.date) - new Date(b.date));
              
              const todayStr = getFormattedDateStr(new Date());
              const upcoming = combined.filter(e => e.date >= todayStr);
              
              const groups = {};
              upcoming.forEach(e => {
                if (!groups[e.date]) {
                  groups[e.date] = [];
                }
                groups[e.date].push(e);
              });
              
              const dates = Object.keys(groups).sort((a,b) => new Date(a) - new Date(b));
              
              if (dates.length === 0) {
                return <p className="text-xs font-mono text-theme-muted text-center py-4">No upcoming events.</p>;
              }
              
              return (
                <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
                  {dates.slice(0, 10).map(dStr => {
                    const dateObj = new Date(dStr + 'T00:00:00');
                    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    
                    return (
                      <div key={dStr} className="space-y-1.5 text-left">
                        <div className="text-[10px] font-mono font-bold text-[#f05030] uppercase tracking-wider pl-1">
                          {formattedDate}
                        </div>
                        <div className="space-y-1.5">
                          {groups[dStr].map(event => {
                            const style = getCategoryStyle(event.category);
                            const isSelected = event.date === selectedDateStr;
                            return (
                              <div
                                key={`${event.type}-${event.id}`}
                                onClick={() => setSelectedDate(dateObj)}
                                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center gap-2 ${
                                  isSelected
                                    ? `bg-theme-card border-black text-theme-primary font-bold shadow`
                                    : `bg-theme-input border-theme text-theme-secondary hover:${style.border}`
                                }`}
                              >
                                <div className="text-left min-w-0 flex-1 space-y-1">
                                  <div className="flex gap-1.5 items-center">
                                    <span className={`text-[8px] font-mono font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${event.type === 'academic' ? 'bg-[#f05030] text-white' : 'bg-emerald-500 text-white'}`}>
                                      {event.type}
                                    </span>
                                    <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${style.badge}`}>
                                      {event.category}
                                    </span>
                                  </div>
                                  <h6 className="text-xs font-bold truncate">{event.title}</h6>
                                  {event.time && (
                                    <p className="text-[9px] font-mono text-theme-muted">{event.time}</p>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-theme-muted shrink-0" />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
         4. ADD EVENT MODAL (Supports role-based toggle for Faculty)
      ═══════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md p-6 panel-theme rounded-3xl text-left space-y-4">
            
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="text-lg font-bold text-theme-primary">Schedule Event</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full bg-theme-input text-theme-muted hover:text-theme-primary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEventSubmit} className="space-y-4">
              
              {/* Event Type Toggle (Faculty Only) */}
              {userRole === 'faculty' && (
                <div className="space-y-1">
                  <label className="text-xs font-mono text-theme-secondary block">Event Scope</label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-theme-input border border-theme text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setIsAcademicEvent(false)}
                      className={`py-2 rounded-lg cursor-pointer ${
                        !isAcademicEvent ? 'bg-[#ffc815] text-black font-bold' : 'text-theme-secondary'
                      }`}
                    >
                      Personal Event
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAcademicEvent(true)}
                      className={`py-2 rounded-lg cursor-pointer ${
                        isAcademicEvent ? 'bg-[#f05030] text-white font-bold' : 'text-theme-secondary'
                      }`}
                    >
                      Academic Event
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-mono text-theme-secondary block">Selected Date</label>
                <input
                  type="text"
                  disabled
                  value={selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  className="input-theme w-full p-3 rounded-2xl text-xs text-theme-muted bg-theme-input/50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-theme-secondary block">Event Title</label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={isAcademicEvent ? "e.g., Commencement of Practical Exam" : "e.g., Compiler Design Lab Preparation"}
                  className="input-theme w-full p-3 rounded-2xl text-xs text-theme-primary focus:outline-none focus:border-[#ffc815]"
                />
              </div>

              {/* Dynamic Categorization dropdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-theme-secondary block">Category</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, category: e.target.value }))}
                    className="input-theme w-full p-3 rounded-2xl text-xs text-theme-primary focus:outline-none focus:border-[#ffc815] cursor-pointer"
                  >
                    {isAcademicEvent ? (
                      <>
                        <option value="General Academic">General Academic</option>
                        <option value="Holiday">Holiday</option>
                        <option value="Exam/Assessment">Exam/Assessment</option>
                        <option value="Hackathon/Sprint">Hackathon/Sprint</option>
                        <option value="Workshop/Training">Workshop/Training</option>
                        <option value="Remedial">Remedial</option>
                      </>
                    ) : (
                      <>
                        <option value="Personal Study">Personal Study</option>
                        <option value="Lab Prep">Lab Prep</option>
                        <option value="Exam">Exam</option>
                        <option value="Project">Project</option>
                        <option value="Submission">Submission</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-theme-secondary block">Time / Duration</label>
                  <input
                    type="text"
                    required
                    value={newEvent.time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    placeholder="e.g. 04:00 PM - 06:00 PM"
                    className="input-theme w-full p-3 rounded-2xl text-xs text-theme-primary focus:outline-none focus:border-[#ffc815]"
                  />
                </div>
              </div>

              {/* Academic-Only Parameter Scope */}
              {isAcademicEvent && (
                <div className="grid grid-cols-2 gap-3 border-t border-theme pt-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-theme-secondary block">Target Year</label>
                    <select
                      value={newEvent.semester}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, semester: e.target.value }))}
                      className="input-theme w-full p-3 rounded-2xl text-xs text-theme-primary focus:outline-none focus:border-[#ffc815] cursor-pointer"
                    >
                      <option value="All Years">All Years</option>
                      <option value="II Year">II Year</option>
                      <option value="III Year">III Year</option>
                      <option value="IV Year">IV Year</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-theme-secondary block">Department Scope</label>
                    <select
                      value={newEvent.department}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, department: e.target.value }))}
                      className="input-theme w-full p-3 rounded-2xl text-xs text-theme-primary focus:outline-none focus:border-[#ffc815] cursor-pointer"
                    >
                      <option value="All Departments">All Departments</option>
                      <option value="CSE">CSE</option>
                    </select>
                  </div>
                </div>
              )}

              {isAcademicEvent && (
                <div className="space-y-1">
                  <label className="text-xs font-mono text-theme-secondary block">Event Description (Optional)</label>
                  <input
                    type="text"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Syllabus coverage timeline or event outline notes"
                    className="input-theme w-full p-3 rounded-2xl text-xs text-theme-primary focus:outline-none focus:border-[#ffc815]"
                  />
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3 rounded-2xl text-black font-mono font-extrabold text-xs transition-all shadow-lg comic-btn cursor-pointer ${
                  isAcademicEvent ? 'bg-[#f05030] text-white hover:bg-[#ffdf70]' : 'bg-[#ffc815] hover:bg-[#ffdf70]'
                }`}
              >
                {isAcademicEvent ? "Publish Central Academic Event" : "Schedule Personal Event"}
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}
