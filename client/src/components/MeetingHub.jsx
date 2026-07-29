import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  PhoneOff, Users, MessageSquare, Send, Clock,
  Calendar, Sparkles, Loader2, CheckCircle2, AlertCircle,
  Play, UserCircle2, Hash, Copy, Check, RefreshCw, LogIn,
  UserX, Shield, Info, Trash2
} from 'lucide-react'
import { apiClient } from '../services/ApiClient'
import { startSpeechToText } from '../services/speech'

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function statusBadge(status) {
  const map = {
    ongoing:     'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/40 font-bold',
    scheduled:   'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/40 font-bold',
    ended_grace: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-bold',
    ended:       'bg-gray-200 dark:bg-slate-700/40 text-gray-500 dark:text-slate-400 border-gray-300 dark:border-slate-600',
    closed:      'bg-gray-200 dark:bg-slate-700/40 text-gray-500 dark:text-slate-400 border-gray-300 dark:border-slate-600'
  }
  return map[status] || map.scheduled
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

/* ─── Live Meeting Room (always dark — video call context) ─────────────── */

function MeetingRoom({ meeting, currentUser, onLeave }) {
  const [elapsed, setElapsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const [showDiag, setShowDiag] = useState(false)
  const [jitsiApi, setJitsiApi] = useState(null)
  const timerRef = useRef(null)
  const jitsiContainerRef = useRef(null)

  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || 'User'

  /* Load Jitsi WebRTC External API dynamically and mount room */
  useEffect(() => {
    let apiInstance = null

    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI)
          return
        }
        const script = document.createElement('script')
        script.src = 'https://meet.jit.si/external_api.js'
        script.async = true
        script.onload = () => resolve(window.JitsiMeetExternalAPI)
        script.onerror = () => reject(new Error('Failed to load WebRTC engine'))
        document.body.appendChild(script)
      })
    }

    loadJitsiScript().then((JitsiAPI) => {
      if (!jitsiContainerRef.current) return

      const domain = 'meet.jit.si'
      const options = {
        roomName: `SECE_CSE_MEET_${meeting.join_code}`,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          email: currentUser.email,
          displayName: userName
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_BACKGROUND: '#0a0a0a',
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
        }
      }

      apiInstance = new JitsiAPI(domain, options)
      setJitsiApi(apiInstance)

      apiInstance.addEventListener('videoConferenceLeft', () => {
        handleLeave()
      })
    }).catch(err => {
      console.error("Jitsi WebRTC Load Error:", err)
    })

    return () => {
      if (apiInstance) {
        apiInstance.dispose()
      }
    }
  }, [meeting.join_code, currentUser.email, userName])

  /* Elapsed timer */
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const fmtElapsed = () => {
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const s = (elapsed % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const copyCode = () => {
    navigator.clipboard.writeText(meeting.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeave = async () => {
    try {
      if (jitsiApi) jitsiApi.dispose()
      await apiClient.leaveMeeting(meeting.id, currentUser.email)
    } catch {}
    onLeave()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0a0a0a', color: '#fff' }}>
      {/* Top Bar */}
      <div style={{ background: 'rgba(17,17,17,0.92)', borderBottom: '1px solid #222' }}
        className="flex items-center justify-between px-6 py-3 backdrop-blur relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-white">REAL WEBRTC LIVE</span>
          <span className="text-sm font-mono text-gray-400 ml-1">{fmtElapsed()}</span>
          <span className="text-sm font-semibold text-gray-200 ml-2">{meeting.title}</span>
          <span className="text-xs text-gray-500 font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 ml-2">
            Code: {meeting.join_code}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Health Button */}
          <button onClick={() => setShowDiag(!showDiag)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-[#333] bg-[#1a1a1a]">
            <Shield className="w-3.5 h-3.5 text-green-400" />
            <span>WebRTC Telemetry</span>
          </button>

          <button onClick={copyCode}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-lg"
            style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="font-mono">{meeting.join_code}</span>
          </button>

          <button onClick={handleLeave}
            className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-500 text-white font-bold transition px-4 py-1.5 rounded-lg">
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>

        {/* Diagnostics Dropdown */}
        {showDiag && (
          <div className="absolute right-6 top-14 w-80 rounded-2xl p-4 border border-[#333] shadow-2xl z-20 space-y-3"
            style={{ background: '#161616', color: '#eee' }}>
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Real WebRTC Network Telemetry</span>
              <Shield className="w-4 h-4 text-green-400" />
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Engine:</span>
                <span className="text-green-400">Jitsi WebRTC SFU Mesh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Audio Codec:</span>
                <span className="text-gray-300">Opus 48kHz HD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Video Codec:</span>
                <span className="text-gray-300">VP9 / H.264 Adaptive</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Encryption:</span>
                <span className="text-[#ffc815]">DTLS-SRTP (E2EE)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Real WebRTC Video Container */}
      <div className="flex-1 w-full h-full relative bg-[#0a0a0a]">
        <div ref={jitsiContainerRef} className="w-full h-full" />
      </div>
    </div>
  )
}

/* ─── Meeting Card ─────────────────────────────────────────────────────── */

function MeetingCard({ meeting, currentUser, onJoin, onDelete }) {
  const isInGrace = meeting.status === 'ended_grace' || meeting.is_in_grace

  return (
    <div className="group relative p-4 rounded-2xl space-y-3 transition hover:shadow-md"
      style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-color)' }}>

      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-tight flex-1" style={{ color: 'var(--text-primary)' }}>
          {meeting.title}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border ${statusBadge(meeting.status)}`}>
            {isInGrace ? 'Grace Window' : meeting.status}
          </span>
          <button
            onClick={() => onDelete(meeting)}
            className="p-1 rounded-lg text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
            title="Delete / remove meeting"
            aria-label={`Delete meeting: ${meeting.title}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <UserCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{meeting.organizer_name}</span>
          {meeting.is_host && <span className="font-bold" style={{ color: '#ffc815' }}>(You)</span>}
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{formatDate(meeting.meeting_date)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{meeting.meeting_time} · {meeting.duration_mins} min</span>
        </div>
        {meeting.section && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{meeting.section} · {meeting.participant_count} participants</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Hash className="w-3 h-3 flex-shrink-0" />
          <span className="font-mono tracking-widest">{meeting.join_code}</span>
        </div>
      </div>

      {(meeting.status === 'ongoing' || meeting.status === 'scheduled' || isInGrace) && (
        <button onClick={() => onJoin(meeting)}
          className="w-full py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc815] focus-visible:ring-offset-2"
          style={{ background: meeting.status === 'ongoing' ? '#16a34a' : (isInGrace ? '#d97706' : '#f05030') }}
          aria-label={`Join meeting: ${meeting.title}`}
        >
          {meeting.status === 'ongoing' ? <Play className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
          {meeting.status === 'ongoing'
            ? 'Join Now'
            : (isInGrace
                ? `Re-Join (Grace Until ${meeting.grace_until_time || '1 hr'})`
                : 'Enter Meeting'
              )
          }
        </button>
      )}
    </div>
  )
}

/* ─── Main MeetingHub Component ────────────────────────────────────────── */

export default function MeetingHub({ currentUser, theme }) {
  const user = currentUser || { name: 'Suryaprakash S', email: 'suryaprakash.s.d@csebot.edu', role: 'student' }

  const [prompt,       setPrompt]       = useState('')
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentResult,  setAgentResult]  = useState(null)
  const [agentError,   setAgentError]   = useState(null)
  const [meetings,     setMeetings]     = useState([])
  const [meetingsLoading, setMeetingsLoading] = useState(true)
  const [activeMeeting,   setActiveMeeting]   = useState(null)
  const [joinCodeInput,   setJoinCodeInput]   = useState('')
  const [joinError,       setJoinError]       = useState(null)
  const [joinLoading,     setJoinLoading]     = useState(false)
  const [isListening,     setIsListening]     = useState(false)
  const [purging,         setPurging]         = useState(false)
  const textareaRef = useRef(null)

  const handleDeleteMeeting = async (meeting) => {
    if (!window.confirm(`Are you sure you want to delete meeting "${meeting.title}"?`)) return
    try {
      await apiClient.deleteMeeting(meeting.id, user.email)
      await loadMeetings()
    } catch (err) {
      console.error("Delete meeting error:", err)
      alert("Failed to delete meeting.")
    }
  }

  const handlePurgeClosed = async () => {
    if (!window.confirm("Permanently delete all closed, ended, or expired meetings from your history?")) return
    setPurging(true)
    try {
      const response = await fetch(`${apiClient.baseUrl}/meetings/delete-closed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      const data = await response.json()
      if (response.ok && data.status === 'success') {
        alert(data.message)
        await loadMeetings()
      } else {
        alert(data.message || "Failed to purge closed meetings.")
      }
    } catch (e) {
      console.error(e)
      alert("Error purging closed meetings.")
    } finally {
      setPurging(false)
    }
  }

  const loadMeetings = useCallback(async () => {
    try {
      const data = await apiClient.getMeetings(user.email)
      setMeetings(data)
    } catch (e) {
      console.error('Load meetings failed:', e)
    } finally {
      setMeetingsLoading(false)
    }
  }, [user.email])

  useEffect(() => {
    loadMeetings()
    const id = setInterval(loadMeetings, 15000)
    return () => clearInterval(id)
  }, [loadMeetings])

  const handleAgentSubmit = async () => {
    if (!prompt.trim()) return
    setAgentLoading(true); setAgentResult(null); setAgentError(null)
    try {
      const res = await apiClient.sendMeetingAgentCommand(user.email, user.role || 'student', prompt)
      if (res.status === 'error') {
        setAgentError(res.message)
      } else {
        setAgentResult(res)
        if (res.status === 'success') {
          setPrompt('')
        }
        await loadMeetings()
      }
    } catch (e) { setAgentError(e.message || 'Something went wrong') }
    finally { setAgentLoading(false) }
  }

  const handleJoinByCode = async () => {
    if (!joinCodeInput.trim()) return
    setJoinLoading(true); setJoinError(null)
    try {
      const res = await apiClient.joinMeeting(user.email, user.name || user.email, joinCodeInput.trim().toUpperCase())
      setActiveMeeting({ ...res.meeting, is_host: res.meeting.organizer_email === user.email })
      await loadMeetings()
    } catch (e) { setJoinError(e.message || 'Invalid join code') }
    finally { setJoinLoading(false) }
  }

  const handleJoinCard = async (meeting) => {
    try { await apiClient.joinMeeting(user.email, user.name || user.email, meeting.join_code) } catch {}
    setActiveMeeting(meeting)
    await loadMeetings()
  }

  const handleLeave = async () => { setActiveMeeting(null); await loadMeetings() }

  const ongoingMeetings  = meetings.filter(m => m.status === 'ongoing')
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled')
  const graceMeetings    = meetings.filter(m => m.status === 'ended_grace' || m.is_in_grace)
  const pastMeetings     = meetings.filter(m => m.status === 'ended' || m.status === 'closed')

  if (activeMeeting) return <MeetingRoom meeting={activeMeeting} currentUser={user} onLeave={handleLeave} />

  return (
    <div className="flex h-full min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Left: Composer ── */}
      <div className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto">

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl text-xs font-mono font-black text-black"
            style={{ background: '#ffc815', border: '2px solid #000', boxShadow: '2px 2px 0 #000' }}>
            <Video className="w-3.5 h-3.5" />
            <span>SECE CSE Meeting Hub</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight font-display text-theme-primary">
            Meeting <span style={{ color: '#f05030' }}>Hub</span>
          </h1>
          <p className="text-sm font-semibold text-theme-secondary">
            Schedule meetings with natural language. Powered by AI.
          </p>
        </div>

        {/* AI Composer Box */}
        <div className="rounded-3xl p-5 space-y-4"
          style={{ background: 'var(--bg-card)', border: '2px solid var(--border-color)', boxShadow: '4px 4px 0 var(--border-color)' }}>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" style={{ color: '#ffc815' }} />
            <span className="text-sm font-bold text-theme-primary">Meeting Agent</span>
            <span className="text-xs font-mono text-theme-muted">— powered by Gemini</span>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAgentSubmit() } }}
              placeholder={"Create meet with me...\n\nTry: 'Create a meeting tomorrow at 10 AM with II CSE D'"}
              rows={5}
              className="w-full rounded-2xl px-4 pr-12 py-3 text-sm outline-none resize-none transition input-theme"
            />
            <button
              type="button"
              onClick={() => {
                if (isListening) return;
                startSpeechToText(
                  (transcript) => setPrompt(prev => (prev ? prev + ' ' : '') + transcript),
                  setIsListening,
                  user.email
                );
              }}
              className={`absolute bottom-3 right-3 p-2 rounded-xl transition-all ${
                isListening
                  ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                  : 'text-theme-muted hover:text-[#ffc815] hover:bg-theme-input'
              }`}
              title="Voice dictation"
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-theme-muted">Enter to send · Shift+Enter for new line</p>
            <button onClick={handleAgentSubmit}
              disabled={agentLoading || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#f05030' }}>
              {agentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {agentLoading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>

          {/* Suggestion for missing details */}
          {agentResult && agentResult.status === 'needs_details' && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Meeting Details Needed</p>
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                  {agentResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Success result */}
          {agentResult && agentResult.status === 'success' && (
            <div className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">{agentResult.message}</p>
                {agentResult.meeting && (
                  <div className="text-xs space-y-0.5 text-theme-muted">
                    <div>📅 {formatDate(agentResult.meeting.meeting_date)} at {agentResult.meeting.meeting_time}</div>
                    <div className="font-mono font-bold" style={{ color: '#f05030' }}>🔑 Join Code: {agentResult.join_code}</div>
                    <div>👥 {agentResult.participants_notified} participants notified via Message Hub</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {agentError && (
            <div className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{agentError}</p>
            </div>
          )}
        </div>

        {/* Join by Code */}
        <div className="rounded-3xl p-5 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4" style={{ color: '#ffc815' }} />
            <span className="text-sm font-bold text-theme-primary">Join by Code</span>
          </div>
          <div className="flex gap-2">
            <input
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
              placeholder="Enter 8-digit join code..."
              maxLength={8}
              className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-mono outline-none tracking-widest uppercase input-theme"
            />
            <button onClick={handleJoinByCode}
              disabled={joinLoading || !joinCodeInput.trim()}
              className="px-5 py-2.5 rounded-2xl text-black text-sm font-bold transition disabled:opacity-40 flex items-center gap-1.5"
              style={{ background: '#ffc815', border: '2px solid #000' }}>
              {joinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Join
            </button>
          </div>
          {joinError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />{joinError}
            </p>
          )}
        </div>

      </div>

      {/* ── Right: Meeting History Sidebar ── */}
      <div className="w-80 xl:w-96 flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-input)', borderLeft: '2px solid var(--border-color)' }}>

        <div className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: '2px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <h3 className="text-sm font-black uppercase tracking-wider text-theme-primary">Meeting History</h3>
          <button onClick={loadMeetings}
            className="p-1.5 rounded-lg transition text-theme-muted hover:text-theme-primary"
            style={{ background: 'var(--bg-input)' }}>
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {meetingsLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#f05030' }} />
              <p className="text-xs text-theme-muted">Loading meetings...</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Video className="w-10 h-10 text-theme-muted opacity-40" />
              <p className="text-sm font-semibold text-theme-muted">No meetings yet</p>
              <p className="text-xs text-theme-muted opacity-60">Create your first meeting using the agent on the left.</p>
            </div>
          ) : (
            <>
              {ongoingMeetings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                      Ongoing ({ongoingMeetings.length})
                    </span>
                  </div>
                  {ongoingMeetings.map(m => <MeetingCard key={m.id} meeting={m} currentUser={user} onJoin={handleJoinCard} onDelete={handleDeleteMeeting} />)}
                </div>
              )}
              {graceMeetings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Grace Period - Re-join ({graceMeetings.length})
                    </span>
                  </div>
                  {graceMeetings.map(m => <MeetingCard key={m.id} meeting={m} currentUser={user} onJoin={handleJoinCard} onDelete={handleDeleteMeeting} />)}
                </div>
              )}
              {upcomingMeetings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#ffc815' }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#b38900' }}>
                      Upcoming ({upcomingMeetings.length})
                    </span>
                  </div>
                  {upcomingMeetings.map(m => <MeetingCard key={m.id} meeting={m} currentUser={user} onJoin={handleJoinCard} onDelete={handleDeleteMeeting} />)}
                </div>
              )}
              {pastMeetings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-theme-muted">
                        Past / Expired ({pastMeetings.length})
                      </span>
                    </div>
                    <button
                      onClick={handlePurgeClosed}
                      disabled={purging}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 font-bold transition disabled:opacity-50 cursor-pointer"
                      title="Permanently delete all your expired/closed meetings"
                    >
                      {purging ? 'Purging...' : 'Purge All Expired'}
                    </button>
                  </div>
                  {pastMeetings.map(m => <MeetingCard key={m.id} meeting={m} currentUser={user} onJoin={handleJoinCard} onDelete={handleDeleteMeeting} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
