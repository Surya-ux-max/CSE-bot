import os
import re
import json
import threading
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq

# ==========================================================
# Load Environment Variables
# ==========================================================

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError("GROQ_API_KEY not found in .env")


# ==========================================================
# FastAPI App
# ==========================================================

app = FastAPI(
    title="CSE-BOT API",
    description="Official AI Assistant for Computer Science and Engineering Department at Sri Eshwar College of Engineering",
    version="2.0.0"
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Change later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# LLM Initialization
# ==========================================================

print("Loading Groq LLM...")
llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    groq_api_key=groq_api_key,
    temperature=0.3
)
print("LLM Loaded")


# ==========================================================
# Session Memory Manager
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
            # Limit history to self.max_history_turns turns (each turn has User + AI messages)
            limit = self.max_history_turns * 2
            if len(self.history[session_id]) > limit:
                self.history[session_id] = self.history[session_id][-limit:]

    def clear_history(self, session_id: str):
        with self._lock:
            if session_id in self.history:
                del self.history[session_id]

history_manager = SessionHistoryManager(max_history_turns=6)


# ==========================================================
# System Prompts & Agent Core
# ==========================================================

AGENT_SYSTEM_PROMPT = (
    "You are CSE-BOT, the official AI assistant for the Department of Computer Science and Engineering "
    "at Sri Eshwar College of Engineering (SECE).\n"
    "Provide clear, informative, accurate, and professional responses to academic, technical, and general departmental queries.\n"
    "Be supportive, encouraging, and authoritative. Provide code examples when asked, and assist students, "
    "faculty, and visitors effectively."
)


def get_agent_response(question: str, chat_history: List[BaseMessage]) -> str:
    messages = [
        SystemMessage(content=AGENT_SYSTEM_PROMPT)
    ] + chat_history + [
        HumanMessage(content=question)
    ]
    response = llm.invoke(messages)
    return response.content.strip()


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
        "message": "CSE-BOT API (Agent Engine) is running successfully."
    }


@app.post("/chat")
def chat(request: ChatRequest):
    session_id = request.session_id or "default"
    question = request.question.strip()
    
    if not question:
        return {"answer": "Please ask a question."}
        
    history = history_manager.get_history(session_id)
    
    try:
        answer = get_agent_response(question, history)
    except Exception as e:
        print(f"Error generating agent response: {e}")
        answer = "I apologize, I encountered an error while processing your request. Please try again."
        
    # Save to history
    history_manager.add_message(session_id, HumanMessage(content=question))
    history_manager.add_message(session_id, AIMessage(content=answer))
    
    return {
        "answer": answer
    }


@app.post("/session/clear")
def clear_session(request: ClearSessionRequest):
    history_manager.clear_history(request.session_id)
    return {
        "status": "success",
        "message": f"Session history cleared for {request.session_id}"
    }


# ==========================================================
# Run Server
# ==========================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )