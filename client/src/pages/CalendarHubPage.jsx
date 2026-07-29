import React from 'react'
import DashboardLayout from '../components/DashboardLayout'
import CalendarHub from '../components/CalendarHub'

export default function CalendarHubPage({ theme, setTheme, currentUser, onBackToHome }) {
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
      title="Calendar Hub & AI Scheduler"
    >
      <div className="p-4 sm:p-6 bg-theme-card border border-theme rounded-3xl shadow-2xl">
        <CalendarHub currentUser={student} theme={theme} />
      </div>
    </DashboardLayout>
  )
}
