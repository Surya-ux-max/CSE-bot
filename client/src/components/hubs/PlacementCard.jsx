import React from 'react'
import { CheckCircle2, Rocket, Eye, Maximize2 } from 'lucide-react'
import { useFormatContent } from '../FormatContent'

export default function PlacementCard({ item, idx, isPlacementCell, loading, currentSelectedItem, onBroadcastDrive }) {
  const formatContent = useFormatContent()

  return (
    <div className="group relative p-5 rounded-2xl bg-theme-input border-2 border-black shadow-[3px_3px_0_0_#000] space-y-3 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-[0_0_25px_rgba(240,80,48,0.2)] hover:border-[#f05030]">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono font-medium flex-wrap gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-[#ffc815] text-black font-semibold border border-black/30 transition-transform group-hover:scale-105">
            {item.partner}
          </span>
          {item.is_published ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-medium border border-emerald-500/30 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Published to Hub
            </span>
          ) : (
            <span className="text-[#f05030] font-semibold">{item.status}</span>
          )}
        </div>

        {/* Title Case Header - Semi-Bold Card Title */}
        <h3 className="text-base sm:text-lg font-semibold text-theme-primary font-display group-hover:text-[#f05030] transition-colors">
          {item.name}
        </h3>

        {/* Interactive Hover Published Details Box with Closer View Trigger */}
        <div
          onClick={() => onBroadcastDrive(item)}
          className="group/desc relative p-3.5 rounded-2xl bg-theme-card/60 border border-theme hover:border-[#f05030] transition-all duration-200 cursor-pointer space-y-1 overflow-hidden"
          title="Click to view details in closer view"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-theme-muted pb-1 border-b border-theme/40">
            <span className="flex items-center gap-1 font-medium text-emerald-500">
              <CheckCircle2 className="w-3 h-3" /> Published Details
            </span>
            <span className="inline-flex items-center gap-1 text-[#f05030] font-semibold opacity-80 group-hover/desc:opacity-100 transition-opacity">
              <Eye className="w-3.5 h-3.5" /> Closer View
            </span>
          </div>

          <div className="text-xs sm:text-sm text-theme-secondary font-normal leading-relaxed max-h-36 overflow-y-auto font-sans line-clamp-3 pt-1">
            {formatContent(item.desc)}
          </div>

          {/* Subtle Hover Action Hint */}
          <div className="pt-1.5 flex items-center justify-end text-[11px] font-medium text-[#f05030] opacity-0 group-hover/desc:opacity-100 transition-opacity">
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> Click for full closer view
            </span>
          </div>
        </div>
      </div>

      {item.is_published ? (
        <button
          onClick={() => onBroadcastDrive(item)}
          disabled={loading}
          className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/15 border border-emerald-500 text-emerald-500 font-bold text-xs hover:bg-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{loading && currentSelectedItem?.id === item.id ? "Generating Poster..." : "✓ Published Live (Click to View/Edit)"}</span>
        </button>
      ) : (
        <button
          onClick={() => onBroadcastDrive(item)}
          disabled={loading}
          className="w-full py-2.5 px-3 rounded-xl bg-[#f05030] text-white font-bold text-xs hover:bg-[#f37359] transition flex items-center justify-center gap-2 cursor-pointer border-2 border-black shadow-[2px_2px_0_0_#000] group-hover:shadow-[4px_4px_0_0_#000]"
        >
          <Rocket className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
          <span>{loading && currentSelectedItem?.id === item.id ? "Generating Poster..." : "🚀 Generate & Publish Poster Card"}</span>
        </button>
      )}
    </div>
  )
}
