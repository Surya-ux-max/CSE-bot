"""
routes/chat.py
Chat, agent-stats, session, and inter-agent message bus endpoints.
"""
import threading
from typing import Dict, List, Optional, Any

from fastapi import APIRouter
from pydantic import BaseModel
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage

from config import config
from services.supervisor import supervisor_router

router = APIRouter(tags=["Chat"])


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
    user_email: Optional[str] = None
    user_role: Optional[str] = "student"


class ClearSessionRequest(BaseModel):
    session_id: str
    user_email: Optional[str] = None


import time

# ==========================================================
# Sliding Window In-Memory Rate Limiter
# ==========================================================

class RateLimiter:
    """Sliding window in-memory rate limiter per user_email (max 30 req / 60s)."""
    def __init__(self, max_requests: int = 30, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.timestamps: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def is_allowed(self, user_email: str) -> bool:
        now = time.time()
        with self._lock:
            if user_email not in self.timestamps:
                self.timestamps[user_email] = []

            cutoff = now - self.window_seconds
            self.timestamps[user_email] = [t for t in self.timestamps[user_email] if t > cutoff]

            if len(self.timestamps[user_email]) >= self.max_requests:
                return False

            self.timestamps[user_email].append(now)
            return True


chat_rate_limiter = RateLimiter(max_requests=30, window_seconds=60)


# ==========================================================
# Chat Endpoint
# ==========================================================

@router.post("/chat")
def chat(request: ChatRequest):
    session_id = request.session_id or "default"
    question = request.question.strip()
    user_email = (request.user_email or "anonymous").strip().lower()
    user_role = (request.user_role or "student").strip().lower()

    if not chat_rate_limiter.is_allowed(user_email):
        from fastapi import HTTPException
        raise HTTPException(
            status_code=429,
            detail="Rate Limit Exceeded: You are asking questions too fast. Please wait a minute before sending another query."
        )

    if not question:
        return {"answer": "Please ask a question.", "agent_name": "reception_agent"}

    history_key = f"{user_email}:{session_id}"
    history = history_manager.get_history(history_key)

    try:
        agent_name, answer = supervisor_router.route_and_execute(question, history, user_role)
    except Exception as e:
        import traceback
        print(f"[API Error] Failed to generate agent response: {e}")
        print(traceback.format_exc())
        agent_name = "reception_agent"
        answer = "I apologize, I encountered an error while processing your request. Please check if GROQ_API_KEY is configured."

    # Auto-connect Mail Agent if email dispatch/broadcast intent is detected
    # EXCEPT for Placement Agent and Hackathon Agent (pure search engines)
    mail_intent_keywords = [
        "send mail", "send email", "email students", "mail students", "broadcast email",
        "mail to", "email to", "announce via mail", "announce via email", "dispatch email",
        "mail all", "send a mail", "send an email", "send notification", "notify students",
        "email all", "mail all", "draft mail", "draft email", "draft message", "send message",
        "broadcast message", "notify via mail", "notify via email", "post announcement",
        "announce email", "message students", "shoot mail", "shoot email", "notify via message"
    ]
    q_lower = question.lower()
    is_mail_action = any(kw in q_lower for kw in mail_intent_keywords)

    if is_mail_action:
        try:
            from routes.messages import MessageAgentRequest, process_message_agent_command
            msg_req = MessageAgentRequest(email=user_email, role=user_role, prompt=question)
            msg_res = process_message_agent_command(msg_req)
            if msg_res.get("status") == "success":
                recipient = msg_res.get("recipient", "@all")
                subj = msg_res.get("subject", "Placement & Hackathon Announcement")
                mail_dispatch_note = (
                    f"\n\n✉️ **[Mail Agent Connected & Dispatched]**\n"
                    f"*An official email titled **'{subj}'** has been successfully dispatched to **{recipient}** via Message Hub!*"
                )
                answer += mail_dispatch_note
        except Exception as mail_err:
            print(f"[Mail Auto-Dispatch Error]: {mail_err}")

    # Direct Content Publisher for Placement & Hackathon Agents
    is_page_preview_session = session_id in ["hackathon_page_session", "curriculum_page_session"]
    publish_keywords = ["publish", "post", "announce", "add placement", "create placement", "add drive", "create drive", "add hackathon", "create hackathon", "post drive", "post hackathon"]
    is_publish_action = any(kw in q_lower for kw in publish_keywords) and not is_page_preview_session

    if is_publish_action:
        import re

        def clean_extracted_text(raw_text: str) -> str:
            if not raw_text:
                return ""
            cleaned = re.sub(r"^[#*:\s\-\>]+", "", raw_text)
            cleaned = re.sub(r"[*#]+", "", cleaned).strip()
            return cleaned

        if agent_name == "placement_agent":
            try:
                from routes.opportunities import create_placement, PlacementCreateRequest
                company_match = re.search(r"(?:company(?:\s*name)?|partner|organization)[:\s]*([^\n]+)", answer, re.IGNORECASE)
                title_match = re.search(r"(?:job\s*title|drive(?:\s*title)?|placement(?:\s*title)?)[:\s]*([^\n]+)", answer, re.IGNORECASE)

                if not title_match:
                    title_match = re.search(r"(?:title)[:\s]*([^\n]+)", answer, re.IGNORECASE)

                raw_company = company_match.group(1).strip() if company_match else ""
                raw_title = title_match.group(1).strip() if title_match else ""

                company = clean_extracted_text(raw_company) or "Placement Cell Partner"
                title = clean_extracted_text(raw_title) or (f"{company} Recruitment Drive" if company != "Placement Cell Partner" else "Placement Drive Announcement")

                p_req = PlacementCreateRequest(
                    title=title,
                    company=company,
                    description=answer[:800],
                    deadline="Active",
                    user_email=user_email,
                    user_role=user_role
                )
                create_placement(p_req)
                pub_note = (
                    f"\n\n🚀 **[Published to Placement Hub]**\n"
                    f"*This placement drive poster has been directly published to the database! Students & Faculty can now view this active card on their Placement Hub dashboard.*"
                )
                answer += pub_note
            except Exception as p_err:
                print(f"[Placement Publisher Error]: {p_err}")

        elif agent_name == "hackathon_agent":
            try:
                from routes.opportunities import create_hackathon, HackathonCreateRequest
                title_match = re.search(r"(?:title|hackathon|contest)[:\s]*([^\n]+)", answer, re.IGNORECASE)
                raw_title = title_match.group(1).strip() if title_match else "Hackathon Opportunity"
                title = clean_extracted_text(raw_title) or "Hackathon Opportunity"

                h_req = HackathonCreateRequest(
                    title=title,
                    description=answer[:800],
                    deadline="Active",
                    user_email=user_email,
                    user_role=user_role
                )
                create_hackathon(h_req)
                pub_note = (
                    f"\n\n🚀 **[Published to Hackathon Hub]**\n"
                    f"*This hackathon poster has been directly published to the database! Students & Faculty can now view this active card on their Hackathon Hub dashboard.*"
                )
                answer += pub_note
            except Exception as h_err:
                print(f"[Hackathon Publisher Error]: {h_err}")

    # Save to history
    history_manager.add_message(history_key, HumanMessage(content=question))
    history_manager.add_message(history_key, AIMessage(content=answer))

    # Publish to InterAgentMessageBus for curriculum/faculty queries
    if agent_name in ["curriculum_agent", "faculty_agent"]:
        try:
            from services.agent_message_bus import agent_message_bus
            agent_message_bus.publish_message(
                sender_agent=agent_name,
                recipient_target=user_email,
                subject=f"{agent_name.replace('_', ' ').title()} Inquiry",
                content=f"Query: {question}\nResponse: {answer[:300]}",
                metadata={"user_role": user_role}
            )
        except Exception as bus_err:
            print(f"[AgentMessageBus Chat Publish Error]: {bus_err}")

    # Save to AgentActivityLog DB table for performance and budget audit logs
    try:
        from db import get_db_session, AgentActivityLog
        with get_db_session() as db:
            log = AgentActivityLog(
                agent_name=agent_name,
                user_email=user_email,
                user_role=user_role,
                query=question,
                response=answer
            )
            db.add(log)
            db.commit()
            print(f"[DB Log] Logged execution of '{agent_name}' for user {user_email}")
    except Exception as log_err:
        print(f"[DB Log Error] Failed to write agent activity log: {log_err}")

    return {
        "answer": answer,
        "agent_name": agent_name
    }


@router.post("/session/clear")
def clear_session(request: ClearSessionRequest):
    user_email = (request.user_email or "anonymous").strip().lower()
    history_key = f"{user_email}:{request.session_id}"
    history_manager.clear_history(history_key)
    return {
        "status": "success",
        "message": f"Session history cleared for {history_key}"
    }


@router.get("/agent-messages")
def get_agent_messages():
    """Retrieves all internal inter-agent messages published on the InterAgentMessageBus."""
    from services.agent_message_bus import agent_message_bus
    return {
        "status": "success",
        "count": len(agent_message_bus.message_history),
        "messages": agent_message_bus.get_messages(100)
    }


@router.get("/agents/stats")
def get_agents_stats():
    """Returns the total number of agents, their roles, and dynamic invocation stats."""
    from db import get_db_session, AgentActivityLog
    from sqlalchemy import func

    agent_registry = {
        "faculty_agent": {
            "name": "Faculty Directory Agent",
            "role": "Search/Lookup",
            "scope": "Faculty members, HOD details, designation search, academic committees, research domains, email directories, and corporate board representation.",
            "tables": ["professors", "yuvaraj", "assessment_committee", "corporate_board"]
        },
        "curriculum_agent": {
            "name": "Curriculum & Syllabus Agent",
            "role": "Search/Lookup",
            "scope": "Course distribution, professional electives, syllabus detail search, credit distributions, regulations, and industry-offered electives.",
            "tables": ["semester_curriculum", "professional_electives", "curriculum_overview", "industry_courses", "curriculum_faq"]
        },
        "tutor_agent": {
            "name": "CS Programming & Algorithm Tutor",
            "role": "Tutor/Mentor",
            "scope": "Step-by-step mentoring, data structure conceptualizations, code generation, and algorithmic complexity analysis.",
            "tables": []
        },
        "placement_agent": {
            "name": "Career & Placements Search Engine",
            "role": "Intelligent Search Engine",
            "scope": "Search placement opportunities, CoE labs, hackathon preparation tips, and create copy-ready announcement templates for coordinators.",
            "tables": ["enhance_learning", "learning_scope", "program_outcomes", "program_details"]
        },
        "hackathon_agent": {
            "name": "Hackathon Radar & CoE Tracker",
            "role": "Intelligent Search Engine",
            "scope": "Track coding competitions (SIH 2026, Google Solution Challenge), Nvidia CoE activities, and draft copy-ready broadcast drafts.",
            "tables": ["enhance_learning", "learning_scope"]
        },
        "reception_agent": {
            "name": "Host & Greetings Agent",
            "role": "Host/Receptionist",
            "scope": "Casual conversational greeting, student guidance, vision and mission lookup, and platform pleasantries.",
            "tables": ["cvm", "program_scope"]
        }
    }

    try:
        with get_db_session() as db:
            results = db.query(
                AgentActivityLog.agent_name,
                func.count(AgentActivityLog.id)
            ).group_by(AgentActivityLog.agent_name).all()
            invocations = {r[0]: r[1] for r in results}
    except Exception as e:
        print(f"[Stats Query Error] {e}")
        invocations = {}

    agents_list = []
    for key, info in agent_registry.items():
        agents_list.append({
            "agent_key": key,
            "display_name": info["name"],
            "role_type": info["role"],
            "functional_work": info["scope"],
            "target_tables": info["tables"],
            "total_queries_served": invocations.get(key, 0)
        })

    return {
        "status": "success",
        "total_active_agents": len(agent_registry),
        "agents": agents_list
    }
