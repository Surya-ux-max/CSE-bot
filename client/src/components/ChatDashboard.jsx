import React, { useState, useEffect, useRef } from 'react'
import { Send, Sun, Moon, Sparkles, RotateCcw, ArrowLeft, Bot, X, Users, BookOpen, Terminal, Rocket, CheckCircle2 } from 'lucide-react'
import { animate, stagger } from 'animejs'
import roboImg from '../reference/robo.png'
import TechBackground from './TechBackground'
import { useFormatContent } from './FormatContent'
import { ChatMessage } from '../models/ChatMessage'
import { apiClient } from '../services/ApiClient'
import { SessionManager } from '../services/SessionManager'

export default function ChatDashboard({ onBackToHome, theme, setTheme }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [callingAgent, setCallingAgent] = useState('agent')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [showMobileRobot, setShowMobileRobot] = useState(false)
  const [sessionId] = useState(() => SessionManager.generateSessionId())
  
  const messagesEndRef = useRef(null)
  const dashboardRef = useRef(null)
  const hasAnimatedRef = useRef(false)
  const formatContent = useFormatContent()

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // AnimeJS Initial Staggered Mount Animation (Runs ONLY ONCE for GPU smoothness)
  useEffect(() => {
    if (!dashboardRef.current || hasAnimatedRef.current) return
    hasAnimatedRef.current = true
    const elements = dashboardRef.current.querySelectorAll('.anime-dash-item')
    if (elements.length > 0) {
      animate(elements, {
        translateY: [14, 0],
        opacity: [0, 1],
        delay: stagger(50),
        duration: 450,
        ease: 'outQuart'
      })
    }
  }, [])

  // AnimeJS Message Bubble Elastic Spring Animation on New Message
  useEffect(() => {
    if (messages.length === 0 || !dashboardRef.current) return
    const latestBubble = dashboardRef.current.querySelector('.anime-latest-msg')
    if (latestBubble) {
      animate(latestBubble, {
        translateY: [12, 0],
        scale: [0.98, 1],
        opacity: [0.3, 1],
        duration: 350,
        ease: 'outQuad'
      })
    }
  }, [messages])

  const agentChips = [
    { id: 'all', name: 'All Agents', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'faculty_agent', name: 'Faculty', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'curriculum_agent', name: 'Curriculum', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'tutor_agent', name: 'Coding Tutor', icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: 'placement_agent', name: 'Career & CoE', icon: <Rocket className="w-3.5 h-3.5" /> },
  ]

  const quickPrompts = [
    { agentKey: 'faculty_agent', category: 'Faculty Directory', query: 'Who is the Head of the Department?' },
    { agentKey: 'curriculum_agent', category: 'Curriculum & Syllabus', query: 'Syllabus details for Cloud Computing?' },
    { agentKey: 'tutor_agent', category: 'CS Programming Tutor', query: 'Explain quicksort algorithm in C++' },
    { agentKey: 'placement_agent', category: 'Career & Placements', query: 'What hackathons & CoE labs are available?' }
  ]

  const filteredPrompts = selectedAgent === 'all' 
    ? quickPrompts 
    : quickPrompts.filter(p => p.agentKey === selectedAgent)

  const handleSend = async (textToSend = input) => {
    const query = textToSend.trim()
    if (!query || isTyping) return

    const userMsg = ChatMessage.createUserMessage(query)
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const estimatedAgent = SessionManager.estimateAgent(query)
    setCallingAgent(estimatedAgent)

    try {
      const data = await apiClient.sendQuestion(query, sessionId)
      const botMsg = ChatMessage.createAssistantMessage(data.answer, data.agentName)
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      console.error('Error sending message:', err)
      const errorMsg = ChatMessage.createAssistantMessage(
        "⚠️ I encountered an error connecting to the Virtual Robot server. Please check your backend connection.",
        "reception_agent"
      )
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleClear = () => {
    apiClient.clearSession(sessionId)
    setMessages([])
  }

  return (
    <div ref={dashboardRef} className={`h-dvh w-full overflow-hidden flex flex-col relative transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Floating Math Formulas & Grid Background */}
      <TechBackground />

      {/* ═══════════════════════════════════════════════════════════════
         1. STANDALONE TOP HEADER NAVIGATION BAR (Separated from Chat)
      ═══════════════════════════════════════════════════════════════ */}
      <header className="anime-dash-item opacity-0 w-full border-b border-brand-border/80 bg-brand-light/95 backdrop-blur-md z-30 flex-shrink-0 px-4 py-2.5 sm:px-8 sm:py-3 shadow-md flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400 hover:text-slate-950 font-bold text-xs transition-all shadow-sm shrink-0 spring-button cursor-pointer"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing Page</span>
            <span className="inline sm:hidden">Home</span>
          </button>

          <div className="min-w-0 truncate">
            <h1 className="font-display text-base sm:text-lg font-extrabold tracking-wider truncate" style={{ color: 'var(--text-primary)' }}>
              CHITTI <span className="text-amber-400">ROBOT</span>
            </h1>
            <p className="text-[10px] sm:text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
              Sri Eshwar College of Engineering • Speed 1 THz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Clear History Button (when active chat) */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white font-mono text-xs transition-all shadow-sm spring-button cursor-pointer"
              title="Clear conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full border border-brand-border bg-brand-light hover:border-amber-400 transition-all shadow-md spring-button"
            style={{ color: 'var(--text-secondary)' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

      </header>

      {/* ═══════════════════════════════════════════════════════════════
         2. DEDICATED CHAT INTERFACE WORKSPACE CONTAINER (Separated)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="w-full max-w-5xl flex-1 flex flex-col relative z-10 mx-auto px-2 sm:px-4 py-2 sm:py-4 overflow-hidden">
        
        <div className="w-full h-full flex flex-col rounded-3xl border border-brand-border/80 bg-brand-light/30 backdrop-blur-md shadow-2xl overflow-hidden">
          
          {/* Specialized Agent Chips Filter Bar inside Chat Container */}
          <div className="anime-dash-item opacity-0 px-4 sm:px-6 py-2.5 border-b border-brand-border/60 bg-brand-dark/40 flex items-center gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-widest shrink-0 hidden xs:inline" style={{ color: 'var(--text-secondary)' }}>Agents:</span>
            {agentChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedAgent(chip.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all shrink-0 spring-button cursor-pointer backdrop-blur-md ${
                  selectedAgent === chip.id
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-bold'
                    : 'bg-brand-light border border-brand-border hover:text-amber-400 hover:border-amber-400/40'
                }`}
                style={selectedAgent !== chip.id ? { color: 'var(--text-primary)' } : {}}
              >
                {chip.icon}
                <span>{chip.name}</span>
              </button>
            ))}
          </div>

          {/* Main Chat Stream (With Proper Spacing & No Card Clipping) */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
            {messages.length === 0 ? (
              /* ─── COLORFUL FLOATING CARDS WELCOME VIEW (Proper Spacing & GPU Fast) ─── */
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-4 sm:py-8 my-auto relative overflow-hidden">
                
                {/* Colorful Tilted Cards Orbiting Welcome Headline */}
                <div className="relative w-full max-w-4xl flex flex-col items-center justify-center space-y-4 sm:space-y-6 pt-2">
                  
                  {/* Floating Colorful Cards Row 1 */}
                  <div className="w-full flex items-center justify-between gap-3 px-2 sm:px-6 pointer-events-none">
                    
                    {/* Card 1: Emerald Green Tilted */}
                    <div className="anime-dash-item opacity-0 p-3 sm:p-4 rounded-2xl bg-emerald-600 text-white shadow-xl transform -rotate-6 hover:rotate-0 transition-transform duration-300 pointer-events-auto cursor-pointer max-w-[210px] text-left" style={{ willChange: 'transform' }} onClick={() => handleSend("Who is the Head of the Department?")}>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold mb-1">
                        <Users className="w-4 h-4" />
                        <span>01 FACULTY</span>
                      </div>
                      <p className="text-[11px] font-medium leading-tight">Head of Dept, Professors & Contacts</p>
                    </div>

                    {/* Card 2: Crimson Red Tilted */}
                    <div className="anime-dash-item opacity-0 p-3 sm:p-4 rounded-2xl bg-rose-600 text-white shadow-xl transform rotate-6 hover:rotate-0 transition-transform duration-300 pointer-events-auto cursor-pointer max-w-[210px] text-left" style={{ willChange: 'transform' }} onClick={() => handleSend("Syllabus details for Cloud Computing?")}>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold mb-1">
                        <BookOpen className="w-4 h-4" />
                        <span>02 CURRICULUM</span>
                      </div>
                      <p className="text-[11px] font-medium leading-tight">Semesters, Electives & Syllabi</p>
                    </div>

                  </div>

                  {/* Main Headline */}
                  <div className="anime-dash-item opacity-0 space-y-2 z-10 px-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-xs font-mono text-amber-400 font-extrabold shadow-md">
                      <Bot className="w-4 h-4" />
                      <span>SECE CSE • 5 MULTI-AGENTS</span>
                    </div>

                    <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                      What's Next <span className="text-amber-400 font-serif italic font-normal">Big Idea!</span>
                    </h2>

                    <p className="text-xs sm:text-base font-medium max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Ask Chitti anything about faculty, semester course syllabi, algorithm code explanations, and placement prep.
                    </p>
                  </div>

                  {/* Floating Colorful Cards Row 2 */}
                  <div className="w-full flex items-center justify-between gap-3 px-2 sm:px-6 pointer-events-none">
                    
                    {/* Card 3: Amber Yellow Tilted */}
                    <div className="anime-dash-item opacity-0 p-3 sm:p-4 rounded-2xl bg-amber-500 text-slate-950 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300 pointer-events-auto cursor-pointer max-w-[210px] text-left" style={{ willChange: 'transform' }} onClick={() => handleSend("Explain quicksort algorithm in C++")}>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-extrabold mb-1">
                        <Terminal className="w-4 h-4" />
                        <span>03 CODE TUTOR</span>
                      </div>
                      <p className="text-[11px] font-semibold leading-tight">Data Structures & Algo Solutions</p>
                    </div>

                    {/* Card 4: Magenta Pink Tilted */}
                    <div className="anime-dash-item opacity-0 p-3 sm:p-4 rounded-2xl bg-fuchsia-600 text-white shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300 pointer-events-auto cursor-pointer max-w-[210px] text-left" style={{ willChange: 'transform' }} onClick={() => handleSend("What hackathons & CoE labs are available?")}>
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold mb-1">
                        <Rocket className="w-4 h-4" />
                        <span>04 PLACEMENTS</span>
                      </div>
                      <p className="text-[11px] font-medium leading-tight">CoE Labs & Career Highlights</p>
                    </div>

                  </div>

                </div>

                {/* Sample Prompt Quick Click Cards */}
                <div className="anime-dash-item opacity-0 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl pt-2">
                  {(filteredPrompts.length > 0 ? filteredPrompts : quickPrompts).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.query)}
                      className="p-3.5 rounded-2xl text-left border border-brand-border bg-brand-light/95 backdrop-blur-md hover:border-amber-400/60 transition-all group cursor-pointer active:scale-[0.98] shadow-md spring-button"
                    >
                      <span className="text-[11px] font-mono font-semibold text-amber-400 block mb-1">
                        {item.category}
                      </span>
                      <p className="text-xs sm:text-sm font-medium group-hover:text-amber-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                        "{item.query}"
                      </p>
                    </button>
                  ))}
                </div>

              </div>
            ) : (
              /* ─── ACTIVE CHAT STREAM (Floating Cards Vanish) ─── */
              messages.map((msg, index) => {
                const isLatest = index === messages.length - 1
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 sm:gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${isLatest ? 'anime-latest-msg' : ''}`}
                  >
                    {/* Assistant Avatar */}
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-400/20 border border-amber-400/40 flex-shrink-0 flex items-center justify-center shadow-md text-amber-400 font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] p-4 sm:p-5 shadow-xl border text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-amber-400 text-slate-950 font-semibold border-amber-300 rounded-3xl rounded-tr-sm shadow-amber-500/10'
                          : 'bg-brand-light border-brand-border rounded-3xl rounded-tl-sm'
                      }`}
                      style={msg.role === 'assistant' ? { color: 'var(--text-primary)' } : {}}
                    >
                      {msg.role === 'assistant' && (
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20 shadow-sm">
                            <Bot className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{msg.agentName || 'reception_agent'}</span>
                          </span>
                        </div>
                      )}
                      {msg.role === 'assistant' ? (
                        formatContent(msg.content)
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}

            {/* Reckoning Tool Loading Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2.5 px-4 py-2.5 animate-fade-in bg-amber-400/10 backdrop-blur-md rounded-full border border-amber-400/30 max-w-fit shadow-lg">
                <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400 animate-spin" style={{ animationDuration: '2.5s' }} />
                <span className="text-xs sm:text-sm font-sans font-medium tracking-wide flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  Reckoning
                  <span className="text-[11px] sm:text-xs font-mono text-amber-400 font-bold">
                    ({callingAgent || 'reception_agent'})
                  </span>
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </main>

          {/* Floating Bottom Input Pill Bar inside Chat Box */}
          <footer className="anime-dash-item opacity-0 p-3 sm:p-4 pb-safe border-t border-brand-border/60 bg-brand-dark/30 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="relative flex items-center p-2 rounded-full bg-brand-light/95 border border-brand-border shadow-xl transition-all max-w-3xl mx-auto focus-within:border-amber-400/60"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Chitti the Robot anything..."
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 bg-transparent text-sm sm:text-base focus:outline-none placeholder-gray-400"
                style={{ color: 'var(--text-primary)' }}
              />

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2.5 rounded-full text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0 spring-button mr-1"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 spring-button ${
                  input.trim() && !isTyping
                    ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-105 cursor-pointer'
                    : 'bg-brand-border text-gray-400 cursor-not-allowed scale-95'
                }`}
              >
                <Send className="w-4.5 h-4.5 text-slate-950" />
              </button>
            </form>
          </footer>

        </div>

      </div>

    </div>
  )
}
