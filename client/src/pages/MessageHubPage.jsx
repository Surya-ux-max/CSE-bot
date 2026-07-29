import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import MessageHub from '../components/MessageHub'

export default function MessageHubPage({ theme, setTheme, currentUser, onBackToHome }) {
  const storedUser = (() => {
    try {
      const s = localStorage.getItem('sece_user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })()

  const student = currentUser || storedUser || {
    name: 'Suryaprakash S',
    email: 'suryaprakash.s.d@csebot.edu',
    section: 'Section D',
    role: 'student',
    year: '3rd Year'
  }

  return (
    <DashboardLayout
      theme={theme}
      setTheme={setTheme}
      currentUser={student}
      onBackToHome={onBackToHome}
      title="Gmail Enterprise Message Hub"
    >
      <MessageHub currentUser={student} theme={theme} />
    </DashboardLayout>
  )
}
