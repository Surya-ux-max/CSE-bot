import React from 'react'
import { MessageSquare, ArrowRight, Sun, Moon, GraduationCap, Zap, Shield, Sparkles, Users, BookOpen, Terminal, Rocket } from 'lucide-react'
import origamImg from '../reference/image2.png'
import TechBackground from './TechBackground'

export default function LandingPage({ onStartChat, theme, setTheme }) {
  const agentShowcases = [
    {
      title: "Faculty Directory",
      agent: "faculty_agent",
      icon: <Users className="w-5 h-5 text-amber-400" />,
      description: "HoD profiles, professor research domains, email contacts & committee leadership."
    },
    {
      title: "Curriculum Advisor",
      agent: "curriculum_agent",
      icon: <BookOpen className="w-5 h-5 text-amber-400" />,
      description: "Semester course syllabi, professional electives, credit requirements & industry tracks."
    },
    {
      title: "CS Coding Tutor",
      agent: "tutor_agent",
      icon: <Terminal className="w-5 h-5 text-amber-400" />,
      description: "Step-by-step algorithms, C++/Java/Python syntax debugging & $O(n \\log n)$ analysis."
    },
    {
      title: "Career & Placements",
      agent: "placement_agent",
      icon: <Rocket className="w-5 h-5 text-amber-400" />,
      description: "Centers of Excellence (CoEs), hackathons, skill development labs & placement preparation."
    }
  ]

  return (
    <div className={`min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden select-none transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Cyber Grid & Floating Math Background */}
      <TechBackground />

      {/* ═══════════════════════════════════════════════════════════════
         1. GOOGLE MATERIAL 3 GLASS HEADER
      ═══════════════════════════════════════════════════════════════ */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        
        {/* Brand Logo & College Badge */}
        <div className="flex items-center gap-3.5 cursor-pointer group" onClick={onStartChat}>
          <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center p-2 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
            <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm-4 7H6v3h2V9zm10 0h-2v3h2V9zm-5 5h-2v2h2v-2z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight font-sans" style={{ color: 'var(--text-primary)' }}>CSE-</span>
              <span className="text-2xl font-black tracking-tight text-amber-400 font-sans">Bot</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-[10px] font-mono text-amber-400 font-semibold">
                v2.1 AI
              </span>
            </div>
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              Sri Eshwar College of Engineering
            </p>
          </div>
        </div>

        {/* Right CTA & Theme Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl border border-brand-border bg-brand-light hover:border-amber-400/50 transition-all shadow-md"
            style={{ color: 'var(--text-secondary)' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onStartChat}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-400/25 hover:shadow-amber-400/40 transition-all transform hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Launch Assistant</span>
          </button>
        </div>

      </header>

      {/* ═══════════════════════════════════════════════════════════════
         2. HERO SECTION (GOOGLE DEEPMIND AI STYLE)
      ═══════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 lg:py-12 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Hero Text Content */}
        <div className="w-full lg:w-7/12 space-y-8 text-left">
          
          {/* Department Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-xs font-mono text-amber-400 font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Official Department Multi-Agent Intelligence
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              <span className="block" style={{ color: 'var(--text-primary)' }}>Welcome to</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                CSE-Bot AI
              </span>
            </h1>
            <p className="text-xl sm:text-2xl font-bold tracking-tight mt-2" style={{ color: 'var(--text-primary)' }}>
              Your Intelligent Assistant for <span className="text-amber-400">Computer Science & Engineering</span>
            </p>
          </div>

          {/* Subtitle Description */}
          <p className="text-base sm:text-lg max-w-2xl leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Ask anything about faculty, semester course syllabi, algorithms, and placement preparation. Powered by 5 specialized AI agents and official PostgreSQL department records.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartChat}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-400/30 hover:shadow-amber-400/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageSquare className="w-5 h-5 fill-slate-950" />
              <span>Start Assistant</span>
            </button>

            <button
              onClick={onStartChat}
              className="flex items-center gap-2.5 px-7 py-4 rounded-2xl border border-brand-border bg-brand-light/70 hover:border-amber-400/50 font-bold text-base transition-all hover:bg-brand-light"
              style={{ color: 'var(--text-primary)' }}
            >
              <span>Explore 5 AI Agents</span>
              <ArrowRight className="w-4.5 h-4.5 text-amber-400" />
            </button>
          </div>



        </div>

        {/* Right Hero Graphic: Seamless Blended Origami Plane (image2.png) */}
        <div className="w-full lg:w-5/12 flex items-center justify-center relative">
          <div className="relative w-full max-w-md flex items-center justify-center p-2 animate-roboFloat">
            
            {/* Ambient Golden Cyber Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-400/10 to-amber-500/20 blur-3xl opacity-80" />
            
            {/* Glass Container Blending image2.png */}
            <div className="relative w-full rounded-3xl overflow-hidden border border-amber-400/30 bg-black/40 backdrop-blur-xl p-3 shadow-2xl shadow-amber-500/20 group cursor-pointer" onClick={onStartChat}>
              <img
                src={origamImg}
                alt="CSE-Bot Origami Graphic"
                className="w-full h-auto max-h-[380px] object-contain transform group-hover:scale-105 transition-transform duration-500"
                style={{ mixBlendMode: 'lighten' }}
              />

              {/* Overlay Badge */}
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-brand-light/90 border border-brand-border/80 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>CSE-Bot AI Active</span>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold">SECE CSE</span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* ═══════════════════════════════════════════════════════════════
         3. MULTI-AGENT SHOWCASE CARDS (Interactive Showcase)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-brand-border/60">
        <div className="text-center mb-6">
          <h3 className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-widest">
            Specialized Multi-Agent System
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {agentShowcases.map((item, idx) => (
            <div
              key={idx}
              onClick={onStartChat}
              className="p-5 rounded-2xl border border-brand-border bg-brand-light/40 hover:border-amber-400/60 hover:bg-brand-light/90 transition-all group cursor-pointer space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="text-[10px] font-mono text-amber-400 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
                  {item.agent}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold group-hover:text-amber-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </h4>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
