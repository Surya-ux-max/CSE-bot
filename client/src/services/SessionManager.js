/**
 * SessionManager Service Class managing theme state and session lifecycles.
 */
export class SessionManager {
  static THEME_KEY = 'cse_bot_theme'

  static getSavedTheme() {
    return localStorage.getItem(this.THEME_KEY) || 'dark'
  }

  static saveTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme)
  }

  static generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 9)
  }

  static estimateAgent(query) {
    const qLower = query.toLowerCase()
    if (qLower.includes('placement') || qLower.includes('coe') || qLower.includes('hackathon') || qLower.includes('skill')) {
      return 'placement_agent'
    }
    if (qLower.includes('faculty') || qLower.includes('hod') || qLower.includes('professor') || qLower.includes('pac') || qLower.includes('teacher')) {
      return 'faculty_agent'
    }
    if (qLower.includes('syllabus') || qLower.includes('curriculum') || qLower.includes('course') || qLower.includes('semester') || qLower.includes('elective')) {
      return 'curriculum_agent'
    }
    if (qLower.includes('code') || qLower.includes('quicksort') || qLower.includes('recursion') || qLower.includes('python') || qLower.includes('c++') || qLower.includes('java')) {
      return 'tutor_agent'
    }
    return 'reception_agent'
  }
}
