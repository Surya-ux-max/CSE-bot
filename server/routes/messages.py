"""
routes/messages.py
Gmail-style Message Hub endpoints: compose, inbox, send, draft, star, folder, delete,
AI message agent, AI filter search, notifications, and mark-as-read.
"""
import json
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(tags=["Messages"])


# ==========================================================
# Pydantic Request Models
# ==========================================================

class MessageCreateRequest(BaseModel):
    sender_name: str
    sender_email: str
    recipient_email: str
    subject: str
    content: str
    folder: str
    starred: Optional[bool] = False
    unread: Optional[bool] = True


class MessageFolderUpdateRequest(BaseModel):
    folder: str


class MessageFilterRequest(BaseModel):
    email: str
    query: str


class MessageAgentRequest(BaseModel):
    email: str
    role: str
    prompt: str


# ==========================================================
# Permission Validation (DB-based, not email-heuristic)
# ==========================================================

def verify_message_permissions(sender_email: str, recipient_email: str):
    """
    Enforce RBAC messaging rules using DB-sourced roles:
      - student  → can only email other students
      - faculty  → can email students and other faculty (not placement_cell)
      - placement_cell → can email anyone
    Role is sourced from the DB `users` table first, then falls back to
    the `d_section_students` / `faculty_accounts` tables.
    """
    from db import get_db_session, User, DSectionStudent, FacultyAccount

    sender_clean = sender_email.strip().lower()
    recipient_clean = recipient_email.strip().lower()

    # Drafts and empty recipients are always allowed
    if recipient_clean in ("draft@sece.ac.in", "") or not recipient_clean:
        return

    with get_db_session() as db:
        # ── Resolve sender role ──────────────────────────────────────────
        sender_role = _resolve_role(db, sender_clean, User, DSectionStudent, FacultyAccount)

        # ── Resolve recipient role ───────────────────────────────────────
        if recipient_clean in ("@all", "@faculty", "@students"):
            recipient_role = "group"
        else:
            recipient_role = _resolve_role(db, recipient_clean, User, DSectionStudent, FacultyAccount)

        # ── Enforce rules ────────────────────────────────────────────────
        if sender_role == "student":
            if recipient_role == "group":
                raise HTTPException(
                    status_code=403,
                    detail="Security Access Denied: Students are not authorized to email groups or @all."
                )
            if recipient_role != "student":
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"Security Access Denied: Students can only email other Students. "
                        f"'{recipient_clean}' is a {recipient_role.replace('_', ' ')}."
                    )
                )

        elif sender_role == "faculty":
            if recipient_role == "placement_cell":
                raise HTTPException(
                    status_code=403,
                    detail="Security Access Denied: Faculty members are not authorized to email the Placement Cell directly."
                )

        # placement_cell: unrestricted


def _resolve_role(db, email: str, User, DSectionStudent, FacultyAccount) -> str:
    """
    Resolve a user's role from DB tables.
    Priority: users table → d_section_students → faculty_accounts.
    """
    user_record = db.query(User).filter(User.email == email).first()
    if user_record:
        return user_record.role.lower()

    if db.query(DSectionStudent).filter(DSectionStudent.email.ilike(email)).first():
        return "student"

    faculty_record = db.query(FacultyAccount).filter(FacultyAccount.email.ilike(email)).first()
    if faculty_record:
        # Placement cell faculty identified by email domain prefix
        if email.startswith("placements@") or "placement" in email:
            return "placement_cell"
        return "faculty"

    # Final fallback based on email address patterns (lowest priority)
    if "placement" in email:
        return "placement_cell"
    if "faculty" in email or "hod" in email or "prof" in email:
        return "faculty"
    return "student"


# ==========================================================
# AI Message Agent
# ==========================================================

@router.post("/messages/agent")
def process_message_agent_command(payload: MessageAgentRequest):
    from db import get_user_db_session, get_db_session, Message, DSectionStudent, FacultyAccount, EmailLog, Notification
    from langchain_core.messages import SystemMessage
    from config import config
    from services.time_utils import get_ist_now, get_ist_str

    sender_email = payload.email.strip().lower()
    sender_role = payload.role.strip().lower()
    user_prompt = payload.prompt.strip()

    # 1. Fetch sender identity from central DB
    sender_name = "User"
    with get_db_session() as central_db:
        student = central_db.query(DSectionStudent).filter(DSectionStudent.email.ilike(sender_email)).first()
        if student:
            sender_name = student.name
        else:
            faculty = central_db.query(FacultyAccount).filter(FacultyAccount.email.ilike(sender_email)).first()
            if faculty:
                sender_name = faculty.name

    # 2. LLM parses intent → action/recipient/subject/content
    from services.prompt_loader import render_prompt
    copilot_prompt = render_prompt(
        "mail_agent",
        sender_name=sender_name,
        sender_email=sender_email,
        sender_role=sender_role,
        user_prompt=user_prompt
    )

    try:
        res = config.llm.invoke([SystemMessage(content=copilot_prompt)])
        raw = res.content.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)

        action = parsed.get("action", "compose")
        recipient = parsed.get("recipient", "").strip().lower()
        subject = parsed.get("subject", "Official Notification").strip()
        content = parsed.get("content", "").strip()
        explanation = parsed.get("explanation", "").strip()

        created_message = None

        if action == "send":
            # RBAC permission check (DB-based, not heuristic)
            try:
                verify_message_permissions(sender_email, recipient or "@all")
            except HTTPException as perm_err:
                return {
                    "status": "error",
                    "action": "compose",
                    "recipient": recipient,
                    "subject": subject,
                    "content": content,
                    "explanation": f"Security Policy Block: {perm_err.detail}",
                    "message": None
                }

            ist_now = get_ist_now()
            ist_now_str = get_ist_str(ist_now)

            # Sent copy in sender's DB
            with get_user_db_session(sender_email) as db:
                sent_msg = Message(
                    sender_name=f"{sender_name} ({sender_role.upper()})",
                    sender_email=sender_email,
                    recipient_email=recipient or "@all",
                    subject=subject,
                    content=content,
                    folder="sent",
                    starred=False,
                    unread=False,
                    created_at=ist_now,
                    ist_date_time=ist_now_str,
                    sender_id=sender_email,
                    recipient_ids=recipient or "@all",
                    delivery_status="sent",
                    read_status="read"
                )
                db.add(sent_msg)
                db.commit()
                db.refresh(sent_msg)
                created_message = sent_msg.to_dict()

            # Central email log
            with get_db_session() as central_db:
                email_log = EmailLog(
                    message_id=created_message["id"],
                    sender_email=sender_email,
                    recipient_email=recipient or "@all",
                    subject=subject,
                    delivery_status="Sent",
                    log_details=f"Securely delivered via AI Message Agent to {recipient or '@all'}",
                    created_at=ist_now,
                    ist_date_time=ist_now_str
                )
                central_db.add(email_log)
                central_db.commit()

            # Inbox copy for recipient / broadcast to central
            if recipient == "@all":
                with get_db_session() as db:
                    broadcast_msg = Message(
                        sender_name=f"{sender_name} ({sender_role.upper()})",
                        sender_email=sender_email,
                        recipient_email="@all",
                        subject=subject,
                        content=content,
                        folder="inbox",
                        starred=False,
                        unread=True,
                        created_at=ist_now,
                        ist_date_time=ist_now_str,
                        sender_id=sender_email,
                        recipient_ids="@all",
                        delivery_status="sent",
                        read_status="unread"
                    )
                    db.add(broadcast_msg)
                    db.commit()
            elif recipient:
                with get_user_db_session(recipient) as db:
                    inbox_msg = Message(
                        sender_name=f"{sender_name} ({sender_role.upper()})",
                        sender_email=sender_email,
                        recipient_email=recipient,
                        subject=subject,
                        content=content,
                        folder="inbox",
                        starred=False,
                        unread=True,
                        created_at=ist_now,
                        ist_date_time=ist_now_str,
                        sender_id=sender_email,
                        recipient_ids=recipient,
                        delivery_status="sent",
                        read_status="unread"
                    )
                    db.add(inbox_msg)
                    db.commit()

                    notif = Notification(
                        recipient_email=recipient,
                        message=f"New AI-dispatched message from {sender_name}: '{subject}'",
                        created_at=ist_now,
                        ist_date_time=ist_now_str
                    )
                    db.add(notif)
                    db.commit()

        elif action == "draft":
            ist_now = get_ist_now()
            ist_now_str = get_ist_str(ist_now)

            with get_user_db_session(sender_email) as db:
                draft_msg = Message(
                    sender_name=sender_name,
                    sender_email=sender_email,
                    recipient_email=recipient or "draft@sece.ac.in",
                    subject=subject,
                    content=content,
                    folder="drafts",
                    starred=False,
                    unread=False,
                    created_at=ist_now,
                    ist_date_time=ist_now_str,
                    sender_id=sender_email,
                    recipient_ids=recipient or "draft@sece.ac.in",
                    delivery_status="sent",
                    read_status="read"
                )
                db.add(draft_msg)
                db.commit()
                db.refresh(draft_msg)
                created_message = draft_msg.to_dict()

        # Publish to InterAgentMessageBus
        try:
            from services.agent_message_bus import agent_message_bus
            agent_message_bus.publish_message(
                sender_agent="message_agent",
                recipient_target=recipient or "@all",
                subject=subject,
                content=content,
                metadata={"action": action, "sender_email": sender_email}
            )
        except Exception as bus_err:
            print(f"[AgentMessageBus Publish Error]: {bus_err}")

        return {
            "status": "success",
            "action": action,
            "recipient": recipient,
            "subject": subject,
            "content": content,
            "explanation": explanation,
            "message": created_message
        }

    except Exception as e:
        print(f"[Message Agent Error] {e}")
        return {
            "status": "error",
            "action": "compose",
            "recipient": "",
            "subject": "AI Draft",
            "content": f"Failed to parse copilot command: {e}. Prompt was: {user_prompt}",
            "explanation": "I couldn't process that command automatically, but here is a basic draft structure.",
            "message": None
        }


# ==========================================================
# GET /messages — Private + Broadcast Merge
# ==========================================================

@router.get("/messages")
def get_user_messages(
    email: str,
    limit: Optional[int] = Query(None),
    offset: Optional[int] = Query(0)
):
    from db import get_user_db_session, get_db_session, Message
    email_clean = email.strip().lower()

    with get_user_db_session(email_clean) as db:
        private_msgs = db.query(Message).all()
        local_broadcast_states = {
            (m.sender_email, m.subject): m
            for m in private_msgs if m.recipient_email == "@all"
        }

    with get_db_session() as central_db:
        broadcast_msgs = central_db.query(Message).filter(
            Message.recipient_email == "@all"
        ).all()

    all_msgs = {}
    for m in private_msgs:
        if m.folder == "deleted":
            continue
        all_msgs[str(m.id)] = m.to_dict()

    for m in broadcast_msgs:
        key = (m.sender_email, m.subject)
        if key in local_broadcast_states:
            continue
        all_msgs[f"broadcast_{m.id}"] = {**m.to_dict(), "id": f"broadcast_{m.id}"}

    sorted_list = sorted(all_msgs.values(), key=lambda x: x.get("created_at_iso") or "", reverse=True)
    if limit is not None and limit > 0:
        start = max(0, offset or 0)
        return sorted_list[start : start + limit]
    return sorted_list


# ==========================================================
# POST /messages — Compose / Send
# ==========================================================

@router.post("/messages")
def compose_message(payload: MessageCreateRequest):
    from db import get_user_db_session, get_db_session, Message, EmailLog, Notification
    from services.time_utils import get_ist_now, get_ist_str

    sender = payload.sender_email.strip().lower()
    recipient = payload.recipient_email.strip().lower()
    folder = payload.folder.strip().lower()

    # Enforce RBAC on send
    if folder in ("inbox", "sent"):
        verify_message_permissions(sender, recipient)

    ist_now = get_ist_now()
    ist_now_str = get_ist_str(ist_now)

    def make_msg_obj():
        return Message(
            sender_name=payload.sender_name.strip(),
            sender_email=sender,
            recipient_email=recipient,
            subject=payload.subject.strip(),
            content=payload.content,
            folder=folder,
            starred=payload.starred if payload.starred is not None else False,
            unread=payload.unread if payload.unread is not None else True,
            created_at=ist_now,
            ist_date_time=ist_now_str,
            sender_id=sender,
            recipient_ids=recipient,
            delivery_status="sent",
            read_status="unread" if payload.unread else "read"
        )

    if folder == "sent":
        with get_user_db_session(sender) as db:
            new_msg = make_msg_obj()
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)

            with get_db_session() as central_db:
                email_log = EmailLog(
                    message_id=new_msg.id,
                    sender_email=sender,
                    recipient_email=recipient,
                    subject=payload.subject.strip(),
                    delivery_status="Sent",
                    log_details=f"Securely delivered via Message Hub to {recipient}",
                    created_at=ist_now,
                    ist_date_time=ist_now_str
                )
                central_db.add(email_log)
                central_db.commit()

            return new_msg.to_dict()
    else:
        if recipient == "@all":
            with get_db_session() as db:
                new_msg = make_msg_obj()
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                return new_msg.to_dict()
        else:
            target_db_email = sender if folder == "drafts" else recipient
            with get_user_db_session(target_db_email) as db:
                new_msg = make_msg_obj()
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)

                if folder == "inbox":
                    notif = Notification(
                        recipient_email=recipient,
                        message=f"New message from {payload.sender_name}: '{payload.subject.strip()}'",
                        created_at=ist_now,
                        ist_date_time=ist_now_str
                    )
                    db.add(notif)
                    db.commit()

                return new_msg.to_dict()


# ==========================================================
# POST /messages/{id}/read — Mark as Read (MISSING ENDPOINT — now added)
# ==========================================================

@router.post("/messages/{msg_id}/read")
def mark_message_read(msg_id: str, email: str):
    """Mark a message as read (update unread=False and read_status='read')."""
    from db import get_user_db_session, get_db_session, Message
    email_clean = email.strip().lower()

    if msg_id.startswith("broadcast_"):
        real_id = int(msg_id.replace("broadcast_", ""))
        with get_db_session() as central_db:
            b_msg = central_db.query(Message).filter(Message.id == real_id).first()
            if not b_msg:
                raise HTTPException(status_code=404, detail="Broadcast message not found")
            b_dict = b_msg.to_dict()

        with get_user_db_session(email_clean) as db:
            existing = db.query(Message).filter(
                Message.subject == b_dict["subject"],
                Message.sender_email == b_dict["sender_email"],
                Message.recipient_email == "@all"
            ).first()
            if existing:
                existing.unread = False
                existing.read_status = "read"
                db.commit()
                db.refresh(existing)
                return existing.to_dict()
            else:
                # Create a personal copy with read state
                from services.time_utils import get_ist_now, get_ist_str
                ist_now = get_ist_now()
                new_copy = Message(
                    sender_name=b_dict["sender_name"],
                    sender_email=b_dict["sender_email"],
                    recipient_email="@all",
                    subject=b_dict["subject"],
                    content=b_dict["content"],
                    folder="inbox",
                    starred=False,
                    unread=False,
                    read_status="read",
                    created_at=ist_now,
                    ist_date_time=get_ist_str(ist_now),
                    sender_id=b_dict["sender_email"],
                    recipient_ids="@all",
                    delivery_status="sent"
                )
                db.add(new_copy)
                db.commit()
                db.refresh(new_copy)
                return new_copy.to_dict()
    else:
        with get_user_db_session(email_clean) as db:
            msg = db.query(Message).filter(Message.id == int(msg_id)).first()
            if not msg:
                raise HTTPException(status_code=404, detail="Message not found")
            msg.unread = False
            msg.read_status = "read"
            db.commit()
            db.refresh(msg)
            return msg.to_dict()


# ==========================================================
# POST /messages/{id}/star — Toggle Star
# ==========================================================

@router.post("/messages/{msg_id}/star")
def toggle_message_star(msg_id: str, email: str):
    from db import get_user_db_session, get_db_session, Message
    from services.time_utils import get_ist_now, get_ist_str
    email_clean = email.strip().lower()

    if msg_id.startswith("broadcast_"):
        real_id = int(msg_id.replace("broadcast_", ""))
        with get_db_session() as central_db:
            b_msg = central_db.query(Message).filter(Message.id == real_id).first()
            if not b_msg:
                raise HTTPException(status_code=404, detail="Broadcast message not found")
            b_dict = b_msg.to_dict()

        with get_user_db_session(email_clean) as db:
            existing = db.query(Message).filter(
                Message.subject == b_dict["subject"],
                Message.sender_email == b_dict["sender_email"],
                Message.recipient_email == "@all"
            ).first()
            if existing:
                existing.starred = not existing.starred
                db.commit()
                db.refresh(existing)
                return existing.to_dict()
            else:
                ist_now = get_ist_now()
                new_copy = Message(
                    sender_name=b_dict["sender_name"],
                    sender_email=b_dict["sender_email"],
                    recipient_email="@all",
                    subject=b_dict["subject"],
                    content=b_dict["content"],
                    folder="inbox",
                    starred=True,
                    unread=False,
                    read_status="read",
                    created_at=ist_now,
                    ist_date_time=get_ist_str(ist_now),
                    sender_id=b_dict["sender_email"],
                    recipient_ids="@all",
                    delivery_status="sent"
                )
                db.add(new_copy)
                db.commit()
                db.refresh(new_copy)
                return new_copy.to_dict()
    else:
        with get_user_db_session(email_clean) as db:
            msg = db.query(Message).filter(Message.id == int(msg_id)).first()
            if not msg:
                raise HTTPException(status_code=404, detail="Message not found")
            msg.starred = not msg.starred
            db.commit()
            db.refresh(msg)
            return msg.to_dict()


# ==========================================================
# POST /messages/{id}/folder — Move to Folder
# ==========================================================

@router.post("/messages/{msg_id}/folder")
def change_message_folder(msg_id: str, payload: MessageFolderUpdateRequest, email: str):
    from db import get_user_db_session, get_db_session, Message
    from services.time_utils import get_ist_now, get_ist_str
    email_clean = email.strip().lower()
    target_folder = payload.folder.strip().lower()

    if msg_id.startswith("broadcast_"):
        real_id = int(msg_id.replace("broadcast_", ""))
        with get_db_session() as central_db:
            b_msg = central_db.query(Message).filter(Message.id == real_id).first()
            if not b_msg:
                raise HTTPException(status_code=404, detail="Broadcast message not found")
            b_dict = b_msg.to_dict()

        with get_user_db_session(email_clean) as db:
            existing = db.query(Message).filter(
                Message.subject == b_dict["subject"],
                Message.sender_email == b_dict["sender_email"],
                Message.recipient_email == "@all"
            ).first()
            if existing:
                existing.folder = target_folder
                db.commit()
                db.refresh(existing)
                return existing.to_dict()
            else:
                ist_now = get_ist_now()
                new_copy = Message(
                    sender_name=b_dict["sender_name"],
                    sender_email=b_dict["sender_email"],
                    recipient_email="@all",
                    subject=b_dict["subject"],
                    content=b_dict["content"],
                    folder=target_folder,
                    starred=False,
                    unread=False,
                    read_status="read",
                    created_at=ist_now,
                    ist_date_time=get_ist_str(ist_now),
                    sender_id=b_dict["sender_email"],
                    recipient_ids="@all",
                    delivery_status="sent"
                )
                db.add(new_copy)
                db.commit()
                db.refresh(new_copy)
                return new_copy.to_dict()
    else:
        with get_user_db_session(email_clean) as db:
            msg = db.query(Message).filter(Message.id == int(msg_id)).first()
            if not msg:
                raise HTTPException(status_code=404, detail="Message not found")
            msg.folder = target_folder
            db.commit()
            db.refresh(msg)
            return msg.to_dict()


# ==========================================================
# DELETE /messages/{id} — Permanent Delete / Soft Hide Broadcast
# ==========================================================

@router.delete("/messages/{msg_id}")
def delete_message_permanently(msg_id: str, email: str):
    from db import get_user_db_session, get_db_session, Message
    from services.time_utils import get_ist_now, get_ist_str
    email_clean = email.strip().lower()

    if msg_id.startswith("broadcast_"):
        with get_user_db_session(email_clean) as db:
            with get_db_session() as central_db:
                b_msg = central_db.query(Message).filter(
                    Message.id == int(msg_id.replace("broadcast_", ""))
                ).first()
                if b_msg:
                    b_dict = b_msg.to_dict()
                    existing = db.query(Message).filter(
                        Message.subject == b_dict["subject"],
                        Message.sender_email == b_dict["sender_email"],
                        Message.recipient_email == "@all"
                    ).first()
                    if existing:
                        existing.folder = "deleted"
                        db.commit()
                    else:
                        ist_now = get_ist_now()
                        new_copy = Message(
                            sender_name=b_dict["sender_name"],
                            sender_email=b_dict["sender_email"],
                            recipient_email="@all",
                            subject=b_dict["subject"],
                            content=b_dict["content"],
                            folder="deleted",
                            starred=False,
                            unread=False,
                            read_status="read",
                            created_at=ist_now,
                            ist_date_time=get_ist_str(ist_now),
                            sender_id=b_dict["sender_email"],
                            recipient_ids="@all",
                            delivery_status="sent"
                        )
                        db.add(new_copy)
                        db.commit()
        return {"status": "success", "message": f"Broadcast {msg_id} permanently hidden"}
    else:
        with get_user_db_session(email_clean) as db:
            msg = db.query(Message).filter(Message.id == int(msg_id)).first()
            if not msg:
                raise HTTPException(status_code=404, detail="Message not found")
            db.delete(msg)
            db.commit()
            return {"status": "success", "message": f"Message {msg_id} permanently deleted"}


# ==========================================================
# POST /messages/filter — AI-Powered Search
# ==========================================================

@router.post("/messages/filter")
def filter_messages(payload: MessageFilterRequest):
    from db import get_user_db_session, get_db_session, Message
    from langchain_core.messages import SystemMessage
    from config import config
    import re
    from services.time_utils import get_ist_now

    email_clean = payload.email.strip().lower()
    user_query = payload.query.strip()

    # Fetch all messages (private + broadcast)
    with get_user_db_session(email_clean) as db:
        private_msgs = db.query(Message).all()
        local_broadcast_states = {
            (m.sender_email, m.subject): m
            for m in private_msgs if m.recipient_email == "@all"
        }

    with get_db_session() as central_db:
        broadcast_msgs = central_db.query(Message).filter(
            Message.recipient_email == "@all"
        ).all()

    all_msgs = []
    for m in private_msgs:
        if m.folder not in ("deleted", "trash"):
            all_msgs.append(m)
    for m in broadcast_msgs:
        key = (m.sender_email, m.subject)
        if key not in local_broadcast_states:
            all_msgs.append(m)

    if not all_msgs:
        return []

    # Use dynamic current date instead of hardcoded one
    today_str = get_ist_now().strftime("%Y-%m-%d")

    msg_data = [{
        "id": m.id,
        "sender_name": m.sender_name,
        "sender_email": m.sender_email,
        "recipient_email": m.recipient_email,
        "subject": m.subject,
        "content": m.content[:200],
        "date": m.created_at.strftime("%b %d, %Y") if m.created_at else None
    } for m in all_msgs]

    filter_prompt = f"""You are the CSE-bot AI Filter Agent for Message Hub.
    Your task is to filter the list of email messages based on the user's search query.

    USER FILTER QUERY: "{user_query}"
    TODAY'S DATE: {today_str}

    MESSAGES LIST (JSON format):
    {json.dumps(msg_data, indent=2)}

    Instructions:
    1. Determine which message IDs match the search query.
    2. The user query can filter by sender name, sender email, recipient email, subject, body content keywords, OR dates.
    3. Output ONLY a JSON array of matching message IDs.
    4. Do NOT output markdown blocks, explanation text, or anything else besides the raw JSON list of IDs.
    """

    try:
        llm_res = config.llm.invoke([SystemMessage(content=filter_prompt)])
        raw = llm_res.content.strip().replace("```json", "").replace("```", "").strip()
        matching_ids = json.loads(raw)
        if isinstance(matching_ids, list):
            filtered = []
            for m in all_msgs:
                if (m.id in matching_ids or
                        f"broadcast_{m.id}" in matching_ids or
                        str(m.id) in [str(x) for x in matching_ids]):
                    filtered.append(m.to_dict())
            return filtered
    except Exception as e:
        print(f"[Filter Agent Error] Failed to parse: {e}")

    # Fallback: keyword matching with date parsing
    q = user_query.lower()
    month_names = {
        "january": 1, "jan": 1, "february": 2, "feb": 2, "march": 3, "mar": 3,
        "april": 4, "apr": 4, "may": 5, "june": 6, "jun": 6, "july": 7, "jul": 7,
        "august": 8, "aug": 8, "september": 9, "sep": 9, "sept": 9,
        "october": 10, "oct": 10, "november": 11, "nov": 11, "december": 12, "dec": 12
    }
    query_month = next((m_num for name, m_num in month_names.items() if name in q), None)
    digits = [int(s) for s in re.findall(r'\b\d+\b', q)]

    filtered = []
    for m in all_msgs:
        is_date_match = False
        if m.created_at:
            m_day = m.created_at.day
            m_month = m.created_at.month
            if query_month and digits:
                is_date_match = (m_month == query_month and any(d == m_day for d in digits))
            elif query_month:
                is_date_match = (m_month == query_month)
            elif digits:
                is_date_match = any(d == m_day for d in digits)

        if (q in m.sender_name.lower() or q in m.sender_email.lower() or
                q in m.recipient_email.lower() or q in m.subject.lower() or
                q in m.content.lower() or is_date_match):
            filtered.append(m.to_dict())

    return filtered


# ==========================================================
# GET /notifications — Fetch User Notifications (MISSING ENDPOINT — now added)
# ==========================================================

@router.get("/notifications")
def get_user_notifications(email: str):
    """Fetch all notifications for a user, newest first."""
    from db import get_user_db_session, Notification
    email_clean = email.strip().lower()
    with get_user_db_session(email_clean) as db:
        notifs = db.query(Notification).order_by(Notification.created_at.desc()).all()
        return [n.to_dict() for n in notifs]


@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, email: str):
    """Mark a notification as read."""
    from db import get_user_db_session, Notification
    email_clean = email.strip().lower()
    with get_user_db_session(email_clean) as db:
        notif = db.query(Notification).filter(Notification.id == notif_id).first()
        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")
        notif.is_read = True
        db.commit()
        db.refresh(notif)
        return notif.to_dict()
