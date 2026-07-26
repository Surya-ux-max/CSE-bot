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

  async sendQuestion(question, sessionId) {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          session_id: sessionId
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
            body: JSON.stringify({ question: question.trim(), session_id: sessionId })
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

  async clearSession(sessionId) {
    try {
      await fetch(`${this.baseUrl}/session/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      })
    } catch (error) {
      console.warn("[ApiClient] Session clear error:", error)
    }
  }
}

export const apiClient = new ApiClient()
