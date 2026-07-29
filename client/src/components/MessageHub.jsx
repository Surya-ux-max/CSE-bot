import React, { useState, useEffect, useRef } from 'react'
import {
  Mail, Inbox, Send, FileText, Star, Trash2, Edit3, Search, Sparkles,
  CheckCircle2, Bot, Copy, Check, Filter, User, Layers, ArrowRight, Clock, Save, RefreshCw, Mic, MicOff
} from 'lucide-react'
import { animate, stagger } from 'animejs'
import { useFormatContent } from './FormatContent'
import { apiClient } from '../services/ApiClient'
import { startSpeechToText } from '../services/speech'

export default function MessageHub({ currentUser, theme }) {
  // Sidebar Folder State ('inbox' | 'sent' | 'drafts' | 'starred' | 'trash' | 'compose')
  const [activeFolder, setActiveFolder] = useState('inbox')
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  
  // Filter Agent NLP query state (The Filter Agent)
  const [filterAgentQuery, setFilterAgentQuery] = useState('')
  const [isFiltering, setIsFiltering] = useState(false)
  const [isFilterAgentActive, setIsFilterAgentActive] = useState(false)
  const [filterAgentSummary, setFilterAgentSummary] = useState('')

  // Message Lists state (Grounded in PostgreSQL DB via API)
  const [messageList, setMessageList] = useState([])
  const [filteredMessageList, setFilteredMessageList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Speech to Text States
  const [isListeningPrompt, setIsListeningPrompt] = useState(false)
  const [isListeningBody, setIsListeningBody] = useState(false)
  const [isListeningFilter, setIsListeningFilter] = useState(false)

  // AI Message Compose Workspace State
  const [promptInput, setPromptInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [recipientInput, setRecipientInput] = useState('')
  const [subjectInput, setSubjectInput] = useState('')
  const [bodyInput, setBodyInput] = useState('')
  const [notification, setNotification] = useState(null)

  // Selected Message Reader State
  const [selectedMessage, setSelectedMessage] = useState(null)

  const hubRef = useRef(null)
  const formatContent = useFormatContent()

  // User Profile
  const user = currentUser || {
    name: 'Suryaprakash S',
    email: 'suryaprakash.s.d@csebot.edu',
    role: 'student',
    section: 'Section D'
  }

  // Load messages on mount and email change
  useEffect(() => {
    fetchMessages()
  }, [user.email])

  // Reset filter list when primary message list changes
  useEffect(() => {
    if (!isFilterAgentActive) {
      setFilteredMessageList(messageList)
    }
  }, [messageList, isFilterAgentActive])

  // AnimeJS Staggered Item Entrance
  useEffect(() => {
    if (!hubRef.current) return
    const items = hubRef.current.querySelectorAll('.anime-hub-anim')
    if (items.length > 0) {
      try {
        animate(items, {
          translateY: [16, 0],
          opacity: [0, 1],
          delay: stagger(45),
          duration: 400
        })
      } catch (e) {
        console.warn("AnimeJS hub animation notice:", e)
      }
    }
  }, [activeFolder, activeFilter, isFilterAgentActive])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.getMessages(user.email)
      setMessageList(data)
    } catch (err) {
      console.error("Error loading messages:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // AI Draft generator
  const handleAgentGenerate = async (customPrompt = null) => {
    const textToProcess = customPrompt || promptInput
    if (!textToProcess.trim() || isGenerating) return

    setIsGenerating(true)
    setNotification(null)

    try {
      const response = await apiClient.sendMessageAgentCommand(user.email, user.role || 'student', textToProcess)

      const action = response.action || 'compose'
      const recipient = response.recipient || ''
      const subject = response.subject || 'Generated Subject'
      const content = response.content || ''
      const explanation = response.explanation || 'Done'

      if (action === 'send') {
        setNotification(`🚀 Message automatically sent to ${recipient || '@all'}!`)
        setPromptInput('')
        setRecipientInput('')
        setSubjectInput('')
        setBodyInput('')
        await fetchMessages()
        setTimeout(() => {
          setActiveFolder('sent')
        }, 1500)
      } else if (action === 'draft') {
        setNotification(`💾 Message automatically saved as draft for ${recipient || 'recipient'}!`)
        setPromptInput('')
        setRecipientInput('')
        setSubjectInput('')
        setBodyInput('')
        await fetchMessages()
        setTimeout(() => {
          setActiveFolder('drafts')
        }, 1500)
      } else {
        // action === 'compose'
        setRecipientInput(recipient)
        setSubjectInput(subject)
        setBodyInput(content)
        setNotification(`✨ AI Copilot: "${explanation}"`)
      }
    } catch (err) {
      console.error("AI Message Agent error:", err)
      setSubjectInput(textToProcess.slice(0, 40) + "...")
      setBodyInput(`Dear All,\n\nThis is an official communication regarding ${textToProcess}.\n\nWarm regards,\n${user.name}`)
      setNotification("✨ Draft generated with fallback template.")
    } finally {
      setIsGenerating(false)
      setTimeout(() => setNotification(null), 4000)
    }
  }

  // 1. Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!recipientInput.trim() || !subjectInput.trim() || !bodyInput.trim()) {
      setNotification("⚠️ Please fill in all fields (Recipient, Subject, and Body).")
      setTimeout(() => setNotification(null), 2500)
      return
    }

    try {
      const payload = {
        sender_name: `${user.name} (${user.role.toUpperCase()})`,
        sender_email: user.email,
        recipient_email: recipientInput.trim(),
        subject: subjectInput.trim(),
        content: bodyInput.trim(),
        folder: 'inbox', // It lands in the inbox of the recipient
        starred: false,
        unread: true
      }
      
      // Post message to database
      await apiClient.createMessage(payload)

      // Also save a copy in sender's sent folder
      await apiClient.createMessage({
        ...payload,
        folder: 'sent',
        unread: false
      })

      setNotification(`🚀 Message dispatched successfully to ${recipientInput}!`)
      
      // Clear inputs
      setPromptInput('')
      setRecipientInput('')
      setSubjectInput('')
      setBodyInput('')
      
      // Refresh list
      await fetchMessages()
      
      setTimeout(() => {
        setNotification(null)
        setActiveFolder('sent')
      }, 1200)
    } catch (err) {
      console.error("Failed to send message:", err)
      setNotification("⚠️ Error dispatching message.")
    }
  }

  // 2. Save Draft Action
  const handleSaveDraft = async () => {
    if (!subjectInput.trim() && !bodyInput.trim()) return

    try {
      await apiClient.createMessage({
        sender_name: user.name,
        sender_email: user.email,
        recipient_email: recipientInput.trim() || 'draft@sece.ac.in',
        subject: subjectInput.trim() || 'Draft Subject',
        content: bodyInput.trim() || 'Draft Body Content',
        folder: 'drafts',
        starred: false,
        unread: false
      })

      setNotification(`💾 Draft saved to database!`)
      setPromptInput('')
      setRecipientInput('')
      setSubjectInput('')
      setBodyInput('')
      
      await fetchMessages()
      
      setTimeout(() => {
        setNotification(null)
        setActiveFolder('drafts')
      }, 1200)
    } catch (err) {
      console.error("Failed to save draft:", err)
    }
  }

  // Star Toggle
  const handleToggleStar = async (e, id) => {
    e.stopPropagation()
    try {
      const updated = await apiClient.toggleMessageStar(id, user.email)
      setMessageList(prev => prev.map(m => m.id === id ? { ...m, starred: updated.starred } : m))
    } catch (err) {
      console.error("Failed to star message:", err)
    }
  }

  // Delete message (Move to Trash / Soft delete)
  const handleDeleteMessage = async (e, id, currentFolder) => {
    e.stopPropagation()
    try {
      if (currentFolder === 'trash') {
        // Permanent delete
        await apiClient.deleteMessagePermanently(id, user.email)
        setMessageList(prev => prev.filter(m => m.id !== id))
        setNotification("🗑️ Message permanently deleted from database.")
      } else {
        // Soft delete (Move to Trash)
        await apiClient.updateMessageFolder(id, 'trash', user.email)
        setMessageList(prev => prev.map(m => m.id === id ? { ...m, folder: 'trash' } : m))
        setNotification("🗑️ Message moved to Trash.")
      }
      setSelectedMessage(null)
      setTimeout(() => setNotification(null), 2000)
    } catch (err) {
      console.error("Failed to delete message:", err)
    }
  }

  // AI Filter Agent submit
  const handleFilterAgentSubmit = async (e) => {
    e.preventDefault()
    if (!filterAgentQuery.trim() || isFiltering) return

    setIsFiltering(true)
    setNotification(null)

    try {
      const filtered = await apiClient.filterMessages(user.email, filterAgentQuery)
      setFilteredMessageList(filtered)
      setIsFilterAgentActive(true)
      setFilterAgentSummary(filterAgentQuery)
      setNotification(`🔍 Filter Agent applied: "${filterAgentQuery}"`)
    } catch (err) {
      console.error("Filter Agent failed:", err)
      setNotification("⚠️ Filter Agent failed to process query.")
    } finally {
      setIsFiltering(false)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleClearFilterAgent = () => {
    setIsFilterAgentActive(false)
    setFilterAgentQuery('')
    setFilterAgentSummary('')
    setFilteredMessageList(messageList)
  }

  // Local Categorization & Folder filters (Applied on top of database list)
  const displayedMessages = filteredMessageList.filter(msg => {
    // 1. Folder match
    let matchFolder = false
    if (activeFolder === 'starred') {
      matchFolder = msg.starred && msg.folder !== 'trash'
    } else {
      matchFolder = msg.folder === activeFolder
    }

    // Inbox specific override to show @all announcements
    if (activeFolder === 'inbox') {
      matchFolder = (msg.recipient_email === user.email || msg.recipient_email === '@all') && msg.folder === 'inbox'
    }

    if (!matchFolder) return false

    // 2. Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const searchMatch = msg.subject.toLowerCase().includes(q) ||
                          msg.sender_name.toLowerCase().includes(q) ||
                          msg.sender_email.toLowerCase().includes(q) ||
                          msg.content.toLowerCase().includes(q)
      if (!searchMatch) return false
    }

    // 3. Filter Agent quick chip categories
    if (activeFilter === 'All') return true
    if (activeFilter === 'Unread') return msg.unread
    if (activeFilter === 'Faculty') return msg.sender_email.includes('faculty') || msg.sender_email.includes('hod')
    if (activeFilter === 'Students') return msg.sender_email.includes('student') || msg.sender_email.includes('csebot.edu') && !msg.sender_email.includes('faculty') && !msg.sender_email.includes('hod')
    if (activeFilter === 'Announcements') return msg.recipient_email === '@all'
    if (activeFilter === 'Drafts') return msg.folder === 'drafts'
    if (activeFilter === 'Sent') return msg.folder === 'sent'

    return true
  })

  return (
    <div ref={hubRef} className="w-full max-w-7xl mx-auto min-h-[750px] flex flex-col justify-between overflow-hidden text-left font-sans panel-theme rounded-3xl p-4 sm:p-6 space-y-6">
      
      {/* ═══════════════════════════════════════════════════════════════
         1. DEDICATED HEADER: "Message Hub" + Short Welcome Message
      ═══════════════════════════════════════════════════════════════ */}
      <header className="header-theme px-6 py-4 flex items-center justify-between shrink-0 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffc815] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0_0_#000]">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-theme-primary uppercase tracking-tight leading-none font-display">
              Message <span className="text-[#f05030]">Hub</span>
            </h1>
            <p className="text-xs font-mono text-theme-secondary mt-1 font-bold">
              Logged in: <strong className="text-[#f05030]">{user.email}</strong> ({user.role.toUpperCase()})
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-[#ffc815] border-2 border-black text-xs font-mono text-black font-black shadow-[2px_2px_0_0_#000]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>MESSAGE AGENT ONLINE</span>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="bg-[#ffc815] text-black px-6 py-2 text-xs font-mono font-bold text-center animate-fadeIn shadow-lg border-2 border-black rounded-xl">
          {notification}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
         2. MAIN GMAIL-STYLE ENTERPRISE LAYOUT
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden gap-6">
        
        {/* ─── LEFT SIDEBAR (Gmail-Style Navigation Menu) ───────────── */}
        <aside className="sidebar-theme w-full md:w-60 p-4 space-y-4 shrink-0 flex flex-col justify-between rounded-2xl bg-theme-input border border-theme">
          <div className="space-y-4">
            
            {/* Prominent Compose Button */}
            <button
              onClick={() => {
                setActiveFolder('compose')
                setSelectedMessage(null)
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#ffc815] hover:bg-[#ffdf70] text-black font-mono font-extrabold text-xs transition-all shadow-xl flex items-center justify-center gap-2.5 spring-button cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Compose Message</span>
            </button>

            {/* Folder Links */}
            <nav className="space-y-1 text-xs font-mono font-medium">
              {[
                { id: 'inbox', label: 'Inbox', icon: <Inbox className="w-4 h-4" />, count: messageList.filter(m => (m.recipient_email === user.email || m.recipient_email === '@all') && m.folder === 'inbox' && m.unread).length },
                { id: 'sent', label: 'Sent', icon: <Send className="w-4 h-4" />, count: messageList.filter(m => m.sender_email === user.email && m.folder === 'sent').length },
                { id: 'drafts', label: 'Drafts', icon: <FileText className="w-4 h-4" />, count: messageList.filter(m => m.sender_email === user.email && m.folder === 'drafts').length },
                { id: 'starred', label: 'Starred', icon: <Star className="w-4 h-4 text-[#ffc815]" />, count: messageList.filter(m => m.starred && m.folder !== 'trash').length },
                { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" />, count: messageList.filter(m => m.folder === 'trash').length }
              ].map(folder => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setActiveFolder(folder.id)
                    setSelectedMessage(null)
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all spring-button cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc815] ${
                    activeFolder === folder.id
                      ? 'bg-[#ffc815]/15 border-2 border-black border-l-4 border-l-[#f05030] text-[#f05030] font-extrabold'
                      : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-input border border-transparent'
                  }`}
                  aria-label={`Navigate to folder ${folder.label}, containing ${folder.count || 0} messages`}
                >
                  <div className="flex items-center gap-3">
                    {folder.icon}
                    <span>{folder.label}</span>
                  </div>
                  {folder.count > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      activeFolder === folder.id ? 'bg-[#ffc815] text-black' : 'bg-theme-input text-theme-secondary'
                    }`}>
                      {folder.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

          </div>

          <div className="pt-4 border-t border-theme text-[10px] font-mono text-theme-muted text-center flex items-center justify-center gap-1">
            <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform cursor-pointer" onClick={fetchMessages} />
            <span>Click to Sync mail database</span>
          </div>
        </aside>

        {/* ─── MAIN CONTENT AREA (Search, Filter, AI Workspace & Inbox) ─── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-theme-primary border border-theme rounded-2xl">
          
          {/* SEARCH & NLP FILTER AGENT SECTION */}
          <div className="p-4 sm:p-6 border-b border-theme space-y-3 bg-theme-input shrink-0 text-left">
            
            {/* Search inputs */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Regular Text Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-theme-muted absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick search by subject / content..."
                  className="input-theme w-full pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:border-[#ffc815] focus:ring-1 focus:ring-[#ffc815]"
                />
              </div>

              {/* Filter Agent (Semantic NLP Search) */}
              <form onSubmit={handleFilterAgentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={filterAgentQuery}
                  onChange={(e) => setFilterAgentQuery(e.target.value)}
                  placeholder="Ask Filter Agent (e.g. 'message on 20 july', 'from Subha')..."
                  className="input-theme px-4 py-3 rounded-2xl text-xs font-mono outline-none focus:border-[#ffc815] focus:ring-1 focus:ring-[#ffc815]"
                />
                <button
                  type="submit"
                  disabled={!filterAgentQuery.trim() || isFiltering}
                  className="px-4 py-3 rounded-2xl bg-[#ffc815] hover:bg-[#ffdf70] text-black font-mono font-black text-xs shadow-md shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc815]"
                  aria-label="Submit search query to Filter Agent"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>{isFiltering ? "Filtering..." : "Filter Agent"}</span>
                </button>
              </form>
            </div>
            <p className="text-[10px] font-mono text-theme-muted font-bold text-left ml-1 mt-0.5">
              💡 Tip: Ask the Filter Agent in plain language to filter by dates, names, or topics (e.g., "messages from Subha", "emails on July 20").
            </p>

            {/* Filter Agent Active Bar */}
            {isFilterAgentActive && (
              <div className="p-2.5 rounded-xl bg-[#ffc815]/10 border border-[#ffc815]/30 text-xs font-mono text-[#f05030] flex items-center justify-between">
                <span>🔍 Filter Agent active for query: <strong>"{filterAgentSummary}"</strong></span>
                <button
                  onClick={handleClearFilterAgent}
                  className="px-2 py-0.5 rounded bg-theme-input text-theme-secondary hover:text-theme-primary border border-theme text-[10px]"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Quick Chips Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
              <span className="text-theme-secondary flex items-center gap-1 shrink-0">
                <Bot className="w-3.5 h-3.5 text-[#f05030]" /> Folder Quick Filter:
              </span>

              {['All', 'Unread', 'Faculty', 'Students', 'Announcements'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-all spring-button cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-[#ffc815] text-black border-2 border-black font-extrabold shadow-md'
                      : 'bg-theme-input border border-theme text-theme-secondary hover:border-[#ffc815]/40'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

          </div>

          {/* DYNAMIC WORKSPACE SPLIT (AI Workspace vs Message Roster/Reader) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* ═══════════════════════════════════════════════════════════
               A. COMPOSE VIEW WORKSPACE
            ═══════════════════════════════════════════════════════════ */}
            {activeFolder === 'compose' && (
              <div className="space-y-6 max-w-5xl mx-auto text-left">
                
                {/* Message Agent Directive Generator */}
                <div className="p-6 rounded-3xl bg-theme-card border border-theme shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-[#f05030]" />
                      <h3 className="text-base font-extrabold text-theme-primary">AI Message Copilot</h3>
                    </div>
                    <span className="text-xs font-mono text-[#ffc815] font-bold">Write prompt to generate email draft</span>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="Ask copilot (e.g. 'write reminder note for project review next Tuesday')"
                        className="input-theme w-full pl-4 pr-12 py-3 rounded-2xl text-xs focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (isListeningPrompt) return;
                          startSpeechToText(
                            (transcript) => setPromptInput(prev => (prev ? prev + ' ' : '') + transcript),
                            setIsListeningPrompt,
                            user.email
                          );
                        }}
                        className={`absolute right-3 p-1.5 rounded-lg transition-all ${
                          isListeningPrompt
                            ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                            : 'text-theme-muted hover:text-[#ffc815]'
                        }`}
                        title="Voice dictation"
                      >
                        {isListeningPrompt ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={!promptInput.trim() || isGenerating}
                      onClick={() => handleAgentGenerate()}
                      className="px-4 py-3 rounded-2xl bg-[#ffc815] hover:bg-[#ffdf70] text-black font-mono font-extrabold text-xs shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {isGenerating ? "Drafting..." : "Generate Draft"}
                    </button>
                  </div>
                </div>

                {/* Direct Compose Form */}
                <form onSubmit={handleSendMessage} className="p-6 rounded-3xl bg-theme-card border border-theme shadow-2xl space-y-4">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-theme">
                    <h3 className="text-sm font-mono font-black text-theme-primary uppercase">Compose New Email</h3>
                    <span className="text-xs font-mono text-theme-muted">From: {user.email}</span>
                  </div>

                  {/* Recipient Field */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-theme-secondary uppercase tracking-wider block">Recipient Email (Use <strong>@all</strong> to message everyone)</label>
                    <input
                      type="text"
                      required
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      placeholder="e.g. s.yuvaraj@faculty.csebot.edu or @all"
                      className="input-theme w-full pl-4 pr-4 py-2.5 rounded-2xl text-xs font-mono text-theme-primary focus:border-[#ffc815] focus:outline-none"
                    />
                  </div>

                  {/* Subject Line */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-theme-secondary uppercase block">Subject Line</label>
                    <input
                      type="text"
                      required
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      placeholder="e.g. Submission guidelines / CAT-2 Timetable details"
                      className="input-theme w-full pl-4 pr-4 py-2.5 rounded-2xl text-xs text-theme-primary focus:border-[#ffc815] focus:outline-none"
                    />
                  </div>

                  {/* Message Body Content */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-theme-secondary uppercase block">Message Body Content</label>
                    <div className="relative">
                      <textarea
                        rows={8}
                        required
                        value={bodyInput}
                        onChange={(e) => setBodyInput(e.target.value)}
                        placeholder="Dear Prof/Students,\n\nType your message content here..."
                        className="input-theme w-full p-4 pr-12 rounded-2xl focus:border-[#ffc815]/60 focus:outline-none text-xs sm:text-sm text-theme-primary leading-relaxed resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (isListeningBody) return;
                          startSpeechToText(
                            (transcript) => setBodyInput(prev => (prev ? prev + ' ' : '') + transcript),
                            setIsListeningBody,
                            user.email
                          );
                        }}
                        className={`absolute bottom-3 right-3 p-2 rounded-xl transition-all ${
                          isListeningBody
                            ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                            : 'text-theme-muted hover:text-[#ffc815] hover:bg-theme-input'
                        }`}
                        title="Voice dictation"
                      >
                        {isListeningBody ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="submit"
                      className="py-3 rounded-2xl bg-[#ffc815] hover:bg-[#ffdf70] text-black font-mono font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Mail</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="py-3 rounded-2xl bg-theme-input hover:bg-theme-card text-theme-primary border border-theme font-mono font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4 text-emerald-500" />
                      <span>Save Draft</span>
                    </button>
                  </div>

                </form>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               B. GMAIL-STYLE INBOX & OTHER FOLDERS LIST
            ═══════════════════════════════════════════════════════════ */}
            {activeFolder !== 'compose' && !selectedMessage && (
              <div className="space-y-4 max-w-5xl mx-auto">
                
                {/* Roster Header */}
                <div className="flex items-center justify-between pb-2 border-b border-theme text-left">
                  <h3 className="text-xs font-mono font-black uppercase tracking-wider text-[#ffc815]">
                    {activeFolder} Roster ({displayedMessages.length})
                  </h3>
                  <span className="text-[10px] font-mono text-theme-muted">Showing {activeFilter} Category</span>
                </div>

                {isLoading ? (
                  <p className="text-xs font-mono text-theme-muted py-6 text-center animate-pulse">Retrieving messages from database...</p>
                ) : displayedMessages.length === 0 ? (
                  <div className="p-12 text-center text-theme-muted font-mono text-xs space-y-2 border border-dashed border-theme rounded-2xl bg-theme-input">
                    <Inbox className="w-8 h-8 mx-auto text-theme-muted opacity-40" />
                    <p>No messages found in {activeFolder} matching search conditions.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedMessages.map(msg => (
                      <div
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg)
                          msg.unread = false
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setSelectedMessage(msg)
                            msg.unread = false
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Message from ${msg.sender_name}, Subject: ${msg.subject}. ${msg.unread ? 'Unread.' : 'Read.'}`}
                        className={`anime-hub-anim p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 spring-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffc815] ${
                          msg.unread
                            ? 'bg-theme-card border-black border-l-4 border-l-[#ffc815] text-theme-primary font-bold shadow-md'
                            : 'bg-theme-input border-theme text-theme-secondary hover:border-[#ffc815]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Unread indicator dot */}
                          {msg.unread && (
                            <span className="w-2 h-2 rounded-full bg-[#f05030] shrink-0 animate-pulse" title="Unread Message" />
                          )}

                          {/* Star Button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(e, msg.id)}
                            className="text-theme-muted hover:text-[#ffc815] shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc815] rounded"
                            aria-label={msg.starred ? "Unstar message" : "Star message"}
                          >
                            <Star className={`w-4 h-4 ${msg.starred ? 'fill-[#ffc815] text-[#ffc815]' : ''}`} />
                          </button>

                          <div className="w-8 h-8 rounded-full bg-[#ffc815]/20 text-[#f05030] font-black text-xs flex items-center justify-center shrink-0">
                            {msg.sender_name.slice(0, 2).toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-theme-primary truncate">{msg.sender_name}</span>
                              <span className="text-[10px] font-mono text-theme-muted truncate">({msg.sender_email})</span>
                              {msg.recipient_email === '@all' && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#f05030]/20 text-[#f05030] font-bold">
                                  @ALL Broadcast
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-semibold text-theme-secondary truncate mt-0.5">{msg.subject}</h4>
                            <p className="text-[11px] text-theme-muted truncate mt-0.5">{msg.content}</p>
                          </div>
                        </div>

                        {/* Right Date & Action */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-mono text-theme-muted">{msg.date}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMessage(e, msg.id, activeFolder)}
                            className="p-1 rounded-lg text-theme-muted hover:text-[#f05030] hover:bg-theme-input transition-colors cursor-pointer"
                            title={activeFolder === 'trash' ? "Delete Permanently" : "Move to Trash"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
               C. DEDICATED SELECTED MESSAGE READER VIEW
            ═══════════════════════════════════════════════════════════ */}
            {selectedMessage && (
              <div className="anime-hub-anim p-6 sm:p-8 rounded-3xl bg-theme-card border border-theme shadow-2xl space-y-6 text-left max-w-5xl mx-auto">
                <div className="flex items-center justify-between pb-4 border-b border-theme">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-[#ffc815] font-black uppercase">
                        {selectedMessage.folder.toUpperCase()} MESSAGE
                      </span>
                      {selectedMessage.recipient_email === '@all' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#f05030]/20 text-[#f05030] font-black">
                          BROADCAST TO ALL
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-theme-primary">{selectedMessage.subject}</h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="p-1.5 rounded-full bg-theme-input text-theme-muted hover:text-theme-primary font-bold cursor-pointer"
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                <div className="text-xs font-mono text-theme-secondary space-y-1.5 pb-3 border-b border-theme">
                  <p>From: <strong className="text-theme-primary">{selectedMessage.sender_name}</strong> <span className="text-theme-muted">&lt;{selectedMessage.sender_email}&gt;</span></p>
                  <p>To: <strong className="text-theme-primary">{selectedMessage.recipient_email}</strong></p>
                  <p className="flex items-center gap-1 text-theme-muted"><Clock className="w-3.5 h-3.5" /> {selectedMessage.date}</p>
                </div>

                <div className="text-theme-primary leading-relaxed whitespace-pre-line p-5 rounded-2xl bg-theme-input border border-theme text-xs sm:text-sm">
                  {formatContent(selectedMessage.content)}
                </div>

                {/* Reader actions */}
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    onClick={(e) => handleDeleteMessage(e, selectedMessage.id, selectedMessage.folder)}
                    className="px-4 py-2 rounded-xl bg-theme-input border border-theme hover:bg-[#f05030] hover:text-white transition-colors text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{selectedMessage.folder === 'trash' ? "Delete Permanently" : "Move to Trash"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setRecipientInput(selectedMessage.sender_email)
                      setSubjectInput(`Re: ${selectedMessage.subject}`)
                      setBodyInput(`\n\n----- Original Message -----\nFrom: ${selectedMessage.sender_name}\nSent: ${selectedMessage.date}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.content}`)
                      setActiveFolder('compose')
                      setSelectedMessage(null)
                    }}
                    className="px-4 py-2 rounded-xl bg-[#ffc815] hover:bg-[#ffdf70] text-black text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border-2 border-black shadow-[2px_2px_0_0_#000]"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            )}

          </div>

        </main>

      </div>

    </div>
  )
}
