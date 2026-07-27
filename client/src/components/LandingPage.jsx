import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, ArrowRight, Sun, Moon, GraduationCap, Zap, Shield, Sparkles, Users, BookOpen, Terminal, Rocket, CheckCircle2, ChevronDown, Bot, Heart } from 'lucide-react'
import { animate, stagger } from 'animejs'
import origamImg from '../reference/image2.png'
import TechBackground from './TechBackground'

// ─── ANIMEJS V4 STAGGERED GIANT TYPOGRAPHY SCROLL ITEM ─────────────────
function GiantScrollItem({ agent, idx, onStartChat }) {
  const [inView, setInView] = useState(false)
  const containerRef = useRef(null)
  const textRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
      },
      { threshold: 0.4, rootMargin: "-10% 0px -10% 0px" }
    )

    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // AnimeJS v4 Staggered Letter Animation Effect
  useEffect(() => {
    if (!textRef.current) return
    const letterElements = textRef.current.querySelectorAll('.anime-char')
    if (!letterElements || letterElements.length === 0) return

    if (inView) {
      animate(letterElements, {
        translateY: [16, 0],
        opacity: [0.15, 1],
        color: ['#6b7280', '#fbbf24'],
        delay: stagger(30),
        duration: 550,
        ease: 'outElastic(1, .8)'
      })
    } else {
      animate(letterElements, {
        translateY: [0, 6],
        opacity: [1, 0.15],
        color: ['#fbbf24', '#4b5563'],
        duration: 350,
        ease: 'outQuad'
      })
    }
  }, [inView])

  const characters = agent.name.split('')

  return (
    <div
      ref={containerRef}
      onClick={onStartChat}
      className={`py-3 sm:py-6 cursor-pointer transition-all duration-500 ease-out transform origin-left select-none group flex items-center justify-between gap-4 ${
        inView
          ? 'opacity-100 scale-100 font-black'
          : 'opacity-20 hover:opacity-60 scale-95 font-bold'
      }`}
    >
      <div ref={textRef} className="flex items-center min-w-0 flex-wrap">
        <span className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-none inline-flex flex-wrap">
          {characters.map((char, charIdx) => (
            <span
              key={charIdx}
              className="anime-char inline-block transition-transform duration-300"
              style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </span>
      </div>

      {inView && (
        <span className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs sm:text-sm font-mono font-bold text-amber-400 shrink-0 animate-fadeInFast">
          <Bot className="w-4 h-4 text-amber-400" />
          <span>{agent.key}</span>
          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </span>
      )}
    </div>
  )
}

export default function LandingPage({ onStartChat, theme, setTheme }) {
  const [heroSearch, setHeroSearch] = useState('')
  const heroRef = useRef(null)

  const agentShowcases = [
    { name: "Faculty Agent", key: "faculty_agent" },
    { name: "Curriculum Agent", key: "curriculum_agent" },
    { name: "Coding Tutor", key: "tutor_agent" },
    { name: "Placement Coach", key: "placement_agent" },
    { name: "Virtual Host", key: "reception_agent" }
  ]

  // AnimeJS Hero Entrance Stagger Animation
  useEffect(() => {
    if (!heroRef.current) return
    const elements = heroRef.current.querySelectorAll('.anime-hero-item')
    if (elements.length > 0) {
      animate(elements, {
        translateY: [24, 0],
        opacity: [0, 1],
        delay: stagger(90),
        duration: 700,
        ease: 'outQuart'
      })
    }
  }, [])

  const handleHeroSubmit = (e) => {
    e?.preventDefault()
    onStartChat()
  }

  return (
    <div className={`min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden select-none transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Cyber Grid & Floating Math Background */}
      <TechBackground />

      {/* ═══════════════════════════════════════════════════════════════
         1. FLOATING FROSTED GLASS PILL HEADER (Matching Reference UI)
      ═══════════════════════════════════════════════════════════════ */}
      <header className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="w-full rounded-full border border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/40 backdrop-blur-2xl shadow-2xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          
          {/* Left Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={onStartChat}>
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center p-1.5 shadow-md group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm-4 7H6v3h2V9zm10 0h-2v3h2V9zm-5 5h-2v2h2v-2z" />
              </svg>
            </div>
            <span className="text-lg font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Chitti <span className="text-amber-400">AI</span></span>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-medium text-gray-300">
            <span className="hover:text-amber-400 cursor-pointer transition-colors" onClick={onStartChat}>Home</span>
            <span className="hover:text-amber-400 cursor-pointer transition-colors" onClick={onStartChat}>5 AI Agents</span>
            <span className="hover:text-amber-400 cursor-pointer transition-colors" onClick={onStartChat}>Faculty</span>
            <span className="hover:text-amber-400 cursor-pointer transition-colors" onClick={onStartChat}>Curriculum</span>
            <span className="hover:text-amber-400 cursor-pointer transition-colors" onClick={onStartChat}>Placements</span>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full border border-brand-border bg-brand-light/80 hover:border-amber-400/50 transition-all shadow-md spring-button"
              style={{ color: 'var(--text-secondary)' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onStartChat}
              className="px-5 py-2 rounded-full bg-white dark:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-400/20 hover:shadow-amber-400/40 transition-all transform hover:scale-105 active:scale-95 spring-button"
            >
              Launch Chitti
            </button>
          </div>

        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
         2. CINEMATIC HERO SECTION (Matching Reference Design)
      ═══════════════════════════════════════════════════════════════ */}
      <main ref={heroRef} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 lg:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        
        {/* Left Hero Content */}
        <div className="w-full lg:w-7/12 space-y-6 sm:space-y-8 text-left">
          
          {/* Department Multi-Agent Badge */}
          <div className="anime-hero-item opacity-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 dark:bg-black/30 border border-white/20 dark:border-white/10 text-xs font-mono text-amber-400 font-semibold backdrop-blur-xl shadow-md">
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>CHITTI AI • MULTI-AGENT ENGINE</span>
          </div>

          {/* Headline Matching Reference Typography */}
          <div className="anime-hero-item opacity-0 space-y-3">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
              <span className="block" style={{ color: 'var(--text-primary)' }}>Meet your</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 font-serif italic font-normal">
                virtual robot today
              </span>
            </h1>
            <p className="text-base sm:text-xl font-normal leading-relaxed max-w-xl text-gray-400">
              Speed 1 Terahertz, Memory 1 Zettabyte! Grounded PostgreSQL multi-agent assistance for Computer Science & Engineering.
            </p>
          </div>

          {/* Frosted Glass Search Pill Bar (Matching Reference Interface) */}
          <form onSubmit={handleHeroSubmit} className="anime-hero-item opacity-0 space-y-4">
            <div className="relative flex items-center p-2 rounded-full bg-white/10 dark:bg-black/40 border border-white/20 dark:border-white/10 backdrop-blur-2xl shadow-2xl transition-all max-w-xl">
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search for faculty, curriculum, code..."
                className="w-full px-5 py-3 bg-transparent text-sm sm:text-base focus:outline-none text-gray-100 placeholder-gray-400"
              />

              <button
                type="submit"
                className="w-11 h-11 rounded-full bg-white dark:bg-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 spring-button cursor-pointer"
                title="Search with Chitti"
              >
                <ArrowRight className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </button>
            </div>

            {/* Quick Sample Prompt Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
                { icon: <GraduationCap className="w-3.5 h-3.5 text-amber-400" />, label: "HoD & Faculty" },
                { icon: <BookOpen className="w-3.5 h-3.5 text-amber-400" />, label: "Sem 6 Syllabus" },
                { icon: <Terminal className="w-3.5 h-3.5 text-amber-400" />, label: "Quicksort Code" },
                { icon: <Rocket className="w-3.5 h-3.5 text-amber-400" />, label: "Placement Stats" }
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={onStartChat}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 dark:bg-white/5 border border-white/10 hover:border-amber-400/50 text-[11px] font-mono transition-all hover:text-amber-400 text-gray-300 cursor-pointer spring-button"
                >
                  {chip.icon}
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </form>

        </div>

        {/* Right Hero Graphic: Blended Glass Container */}
        <div className="anime-hero-item opacity-0 w-full lg:w-5/12 flex items-center justify-center relative">
          <div className="relative w-full max-w-sm sm:max-w-md flex items-center justify-center p-2 animate-roboFloat">
            
            {/* Ambient Golden Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/25 via-cyan-500/15 to-amber-500/25 blur-3xl opacity-90" />
            
            {/* Glass Container Blending image2.png */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 bg-black/50 backdrop-blur-2xl p-4 shadow-2xl shadow-amber-500/20 group cursor-pointer" onClick={onStartChat}>
              
              {/* Floating Top Badge */}
              <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-slate-950/80 border border-white/15 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono text-amber-400 font-bold">5 Specialized Agents</span>
              </div>

              <img
                src={origamImg}
                alt="Chitti AI Graphic"
                className="w-full h-auto max-h-[280px] sm:max-h-[390px] object-contain transform group-hover:scale-105 transition-transform duration-500"
                style={{ mixBlendMode: 'lighten' }}
              />

              {/* Overlay Bottom Badge */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 p-3 rounded-2xl bg-slate-950/85 border border-white/15 backdrop-blur-md flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-mono font-semibold text-gray-200">Chitti AI Engine</span>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold">SECE CSE</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ═══════════════════════════════════════════════════════════════
         3. GIANT TYPOGRAPHY SCROLL SHOWCASE (Matching Reference Image)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24 border-t border-brand-border/60">
        
        {/* Section Label */}
        <div className="mb-6 sm:mb-12 flex items-center gap-2">
          <ChevronDown className="w-4 h-4 animate-bounce text-amber-400" />
          <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-widest">
            Scroll to Explore Multi-Agent System
          </span>
        </div>

        {/* Stacked Giant Text Lines */}
        <div className="flex flex-col space-y-2 sm:space-y-4">
          {agentShowcases.map((agent, idx) => (
            <GiantScrollItem
              key={idx}
              agent={agent}
              idx={idx}
              onStartChat={onStartChat}
            />
          ))}
        </div>

      </section>

      {/* ═══════════════════════════════════════════════════════════════
         4. CTA & FOOTER SECTION (SECE WATERMARK + WE CSE.)
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 w-full border-t border-brand-border/60 overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
        
        {/* Giant SECE Watermark Background Text (High Visibility) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <span className="font-black text-[28vw] sm:text-[24vw] tracking-tighter text-slate-300/80 dark:text-white/15 uppercase leading-none select-none pointer-events-none transition-colors duration-300">
            SECE
          </span>
        </div>

        {/* Main CTA Content */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-8">
          
          {/* WE CSE. Headline */}
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
              WE <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">CSE.</span>
            </h2>
            <p className="text-sm sm:text-lg font-medium text-gray-400 max-w-md mx-auto">
              Empowering Future Engineers with AI & Multi-Agent Intelligence.
            </p>
          </div>

          {/* Floating Pill CTA Button */}
          <button
            onClick={onStartChat}
            className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-brand-light/90 border border-brand-border hover:border-amber-400/70 backdrop-blur-xl text-xs sm:text-sm font-mono font-extrabold shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2.5 group cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
          >
            <Bot className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Talk to Chitti</span>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Bottom Attribution & Links Row */}
          <div className="w-full pt-12 sm:pt-16 border-t border-brand-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            
            {/* Department Identity */}
            <div className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-amber-400" />
              <span>Sri Eshwar College of Engineering</span>
            </div>

            {/* Center Crafted With Heart Pill */}
            <div className="px-4 py-2 rounded-full bg-brand-light/80 border border-brand-border backdrop-blur-md flex items-center gap-2 shadow-md">
              <span className="uppercase text-[11px]">CRAFTED WITH</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
              <span className="uppercase text-[11px]">BY <strong className="text-amber-400 font-bold">SECE CSE</strong></span>
            </div>

            {/* Right Department Links */}
            <div className="flex items-center gap-4 text-[11px]">
              <span className="hover:text-amber-400 cursor-pointer transition-colors" onClick={onStartChat}>Department AI</span>
              <span>|</span>
              <span className="hover:text-amber-400 cursor-pointer transition-colors" onClick={onStartChat}>SECE Portal</span>
            </div>

          </div>

        </div>

      </footer>

      {/* ═══════════════════════════════════════════════════════════════
         5. FLOATING CIRCULAR ASSISTANT CHAT WIDGET (Matching Reference UI)
      ═══════════════════════════════════════════════════════════════ */}
      <button
        onClick={onStartChat}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white dark:bg-amber-400 text-slate-950 shadow-2xl flex items-center justify-center spring-button hover:scale-110 active:scale-95 border-2 border-white/40 cursor-pointer group"
        title="Open Chitti Assistant"
      >
        <MessageSquare className="w-6 h-6 fill-slate-950 group-hover:rotate-12 transition-transform" />
      </button>

    </div>
  )
}
