import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import MeetingHub from '../components/MeetingHub'

export default function MeetingHubPage({ theme, setTheme, currentUser, onBackToHome }) {
  const storedUser = (() => {
    try {
      const s = localStorage.getItem('sece_user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })()

  const user = currentUser || storedUser || {
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
      currentUser={user}
      onBackToHome={onBackToHome}
      title="Meeting Hub"
    >
      <MeetingHub currentUser={user} theme={theme} />
    </DashboardLayout>
  )
}
