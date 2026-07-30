"""
routes/meetings.py
Meeting Hub endpoints: AI agent scheduling, join, chat, participants, status, AV controls.
Bug Fix B6: MeetingAttendance join/leave times now use IST (get_ist_now()) instead of dt.utcnow().
"""
import json
import random
import re
import string
from datetime import datetime as dt, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from db import (
    Meeting, MeetingParticipant, MeetingChat,
    MeetingNotification, MeetingAttendance,
    DSectionStudent, FacultyAccount,
    Message, PersonalEvent,
    get_db_session, get_user_db_session, init_db
)

router = APIRouter(tags=["Meetings"])


# ==========================================================
# Pydantic Request Models
# ==========================================================

class MeetingAgentRequest(BaseModel):
    email: str
    role: str
    prompt: str


class MeetingJoinRequest(BaseModel):
    email: str
    name: str
    join_code: str


class MeetingChatRequest(BaseModel):
    meeting_id: int
    sender_email: str
    sender_name: str
    message: str


class MeetingStatusRequest(BaseModel):
    meeting_id: int
    status: str  # scheduled | ongoing | ended


class MeetingLeaveRequest(BaseModel):
    meeting_id: int
    user_email: str


class MeetingAVUpdateRequest(BaseModel):
    meeting_id: int
    user_email: str
    mic_on: bool
    cam_on: bool


class MeetingHostControlRequest(BaseModel):
    meeting_id: int
    host_email: str
    target_email: str
    action: str  # mute | kick


class DeleteClosedMeetingsRequest(BaseModel):
    email: str


class SimulateAttendeesRequest(BaseModel):
    meeting_id: int


# ==========================================================
# Internal Helpers
# ==========================================================

def _generate_join_code(length=8) -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


def _resolve_meeting_participants(target_hint: str) -> list:
    """
    Resolve a meeting target name/section/email/alias into a list of {name, email} dicts.
    Supported: section names, @all, specific emails, specific names.
    """
    hint = target_hint.lower().strip()
    results = []

    with get_db_session() as db:
        if any(k in hint for k in ["@all", "all students", "all", "everyone", "all staff"]):
            for s in db.query(DSectionStudent).all():
                results.append({"name": s.name, "email": s.email})
            for f in db.query(FacultyAccount).all():
                results.append({"name": f.name, "email": f.email})
        elif any(k in hint for k in ["d section", "section d", "cse d", "ii cse", "class"]):
            for s in db.query(DSectionStudent).all():
                results.append({"name": s.name, "email": s.email})
        elif "@" in hint:
            student = db.query(DSectionStudent).filter(DSectionStudent.email.ilike(hint)).first()
            if student:
                return [{"name": student.name, "email": student.email}]
            faculty = db.query(FacultyAccount).filter(FacultyAccount.email.ilike(hint)).first()
            if faculty:
                return [{"name": faculty.name, "email": faculty.email}]
            name = hint.split("@")[0].replace(".", " ").title()
            return [{"name": name, "email": hint}]
        else:
            for s in db.query(DSectionStudent).all():
                if hint in s.name.lower() or hint in s.email.lower():
                    results.append({"name": s.name, "email": s.email})
            for f in db.query(FacultyAccount).all():
                if hint in f.name.lower() or hint in f.email.lower():
                    results.append({"name": f.name, "email": f.email})

    # De-duplicate
    seen = set()
    unique = []
    for r in results:
        if r["email"].lower() not in seen:
            seen.add(r["email"].lower())
            unique.append(r)
    return unique


def _notify_participant(meeting: Meeting, recipient_name: str, recipient_email: str, organizer_name: str):
    """
    Write a meeting invitation into the recipient's user DB and create notification.
    Uses IST timestamps (get_ist_now()).
    """
    from db import get_user_db_session, Message, PersonalEvent, Notification
    from services.time_utils import get_ist_now, get_ist_str
    try:
        ist_now = get_ist_now()
        ist_now_str = get_ist_str(ist_now)

        notification_msg = (
            f"📅 You have been invited to a meeting!\n\n"
            f"**Title**: {meeting.title}\n"
            f"**Organizer**: {organizer_name}\n"
            f"**Date**: {meeting.meeting_date}\n"
            f"**Time**: {meeting.meeting_time}\n"
            f"**Join Code**: {meeting.join_code}\n\n"
            f"Open the Meeting Hub to join."
        )

        with get_user_db_session(recipient_email) as udb:
            udb.add(Message(
                sender_name=f"{organizer_name} (Meeting Invite)",
                sender_email=meeting.organizer_email,
                recipient_email=recipient_email,
                subject=f"Meeting Invitation: {meeting.title}",
                content=notification_msg,
                folder="inbox",
                starred=False,
                unread=True,
                created_at=ist_now,
                ist_date_time=ist_now_str,
                sender_id=meeting.organizer_email,
                recipient_ids=recipient_email,
                delivery_status="sent",
                read_status="unread"
            ))
            udb.add(PersonalEvent(
                user_email=recipient_email,
                title=f"📹 {meeting.title}",
                date=meeting.meeting_date,
                time=f"{meeting.meeting_time} (Meeting)",
                category="Meeting",
                status="Scheduled",
                created_at=ist_now,
                ist_date_time=ist_now_str
            ))
            udb.add(Notification(
                recipient_email=recipient_email,
                message=f"📅 Meeting Invite: {meeting.title} - Invited by {organizer_name} for {meeting.meeting_date} at {meeting.meeting_time}. Join Code: {meeting.join_code}",
                is_read=False,
                created_at=ist_now,
                ist_date_time=ist_now_str
            ))
            udb.commit()
    except Exception as ex:
        print(f"[Meeting Notify Warn] {recipient_email}: {ex}")


# ==========================================================
# POST /meetings/agent — Natural-Language Meeting Creation
# ==========================================================

@router.post("/meetings/agent")
async def meeting_agent(req: MeetingAgentRequest):
    from config import config
    from langchain_core.messages import HumanMessage as HM, SystemMessage as SM
    from services.time_utils import get_ist_now

    today_str = get_ist_now().strftime("%Y-%m-%d")
    tomorrow_str = (get_ist_now() + timedelta(days=1)).strftime("%Y-%m-%d")
    today_display = get_ist_now().strftime("%A, %B %d %Y")

    from services.prompt_loader import render_prompt
    system_content = render_prompt(
        "meeting_agent",
        today_display=today_display,
        today_str=today_str,
        tomorrow_str=tomorrow_str
    )

    try:
        resp = config.llm.invoke([SM(content=system_content), HM(content=f"User prompt: {req.prompt}")])
        raw = re.sub(r"```(?:json)?\s*|\s*```", "", resp.content.strip()).strip()
        meeting_data = json.loads(raw)
    except Exception as ex:
        return {"status": "error", "message": f"Could not parse meeting details: {ex}"}

    # Proactive Suggestion Check: If essential meeting details are missing
    missing = meeting_data.get("missing_details") or []
    t_val = meeting_data.get("title")
    d_val = meeting_data.get("meeting_date")
    tm_val = meeting_data.get("meeting_time")

    if not t_val or not d_val or not tm_val or len(missing) > 0:
        missing_names = []
        if not t_val: missing_names.append("Meeting Title")
        if not d_val: missing_names.append("Date")
        if not tm_val: missing_names.append("Start Time")
        
        missing_str = ", ".join(missing_names)
        suggestion_text = meeting_data.get("suggestion") or f"💡 Please include the {missing_str} for your meeting! Example: 'Schedule Project Review tomorrow at 10:30 AM with Section D'"
        return {
            "status": "needs_details",
            "message": suggestion_text,
            "missing": missing_names
        }

    # Resolve organizer name
    organizer_name = req.email.split("@")[0].replace(".", " ").title()
    with get_db_session() as db:
        fac = db.query(FacultyAccount).filter(FacultyAccount.email == req.email).first()
        if fac:
            organizer_name = fac.name
        else:
            stu = db.query(DSectionStudent).filter(DSectionStudent.email == req.email).first()
            if stu:
                organizer_name = stu.name

    init_db()
    join_code = _generate_join_code()

    with get_db_session() as db:
        meeting = Meeting(
            title=meeting_data.get("title", "Team Meeting"),
            organizer_name=organizer_name,
            organizer_email=req.email,
            section=meeting_data.get("section"),
            department="CSE",
            meeting_date=meeting_data.get("meeting_date", today_str),
            meeting_time=meeting_data.get("meeting_time", "10:00 AM"),
            duration_mins=int(meeting_data.get("duration_mins", 60)),
            join_code=join_code,
            description=meeting_data.get("description"),
            status="scheduled"
        )
        db.add(meeting)
        db.commit()
        db.refresh(meeting)
        meeting_id = meeting.id
        meeting_dict = meeting.to_dict()

        db.add(MeetingParticipant(
            meeting_id=meeting_id,
            user_email=req.email,
            user_name=organizer_name,
            role="host",
            status="accepted"
        ))
        db.commit()

    participants_added = []
    section = meeting_data.get("section")
    target_section = section if (section and str(section).strip().lower() != "null") else "@all"

    participants = _resolve_meeting_participants(target_section)
    for p in participants:
        if p["email"].strip().lower() == req.email.strip().lower():
            continue
        with get_db_session() as db2:
            exists = db2.query(MeetingParticipant).filter(
                MeetingParticipant.meeting_id == meeting_id,
                MeetingParticipant.user_email == p["email"]
            ).first()
            if not exists:
                db2.add(MeetingParticipant(
                    meeting_id=meeting_id,
                    user_email=p["email"],
                    user_name=p["name"],
                    role="participant",
                    status="invited"
                ))
                db2.commit()
                participants_added.append(p["email"])

        with get_db_session() as db3:
            m = db3.query(Meeting).filter(Meeting.id == meeting_id).first()
            if m:
                _notify_participant(m, p["name"], p["email"], organizer_name)

    # Also broadcast invitation to Central DB Message Hub
    try:
        from services.time_utils import get_ist_now, get_ist_str
        ist_now = get_ist_now()
        ist_now_str = get_ist_str(ist_now)
        with get_db_session() as central_db:
            central_db.add(Message(
                sender_name=f"{organizer_name} (Meeting Invite)",
                sender_email=req.email,
                recipient_email="@all",
                subject=f"Meeting Invitation: {meeting_dict['title']}",
                content=(
                    f"📅 You have been invited to a meeting!\n\n"
                    f"**Title**: {meeting_dict['title']}\n"
                    f"**Organizer**: {organizer_name}\n"
                    f"**Date**: {meeting_dict['meeting_date']}\n"
                    f"**Time**: {meeting_dict.get('meeting_time', '10:00 AM')}\n"
                    f"**Join Code**: {join_code}\n\n"
                    f"Open the Meeting Hub to join."
                ),
                folder="inbox",
                starred=False,
                unread=True,
                created_at=ist_now,
                ist_date_time=ist_now_str,
                sender_id=req.email,
                recipient_ids="@all",
                delivery_status="sent",
                read_status="unread"
            ))
            central_db.commit()
    except Exception as c_err:
        print(f"[Central DB Broadcast Invite Warn]: {c_err}")

    # Publish to InterAgentMessageBus
    try:
        from services.agent_message_bus import agent_message_bus
        agent_message_bus.publish_message(
            sender_agent="meeting_agent",
            recipient_target=target_section,
            subject=f"Meeting Scheduled: {meeting_dict['title']}",
            content=(
                f"Official meeting '{meeting_dict['title']}' scheduled on "
                f"{meeting_dict['meeting_date']} at {meeting_dict['meeting_time']}. "
                f"Join Code: {join_code}. Organizer: {organizer_name}."
            ),
            metadata=meeting_dict
        )
    except Exception as bus_err:
        print(f"[AgentMessageBus Meeting Publish Error]: {bus_err}")

    return {
        "status": "success",
        "message": f"Meeting created! Join code: **{join_code}**. {len(participants_added)} participants notified via Message Hub & Personal Calendar.",
        "meeting": meeting_dict,
        "participants_notified": len(participants_added),
        "join_code": join_code
    }


# ==========================================================
# GET /meetings — User's Meetings (Organized + Participating)
# ==========================================================

@router.get("/meetings")
async def get_meetings(email: str):
    from services.time_utils import get_ist_now
    init_db()
    result = []
    with get_db_session() as db:
        organized = db.query(Meeting).filter(Meeting.organizer_email == email).all()
        organized_ids = {m.id for m in organized}
        parts = db.query(MeetingParticipant).filter(MeetingParticipant.user_email == email).all()
        part_meeting_ids = [p.meeting_id for p in parts if p.meeting_id not in organized_ids]

        all_meetings = list(organized)
        if part_meeting_ids:
            all_meetings.extend(db.query(Meeting).filter(Meeting.id.in_(part_meeting_ids)).all())

        # Auto-expire past & completed meetings based on date, time, duration, and 60-min grace window
        now_ist = get_ist_now()
        today_date_str = now_ist.strftime("%Y-%m-%d")
        need_commit = False

        for m in all_meetings:
            meeting_end_dt = None
            if m.meeting_date and m.meeting_time:
                try:
                    m_date = datetime.strptime(m.meeting_date, "%Y-%m-%d").date()
                    m_time = None
                    for fmt in ("%I:%M %p", "%H:%M", "%I:%M%p"):
                        try:
                            m_time = datetime.strptime(m.meeting_time.strip().upper(), fmt).time()
                            break
                        except ValueError:
                            pass
                    if m_time:
                        start_dt = datetime.combine(m_date, m_time)
                        meeting_end_dt = start_dt + timedelta(minutes=(m.duration_mins or 60))
                except Exception:
                    pass

            if meeting_end_dt:
                grace_expiry_dt = meeting_end_dt + timedelta(minutes=60) # 1 hour grace window
                if now_ist < meeting_end_dt:
                    # Scheduled or active meeting
                    pass
                elif meeting_end_dt <= now_ist < grace_expiry_dt:
                    # Within 60-minute Grace Window! Available for re-joining
                    if m.status not in ("ongoing", "ended_grace"):
                        m.status = "ended_grace"
                        need_commit = True
                else:
                    # Exceeded 1-hour grace window
                    if m.status != "closed":
                        m.status = "closed"
                        need_commit = True
            elif m.meeting_date < today_date_str:
                if m.status != "closed":
                    m.status = "closed"
                    need_commit = True

        if need_commit:
            db.commit()

        for m in all_meetings:
            d = m.to_dict()
            d["participant_count"] = db.query(MeetingParticipant).filter(
                MeetingParticipant.meeting_id == m.id
            ).count()
            d["is_host"] = (m.organizer_email == email)

            # Compute grace period details
            meeting_end_dt = None
            if m.meeting_date and m.meeting_time:
                try:
                    m_date = datetime.strptime(m.meeting_date, "%Y-%m-%d").date()
                    m_time = None
                    for fmt in ("%I:%M %p", "%H:%M", "%I:%M%p"):
                        try:
                            m_time = datetime.strptime(m.meeting_time.strip().upper(), fmt).time()
                            break
                        except ValueError:
                            pass
                    if m_time:
                        start_dt = datetime.combine(m_date, m_time)
                        meeting_end_dt = start_dt + timedelta(minutes=(m.duration_mins or 60))
                except Exception:
                    pass

            if meeting_end_dt:
                grace_expiry_dt = meeting_end_dt + timedelta(minutes=60)
                d["grace_until_time"] = grace_expiry_dt.strftime("%I:%M %p")
                d["is_in_grace"] = (m.status == "ended_grace" or (meeting_end_dt <= now_ist < grace_expiry_dt))
            else:
                d["grace_until_time"] = None
                d["is_in_grace"] = False

            result.append(d)

    status_order = {"ongoing": 0, "scheduled": 1, "ended_grace": 2, "ended": 3, "closed": 4}
    result.sort(key=lambda x: (status_order.get(x["status"], 9), x["meeting_date"], x["meeting_time"]))
    return result


# ==========================================================
# POST /meetings/join
# ==========================================================

@router.post("/meetings/join")
async def join_meeting(req: MeetingJoinRequest):
    """Verify join code, check 100-person limit, mark user as joined."""
    from services.time_utils import get_ist_now
    init_db()
    with get_db_session() as db:
        meeting = db.query(Meeting).filter(Meeting.join_code == req.join_code).first()
        if not meeting:
            raise HTTPException(status_code=404, detail="Invalid join code")

        is_organizer = (meeting.organizer_email == req.email)
        participant = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == meeting.id,
            MeetingParticipant.user_email == req.email
        ).first()

        if not is_organizer and not participant:
            raise HTTPException(status_code=403, detail="You are not invited to this meeting")

        active_count = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == meeting.id,
            MeetingParticipant.status == "joined"
        ).count()

        is_already_joined = (participant and participant.status == "joined")
        if not is_already_joined and active_count >= 100:
            raise HTTPException(status_code=400, detail="Meeting has reached the maximum limit of 100 attendees.")

        if participant:
            participant.status = "joined"
            # Bug Fix B6: use IST now instead of dt.utcnow()
            participant.joined_at = get_ist_now()
            participant.mic_on = True
            participant.cam_on = True
            db.commit()

        # Log attendance with IST timestamps
        ist_now = get_ist_now()
        db.add(MeetingAttendance(
            meeting_id=meeting.id,
            user_email=req.email,
            user_name=req.name,
            join_time=ist_now
        ))
        db.commit()

        return {"status": "success", "meeting": meeting.to_dict()}


# ==========================================================
# Meeting Chat
# ==========================================================

@router.post("/meetings/chat")
async def post_meeting_chat(req: MeetingChatRequest):
    init_db()
    with get_db_session() as db:
        chat = MeetingChat(
            meeting_id=req.meeting_id,
            sender_email=req.sender_email,
            sender_name=req.sender_name,
            message=req.message
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        return chat.to_dict()


@router.get("/meetings/{meeting_id}/chat")
async def get_meeting_chat(meeting_id: int):
    init_db()
    with get_db_session() as db:
        chats = db.query(MeetingChat).filter(MeetingChat.meeting_id == meeting_id).all()
        return [c.to_dict() for c in chats]


@router.get("/meetings/{meeting_id}/participants")
async def get_meeting_participants(meeting_id: int):
    init_db()
    with get_db_session() as db:
        parts = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).all()
        return [p.to_dict() for p in parts]


# ==========================================================
# Meeting Status / Leave / Host Controls
# ==========================================================

@router.post("/meetings/status")
async def update_meeting_status(req: MeetingStatusRequest):
    init_db()
    with get_db_session() as db:
        meeting = db.query(Meeting).filter(Meeting.id == req.meeting_id).first()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        target_status = req.status
        if target_status == "ended":
            target_status = "ended_grace"

        meeting.status = target_status
        db.commit()
        return {"status": "success", "meeting_status": target_status}


@router.post("/meetings/leave")
async def leave_meeting(req: MeetingLeaveRequest):
    """Log IST leave time for a participant."""
    from services.time_utils import get_ist_now
    init_db()
    with get_db_session() as db:
        att = db.query(MeetingAttendance).filter(
            MeetingAttendance.meeting_id == req.meeting_id,
            MeetingAttendance.user_email == req.user_email,
            MeetingAttendance.leave_time == None
        ).first()
        if att:
            # Bug Fix B6: use IST timestamps consistently
            ist_now = get_ist_now()
            att.leave_time = ist_now
            if att.join_time:
                delta = ist_now - att.join_time
                att.duration_secs = int(delta.total_seconds())
            db.commit()
        return {"status": "success"}


@router.post("/meetings/av-update")
async def update_av_status(req: MeetingAVUpdateRequest):
    init_db()
    with get_db_session() as db:
        part = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == req.meeting_id,
            MeetingParticipant.user_email == req.user_email
        ).first()
        if part:
            part.mic_on = req.mic_on
            part.cam_on = req.cam_on
            db.commit()
            return {"status": "success"}
        return {"status": "error", "message": "Participant not found"}


@router.post("/meetings/host-control")
async def host_control(req: MeetingHostControlRequest):
    """Allows the meeting host/organizer to mute or kick a participant."""
    init_db()
    with get_db_session() as db:
        meeting = db.query(Meeting).filter(Meeting.id == req.meeting_id).first()
        if not meeting or meeting.organizer_email != req.host_email:
            raise HTTPException(status_code=403, detail="Only host can perform this action")

        part = db.query(MeetingParticipant).filter(
            MeetingParticipant.meeting_id == req.meeting_id,
            MeetingParticipant.user_email == req.target_email
        ).first()

        if part:
            if req.action == "mute":
                part.mic_on = False
            elif req.action == "kick":
                part.status = "kicked"
            db.commit()
            return {"status": "success"}
        return {"status": "error", "message": "Participant not found"}


@router.delete("/meetings/{meeting_id}")
async def delete_single_meeting(meeting_id: int, email: str):
    """Permanently delete a meeting or remove participant record."""
    init_db()
    email_clean = email.strip().lower()
    with get_db_session() as db:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")

        is_host = (meeting.organizer_email.strip().lower() == email_clean)

        if is_host:
            db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).delete()
            db.query(MeetingChat).filter(MeetingChat.meeting_id == meeting_id).delete()
            db.query(MeetingAttendance).filter(MeetingAttendance.meeting_id == meeting_id).delete()
            db.query(MeetingNotification).filter(MeetingNotification.meeting_id == meeting_id).delete()
            db.delete(meeting)
            db.commit()
            return {"status": "success", "message": f"Meeting '{meeting.title}' deleted successfully."}
        else:
            part = db.query(MeetingParticipant).filter(
                MeetingParticipant.meeting_id == meeting_id,
                MeetingParticipant.user_email.ilike(email_clean)
            ).first()
            if part:
                db.delete(part)
                db.commit()
            else:
                db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).delete()
                db.query(MeetingChat).filter(MeetingChat.meeting_id == meeting_id).delete()
                db.delete(meeting)
                db.commit()
            return {"status": "success", "message": "Meeting removed from your history."}


@router.post("/meetings/delete-closed")
async def delete_closed_meetings(req: DeleteClosedMeetingsRequest):
    """Permanently delete all closed, ended, or expired meetings organized/joined by the requesting user."""
    init_db()
    email_clean = req.email.strip().lower()
    with get_db_session() as db:
        # Find meetings organized or participated by user with status in ('closed', 'ended')
        stale_meetings = db.query(Meeting).filter(
            (Meeting.organizer_email.ilike(email_clean)) &
            (Meeting.status.in_(["closed", "ended"]))
        ).all()

        if not stale_meetings:
            return {"status": "success", "message": "No expired or closed meetings found to delete."}

        count = 0
        for m in stale_meetings:
            db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == m.id).delete()
            db.query(MeetingChat).filter(MeetingChat.meeting_id == m.id).delete()
            db.query(MeetingAttendance).filter(MeetingAttendance.meeting_id == m.id).delete()
            db.query(MeetingNotification).filter(MeetingNotification.meeting_id == m.id).delete()
            db.delete(m)
            count += 1
        db.commit()
        return {"status": "success", "message": f"Purged {count} expired/closed meetings successfully."}


@router.get("/meetings/{meeting_id}/attendance")
async def get_meeting_attendance(meeting_id: int):
    """Fetch attendance log for a meeting (for host exports)."""
    init_db()
    with get_db_session() as db:
        logs = db.query(MeetingAttendance).filter(MeetingAttendance.meeting_id == meeting_id).all()
        return [l.to_dict() for l in logs]


# NOTE: /meetings/simulate-attendees is intentionally NOT migrated here.
# It is a dev/demo-only endpoint. Removed from production.
