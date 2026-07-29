import React from 'react'
import { Calendar, CheckCircle2, Rocket, Eye, Maximize2 } from 'lucide-react'
import { useFormatContent } from '../FormatContent'

export default function HackathonCard({ item, idx, isPlacementCell, loadingIdx, onBroadcast }) {
  const formatContent = useFormatContent()

  return (
    <div className="group relative p-6 rounded-3xl bg-theme-input border-2 border-black shadow-[3px_3px_0_0_#000] space-y-4 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-[0_0_30px_rgba(255,200,21,0.25)] hover:border-[#ffc815]">
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-mono flex-wrap gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-[#ffc815] text-black font-semibold border border-black/30 transition-transform group-hover:scale-105">
            {item.category}
          </span>
          {item.is_published ? (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-medium border border-emerald-500/30 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Published to Hub
            </span>
          ) : (
            <span className="text-emerald-500 font-semibold">{item.status}</span>
          )}
        </div>

        {/* Semi-Bold Card Title */}
        <h3 className="text-lg font-semibold text-theme-primary font-display group-hover:text-[#ffc815] transition-colors">
          {item.title}
        </h3>

        {/* Interactive Hover Published Details Box with Closer View Trigger */}
        <div
          onClick={() => onBroadcast(item, idx)}
          className="group/desc relative p-3.5 rounded-2xl bg-theme-card/60 border border-theme hover:border-[#ffc815] transition-all duration-200 cursor-pointer space-y-1 overflow-hidden"
          title="Click to view details in closer view"
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-theme-muted pb-1 border-b border-theme/40">
            <span className="flex items-center gap-1 font-medium text-emerald-500">
              <CheckCircle2 className="w-3 h-3" /> Published Details
            </span>
            <span className="inline-flex items-center gap-1 text-[#ffc815] font-semibold opacity-80 group-hover/desc:opacity-100 transition-opacity">
              <Eye className="w-3.5 h-3.5" /> Closer View
            </span>
          </div>

          <div className="text-xs sm:text-sm text-theme-secondary font-normal leading-relaxed max-h-36 overflow-y-auto font-sans line-clamp-3 pt-1">
            {formatContent(item.desc)}
          </div>

          {/* Subtle Hover Action Hint */}
          <div className="pt-1.5 flex items-center justify-end text-[11px] font-medium text-[#ffc815] opacity-0 group-hover/desc:opacity-100 transition-opacity">
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3" /> Click for full closer view
            </span>
          </div>
        </div>

        <p className="text-[11px] font-mono text-theme-muted pt-1 font-medium flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#f05030]" />
          <span>{item.deadline}</span>
        </p>
      </div>

      {isPlacementCell ? (
        item.is_published ? (
          <button
            onClick={() => onBroadcast(item, idx)}
            disabled={loadingIdx === idx}
            className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600/15 border border-emerald-500 text-emerald-500 font-bold text-xs hover:bg-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{loadingIdx === idx ? "Processing..." : "✓ Published Live (Click to View/Edit)"}</span>
          </button>
        ) : (
          <button
            onClick={() => onBroadcast(item, idx)}
            disabled={loadingIdx === idx}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#ffc815] text-black font-bold text-xs hover:bg-[#ffdf70] transition flex items-center justify-center gap-2 border-2 border-black shadow-[2px_2px_0_0_#000] group-hover:shadow-[4px_4px_0_0_#000]"
          >
            <Rocket className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
            <span>{loadingIdx === idx ? "Processing..." : "🚀 Generate & Publish Poster Card"}</span>
          </button>
        )
      ) : (
        <button
          onClick={() => onBroadcast(item, idx)}
          className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 border-2 border-black shadow-[2px_2px_0_0_#000] text-center cursor-pointer group-hover:shadow-[4px_4px_0_0_#000]"
        >
          <Rocket className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
          <span>View Poster Details & Apply</span>
        </button>
      )}
    </div>
  )
}
