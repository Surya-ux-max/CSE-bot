import React, { useState, useEffect, useRef } from 'react'
import { X, GraduationCap, Users, ArrowRight, ShieldCheck, Lock, Mail, User, Layers, Calendar, Sparkles } from 'lucide-react'
import { animate } from 'animejs'
import { apiClient } from '../services/ApiClient'

export default function AuthModal({ isOpen, onClose, initialRole = 'student', onAuthSuccess }) {
  const [role, setRole] = useState(initialRole) // 'student' | 'faculty'
  const [mode, setMode] = useState('register') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [errorNotice, setErrorNotice] = useState('')

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
  const formFieldsRef = useRef(null)

  useEffect(() => {
    setRole(initialRole)
  }, [initialRole])

  // AnimeJS Card Entrance & Role/Mode Switch Micro-Animations
  useEffect(() => {
    if (!isOpen || !cardRef.current) return
    
    // Scale and fade-in container card
    animate(cardRef.current, {
      scale: [0.92, 1],
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 400,
      ease: 'outBack(1.2)'
    })
  }, [isOpen])

  // AnimeJS Form Switch Animation when changing role or mode
  useEffect(() => {
    if (!formFieldsRef.current) return
    const fields = formFieldsRef.current.querySelectorAll('.anime-field')
    if (fields.length > 0) {
      animate(fields, {
        translateY: [12, 0],
        opacity: [0, 1],
        delay: (el, i) => i * 40,
        duration: 350,
        ease: 'outQuart'
      })
    }
  }, [role, mode])

  if (!isOpen) return null

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorNotice('')

    try {
      let result
      if (role === 'student') {
        if (mode === 'register') {
          result = await apiClient.registerStudent(formData)
        } else {
          result = await apiClient.loginStudent({ email: formData.email, password: formData.password })
        }
      } else {
        if (mode === 'register') {
          result = await apiClient.registerFaculty(formData)
        } else {
          result = await apiClient.loginFaculty({ email: formData.email, password: formData.password })
        }
      }

      // Check if server indicated account is already registered
      if (result && result.status === 'account_exists') {
        setErrorNotice(result.message || 'Account is already registered in SECE DB! Directing to your workspace...')
        
        const userProfile = {
          role,
          name: result.user?.name || formData.name || formData.email.split('@')[0],
          email: result.user?.email || formData.email,
          section: result.user?.section || formData.section,
          year: result.user?.year || formData.year,
          designation: result.user?.designation || (role === 'faculty' ? formData.designation : 'Student'),
          token: result.user?.token || 'sece_jwt_authenticated'
        }

        localStorage.setItem('sece_auth_user', JSON.stringify(userProfile))

        setTimeout(() => {
          setLoading(false)
          onClose()
          if (onAuthSuccess) onAuthSuccess(userProfile)
        }, 1200)
        return
      }

      // Save user session details
      const userProfile = {
        role,
        name: result?.user?.name || formData.name || (formData.email ? formData.email.split('@')[0] : 'User'),
        email: result?.user?.email || formData.email,
        section: result?.user?.section || formData.section,
        year: result?.user?.year || formData.year,
        designation: result?.user?.designation || (role === 'faculty' ? formData.designation : 'Student'),
        token: result?.user?.token || 'sece_jwt_authenticated'
      }

      localStorage.setItem('sece_auth_user', JSON.stringify(userProfile))
      
      setTimeout(() => {
        setLoading(false)
        onClose()
        if (onAuthSuccess) onAuthSuccess(userProfile)
      }, 400)

    } catch (err) {
      console.error("[AuthModal] Auth error:", err)
      setErrorNotice(err.message || 'Authentication error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Container Card with Glassmorphism */}
      <div
        ref={cardRef}
        className="relative w-full max-w-lg rounded-3xl border border-white/20 dark:border-white/10 bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 text-left overflow-hidden"
      >
        {/* Top Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-all spring-button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center p-1.5 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest block">
              SECE CSE Intelligent Portal
            </span>
            <span className="text-[10px] text-gray-400 font-mono">Sri Eshwar College of Engineering</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          {mode === 'register' ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mb-6">
          {mode === 'register' 
            ? `Register for dedicated ${role === 'student' ? 'Student' : 'Faculty'} AI multi-agent workspace.`
            : `Log in to access your personalized ${role === 'student' ? 'Student' : 'Faculty'} agents.`}
        </p>

        {/* Role Selector Tabs (Student vs Faculty) */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950/70 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold transition-all spring-button cursor-pointer ${
              role === 'student'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('faculty')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-bold transition-all spring-button cursor-pointer ${
              role === 'faculty'
                ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Faculty Portal</span>
          </button>
        </div>

        {/* Error Notice */}
        {errorNotice && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
            {errorNotice}
          </div>
        )}

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} ref={formFieldsRef} className="space-y-4">
          
          {/* Register-Only Fields */}
          {mode === 'register' && (
            <>
              {/* Full Name */}
              <div className="anime-field space-y-1">
                <label className="text-[11px] font-mono text-gray-300 uppercase tracking-wider block">Full Name</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={role === 'student' ? "e.g. Suryaprakash S" : "e.g. Dr. Subha M"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400/60 focus:outline-none text-xs font-medium text-white placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Faculty Designation Dropdown (Only for Faculty Role) */}
              {role === 'faculty' && (
                <div className="anime-field space-y-1">
                  <label className="text-[11px] font-mono text-gray-300 uppercase tracking-wider block">Role / Designation</label>
                  <div className="relative flex items-center">
                    <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5" />
                    <select
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 focus:border-cyan-400/60 focus:outline-none text-xs font-medium text-white appearance-none cursor-pointer"
                    >
                      <option value="Faculty">Faculty Professor</option>
                      <option value="Class Advisor">Class Advisor</option>
                      <option value="Tutor">Tutor</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Section & Year Selection Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Section */}
                <div className="anime-field space-y-1">
                  <label className="text-[11px] font-mono text-gray-300 uppercase tracking-wider block">
                    {role === 'faculty' ? 'Assigned Section' : 'Section'}
                  </label>
                  <div className="relative flex items-center">
                    <Layers className="w-4 h-4 text-gray-400 absolute left-3.5" />
                    <select
                      value={formData.section}
                      onChange={(e) => handleInputChange('section', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 focus:border-amber-400/60 focus:outline-none text-xs font-medium text-white appearance-none cursor-pointer"
                    >
                      <option value="Section A">Section A</option>
                      <option value="Section B">Section B</option>
                      <option value="Section C">Section C</option>
                      <option value="Section D">Section D</option>
                      {role === 'faculty' && <option value="All Sections">All Sections</option>}
                    </select>
                  </div>
                </div>

                {/* Year */}
                <div className="anime-field space-y-1">
                  <label className="text-[11px] font-mono text-gray-300 uppercase tracking-wider block">
                    {role === 'faculty' ? 'Assigned Year' : 'Academic Year'}
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5" />
                    <select
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-white/10 focus:border-amber-400/60 focus:outline-none text-xs font-medium text-white appearance-none cursor-pointer"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      {role === 'faculty' && <option value="All Years">All Years</option>}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div className="anime-field space-y-1">
            <label className="text-[11px] font-mono text-gray-300 uppercase tracking-wider block">Institutional Email</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={role === 'student' ? "student@sece.ac.in" : "faculty@sece.ac.in"}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400/60 focus:outline-none text-xs font-medium text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Password */}
          <div className="anime-field space-y-1">
            <label className="text-[11px] font-mono text-gray-300 uppercase tracking-wider block">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus:border-amber-400/60 focus:outline-none text-xs font-medium text-white placeholder-gray-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-mono font-extrabold text-xs transition-all shadow-xl flex items-center justify-center gap-2 spring-button cursor-pointer mt-6 ${
              role === 'student'
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-400/20'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
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
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          {mode === 'register' ? (
            <p className="text-xs text-gray-400">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-400 hover:underline font-mono font-bold cursor-pointer"
              >
                Sign In to existing account
              </button>
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-amber-400 hover:underline font-mono font-bold cursor-pointer"
              >
                Create a new {role === 'student' ? 'Student' : 'Faculty'} account
              </button>
            </p>
          )}
        </div>

      </div>

    </div>
  )
}
