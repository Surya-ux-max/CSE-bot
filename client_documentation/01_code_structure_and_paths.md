# 01: Code Structure & File Paths

This document presents the overall file organization, directory architecture, module linkages, and path reference tables for the CSE-Bot frontend client.

---

## 📁 Workspace File Tree

```
client/
├── public/
│   ├── favicon.svg                  # SVG App Favicon
│   ├── hero_bg.png                  # Pre-rendered background art asset
│   ├── icons.svg                    # SVG icon set
│   └── origami_bird.png             # Standalone fallback origami graphic
├── src/
│   ├── assets/                      # Application static graphic assets
│   ├── components/                  # UI React Component Suite
│   │   ├── ChatDashboard.jsx        # Main chat workspace & agent stream
│   │   ├── FormatContent.jsx        # Markdown, code snippet & heading formatter
│   │   ├── LandingPage.jsx          # Department hero page & agent showcases
│   │   └── TechBackground.jsx       # Floating math formulas & matrix background grid
│   ├── models/                      # Object-Oriented Domain Entities
│   │   └── ChatMessage.js           # ChatMessage class & factory constructors
│   ├── reference/                   # High-resolution media assets
│   │   ├── image2.png               # Hero origami graphic asset
│   │   └── robo.png                 # CSE 3D Virtual Robot avatar asset
│   ├── services/                    # Business Logic & Infrastructure API Services
│   │   ├── ApiClient.js             # HTTP Service & dynamic URL resolution
│   │   └── SessionManager.js        # Session ID generator & agent heuristic router
│   ├── App.css                      # App root container styling
│   ├── App.jsx                      # Main React Router / Page state orchestrator
│   ├── index.css                    # Tailwind CSS v4 design tokens & theme rules
│   └── main.jsx                     # React 19 DOM root mount entry point
├── .env.example                     # Environment variable template
├── .env.production                  # Production build environment config
├── eslint.config.js                 # ESLint JavaScript linting configuration
├── index.html                       # HTML5 template with mobile viewport meta tags
├── package.json                     # NPM dependency manifest and scripts
├── vite.config.js                   # Vite build bundler configuration
└── vercel.json                      # Vercel deployment routing configuration
```

---

## 🔍 Module & Path Linkages

### Entry Point Sequence
1. **[index.html](file:///d:/CSE-bot/client/index.html)**: Sets `<meta name="viewport">` with `viewport-fit=cover`, imports Google Fonts (*Bebas Neue*, *Inter*, *JetBrains Mono*), and mounts `<div id="root">`.
2. **[main.jsx](file:///d:/CSE-bot/client/src/main.jsx)**: Imports `index.css` design system and renders `<App />` inside React `<StrictMode>`.
3. **[App.jsx](file:///d:/CSE-bot/client/src/App.jsx)**: Maintains global theme (`dark` / `light`) and active screen state (`'landing'` | `'chat'`).

### Component Tree Topology
```
App
├── LandingPage
│   └── TechBackground (Floating Math & Grid)
└── ChatDashboard
    ├── TechBackground (Floating Math & Grid)
    ├── FormatContent (Markdown & Code Renderer)
    └── Mobile Robot Modal (Drawer view for mobile devices)
```

---

## 📋 Comprehensive File Path Table

| Module Name | File Path | Scope & Primary Responsibility |
| :--- | :--- | :--- |
| **HTML Shell** | [client/index.html](file:///d:/CSE-bot/client/index.html) | Viewport configuration, font imports, root element. |
| **DOM Root** | [client/src/main.jsx](file:///d:/CSE-bot/client/src/main.jsx) | React 19 application entry point. |
| **App Orchestrator** | [client/src/App.jsx](file:///d:/CSE-bot/client/src/App.jsx) | Page routing state and dark/light mode persistence. |
| **Global Styles** | [client/src/index.css](file:///d:/CSE-bot/client/src/index.css) | Design tokens, glassmorphism, mobile `h-dvh` utilities. |
| **Landing Screen** | [client/src/components/LandingPage.jsx](file:///d:/CSE-bot/client/src/components/LandingPage.jsx) | Department hero section and interactive agent showcase. |
| **Chat Dashboard** | [client/src/components/ChatDashboard.jsx](file:///d:/CSE-bot/client/src/components/ChatDashboard.jsx) | Real-time chat interaction stream and 3D Virtual Robot display. |
| **Formatter Engine** | [client/src/components/FormatContent.jsx](file:///d:/CSE-bot/client/src/components/FormatContent.jsx) | Custom syntax highlighting, markdown parsing, and code copy handler. |
| **Background FX** | [client/src/components/TechBackground.jsx](file:///d:/CSE-bot/client/src/components/TechBackground.jsx) | Dynamic floating math formulas, scan lines, and cyber grid overlay. |
| **Message Entity** | [client/src/models/ChatMessage.js](file:///d:/CSE-bot/client/src/models/ChatMessage.js) | Domain model for chat messages with static factory methods. |
| **API Client** | [client/src/services/ApiClient.js](file:///d:/CSE-bot/client/src/services/ApiClient.js) | Network HTTP service with dynamic IP resolution and fallback handling. |
| **Session Manager** | [client/src/services/SessionManager.js](file:///d:/CSE-bot/client/src/services/SessionManager.js) | LocalStorage theme manager, session ID generator, and agent heuristic route predictor. |
