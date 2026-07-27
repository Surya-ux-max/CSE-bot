# 04: UI Elements & Design System

The CSE-Bot client features a Google Material 3 inspired visual aesthetics built with Tailwind CSS v4, custom CSS variable tokens, glassmorphism, dynamic animations, dark/light theme switching, and mobile responsiveness.

---

## 🎨 1. Design System & CSS Variables

All color palettes, background tokens, and typography definitions are centralized in [client/src/index.css](file:///d:/CSE-bot/client/src/index.css).

### CSS Variables Palette:
```css
:root, .dark {
  color-scheme: dark;
  --bg-primary: #0a0a0a;
  --bg-secondary: #121212;
  --bg-card: #18181b;
  --bg-input: #1f1f23;
  --border-color: #27272a;
  --text-primary: #f4f4f5;
  --text-secondary: #a1a1aa;
  --heading-gold: #fbbf24;
  --heading-cyan: #38bdf8;
  --bold-amber: #fde047;
}

.light {
  color-scheme: light;
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-input: #f1f5f9;
  --border-color: #e2e8f0;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --heading-gold: #d97706;
  --heading-cyan: #0284c7;
  --bold-amber: #b45309;
}
```

---

## 💎 2. Glassmorphism & UI Components

### Nav Glass Header (`.nav-glass`)
Provides a sleek frosted glass effect with high saturation backdrop blur:
```css
.nav-glass {
  background: rgba(10,10,10,0.75);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
```

### Glass Cards (`.glass-card`)
Card components utilize subtle backdrop blur, hover elevation, and golden glow effects:
```css
.glass-card {
  background: rgba(22,22,22,0.55);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(42,42,42,0.7);
  transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
}
.glass-card:hover {
  background: rgba(30,30,30,0.75);
  border-color: rgba(255,193,7,0.3);
  transform: translateY(-5px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 28px rgba(255,193,7,0.07);
}
```

---

## 🤖 3. CSE Virtual Robot Showcase & Keyframe Animations

The 3D Virtual Robot avatar (`robo.png`) features custom CSS keyframe animations representing active agent intelligence:

```css
/* Floating Hover Animation */
@keyframes roboFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(0.8deg); }
}

/* Cyber Glow Aura Pulse */
@keyframes roboGlowPulse {
  0%, 100% { box-shadow: 0 0 25px rgba(255, 193, 7, 0.25), 0 0 50px rgba(6, 182, 212, 0.15); }
  50% { box-shadow: 0 0 45px rgba(255, 193, 7, 0.45), 0 0 90px rgba(6, 182, 212, 0.35); }
}

/* Processing Laser Scan Line */
@keyframes roboScanLine {
  0% { top: 0%; opacity: 0; }
  15% { opacity: 0.8; }
  85% { opacity: 0.8; }
  100% { top: 100%; opacity: 0; }
}
```

### Visual Modes:
- **Desktop (`≥ lg`)**: Displayed in the right 40% split column with ambient golden cyber glow and state indicator.
- **Mobile (`< lg`)**: Displayed inside an overlay slide-up modal drawer triggered via header `<Bot>` icon button.

---

## 📱 4. Mobile Layout & Touch Utilities

| CSS Utility | Rule | Purpose |
| :--- | :--- | :--- |
| `.h-dvh` | `height: 100dvh;` | Fixes mobile browser address bar height cutoff bug. |
| `.pb-safe` | `padding-bottom: env(safe-area-inset-bottom);` | Prevents UI elements from colliding with iOS/Android home bars. |
| `-webkit-tap-highlight-color` | `transparent` | Removes dark grey flash during touch taps on mobile. |
| `text-base sm:text-sm` | `font-size: 16px` on mobile | Prevents iOS Safari from forcing auto-zoom on input focus. |
| `break-words` | `overflow-wrap: break-word;` | Prevents long text/code from pushing message bubbles out of bounds. |
| `.animate-clipWipeEnter` | `clip-path: polygon(...)` | Sweeps golden clip wipe curtain across screen upon screen change. |
| `.animate-clipWipeExit` | `clip-path: polygon(...)` | Sweeps clip wipe curtain off screen to reveal target view. |
