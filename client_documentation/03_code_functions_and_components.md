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
1. **Floating Frosted Glass Pill Header**: Centered translucent pill bar floating over the viewport featuring brand identity, navigation links (*Home*, *5 AI Agents*, *Faculty*, *Curriculum*, *Placements*), theme toggle button, and rounded pill CTA.
2. **Cinematic Frosted Glass Hero Section**: Atmospheric layout with italicized serif headline accent (*"Meet your virtual robot today"*), high-blur frosted glass search pill bar with circular action button, quick-prompt filter chips, and 3D robot artwork container with floating orbit badges.
3. **Giant Typography Scroll Showcase**: Giant AnimeJS-powered staggered typography scroll list featuring high-contrast focus animation on agent names (`text-4xl` to `text-8xl`).
4. **CTA & Footer Section**: High-impact footer featuring giant translucent **`SECE`** background typography watermark (`text-[25vw]`), bold **`WE CSE.`** headline text, rounded pill assistant trigger button, and center attribution pill (*"CRAFTED WITH ❤️ BY SECE CSE"*).
5. **Floating Circular Assistant Action Widget**: Fixed bottom-right circular button (`💬`) allowing instant assistant invocation from anywhere on the landing screen.

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
