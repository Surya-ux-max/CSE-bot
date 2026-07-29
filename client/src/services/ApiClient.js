/**
 * ApiClient Service Class encapsulating API calls to the server backend.
 * Dynamically switches between production backend URL (Render) and local dev environment.
 */

const DEFAULT_PROD_URL = 'https://cse-bot-backend.onrender.com'
const DEFAULT_LOCAL_URL = 'http://127.0.0.1:8000'

export class ApiClient {
  constructor() {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    if (envUrl) {
      this.baseUrl = envUrl.replace(/\/$/, '')
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.baseUrl = DEFAULT_LOCAL_URL
    } else {
      this.baseUrl = DEFAULT_PROD_URL
    }
    console.log(`[ApiClient] Configured Backend API Base URL: ${this.baseUrl}`)
  }

  getHeaders(customHeaders = {}) {
    const headers = { 'Content-Type': 'application/json', ...customHeaders }
    try {
      const saved = localStorage.getItem('sece_auth_user') || localStorage.getItem('sece_user')
      if (saved) {
        const user = JSON.parse(saved)
        if (user && user.token && user.token !== 'sece_jwt_authenticated') {
          headers['Authorization'] = `Bearer ${user.token}`
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return headers
  }

  async sendQuestion(question, sessionId, userEmail = null, userRole = null) {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          session_id: sessionId,
          user_email: userEmail,
          user_role: userRole
        }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      const data = await response.json()
      return {
        answer: data.answer || "I apologize, I couldn't generate a response.",
        agentName: data.agent_name || "reception_agent"
      }
    } catch (error) {
      console.error("[ApiClient] Network / Chat error:", error)
      
      // Fallback attempt to production URL if local API fails in production
      if (this.baseUrl !== DEFAULT_PROD_URL && window.location.hostname !== 'localhost') {
        console.warn("[ApiClient] Retrying with production Render backend...")
        try {
          const fallbackRes = await fetch(`${DEFAULT_PROD_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: question.trim(),
              session_id: sessionId,
              user_email: userEmail,
              user_role: userRole
            })
          })
          if (fallbackRes.ok) {
            const data = await fallbackRes.json()
            return {
              answer: data.answer || "I apologize, I couldn't generate a response.",
              agentName: data.agent_name || "reception_agent"
            }
          }
        } catch (fallbackErr) {
          console.error("[ApiClient] Fallback error:", fallbackErr)
        }
      }

      throw error
    }
  }

  async registerStudent(studentData) {
    const response = await fetch(`${this.baseUrl}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: studentData.name,
        email: studentData.email,
        password: studentData.password,
        section: studentData.section,
        year: studentData.year
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.detail || `Registration failed with status ${response.status}`)
    }
    return data
  }

  async loginStudent(credentials) {
    const response = await fetch(`${this.baseUrl}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.detail || `Login failed with status ${response.status}`)
    }
    return data
  }

  async registerFaculty(facultyData) {
    const response = await fetch(`${this.baseUrl}/auth/faculty/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: facultyData.name,
        email: facultyData.email,
        password: facultyData.password,
        designation: facultyData.designation,
        section: facultyData.section,
        year: facultyData.year
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.detail || `Registration failed with status ${response.status}`)
    }
    return data
  }

  async loginFaculty(credentials) {
    const response = await fetch(`${this.baseUrl}/auth/faculty/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.detail || `Login failed with status ${response.status}`)
    }
    return data
  }

  async registerPlacement(placementData) {
    const response = await fetch(`${this.baseUrl}/auth/placement/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: placementData.name,
        email: placementData.email,
        password: placementData.password,
        designation: placementData.designation,
        section: placementData.section,
        year: placementData.year
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.detail || `Registration failed with status ${response.status}`)
    }
    return data
  }

  async loginPlacement(credentials) {
    const response = await fetch(`${this.baseUrl}/auth/placement/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.detail || `Login failed with status ${response.status}`)
    }
    return data
  }

  async logSpeechText(email, text, metadata = null) {
    try {
      const response = await fetch(`${this.baseUrl}/speech/log`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          email,
          converted_text: text,
          audio_metadata: metadata
        })
      })
      return await response.json()
    } catch (err) {
      console.warn("[ApiClient] Speech logging error:", err)
      return null
    }
  }

  async getSpeechLogs(email) {
    const response = await fetch(`${this.baseUrl}/speech/logs?email=${encodeURIComponent(email)}`)
    if (!response.ok) throw new Error(`Failed to fetch speech logs: ${response.status}`)
    return response.json()
  }

  async clearSession(sessionId, userEmail = null) {
    try {
      await fetch(`${this.baseUrl}/session/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_email: userEmail
        })
      })
    } catch (error) {
      console.warn("[ApiClient] Session clear error:", error)
    }
  }

  async getEvents(email) {
    const response = await fetch(`${this.baseUrl}/events?email=${encodeURIComponent(email)}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch events: status ${response.status}`)
    }
    return response.json()
  }

  async createEvent(eventData) {
    const response = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: eventData.user_email,
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        category: eventData.category,
        status: eventData.status || "Scheduled"
      })
    })
    if (!response.ok) {
      throw new Error(`Failed to create event: status ${response.status}`)
    }
    return response.json()
  }

  async deleteEvent(eventId, email) {
    const response = await fetch(`${this.baseUrl}/events/${eventId}?email=${encodeURIComponent(email)}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`Failed to delete event: status ${response.status}`)
    }
    return response.json()
  }

  async getMessages(email) {
    const response = await fetch(`${this.baseUrl}/messages?email=${encodeURIComponent(email)}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: status ${response.status}`)
    }
    return response.json()
  }

  async createMessage(msgData) {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_name: msgData.sender_name,
        sender_email: msgData.sender_email,
        recipient_email: msgData.recipient_email,
        subject: msgData.subject,
        content: msgData.content,
        folder: msgData.folder,
        starred: msgData.starred || false,
        unread: msgData.unread || true
      })
    })
    if (!response.ok) {
      throw new Error(`Failed to compose message: status ${response.status}`)
    }
    return response.json()
  }

  async sendMessageAgentCommand(email, role, prompt) {
    const response = await fetch(`${this.baseUrl}/messages/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, prompt })
    })
    if (!response.ok) {
      throw new Error(`Failed to send message agent command: status ${response.status}`)
    }
    return response.json()
  }

  async toggleMessageStar(msgId, email) {
    const response = await fetch(`${this.baseUrl}/messages/${msgId}/star?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: this.getHeaders()
    })
    if (!response.ok) {
      throw new Error(`Failed to toggle star: status ${response.status}`)
    }
    return response.json()
  }

  async markMessageRead(msgId, email) {
    const response = await fetch(`${this.baseUrl}/messages/${msgId}/read?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: this.getHeaders()
    })
    if (!response.ok) {
      throw new Error(`Failed to mark message as read: status ${response.status}`)
    }
    return response.json()
  }

  async updateMessageFolder(msgId, folder, email) {
    const response = await fetch(`${this.baseUrl}/messages/${msgId}/folder?email=${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder })
    })
    if (!response.ok) {
      throw new Error(`Failed to update folder: status ${response.status}`)
    }
    return response.json()
  }

  async deleteMessagePermanently(msgId, email) {
    const response = await fetch(`${this.baseUrl}/messages/${msgId}?email=${encodeURIComponent(email)}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`Failed to permanently delete message: status ${response.status}`)
    }
    return response.json()
  }

  async filterMessages(email, query) {
    const response = await fetch(`${this.baseUrl}/messages/filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, query })
    })
    if (!response.ok) {
      throw new Error(`Failed to filter messages: status ${response.status}`)
    }
    return response.json()
  }

  async queryCalendarAgent(email, prompt) {
    const response = await fetch(`${this.baseUrl}/calendar/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, prompt })
    })
    if (!response.ok) {
      throw new Error(`Failed to query calendar agent: status ${response.status}`)
    }
    return response.json()
  }

  async getAcademicEvents(email) {
    const url = email 
      ? `${this.baseUrl}/academic-events?email=${encodeURIComponent(email)}`
      : `${this.baseUrl}/academic-events`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch academic events: status ${response.status}`)
    }
    return response.json()
  }

  async createAcademicEvent(eventData) {
    const response = await fetch(`${this.baseUrl}/academic-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: eventData.title,
        date: eventData.date,
        end_date: eventData.end_date || null,
        day_name: eventData.day_name || null,
        category: eventData.category || "General Academic",
        department: eventData.department || "All Departments",
        semester: eventData.semester || "All Years",
        description: eventData.description || null,
        visibility: eventData.visibility || "public",
        status: eventData.status || "Published",
        user_email: eventData.user_email,
        user_role: eventData.user_role
      })
    })
    if (!response.ok) {
      throw new Error(`Failed to create academic event: status ${response.status}`)
    }
    return response.json()
  }

  async updateAcademicEvent(id, eventData) {
    const response = await fetch(`${this.baseUrl}/academic-events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: eventData.title,
        date: eventData.date,
        end_date: eventData.end_date || null,
        day_name: eventData.day_name || null,
        category: eventData.category || null,
        department: eventData.department || null,
        semester: eventData.semester || null,
        description: eventData.description || null,
        visibility: eventData.visibility || null,
        status: eventData.status || null,
        user_email: eventData.user_email,
        user_role: eventData.user_role
      })
    })
    if (!response.ok) {
      throw new Error(`Failed to update academic event: status ${response.status}`)
    }
    return response.json()
  }

  async deleteAcademicEvent(id, email, role) {
    const response = await fetch(`${this.baseUrl}/academic-events/${id}?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`Failed to delete academic event: status ${response.status}`)
    }
    return response.json()
  }

  // ─── Meeting Hub ───────────────────────────────────────────────────────────

  async getMeetings(email) {
    const response = await fetch(`${this.baseUrl}/meetings?email=${encodeURIComponent(email)}`)
    if (!response.ok) throw new Error(`Failed to fetch meetings: ${response.status}`)
    return response.json()
  }

  async sendMeetingAgentCommand(email, role, prompt) {
    const response = await fetch(`${this.baseUrl}/meetings/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, prompt })
    })
    if (!response.ok) throw new Error(`Meeting agent error: ${response.status}`)
    return response.json()
  }

  async joinMeeting(email, name, joinCode) {
    const response = await fetch(`${this.baseUrl}/meetings/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, join_code: joinCode })
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.detail || `Join failed: ${response.status}`)
    }
    return response.json()
  }

  async getMeetingChat(meetingId) {
    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}/chat`)
    if (!response.ok) throw new Error(`Failed to fetch chat: ${response.status}`)
    return response.json()
  }

  async postMeetingChat(meetingId, senderEmail, senderName, message) {
    const response = await fetch(`${this.baseUrl}/meetings/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId, sender_email: senderEmail, sender_name: senderName, message })
    })
    if (!response.ok) throw new Error(`Failed to post chat: ${response.status}`)
    return response.json()
  }

  async getMeetingParticipants(meetingId) {
    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}/participants`)
    if (!response.ok) throw new Error(`Failed to fetch participants: ${response.status}`)
    return response.json()
  }

  async getMeetingAttendance(meetingId) {
    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}/attendance`)
    if (!response.ok) throw new Error(`Failed to fetch attendance: ${response.status}`)
    return response.json()
  }

  async deleteMeeting(meetingId, email) {
    const response = await fetch(`${this.baseUrl}/meetings/${meetingId}?email=${encodeURIComponent(email)}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error(`Failed to delete meeting: ${response.status}`)
    return response.json()
  }

  async fetchWithFallback(endpoint, options = {}) {
    const primaryUrl = `${this.baseUrl}${endpoint}`
    try {
      const res = await fetch(primaryUrl, options)
      if (res.status !== 404) return res
    } catch (e) {
      console.warn(`[ApiClient] Primary endpoint failed (${primaryUrl}):`, e)
    }

    if (this.baseUrl.includes('8000') || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const fallbackUrl = `http://127.0.0.1:8005${endpoint}`
      console.log(`[ApiClient] Trying fallback server on port 8005: ${fallbackUrl}`)
      return await fetch(fallbackUrl, options)
    }

    return fetch(primaryUrl, options)
  }

  // ─── Opportunities Hub (Hackathons & Placements) ───────────────────────────

  async getHackathons(statusFilter = 'Active') {
    const response = await this.fetchWithFallback(`/hackathons?status_filter=${encodeURIComponent(statusFilter)}`)
    if (!response.ok) throw new Error(`Failed to fetch hackathons: ${response.status}`)
    return response.json()
  }

  async createHackathon(hData) {
    const response = await this.fetchWithFallback('/hackathons', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(hData)
    })
    if (!response.ok) throw new Error(`Failed to create hackathon: ${response.status}`)
    return response.json()
  }

  async deleteHackathon(id, role) {
    const response = await this.fetchWithFallback(`/hackathons/${id}?role=${encodeURIComponent(role)}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error(`Failed to delete hackathon: ${response.status}`)
    return response.json()
  }

  async getPlacements(statusFilter = 'Active') {
    const response = await this.fetchWithFallback(`/placements?status_filter=${encodeURIComponent(statusFilter)}`)
    if (!response.ok) throw new Error(`Failed to fetch placements: ${response.status}`)
    return response.json()
  }

  async createPlacement(pData) {
    const response = await this.fetchWithFallback('/placements', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(pData)
    })
    if (!response.ok) throw new Error(`Failed to create placement: ${response.status}`)
    return response.json()
  }

  async deletePlacement(id, role) {
    const response = await this.fetchWithFallback(`/placements/${id}?role=${encodeURIComponent(role)}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
    if (!response.ok) throw new Error(`Failed to delete placement: ${response.status}`)
    return response.json()
  }

  async updateMeetingStatus(meetingId, status) {
    const response = await fetch(`${this.baseUrl}/meetings/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId, status })
    })
    if (!response.ok) throw new Error(`Failed to update status: ${response.status}`)
    return response.json()
  }

  async leaveMeeting(meetingId, userEmail) {
    const response = await fetch(`${this.baseUrl}/meetings/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId, user_email: userEmail })
    })
    if (!response.ok) throw new Error(`Failed to leave meeting: ${response.status}`)
    return response.json()
  }

  async updateMeetingAVStatus(meetingId, userEmail, micOn, camOn) {
    const response = await fetch(`${this.baseUrl}/meetings/av-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId, user_email: userEmail, mic_on: micOn, cam_on: camOn })
    })
    if (!response.ok) throw new Error(`Failed to update AV status: ${response.status}`)
    return response.json()
  }

  async hostControl(meetingId, hostEmail, targetEmail, action) {
    const response = await fetch(`${this.baseUrl}/meetings/host-control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId, host_email: hostEmail, target_email: targetEmail, action })
    })
    if (!response.ok) throw new Error(`Host action failed: ${response.status}`)
    return response.json()
  }

  async simulateAttendees(meetingId) {
    const response = await fetch(`${this.baseUrl}/meetings/simulate-attendees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meeting_id: meetingId })
    })
    if (!response.ok) throw new Error(`Failed to simulate attendees: ${response.status}`)
    return response.json()
  }
}

export const apiClient = new ApiClient()
