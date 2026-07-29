import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, GraduationCap, Users, ArrowRight, ShieldCheck,
  Lock, Mail, User, Layers, Calendar, Sparkles, Bot, Sun, Moon, CheckCircle2
} from 'lucide-react'
import { animate } from 'animejs'
import { apiClient } from '../services/ApiClient'

export default function AuthPage({ onBackToHome, initialRole = 'student', onAuthSuccess, theme, setTheme }) {
  const [role, setRole] = useState(initialRole) // 'student' | 'faculty'
  const [mode, setMode] = useState('register') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [noticeMessage, setNoticeMessage] = useState({ type: '', text: '' })

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    designation: 'Faculty', // For Faculty: Faculty | Class Advisor | Tutor
    section: 'Section A',    // Section A, B, C, D, All
    year: '3rd Year'        // 1st, 2nd, 3rd, 4th, All
  })

  const cardRef = useRef(null)
  const formRef = useRef(null)

  useEffect(() => {
    setRole(initialRole)
  }, [initialRole])

  // AnimeJS Page Card Entrance Animation
  useEffect(() => {
    if (!cardRef.current) return
    animate(cardRef.current, {
      translateY: [30, 0],
      opacity: [0, 1],
      scale: [0.96, 1],
      duration: 600,
      ease: 'outQuart'
    })
  }, [])

  // AnimeJS Form Field Stagger Animation on Role/Mode Change
  useEffect(() => {
    if (!formRef.current) return
    const fields = formRef.current.querySelectorAll('.anime-auth-field')
    if (fields.length > 0) {
      animate(fields, {
        translateY: [16, 0],
        opacity: [0, 1],
        delay: (el, i) => i * 45,
        duration: 400,
        ease: 'outQuart'
      })
    }
  }, [role, mode])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setNoticeMessage({ type: '', text: '' })

    try {
      let result
      if (role === 'student') {
        if (mode === 'register') {
          result = await apiClient.registerStudent(formData)
        } else {
          result = await apiClient.loginStudent({ email: formData.email, password: formData.password })
        }
      } else if (role === 'faculty') {
        if (mode === 'register') {
          result = await apiClient.registerFaculty(formData)
        } else {
          result = await apiClient.loginFaculty({ email: formData.email, password: formData.password })
        }
      } else if (role === 'placement_cell') {
        if (mode === 'register') {
          result = await apiClient.registerPlacement(formData)
        } else {
          result = await apiClient.loginPlacement({ email: formData.email, password: formData.password })
        }
      }

      // Handle server "account_exists" status for pre-seeded database accounts
      if (result && result.status === 'account_exists') {
        setNoticeMessage({
          type: 'info',
          text: result.message || `Account for ${formData.email} is already registered in SECE DB! Directing to workspace...`
        })

        const userProfile = {
          role,
          name: result.user?.name || formData.name || formData.email.split('@')[0],
          email: result.user?.email || formData.email,
          section: result.user?.section || formData.section,
          year: result.user?.year || formData.year,
          designation: result.user?.designation || (role === 'faculty' ? formData.designation : (role === 'placement_cell' ? 'Placement Officer' : 'Student')),
          token: result.user?.token || 'sece_jwt_authenticated'
        }

        localStorage.setItem('sece_auth_user', JSON.stringify(userProfile))

        setTimeout(() => {
          setLoading(false)
          if (onAuthSuccess) onAuthSuccess(userProfile)
        }, 1100)
        return
      }

      // Handle normal login/register success
      const userProfile = {
        role,
        name: result?.user?.name || formData.name || (formData.email ? formData.email.split('@')[0] : 'User'),
        email: result?.user?.email || formData.email,
        section: result?.user?.section || formData.section,
        year: result?.user?.year || formData.year,
        designation: result?.user?.designation || (role === 'faculty' ? formData.designation : (role === 'placement_cell' ? 'Placement Officer' : 'Student')),
        token: result?.user?.token || 'sece_jwt_authenticated'
      }

      localStorage.setItem('sece_auth_user', JSON.stringify(userProfile))

      setNoticeMessage({
        type: 'success',
        text: result?.message || `Successfully authenticated as ${userProfile.name}!`
      })

      setTimeout(() => {
        setLoading(false)
        if (onAuthSuccess) onAuthSuccess(userProfile)
      }, 500)

    } catch (err) {
      console.error("[AuthPage] Authentication error:", err)
      setNoticeMessage({
        type: 'error',
        text: err.message || 'Authentication failed. Please check your credentials and try again.'
      })
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden select-none transition-colors duration-300 bg-theme-primary text-theme-primary ${theme}`}>
      
      {/* Background Grid (inherited from halftone-bg / tech background) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#f05030]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#ffc815]/10 blur-[120px]" />
      </div>

      {/* ─── Top Header Navigation Bar ──────────────────────────────── */}
      <header className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="w-full rounded-full border border-theme bg-theme-card shadow-2xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          
          {/* Back to Home Button */}
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-theme-input border border-theme text-xs font-mono font-bold text-theme-primary hover:text-[#f05030] hover:border-[#f05030] transition-all spring-button cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#f05030]" />
            <span>Return to Platform</span>
          </button>

          {/* Center Brand Badge */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#ffc815]/20 border border-[#ffc815]/40 flex items-center justify-center p-1.5 shadow-md">
              <Bot className="w-3.5 h-3.5 text-[#ffc815]" />
            </div>
            <span className="text-sm font-black tracking-tight text-theme-primary">
              SECE <span className="text-[#f05030]">CSE</span> AUTHENTICATION
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full border border-theme bg-theme-input text-theme-secondary hover:border-[#ffc815]/50 transition-all shadow-md spring-button"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#ffc815]" /> : <Moon className="w-4 h-4 text-[#f05030]" />}
          </button>

        </div>
      </header>

      {/* ─── Main Dedicated Auth Form Container ────────────────────────── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 lg:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
        
        {/* Left column: Fancy Pop Art/Comic styled text */}
        <div className="w-full lg:w-6/12 space-y-6 sm:space-y-8 text-left">
          {/* Dialogue Speech Bubble */}
          <div className="inline-flex relative p-3 rounded-2xl panel-theme border-3 border-black text-theme-primary font-mono font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-[3px_3px_0_var(--border-color)] rotate-[-1.0deg] max-w-max">
            <span>HOLY IDENTITY, VERIFY YOUR ACCESS!</span>
            <div className="absolute bottom-[-13px] left-8 w-0 h-0 border-solid border-t-[10px] border-r-[10px] border-b-0 border-l-0 border-t-black border-r-transparent" />
            <div className="absolute bottom-[-8px] left-9 w-0 h-0 border-solid border-t-[7px] border-r-[7px] border-b-0 border-l-0 border-t-[var(--bg-card)] border-r-transparent z-10" />
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-[70px] font-black tracking-tight leading-[0.95] uppercase font-display text-theme-primary">
            SECURE ACCESS <br />
            FOR <span className="text-[#f05030] drop-shadow-[2.5px_2.5px_0_#000]">SECE CSE</span> <br />
            MEMBERS ONLY.
          </h1>
          
          <p className="text-xs sm:text-sm font-mono text-theme-secondary font-black max-w-md leading-relaxed">
            Authorized portal access for Class Advisors, PAC Coordinators, Assessment Committees, and Students of CSE. Synchronized grounded PostgreSQL query engines ready.
          </p>

          {/* Simple Neubrutalist Tip Card */}
          <div className="p-4 rounded-2xl bg-[#ffc815] border-3 border-black text-black shadow-[4px_4px_0_var(--border-color)] max-w-md">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest block mb-1">💡 SEEDED TESTING CREDENTIALS</span>
            <p className="text-xs font-bold leading-normal text-left">
              Student: suryaprakash.s.d@csebot.edu / CSE@2026#1015 <br />
              Faculty: s.yuvaraj@faculty.csebot.edu / Faculty@2026#2012 <br />
              Placement Cell: placements@csebot.edu / Placement@2026#3015
            </p>
          </div>
        </div>

        {/* Right column: Form Card */}
        <div className="w-full lg:w-5/12 max-w-md relative z-10">
          <div
            ref={cardRef}
            className="w-full rounded-3xl comic-card panel-theme p-6 sm:p-8 text-left overflow-hidden text-theme-primary"
          >
          {/* Top Identity Pill */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#ffc815] border-2 border-black flex items-center justify-center p-1.5 shadow-[2px_2px_0_0_var(--border-color)]">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="text-xs font-mono font-black text-theme-primary uppercase tracking-widest block">
                SECE CSE Intelligent Portal
              </span>
              <span className="text-[10px] text-theme-secondary font-bold block">Sri Eshwar College of Engineering</span>
            </div>
          </div>

          {/* Page Headline */}
          <h1 className="text-2xl sm:text-3xl font-black text-theme-primary uppercase tracking-tight mb-2 font-display">
            {mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs sm:text-sm text-theme-secondary font-semibold mb-6">
            {mode === 'register' 
              ? `Register for dedicated ${role === 'student' ? 'Student' : (role === 'faculty' ? 'Faculty' : 'Placement Cell')} workspace.`
              : `Sign in to access your pre-seeded ${role === 'student' ? 'Student' : (role === 'faculty' ? 'Faculty' : 'Placement Cell')} portal.`}
          </p>

          {/* Role Selector Tabs (Student vs Faculty vs Placement Cell) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-theme-input border border-theme mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-[10px] font-mono font-bold transition-all spring-button cursor-pointer ${
                role === 'student'
                  ? 'bg-[#ffc815] text-black shadow-md border border-black'
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('faculty')}
              className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-[10px] font-mono font-bold transition-all spring-button cursor-pointer ${
                role === 'faculty'
                  ? 'bg-[#f05030] text-white shadow-md border border-black'
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Faculty</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('placement_cell')}
              className={`flex items-center justify-center gap-1 py-2.5 rounded-xl text-[10px] font-mono font-bold transition-all spring-button cursor-pointer ${
                role === 'placement_cell'
                  ? 'bg-emerald-600 text-white shadow-md border border-black'
                  : 'text-theme-muted hover:text-theme-primary'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Placement</span>
            </button>
          </div>

          {/* Dynamic Notice Message Banner */}
          {noticeMessage.text && (
            <div className={`mb-5 p-3.5 rounded-2xl text-xs font-mono border flex items-start gap-2.5 ${
              noticeMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : noticeMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-400/10 border-amber-400/30 text-amber-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{noticeMessage.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} ref={formRef} className="space-y-4">
            
            {/* Register Mode Fields */}
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div className="anime-auth-field space-y-1">
                  <label className="text-[11px] font-mono text-theme-primary uppercase font-black block">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-theme-primary absolute left-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={role === 'student' ? "e.g. Suryaprakash S" : "e.g. Dr. S. Yuvaraj"}
                      className="input-theme w-full pl-10 pr-4 py-2.5 rounded-2xl focus:border-[#ffc815] focus:outline-none text-xs font-bold text-theme-primary"
                    />
                  </div>
                </div>

                {/* Faculty Designation Dropdown (Only for Faculty Role) */}
                {role === 'faculty' && (
                  <div className="anime-auth-field space-y-1">
                    <label className="text-[11px] font-mono text-theme-primary uppercase font-black block">Role / Designation</label>
                    <div className="relative flex items-center">
                      <ShieldCheck className="w-4 h-4 text-theme-primary absolute left-3.5" />
                      <select
                        value={formData.designation}
                        onChange={(e) => handleInputChange('designation', e.target.value)}
                        className="input-theme w-full pl-10 pr-4 py-2.5 rounded-2xl focus:border-[#f05030] focus:outline-none text-xs font-bold text-theme-primary appearance-none cursor-pointer"
                      >
                        <option value="Head of Department">Head of Department</option>
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Professor of Practice">Professor of Practice</option>
                        <option value="Class Advisor">Class Advisor</option>
                        <option value="Tutor">Tutor</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Section & Year Selection Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Section */}
                  <div className="anime-auth-field space-y-1">
                    <label className="text-[11px] font-mono text-theme-primary uppercase font-black block">
                      {role === 'faculty' ? 'Assigned Section' : 'Section'}
                    </label>
                    <div className="relative flex items-center">
                      <Layers className="w-4 h-4 text-theme-primary absolute left-3.5" />
                      <select
                        value={formData.section}
                        onChange={(e) => handleInputChange('section', e.target.value)}
                        className="input-theme w-full pl-10 pr-4 py-2.5 rounded-2xl focus:outline-none text-xs font-bold text-theme-primary appearance-none cursor-pointer"
                      >
                        <option value="Section D">Section D</option>
                        <option value="Section A">Section A</option>
                        <option value="Section B">Section B</option>
                        <option value="Section C">Section C</option>
                        {role === 'faculty' && <option value="All Sections">All Sections</option>}
                      </select>
                    </div>
                  </div>

                  {/* Year */}
                  <div className="anime-auth-field space-y-1">
                    <label className="text-[11px] font-mono text-theme-primary uppercase font-black block">
                      {role === 'faculty' ? 'Assigned Year' : 'Academic Year'}
                    </label>
                    <div className="relative flex items-center">
                      <Calendar className="w-4 h-4 text-theme-primary absolute left-3.5" />
                      <select
                        value={formData.year}
                        onChange={(e) => handleInputChange('year', e.target.value)}
                        className="input-theme w-full pl-10 pr-4 py-2.5 rounded-2xl focus:outline-none text-xs font-bold text-theme-primary appearance-none cursor-pointer"
                      >
                        <option value="3rd Year">3rd Year</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="4th Year">4th Year</option>
                        {role === 'faculty' && <option value="All Years">All Years</option>}
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div className="anime-auth-field space-y-1">
              <label className="text-[11px] font-mono text-theme-primary uppercase font-black block">Institutional Email</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-theme-primary absolute left-3.5" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={role === 'student' ? "suryaprakash.s.d@csebot.edu" : "s.yuvaraj@faculty.csebot.edu"}
                  className="input-theme w-full pl-10 pr-4 py-2.5 rounded-2xl focus:outline-none text-xs font-bold text-theme-primary"
                />
              </div>
            </div>

            {/* Password */}
            <div className="anime-auth-field space-y-1">
              <label className="text-[11px] font-mono text-theme-primary uppercase font-black block">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-theme-primary absolute left-3.5" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="input-theme w-full pl-10 pr-4 py-2.5 rounded-2xl focus:outline-none text-xs font-bold text-theme-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl comic-btn flex items-center justify-center gap-2 cursor-pointer mt-6 ${
                role === 'student'
                  ? 'bg-[#ffc815] text-black hover:bg-[#ffdf70]'
                  : 'bg-[#f05030] text-white hover:bg-[#f37359]'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-theme-primary" />
                  <span>Authenticating Workspace...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>{mode === 'register' ? `Register ${role === 'student' ? 'Student' : 'Faculty'} Account` : `Sign In to ${role === 'student' ? 'Student' : 'Faculty'} Portal`}</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>

          </form>

          {/* Mode Switcher Toggle Footer (Login vs Register) */}
          <div className="mt-6 pt-4 border-t border-theme text-center">
            {mode === 'register' ? (
              <p className="text-xs text-theme-secondary">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#ffc815] hover:underline font-mono font-bold cursor-pointer"
                >
                  Sign In to existing account
                </button>
              </p>
            ) : (
              <p className="text-xs text-theme-secondary">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-[#ffc815] hover:underline font-mono font-bold cursor-pointer"
                >
                  Create a new {role === 'student' ? 'Student' : 'Faculty'} account
                </button>
              </p>
            )}
          </div>

        </div>
      </div>

    </main>

      {/* ─── Footer Attribution ─────────────────────────────────────── */}
      <footer className="relative z-10 py-4 text-center text-xs font-mono text-theme-muted border-t border-theme">
        <span>Sri Eshwar College of Engineering • Dept of Computer Science &amp; Engineering</span>
      </footer>

    </div>
  )
}
