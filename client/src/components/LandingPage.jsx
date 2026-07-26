import React from 'react'
import { MessageSquare, ArrowRight, Sun, Moon, GraduationCap, Zap, Shield, ChevronDown } from 'lucide-react'
import origamImg from '../reference/image2.png'
import TechBackground from './TechBackground'

export default function LandingPage({ onStartChat, theme, setTheme }) {
  return (
    <div className={`min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden select-none transition-colors duration-300 ${theme}`}
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      
      {/* Cyber Grid & Floating Math Background */}
      <TechBackground />

      {/* ═══════════════════════════════════════════════════════════════
         1. CLEAN TOP HEADER (Theme Switcher Only)
      ═══════════════════════════════════════════════════════════════ */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onStartChat}>
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center p-1.5 shadow-lg shadow-amber-500/10">
            <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2zm-4 7H6v3h2V9zm10 0h-2v3h2V9zm-5 5h-2v2h2v-2z" />
            </svg>
          </div>
          <span className="text-2xl font-extrabold tracking-tight font-display">
            <span style={{ color: 'var(--text-primary)' }}>CSE-</span>
            <span className="text-amber-400">Bot</span>
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl border border-brand-border bg-brand-light hover:border-amber-400/50 text-gray-300 hover:text-amber-400 transition-all shadow-md"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>


      {/* ═══════════════════════════════════════════════════════════════
         2. HERO SECTION (Matching Screenshot Layout)
      ═══════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 lg:py-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Hero Text Content */}
        <div className="w-full lg:w-1/2 space-y-8 text-left">
          
          {/* Main Huge Typography Headline */}
          <div className="space-y-1">
            <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight leading-none font-display">
              <span className="block text-white">CSE-</span>
              <span className="block text-amber-400">Bot</span>
            </h1>
          </div>

          {/* Subtitle & Description */}
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
              Your Intelligent Assistant for <br />
              <span className="text-amber-400">Computer Science & Engineering.</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
              Ask anything. Get answers. Learn, explore and innovate with the power of AI.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onStartChat}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-amber-400 text-slate-950 font-bold text-base hover:bg-amber-300 shadow-xl shadow-amber-400/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageSquare className="w-5 h-5 fill-slate-950" />
              <span>Start Chat</span>
            </button>

            <button
              onClick={onStartChat}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-brand-border bg-brand-light/60 hover:border-amber-400/50 text-white font-semibold text-base transition-all hover:bg-brand-light"
            >
              <span>Explore Features</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Bottom Feature Badges */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-brand-border/60 max-w-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Knowledge</p>
                <p className="text-sm font-bold text-white">Unlimited</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-brand-border/60 pl-4">
              <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Answers</p>
                <p className="text-sm font-bold text-white">Instant</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-brand-border/60 pl-4">
              <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs text-gray-400">Powered by</p>
                <p className="text-sm font-bold text-white">AI</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Hero Graphic: Origami Swan / Plane (image2.png) */}
        <div className="w-full lg:w-1/2 flex items-center justify-center relative">
          <div className="relative w-full max-w-lg flex items-center justify-center p-4 animate-roboFloat">
            {/* Soft Ambient Glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/15 via-white/5 to-amber-500/15 blur-3xl opacity-70" />
            
            <img
              src={origamImg}
              alt="CSE-Bot Origami Graphic"
              className="w-full h-auto max-h-[500px] object-contain drop-shadow-[0_25px_50px_rgba(255,193,7,0.25)] transform hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

      </main>

      {/* ═══════════════════════════════════════════════════════════════
         3. FOOTER SCROLL INDICATOR
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="relative z-20 pb-6 flex flex-col items-center justify-center">
        <button onClick={onStartChat} className="flex flex-col items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors group cursor-pointer">
          <ChevronDown className="w-4 h-4 animate-bounce" />
          <span className="text-xs font-mono font-medium tracking-widest uppercase">Scroll</span>
        </button>
      </footer>

    </div>
  )
}
