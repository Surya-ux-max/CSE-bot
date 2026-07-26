import React, { useState, useEffect, useRef } from 'react'
import { Send, Sun, Moon, Sparkles, RotateCcw, ArrowLeft } from 'lucide-react'
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
    <div className={`h-screen w-screen overflow-hidden flex relative transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Floating Math Formulas & Grid Background */}
      <TechBackground />

      {/* ═══════════════════════════════════════════════════════════════
         LEFT COLUMN: CHAT & INTERACTIONS STREAM (Full Height)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-3/5 h-full flex flex-col relative z-10 border-r border-brand-border/60">
        
        {/* Header */}
        <header className="nav-glass px-6 py-4 flex items-center justify-between border-b border-brand-border">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 hover:bg-amber-400 hover:text-slate-950 font-bold text-xs transition-all shadow-md"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Landing Page
            </button>

            <div>
              <h1 className="font-display text-xl font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>CSE VIRTUAL ROBOT</h1>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sri Eshwar College of Engineering • Department AI</p>
            </div>
          </div>

          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-brand-border bg-brand-light hover:border-amber-500 text-gray-300 hover:text-amber-500 transition-all shadow-md"
            style={{ color: 'var(--text-secondary)' }}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>

        {/* Main Chat Stream */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            /* Welcome prompt cards view when stream is empty */
            <div className="h-full flex flex-col justify-center max-w-xl mx-auto space-y-6 animate-fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-500 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Multi-Agent AI Active
                </div>

                <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Ask <span className="text-amber-400">CSE Virtual Robot</span>
                </h3>

                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  Click a sample question below or type your query. The system will route your question to the specialized agent.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.query)}
                    className="p-3.5 rounded-2xl text-left border border-brand-border bg-brand-light hover:border-amber-500/60 transition-all group cursor-pointer"
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
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Robot Mini Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex-shrink-0 flex items-center justify-center p-0.5 overflow-hidden shadow-md">
                    <img src={roboImg} alt="Bot" className="w-full h-full object-cover rounded-lg" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-lg border text-sm leading-relaxed ${
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
              <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-sm font-sans font-medium tracking-wide flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                Reckoning
                <span className="text-xs font-mono text-amber-500 font-normal">
                  ({callingAgent || 'reception_agent'})
                </span>
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Bottom Input Bar */}
        <footer className="p-5 border-t border-brand-border bg-brand-dark/90 backdrop-blur-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2 p-2 rounded-2xl bg-brand-light border border-brand-border focus-within:border-amber-400/60 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all shadow-2xl"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CSE Virtual Robot anything..."
              className="flex-1 px-4 py-3 bg-transparent text-sm focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
            />

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2.5 rounded-xl text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title="Clear current conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className={`p-3 rounded-xl font-medium transition-all ${
                input.trim() && !isTyping
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-400/20 scale-100'
                  : 'bg-brand-border text-gray-400 cursor-not-allowed scale-95'
              }`}
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </footer>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
         RIGHT COLUMN: FULL VIRTUAL ROBOT DISPLAY (Right Side of Screen)
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

    </div>
  )
}
