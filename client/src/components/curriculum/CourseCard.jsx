import React from 'react'
import { ChevronRight, Layers, FileText } from 'lucide-react'

export function getCategoryBadgeStyle(type) {
  if (!type) return 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-300'
  const t = type.toLowerCase()
  if (t.includes('lab') || t.includes('practical')) {
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  }
  if (t.includes('professional elective')) {
    return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
  }
  if (t.includes('open elective')) {
    return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
  }
  if (t.includes('project')) {
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
  }
  return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
}

export default function CourseCard({ course, onViewSyllabus }) {
  return (
    <div className="group relative p-5 rounded-2xl bg-theme-card border border-theme hover:border-[#f05030] shadow-xs transition-all duration-200 flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-[#ffc815] text-black font-mono font-medium text-xs">
              {course.sem}
            </span>
            <span className="font-mono text-xs font-medium text-theme-muted tracking-wider">
              {course.code}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {course.credits} {course.credits === 1 ? 'Credit' : 'Credits'}
          </span>
        </div>

        {/* Course Title - Semi-bold per typography rules */}
        <h3 className="text-base font-semibold text-theme-primary font-display group-hover:text-[#f05030] transition-colors leading-snug">
          {course.name}
        </h3>

        {/* Type Badge - Medium per typography rules */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${getCategoryBadgeStyle(course.type)}`}>
            {course.type}
          </span>
        </div>

        {/* Course Description - Normal per typography rules */}
        <p className="text-xs font-normal text-theme-secondary leading-relaxed line-clamp-3 pt-1 border-t border-theme/50">
          {course.desc}
        </p>
      </div>

      {/* Footer Action */}
      <div className="pt-3 border-t border-theme flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-theme-muted font-normal">
          <Layers className="w-3.5 h-3.5 text-[#ffc815]" />
          <span>{course.units ? `${course.units.length} Units` : '5 Units Syllabus'}</span>
        </div>
        <button
          onClick={() => onViewSyllabus(course)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#f05030] hover:text-[#d93d1d] hover:bg-[#f05030]/10 px-3 py-1.5 rounded-xl transition cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Syllabus</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
