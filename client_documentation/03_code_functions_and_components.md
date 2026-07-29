# 03: Code Functions & Components Breakdown

This document provides a line-by-line detailed functional reference for every React component, hook, handler, and state variable within the CSE-Bot client codebase.

---

## 📱 1. `App.jsx` (Application Orchestrator)

**Path**: [client/src/App.jsx](file:///d:/CSE-bot/client/src/App.jsx)

### React Router DOM Page Routing & State Hooks:
- **`react-router-dom` Integration**: Installed `react-router-dom` and wrapped the application in `<BrowserRouter>` in `main.jsx` and `<Routes>` in `App.jsx`.
- **URL Route Mapping**:
  - `/` $\rightarrow$ Hero & Showcase Landing Page (`<LandingPage />`).
  - `/auth` $\rightarrow$ Dedicated Authentication Screen (`<AuthPage />`).
  - `/dashboard/*` $\rightarrow$ Dedicated Student Workspace & Department Hub Launcher (`<StudentDashboard />`).
- **Browser History & Deep Linking**: Supports browser back/forward buttons, direct bookmarking, and URL deep linking into all pages.
- `ConfettiCanvas`: 60fps HTML5 Canvas particle engine spawning 160+ randomized celebratory particles (amber, gold, cyan, emerald, magenta, white) with 2D gravity, air resistance, spin rotation, shape variance, and alpha decay upon button navigation.
- `handleNavigateWithAnimation(targetPath, clickEvent)`: Triggers clip-wipe curtain transition and confetti eruption while pushing URL state via `useNavigate()`.

---

## 🔐 1.5 `auth.jsx` (Dedicated Authentication Screen)

**Path**: [client/src/auth/auth.jsx](file:///d:/CSE-bot/client/src/auth/auth.jsx)

### Structure & Layout:
- **Full Dedicated Auth Page**: Replaces modal popup with a dedicated, full-screen glassmorphic authentication page complete with floating background glow particles and top header navigation bar (*Return to Platform*, brand identity badge, theme toggle).
- **Dual Role Selector**:
  - `Student Portal` vs `Faculty Portal` (Role tab switching with Anime.js animations).
- **Auth Mode Switcher**:
  - `Sign In (Login)` vs `Create Account (Register)` (Mode switching tab with staggered field reveals).
- **Pre-Seeded Account Recognition**:
---

## 📩 1.9 `MessageHub.jsx` (Gmail-Inspired AI Message Hub)

**Path**: [client/src/components/MessageHub.jsx](file:///d:/CSE-bot/client/src/components/MessageHub.jsx)

### Header & Gmail-Style Navigation:
- **Dedicated Header**: Displays `"Message Hub"` with student welcome text (`Welcome, Suryaprakash S • AI-Powered Gmail Enterprise Hub`) and active Message Agent status badge. Free of calendar buttons.
- **Gmail Left Sidebar Menu**: Prominent **Compose AI Message** button, `Inbox` (with unread count badge), `Sent`, `Drafts`, `Starred`, and `Trash`.

### Full-Width Search & Filter Agent:
- **Full-Width Search Bar**: *"Search messages, recipients, subjects, or AI-generated drafts..."*
- **Filter Agent Smart Filters**: Directly below search bar (`All`, `Unread`, `Faculty`, `Students`, `Announcements`, `AI Generated`, `Drafts`, `Sent`).

### Message Agent AI Workspace & Email Preview:
- **Large Prompt Area**: *"Ask the Message Agent to generate, send, edit, summarize, or search messages."*
- **Quick Example Prompt Chips**: Direct shortcuts (*"Generate an email to all faculty"*, *"Notify III CSE-D students about tomorrow's lab"*, *"Draft an announcement"*).
- **Professional Gmail Email Preview**: Displays AI generated draft as a formal Gmail email preview awaiting user action.
- **3 Primary Action Buttons**: **`Send Now`** (dispatches email), **`Edit Draft`** (inline text editor), **`Save Draft`** (saves to Drafts folder).

---

## 📅 2.0 `CalendarHub.jsx` (Swap Card Calendar & AI Scheduler)

**Path**: [client/src/components/CalendarHub.jsx](file:///d:/CSE-bot/client/src/components/CalendarHub.jsx)

### Structure & Layout:
- **Top Swap Card Pill Selector**: Toggle between **`My Calendar`** (Personal schedule, study blocks, custom tasks) and **`Academic Calendar`** (Official SECE CAT-1/CAT-2 exam timetables, practical reviews, assignment deadlines, holiday schedule).
- **Interactive Calendar Agent Input Box**: Custom frosted glass bar with interactive placeholder text for AI scheduling queries (*"Ask Calendar Agent (e.g. 'Schedule a 2-hour study block for Compiler Design on Thursday at 4 PM')..."*).
- **Dedicated Calendar Pages**:
  - **My Calendar Page**: Personal event cards with quick *"Add Personal Event"* modal.
  - **Academic Calendar Page**: Official SECE CSE schedule with category filter chips (*Exam*, *Practical Review*, *Submission*, *Holiday*).

---

## 🎓 2.1 `student_dashboard.jsx` (Redesigned App Launcher Cards Grid UX)

**Path**: [client/src/student_dashboard/student_dashboard.jsx](file:///d:/CSE-bot/client/src/student_dashboard/student_dashboard.jsx)

### Architecture & Navigation:
- **Primary AI Workspace**: **Chitti AI Assistant Swarm** serves as the main home view without confusing persistent sidebars.
- **Top Right Square Mix App Launcher Button (`LayoutGrid`)**: Allows instant one-click access to the **Department Hubs Cards Page**.
- **Clean Full-Page Navigation**:
  - Clicking any Hub card transitions cleanly into a dedicated full-page view (`Message Hub`, `Calendar Hub`, `Hackathon Radar`, `Curriculum`).
  - Top header provides a **Back to Chitti AI** button and **Department Hubs Launcher (`LayoutGrid`)** icon for effortless switching.

### Department Hub Cards:
1. 📩 **Message Hub**: Gmail-inspired AI communication hub, email generator & inbox.
2. 📅 **Calendar Hub**: Swap card personal study scheduler & SECE official exam timetable.
3. 🚀 **Hackathon Radar**: Live SIH 2026, Google Solution Challenge & CoE Labs tracker.
4. 📚 **Curriculum & Syllabi**: Overall (Semesters 1-8) course credit distribution, professional electives & syllabus viewer.
5. 📚 **Curriculum & Syllabi**: Comprehensive course distribution, credit requirements, filter tabs & AI copilot.

## 🏡 2. `LandingPage.jsx` (Department Hero & Showcase)

**Path**: [client/src/components/LandingPage.jsx](file:///d:/CSE-bot/client/src/components/LandingPage.jsx)

### Props:
- `onStartChat`: Function callback transitioning application state to `'chat'`.
- `theme`: Current active theme string.
- `setTheme`: Theme toggle state dispatcher.

### Internal Components & Data Structures:
- `ScrollRevealItem`: Sub-component using browser-native `IntersectionObserver` to trigger a smooth 700ms opacity & vertical translation reveal when scrolling into viewport view (`threshold: 0.15`).
- `agentShowcases`: Array of 5 specialized agent data objects containing title, agent identifier, Lucide icon, headline text, detailed description, and sample queries:
  - `faculty_agent`: Faculty Directory & Governance Specialist.
  - `curriculum_agent`: Academic Curriculum & Syllabus Specialist.
  - `tutor_agent`: CS Programming & Algorithm Tutor.
  - `placement_agent`: Career, CoE & Skill Development Specialist.
  - `reception_agent`: Virtual Host & CVM Specialist.

### UI Sections:
1. **Floating Frosted Glass Header Pill**: Centered translucent pill bar floating over the viewport featuring `SECE CSE` Intelligent Platform brand identity, navigation links (*Platform Vision*, *Student Portal*, *Faculty Portal*, *AI Agents*, *Research & CoE*), theme toggle button, and rounded `Launch Platform` CTA.
2. **Dedicated Intelligent Department Hero Section**: Atmospheric layout with italicized serif headline accent (*"The Intelligent Department Platform"*), high-blur frosted glass search pill bar with circular action button, quick-prompt filter chips, and 3D robot artwork container with floating orbit badges.
3. **Dual Portal Workspace Gateway**: Interactive role-based gateway highlighting:
   - **Student Workspace**: Interactive CS AI Tutor, In-App Messages with Thread Summarizer, Academic & Personal Calendar Sync, and Global/Regional Hackathon Radar.
   - **Faculty & Advisor Portal**: Tutor & Advisor tools, Academic Schedule Publisher, UG PAC & Assessment Committee Records, and Curriculum Registry.
4. **Giant Typography Scroll Showcase**: Giant AnimeJS-powered staggered typography scroll list featuring high-contrast focus animation on agent names (`text-4xl` to `text-8xl`).
5. **CTA & Footer Section**: High-impact footer featuring giant translucent **`SECE`** background typography watermark (`text-[28vw]`), bold **`WE CSE.`** headline text, rounded pill assistant trigger button, and center attribution pill (*"CRAFTED WITH ❤️ BY SECE CSE"*).
6. **Floating Circular Assistant Action Widget**: Fixed bottom-right circular button (`💬`) allowing instant assistant invocation from anywhere on the landing screen.

---

## 💬 3. `ChatDashboard.jsx` (Main Chat Workspace)

**Path**: [client/src/components/ChatDashboard.jsx](file:///d:/CSE-bot/client/src/components/ChatDashboard.jsx)

### Props:
- `onBackToHome`: Function callback returning to landing screen.
- `theme`, `setTheme`: Theme state and updater.

### State Hooks & Animations:
- `messages`: Array of `ChatMessage` instances representing conversation history.
- `input`: Controlled string state for text input field.
- `isTyping`: Boolean flag indicating backend request status.
- `selectedAgent`: State string filtering quick prompt cards by specialized agent (`'all'`, `'faculty_agent'`, `'curriculum_agent'`, `'tutor_agent'`, `'placement_agent'`).
- `sessionId`: Unique session string initialized once per mount via `SessionManager.generateSessionId()`.
- **Structural Separation of Header & Chat Interface**: Top navigation bar (`<header>`) is rendered as a standalone fixed top bar (`w-full border-b border-brand-border bg-brand-light/95 backdrop-blur-md`). Below the header, the chat workspace is housed inside a dedicated rounded glass container box (`rounded-3xl border border-brand-border/80 bg-brand-light/30 backdrop-blur-md shadow-2xl overflow-hidden`).
- **Colorful Floating Tilted Cards Welcome View**: When `messages.length === 0`, displays 4 colorful tilted cards (`01 Faculty`, `02 Curriculum`, `03 Code Tutor`, `04 Placements`) in emerald, rose, amber, and fuchsia floating around the **"What's Next Big Idea!"** headline inside the chat container. All floating cards vanish completely once conversation begins.
- **60FPS Hardware-Accelerated Performance**: Optimized `backdrop-blur-md` layers, one-shot `animejs` mount execution (`hasAnimatedRef`), and eliminated GPU compositing overhead for ultra-smooth responsiveness.
- **100% Theme Adaptive Text Colors**: All typography elements dynamically respond to theme toggles via CSS variables (`var(--text-primary)`, `var(--text-secondary)`).

### Core Functions & Handlers:
- `handleSend(textToSend = input)`:
  - Trims and validates query input.
  - Constructs `ChatMessage.createUserMessage(query)` and appends it to `messages`.
  - Triggers client-side prediction `SessionManager.estimateAgent(query)` to instantly display agent feedback.
  - Calls `apiClient.sendQuestion(query, sessionId)` asynchronously.
  - Appends assistant response `ChatMessage.createAssistantMessage(answer, agentName)`.
  - Catches network errors and inserts styled system error notice.
- `handleClear()`:
  - Calls `apiClient.clearSession(sessionId)`.
  - Resets `messages` array to empty.

### Key Mobile UI Innovations:
- **`h-dvh` Container Height**: Eliminates mobile browser address bar jitter.
- **Mobile Robot Drawer**: Top header `<Bot>` button toggles slide-up drawer for mobile users to inspect the 3D CSE Virtual Robot avatar and active agent state.
- **16px Input Protection**: Prevents iOS Safari from auto-zooming when focusing input.

---

## ✍️ 4. `FormatContent.jsx` (Formatting Engine)

**Path**: [client/src/components/FormatContent.jsx](file:///d:/CSE-bot/client/src/components/FormatContent.jsx)

### Exported Functions:
- `parseInlineMarkdown(text)`: Uses regex splitting (`/(\*\*.*?\*\*|`.*?`)/g`) to parse bold text (`**`) into styled `<strong>` elements and inline code (`` ` ``) into styled `<code>` tags with `break-all` wrapping.
- `useFormatContent()`: Custom React hook returning a content formatter function:
  - Parses code block fences (` ``` `), extracts language tags, and renders syntax container with code copy button (`navigator.clipboard.writeText`).
  - Converts level 1, 2, and 3 markdown headers (`#`, `##`, `###`) into cyan and gold styled titles.
  - Converts list markers (`*`, `-`, `1.`) into structured HTML list items (`<li>`).
  - Wraps paragraphs with `break-words` for mobile screen safety.

---

## 🎨 5. `TechBackground.jsx` (Cyber Grid & Floating Formulas)

**Path**: [client/src/components/TechBackground.jsx](file:///d:/CSE-bot/client/src/components/TechBackground.jsx)

### Features:
- Renders 15 animated computer science, mathematics, and physics equations (e.g. $E=mc^2$, $\nabla \cdot E = \rho / \varepsilon_0$, $O(n \log n)$, binary matrices).
- Applies Tailwind CSS grid overlay (`55px 55px`) and CSS keyframe drift animation (`drift 14s ease-in-out infinite`).
- Renders an animated scan line element (`.scan-line`).
