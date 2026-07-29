import React from 'react'
import { GraduationCap, Layers } from 'lucide-react'

export default function CurriculumOverviewHeader({
  selectedSem,
  onSemChange,
  semestersList,
  semCreditsMap,
  totalCoursesCount,
  filteredCount
}) {
  return (
    <div className="space-y-4">
      {/* Hero Stats Card */}
      <div className="p-6 rounded-3xl bg-theme-card border border-theme shadow-sm relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-theme pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-mono font-medium bg-[#ffc815] text-black">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Regulation 2022 Curriculum</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold uppercase font-display text-theme-primary tracking-tight">
              CSE Curriculum & <span style={{ color: '#f05030' }}>Syllabi (Sem 1 - 8)</span>
            </h1>
            <p className="text-xs font-normal text-theme-secondary">
              Department of Computer Science & Engineering · Sri Eshwar College of Engineering
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-4 py-2 rounded-2xl bg-theme-input border border-theme text-center">
              <p className="text-[10px] font-medium text-theme-muted uppercase tracking-wider">Total Requirement</p>
              <p className="text-base font-semibold text-[#f05030]">160 Credits</p>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-theme-input border border-theme text-center">
              <p className="text-[10px] font-medium text-theme-muted uppercase tracking-wider">Total Courses</p>
              <p className="text-base font-semibold text-theme-primary">32 Courses</p>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-theme-input border border-theme text-center">
              <p className="text-[10px] font-medium text-theme-muted uppercase tracking-wider">Semesters</p>
              <p className="text-base font-semibold text-emerald-500">8 Semesters</p>
            </div>
          </div>
        </div>

        {/* Semester Navigator Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#ffc815]" /> Select Semester
            </span>
            <span className="text-xs font-mono text-theme-muted font-normal">
              Showing {filteredCount} of {totalCoursesCount} Courses
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {semestersList.map((sem) => {
              const credits = semCreditsMap[sem]
              const isSelected = selectedSem === sem

              return (
                <button
                  key={sem}
                  onClick={() => onSemChange(sem)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#f05030] text-white border-[#f05030] shadow-sm'
                      : 'bg-theme-input text-theme-secondary hover:text-theme-primary border-theme font-medium'
                  }`}
                >
                  <span>{sem}</span>
                  {credits && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-theme/10 text-theme-muted'
                    }`}>
                      {credits}C
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
