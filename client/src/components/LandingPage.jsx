import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, ArrowRight, Sun, Moon, GraduationCap, Zap, Shield, Sparkles, Users, BookOpen, Terminal, Rocket, CheckCircle2, ChevronDown, Bot, Heart } from 'lucide-react'
import { animate, stagger } from 'animejs'
import origamImg from '../reference/image2.png'
import TechBackground from './TechBackground'
import BubbleMenu from './landing/BubbleMenu'
import ScrollTextLines from './landing/ScrollTextLines'

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

function ChittiCartoonIllustration() {
  return (
    <div className="relative w-full max-w-sm sm:max-w-md flex items-center justify-center p-2">
      {/* Sunburst radial rays stretching out */}
      <svg className="absolute w-[130%] h-[130%] pointer-events-none select-none opacity-[0.06]" viewBox="0 0 200 200" style={{ transform: 'rotate(15deg)' }}>
        <path d="M100 0 L105 100 L200 100 L105 105 L100 200 L95 105 L0 100 L95 100 Z" fill="#000" />
        <path d="M100 0 L105 100 L200 100 L105 105 L100 200 L95 105 L0 100 L95 100 Z" fill="#ffc815" transform="rotate(45 100 100)" />
      </svg>

      {/* Main happy Chitti logo container */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center scale-95">
        {/* Background yellow spike rays */}
        <svg className="absolute w-full h-full drop-shadow-[5px_5px_0_#000]" viewBox="0 0 100 100">
          <polygon points="50,5 58,35 88,20 68,42 95,50 68,58 88,80 58,65 50,95 42,65 12,80 32,58 5,50 32,42 12,20 42,35" fill="#ffc815" stroke="#000" strokeWidth="2.5" strokeLinejoin="miter" />
        </svg>

        {/* Inner smiling face circle */}
        <div className="absolute w-[68%] h-[68%] rounded-full bg-amber-400 border-4 border-black shadow-[inner_3px_3px_0_rgba(255,255,255,0.4)] flex flex-col items-center justify-center">
          {/* Eyes & Eyebrows */}
          <div className="flex gap-8 mb-3">
            <div className="flex flex-col items-center">
              <div className="w-6 h-1 bg-black rounded-full mb-1.5 transform rotate-[-10deg]"></div>
              <div className="w-5 h-5 rounded-full bg-white border-3 border-black flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-6 h-1 bg-black rounded-full mb-1.5 transform rotate-[10deg]"></div>
              <div className="w-5 h-5 rounded-full bg-white border-3 border-black flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-black"></div>
              </div>
            </div>
          </div>

          {/* Happy Open Smiling Mouth */}
          <div className="w-16 h-8 border-4 border-black bg-black rounded-b-full relative overflow-hidden">
            {/* Tongue */}
            <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-8 h-5 rounded-full bg-[#f05030]" />
          </div>

          {/* Chitti Name Badge */}
          <div className="absolute bottom-6 px-4 py-1 rounded-lg bg-[#f05030] border-3 border-black text-white font-black tracking-widest text-xs uppercase shadow-[2.5px_2.5px_0_#000] rotate-[-2deg]">
            $CHITTI
          </div>
        </div>
      </div>

      {/* POW! GROUNDED IN DB starbadge in top-right */}
      <div className="absolute top-0 right-[-10px] sm:right-[-20px] w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center transform rotate-[12deg] hover:scale-105 transition-transform duration-300">
        <svg className="absolute w-full h-full drop-shadow-[4px_4px_0_#000]" viewBox="0 0 100 100">
          <polygon points="50,5 60,30 85,15 70,40 95,50 70,60 85,85 60,70 50,95 40,70 15,85 30,60 5,50 30,40 15,15 40,30" fill="#f05030" stroke="#000" strokeWidth="2.5" />
        </svg>
        <div className="absolute flex flex-col items-center text-center text-white px-2">
          <span className="text-[10px] font-mono font-black tracking-wider text-amber-300">POW!</span>
          <span className="text-[10px] font-black uppercase leading-none tracking-tighter">CSE-BOT ACTIVE!</span>
        </div>
      </div>

      {/* Floating K coin badge under it */}
      <div className="absolute bottom-6 left-12 w-12 h-12 rounded-full bg-amber-400 border-3 border-black flex items-center justify-center shadow-[3px_3px_0_#000] transform rotate-[-15deg] font-display font-black text-xl text-slate-950">
        C
      </div>
    </div>
  )
}

export default function LandingPage({ onStartChat, onOpenAuth, theme, setTheme }) {
  const [heroSearch, setHeroSearch] = useState('')
  const heroRef = useRef(null)

  const handleAuthTrigger = (role = 'student') => {
    if (onOpenAuth) {
      onOpenAuth(role)
    } else {
      onStartChat()
    }
  }

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
    handleAuthTrigger('student')
  }

  return (
    <div className={`min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden select-none transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Cyber Grid & Floating Math Background */}
      <TechBackground />

      {/* 1. FLOATING NEUBRUTALIST POP ART HEADER */}
      <header className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="w-full rounded-3xl border-3 border-black panel-theme shadow-[4px_4px_0_0_var(--border-color)] px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          
          {/* Left Brand Identity */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => handleAuthTrigger('student')}>
            <div className="w-8 h-8 rounded-full bg-[#ffc815] border-2 border-black flex items-center justify-center font-display font-black text-black text-base shadow-[2.5px_2.5px_0_0_#000]">
              C
            </div>
            <span className="font-display font-black text-xl italic text-theme-primary tracking-wider uppercase">
              CHITTI!
            </span>
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleAuthTrigger('student')}
              className="px-4 py-1.5 rounded-full bg-[#ffc815] border-2 border-black text-black font-display font-black text-[11px] uppercase tracking-wider shadow-[2.5px_2.5px_0_0_#000]"
            >
              $CHITTI • PORTALS LIVE
            </button>
            
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-full border-2 border-black panel-theme shadow-[1.5px_1.5px_0_0_var(--border-color)]"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#ffc815]" /> : <Moon className="w-3.5 h-3.5 text-[#f05030]" />}
            </button>
          </div>

        </div>
      </header>

      {/* 2. CINEMATIC HERO SECTION: POP ART REDESIGN */}
      <main ref={heroRef} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 lg:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        
        {/* Left Hero Content */}
        <div className="w-full lg:w-7/12 space-y-6 sm:space-y-8 text-left">
          
          {/* Dialogue Speech Bubble */}
          <div className="anime-hero-item opacity-0 inline-flex relative p-3 rounded-2xl panel-theme border-3 border-black font-mono font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-[3px_3px_0_var(--border-color)] rotate-[-1deg] max-w-max">
            <span className="text-theme-primary">HOLY DATABASE, IT'S FINALLY HERE!</span>
            <div className="absolute bottom-[-13px] left-8 w-0 h-0 border-solid border-t-[10px] border-r-[10px] border-b-0 border-l-0 border-t-black border-r-transparent" />
            <div className="absolute bottom-[-8px] left-9 w-0 h-0 border-solid border-t-[7px] border-r-[7px] border-b-0 border-l-0 border-t-[var(--bg-card)] border-r-transparent z-10" />
          </div>

          {/* Headline */}
          <div className="anime-hero-item opacity-0">
            <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-black tracking-tight leading-[0.95] uppercase font-display text-theme-primary">
              THE AI SWARM <br />
              THAT <span className="text-[#f05030] drop-shadow-[2.5px_2.5px_0_#000]">PUNCHES</span> <br />
              ABOVE ITS CAP.
            </h1>
          </div>

          {/* Presale Progress Card */}
          <div className="anime-hero-item opacity-0 p-4 sm:p-5 rounded-2xl panel-theme border-3 border-black shadow-[4px_4px_0_var(--border-color)] max-w-lg space-y-3">
            <div className="flex justify-between items-center text-xs font-mono font-black text-theme-primary uppercase">
              <span>ADVISORY ACTIVITY RADAR</span>
              <span style={{ color: 'var(--accent-red)' }} className="font-black">15,400+ RESOLVED / 20K LIMIT</span>
            </div>
            
            <div className="h-8 w-full bg-theme-input border-3 border-black rounded-xl overflow-hidden relative shadow-inner">
              <div 
                className="h-full bg-[#f05030] flex items-center justify-center text-white font-mono font-black text-xs tracking-wider" 
                style={{ 
                  width: '77%', 
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.15) 10px, rgba(0,0,0,0.15) 20px)' 
                }}
              >
                77% SYNCED!
              </div>
            </div>
          </div>

          {/* Countdown & Buy Button */}
          <div className="anime-hero-item opacity-0 space-y-4 max-w-lg">
            <span className="text-xs font-mono font-black text-[#f05030] uppercase tracking-wider block">NEXT SYSTEM EVALUATION IN...</span>
            
            <div className="flex gap-2">
              {[
                { val: '03', label: 'DAYS' },
                { val: '07', label: 'HRS' },
                { val: '42', label: 'MIN' },
                { val: '18', label: 'SEC' }
              ].map((c, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[#0a0a0a] border-3 border-black shadow-[3px_3px_0_var(--border-color)] flex items-center justify-center font-display font-black text-2xl sm:text-3xl text-[#ffc815]">
                    {c.val}
                  </div>
                  <span className="text-[9px] font-mono font-black text-theme-secondary mt-1">{c.label}</span>
                </div>
              ))}
            </div>

            {/* Massive Yellow Buy Button */}
            <button
              onClick={() => handleAuthTrigger('student')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider comic-btn cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>ACCESS CSE-BOT NOW!</span>
              <ArrowRight className="w-5 h-5 text-slate-950 stroke-[3]" />
            </button>
          </div>

        </div>

        {/* Right Hero Graphic: Happy Sunburst Chitti Illustration */}
        <div className="anime-hero-item opacity-0 w-full lg:w-5/12 flex items-center justify-center relative">
          <ChittiCartoonIllustration />
        </div>

      </main>

      {/* 3. DUAL PORTAL WORKSPACE GATEWAY (Student vs. Faculty) */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 border-t-3 border-black">
        
        <div className="text-center space-y-3 mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-2xl bg-[#ffc815] border-2 border-black text-xs font-mono text-black font-black shadow-[2px_2px_0_0_#000]">
            <Shield className="w-3.5 h-3.5" />
            <span>ROLE-BASED ACADEMIC ENVIRONMENT</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-black leading-none uppercase tracking-tight text-theme-primary drop-shadow-[2.5px_2.5px_0_#f05030] font-display">
            Tailored Portals for <span className="text-[#f05030]">Students & Faculty</span>
          </h2>
          <p className="text-xs sm:text-sm text-theme-secondary font-black max-w-lg mx-auto">
            Dedicated AI workspaces customized with specific agents, databases, and permission scopes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Student Portal Card */}
          <div className="p-6 sm:p-8 rounded-3xl comic-card panel-theme flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffc815] border-2 border-black flex items-center justify-center p-3 text-black shadow-[2px_2px_0_0_#000]">
                <GraduationCap className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-mono text-[#f05030] font-bold uppercase tracking-wider block mb-1">
                  Student Workspace
                </span>
                <h3 className="text-2xl font-black text-theme-primary uppercase font-display">
                  Intelligent Student Portal
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-theme-secondary font-semibold leading-relaxed">
                Personalized CS Bot, peer & professor AI messaging, semester academic calendar sync, and global hackathon opportunity radar tailored to your section and year.
              </p>

              <ul className="space-y-2 text-xs font-mono text-theme-primary font-black">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f05030] shrink-0" />
                  <span>Interactive CS Programming & Algo Tutor</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f05030] shrink-0" />
                  <span>In-App Messages with Thread Summarizer</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f05030] shrink-0" />
                  <span>Academic & Personal Calendar Agent</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f05030] shrink-0" />
                  <span>Global & Regional Hackathon Opportunities</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleAuthTrigger('student')}
              className="w-full py-3.5 rounded-2xl bg-[#ffc815] text-black font-mono font-extrabold text-xs flex items-center justify-center gap-2 comic-btn cursor-pointer"
            >
              <span>Student Register / Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Faculty Portal Card */}
          <div className="p-6 sm:p-8 rounded-3xl comic-card panel-theme flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ffc815] border-2 border-black flex items-center justify-center p-3 text-black shadow-[2px_2px_0_0_#000]">
                <Users className="w-6 h-6" />
              </div>

              <div>
                <span className="text-xs font-mono text-[#f05030] font-bold uppercase tracking-wider block mb-1">
                  Faculty & Advisor Portal
                </span>
                <h3 className="text-2xl font-black text-theme-primary uppercase font-display">
                  Faculty Advisory Portal
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-theme-secondary font-semibold leading-relaxed">
                Tutor and class advisor tools, academic schedule publisher, student progress analytics, UG PAC governance, and assessment committee oversight.
              </p>

              <ul className="space-y-2 text-xs font-mono text-theme-primary font-black">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f05030] shrink-0" />
                  <span>Class Advisor & Tutor Workspace</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f05030] shrink-0" />
                  <span>Academic Schedule & Event Publisher</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f05030] shrink-0" />
                  <span>UG PAC & Assessment Committee Records</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f05030] shrink-0" />
                  <span>Curriculum & Professional Electives Registry</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleAuthTrigger('faculty')}
              className="w-full py-3.5 rounded-2xl bg-[#f05030] text-white font-mono font-extrabold text-xs flex items-center justify-center gap-2 comic-btn cursor-pointer"
            >
              <span>Faculty Register / Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </section>

      {/* 3.5 GSAP BUBBLE MENU — JOY OF LEARNING & PLATFORM NAVIGATION */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t-3 border-black space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-2xl bg-[#ffc815] border-2 border-black text-xs font-mono text-black font-bold shadow-[2px_2px_0_0_#000]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Joyful Navigation</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold leading-none tracking-tight text-theme-primary font-display">
            Experience the Joy of <span className="text-[#f05030]">CSE-Bot Platform</span>
          </h2>
          <p className="text-xs sm:text-sm text-theme-secondary font-normal max-w-xl mx-auto">
            Click the menu bubble to reveal joyful quick-action navigation pills powered by GSAP animations.
          </p>
        </div>

        {/* GSAP Bubble Menu Component */}
        <BubbleMenu
          logo={<span className="font-mono font-bold text-xs uppercase text-black flex items-center gap-1"><Sparkles className="w-4 h-4 text-[#f05030]" /> Joy of Learning CSE-Bot</span>}
          menuAriaLabel="Toggle joyful menu"
          menuBg="#ffffff"
          menuContentColor="#111111"
          useFixedPosition={false}
          animationEase="back.out(1.5)"
          animationDuration={0.5}
          staggerDelay={0.12}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         4. GIANT TYPOGRAPHY SCROLL SHOWCASE (ScrollTextLines Component)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 border-t-3 border-black">
        <ScrollTextLines
          agents={[
            { name: "FACULTY", key: "faculty_agent", desc: "Professors & HoD Directory", color: "#ffc815" },
            { name: "CURRICULUM", key: "curriculum_agent", desc: "Semesters 1-8 Syllabi & Credits", color: "#f05030" },
            { name: "CODING TUTOR", key: "tutor_agent", desc: "Interactive CS Programming & Algorithm Tutor", color: "#10b981" },
            { name: "PLACEMENT", key: "placement_agent", desc: "CoE Labs & Corporate Drives Radar", color: "#3b82f6" },
            { name: "VIRTUAL HOST", key: "reception_agent", desc: "Multi-Lingual Receptionist & Host", color: "#8b5cf6" }
          ]}
          onSelectAgent={(key) => handleAuthTrigger('student')}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════
         5. CTA & FOOTER SECTION (SECE WATERMARK + WE CSE.)
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="relative z-10 w-full border-t-3 border-black overflow-hidden py-16 sm:py-24 px-4 sm:px-6">
        
        {/* Giant SECE Watermark Background Text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
          <span className="font-black text-[28vw] sm:text-[24vw] tracking-tighter uppercase leading-none select-none pointer-events-none transition-colors duration-300"
            style={{ color: 'var(--text-primary)', opacity: 0.05 }}>
            SECE
          </span>
        </div>

        {/* Main CTA Content */}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-8">
          
          {/* WE CSE. Headline */}
          <div className="space-y-3">
            <h2 className="text-5xl sm:text-8xl font-black tracking-tight leading-none uppercase text-theme-primary drop-shadow-[3px_3px_0_#f05030] font-display">
              WE <span className="text-[#f05030]">CSE.</span>
            </h2>
            <p className="text-sm sm:text-lg font-black text-theme-secondary max-w-md mx-auto">
              Empowering Future Engineers with AI & Multi-Agent Intelligence.
            </p>
          </div>

          {/* Floating Pill CTA Button */}
          <button
            onClick={() => handleAuthTrigger('student')}
            className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl bg-[#ffc815] border-2 border-black hover:bg-[#f0b500] text-xs sm:text-sm font-mono font-black text-black shadow-[3px_3px_0_0_#000] cursor-pointer hover:translate-y-[-1px] transition-all flex items-center gap-2.5 group comic-btn"
          >
            <Bot className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
            <span>Enter Department Platform</span>
            <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Bottom Attribution & Links Row */}
          <div className="w-full pt-12 sm:pt-16 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-theme-primary font-black">
            
            {/* Department Identity */}
            <div className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-[#f05030]" />
              <span>Sri Eshwar College of Engineering • Dept of Computer Science</span>
            </div>

            {/* Center Crafted With Heart Pill */}
            <div className="px-4 py-2 rounded-2xl panel-theme border-2 border-black flex items-center gap-2 shadow-[2px_2px_0_0_var(--border-color)] font-black">
              <span className="uppercase text-[11px]">CRAFTED WITH</span>
              <Heart className="w-3.5 h-3.5 text-[#f05030] fill-[#f05030] animate-pulse" />
              <span className="uppercase text-[11px]">BY <strong className="text-[#f05030] font-bold">SECE CSE</strong></span>
            </div>

            {/* Right Department Links */}
            <div className="flex items-center gap-4 text-[11px]">
              <span className="hover:text-[#f05030] cursor-pointer transition-colors" onClick={() => handleAuthTrigger('student')}>Department AI</span>
              <span>|</span>
              <span className="hover:text-[#f05030] cursor-pointer transition-colors" onClick={() => handleAuthTrigger('faculty')}>SECE Portal</span>
            </div>

          </div>

        </div>

      </footer>

      {/* ═══════════════════════════════════════════════════════════════
         6. FLOATING CIRCULAR ASSISTANT CHAT WIDGET
      ═══════════════════════════════════════════════════════════════ */}
      <button
        onClick={() => handleAuthTrigger('student')}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-amber-400 border-3 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] flex items-center justify-center cursor-pointer group hover:translate-y-[-2px] active:translate-y-[2px]"
        title="Open Chitti Assistant"
      >
        <MessageSquare className="w-6 h-6 fill-slate-950 group-hover:rotate-12 transition-transform" />
      </button>

    </div>
  )
}
