# 02: Object-Oriented Programming (OOP) & Design Patterns

The CSE-Bot client architecture leverages modern JavaScript ES6+ Object-Oriented Programming (OOP) principles and classical design patterns to ensure clean separation of concerns, maintainability, and code reusability.

---

## 🏛️ 1. Domain Entity & Factory Pattern (`ChatMessage`)

The [ChatMessage.js](file:///d:/CSE-bot/client/src/models/ChatMessage.js) file implements a dedicated domain model class representing individual conversational message entities in the application.

```javascript
export class ChatMessage {
  constructor({ id = Date.now(), role, content, agentName = 'reception_agent', timestamp = new Date() }) {
    this.id = id
    this.role = role // 'user' | 'assistant'
    this.content = content
    this.agentName = agentName
    this.timestamp = timestamp
  }

  // Factory Method for User Messages
  static createUserMessage(content) {
    return new ChatMessage({
      role: 'user',
      content: content.trim(),
      agentName: 'user'
    })
  }

  // Factory Method for Assistant Messages
  static createAssistantMessage(content, agentName = 'reception_agent') {
    return new ChatMessage({
      role: 'assistant',
      content: content,
      agentName: agentName
    })
  }
}
```

### OOP Principles Applied:
- **Encapsulation**: Bundles message properties (`id`, `role`, `content`, `agentName`, `timestamp`) inside a single class instance.
- **Static Factory Method Pattern**: Hides complex constructor initialization behind semantic methods (`createUserMessage` and `createAssistantMessage`), ensuring standard default properties across the client.

---

## 🌐 2. Service Layer & Singleton Pattern (`ApiClient`)

The [ApiClient.js](file:///d:/CSE-bot/client/src/services/ApiClient.js) class encapsulates all backend network interactions with the FastAPI server.

```javascript
const DEFAULT_PROD_URL = 'https://cse-bot-backend.onrender.com'
const DEFAULT_LOCAL_URL = 'http://127.0.0.1:8000'

export class ApiClient {
  constructor() {
    const envUrl = import.meta.env.VITE_API_BASE_URL
    const host = window.location.hostname

    if (envUrl) {
      this.baseUrl = envUrl.replace(/\/$/, '')
    } else if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      this.baseUrl = `http://${host}:8000`
    } else {
      this.baseUrl = DEFAULT_PROD_URL
    }
  }

  async sendQuestion(question, sessionId) { ... }
  async clearSession(sessionId) { ... }
}

// Singleton Export
export const apiClient = new ApiClient()
```

### OOP & Design Patterns Applied:
- **Singleton Pattern**: The module exports a single shared instance (`export const apiClient = new ApiClient()`), ensuring a single point of network configuration throughout the React component lifecycle.
- **Dynamic Host Resolution & Portability**: Automatically resolves local LAN IP addresses (e.g. `192.168.x.x` or `10.x.x.x`), allowing mobile devices on the same Wi-Fi network to seamlessly communicate with the dev backend without code changes.
- **Resilient Fallback Mechanism**: Intercepts local connection failures and retries against the production Render API endpoint.

---

## 🛠️ 3. Utility Class & Heuristic Routing Pattern (`SessionManager`)

The [SessionManager.js](file:///d:/CSE-bot/client/src/services/SessionManager.js) class provides static utility methods for session state management and agent classification.

```javascript
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
    if (qLower.includes('placement') || qLower.includes('coe') || qLower.includes('hackathon')) {
      return 'placement_agent'
    }
    if (qLower.includes('faculty') || qLower.includes('hod') || qLower.includes('professor')) {
      return 'faculty_agent'
    }
    if (qLower.includes('syllabus') || qLower.includes('curriculum') || qLower.includes('course')) {
      return 'curriculum_agent'
    }
    if (qLower.includes('code') || qLower.includes('quicksort') || qLower.includes('recursion')) {
      return 'tutor_agent'
    }
    return 'reception_agent'
  }
}
```

### OOP & Strategy Pattern Applied:
- **Static Class Abstraction**: Groups theme storage, random session generation, and agent prediction into a cohesive domain namespace.
- **Client-Side Heuristic Strategy**: Predicts which AI agent will respond before the server call finishes, allowing the UI to instantly display real-time feedback (e.g., `"Reckoning (faculty_agent)..."`).

---

## 🎨 4. Custom Hook & Parser Abstraction (`useFormatContent`)

The [FormatContent.jsx](file:///d:/CSE-bot/client/src/components/FormatContent.jsx) file abstracts markdown parsing and code block highlighting into a reusable React custom hook.

### Pattern Features:
- **Separation of Formatting Logic**: Keeps JSX rendering in `ChatDashboard.jsx` clean and concise.
- **Stateful Formatting Context**: Tracks clipboard copy status (`copiedIndex`) independently for every code snippet block.
