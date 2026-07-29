import React from 'react'
import { Search } from 'lucide-react'

export default function HubsSearchHeader({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories = ['All', 'National', 'Global', 'CoE Contest'],
  placeholder = "Search opportunities..."
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
      {/* Filter Chips - Minimal Borders */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-medium transition cursor-pointer whitespace-nowrap border ${
              selectedCategory === cat
                ? 'bg-[#ffc815] text-black font-bold border-black shadow-[2px_2px_0_0_#000]'
                : 'bg-theme-input text-theme-secondary border-black/30 hover:text-theme-primary hover:border-black/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* High Visibility Elevated Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-theme-card border border-black/60 text-xs font-mono text-theme-primary outline-none shadow-sm focus:ring-2 focus:ring-[#ffc815] focus:border-[#ffc815] transition-all"
        />
      </div>
    </div>
  )
}
