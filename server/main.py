"""
main.py — CSE-BOT Production Multi-Agent Engine
FastAPI application orchestrator. Delegates all route logic to modular route handlers.
Updated: 2026-07-29 JWT Auth Enabled.

Architecture:
  routes/chat.py      → /chat, /session/clear, /agents/stats, /agent-messages
  routes/messages.py  → /messages, /notifications
  routes/calendar.py  → /events, /academic-events, /calendar/query
  routes/meetings.py  → /meetings
  routes/speech.py    → /speech/log
  login/login.py      → /auth/*
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from config import config
from login.login import router as auth_router
from routes.chat import router as chat_router
from routes.messages import router as messages_router
from routes.calendar import router as calendar_router
from routes.meetings import router as meetings_router
from routes.speech import router as speech_router
from routes.opportunities import router as opportunities_router


# ==========================================================
# FastAPI App Initialization
# ==========================================================

app = FastAPI(
    title="CSE-BOT API",
    description="Production Multi-Agent Engine for Department of Computer Science & Engineering, SECE",
    version="2.4.0"
)

# ==========================================================
# CORS Middleware
# Restricted to known frontend origins only (not wildcard in production).
# Supports ALLOWED_ORIGIN env var for dynamic production Vercel deployment URLs.
# ==========================================================

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://cse-bot.vercel.app",
    "https://csebot.vercel.app",
]

extra_origin = os.environ.get("ALLOWED_ORIGIN") or os.environ.get("ALLOWED_ORIGINS")
if extra_origin:
    for orig in extra_origin.split(","):
        clean_extra = orig.strip().rstrip("/")
        if clean_extra and clean_extra not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(clean_extra)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# ==========================================================
# Register All Route Modules
# ==========================================================

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(messages_router)
app.include_router(calendar_router)
app.include_router(meetings_router)
app.include_router(speech_router)
app.include_router(opportunities_router) # Verified Opportunities Router


# ==========================================================
# Global Exception Handler (Security & Stack Trace Protection)
# ==========================================================

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catches all unhandled exceptions globally, logs error traceback,
    and returns a clean, secure HTTP 500 JSON response without leaking stack details.
    """
    print(f"[Global Exception Handler] Error processing {request.method} {request.url.path}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An internal server error occurred while processing your request. Please try again later."
        }
    )


# ==========================================================
# Startup Event
# Bug Fix B2: Academic Calendar Parser now guarded — only runs
# when the central DB academic_calendar table is empty.
# ==========================================================

@app.on_event("startup")
def on_startup():
    """Automatic DB initialization and conditional seeding on deployment startup."""
    try:
        from db import init_db, get_db_session, KnowledgeRegistry
        from seed_db import seed_database
        from seed_d_section import parse_and_seed_d_section
        from seed_faculty import parse_and_seed_faculty
        from login.login import seed_unified_users_if_needed

        print("[Startup] Initializing database tables...")
        init_db()

        print("[Startup] Seeding student rosters and faculty accounts...")
        try:
            parse_and_seed_d_section()
            parse_and_seed_faculty()
        except Exception as seed_err:
            print(f"[Startup Warning] Could not parse student/faculty markdown rosters: {seed_err}")

        with get_db_session() as session:
            count = session.query(KnowledgeRegistry).count()
            if count == 0:
                print("[Startup] Database is empty. Seeding all sector tables...")
                seed_database()
            else:
                print(f"[Startup] Database ready with {count} sector tables initialized.")

            # Sync central authentication users table
            try:
                seed_unified_users_if_needed(session)
                print("[Startup] Unified users authentication table synced.")
            except Exception as auth_err:
                print(f"[Startup Warning] Unified user sync error: {auth_err}")

        # Academic Calendar Parser — only run when central DB is empty
        try:
            from db import AcademicEvent
            from services.academic_calendar_parser import parse_academic_calendar_files

            with get_db_session() as session:
                existing_events = session.query(AcademicEvent).count()
                if existing_events == 0:
                    print("[Startup] No academic events found. Running Academic Calendar Parser...")
                    parse_academic_calendar_files("academic_calendar")
                else:
                    print(f"[Startup] Academic Calendar already seeded ({existing_events} events). Skipping parser.")
        except Exception as err:
            print(f"[Startup Warning] Academic Calendar Parser error: {err}")

    except Exception as e:
        print(f"[Startup Warning] Database auto-seed check skipped/error: {e}")


# ==========================================================
# Health Check
# ==========================================================

@app.get("/")
def home():
    return {
        "status": "running",
        "service": "CSE-BOT Production Multi-Agent Engine",
        "version": "2.2.0"
    }