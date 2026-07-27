# 05: Developer Deployment & Configuration Guide

This guide provides step-by-step instructions for installing dependencies, configuring environment variables, initializing PostgreSQL database tables, running the local FastAPI backend server, and deploying to cloud platforms (e.g. Render).

---

## 🔒 Confidentiality & Security Directives

> [!CAUTION]
> **NEVER** commit real API keys, database passwords, or secret tokens to public git repositories.
> Ensure `.env` is listed in your `.gitignore` file at all times.

---

## 🛠️ 1. Prerequisites & Installation

### System Requirements:
- **Python**: v3.11.0 or higher
- **PostgreSQL**: v14.0 or higher (Local installation or cloud service like Render / Supabase / Neon)
- **Groq API Account**: For Llama-3.3-70b inference key

### Installation Steps:
```bash
# Navigate to the server directory
cd server

# Create and activate a Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Linux/macOS
# OR
.venv\Scripts\activate     # On Windows PowerShell

# Install required dependencies
pip install -r requirements.txt
```

---

## ⚙️ 2. Environment Variables Configuration (`.env`)

Create a `.env` file inside the `server/` directory:

```env
# -------------------------------------------------------------
# GROQ LLM API KEY
# -------------------------------------------------------------
GROQ_API_KEY=<REDACTED_GROQ_API_KEY>

# -------------------------------------------------------------
# POSTGRESQL DATABASE CONNECTION URL
# Format: postgresql://<db_user>:<db_password>@<db_host>:<db_port>/<db_name>
# -------------------------------------------------------------
DATABASE_URL=postgresql://<REDACTED_DB_USER>:<REDACTED_DB_PASSWORD>@<REDACTED_DB_HOST>:5432/<REDACTED_DB_NAME>
```

---

## 🗄️ 3. Database Initialization & Auto-Seeding

The server includes automatic startup initialization. When `main.py` starts, `on_startup()` checks if the database contains records. If empty, it seeds all 15 department sector tables automatically.

### Manual Database Commands:
```bash
# Manually seed all 15 department tables
python seed_db.py

# Verify PostgreSQL table counts and row statistics
python check_db.py
```

---

## 🚀 4. Running the Local Server

```bash
# Run local FastAPI dev server with auto-reload
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Run local server exposed to LAN (for physical mobile device testing)
uvicorn main:app --host 0.0.0.0 --port 8000
```

- **Interactive Swagger API Docs**: Accessible at `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: Accessible at `http://127.0.0.1:8000/redoc`

---

## ☁️ 5. Cloud Deployment Guide (Render Blueprint)

The project includes a Render cloud deployment blueprint in [server/render.yaml](file:///d:/CSE-bot/server/render.yaml).

### Infrastructure Components:
1. **Managed PostgreSQL Database**: Name `cse-bot-db`, region `singapore`, database name `cse_bot`.
2. **FastAPI Web Service**: Name `cse-bot-backend`, build command `pip install -r requirements.txt`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`.

### Procfile Definition ([server/Procfile](file:///d:/CSE-bot/server/Procfile)):
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Environment Variables to Configure on Render Dashboard:
- `GROQ_API_KEY`: Set to your secret Groq API key (`gsk_...`).
- `DATABASE_URL`: Automatically linked to the managed PostgreSQL database service instance (`postgres://...`). `config.py` automatically converts `postgres://` to `postgresql://` at runtime.
