import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, ArrowRight, Sun, Moon, GraduationCap, Zap, Shield, Sparkles, Users, BookOpen, Terminal, Rocket, CheckCircle2, ChevronDown } from 'lucide-react'
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
          ⚡ {agent.key}
          <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </span>
      )}
    </div>
  )
}

export default function LandingPage({ onStartChat, theme, setTheme }) {
  const agentShowcases = [
    { name: "Faculty Agent", key: "faculty_agent" },
    { name: "Curriculum Agent", key: "curriculum_agent" },
    { name: "Coding Tutor", key: "tutor_agent" },
    { name: "Placement Coach", key: "placement_agent" },
    { name: "Virtual Host", key: "reception_agent" }
  ]

  return (
    <div className={`min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden select-none transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Cyber Grid & Floating Math Background */}
      <TechBackground />

      {/* ═══════════════════════════════════════════════════════════════
         1. GOOGLE MATERIAL 3 GLASS HEADER
      ═══════════════════════════════════════════════════════════════ */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between gap-3">
        
        {/* Brand Logo & College Badge */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group min-w-0" onClick={onStartChat}>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center p-1.5 sm:p-2 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm-4 7H6v3h2V9zm10 0h-2v3h2V9zm-5 5h-2v2h2v-2z" />
            </svg>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight font-sans" style={{ color: 'var(--text-primary)' }}>CHITTI</span>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-400 font-sans">AI</span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[9px] sm:text-[10px] font-mono text-amber-400 font-semibold">
                v2.1 Robot
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
              Sri Eshwar College of Eng.
            </p>
          </div>
        </div>

        {/* Right CTA & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="p-2 sm:p-2.5 rounded-xl border border-brand-border bg-brand-light hover:border-amber-400/50 transition-all shadow-md"
            style={{ color: 'var(--text-secondary)' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onStartChat}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 transition-all transform hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-slate-950" />
            <span className="hidden xs:inline">Launch Chitti</span>
            <span className="inline xs:hidden">Launch</span>
          </button>
        </div>

      </header>

      {/* ═══════════════════════════════════════════════════════════════
         2. HERO SECTION (GOOGLE DEEPMIND AI STYLE)
      ═══════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-12 flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        
        {/* Left Hero Text Content */}
        <div className="w-full lg:w-7/12 space-y-5 sm:space-y-8 text-left">
          
          {/* Department Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-[11px] sm:text-xs font-mono text-amber-400 font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Official Department Multi-Agent Virtual Robot
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="block" style={{ color: 'var(--text-primary)' }}>Welcome to</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                Chitti AI
              </span>
            </h1>
            <p className="text-lg sm:text-2xl font-bold tracking-tight mt-2" style={{ color: 'var(--text-primary)' }}>
              Your Intelligent Virtual Robot for <span className="text-amber-400">Computer Science & Engineering</span>
            </p>
          </div>

          {/* Subtitle Description */}
          <p className="text-sm sm:text-lg max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Ask anything about faculty, semester course syllabi, algorithms, and placement preparation. Powered by 5 specialized AI agents and official PostgreSQL department records. Speed 1 Terahertz, Memory 1 Zettabyte!
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
            <button
              onClick={onStartChat}
              className="flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-amber-400/30 hover:shadow-amber-400/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageSquare className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-slate-950" />
              <span>Talk to Chitti</span>
            </button>

            <button
              onClick={onStartChat}
              className="flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl border border-brand-border bg-brand-light/70 hover:border-amber-400/50 font-bold text-sm sm:text-base transition-all hover:bg-brand-light"
              style={{ color: 'var(--text-primary)' }}
            >
              <span>Explore 5 AI Agents</span>
              <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
            </button>
          </div>

        </div>

        {/* Right Hero Graphic: Seamless Blended Origami Plane */}
        <div className="w-full lg:w-5/12 flex items-center justify-center relative">
          <div className="relative w-full max-w-sm sm:max-w-md flex items-center justify-center p-2 animate-roboFloat">
            
            {/* Ambient Golden Cyber Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-amber-500/20 blur-3xl opacity-80" />
            
            {/* Glass Container Blending image2.png */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-amber-400/30 bg-black/40 backdrop-blur-xl p-2.5 sm:p-3 shadow-2xl shadow-amber-500/20 group cursor-pointer" onClick={onStartChat}>
              <img
                src={origamImg}
                alt="Chitti AI Graphic"
                className="w-full h-auto max-h-[260px] sm:max-h-[380px] object-contain transform group-hover:scale-105 transition-transform duration-500"
                style={{ mixBlendMode: 'lighten' }}
              />

              {/* Overlay Badge */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 p-2.5 sm:p-3 rounded-2xl bg-brand-light/90 border border-brand-border/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>Chitti AI Active</span>
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

    </div>
  )
}
