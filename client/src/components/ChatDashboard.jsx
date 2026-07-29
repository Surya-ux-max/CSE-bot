import React, { useState, useEffect, useRef } from 'react'
import { Send, Sun, Moon, Sparkles, RotateCcw, ArrowLeft, Bot, X, Users, BookOpen, Terminal, Rocket, CheckCircle2, Mic, MicOff } from 'lucide-react'
import { animate, stagger } from 'animejs'
import roboImg from '../reference/robo.png'
import TechBackground from './TechBackground'
import { useFormatContent } from './FormatContent'
import { ChatMessage } from '../models/ChatMessage'
import { apiClient } from '../services/ApiClient'
import { SessionManager } from '../services/SessionManager'
import { startSpeechToText } from '../services/speech'

export default function ChatDashboard({ onBackToHome, theme, setTheme, currentUser }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [callingAgent, setCallingAgent] = useState('agent')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [showMobileRobot, setShowMobileRobot] = useState(false)
  const [sessionId] = useState(() => SessionManager.generateSessionId())
  
  const user = currentUser || {
    name: 'Suryaprakash S',
    email: 'suryaprakash.s.d@csebot.edu',
    role: 'student'
  }
  
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

  const isPlacementCell = user?.email?.toLowerCase().includes('placement') ||
                          user?.designation?.toLowerCase().includes('placement') ||
                          user?.role === 'placement_cell'

  const agentChips = isPlacementCell ? [
    { id: 'all', name: 'Chitti AI', icon: <Bot className="w-3.5 h-3.5 text-[#ffc815]" /> },
    { id: 'placement_agent', name: 'Placement Agent', icon: <Rocket className="w-3.5 h-3.5 text-[#f05030]" /> },
    { id: 'hackathon_agent', name: 'Hackathon Agent', icon: <Terminal className="w-3.5 h-3.5 text-[#ffc815]" /> },
  ] : [
    { id: 'all', name: 'All Agents', icon: <Bot className="w-3.5 h-3.5" /> },
    { id: 'faculty_agent', name: 'Faculty', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'curriculum_agent', name: 'Curriculum', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'tutor_agent', name: 'Coding Tutor', icon: <Terminal className="w-3.5 h-3.5" /> },
  ]

  const quickPrompts = isPlacementCell ? [
    { agentKey: 'placement_agent', category: 'Placement Announcement', query: 'Search for the latest Amazon Placement Drive details and generate a copy-ready announcement template' },
    { agentKey: 'hackathon_agent', category: 'SIH Announcement', query: 'Search Smart India Hackathon (SIH 2026) details and draft a copy-ready student announcement template' },
    { agentKey: 'placement_agent', category: 'Placement Stats', query: 'What are the placement statistics and top recruiting companies?' },
    { agentKey: 'hackathon_agent', category: 'Google Challenge', query: 'Search Google Solution Challenge registration details and draft a copy-ready broadcast template' }
  ] : [
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
      const data = await apiClient.sendQuestion(query, sessionId, user.email, user.role || 'student')
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffc815]/10 border border-[#ffc815]/30 text-[#ffc815] hover:bg-[#ffc815] hover:text-black font-bold text-xs transition-all shadow-sm shrink-0 spring-button cursor-pointer"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Landing Page</span>
            <span className="inline sm:hidden">Home</span>
          </button>

          <div className="min-w-0 truncate">
            <h1 className="font-display text-base sm:text-lg font-extrabold tracking-wider truncate" style={{ color: 'var(--text-primary)' }}>
              CHITTI <span className="text-[#f05030]">ROBOT</span>
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
            className="p-2 rounded-full border border-brand-border bg-brand-light hover:border-[#ffc815] transition-all shadow-md spring-button"
            style={{ color: 'var(--text-secondary)' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#ffc815]" /> : <Moon className="w-4 h-4 text-[#f05030]" />}
          </button>
        </div>

      </header>

      {/* ═══════════════════════════════════════════════════════════════
         2. DEDICATED CHAT INTERFACE WORKSPACE CONTAINER (Separated)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="w-full max-w-5xl flex-1 flex flex-col relative z-10 mx-auto px-2 sm:px-4 py-2 sm:py-4 overflow-hidden">
        
        <div className="w-full h-full flex flex-col rounded-3xl border border-brand-border/80 bg-brand-light/30 backdrop-blur-md shadow-2xl overflow-hidden">
          
          {/* Specialized Agent Chips Filter Bar inside Chat Container */}
          <div className="anime-dash-item opacity-0 px-4 sm:px-6 py-2.5 border-b border-brand-border/60 bg-brand-dark/40 flex items-center gap-2 overflow-x-auto scrollbar-none flex-shrink-0 text-left">
            <span className="text-[10px] font-mono uppercase tracking-widest shrink-0 hidden xs:inline font-extrabold" style={{ color: 'var(--text-secondary)' }}>Filter Agent Context:</span>
            {agentChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedAgent(chip.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all shrink-0 spring-button cursor-pointer backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc815] ${
                  selectedAgent === chip.id
                    ? 'bg-[#ffc815] text-black shadow-md border-2 border-black font-bold scale-105'
                    : 'bg-brand-light border border-brand-border hover:text-[#ffc815] hover:border-[#ffc815]/40 hover:text-theme-primary'
                }`}
                style={selectedAgent !== chip.id ? { color: 'var(--text-primary)' } : {}}
                aria-label={`Filter chat context by ${chip.name}`}
              >
                {chip.icon}
                <span>{chip.name}</span>
              </button>
            ))}
          </div>

          {/* Main Chat Stream (With Proper Spacing & No Card Clipping) */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
            {messages.length === 0 ? (
              /* ─── Simplified Welcome View ─── */
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-8 sm:py-16 my-auto relative overflow-hidden max-w-2xl mx-auto">
                <div className="anime-dash-item opacity-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#ffc815]/20 border border-[#ffc815]/40 flex items-center justify-center shadow-lg text-[#f05030] relative">
                  <Bot className="w-12 h-12 sm:w-16 sm:h-16 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                </div>
                
                <div className="anime-dash-item opacity-0 space-y-3 z-10 px-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffc815]/15 border border-[#ffc815]/30 text-xs font-mono text-[#f05030] font-extrabold shadow-sm">
                    <Bot className="w-4 h-4" />
                    <span>SECE CSE • MULTI-AGENTS ACTIVE</span>
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
                    Chitti AI <span className="text-[#ffc815] font-serif italic font-normal">Workspace</span>
                  </h2>

                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-theme-secondary max-w-md mx-auto">
                    Welcome to the CSE Multi-Agent Platform. Converse with Chitti in natural language to search department directories, curriculum details, or CS algorithm explanations.
                  </p>
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
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#ffc815]/20 border border-[#ffc815]/40 flex-shrink-0 flex items-center justify-center shadow-md text-[#f05030] font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] p-4 sm:p-5 shadow-xl border text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#ffc815] text-black font-semibold border-black rounded-3xl rounded-tr-sm'
                          : 'bg-brand-light border-brand-border rounded-3xl rounded-tl-sm'
                      }`}
                      style={msg.role === 'assistant' ? { color: 'var(--text-primary)' } : {}}
                    >
                      {msg.role === 'assistant' && (
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[#ffc815]/10 text-[#f05030] border border-[#ffc815]/20 shadow-sm">
                            <Bot className="w-3 h-3 text-[#f05030] shrink-0" />
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
              <div className="flex items-center gap-2.5 px-4 py-2.5 animate-fade-in bg-[#ffc815]/10 backdrop-blur-md rounded-full border border-[#ffc815]/30 max-w-fit shadow-lg">
                <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#f05030] animate-spin" style={{ animationDuration: '2.5s' }} />
                <span className="text-xs sm:text-sm font-sans font-medium tracking-wide flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  Reckoning
                  <span className="text-[11px] sm:text-xs font-mono text-[#f05030] font-bold">
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
              className="relative flex items-center p-2 rounded-full bg-brand-light/95 border border-brand-border shadow-xl transition-all max-w-3xl mx-auto focus-within:border-[#ffc815]/60"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Chitti the Robot anything..."
                className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 bg-transparent text-sm sm:text-base focus:outline-none placeholder-gray-400"
                style={{ color: 'var(--text-primary)' }}
              />

              <button
                type="button"
                onClick={() => {
                  if (isListening) return;
                  startSpeechToText(
                    (transcript) => setInput(prev => (prev ? prev + ' ' : '') + transcript),
                    setIsListening,
                    user.email
                  );
                }}
                className={`p-2.5 rounded-full transition-all shrink-0 spring-button mr-1 ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                    : 'text-gray-400 hover:text-[#ffc815] hover:bg-gray-100/10'
                }`}
                title={isListening ? "Listening..." : "Dictate query"}
              >
                {isListening ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
              </button>

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
                    ? 'bg-[#ffc815] text-black shadow-lg scale-105 cursor-pointer'
                    : 'bg-brand-border text-gray-400 cursor-not-allowed scale-95'
                }`}
              >
                <Send className="w-4.5 h-4.5 text-black" />
              </button>
            </form>
          </footer>

        </div>

      </div>

    </div>
  )
}
