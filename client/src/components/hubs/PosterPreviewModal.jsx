import React from 'react'
import { CheckCircle2, Mail, Rocket, Eye, X } from 'lucide-react'
import { useFormatContent } from '../FormatContent'

export default function PosterPreviewModal({
  isOpen,
  onClose,
  generatedTemplate,
  isPlacementCell,
  publishing,
  copied,
  onCopy,
  onPublishDirectly,
  onNavigateToMessages
}) {
  const formatContent = useFormatContent()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-theme-card border-2 border-theme rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 flex flex-col max-h-[90vh] overflow-hidden text-theme-primary animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme pb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#ffc815] text-black rounded-2xl text-xs font-bold shadow-xs flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>Closer View</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold uppercase font-mono tracking-wide">
              {isPlacementCell ? "Official Poster Announcement Card" : "Poster Opportunity Closer View"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-theme-input border border-theme text-theme-muted hover:text-theme-primary hover:bg-rose-500/10 hover:border-rose-500/30 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-Resolution Detailed Poster Content */}
        <div className="flex-1 overflow-y-auto bg-theme-input/60 border border-theme rounded-2xl p-6 text-sm leading-relaxed max-h-[60vh] text-theme-primary space-y-3 font-sans shadow-inner">
          {formatContent(generatedTemplate)}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-theme flex-shrink-0">
          <button
            onClick={onCopy}
            className="flex-1 py-3 px-4 rounded-2xl bg-theme-input text-theme-primary font-semibold text-xs border border-theme hover:bg-theme-card transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{copied ? "Copied to Clipboard!" : "Copy Poster Details"}</span>
          </button>

          {isPlacementCell && (
            <button
              onClick={onPublishDirectly}
              disabled={publishing}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#ffc815] text-black font-bold text-xs hover:bg-[#ffdf70] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Rocket className="w-4 h-4" />
              <span>{publishing ? "Publishing..." : "Confirm & Publish Live Poster Card"}</span>
            </button>
          )}

          <button
            onClick={onNavigateToMessages}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#f05030] text-white font-bold text-xs hover:bg-[#d93d1d] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Mail className="w-4 h-4" />
            <span>Send via Message Hub</span>
          </button>
        </div>
      </div>
    </div>
  )
}
