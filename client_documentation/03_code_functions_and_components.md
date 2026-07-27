# 03: Code Functions & Components Breakdown

This document provides a line-by-line detailed functional reference for every React component, hook, handler, and state variable within the CSE-Bot client codebase.

---

## 📱 1. `App.jsx` (Application Orchestrator)

**Path**: [client/src/App.jsx](file:///d:/CSE-bot/client/src/App.jsx)

### State Hooks & Lifecycle:
- `const [theme, setTheme] = useState('dark')`: Tracks global UI theme (`'dark'` or `'light'`).
- `const [currentPage, setCurrentPage] = useState('landing')`: Manages active screen view (`'landing'` or `'chat'`).
- `useEffect(() => { ... }, [])`: Restores theme preference from `SessionManager.getSavedTheme()` on component mount and clears stale local storage sessions.
- `useEffect(() => { ... }, [theme])`: Updates `document.documentElement.classList` (`'dark'` / `'light'`) and sets `style.colorScheme` for native scrollbar sync.

---

## 🏡 2. `LandingPage.jsx` (Department Hero & Showcase)

**Path**: [client/src/components/LandingPage.jsx](file:///d:/CSE-bot/client/src/components/LandingPage.jsx)

### Props:
- `onStartChat`: Function callback transitioning application state to `'chat'`.
- `theme`: Current active theme string.
- `setTheme`: Theme toggle state dispatcher.

### Internal Data Structures:
- `agentShowcases`: Array of 4 specialized agent cards containing title, agent identifier, Lucide icon, and description:
  - `faculty_agent`: Faculty Directory & Governance Specialist.
  - `curriculum_agent`: Curriculum, Course & Syllabus Specialist.
  - `tutor_agent`: CS Programming & Algorithm Tutor.
  - `placement_agent`: Career, CoE & Skill Development Specialist.

### UI Sections:
1. **Material 3 Header**: Compact brand logo, `v2.1 AI` badge, theme toggle button, and responsive *"Launch Assistant"* CTA button.
2. **Hero Section**: Responsive typography (`text-3xl sm:text-6xl lg:text-7xl`), department multi-agent badge, description, interactive CTA buttons, and high-res blended origami artwork container.
3. **Multi-Agent Grid**: 4 interactive card containers routing directly to chat view upon click.

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
