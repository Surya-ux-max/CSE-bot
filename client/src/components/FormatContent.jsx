import React, { useState } from 'react'
import { Copy, Code2 } from 'lucide-react'

export function parseInlineMarkdown(text) {
  if (!text) return text
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'var(--bold-amber)' }} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ color: 'var(--heading-gold)', backgroundColor: 'rgba(217,119,6,0.12)', borderColor: 'rgba(217,119,6,0.25)' }} className="px-1.5 py-0.5 rounded border font-mono text-xs">{part.slice(1, -1)}</code>
    }
    return part
  })
}

export function useFormatContent() {
  const [copiedIndex, setCopiedIndex] = useState(null)

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (content) => {
    if (!content) return null
    const parts = content.split(/(```[\s\S]*?```)/g)

    return parts.map((part, idx) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n')
        const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : ''
        const code = language ? lines.slice(1).join('\n') : lines.join('\n')
        const codeId = `code-${idx}`

        return (
          <div key={idx} className="my-3.5 rounded-xl overflow-hidden border border-brand-border bg-brand-dark shadow-xl">
            <div className="flex items-center justify-between px-4 py-2 bg-brand-bg border-b border-brand-border text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1.5 font-semibold uppercase" style={{ color: 'var(--heading-gold)' }}>
                <Code2 className="w-3.5 h-3.5" />
                {language || 'CODE'}
              </span>
              <button
                onClick={() => copyToClipboard(code, codeId)}
                className="flex items-center gap-1 hover:text-amber-500 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedIndex === codeId ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              <code>{code}</code>
            </pre>
          </div>
        )
      }

      // Paragraph / line formatting
      return (
        <div key={idx} className="space-y-2">
          {part.split('\n\n').map((paragraph, pIdx) => {
            if (!paragraph.strip?.() && !paragraph.trim()) return null

            const formattedLines = paragraph.split('\n').map((line, lIdx) => {
              const trimmed = line.trim()
              if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                return (
                  <li key={lIdx} className="ml-5 list-disc font-sans leading-relaxed py-0.5" style={{ color: 'var(--text-primary)' }}>
                    {parseInlineMarkdown(trimmed.replace(/^[*-\s]+/, ''))}
                  </li>
                )
              }
              if (/^\d+\.\s/.test(trimmed)) {
                return (
                  <li key={lIdx} className="ml-5 list-decimal font-sans leading-relaxed py-0.5" style={{ color: 'var(--text-primary)' }}>
                    {parseInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''))}
                  </li>
                )
              }
              if (trimmed.startsWith('###')) {
                return (
                  <h4 key={lIdx} style={{ color: 'var(--heading-cyan)' }} className="text-base font-bold mt-3 mb-1.5 flex items-center gap-1.5">
                    {parseInlineMarkdown(trimmed.replace(/^###\s*/, ''))}
                  </h4>
                )
              }
              if (trimmed.startsWith('##')) {
                return (
                  <h3 key={lIdx} style={{ color: 'var(--heading-gold)', borderColor: 'var(--heading-gold)' }} className="text-lg font-bold tracking-wide border-l-4 pl-3 my-3.5">
                    {parseInlineMarkdown(trimmed.replace(/^##\s*/, ''))}
                  </h3>
                )
              }
              if (trimmed.startsWith('#')) {
                return (
                  <h2 key={lIdx} style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} className="text-xl font-extrabold tracking-wider border-b pb-1 my-4">
                    {parseInlineMarkdown(trimmed.replace(/^#\s*/, ''))}
                  </h2>
                )
              }
              return <p key={lIdx} className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{parseInlineMarkdown(line)}</p>
            })

            return <div key={pIdx}>{formattedLines}</div>
          })}
        </div>
      )
    })
  }
}
