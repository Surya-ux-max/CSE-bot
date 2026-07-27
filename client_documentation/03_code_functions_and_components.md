# 03: Code Functions & Components Breakdown

This document provides a line-by-line detailed functional reference for every React component, hook, handler, and state variable within the CSE-Bot client codebase.

---

## 📱 1. `App.jsx` (Application Orchestrator)

**Path**: [client/src/App.jsx](file:///d:/CSE-bot/client/src/App.jsx)

### Internal Components & State Hooks:
- `ConfettiCanvas`: 60fps HTML5 Canvas particle engine spawning 130+ randomized celebratory particles (amber, gold, cyan, emerald, magenta, white) with 2D gravity ($g = 0.48$), air resistance ($d = 0.95$), spin rotation, shape variance, and alpha decay upon button navigation.
- `const [confettiTrigger, setConfettiTrigger] = useState(null)`: Stores exact click coordinates `(x, y)` to fire randomized particle eruption.
- `const [theme, setTheme] = useState('dark')`: Tracks global UI theme (`'dark'` or `'light'`).
- `const [currentPage, setCurrentPage] = useState('landing')`: Manages active screen view (`'landing'` or `'chat'`).
- `handleNavigate(targetPage, event)`: Triggers spring button feedback, confetti explosion at origin click coordinates, and Clip Wipe screen transition curtain.

---

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
1. **Material 3 Header**: Compact brand logo, `v2.1 Robot` badge, theme toggle button, and responsive *"Launch Chitti"* CTA button.
2. **Redesigned Hero Section**: DeepMind cyber hybrid layout featuring glowing multi-agent status badge, high-contrast headline typography (`Next-Gen AI for Computer Science`), interactive prompt search input bar with quick try-chips, AnimeJS stagger entry animation, and 3D robot artwork container with floating orbit badges.
3. **Giant Typography Scroll Showcase**: Giant AnimeJS-powered staggered typography scroll list featuring high-contrast focus animation on agent names (`text-4xl` to `text-8xl`).
4. **CTA & Footer Section**: High-impact footer featuring giant translucent **`SECE`** background typography watermark (`text-[25vw]`), bold **`WE CSE.`** headline text, rounded pill assistant trigger button, and center attribution pill (*"CRAFTED WITH ❤️ BY SECE CSE"*).

---

## 💬 3. `ChatDashboard.jsx` (Main Chat Workspace)

**Path**: [client/src/components/ChatDashboard.jsx](file:///d:/CSE-bot/client/src/components/ChatDashboard.jsx)

### Props:
- `onBackToHome`: Function callback returning to landing screen.
- `theme`, `setTheme`: Theme state and updater.

### State Hooks:
- `messages`: Array of `ChatMessage` instances representing conversation history.
- `input`: Controlled string state for text input field.
- `isTyping`: Boolean flag indicating backend request status.
- `callingAgent`: String tracking the current active agent.
- `showMobileRobot`: Boolean controlling mobile drawer modal visibility on `< lg` screens.
- `sessionId`: Unique session string initialized once per mount via `SessionManager.generateSessionId()`.

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
