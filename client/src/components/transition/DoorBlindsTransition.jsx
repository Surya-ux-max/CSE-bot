import React, { useState, useEffect } from 'react'

export default function DoorBlindsTransition({ children, mode = 'doors', activeKey }) {
  const [animating, setAnimating] = useState(true)

  useEffect(() => {
    setAnimating(true)
    const timer = setTimeout(() => {
      setAnimating(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [activeKey, mode])

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Content Container */}
      <div className={`w-full min-h-screen transition-opacity duration-300 ${animating ? 'opacity-90' : 'opacity-100'}`}>
        {children}
      </div>

      {/* Transition Overlay */}
      {animating && (
        mode === 'doors' ? (
          /* Curtains: Doors Split Transition */
          <div className="fixed inset-0 z-50 pointer-events-none flex">
            {/* Left Door */}
            <div className="w-1/2 h-full bg-[#ffc815] border-r-2 border-black animate-[doorLeft_0.6s_cubic-bezier(0.7,0,0.3,1)_forwards]" />
            {/* Right Door */}
            <div className="w-1/2 h-full bg-[#ffc815] border-l-2 border-black animate-[doorRight_0.6s_cubic-bezier(0.7,0,0.3,1)_forwards]" />
          </div>
        ) : (
          /* Curtains: Horizontal Blinds Transition */
          <div className="fixed inset-0 z-50 pointer-events-none flex flex-col">
            {[0, 1, 2, 3, 4].map(idx => (
              <div
                key={idx}
                className="w-full flex-1 bg-[#121212] border-b border-[#ffc815]/30 animate-[blindSlide_0.5s_cubic-bezier(0.7,0,0.3,1)_forwards]"
                style={{ animationDelay: `${idx * 60}ms` }}
              />
            ))}
          </div>
        )
      )}

      {/* Inline Keyframes style for Door & Blinds transitions */}
      <style>{`
        @keyframes doorLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes doorRight {
          0% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        @keyframes blindSlide {
          0% { transform: scaleY(1); opacity: 1; }
          100% { transform: scaleY(0); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
