import React from 'react'

export default function TechBackground() {
  const elements = [
    { text: 'E = mc²',         x: '62%', y: '16%', size: 22, delay: '0s',   dur: '14s' },
    { text: '∇·E = ρ/ε₀',     x: '48%', y: '68%', size: 18, delay: '2s',   dur: '18s' },
    { text: 'a² + b² = c²',    x: '88%', y: '56%', size: 16, delay: '4s',   dur: '12s' },
    { text: '∫ f(x)dx',        x: '54%', y: '80%', size: 24, delay: '1s',   dur: '16s' },
    { text: '1010 0011',       x: '82%', y: '14%', size: 14, delay: '0.5s', dur: '20s' },
    { text: '0110 1101',       x: '82%', y: '19%', size: 14, delay: '1.5s', dur: '20s' },
    { text: '</>',             x: '92%', y: '24%', size: 28, delay: '1.5s', dur: '11s' },
    { text: 'int main() {',    x: '88%', y: '34%', size: 13, delay: '2.5s', dur: '17s' },
    { text: '  return 0;',     x: '90%', y: '39%', size: 13, delay: '2.5s', dur: '17s' },
    { text: '}',               x: '88%', y: '44%', size: 13, delay: '2.5s', dur: '17s' },
    { text: '[1  0  0]',       x: '78%', y: '83%', size: 12, delay: '3.5s', dur: '13s' },
    { text: '[0  1  0]',       x: '78%', y: '87%', size: 12, delay: '3.5s', dur: '13s' },
    { text: '[0  0  1]',       x: '78%', y: '91%', size: 12, delay: '3.5s', dur: '13s' },
    { text: 'O(n log n)',      x: '15%', y: '35%', size: 14, delay: '5s',   dur: '15s' },
    { text: 'σ(x)=1/(1+e⁻ˣ)', x: '25%', y: '62%', size: 13, delay: '3s',   dur: '19s' },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" style={{ zIndex: 0 }}>
      {/* Grid Overlay */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
                          linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
        backgroundSize: '55px 55px',
      }} />

      {/* Radial Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />

      {/* Floating Math Formulas */}
      {elements.map((el, i) => (
        <span key={i} className="absolute font-mono font-medium"
          style={{
            left: el.x, top: el.y, fontSize: el.size,
            color: 'var(--formula-color)', opacity: 'var(--formula-opacity)', letterSpacing: '0.04em',
            animation: `drift ${el.dur} ease-in-out infinite`, animationDelay: el.delay
          }}>
          {el.text}
        </span>
      ))}
      <div className="scan-line" />
    </div>
  )
}
