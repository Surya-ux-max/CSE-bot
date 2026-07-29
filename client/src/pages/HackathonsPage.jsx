import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { Mail, Calendar, Sparkles, Send, CheckCircle2, Rocket, Mic, MicOff, PlusCircle, Search } from 'lucide-react'
import { apiClient } from '../services/ApiClient'
import { startSpeechToText } from '../services/speech'
import { useFormatContent } from '../components/FormatContent'
import HackathonCard from '../components/hubs/HackathonCard'
import HubsSearchHeader from '../components/hubs/HubsSearchHeader'
import PosterPreviewModal from '../components/hubs/PosterPreviewModal'

export default function HackathonsPage({ theme, setTheme, currentUser, onBackToHome }) {
  const navigate = useNavigate()
  const formatContent = useFormatContent()
  const [loadingIdx, setLoadingIdx] = useState(null)
  const [customMsg, setCustomMsg] = useState('')
  const [sendingCustom, setSendingCustom] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState('')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [generatedTemplate, setGeneratedTemplate] = useState('')
  const [currentSelectedItem, setCurrentSelectedItem] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [liveHackathons, setLiveHackathons] = useState([])

  const storedUser = (() => {
    try {
      const s = localStorage.getItem('sece_user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })()

  const student = currentUser || storedUser || {
    name: 'Placement Cell',
    email: 'placementcell@csebot.edu',
    section: 'All Sections',
    role: 'placement_cell',
    year: 'All Years'
  }

  const isPlacementCell = (student.email || '').toLowerCase().includes('placement') ||
                          (student.designation || '').toLowerCase().includes('placement') ||
                          student.role === 'placement_cell' ||
                          (student.name || '').toLowerCase().includes('placement') ||
                          student.role === 'faculty'

  const cleanField = (raw) => {
    if (!raw) return ''
    let cleaned = raw
      .replace(/^[#*:\s\-\>]+/, '')
      .replace(/[*#]+/g, '')
      .replace(/^Title:\s*/i, '')
      .replace(/^Hackathon:\s*/i, '')
      .replace(/^Contest:\s*/i, '')
      .replace(/\*\*+/g, '')
      .strip?.() || raw.replace(/[*#]+/g, '').trim()
    return cleaned || raw
  }

  const fetchLiveOpportunities = async () => {
    try {
      const dbHacks = await apiClient.getHackathons('All')
      if (Array.isArray(dbHacks)) {
        const formatted = dbHacks.map(h => ({
          id: `db_${h.id}`,
          is_published: true,
          title: cleanField(h.title) || "Hackathon Opportunity",
          category: cleanField(h.category) || "National Hackathon",
          deadline: h.deadline || 'Active',
          desc: h.description || "Official hackathon poster published by Placement Cell.",
          status: h.status || "Active",
          apply_link: h.apply_link || "#"
        }))
        setLiveHackathons(formatted)
      }
    } catch (err) {
      console.warn("Failed to fetch live hackathons:", err)
    }
  }

  useEffect(() => {
    fetchLiveOpportunities()
  }, [])

  const allHackathons = liveHackathons

  const filteredHackathons = allHackathons.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || 
                        item.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                        (selectedCategory === 'CoE Contest' && item.category.toLowerCase().includes('coe'));
    return matchesSearch && matchesCat;
  });

  const handleBroadcast = async (item, idx) => {
    setLoadingIdx(idx)
    setNotice('')
    setCurrentSelectedItem(item)

    const formattedPoster = `📌 **${item.title}**\n\n` +
      `• **Category**: ${item.category}\n` +
      `• **Status**: ${item.status}\n` +
      `• **Timeline**: ${item.deadline}\n\n` +
      `📝 **Overview**:\n${item.desc}\n\n` +
      `---\n*Official Opportunity Published by SECE Department of Computer Science & Engineering*`

    try {
      const prompt = `Search details about ${item.title} (${item.deadline}) and generate a poster announcement card for students.`
      const res = await apiClient.sendQuestion(prompt, 'hackathon_page_session', student.email, student.role || 'placement_cell')
      if (res && res.answer && !res.answer.includes("encountered an error")) {
        setGeneratedTemplate(res.answer)
      } else {
        setGeneratedTemplate(formattedPoster)
      }
    } catch (err) {
      console.warn("Using local poster details fallback:", err)
      setGeneratedTemplate(formattedPoster)
    } finally {
      setShowTemplateModal(true)
      setLoadingIdx(null)
    }
  }

  const extractTitleFromText = (text, fallback) => {
    if (!text) return fallback || 'Hackathon Opportunity'
    const m = text.match(/(?:hackathon\s*title|event\s*title|event\s*name|contest\s*title|title)[:\s]*([^\n*#]+)/i)
    if (m && m[1].trim() && !m[1].toLowerCase().includes('announcement')) {
      return m[1].replace(/[*#]+/g, '').trim()
    }
    const h2 = text.match(/##\s*\**([^*#\n]+)\**/)
    if (h2 && h2[1].trim()) {
      const cleanH2 = h2[1].replace(/[*#]+/g, '').replace(/Announcement\s*$/i, '').trim()
      if (cleanH2 && cleanH2.length > 2) return cleanH2
    }
    return fallback || 'Hackathon Opportunity'
  }

  const handlePublishDirectly = async () => {
    setPublishing(true)
    try {
      const rawExtracted = extractTitleFromText(generatedTemplate, currentSelectedItem?.title || customMsg)
      const title = cleanField(rawExtracted) || "Hackathon Opportunity"
      await apiClient.createHackathon({
        title: title,
        description: generatedTemplate || customMsg || "Official Hackathon Announcement",
        deadline: currentSelectedItem?.deadline || "Active",
        user_email: student.email,
        user_role: student.role || "placement_cell"
      })
      await fetchLiveOpportunities()
      setShowTemplateModal(false)
      setNotice(`🚀 Success: ${title} has been published directly to the Hackathon Hub! Students & Faculty can now view this poster on their dashboards.`)
    } catch (err) {
      console.error("Direct publish error:", err)
      setNotice(`⚠️ Failed to publish poster: ${err.message}`)
    } finally {
      setPublishing(false)
    }
  }

  const handleSendCustom = async () => {
    if (!customMsg.trim()) return
    const textToSend = customMsg.trim()
    setSendingCustom(true)
    setNotice('')
    
    const fallbackCustom = `🚀 **${textToSend}**\n\n` +
      `• **Status**: Active Opportunity\n` +
      `• **Target Audience**: All CSE Students & Faculty\n\n` +
      `📝 **Opportunity Details**:\n${textToSend}\n\n` +
      `---\n*Published directly via SECE Placement Cell Portal*`

    try {
      const prompt = `Search details and draft a copy-ready announcement poster card for students regarding: ${textToSend}`
      const res = await apiClient.sendQuestion(prompt, 'hackathon_page_session', student.email, student.role || 'placement_cell')
      if (res && res.answer && !res.answer.includes("encountered an error")) {
        setGeneratedTemplate(res.answer)
      } else {
        setGeneratedTemplate(fallbackCustom)
      }
    } catch (err) {
      console.error("Custom template error:", err)
      setGeneratedTemplate(fallbackCustom)
    } finally {
      setShowTemplateModal(true)
      setSendingCustom(false)
    }
  }

  return (
    <DashboardLayout
      theme={theme}
      setTheme={setTheme}
      currentUser={student}
      onBackToHome={onBackToHome}
      title={isPlacementCell ? "Placement Cell Hackathon Control Center" : "Hackathon Radar & CoE Innovation Labs"}
    >
      <div className="max-w-5xl mx-auto space-y-6 text-left p-6 sm:p-8 panel-theme rounded-3xl">
        <div className="space-y-2 border-b border-theme pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#ffc815] text-black text-xs font-mono font-bold mb-2 shadow-[2px_2px_0_0_#000]">
            <Rocket className="w-3.5 h-3.5" />
            <span>{isPlacementCell ? "Placement Cell Radar" : "SECE Hackathon Portal"}</span>
          </div>
          <h2 className="text-3xl font-black uppercase font-display text-theme-primary">
            Global & National Hackathon Radar
          </h2>
          <p className="text-xs font-mono text-purple-500 font-bold">CoE Innovation Labs & SIH 2026 Opportunities</p>
        </div>

        {/* Filter chips & Search bar header */}
        <HubsSearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={['All', 'National', 'Global', 'CoE Contest']}
          placeholder="Search hackathons, CoE contests..."
        />

        {/* Direct Poster Publisher Bar for Placement Cell / Faculty */}
        {isPlacementCell && (
          <div className="p-5 rounded-3xl comic-card bg-[#ffc815]/10 border-2 border-[#ffc815] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-[#ffc815] text-black font-black text-xs">🚀</div>
                <span className="text-xs font-black uppercase text-theme-primary font-mono tracking-wider">
                  Direct Opportunity & Poster Card Publisher
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#f05030] text-white">
                Live Publisher Active
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="relative flex-1 flex items-center w-full">
                <input
                  type="text"
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCustom()}
                  placeholder="Type hackathon topic or details (e.g. 'SIH 2026 Internal Pitch on 30 Aug 2026')..."
                  className="w-full pl-4 pr-12 py-3 rounded-2xl bg-theme-input border-2 border-black text-xs text-theme-primary font-mono font-semibold outline-none focus:border-[#ffc815]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) return;
                    startSpeechToText(
                      (transcript) => setCustomMsg(prev => (prev ? prev + ' ' : '') + transcript),
                      setIsListening,
                      student.email
                    );
                  }}
                  className={`absolute right-3 p-1.5 rounded-lg transition-all ${
                    isListening
                      ? 'bg-rose-500/20 text-rose-500 animate-pulse'
                      : 'text-theme-muted hover:text-[#ffc815]'
                  }`}
                  title="Voice dictation"
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={handleSendCustom}
                disabled={sendingCustom || !customMsg.trim()}
                className="px-5 py-3 rounded-2xl bg-[#ffc815] text-black font-black text-xs hover:bg-[#ffdf70] transition flex items-center justify-center gap-2 border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer shrink-0"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>{sendingCustom ? "Generating..." : "Generate Template"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Notice alert */}
        {notice && (
          <div className="p-4 rounded-2xl bg-[#ffc815]/15 border-2 border-[#ffc815] text-xs font-mono font-bold text-theme-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ffc815]" />
            <span>{notice}</span>
          </div>
        )}

        {/* Hackathons Cards Grid */}
        {filteredHackathons.length === 0 ? (
          <div className="p-8 text-center bg-theme-input border-2 border-black rounded-3xl text-xs font-mono text-theme-secondary space-y-2">
            <Rocket className="w-8 h-8 mx-auto text-[#ffc815] animate-bounce" />
            <p className="font-bold text-theme-primary text-sm">No active hackathon posters published yet.</p>
            <p className="text-theme-muted">
              {isPlacementCell
                ? "Use the Direct Publisher bar above to generate and publish live hackathon posters."
                : "Check back soon for new Smart India Hackathon and CoE contest updates!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredHackathons.map((item, idx) => (
              <HackathonCard
                key={idx}
                item={item}
                idx={idx}
                isPlacementCell={isPlacementCell}
                loadingIdx={loadingIdx}
                onBroadcast={handleBroadcast}
              />
            ))}
          </div>
        )}

        {/* Shared Poster Preview and Publish Modal */}
        <PosterPreviewModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          generatedTemplate={generatedTemplate}
          isPlacementCell={isPlacementCell}
          publishing={publishing}
          copied={copied}
          onCopy={() => {
            navigator.clipboard.writeText(generatedTemplate)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          onPublishDirectly={handlePublishDirectly}
          onNavigateToMessages={() => {
            setShowTemplateModal(false)
            navigate('/hubs/messages')
          }}
        />
      </div>
    </DashboardLayout>
  )
}
