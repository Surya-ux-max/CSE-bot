import React, { useState, useEffect, useRef } from 'react'
import { Send, RotateCcw, Bot, Sparkles, Mic, MicOff } from 'lucide-react'
import { animate, stagger } from 'animejs'
import DashboardLayout from '../components/DashboardLayout'
import { useFormatContent } from '../components/FormatContent'
import { ChatMessage } from '../models/ChatMessage'
import { apiClient } from '../services/ApiClient'
import { SessionManager } from '../services/SessionManager'
import { startSpeechToText } from '../services/speech'

export default function Dashboard({ theme, setTheme, currentUser, onBackToHome }) {
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
    role: 'student',
    year: '3rd Year'
  }

  // Chat State
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [sessionId] = useState(() => (
    SessionManager.getSessionId 
      ? SessionManager.getSessionId('student_dashboard') 
      : SessionManager.generateSessionId()
  ))

  const messagesEndRef = useRef(null)
  const listRef = useRef(null)
  const formatContent = useFormatContent()

  // Initial Chitti Welcome Message
  useEffect(() => {
    const isFaculty = student.role === 'faculty'
    const welcomeMsg = isFaculty
      ? `Vanakkam & Welcome, Professor **${student.name}**! 🤖\n\nI am **Chitti**, your Multi-Agent AI assistant for department governance and curriculum support.\n\nHow can I assist you today with syllabus review, lesson plans, class schedules, or committee coordination?`
      : `Vanakkam & Welcome, **${student.name}**! 🤖\n\nI am **Chitti**, your Intelligent CSE Department Multi-Agent AI Assistant.\n\nHow can I help you today with your courses, faculty queries, hackathons, or academic schedule?`

    setMessages([
      new ChatMessage(
        1,
        welcomeMsg,
        'bot',
        'reception_agent'
      )
    ])
  }, [student.name, student.role])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // AnimeJS Entrance Animation on mount
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
        console.warn("AnimeJS chat layout notice:", e)
      }
    }
  }, [])

  // Send Message
  const handleSendMessage = async (textOverride = null) => {
    const textToSend = textOverride || input
    if (!textToSend.trim() || isTyping) return

    const userMsg = new ChatMessage(Date.now(), textToSend, 'user', 'user')
    setMessages(prev => [...prev, userMsg])
    if (!textOverride) setInput('')
    setIsTyping(true)

    try {
      const response = await apiClient.sendQuestion(textToSend, sessionId, student.email, student.role || 'student')
      const botMsg = new ChatMessage(
        Date.now() + 1,
        response.answer,
        'bot',
        response.agent_name || 'chitti_supervisor'
      )
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      console.error("Chat error:", err)
      const errorMsg = new ChatMessage(
        Date.now() + 1,
        "I experienced a temporary connection issue. Please verify backend server status.",
        'bot',
        'reception_agent'
      )
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  // Clear History
  const handleClearHistory = async () => {
    try {
      await apiClient.clearSession(sessionId, student.email)
      setMessages([
        new ChatMessage(
          Date.now(),
          `Chat session reset. How can I assist you now, ${student.name}?`,
          'bot',
          'reception_agent'
        )
      ])
    } catch (err) {
      console.error("Clear session error:", err)
    }
  }

  return (
    <DashboardLayout
      theme={theme}
      setTheme={setTheme}
      currentUser={student}
      onBackToHome={onBackToHome}
      title="Chitti AI Assistant Swarm"
    >
      <div ref={listRef} className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col justify-between space-y-4">
        
        {/* Agent Filter Chips & Action Header */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-theme shrink-0 text-left">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono py-1">
            <span className="text-theme-secondary font-extrabold hidden sm:inline mr-1">Filter Agent Context:</span>
            {[
              { key: 'all', name: 'All 6 Agents' },
              { key: 'faculty_agent', name: 'Faculty' },
              { key: 'curriculum_agent', name: 'Curriculum' },
              { key: 'tutor_agent', name: 'CS Tutor' },
              { key: 'placement_agent', name: 'Placements' },
              { key: 'hackathon_agent', name: 'Hackathons' },
              { key: 'reception_agent', name: 'Reception' }
            ].map(ag => (
              <button
                key={ag.key}
                onClick={() => setSelectedAgent(ag.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all spring-button cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc815] ${
                  selectedAgent === ag.key
                    ? 'bg-[#ffc815] text-black font-extrabold shadow-md border-2 border-black scale-105'
                    : 'bg-theme-input border border-theme text-theme-secondary hover:border-[#ffc815] hover:text-theme-primary'
                }`}
                aria-label={`Filter by ${ag.name}`}
              >
                {ag.name}
              </button>
            ))}
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-xl bg-theme-input border border-theme text-theme-secondary hover:border-rose-400/40 hover:text-rose-400 transition-all text-xs font-mono flex items-center gap-1 shrink-0 cursor-pointer"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        {/* Messages Viewport */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              className={`anime-view-item flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-[#ffc815]/20 border border-[#ffc815]/40 flex items-center justify-center p-1.5 shrink-0 text-[#f05030]">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-2xl p-4 sm:p-5 text-left mb-2.5 ${
                msg.sender === 'user'
                  ? 'comic-bubble-user'
                  : 'comic-bubble-bot'
              }`}>
                {msg.sender === 'bot' && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-theme text-[10px] font-mono text-[#f05030] font-bold">
                    <span>🤖 {msg.agentName || 'Chitti Assistant'}</span>
                    <span>NLP English / Tamil</span>
                  </div>
                )}

                <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                  {formatContent(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#ffc815]/20 border border-[#ffc815]/40 flex items-center justify-center p-1.5 shrink-0 text-[#f05030] animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-3xl bg-theme-card border border-theme text-xs font-mono text-[#f05030] flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Chitti AI is generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="pt-2 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="relative flex items-center p-2 rounded-3xl bg-theme-card border-4 border-theme shadow-[5px_5px_0_0_var(--border-color)]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Chitti AI in English or Tamil..."
              className="w-full px-5 py-3 bg-transparent text-xs sm:text-sm focus:outline-none text-theme-primary placeholder:text-theme-muted font-bold mr-12"
            />
            
            <div className="absolute right-16 flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (isListening) return;
                  startSpeechToText(
                    (transcript) => setInput(prev => (prev ? prev + ' ' : '') + transcript),
                    setIsListening,
                    student.email
                  );
                }}
                className={`p-2 rounded-xl transition-all shrink-0 spring-button ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                    : 'text-theme-secondary hover:text-[#ffc815] hover:bg-theme-input'
                }`}
                title={isListening ? "Listening..." : "Dictate query"}
              >
                {isListening ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-11 h-11 rounded-2xl bg-[#ffc815] text-black flex items-center justify-center font-bold comic-btn shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </DashboardLayout>
  )
}
