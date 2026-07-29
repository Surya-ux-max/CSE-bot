import React from 'react'
import { ArrowUpRight } from 'lucide-react'

export default function HubCard({ hub, onNavigate }) {
  return (
    <div
      onClick={() => onNavigate(hub.route)}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate(hub.route)}
      tabIndex={0}
      role="link"
      aria-label={`Open ${hub.title}. ${hub.description}`}
      className="group relative anime-view-item p-6 rounded-3xl comic-card panel-theme space-y-5 cursor-pointer flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(255,200,21,0.25)] border-2 border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ffc815]"
    >
      {/* Background Subtle Gradient Glow on Hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#ffc815]/5 via-transparent to-[#f05030]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-2xl bg-theme-card border border-black/60 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            {hub.icon}
          </div>
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider px-3 py-1 rounded-xl bg-[#f05030] text-white border border-black/30 shadow-sm transition-transform duration-300 group-hover:scale-105">
            {hub.badge}
          </span>
        </div>

        <div className="space-y-2">
          {/* Title Case Header - Semi-Bold for Card Titles */}
          <h3 className="text-xl sm:text-2xl font-semibold text-theme-primary font-display flex items-center justify-between group-hover:text-[#ffc815] transition-colors duration-300">
            <span>{hub.title}</span>
            <ArrowUpRight className="w-5 h-5 text-theme-secondary transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[#ffc815]" />
          </h3>
          {/* Normal Font Weight Description - Short 2-3 Line Summary */}
          <p className="text-xs sm:text-sm text-theme-secondary font-normal leading-relaxed line-clamp-3 group-hover:text-theme-primary transition-colors">
            {hub.description}
          </p>
        </div>
      </div>

      <button
        type="button"
        tabIndex={-1}
        className={`relative z-10 w-full py-3 rounded-2xl comic-btn text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${hub.btnColor} border-2 border-black shadow-[2px_2px_0_0_#000] group-hover:shadow-[4px_4px_0_0_#000]`}
      >
        <span>Open {hub.title}</span>
        <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
      </button>
    </div>
  )
}
