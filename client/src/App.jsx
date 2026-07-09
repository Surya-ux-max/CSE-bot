import { useState, useEffect, useRef } from 'react'
import {
  Send, Trash2, Home, ArrowRight, ChevronRight, ArrowLeft, RefreshCw,
  MessageSquare, BookOpen, Zap, ShieldCheck, Bot, Menu, X, ChevronDown,
  GraduationCap, Sparkles, Plus, Search, Copy, ThumbsUp, ThumbsDown,
  Volume2, Download, Settings, Sun, Moon, Paperclip, Mic, BadgeCheck,
  FlaskConical, FileText, Calendar, Users, Briefcase, RotateCcw,
  Code2, Terminal,
} from 'lucide-react'
import './App.css'

/* ═══════════════════════════════════════════════════════════════
   TECH BACKGROUND (Landing hero)
═══════════════════════════════════════════════════════════════ */
function TechBackground() {
  const elements = [
    { text: 'E = mc²',         x: '55%', y: '11%', size: 22, delay: '0s',   dur: '15s', alt: false },
    { text: '∇·E = ρ/ε₀',     x: '53%', y: '55%', size: 18, delay: '2s',   dur: '20s', alt: true  },
    { text: 'a² + b² = c²',    x: '80%', y: '59%', size: 16, delay: '4s',   dur: '13s', alt: false },
    { text: '∫ f(x)dx',        x: '54%', y: '74%', size: 22, delay: '1s',   dur: '17s', alt: true  },
    { text: '1010 0011',       x: '78%', y: '10%', size: 13, delay: '0.5s', dur: '22s', alt: false },
    { text: '0110 1101',       x: '78%', y: '17%', size: 13, delay: '0.5s', dur: '22s', alt: false },
    { text: '</>',             x: '86%', y: '26%', size: 28, delay: '1.5s', dur: '12s', alt: true  },
    { text: 'int main() {',    x: '80%', y: '46%', size: 12, delay: '2.5s', dur: '18s', alt: false },
    { text: '  return 0;',     x: '82%', y: '52%', size: 12, delay: '2.5s', dur: '18s', alt: false },
    { text: '}',               x: '80%', y: '58%', size: 12, delay: '2.5s', dur: '18s', alt: false },
    { text: '[1  0  0]',       x: '83%', y: '76%', size: 11, delay: '3.5s', dur: '14s', alt: true  },
    { text: '[0  1  0]',       x: '83%', y: '82%', size: 11, delay: '3.5s', dur: '14s', alt: true  },
    { text: '[0  0  1]',       x: '83%', y: '88%', size: 11, delay: '3.5s', dur: '14s', alt: true  },
    { text: 'O(n log n)',      x: '60%', y: '87%', size: 13, delay: '5s',   dur: '19s', alt: false },
    { text: 'σ(x)=1/(1+e⁻ˣ)', x: '57%', y: '35%', size: 12, delay: '6s',   dur: '23s', alt: true  },
  ]
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: 0 }}>
      <svg className="absolute animate-pulseGlow"
        style={{ right: '4%', top: '8%', width: 520, height: 520, opacity: 0.055 }} viewBox="0 0 520 520">
        {[260,210,160,110,60].map((r,i) => (
          <circle key={i} cx="260" cy="260" r={r} stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" fill="none" />
        ))}
        <line x1="0" y1="260" x2="520" y2="260" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <line x1="260" y1="0" x2="260" y2="520" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
        <line x1="76" y1="76" x2="444" y2="444" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
        <line x1="444" y1="76" x2="76" y2="444" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
      </svg>
      <div className="absolute" style={{
        left: '42%', right: 0, top: 0, bottom: 0,
        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)`,
        backgroundSize: '55px 55px',
      }} />
      {[{x:'64%',y:'33%'},{x:'74%',y:'22%'},{x:'88%',y:'42%'},{x:'59%',y:'67%'},{x:'91%',y:'71%'},{x:'70%',y:'82%'}].map((d,i)=>(
        <div key={i} className="absolute rounded-full animate-pulseGlow"
          style={{ left:d.x, top:d.y, width:3, height:3, background:'#ffc107', opacity:0.45,
            animationDelay:`${i*0.7}s`, animationDuration:`${3+i*0.5}s` }} />
      ))}
      {elements.map((el,i)=>(
        <span key={i} className="absolute font-mono text-white"
          style={{ left:el.x, top:el.y, fontSize:el.size, opacity:0.085, letterSpacing:'0.03em',
            animation:`${el.alt?'driftAlt':'drift'} ${el.dur} ease-in-out infinite`, animationDelay:el.delay }}>
          {el.text}
        </span>
      ))}
      <div className="scan-line" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CHAT TECH BACKGROUND (right side only, very subtle)
═══════════════════════════════════════════════════════════════ */
function ChatTechBackground() {
  const elems = [
    { text: 'E = mc²',      x: '72%', y: '8%',  size: 16, delay: '0s',  dur: '18s' },
    { text: '[1 0 0]',      x: '80%', y: '18%', size: 10, delay: '1s',  dur: '14s' },
    { text: '[0 1 0]',      x: '80%', y: '24%', size: 10, delay: '1s',  dur: '14s' },
    { text: '[0 0 1]',      x: '80%', y: '30%', size: 10, delay: '1s',  dur: '14s' },
    { text: '#include <iostream>', x: '68%', y: '40%', size: 9, delay: '2s', dur: '20s' },
    { text: 'int main() {', x: '70%', y: '47%', size: 9, delay: '2s',  dur: '20s' },
    { text: '  return 0;',  x: '72%', y: '53%', size: 9, delay: '2s',  dur: '20s' },
    { text: '}',            x: '70%', y: '58%', size: 9, delay: '2s',  dur: '20s' },
    { text: 'a²+b²=c²',    x: '75%', y: '68%', size: 13, delay: '3s', dur: '16s' },
    { text: 'O(1)',         x: '82%', y: '58%', size: 11, delay: '0s', dur: '22s' },
    { text: 'O(log n)',     x: '80%', y: '64%', size: 11, delay: '0s', dur: '22s' },
    { text: 'O(n)',         x: '82%', y: '70%', size: 11, delay: '0s', dur: '22s' },
    { text: 'O(n log n)',   x: '79%', y: '76%', size: 11, delay: '0s', dur: '22s' },
    { text: 'O(n²)',        x: '82%', y: '82%', size: 11, delay: '0s', dur: '22s' },
    { text: '1010 0011',   x: '69%', y: '14%', size: 10, delay: '4s', dur: '25s' },
    { text: '0101 1101',   x: '69%', y: '20%', size: 10, delay: '4s', dur: '25s' },
  ]
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: 0 }}>
      {elems.map((el,i)=>(
        <span key={i} className="absolute font-mono"
          style={{ left:el.x, top:el.y, fontSize:el.size, opacity:0.06, color:'#d1d5db', letterSpacing:'0.04em',
            animation:`drift ${el.dur} ease-in-out infinite`, animationDelay:el.delay }}>
          {el.text}
        </span>
      ))}
      {/* subtle neural dots */}
      {[{x:'90%',y:'35%'},{x:'95%',y:'50%'},{x:'88%',y:'62%'},{x:'92%',y:'75%'}].map((d,i)=>(
        <div key={i} className="absolute rounded-full animate-pulseGlow"
          style={{ left:d.x, top:d.y, width:4, height:4, background:'#ffc107', opacity:0.12,
            animationDelay:`${i*1.2}s`, animationDuration:`${4+i}s` }} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════════ */
function Navbar({ onStartChat, theme }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const links = ['Home','About','Features','Departments','Resources','Contact']
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 animate-navReveal transition-all duration-300 ${scrolled ? `nav-glass shadow-md ${theme === 'dark' ? 'shadow-black/60' : 'shadow-gray-200/40'}` : 'bg-transparent'}`}>
      <div className="max-w-[1320px] mx-auto px-6 lg:px-10 h-[66px] flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0">
          <div className="w-[38px] h-[38px] rounded-lg flex items-center justify-center border" style={{ background: theme === 'dark' ? '#1a1a1a' : '#f3f4f6', borderColor: theme === 'dark' ? '#333' : '#e5e7eb' }}>
            <Bot size={20} color="#ffc107" />
          </div>
          <span className="font-display tracking-wide leading-none" style={{ fontSize:22, color: theme === 'dark' ? '#fff' : '#111827' }}>
            CSE-<span style={{ color:'#ffc107' }}>Bot</span>
          </span>
        </div>
        <ul className="hidden lg:flex items-center gap-1">
          {links.map((link,i) => (
            <li key={i}>
              <a href={`#${link.toLowerCase()}`}
                className={`px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-200 ${link==='Home' ? 'nav-link-active ' + (theme === 'dark' ? 'text-white' : 'text-gray-900') : (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}>
                {link}
              </a>
            </li>
          ))}
        </ul>
        <button id="nav-cta" onClick={onStartChat}
          className="hidden lg:flex items-center gap-2 btn-primary text-sm py-2.5 px-5 rounded-xl cursor-pointer" style={{ fontSize:14 }}>
          Start Chatting <ArrowRight size={15} strokeWidth={2.5} />
        </button>
        <button className="lg:hidden p-2 text-gray-300 hover:text-white cursor-pointer"
          onClick={() => setMobileOpen(v=>!v)} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden nav-glass px-6 py-4 flex flex-col gap-2 animate-fadeInUp border-t border-white/5">
          {links.map((link,i)=>(
            <a key={i} href={`#${link.toLowerCase()}`}
              className="text-gray-300 hover:text-white text-sm font-medium py-2.5 px-3 rounded-lg hover:bg-white/5 transition-all"
              onClick={()=>setMobileOpen(false)}>{link}</a>
          ))}
          <button onClick={()=>{setMobileOpen(false);onStartChat()}}
            className="mt-2 btn-primary text-sm py-3 px-5 rounded-xl cursor-pointer flex items-center justify-center gap-2">
            Start Chatting <ArrowRight size={14} />
          </button>
        </div>
      )}
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════════════════════════════ */
function HeroSection({ onStartChat, theme }) {
  return (
    <section id="home" className="relative flex flex-col overflow-hidden transition-colors duration-300" style={{ minHeight:'100vh', background: theme === 'dark' ? '#0a0a0a' : '#f9fafb' }}>
      <TechBackground />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: theme === 'dark'
          ? 'linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.7) 38%, rgba(10,10,10,0.15) 62%, transparent 100%)'
          : 'linear-gradient(90deg, rgba(249,249,251,0.95) 0%, rgba(249,249,251,0.75) 38%, rgba(249,249,251,0.25) 62%, transparent 100%)',
        zIndex:1,
      }} />
      <div className="relative flex flex-1 items-center w-full" style={{ zIndex:2, paddingTop:80, paddingBottom:40 }}>
        <div className="w-full lg:w-[52%] flex flex-col px-6 lg:pl-16 xl:pl-24">
          <div className="flex items-center gap-2.5 mb-8 animate-fadeInUp">
            <div className="relative flex h-[10px] w-[10px]">
              <span className="absolute inline-flex h-full w-full rounded-full"
                style={{ background:'#ffc107', opacity:0.7, animation:'pingDot 1.8s cubic-bezier(0,0,0.2,1) infinite' }} />
              <span className="relative inline-flex rounded-full h-[10px] w-[10px]" style={{ background:'#ffc107' }} />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color:'rgba(255,193,7,0.8)' }}>
              Sri Eshwar College of Engineering · CSE Dept.
            </span>
          </div>
          <div className="animate-slideInLeft mb-8" style={{ lineHeight:0.87 }}>
            <div className={`font-display select-none text-glow-white ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
              style={{ fontSize:'clamp(90px, 14.5vw, 192px)', letterSpacing:'-0.01em', lineHeight:0.87 }}>
              CSE-
            </div>
            <div className="font-display select-none"
              style={{ fontSize:'clamp(90px, 14.5vw, 192px)', letterSpacing:'-0.01em', lineHeight:0.87, color:'#ffc107' }}>
              Bot
            </div>
          </div>
          <div className="mb-2 animate-fadeInUp delay-300">
            <p className={`font-semibold leading-snug ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} style={{ fontSize:'clamp(18px, 2vw, 26px)' }}>
              Your Intelligent Assistant for
            </p>
            <p className="font-bold leading-snug" style={{ fontSize:'clamp(18px, 2vw, 26px)', color:'#ffc107' }}>
              Computer Science &amp; Engineering.
            </p>
          </div>
          <p className={`leading-relaxed mb-10 animate-fadeInUp delay-400 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
            style={{ fontSize:'clamp(13px, 1.1vw, 15px)', maxWidth:460 }}>
            Ask anything. Get answers. Learn, explore and innovate<br />with the power of AI.
          </p>
          <div className="flex flex-wrap gap-4 mb-12 animate-fadeInUp delay-500">
            <button id="hero-start-chat" onClick={onStartChat}
              className="btn-primary flex items-center gap-2.5 cursor-pointer rounded-xl"
              style={{ fontSize:15, paddingTop:14, paddingBottom:14, paddingLeft:28, paddingRight:28 }}>
              <MessageSquare size={17} strokeWidth={2.3} /> Start Chat
            </button>
            <button id="hero-explore" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior:'smooth' })}
              className="btn-ghost flex items-center gap-2.5 cursor-pointer rounded-xl"
              style={{ fontSize:15, paddingTop:14, paddingBottom:14, paddingLeft:28, paddingRight:28 }}>
              Explore Features <ArrowRight size={17} />
            </button>
          </div>
          <div className="flex flex-wrap gap-8 animate-fadeInUp delay-600">
            {[
              { Icon:GraduationCap, label:'Knowledge', sub:'Unlimited' },
              { Icon:Zap,           label:'Answers',   sub:'Instant'   },
              { Icon:ShieldCheck,   label:'Powered by', sub:'AI'       },
            ].map(({ Icon, label, sub }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{ border:'1.5px solid rgba(255,193,7,0.35)' }}>
                  <Icon size={17} className="icon-glow" color="#ffc107" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-medium tracking-widest uppercase leading-none mb-0.5">{label}</div>
                  <div className={`text-[13px] font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex absolute right-0 top-0 bottom-0 items-center justify-center pointer-events-none" style={{ width:'55%' }}>
          <div className="absolute animate-pulseGlow" style={{
            width:560, height:560, borderRadius:'50%',
            background:'radial-gradient(ellipse, rgba(255,193,7,0.04) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)',
            top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          }} />
          <img src="/origami_bird.png" alt="AI Origami Bird" className="animate-floatBird" style={{
            width:'min(580px, 85%)', height:'auto', objectFit:'contain',
            filter:'drop-shadow(0 40px 80px rgba(0,0,0,0.8)) drop-shadow(0 0 60px rgba(255,255,255,0.06))',
            position:'relative', zIndex:2,
          }} />
        </div>
      </div>
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 cursor-pointer animate-fadeInUp delay-1000"
        style={{ zIndex:5 }} onClick={() => document.getElementById('features')?.scrollIntoView({ behavior:'smooth' })}>
        <ChevronDown size={18} className="animate-bounce-slow" color="#ffc107" />
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color:'#ffc107' }}>Scroll</span>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FEATURE CARDS
═══════════════════════════════════════════════════════════════ */
function FeatureCards({ onStartChat, theme }) {
  const cards = [
    { id:'card-knowledge', Icon:BookOpen,    title:'Unlimited Knowledge', desc:'Access the full CSE department knowledge base — faculty, syllabus, committees, regulations and more.' },
    { id:'card-instant',   Icon:Zap,         title:'Instant Answers',     desc:'Get semantically retrieved, precise answers in milliseconds. No more digging through PDFs.' },
    { id:'card-resources', Icon:GraduationCap, title:'Academic Resources', desc:'Course details, POs, project ideas, exam patterns, and placement guidance — all in one place.' },
    { id:'card-ai',        Icon:Sparkles,    title:'AI Powered',          desc:'Built on advanced LLMs with vector database retrieval for accurate, context-aware academic guidance.' },
  ]
  return (
    <section id="features" className="py-24 px-6 lg:px-16 transition-colors duration-300" style={{ background: theme === 'dark' ? '#0a0a0a' : '#f9fafb' }}>
      <div className="max-w-[1320px] mx-auto mb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase mb-6 animate-fadeInUp"
          style={{ background:'rgba(255,193,7,0.09)', border:'1px solid rgba(255,193,7,0.22)', color:'#ffc107' }}>
          <Sparkles size={11} /> Why CSE-Bot
        </div>
        <h2 className={`font-display mb-4 animate-fadeInUp delay-100 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
          style={{ fontSize:'clamp(44px, 7vw, 88px)', lineHeight:0.92 }}>Everything You Need</h2>
        <p className={`text-base max-w-lg mx-auto animate-fadeInUp delay-200 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          One intelligent assistant. Every answer. Always available.
        </p>
      </div>
      <div className="max-w-[1320px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card,i) => (
          <div key={card.id} id={card.id}
            className={`glass-card rounded-2xl p-7 flex flex-col gap-5 cursor-pointer group animate-fadeInUp delay-${(i+3)*100}`}
            onClick={onStartChat}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{ background:'rgba(255,193,7,0.1)', border:'1px solid rgba(255,193,7,0.22)' }}>
              <card.Icon size={24} className="icon-glow" color="#ffc107" />
            </div>
            <div>
              <h3 className={`font-bold text-[17px] mb-2 leading-snug ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>{card.desc}</p>
            </div>
            <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" style={{ color:'#ffc107' }}>
              Try it <ArrowRight size={14} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
═══════════════════════════════════════════════════════════════ */
function LandingPage({ onStartChat, theme }) {
  return (
    <div className="relative overflow-x-hidden" style={{ background: theme === 'dark' ? '#0a0a0a' : '#f9fafb' }}>
      <Navbar onStartChat={onStartChat} theme={theme} />
      <HeroSection onStartChat={onStartChat} theme={theme} />
      <FeatureCards onStartChat={onStartChat} theme={theme} />
      <footer className="py-10 px-6 lg:px-16 transition-colors duration-300" style={{ background: theme === 'dark' ? '#0a0a0a' : '#f3f4f6', borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' }}>
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ background: theme === 'dark' ? '#1a1a1a' : '#ffffff', borderColor: theme === 'dark' ? '#333' : '#e5e7eb' }}>
              <Bot size={14} color="#ffc107" />
            </div>
            <span className={`font-display text-lg tracking-wide leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              CSE-<span style={{ color:'#ffc107' }}>Bot</span>
            </span>
          </div>
          <p className={`text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-gray-500'}`}>© 2025 Department of Computer Science &amp; Engineering, Sri Eshwar College of Engineering.</p>
          <button onClick={onStartChat}
            className="text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            style={{ color:'#ffc107' }}
            onMouseEnter={e=>e.currentTarget.style.color='#fff'}
            onMouseLeave={e=>e.currentTarget.style.color='#ffc107'}>
            Open Assistant <ArrowRight size={12} />
          </button>
        </div>
      </footer>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE BUBBLE COMPONENT
═══════════════════════════════════════════════════════════════ */
function MessageBubble({ m, renderFormattedContent, theme }) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const now = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })

  const handleCopy = () => {
    navigator.clipboard.writeText(m.content).catch(()=>{})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (m.role === 'user') {
    return (
      <div className="flex justify-end animate-fadeInUp">
        <div className="flex flex-col items-end gap-1.5 max-w-[72%]">
          <div className="rounded-2xl rounded-tr-sm px-5 py-3.5 text-sm font-medium text-[#0a0a0a] leading-relaxed animate-pulseGlow"
            style={{ background:'#ffc107', boxShadow: '0 4px 14px rgba(255,193,7,0.2)' }}>
            {m.content}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <span>{now}</span>
            <BadgeCheck size={11} color="#ffc107" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 animate-fadeInUp">
      {/* Bot avatar */}
      <div className="shrink-0 mt-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative transition-colors duration-300"
          style={{ background: theme === 'dark' ? '#1c1c1c' : '#ffffff', border: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid #e5e7eb' }}>
          <Bot size={20} color="#ffc107" />
          <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ background:'#22c55e', borderColor: theme === 'dark' ? '#0a0a0a' : '#ffffff' }} />
        </div>
      </div>

      {/* Content card */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-sm overflow-hidden transition-colors duration-300"
          style={{ background: theme === 'dark' ? '#141414' : '#ffffff', border: theme === 'dark' ? '1px solid #222' : '1px solid #e5e7eb' }}>
          <div className={`px-5 py-4 text-sm leading-relaxed transition-colors duration-300 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
            {renderFormattedContent(m.content)}
          </div>
          {/* Action row */}
          <div className="px-5 py-2.5 flex items-center justify-between transition-colors duration-300"
            style={{ borderTop: theme === 'dark' ? '1px solid #1e1e1e' : '1px solid #e5e7eb' }}>
            <div className="flex items-center gap-1">
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                style={{ color: copied ? '#ffc107' : '#555',
                  background: copied ? 'rgba(255,193,7,0.08)' : 'transparent' }}
                onMouseEnter={e=>{ if(!copied) e.currentTarget.style.color='#888'; e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
                onMouseLeave={e=>{ if(!copied){e.currentTarget.style.color='#555'; e.currentTarget.style.background='transparent'} }}>
                <Copy size={12} /> {copied ? 'Copied' : ''}
              </button>
              <button onClick={()=>{setLiked(v=>!v); setDisliked(false)}}
                className="p-1.5 rounded-lg transition-all cursor-pointer"
                style={{ color: liked ? '#ffc107' : '#555',
                  background: liked ? 'rgba(255,193,7,0.08)' : 'transparent' }}
                onMouseEnter={e=>{ if(!liked){e.currentTarget.style.color='#888'; e.currentTarget.style.background='rgba(255,255,255,0.04)'} }}
                onMouseLeave={e=>{ if(!liked){e.currentTarget.style.color='#555'; e.currentTarget.style.background='transparent'} }}>
                <ThumbsUp size={12} />
              </button>
              <button onClick={()=>{setDisliked(v=>!v); setLiked(false)}}
                className="p-1.5 rounded-lg transition-all cursor-pointer"
                style={{ color: disliked ? '#ef4444' : '#555',
                  background: disliked ? 'rgba(239,68,68,0.08)' : 'transparent' }}
                onMouseEnter={e=>{ if(!disliked){e.currentTarget.style.color='#888'; e.currentTarget.style.background='rgba(255,255,255,0.04)'} }}
                onMouseLeave={e=>{ if(!disliked){e.currentTarget.style.color='#555'; e.currentTarget.style.background='transparent'} }}>
                <ThumbsDown size={12} />
              </button>
              <button className="p-1.5 rounded-lg transition-all cursor-pointer"
                style={{ color:'#555' }}
                onMouseEnter={e=>{e.currentTarget.style.color='#888'; e.currentTarget.style.background='rgba(255,255,255,0.04)'}}
                onMouseLeave={e=>{e.currentTarget.style.color='#555'; e.currentTarget.style.background='transparent'}}>
                <Volume2 size={12} />
              </button>
            </div>
            <span className="text-[10px] text-gray-600">{now}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CHAT INTERFACE — Premium redesign per image1.png
═══════════════════════════════════════════════════════════════ */
function ChatInterface({
  messages, input, setInput, isTyping, sessionId,
  isConnected, checkingConnection, suggestedPrompts,
  onSend, onClearHistory, onBackToHome, checkServerConnection,
  renderFormattedContent, messagesEndRef,
  theme, setTheme, sessions, onSelectSession, onNewChat,
}) {
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)

  // Keyboard shortcut ⌘K / Ctrl+K → new chat
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onNewChat()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNewChat])

  const departments = [
    { Icon: Terminal,   label: 'CSE Department' },
    { Icon: Users,      label: 'Faculty Directory' },
    { Icon: FlaskConical, label: 'Laboratories' },
    { Icon: FileText,   label: 'Regulations' },
    { Icon: Calendar,   label: 'Events & Notices' },
  ]

  const quickActions = [
    { icon: <Code2 size={13} />, label: 'Explain DSA',         query: 'Explain Data Structures and Algorithms concepts in CSE.' },
    { icon: <Terminal size={13} />, label: 'Help with Code',   query: 'Help me understand a coding concept or debug code.' },
    { icon: <Briefcase size={13} />, label: 'Placement Tips',  query: 'What are the placement preparation tips for CSE students?' },
    { icon: <BookOpen size={13} />, label: 'Study Resources',  query: 'What study resources are available in the CSE department?' },
    { icon: <Users size={13} />,  label: 'Department Info',    query: 'Tell me about the CSE department at Sri Eshwar College.' },
  ]

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300" style={{ background: theme === 'dark' ? '#0d0d0d' : '#ffffff' }}>

      {/* ══════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-[280px] shrink-0 h-full transition-colors duration-300"
        style={{ background: theme === 'dark' ? '#111' : '#f3f4f6', borderRight: theme === 'dark' ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)' }}>

        {/* Logo area */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center relative shrink-0"
              style={{ background: theme === 'dark' ? '#1e1e1e' : '#ffffff', border: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid #e5e7eb' }}>
              <Bot size={22} color="#ffc107" />
              <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2"
                style={{ background:'#22c55e', borderColor: theme === 'dark' ? '#111' : '#f3f4f6' }} />
            </div>
            <div>
              <div className={`font-display text-[20px] leading-none tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                CSE-<span style={{ color:'#ffc107' }}>Bot</span>
              </div>
              <div className="text-[9px] font-semibold text-gray-500 tracking-widest uppercase mt-0.5">
                AI ASSISTANT FOR CSE
              </div>
            </div>
          </div>
        </div>

        {/* New Chat button */}
        <div className="px-4 pb-4">
          <button onClick={onNewChat}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-[13px] text-[#0a0a0a] cursor-pointer transition-all hover:brightness-110"
            style={{ background:'#ffc107' }}>
            <div className="flex items-center gap-2">
              <Plus size={16} strokeWidth={2.5} />
              New Chat
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono opacity-70">
              <span style={{ fontSize:11 }}>⌘</span> K
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors duration-300"
            style={{ background: theme === 'dark' ? '#1a1a1a' : '#ffffff', border: theme === 'dark' ? '1px solid #262626' : '1px solid #e5e7eb' }}>
            <Search size={13} color={theme === 'dark' ? '#555' : '#9ca3af'} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className={`flex-1 bg-transparent outline-none text-xs placeholder-gray-400 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="px-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">Conversations</span>
            <button onClick={onNewChat} className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">
              <Plus size={11} />
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase())).map((conv) => {
              const active = conv.id === sessionId;
              return (
                <button key={conv.id} onClick={() => onSelectSession(conv.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group"
                  style={{
                    background: active 
                      ? (theme === 'dark' ? 'rgba(255,193,7,0.08)' : 'rgba(255,193,7,0.12)') 
                      : 'transparent',
                    borderLeft: active ? '2px solid #ffc107' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if(!active) e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                  onMouseLeave={e => { if(!active) e.currentTarget.style.background='transparent' }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: active ? '#ffc107' : (theme === 'dark' ? '#333' : '#d1d5db') }} />
                    <span className="text-[12px] truncate" style={{ color: active ? (theme === 'dark' ? '#fff' : '#1f2937') : (theme === 'dark' ? '#888' : '#4b5563') }}>
                      {conv.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0 ml-2">{conv.time}</span>
                </button>
              );
            })}
            {sessions.length === 0 && (
              <div className="text-[11px] text-gray-500 px-3 py-4 text-center border border-dashed rounded-xl" style={{ borderColor: theme === 'dark' ? '#222' : '#e5e7eb' }}>
                No chats yet. Ask a question to start.
              </div>
            )}
          </div>

          {/* Departments */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-bold text-gray-600 tracking-widest uppercase">Departments</span>
              <button className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors">
                <RotateCcw size={11} />
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {departments.map((dep, i) => (
                <button key={i}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] text-gray-500 hover:text-gray-200 cursor-pointer transition-all"
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='transparent'}}>
                  <dep.Icon size={13} color="#555" />
                  {dep.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom user row */}
        <div className="p-4 mt-auto" style={{ borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-[#0a0a0a] shrink-0"
                style={{ background:'#ffc107' }}>
                ST
              </div>
              <div>
                <div className={`text-[12px] font-semibold leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Suryaprakash S</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Student</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme === 'light' ? 'text-yellow-600 bg-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
                style={{ 
                  background: theme === 'light' ? '#fff' : 'transparent',
                  border: theme === 'light' ? '1px solid #e5e7eb' : '1px solid transparent'
                }}>
                <Sun size={14} />
              </button>
              <button onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme === 'dark' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
                style={{ 
                  background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent'
                }}>
                <Moon size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════
          MAIN CHAT AREA
      ══════════════════════════════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <ChatTechBackground />

        {/* ── Top Bar ── */}
        <header className="relative z-10 flex items-center justify-between px-6 py-3.5 shrink-0 transition-colors duration-300"
          style={{ background: theme === 'dark' ? 'rgba(13,13,13,0.95)' : 'rgba(255,255,255,0.95)', borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)', backdropFilter:'blur(12px)' }}>
          {/* Left: bot identity */}
          <div className="flex items-center gap-4">
            {/* Mobile back */}
            <button onClick={onBackToHome}
              className="md:hidden text-gray-400 hover:text-white cursor-pointer transition-colors mr-1">
              <ArrowLeft size={18} />
            </button>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center relative shrink-0 transition-colors"
              style={{ background: theme === 'dark' ? '#1c1c1c' : '#ffffff', border: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid #e5e7eb' }}>
              <Bot size={22} color="#ffc107" />
              <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{ background:'#22c55e', borderColor: theme === 'dark' ? '#0d0d0d' : '#ffffff' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-[16px] ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>CSE-Bot</span>
                <BadgeCheck size={15} color="#ffc107" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:'#22c55e' }} />
                <span className="text-[11px] text-gray-500">Official AI Assistant</span>
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-colors"
              style={{ background: theme === 'dark' ? '#1a1a1a' : '#f3f4f6', border: theme === 'dark' ? '1px solid #262626' : '1px solid #e5e7eb' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: checkingConnection ? '#555' : isConnected ? '#22c55e' : '#ffc107' }} />
              <span className="text-gray-500">{checkingConnection ? 'Connecting…' : isConnected ? 'Live' : 'Demo'}</span>
              <button onClick={checkServerConnection} className="text-gray-600 hover:text-white cursor-pointer ml-1 transition-colors">
                <RefreshCw size={9} className={checkingConnection ? 'animate-spin' : ''} />
              </button>
            </div>

            <button onClick={onClearHistory}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-gray-400 hover:text-white cursor-pointer transition-all"
              style={{ background: theme === 'dark' ? '#1a1a1a' : '#f3f4f6', border: theme === 'dark' ? '1px solid #262626' : '1px solid #e5e7eb' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(239,68,68,0.35)'; e.currentTarget.style.color='#ef4444'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=theme === 'dark' ? '#262626' : '#e5e7eb'; e.currentTarget.style.color=theme === 'dark' ? '#888' : '#4b5563'}}>
              <Trash2 size={13} /> Delete Session
            </button>

            <button className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] text-gray-400 hover:text-white cursor-pointer transition-all"
              style={{ background: theme === 'dark' ? '#1a1a1a' : '#f3f4f6', border: theme === 'dark' ? '1px solid #262626' : '1px solid #e5e7eb' }}
              onMouseEnter={e=>{e.currentTarget.style.background=theme === 'dark' ? '#222' : '#e5e7eb'; e.currentTarget.style.color=theme === 'dark' ? '#fff' : '#000'}}
              onMouseLeave={e=>{e.currentTarget.style.background=theme === 'dark' ? '#1a1a1a' : '#f3f4f6'; e.currentTarget.style.color=theme === 'dark' ? '#888' : '#4b5563'}}>
              <Download size={13} /> Export
            </button>

            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-all"
              style={{ background: theme === 'dark' ? '#1a1a1a' : '#f3f4f6', border: theme === 'dark' ? '1px solid #262626' : '1px solid #e5e7eb' }}
              onMouseEnter={e=>{e.currentTarget.style.background=theme === 'dark' ? '#222' : '#e5e7eb'}}
              onMouseLeave={e=>{e.currentTarget.style.background=theme === 'dark' ? '#1a1a1a' : '#f3f4f6'}}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="p-2 rounded-lg text-gray-400 hover:text-white cursor-pointer transition-all"
              style={{ background:'#1a1a1a', border:'1px solid #262626' }}
              onMouseEnter={e=>e.currentTarget.style.background='#222'}
              onMouseLeave={e=>e.currentTarget.style.background='#1a1a1a'}>
              <Settings size={15} />
            </button>

            {/* Mobile menu */}
            <button onClick={onBackToHome}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              style={{ background:'#1a1a1a', border:'1px solid #262626' }}>
              <Home size={15} />
            </button>
          </div>
        </header>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto relative z-10" style={{ padding:'24px 32px', scrollbarWidth:'thin' }}>
          {messages.length === 0 ? (
            /* Welcome empty state */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-10">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-float relative"
                style={{ background:'#1a1a1a', border:'1px solid #2a2a2a', boxShadow:'0 0 40px rgba(255,193,7,0.12)' }}>
                <Bot size={40} color="#ffc107" />
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  style={{ background:'#22c55e', borderColor:'#0d0d0d' }} />
              </div>
              <h2 className={`font-bold text-2xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Welcome to <span style={{ color:'#ffc107' }}>CSE-Bot</span>
              </h2>
              <p className="text-sm text-gray-500 max-w-sm mb-2">
                Your official AI assistant for the CSE Department
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-10">
                <BadgeCheck size={12} color="#ffc107" />
                <span>Official AI Assistant</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                {suggestedPrompts.slice(0,4).map((p,idx) => (
                  <button key={idx} onClick={() => onSend(p.query)}
                    className={`text-xs p-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between group ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    style={{ background: theme === 'dark' ? '#141414' : '#ffffff', border: theme === 'dark' ? '1px solid #222' : '1px solid #e5e7eb' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,193,7,0.3)'; e.currentTarget.style.background=theme === 'dark' ? '#1a1a1a' : '#f9fafb'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=theme === 'dark' ? '#222' : '#e5e7eb'; e.currentTarget.style.background=theme === 'dark' ? '#141414' : '#ffffff'}}>
                    <span>{p.label}</span>
                    <ChevronRight size={13} className="text-gray-600 group-hover:text-yellow-400 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-6">
              {messages.map((m, idx) => (
                <MessageBubble key={idx} m={m} renderFormattedContent={renderFormattedContent} theme={theme} />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-4 animate-fadeInUp">
                  <div className="shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center relative"
                      style={{ background: theme === 'dark' ? '#1c1c1c' : '#f3f4f6', border: theme === 'dark' ? '1px solid #2a2a2a' : '1px solid #e5e7eb' }}>
                      <Bot size={20} color="#ffc107" />
                      <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2"
                        style={{ background:'#22c55e', borderColor:'#0a0a0a' }} />
                    </div>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2"
                    style={{ background:'#141414', border:'1px solid #222' }}>
                    {[0,160,320].map(delay => (
                      <div key={delay} className="w-2 h-2 rounded-full"
                        style={{ background:'#ffc107', animation:`bounce 1.2s ease-in-out infinite ${delay}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="relative z-10 px-6 pb-4 pt-3 shrink-0"
          style={{ background:'rgba(13,13,13,0.97)', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-3xl mx-auto">
            {/* Input box */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-3 transition-all"
              style={{ background:'#1a1a1a', border:'1px solid #2a2a2a' }}
              onFocusCapture={e => e.currentTarget.style.borderColor='rgba(255,193,7,0.4)'}
              onBlurCapture={e => e.currentTarget.style.borderColor='#2a2a2a'}>
              <button className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors shrink-0 p-1">
                <Paperclip size={16} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey) { e.preventDefault(); onSend() } }}
                placeholder="Ask CSE-Bot anything..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600"
                style={{ caretColor:'#ffc107' }}
              />
              <button className="text-gray-600 hover:text-gray-400 cursor-pointer transition-colors shrink-0 p-1">
                <Mic size={16} />
              </button>
              <button
                onClick={() => onSend()}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all disabled:cursor-not-allowed"
                style={{
                  background: input.trim() ? '#ffc107' : '#222',
                  color: input.trim() ? '#0a0a0a' : '#444',
                  boxShadow: input.trim() ? '0 0 16px rgba(255,193,7,0.3)' : 'none',
                }}>
                <Send size={15} strokeWidth={2.5} />
              </button>
            </div>

            {/* Quick action pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
              {quickActions.map((action, i) => (
                <button key={i} onClick={() => onSend(action.query)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-gray-500 hover:text-white whitespace-nowrap cursor-pointer transition-all shrink-0"
                  style={{ background:'#1a1a1a', border:'1px solid #262626' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,193,7,0.3)'; e.currentTarget.style.background='rgba(255,193,7,0.06)'; e.currentTarget.style.color='#ffc107'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#262626'; e.currentTarget.style.background='#1a1a1a'; e.currentTarget.style.color='#666'}}>
                  <span style={{ color:'inherit' }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
              <button className="p-1.5 rounded-full text-gray-600 hover:text-white cursor-pointer transition-all shrink-0"
                style={{ background:'#1a1a1a', border:'1px solid #262626' }}
                onMouseEnter={e=>e.currentTarget.style.background='#222'}
                onMouseLeave={e=>e.currentTarget.style.background='#1a1a1a'}>
                <RotateCcw size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FORMAT CONTENT — Rich markdown renderer
═══════════════════════════════════════════════════════════════ */
function useFormatContent() {
  return (content) => {
    if (!content) return null
    const blocks = content.split(/(```[\s\S]*?```)/g)
    return blocks.map((block, idx) => {
      if (block.startsWith('```')) {
        const langMatch = block.match(/^```(\w+)/)
        const lang = langMatch ? langMatch[1] : 'code'
        const code = block.replace(/```[a-zA-Z]*\n?|```$/g, '').trim()
        return (
          <div key={idx} className="my-3 rounded-xl overflow-hidden" style={{ border:'1px solid #2a2a2a' }}>
            {/* Code block header */}
            <div className="flex items-center justify-between px-4 py-2"
              style={{ background:'#0f0f0f', borderBottom:'1px solid #1e1e1e' }}>
              <div className="flex items-center gap-2">
                <Code2 size={12} color="#555" />
                <span className="text-[11px] font-mono text-gray-500 capitalize">{lang}</span>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(code).catch(()=>{})}
                className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-gray-300 cursor-pointer transition-colors px-2 py-1 rounded-md hover:bg-white/5">
                <Copy size={10} /> Copy
              </button>
            </div>
            {/* Code body */}
            <pre className="px-4 py-4 overflow-x-auto text-[12px] leading-6 font-mono"
              style={{ background:'#0a0a0a', color:'#e2e8f0' }}>
              <code dangerouslySetInnerHTML={{ __html: code
                .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/(import|export|default|return|function|const|let|var|class|if|else|for|while|switch|case|break|new|this|true|false|null|undefined|async|await|try|catch|throw|typeof|instanceof)\b/g, '<span style="color:#ffc107">$1</span>')
                .replace(/('.*?'|".*?")/g, '<span style="color:#86efac">$1</span>')
                .replace(/(\/\/.*)/g, '<span style="color:#4b5563">$1</span>')
                .replace(/\b(\d+)\b/g, '<span style="color:#60a5fa">$1</span>')
              }} />
            </pre>
          </div>
        )
      }

      const lines = block.split('\n')
      const rendered = []
      const parseBold = (text) => text.split(/(\*\*.*?\*\*)/g).map((p, pi) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={pi} className="font-semibold" style={{ color:'#ffc107' }}>{p.slice(2,-2)}</strong>
          : p
      )

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.startsWith('### ')) {
          rendered.push(<h3 key={i} className="font-bold text-white text-[15px] mt-3 mb-1.5">{line.slice(4)}</h3>)
        } else if (line.startsWith('## ')) {
          rendered.push(<h2 key={i} className="font-bold text-white text-[17px] mt-3 mb-2">{line.slice(3)}</h2>)
        } else if (line.match(/^\d+\.\s/)) {
          const text = line.replace(/^\d+\.\s/, '')
          const num = line.match(/^(\d+)\./)[1]
          rendered.push(
            <div key={i} className="flex gap-3 mb-2">
              <span className="text-[12px] font-bold shrink-0 mt-0.5" style={{ color:'#ffc107', minWidth:16 }}>{num}.</span>
              <p className="text-sm text-gray-300 leading-relaxed">{parseBold(text)}</p>
            </div>
          )
        } else if (line.trim().match(/^[-•*] /)) {
          rendered.push(
            <div key={i} className="flex gap-2 mb-1.5">
              <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background:'#ffc107' }} />
              <p className="text-sm text-gray-300 leading-relaxed">{parseBold(line.replace(/^[-•*] /,''))}</p>
            </div>
          )
        } else if (line.trim().startsWith('> [!')) {
          const alertType = line.includes('NOTE') ? 'Note' : 'Important'
          const alertText = lines[++i] ? lines[i].replace(/^>\s*/,'') : ''
          rendered.push(
            <div key={i} className="border-l-[3px] pl-4 py-2 my-3 rounded-r-xl text-sm text-gray-400"
              style={{ borderColor:'#ffc107', background:'rgba(255,193,7,0.04)' }}>
              <span className="block font-bold text-[12px] mb-1" style={{ color:'#ffc107' }}>{alertType}</span>
              {parseBold(alertText)}
            </div>
          )
        } else if (line.trim()) {
          rendered.push(<p key={i} className="text-sm text-gray-300 leading-relaxed mb-2">{parseBold(line)}</p>)
        } else {
          rendered.push(<div key={i} className="h-1.5" />)
        }
      }
      return <div key={idx}>{rendered}</div>
    })
  }
}

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */

const API_BASE = 'http://127.0.0.1:8000'

function App() {
  const [view, setView] = useState('landing')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(true)
  const [theme, setTheme] = useState('dark')
  
  // Dynamic multi-session chat history
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    return 'session_' + Math.random().toString(36).substring(2, 9)
  })
  
  const sessionIdRef = useRef(currentSessionId)
  useEffect(() => {
    sessionIdRef.current = currentSessionId
  }, [currentSessionId])

  const messagesEndRef = useRef(null)
  const formatContent = useFormatContent()

  // Connection check and localStorage loading on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('cse_bot_theme') || 'dark'
    setTheme(savedTheme)

    const savedSessions = localStorage.getItem('cse_bot_sessions')
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions)
        setSessions(parsed)
        if (parsed.length > 0) {
          const lastSession = parsed[0]
          setCurrentSessionId(lastSession.id)
          setMessages(lastSession.messages || [])
        }
      } catch (e) {
        console.error('Error loading saved sessions:', e)
      }
    }
    checkServerConnection()
  }, [])

  // Apply theme class to HTML element
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('cse_bot_theme', theme)
  }, [theme])

  // Sync active messages to local storage session list
  useEffect(() => {
    if (messages.length === 0 && sessions.findIndex(s => s.id === currentSessionId) === -1) {
      return
    }
    
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === currentSessionId)
      const userMsg = messages.find(m => m.role === 'user')?.content || "New Conversation"
      const truncatedTitle = userMsg.length > 35 ? userMsg.substring(0, 32) + '...' : userMsg
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      
      let updated = [...prev]
      if (idx >= 0) {
        if (JSON.stringify(updated[idx].messages) !== JSON.stringify(messages)) {
          updated[idx] = { ...updated[idx], messages, title: truncatedTitle }
        }
      } else {
        updated.unshift({ id: currentSessionId, title: truncatedTitle, messages, time })
      }
      
      localStorage.setItem('cse_bot_sessions', JSON.stringify(updated))
      return updated
    })
  }, [messages, currentSessionId])

  const checkServerConnection = async () => {
    setCheckingConnection(true)
    try {
      const res = await fetch(`${API_BASE}/`, { method: 'GET' })
      setIsConnected(res.ok)
      console.log('[CSE-Bot] Backend reachable:', res.ok)
    } catch (err) {
      console.warn('[CSE-Bot] Backend unreachable, running in Demo Mode.', err)
      setIsConnected(false)
    } finally {
      setCheckingConnection(false)
    }
  }

  const handleNewChat = () => {
    const newId = 'session_' + Math.random().toString(36).substring(2, 9)
    setCurrentSessionId(newId)
    setMessages([])
  }

  const handleSelectSession = (id) => {
    const session = sessions.find(s => s.id === id)
    if (session) {
      setCurrentSessionId(id)
      setMessages(session.messages || [])
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const suggestedPrompts = [
    { label: 'Who is the Head of the Department?',   query: 'Who is the Head of the Department?' },
    { label: 'Who teaches Java Programming?',        query: 'Who teaches Java Programming?' },
    { label: 'UG PAC Coordinator?',                  query: 'Who is the UG Programme Assessment Committee Coordinator?' },
    { label: 'Syllabus details for Cloud?',          query: 'What is the course details or syllabus for Cloud Computing?' },
    { label: 'Explain Recursion',                    query: 'Explain recursion in C++ with a quick code example.' },
    { label: 'Show POs & PEOs',                      query: 'What are the Program Outcomes (POs) and Program Educational Objectives?' },
  ]

  // ── Offline/demo fallback — only used when backend is unreachable
  const getMockAnswer = (query) => {
    const q = query.toLowerCase()
    if (q.includes('hod') || q.includes('head of the department') || q.includes('subha'))
      return '**Dr. R. Subha** is the Professor and Head of the Department of Computer Science and Engineering at Sri Eshwar College of Engineering.\n\nShe leads the department with a focus on academic quality, curriculum delivery, and Outcome-Based Education (OBE) implementation.'
    if (q.includes('java') || q.includes('giridharan'))
      return '**Mr. R. Giridharan** is the Assistant Professor and Module Coordinator for the **Java Programming** course (both Theory and Practical).'
    if (q.includes('pac') || q.includes('assessment') || q.includes('sivakumar'))
      return '**Dr. T. Sivakumar** (Professor, CSE) is the UG Programme Assessment Committee (PAC) Coordinator for the Academic Year 2024–2025.'
    if (q.includes('cloud'))
      return 'Cloud Computing is coordinated by **Dr. S. Ananthi**, Assistant Professor, CSE.'
    if (q.includes('recursion') || q.includes('c++'))
      return '**Recursion** is a technique where a function calls itself.\n\n```cpp\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n```'
    if (q.includes('hello') || q.includes('hi') || q.includes('hey'))
      return 'Hello! I am **CSE-BOT**. How can I help you today?'
    return '> [!NOTE]\n> **Offline Demo Mode** — Backend server is unreachable. Start the FastAPI backend with `uv run python main.py` to get live AI responses.'
  }

  /* ─────────────────────────────────────────────────────────────
     handleSend — LIVE-FIRST strategy:
     Always attempt the real backend. Only use demo fallback if the
     network request itself throws (i.e., server is truly offline).
     This eliminates the stale isConnected closure race condition.
  ───────────────────────────────────────────────────────────── */
  const handleSend = async (textToSend) => {
    const msg = (textToSend || input).trim()
    if (!msg) return

    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    setIsTyping(true)

    try {
      console.log('[CSE-Bot] Sending to backend:', { question: msg, session_id: sessionIdRef.current })

      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: msg,
          session_id: sessionIdRef.current,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      const data = await res.json()
      console.log('[CSE-Bot] Backend response:', data)

      if (!data.answer) {
        throw new Error('Backend returned empty answer field')
      }

      // ✅ Real AI response — update connection state too
      setIsConnected(true)
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])

    } catch (err) {
      console.warn('[CSE-Bot] Backend request failed, using demo fallback:', err.message)

      // Mark as disconnected and show demo response
      setIsConnected(false)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getMockAnswer(msg),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleClearHistory = async () => {
    if (!window.confirm("Delete this conversation session?")) return
    try {
      await fetch(`${API_BASE}/session/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdRef.current }),
      })
      console.log('[CSE-Bot] Server session cleared.')
    } catch (err) {
      console.warn('[CSE-Bot] Could not clear server session:', err.message)
    }
    
    // Remove from local sessions list
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== currentSessionId)
      localStorage.setItem('cse_bot_sessions', JSON.stringify(updated))
      return updated
    })
    
    // Switch to a new session
    handleNewChat()
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${theme}`} style={{ background: theme === 'dark' ? '#0a0a0a' : '#f9fafb', color: theme === 'dark' ? '#f3f4f6' : '#1f2937' }}>
      {view === 'landing' ? (
        <LandingPage onStartChat={() => setView('chat')} theme={theme} />
      ) : (
        <ChatInterface
          messages={messages}
          input={input}
          setInput={setInput}
          isTyping={isTyping}
          sessionId={currentSessionId}
          isConnected={isConnected}
          checkingConnection={checkingConnection}
          suggestedPrompts={suggestedPrompts}
          onSend={handleSend}
          onClearHistory={handleClearHistory}
          onBackToHome={() => setView('landing')}
          checkServerConnection={checkServerConnection}
          renderFormattedContent={formatContent}
          messagesEndRef={messagesEndRef}
          theme={theme}
          setTheme={setTheme}
          sessions={sessions}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />
      )}
    </div>
  )
}

export default App
