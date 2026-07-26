/**
 * ApiClient Service Class encapsulating API calls to the server backend.
 */
export class ApiClient {
  constructor(baseUrl = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl
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
