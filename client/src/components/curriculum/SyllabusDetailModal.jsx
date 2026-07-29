import React from 'react'
import { X, BookOpen, CheckCircle2, Award, Sparkles, Layers, FileText } from 'lucide-react'
import { getCategoryBadgeStyle } from './CourseCard'

export default function SyllabusDetailModal({ course, onClose, onAskCopilot }) {
  if (!course) return null

  const units = course.units || [
    { title: "Unit I: Foundations & Core Concepts", desc: `Fundamental principles of ${course.name}, mathematical modeling, basic architectures, and theoretical foundations.` },
    { title: "Unit II: Algorithms & Data Structures", desc: "Core algorithms, data abstractions, computational complexity analysis, and algorithmic optimization techniques." },
    { title: "Unit III: System Architecture & Design", desc: "Modular system design, object-oriented/functional abstractions, pipeline integration, and software patterns." },
    { title: "Unit IV: Advanced Implementation & Tools", desc: "Practical hands-on tools, framework integration, modern libraries, performance tuning, and error handling." },
    { title: "Unit V: Industry Applications & Case Studies", desc: "Real-world engineering applications, industry case studies, emerging developments, and project implementations." }
  ]

  const outcomes = course.outcomes || [
    `Understand fundamental principles and theoretical concepts of ${course.name}.`,
    `Apply algorithmic and mathematical techniques to design efficient solutions.`,
    `Evaluate performance, computational complexity, and system constraints.`,
    `Develop hands-on technical solutions using modern tools and software frameworks.`
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl bg-theme-card border border-theme shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-theme bg-theme-input/50">
          <div className="space-y-1.5 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-[#ffc815] text-black font-mono font-medium text-xs">
                {course.sem}
              </span>
              <span className="font-mono text-xs font-medium text-theme-muted">
                {course.code}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${getCategoryBadgeStyle(course.type)}`}>
                {course.type}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {course.credits} Credits
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-theme-primary font-display leading-tight">
              {course.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-input transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Syllabus Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Course Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#f05030]" /> Course Overview
            </h3>
            <p className="text-sm font-normal text-theme-primary leading-relaxed bg-theme-input/40 p-4 rounded-2xl border border-theme/60">
              {course.desc}
            </p>
          </div>

          {/* 5 Units Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#ffc815]" /> Detailed 5-Unit Syllabus Structure
            </h3>
            <div className="space-y-2.5">
              {units.map((unit, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-theme-input/40 border border-theme/60 space-y-1 hover:border-theme transition">
                  <h4 className="text-xs font-semibold text-theme-primary font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#f05030]/15 text-[#f05030] text-[10px] font-medium flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {unit.title}
                  </h4>
                  <p className="text-xs font-normal text-theme-secondary leading-relaxed pl-7">
                    {unit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Course Outcomes */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-500" /> Expected Course Outcomes (COs)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {outcomes.map((co, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-theme-input/30 border border-theme/50 flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-normal text-theme-secondary leading-normal">{co}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-theme bg-theme-input/40 flex items-center justify-between gap-3">
          <p className="text-xs text-theme-muted font-normal hidden sm:block">
            Regulation 2022 · Sri Eshwar CSE Department
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                onClose()
                if (onAskCopilot) onAskCopilot(`Explain syllabus, topics, and reference books for ${course.code} - ${course.name}`)
              }}
              className="px-4 py-2 rounded-xl bg-[#f05030] text-white text-xs font-semibold hover:bg-[#d93d1d] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Copilot About Course</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-theme-input border border-theme text-xs font-medium text-theme-primary hover:bg-theme/10 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
