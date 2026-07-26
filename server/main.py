import os
import threading
from typing import Dict, List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from config import config
from services.supervisor import supervisor_router

# ==========================================================
# FastAPI App Initialization
# ==========================================================

app = FastAPI(
    title="CSE-BOT API",
    description="Production Multi-Agent Engine for Department of Computer Science & Engineering, SECE",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Automatic DB initialization and seeding check on deployment startup."""
    try:
        from db import init_db, get_db_session, KnowledgeRegistry
        from seed_db import seed_database
        
        print("[Render Startup] Initializing PostgreSQL database tables...")
        init_db()
        
        with get_db_session() as session:
            count = session.query(KnowledgeRegistry).count()
            if count == 0:
                print("[Render Startup] Database is empty. Seeding all 15 sector tables...")
                seed_database()
            else:
                print(f"[Render Startup] Database ready with {count} sector tables initialized.")
    except Exception as e:
        print(f"[Render Startup Warning] Database auto-seed check skipped/error: {e}")



# ==========================================================
# Thread-Safe Session History Manager
# ==========================================================

class SessionHistoryManager:
    """Manages thread-safe in-memory session history with a sliding window."""
    def __init__(self, max_history_turns: int = 6):
        self.history: Dict[str, List[BaseMessage]] = {}
        self._lock = threading.Lock()
        self.max_history_turns = max_history_turns

    def get_history(self, session_id: str) -> List[BaseMessage]:
        with self._lock:
            if session_id not in self.history:
                self.history[session_id] = []
            return self.history[session_id]

    def add_message(self, session_id: str, message: BaseMessage):
        with self._lock:
            if session_id not in self.history:
                self.history[session_id] = []
            self.history[session_id].append(message)
            limit = self.max_history_turns * 2
            if len(self.history[session_id]) > limit:
                self.history[session_id] = self.history[session_id][-limit:]

    def clear_history(self, session_id: str):
        with self._lock:
            if session_id in self.history:
                del self.history[session_id]

history_manager = SessionHistoryManager(max_history_turns=6)


# ==========================================================
# Pydantic Request Models
# ==========================================================

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"


class ClearSessionRequest(BaseModel):
    session_id: str


# ==========================================================
# Endpoints
# ==========================================================

@app.get("/")
def home():
    return {
        "status": "running",
        "service": "CSE-BOT Production Multi-Agent Engine",
        "version": "2.1.0"
    }


@app.post("/chat")
def chat(request: ChatRequest):
    session_id = request.session_id or "default"
    question = request.question.strip()
    
    if not question:
        return {"answer": "Please ask a question.", "agent_name": "reception_agent"}
        
    history = history_manager.get_history(session_id)
    
    try:
        agent_name, answer = supervisor_router.route_and_execute(question, history)
    except Exception as e:
        print(f"[API Error] Failed to generate agent response: {e}")
        agent_name = "reception_agent"
        answer = "I apologize, I encountered an error while processing your request. Please try again."
        
    # Save to history
    history_manager.add_message(session_id, HumanMessage(content=question))
    history_manager.add_message(session_id, AIMessage(content=answer))
    
    return {
        "answer": answer,
        "agent_name": agent_name
    }


@app.post("/session/clear")
def clear_session(request: ClearSessionRequest):
    history_manager.clear_history(request.session_id)
    return {
        "status": "success",
        "message": f"Session history cleared for {request.session_id}"
    }