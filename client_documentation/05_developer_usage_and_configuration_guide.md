# 05: Developer Usage & Configuration Guide

This guide provides step-by-step instructions for setup, configuration, local mobile testing, customization, and deployment of the CSE-Bot frontend client.

---

## 🛠️ 1. Prerequisites & Installation

Ensure you have **Node.js** (v18.0.0 or higher) and **npm** installed.

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install
```

### Dependencies Installed:
- `react`, `react-dom` (v19.2.7)
- `vite` (v8.1.1)
- `@tailwindcss/vite`, `tailwindcss` (v4.3.2)
- `lucide-react` (v1.23.0)

---

## 🚀 2. Command Line Scripts

Run the following npm scripts from within the `client/` directory:

| Command | Action | Output / Description |
| :--- | :--- | :--- |
| `npm run dev` | Starts Vite local dev server | Starts local server with HMR at `http://localhost:5173`. |
| `npx vite --host 0.0.0.0` | Starts server exposed to LAN | Exposes dev server to local Wi-Fi network for mobile device testing. |
| `npm run build` | Production Build | Bundles production assets into `client/dist/`. |
| `npm run preview` | Preview Production Build | Serves production build locally for verification. |
| `npm run lint` | ESLint Linting | Audits JS/JSX files for lint warnings or syntax errors. |

---

## ⚙️ 3. Environment Variable Configuration

Create a `.env` file in the `client/` directory (refer to `.env.example`):

```env
# Backend API Base URL Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Fallback Behavior:
- **Local Dev Mode (`localhost` / `127.0.0.1`)**: If `VITE_API_BASE_URL` is omitted, `ApiClient.js` defaults to `http://127.0.0.1:8000`.
- **Local LAN Testing (`192.168.x.x` / `10.x.x.x`)**: Automatically targets `http://<your-device-ip>:8000`.
- **Production Mode**: Defaults to `https://cse-bot-backend.onrender.com`.

---

## 📲 4. Testing on Mobile Devices via Local Wi-Fi (LAN)

To test the application directly on your physical mobile phone connected to the same Wi-Fi network:

1. **Start Backend Server** (on port `8000` listening on `0.0.0.0`):
   ```bash
   cd server
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Start Vite Client** (exposed to host):
   ```bash
   cd client
   npx vite --host 0.0.0.0
   ```

3. **Open Mobile Browser**:
   Navigate to `http://<YOUR_COMPUTER_LOCAL_IP>:5173` on your mobile phone browser (e.g. `http://192.168.1.15:5173`).
   - The UI will automatically adjust to mobile layout (`h-dvh`, mobile robot drawer, touch padding).
   - API calls will automatically route to `http://192.168.1.15:8000/chat`.

---

## 🔧 5. Customization & Extension Guide

### Adding New Sample Prompts
Edit the `quickPrompts` array in [client/src/components/ChatDashboard.jsx](file:///d:/CSE-bot/client/src/components/ChatDashboard.jsx):
```javascript
const quickPrompts = [
  { category: 'Faculty & Governance', query: 'Who is the Head of the Department?' },
  { category: 'Curriculum & Syllabus', query: 'Syllabus details for Cloud Computing?' },
  { category: 'CS Programming Tutor', query: 'Explain quicksort algorithm in C++' },
  { category: 'Career & Placements', query: 'What hackathons & CoE labs are available?' }
]
```

### Modifying Agent Routing Heuristics
Edit `estimateAgent()` in [client/src/services/SessionManager.js](file:///d:/CSE-bot/client/src/services/SessionManager.js) to update client-side prediction keywords.

---

## 🌐 6. Production Deployment Guide (Vercel / Render)

### Vercel Deployment Configuration ([vercel.json](file:///d:/CSE-bot/client/vercel.json)):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Deploy Steps:
1. Connect repository to Vercel or Netlify.
2. Set Root Directory to `client`.
3. Set Build Command to `npm run build`.
4. Set Output Directory to `dist`.
5. Add Environment Variable: `VITE_API_BASE_URL=https://cse-bot-backend.onrender.com`.
