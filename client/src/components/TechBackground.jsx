import React from 'react'

export default function TechBackground({ theme }) {
  const elements = [
    { text: 'POW!',     x: '12%', y: '16%', size: 36, delay: '0s',   dur: '10s', color: '#f05030' },
    { text: 'ZAP!',     x: '52%', y: '24%', size: 28, delay: '2s',   dur: '12s', color: '#ffc815' },
    { text: 'KAPOW!',   x: '85%', y: '14%', size: 32, delay: '1s',   dur: '14s', color: '#2a7be4' },
    { text: 'BOOM!',    x: '72%', y: '68%', size: 40, delay: '3s',   dur: '11s', color: '#f05030' },
    { text: 'BAM!',     x: '24%', y: '78%', size: 24, delay: '0.5s', dur: '13s', color: '#ffc815' },
    { text: 'CHITTI!',  x: '48%', y: '82%', size: 30, delay: '1.5s', dur: '15s', color: '#2a7be4' },
    { text: 'SECE!',    x: '90%', y: '56%', size: 26, delay: '4s',   dur: '16s', color: '#f05030' },
    { text: 'CSE!',     x: '8%',  y: '60%', size: 34, delay: '2.5s', dur: '12s', color: '#ffc815' }
  ]

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 halftone-bg">
      {/* Dynamic Pop Art Sunburst rays background overlay (extremely faint) */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,200,21,0.25)_0,transparent_60%)]" />

      {/* Floating Cartoon Exclamations */}
      {elements.map((el, i) => (
        <span
          key={i}
          className="absolute font-display font-black tracking-widest uppercase select-none pointer-events-none"
          style={{
            left: el.x,
            top: el.y,
            fontSize: el.size,
            color: el.color,
            textShadow: '3px 3px 0px #000',
            WebkitTextStroke: '1.5px #000',
            animation: `drift ${el.dur} ease-in-out infinite`,
            animationDelay: el.delay,
            transform: 'rotate(-8deg)'
          }}
        >
          {el.text}
        </span>
      ))}
    </div>
  )
}
