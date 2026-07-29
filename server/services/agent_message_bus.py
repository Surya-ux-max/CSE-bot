import logging
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage
from config import config

logger = logging.getLogger("AGENT_MESSAGE_BUS")

class CalendarAgent:
    """
    Calendar Agent: Subscribes to internal inter-agent messages, uses NLP to extract
    event dates, times, deadlines, and meeting details, and automatically updates
    academic & personal calendars across DBs.
    """
    def __init__(self):
        self.llm = config.llm

    def parse_event_with_nlp(self, subject: str, content: str) -> Optional[Dict[str, Any]]:
        """
        Uses LLM NLP extraction to parse structured event/deadline details from message text.
        """
        prompt = f"""You are the Calendar Agent NLP Extractor for SECE Computer Science Department.
Analyze the following inter-agent message content and extract event details.

MESSAGE SUBJECT: "{subject}"
MESSAGE BODY:
"{content}"

Today's Date Context: {datetime.utcnow().strftime('%Y-%m-%d')}

Extract:
1. "event_title": Short clear title (e.g., "Amazon Placement Drive", "Smart India Hackathon Deadline", "Project Review Meeting")
2. "event_date": Date string formatted as "YYYY-MM-DD". If relative (e.g. "tomorrow", "next Monday"), calculate the exact YYYY-MM-DD date based on today's date context.
3. "event_time": Time string (e.g., "10:00 AM", "02:30 PM", "Full Day")
4. "category": EXACTLY ONE of ["Exam/Assessment", "Placement Drive", "Hackathon Deadline", "Meeting", "General Academic"]
5. "target_audience": "@all", "d_section", "faculty", or target email.
6. "description": Brief 1-2 sentence description summarizing key instructions.

Output strictly as a raw JSON object:
{{
  "event_title": "...",
  "event_date": "YYYY-MM-DD",
  "event_time": "...",
  "category": "...",
  "target_audience": "...",
  "description": "..."
}}
Do NOT include markdown formatting or backticks."""

        try:
            res = self.llm.invoke([SystemMessage(content=prompt)])
            raw = res.content.strip().replace("```json", "").replace("```", "").strip()
            parsed = json.loads(raw)
            return parsed
        except Exception as e:
            logger.warning(f"[CalendarAgent NLP Error]: {e}")
            return None

    def process_incoming_interagent_message(self, message_record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes an inter-agent message, extracts event details, and updates PostgreSQL & SQLite databases.
        """
        subject = message_record.get("subject", "")
        content = message_record.get("content", "")
        sender_agent = message_record.get("sender_agent", "system")
        recipient = message_record.get("recipient_target", "@all")

        parsed = self.parse_event_with_nlp(subject, content)
        if not parsed or not parsed.get("event_title") or not parsed.get("event_date"):
            return {"status": "skipped", "reason": "No actionable date/event extracted"}

        event_title = parsed["event_title"]
        event_date = parsed["event_date"]
        event_time = parsed.get("event_time", "09:00 AM")
        category = parsed.get("category", "General Academic")
        description = parsed.get("description", content[:200])

        # 1. Update Central PostgreSQL Academic Events table
        try:
            from db import get_db_session, AcademicEvent
            with get_db_session() as db:
                existing = db.query(AcademicEvent).filter(
                    AcademicEvent.title == event_title,
                    AcademicEvent.date == event_date
                ).first()
                if not existing:
                    new_evt = AcademicEvent(
                        title=event_title,
                        date=event_date,
                        category=category,
                        department="CSE",
                        description=f"[{sender_agent.upper()}] {description} (Time: {event_time})",
                        status="Published",
                        created_by=sender_agent
                    )
                    db.add(new_evt)
                    db.commit()
                    logger.info(f"[CalendarAgent] Saved AcademicEvent '{event_title}' on {event_date} to central PostgreSQL DB")
        except Exception as pg_err:
            logger.error(f"[CalendarAgent Central DB Sync Error]: {pg_err}")

        # 2. Update Per-User SQLite Databases for target recipients
        synced_users_count = 0
        try:
            from db import get_db_session, get_user_db_session, PersonalEvent, DSectionStudent, FacultyAccount
            target_emails = []

            with get_db_session() as central_db:
                if recipient in ["@all", "all", "everyone"]:
                    students = central_db.query(DSectionStudent).all()
                    faculty = central_db.query(FacultyAccount).all()
                    target_emails = [s.email for s in students] + [f.email for f in faculty]
                elif recipient in ["d_section", "section_d"]:
                    students = central_db.query(DSectionStudent).all()
                    target_emails = [s.email for s in students]
                elif "@" in recipient:
                    target_emails = [recipient]

            for u_email in target_emails:
                try:
                    with get_user_db_session(u_email) as u_db:
                        ext = u_db.query(PersonalEvent).filter(
                            PersonalEvent.title == event_title,
                            PersonalEvent.date == event_date
                        ).first()
                        if not ext:
                            pe = PersonalEvent(
                                user_email=u_email,
                                title=event_title,
                                date=event_date,
                                time=event_time,
                                category=category,
                                status="active"
                            )
                            u_db.add(pe)
                            u_db.commit()
                            synced_users_count += 1
                except Exception as inner_err:
                    logger.error(f"[CalendarAgent User Sync Error for {u_email}]: {inner_err}")

            logger.info(f"[CalendarAgent] Synced event '{event_title}' to {synced_users_count} user calendars.")
        except Exception as usr_err:
            logger.error(f"[CalendarAgent User DB Sync Error]: {usr_err}")

        return {
            "status": "success",
            "extracted_event": parsed,
            "synced_users_count": synced_users_count
        }


class InterAgentMessageBus:
    """
    Central Inter-Agent Communication Hub.
    Allows specialized agents (Meeting, Placement, Hackathon, Faculty, etc.)
    to exchange internal messages and route them through Message Agent & Calendar Agent.
    """
    def __init__(self):
        self.message_history: List[Dict[str, Any]] = []
        self.calendar_agent = CalendarAgent()

    def publish_message(
        self,
        sender_agent: str,
        recipient_target: str,
        subject: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Publishes a message to the internal agent communication hub.
        Triggers Message Agent dispatch & Calendar Agent NLP extraction.
        """
        msg_id = f"iamg_{len(self.message_history) + 1}_{int(datetime.utcnow().timestamp())}"
        message_record = {
            "id": msg_id,
            "sender_agent": sender_agent,
            "recipient_target": recipient_target,
            "subject": subject,
            "content": content,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        self.message_history.append(message_record)
        logger.info(f"[AgentMessageBus] Published message {msg_id} from {sender_agent} -> {recipient_target}")

        # Auto-trigger CalendarAgent NLP processing on the new message
        calendar_result = self.calendar_agent.process_incoming_interagent_message(message_record)
        message_record["calendar_sync"] = calendar_result

        return message_record

    def get_messages(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.message_history[-limit:]


# Global Inter-Agent Message Bus Singleton
agent_message_bus = InterAgentMessageBus()
