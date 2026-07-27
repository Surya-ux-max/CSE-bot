import React, { useState, useEffect, useRef } from 'react'
import { Send, Sun, Moon, Sparkles, RotateCcw, ArrowLeft, Bot, X } from 'lucide-react'
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
  const [showMobileRobot, setShowMobileRobot] = useState(false)
  const [sessionId] = useState(() => SessionManager.generateSessionId())
  
  const messagesEndRef = useRef(null)
  const formatContent = useFormatContent()

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const quickPrompts = [
    { category: 'Faculty & Governance', query: 'Who is the Head of the Department?' },
    { category: 'Curriculum & Syllabus', query: 'Syllabus details for Cloud Computing?' },
    { category: 'CS Programming Tutor', query: 'Explain quicksort algorithm in C++' },
    { category: 'Career & Placements', query: 'What hackathons & CoE labs are available?' }
  ]

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
    <div className={`h-dvh w-full overflow-hidden flex relative transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Floating Math Formulas & Grid Background */}
      <TechBackground />

      {/* ═══════════════════════════════════════════════════════════════
         LEFT COLUMN: CHAT & INTERACTIONS STREAM (Full Height Mobile & Desktop)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-3/5 h-full flex flex-col relative z-10 border-r border-brand-border/60">
        
        {/* Header */}
        <header className="nav-glass px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-brand-border flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400 hover:text-slate-950 font-bold text-xs transition-all shadow-md shrink-0"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Landing Page</span>
              <span className="inline sm:hidden">Home</span>
            </button>

            <div className="min-w-0 truncate">
              <h1 className="font-display text-lg sm:text-xl font-bold tracking-wider truncate" style={{ color: 'var(--text-primary)' }}>
                CSE VIRTUAL ROBOT
              </h1>
              <p className="text-[10px] sm:text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                Sri Eshwar College of Engineering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile Robot Toggle Button (< lg) */}
            <button
              onClick={() => setShowMobileRobot(true)}
              className="lg:hidden p-2 rounded-xl border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 transition-all shadow-md relative"
              title="View CSE Robot"
            >
              <Bot className="w-4 h-4" />
              {isTyping && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-brand-border bg-brand-light hover:border-amber-500 text-gray-300 hover:text-amber-500 transition-all shadow-md"
              style={{ color: 'var(--text-secondary)' }}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Main Chat Stream */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            /* Welcome prompt cards view when stream is empty */
            <div className="h-full flex flex-col justify-center max-w-xl mx-auto space-y-4 sm:space-y-6 animate-fade-in py-4">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-500 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Multi-Agent AI Active
                </div>

                <h3 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Ask <span className="text-amber-400">CSE Virtual Robot</span>
                </h3>

                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed px-2">
                  Click a sample question below or type your query. The system will route your question to the specialized agent.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.query)}
                    className="p-3.5 rounded-2xl text-left border border-brand-border bg-brand-light hover:border-amber-500/60 transition-all group cursor-pointer active:scale-[0.98]"
                  >
                    <span className="text-[11px] font-mono font-semibold text-amber-400 block mb-1">
                      {item.category}
                    </span>
                    <p className="text-xs font-medium group-hover:text-amber-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      "{item.query}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Robot Mini Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex-shrink-0 flex items-center justify-center p-0.5 overflow-hidden shadow-md">
                    <img src={roboImg} alt="Bot" className="w-full h-full object-cover rounded-lg" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-5 shadow-lg border text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-400 text-slate-950 font-semibold border-amber-300 rounded-tr-none shadow-amber-500/10'
                      : 'bg-brand-light border-brand-border rounded-tl-none'
                  }`}
                  style={msg.role === 'assistant' ? { color: 'var(--text-primary)' } : {}}
                >
                  {msg.role === 'assistant' && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-amber-400/10 text-amber-500 border border-amber-400/20">
                        ⚡ {msg.agentName || 'reception_agent'}
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
            ))
          )}

          {/* Reckoning Tool Loading Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2.5 px-2 py-2 animate-fade-in">
              <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-xs sm:text-sm font-sans font-medium tracking-wide flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                Reckoning
                <span className="text-[11px] sm:text-xs font-mono text-amber-500 font-normal">
                  ({callingAgent || 'reception_agent'})
                </span>
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Bottom Input Bar */}
        <footer className="p-3 sm:p-5 pb-safe border-t border-brand-border bg-brand-dark/90 backdrop-blur-xl flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-brand-light border border-brand-border focus-within:border-amber-400/60 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all shadow-2xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CSE Virtual Robot anything..."
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent text-base sm:text-sm focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
            />

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 sm:p-2.5 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all shrink-0"
                title="Clear current conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`p-2.5 sm:p-3 rounded-xl font-medium transition-all shrink-0 ${
                input.trim() && !isTyping
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-400/20 scale-100'
                  : 'bg-brand-border text-gray-400 cursor-not-allowed scale-95'
              }`}
            >
              <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </form>
        </footer>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
         RIGHT COLUMN: FULL VIRTUAL ROBOT DISPLAY (Desktop Large Viewport)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex w-2/5 h-full relative z-10 flex-col items-center justify-center p-8 bg-gradient-to-l from-black/20 via-transparent to-transparent">
        
        <div className="relative flex flex-col items-center justify-center max-h-[85vh] w-full">
          
          {/* Ambient Cyber Aura Glow behind Robo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-cyan-500/15 to-amber-500/20 blur-3xl opacity-80 animate-roboGlow" />
          
          {/* Full Robot Image Display Container */}
          <div className="relative max-h-[65vh] w-auto max-w-full flex items-center justify-center p-4 animate-roboFloat">
            <img
              src={roboImg}
              alt="Virtual Robot"
              className="max-h-[60vh] w-auto object-contain filter drop-shadow-[0_20px_40px_rgba(255,193,7,0.35)]"
            />

            {/* Laser scanning line when processing */}
            {isTyping && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/25 to-transparent animate-roboScan pointer-events-none rounded-3xl" />
            )}
          </div>

          {/* Live Robot State Status Pill */}
          <div className="mt-6 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-brand-light/90 border border-brand-border shadow-2xl backdrop-blur-md">
            <span className={`w-3 h-3 rounded-full ${isTyping ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-xs font-mono tracking-wide font-medium" style={{ color: 'var(--text-primary)' }}>
              {isTyping
                ? `Reckoning (${callingAgent})...`
                : 'CSE Virtual Robot Online'}
            </span>
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
         MOBILE ROBOT DRAWER / MODAL (< lg Viewports)
      ═══════════════════════════════════════════════════════════════ */}
      {showMobileRobot && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-brand-dark border border-brand-border rounded-3xl p-6 flex flex-col items-center shadow-2xl space-y-4">
            <button
              onClick={() => setShowMobileRobot(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-brand-light text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-display text-2xl font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
                CSE VIRTUAL ROBOT
              </h3>
              <p className="text-xs text-amber-400 font-mono">Department Multi-Agent Assistant</p>
            </div>

            <div className="relative w-full h-56 flex items-center justify-center animate-roboFloat">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-cyan-500/15 to-amber-500/20 blur-2xl opacity-80" />
              <img
                src={roboImg}
                alt="Virtual Robot"
                className="h-48 w-auto object-contain filter drop-shadow-[0_10px_25px_rgba(255,193,7,0.35)]"
              />
              {isTyping && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-400/25 to-transparent animate-roboScan pointer-events-none rounded-2xl" />
              )}
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-brand-light border border-brand-border shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${isTyping ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
                {isTyping ? `Reckoning (${callingAgent})...` : 'CSE Virtual Robot Online'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
