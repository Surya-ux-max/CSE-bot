import React, { useState, useEffect, useRef } from 'react'
import { ArrowRight, Bot, ChevronDown } from 'lucide-react'

export default function ScrollTextLines({ agents, onSelectAgent }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Calculate scroll progress relative to this section (0 to 1)
      const totalDist = rect.height + windowHeight
      const currentPos = windowHeight - rect.top
      const progress = Math.max(0, Math.min(1, currentPos / totalDist))
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const defaultAgents = [
    { name: "FACULTY", key: "faculty_agent", color: "#ffc815" },
    { name: "CURRICULUM", key: "curriculum_agent", color: "#f05030" },
    { name: "CODING TUTOR", key: "tutor_agent", color: "#10b981" },
    { name: "PLACEMENT", key: "placement_agent", color: "#3b82f6" },
    { name: "VIRTUAL HOST", key: "reception_agent", color: "#8b5cf6" }
  ]

  const itemsList = agents && agents.length > 0
    ? agents.map(a => ({
        name: a.name === "Coding Tutor" ? "CODING TUTOR" : a.name.replace(/ Agent| Coach/g, '').toUpperCase(),
        key: a.key,
        color: a.color || (a.key === 'tutor_agent' ? '#10b981' : '#ffc815')
      }))
    : defaultAgents

  return (
    <div ref={containerRef} className="w-full relative py-8 sm:py-16 select-none overflow-hidden space-y-6">
      {/* Top Header Label */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4 px-2 sm:px-4">
        <div className="flex items-center gap-2">
          <ChevronDown className="w-4 h-4 text-[#f05030] animate-bounce" />
          <span className="text-xs font-mono font-black uppercase tracking-widest text-theme-primary">
            SCROLL TO EXPLORE KINETIC MULTI-AGENT SYSTEM
          </span>
        </div>
        <span className="text-xs font-mono text-theme-muted font-bold hidden sm:block">
          Autonomous AI Swarm
        </span>
      </div>

      {/* Kinetic Alternating Solid/Outline Text Marquee Rows */}
      <div className="flex flex-col space-y-3 sm:space-y-5 overflow-hidden">
        {itemsList.map((item, idx) => {
          const isEven = idx % 2 === 0
          const directionMultiplier = isEven ? -1 : 1
          const offsetX = (scrollProgress - 0.5) * 140 * directionMultiplier
          const isHovered = activeIdx === idx

          /* Generate repeating words array (Solid, Outline, Solid, Outline, Solid, Outline) */
          const words = [item.name, item.name, item.name, item.name, item.name, item.name]

          return (
            <div
              key={idx}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              onClick={() => onSelectAgent && onSelectAgent(item.key)}
              className="group relative py-2 cursor-pointer overflow-hidden transition-all duration-300 rounded-2xl hover:bg-theme-card/30"
            >
              {/* Sliding Horizontal Marquee Line Track */}
              <div
                style={{
                  transform: `translateX(${offsetX}px)`
                }}
                className="flex items-center gap-6 sm:gap-10 whitespace-nowrap transition-transform duration-100 ease-out"
              >
                {words.map((word, wordIdx) => {
                  const isSolid = wordIdx % 2 === 0

                  return (
                    <span
                      key={wordIdx}
                      className={`text-4xl sm:text-7xl lg:text-8xl xl:text-9xl font-black font-display tracking-tight uppercase leading-none transition-all duration-300 inline-block ${
                        isSolid
                          ? ''
                          : 'text-transparent opacity-75 group-hover:opacity-100'
                      }`}
                      style={{
                        WebkitTextStroke: isSolid
                          ? 'none'
                          : (isHovered ? `2.2px ${item.color}` : `2.2px var(--text-primary)`),
                        color: isSolid
                          ? (isHovered ? item.color : 'var(--text-primary)')
                          : 'transparent',
                        textShadow: isHovered ? `0 0 30px ${item.color}50` : 'none'
                      }}
                    >
                      {word}
                    </span>
                  )
                })}
              </div>

              {/* Floating Action Badge on Hover */}
              <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                <span className="px-4 py-2 rounded-2xl bg-white border-2 border-black text-xs font-mono font-black text-black shadow-[3px_3px_0_0_#000] flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#f05030]" />
                  <span style={{ color: item.color }} className="font-black">{item.key}</span>
                  <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
