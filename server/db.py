import os
import threading
from datetime import datetime
from typing import Dict, Any, Type
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean, DateTime, JSON
)
from sqlalchemy.orm import declarative_base, sessionmaker
from config import config
from services.time_utils import get_ist_now, get_ist_str

# SQLAlchemy Base
Base = declarative_base()

# Central Knowledge Registry Model
class KnowledgeRegistry(Base):
    __tablename__ = "knowledge_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    table_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    total_records = Column(Integer, default=0)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "table_name": self.table_name,
            "description": self.description,
            "total_records": self.total_records,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# D-Section Student Model (For backward compatibility)
class DSectionStudent(Base):
    __tablename__ = "d_section_students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    section = Column(String(50), default="Section D")
    year = Column(String(50), default="3rd Year")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "section": self.section,
            "year": self.year,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Faculty Account Model (For backward compatibility)
class FacultyAccount(Base):
    __tablename__ = "faculty_accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    designation = Column(String(100), default="Faculty Member")
    section = Column(String(50), default="All Sections")
    year = Column(String(50), default="All Years")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "designation": self.designation,
            "section": self.section,
            "year": self.year,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Unified User Model
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, index=True)  # student | faculty | placement_cell
    designation = Column(String(100), default="Member")
    section = Column(String(50), default="All Sections")
    year = Column(String(50), default="All Years")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_ist_now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "designation": self.designation,
            "section": self.section,
            "year": self.year,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# Personal Calendar Event Model (replaces personal_events table)
class PersonalEvent(Base):
    __tablename__ = "personal_calendar"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    date = Column(String(50), nullable=False, index=True)
    time = Column(String(100), nullable=False)
    category = Column(String(100), default="Personal Study")
    status = Column(String(100), default="Scheduled")
    created_at = Column(DateTime, default=get_ist_now)
    ist_date_time = Column(String(100), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_email": self.user_email,
            "title": self.title,
            "date": self.date,
            "time": self.time,
            "category": self.category,
            "status": self.status,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None,
            "ist_date_time": self.ist_date_time,
        }


# Academic Calendar Event Model (Shared Centrally, replaces academic_events table)
class AcademicEvent(Base):
    __tablename__ = "academic_calendar"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    date = Column(String(50), nullable=False, index=True) # resolved start date
    end_date = Column(String(50), nullable=True) # resolved end date (optional)
    day_name = Column(String(50), nullable=True) # e.g. "Mon", "Tue"
    category = Column(String(100), default="General Academic", index=True) # "Holiday", "Exam/CIA", "Placement", etc.
    department = Column(String(100), default="All Departments") # "CSE", "All Departments"
    semester = Column(String(100), default="All Years") # "II Year", "III Year", "All Years"
    description = Column(Text, nullable=True)
    visibility = Column(String(50), default="public") # "public", "faculty-only"
    status = Column(String(50), default="Published", index=True) # "Published", "Draft"
    version = Column(Integer, default=1)
    created_by = Column(String(255), nullable=True)
    updated_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "date": self.date,
            "end_date": self.end_date,
            "day_name": self.day_name,
            "category": self.category,
            "department": self.department,
            "semester": self.semester,
            "description": self.description,
            "visibility": self.visibility,
            "status": self.status,
            "version": self.version,
            "created_by": self.created_by,
            "updated_by": self.updated_by,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None,
            "updated_at_iso": self.updated_at.isoformat() if self.updated_at else None
        }


# Gmail-style Inbox Message Model (replaces messages table)
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_name = Column(String(255), nullable=False)
    sender_email = Column(String(255), nullable=False, index=True)
    recipient_email = Column(String(255), nullable=False, index=True) # for backwards compat
    sender_id = Column(String(255), nullable=True)
    recipient_ids = Column(Text, nullable=True) # comma separated emails
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    folder = Column(String(50), default="inbox", index=True)
    starred = Column(Boolean, default=False)
    unread = Column(Boolean, default=True)
    created_at = Column(DateTime, default=get_ist_now)
    ist_date_time = Column(String(100), nullable=True)
    delivery_status = Column(String(50), default="sent") # sent | failed
    read_status = Column(String(50), default="unread") # read | unread
    attachments = Column(JSON, nullable=True)
    email_log = Column(Text, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "sender_name": self.sender_name,
            "sender_email": self.sender_email,
            "recipient_email": self.recipient_email,
            "sender_id": self.sender_id or self.sender_email,
            "recipient_ids": self.recipient_ids or self.recipient_email,
            "subject": self.subject,
            "content": self.content,
            "folder": self.folder,
            "starred": self.starred,
            "unread": self.unread,
            "date": get_ist_str(self.created_at) if self.created_at else None,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None,
            "ist_date_time": self.ist_date_time,
            "delivery_status": self.delivery_status,
            "read_status": self.read_status,
            "attachments": self.attachments or [],
            "email_log": self.email_log
        }


# Central System Notifications Model
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient_email = Column(String(255), nullable=False, index=True)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=get_ist_now)
    ist_date_time = Column(String(100), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "recipient_email": self.recipient_email,
            "message": self.message,
            "is_read": self.is_read,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None,
            "ist_date_time": self.ist_date_time or get_ist_str(self.created_at)
        }


# Central Hackathons Registry Model
class Hackathon(Base):
    __tablename__ = "hackathons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    deadline = Column(String(100), nullable=False)
    apply_link = Column(String(512), nullable=True)
    external_link = Column(String(512), nullable=True)
    poster_url = Column(String(512), nullable=True)
    status = Column(String(50), default="Active", index=True) # Active | Closed
    created_at = Column(DateTime, default=get_ist_now)
    ist_date_time = Column(String(100), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "deadline": self.deadline,
            "apply_link": self.apply_link,
            "external_link": self.external_link,
            "poster_url": self.poster_url,
            "status": self.status,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None,
            "ist_date_time": self.ist_date_time or get_ist_str(self.created_at)
        }


# Central Placements Registry Model
class Placement(Base):
    __tablename__ = "placements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    deadline = Column(String(100), nullable=False)
    apply_link = Column(String(512), nullable=True)
    external_link = Column(String(512), nullable=True)
    poster_url = Column(String(512), nullable=True)
    status = Column(String(50), default="Active", index=True) # Active | Closed
    created_at = Column(DateTime, default=get_ist_now)
    ist_date_time = Column(String(100), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "description": self.description,
            "deadline": self.deadline,
            "apply_link": self.apply_link,
            "external_link": self.external_link,
            "poster_url": self.poster_url,
            "status": self.status,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None,
            "ist_date_time": self.ist_date_time or get_ist_str(self.created_at)
        }


# AI Memory Model (Dynamic Calendar Learning facts)
class AIMemory(Base):
    __tablename__ = "ai_memory"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(255), nullable=False, index=True)
    memory_key = Column(String(255), nullable=False)
    memory_value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_ist_now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_email": self.user_email,
            "memory_key": self.memory_key,
            "memory_value": self.memory_value,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None
        }


# Persistent Conversation History Model
class ConversationHistory(Base):
    __tablename__ = "conversation_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(255), nullable=False, index=True)
    session_id = Column(String(255), nullable=False, index=True)
    role = Column(String(50), nullable=False) # user | assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_ist_now)
    ist_date_time = Column(String(100), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_email": self.user_email,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None,
            "ist_date_time": self.ist_date_time or get_ist_str(self.created_at)
        }


# Speech to Text logs
class SpeechLog(Base):
    __tablename__ = "speech_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(255), nullable=False, index=True)
    converted_text = Column(Text, nullable=False)
    audio_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=get_ist_now)
    ist_date_time = Column(String(100), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_email": self.user_email,
            "converted_text": self.converted_text,
            "audio_metadata": self.audio_metadata,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None,
            "ist_date_time": self.ist_date_time or get_ist_str(self.created_at)
        }


# System Email Logs
class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, nullable=True)
    sender_email = Column(String(255), nullable=False, index=True)
    recipient_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    delivery_status = Column(String(50), default="Sent") # Sent | Failed
    log_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_ist_now)
    ist_date_time = Column(String(100), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "message_id": self.message_id,
            "sender_email": self.sender_email,
            "recipient_email": self.recipient_email,
            "subject": self.subject,
            "delivery_status": self.delivery_status,
            "log_details": self.log_details,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None,
            "ist_date_time": self.ist_date_time or get_ist_str(self.created_at)
        }


# Agent Activity Log Model for tracking agent execution and trajectories
class AgentActivityLog(Base):
    __tablename__ = "agent_activity_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_name = Column(String(100), nullable=False, index=True)
    user_email = Column(String(255), nullable=True, index=True)
    user_role = Column(String(50), nullable=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_ist_now)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "agent_name": self.agent_name,
            "user_email": self.user_email,
            "user_role": self.user_role,
            "query": self.query,
            "response": self.response,
            "created_at_iso": self.created_at.isoformat() if self.created_at else None
        }


# ─── Meeting Hub Models ───────────────────────────────────────────────────────

class Meeting(Base):
    """Central meeting record (stored in shared DB)."""
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    organizer_name = Column(String(255), nullable=False)
    organizer_email = Column(String(255), nullable=False, index=True)
    section = Column(String(100), nullable=True)          # e.g. "II CSE D"
    department = Column(String(100), default="CSE")
    meeting_date = Column(String(50), nullable=False, index=True)     # ISO date string
    meeting_time = Column(String(50), nullable=False)     # e.g. "10:00 AM"
    duration_mins = Column(Integer, default=60)
    join_code = Column(String(20), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="scheduled", index=True)      # scheduled | ongoing | ended | closed
    created_at = Column(DateTime, default=get_ist_now)
    updated_at = Column(DateTime, default=get_ist_now, onupdate=get_ist_now)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "organizer_name": self.organizer_name,
            "organizer_email": self.organizer_email,
            "section": self.section,
            "department": self.department,
            "meeting_date": self.meeting_date,
            "meeting_time": self.meeting_time,
            "duration_mins": self.duration_mins,
            "join_code": self.join_code,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MeetingParticipant(Base):
    """Per-user participation record (in central DB)."""
    __tablename__ = "meeting_participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, nullable=False, index=True)           # FK → meetings.id
    user_email = Column(String(255), nullable=False, index=True)
    user_name = Column(String(255), nullable=True)
    role = Column(String(50), default="participant")       # host | participant
    status = Column(String(50), default="invited")         # invited | accepted | declined | joined
    joined_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_ist_now)

    mic_on = Column(Boolean, default=True)
    cam_on = Column(Boolean, default=True)

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "user_email": self.user_email,
            "user_name": self.user_name,
            "role": self.role,
            "status": self.status,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
            "mic_on": self.mic_on,
            "cam_on": self.cam_on,
        }


class MeetingChat(Base):
    """In-meeting chat messages (in central DB)."""
    __tablename__ = "meeting_chat"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, nullable=False, index=True)
    sender_email = Column(String(255), nullable=False)
    sender_name = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_ist_now)

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "sender_email": self.sender_email,
            "sender_name": self.sender_name,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MeetingNotification(Base):
    """Notification record delivered to a user about a meeting."""
    __tablename__ = "meeting_notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, nullable=False)
    recipient_email = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_ist_now)

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "recipient_email": self.recipient_email,
            "message": self.message,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MeetingAttendance(Base):
    """Attendance log per user per meeting."""
    __tablename__ = "meeting_attendance"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, nullable=False)
    user_email = Column(String(255), nullable=False)
    user_name = Column(String(255), nullable=True)
    join_time = Column(DateTime, nullable=True)
    leave_time = Column(DateTime, nullable=True)
    duration_secs = Column(Integer, default=0)

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "user_email": self.user_email,
            "user_name": self.user_name,
            "join_time": self.join_time.isoformat() if self.join_time else None,
            "leave_time": self.leave_time.isoformat() if self.leave_time else None,
            "duration_secs": self.duration_secs,
        }


# Dynamic Sector Table Model Generator
_SECTOR_MODEL_CACHE: Dict[str, Type] = {}

def get_sector_model(table_name: str) -> Type:
    clean_name = table_name.lower().strip().replace("-", "_").replace(" ", "_")
    if clean_name in _SECTOR_MODEL_CACHE:
        return _SECTOR_MODEL_CACHE[clean_name]

    class_name = "".join(part.capitalize() for part in clean_name.split("_")) + "Model"

    def to_dict(self):
        return {
            "id": self.id,
            "section_title": self.section_title,
            "content": self.content,
            "metadata_json": self.metadata_json or {},
            "version": self.version,
            "is_active": self.is_active,
            "effective_date": self.effective_date.isoformat() if self.effective_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    attributes = {
        "__tablename__": clean_name,
        "__table_args__": {'extend_existing': True},
        "id": Column(Integer, primary_key=True, autoincrement=True),
        "section_title": Column(String(255), nullable=False),
        "content": Column(Text, nullable=False),
        "metadata_json": Column(JSON, nullable=True),
        "version": Column(Integer, default=1),
        "is_active": Column(Boolean, default=True),
        "effective_date": Column(DateTime, default=get_ist_now),
        "created_at": Column(DateTime, default=get_ist_now),
        "updated_at": Column(DateTime, default=get_ist_now, onupdate=get_ist_now),
        "to_dict": to_dict
    }

    model_cls = type(class_name, (Base,), attributes)
    _SECTOR_MODEL_CACHE[clean_name] = model_cls
    return model_cls


# Database Engine & Session Initialization
db_url = config.database_url

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

def create_robust_engine(target_url: str):
    kwargs = {"pool_pre_ping": True}
    if "sqlite" in target_url:
        kwargs["connect_args"] = {"check_same_thread": False}
    elif "localhost" not in target_url and "127.0.0.1" not in target_url:
        kwargs["connect_args"] = {"sslmode": "require"}

    eng = create_engine(target_url, **kwargs)
    try:
        with eng.connect():
            pass
        print(f"[DB Engine] Successfully connected to database: {target_url.split('@')[-1] if '@' in target_url else target_url}")
        return eng, target_url
    except Exception as err:
        print(f"\n⚠️  [DB Notice] Primary DB Connection Error ({target_url}): {err}")
        print("    If connecting to local PostgreSQL, ensure password is set in server/.env:")
        print("    DATABASE_URL=postgresql://postgres:<YOUR_PASSWORD>@localhost:5432/CSE_bot\n")
        
        if "sqlite" not in target_url:
            fallback_sqlite = "sqlite:///./cse_bot.db"
            print(f"🔄 [DB Fallback] Switching to local SQLite engine: '{fallback_sqlite}'...")
            fb_kwargs = {"pool_pre_ping": True, "connect_args": {"check_same_thread": False}}
            fb_eng = create_engine(fallback_sqlite, **fb_kwargs)
            return fb_eng, fallback_sqlite
        raise err

engine, active_db_url = create_robust_engine(db_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


from contextlib import contextmanager

def init_db():
    """
    Creates all tables defined in Base and applies self-healing schema migrations.
    Safe to call multiple times — never drops existing data.
    """
    Base.metadata.create_all(bind=engine)

    from sqlalchemy import text

    # ── Central DB self-healing migrations ─────────────────────────────────────
    # These ALTER TABLE statements are idempotent: they silently fail if the
    # column already exists, so it is safe to run on every startup.

    _safe_alter_columns(engine, "messages", [
        ("sender_id",       "VARCHAR(255)"),
        ("recipient_ids",   "TEXT"),
        ("ist_date_time",   "VARCHAR(100)"),
        ("delivery_status", "VARCHAR(50)  DEFAULT 'sent'"),
        ("read_status",     "VARCHAR(50)  DEFAULT 'unread'"),
        ("attachments",     "TEXT"),        # JSON stored as TEXT for broad compatibility
        ("email_log",       "TEXT"),
    ])

    _safe_alter_columns(engine, "notifications", [
        ("ist_date_time", "VARCHAR(100)"),
    ])

    _safe_alter_columns(engine, "email_logs", [
        ("ist_date_time", "VARCHAR(100)"),
    ])

    _safe_alter_columns(engine, "personal_calendar", [
        ("ist_date_time", "VARCHAR(100)"),
    ])

    _safe_alter_columns(engine, "meeting_participants", [
        ("mic_on", "BOOLEAN DEFAULT TRUE"),
        ("cam_on", "BOOLEAN DEFAULT TRUE"),
    ])


def _safe_alter_columns(eng, table_name: str, columns: list):
    """
    Safely adds missing columns to an existing table.
    Silently ignores errors (column already exists, table doesn't exist yet, etc.).
    Works for both PostgreSQL and SQLite.
    """
    from sqlalchemy import text
    for col_name, col_type in columns:
        try:
            with eng.begin() as conn:
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
        except Exception:
            pass  # Column already exists or table not yet created — safe to ignore


@contextmanager
def get_db_session():
    """Dependency helper to yield DB session as a context manager."""
    db = SessionLocal()
    try:
        db.execute(text("PRAGMA foreign_keys=ON")) if "sqlite" in active_db_url else None
        yield db
    finally:
        db.close()


# ==========================================================
# Dynamic Isolated User Database Manager
# ==========================================================

DATABASES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "databases")
if not os.path.exists(DATABASES_DIR):
    os.makedirs(DATABASES_DIR)

_USER_ENGINE_CACHE: Dict[str, Any] = {}
_USER_ENGINE_LOCK = threading.Lock()

def get_user_db_url(email: str) -> str:
    sanitized = "".join(c if c.isalnum() else "_" for c in email.strip().lower())
    db_path = os.path.join(DATABASES_DIR, f"{sanitized}.db")
    return f"sqlite:///{db_path}"

def get_user_engine(email: str):
    email_clean = email.strip().lower()
    with _USER_ENGINE_LOCK:
        if email_clean in _USER_ENGINE_CACHE:
            return _USER_ENGINE_CACHE[email_clean]

    url = get_user_db_url(email_clean)
    eng = create_engine(url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
    
    # Initialize necessary tables inside isolated user sqlite file
    PersonalEvent.__table__.create(bind=eng, checkfirst=True)
    Message.__table__.create(bind=eng, checkfirst=True)
    AcademicEvent.__table__.create(bind=eng, checkfirst=True)
    Notification.__table__.create(bind=eng, checkfirst=True)
    AIMemory.__table__.create(bind=eng, checkfirst=True)
    ConversationHistory.__table__.create(bind=eng, checkfirst=True)
    SpeechLog.__table__.create(bind=eng, checkfirst=True)
    
    # Self-healing migrations for user-level SQLite files
    from sqlalchemy import text
    try:
        with eng.begin() as conn:
            # message table migrations
            for col_name, col_type in [
                ("sender_id", "VARCHAR(255)"),
                ("recipient_ids", "TEXT"),
                ("ist_date_time", "VARCHAR(100)"),
                ("delivery_status", "VARCHAR(50) DEFAULT 'sent'"),
                ("read_status", "VARCHAR(50) DEFAULT 'unread'"),
                ("attachments", "JSON"),
                ("email_log", "TEXT")
            ]:
                try:
                    conn.execute(text(f"ALTER TABLE messages ADD COLUMN {col_name} {col_type}"))
                except Exception:
                    pass
            
            # personal event table migrations
            try:
                conn.execute(text("ALTER TABLE personal_calendar ADD COLUMN ist_date_time VARCHAR(100)"))
            except Exception:
                pass
    except Exception as mig_err:
        print(f"[SQLite Migration Notice] {mig_err}")
    
    # Seed default data if this is the first time creating suryaprakash's database
    if email_clean == "suryaprakash.s.d@csebot.edu":
        Session = sessionmaker(bind=eng)
        session = Session()
        try:
            if session.query(PersonalEvent).count() == 0:
                events = [
                    PersonalEvent(
                        user_email="suryaprakash.s.d@csebot.edu",
                        title="Compiler Design Deep Dive Study Session",
                        date="2026-08-02",
                        time="04:00 PM - 06:00 PM",
                        category="Personal Study",
                        status="Scheduled"
                    ),
                    PersonalEvent(
                        user_email="suryaprakash.s.d@csebot.edu",
                        title="Kubernetes Docker Container Lab Practice",
                        date="2026-08-05",
                        time="07:00 PM - 09:00 PM",
                        category="Lab Prep",
                        status="Scheduled"
                    ),
                    PersonalEvent(
                        user_email="suryaprakash.s.d@csebot.edu",
                        title="SIH 2026 Team Brainstorming Meeting",
                        date="2026-08-07",
                        time="05:00 PM - 06:30 PM",
                        category="Project",
                        status="Scheduled"
                    )
                ]
                session.add_all(events)
                session.commit()

            if session.query(Message).count() == 0:
                msgs = [
                    Message(
                        sender_name="Dr. R. Subha (HoD, CSE)",
                        sender_email="r.subha@hod.csebot.edu",
                        recipient_email="suryaprakash.s.d@csebot.edu",
                        subject="CAT-2 Examination Schedule & Practical Review Guidelines",
                        content="Dear Students of Section D,\n\nPlease find the official CAT-2 Examination timetable for Semester 6 starting next Monday. All practical lab evaluations will be completed before Friday. Ensure all record notebooks and GitHub repository links are submitted to your tutor.\n\nBest wishes,\nDr. R. Subha",
                        folder="inbox",
                        starred=True,
                        unread=True
                    ),
                    Message(
                        sender_name="Dr. S. Yuvaraj (Assistant Professor)",
                        sender_email="s.yuvaraj@faculty.csebot.edu",
                        recipient_email="suryaprakash.s.d@csebot.edu",
                        subject="Cloud Computing & DevOps Lab Assignment 3 Verification",
                        content="Hi Suryaprakash,\n\nYour Kubernetes deployment YAML manifests have been verified. Excellent work on containerizing the microservice architecture.\n\nBest,\nDr. S. Yuvaraj",
                        folder="inbox",
                        starred=False,
                        unread=False
                    ),
                    Message(
                        sender_name="Suryaprakash S (STUDENT)",
                        sender_email="suryaprakash.s.d@csebot.edu",
                        recipient_email="s.yuvaraj@faculty.csebot.edu",
                        subject="Lab Assignment 3 Kubernetes Deployment Submission",
                        content="Respected Sir,\n\nI have submitted Assignment 3 on Kubernetes Pod Deployment and Docker Containerization to the student portal.\n\nThank you,\nSuryaprakash S",
                        folder="sent",
                        starred=False,
                        unread=False
                    ),
                    Message(
                        sender_name="Dr. R. Subha (HoD, CSE)",
                        sender_email="r.subha@hod.csebot.edu",
                        recipient_email="@all",
                        subject="Smart India Hackathon 2026 Internal Nominations are Open!",
                        content="Dear Students & Faculty,\n\nThe internal registrations and ideas review for the Smart India Hackathon (SIH) 2026 are officially open. Teams must consist of 6 students with at least one female member. Submit your proposals by August 10, 2026.\n\nRegards,\nCSE Department CAB Coordinator",
                        folder="inbox",
                        starred=True,
                        unread=True
                    ),
                    Message(
                        sender_name="CSE Placement Cell",
                        sender_email="placements@csebot.edu",
                        recipient_email="suryaprakash.s.d@csebot.edu",
                        subject="Urgent: Cybersecurity Workshop Enrollment Guidelines",
                        content="Hi Suryaprakash,\n\nThis is a reminder that the enrollment for the Cybersecurity Workshop ends today. The hands-on training will be conducted in the security CoE lab on 20 July.\n\nRegards,\nPlacement Officer",
                        folder="inbox",
                        starred=False,
                        unread=False,
                        created_at=datetime(2026, 7, 20, 10, 30, 0)
                    )
                ]
                session.add_all(msgs)
                session.commit()
        except Exception as ex:
            session.rollback()
            print(f"[Dynamic Seeding Warn] {ex}")
        finally:
            session.close()

    with _USER_ENGINE_LOCK:
        _USER_ENGINE_CACHE[email_clean] = eng
    return eng

@contextmanager
def get_user_db_session(email: str):
    eng = get_user_engine(email)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    session = Session()
    try:
        yield session
    finally:
        session.close()
