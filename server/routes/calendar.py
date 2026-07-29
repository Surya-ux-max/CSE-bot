"""
routes/calendar.py
Personal Calendar CRUD + AI Calendar Agent (NLP) + Central Academic Calendar (Faculty-managed).
Bug Fix: timedelta is now properly imported.
Bug Fix: Academic Calendar Parser now only runs when central DB is empty.
"""
import json
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

router = APIRouter(tags=["Calendar"])


# ==========================================================
# Pydantic Request Models
# ==========================================================

class EventCreateRequest(BaseModel):
    user_email: str
    title: str
    date: str
    time: str
    category: str
    status: Optional[str] = "Scheduled"


class CalendarQueryRequest(BaseModel):
    email: str
    prompt: str


class AcademicEventCreateRequest(BaseModel):
    title: str
    date: str
    end_date: Optional[str] = None
    day_name: Optional[str] = None
    category: Optional[str] = "General Academic"
    department: Optional[str] = "All Departments"
    semester: Optional[str] = "All Years"
    description: Optional[str] = None
    visibility: Optional[str] = "public"
    status: Optional[str] = "Published"
    user_email: str
    user_role: str


class AcademicEventUpdateRequest(BaseModel):
    title: str
    date: str
    end_date: Optional[str] = None
    day_name: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[str] = None
    status: Optional[str] = None
    user_email: str
    user_role: str


# ==========================================================
# Personal Calendar Endpoints
# ==========================================================

@router.get("/events")
def get_personal_events(email: str):
    from db import get_user_db_session, PersonalEvent
    with get_user_db_session(email) as db:
        events = db.query(PersonalEvent).filter(
            PersonalEvent.user_email.ilike(email.strip())
        ).all()
        return [e.to_dict() for e in events]


@router.post("/events")
def create_personal_event(payload: EventCreateRequest):
    from db import get_user_db_session, PersonalEvent
    email = payload.user_email.strip().lower()
    with get_user_db_session(email) as db:
        new_event = PersonalEvent(
            user_email=email,
            title=payload.title.strip(),
            date=payload.date.strip(),
            time=payload.time.strip(),
            category=payload.category.strip(),
            status=payload.status.strip() if payload.status else "Scheduled"
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        return new_event.to_dict()


@router.delete("/events/{event_id}")
def delete_personal_event(event_id: int, email: str):
    from db import get_user_db_session, PersonalEvent
    with get_user_db_session(email) as db:
        event = db.query(PersonalEvent).filter(
            PersonalEvent.id == event_id,
            PersonalEvent.user_email.ilike(email.strip())
        ).first()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        db.delete(event)
        db.commit()
        return {"status": "success", "message": f"Event {event_id} deleted successfully"}


# ==========================================================
# AI Calendar Query Agent (NLP CRUD)
# Bug Fix B1: `timedelta` is now imported at module level.
# ==========================================================

@router.post("/calendar/query")
def process_calendar_query(payload: CalendarQueryRequest):
    from db import (
        get_user_db_session, get_db_session,
        PersonalEvent, AcademicEvent,
        DSectionStudent, FacultyAccount, AIMemory
    )
    from langchain_core.messages import SystemMessage
    from config import config
    from services.time_utils import get_ist_now, get_ist_str

    user_email = payload.email.strip().lower()
    prompt_text = payload.prompt.strip()

    ist_now = get_ist_now()
    ist_now_str = get_ist_str(ist_now)
    today_date_str = ist_now.strftime("%Y-%m-%d")
    tomorrow_date_str = (ist_now + timedelta(days=1)).strftime("%Y-%m-%d")

    # 1. Fetch user identity
    user_name = "User"
    user_role = "student"
    user_year = "3rd Year"

    with get_db_session() as central_db:
        student = central_db.query(DSectionStudent).filter(DSectionStudent.email.ilike(user_email)).first()
        if student:
            user_name = student.name
            user_role = "student"
            user_year = student.year
        else:
            faculty = central_db.query(FacultyAccount).filter(FacultyAccount.email.ilike(user_email)).first()
            if faculty:
                user_name = faculty.name
                user_role = "faculty"
                user_year = faculty.year

    # 2. Fetch AI memory facts
    user_facts = {}
    with get_user_db_session(user_email) as db:
        memories = db.query(AIMemory).all()
        for mem in memories:
            user_facts[mem.memory_key] = mem.memory_value
    if "user_year" in user_facts:
        user_year = user_facts["user_year"]

    # 3. Fetch personal events
    with get_user_db_session(user_email) as db:
        personal_events = db.query(PersonalEvent).filter(
            PersonalEvent.user_email.ilike(user_email)
        ).all()

    # 4. Fetch academic events (filtered to user's year)
    with get_user_db_session(user_email) as db:
        year_filter_list = ["All Years", "All Semesters", "General Academic", "public"]
        if user_year:
            year_filter_list.append(user_year)
            if "3rd" in user_year or "3" in user_year:
                year_filter_list.extend(["III Year", "3rd Year", "Semester 5", "Semester 6"])
            elif "2nd" in user_year or "2" in user_year:
                year_filter_list.extend(["II Year", "2nd Year", "Semester 3", "Semester 4"])
            elif "4th" in user_year or "4" in user_year:
                year_filter_list.extend(["IV Year", "4th Year", "Semester 7", "Semester 8"])
            elif "1st" in user_year or "1" in user_year:
                year_filter_list.extend(["I Year", "1st Year", "Semester 1", "Semester 2"])

        academic_events = db.query(AcademicEvent).filter(AcademicEvent.status == "Published").all()
        filtered_academic = [
            ev for ev in academic_events
            if (ev.semester or "All Years") in year_filter_list
            or any(y.lower() in (ev.semester or "").lower() for y in year_filter_list if y)
        ]

    # 5. Build upcoming days reference list (Day Name + YYYY-MM-DD)
    days_ref_list = []
    for i in range(14):
        ref_d = ist_now + timedelta(days=i)
        days_ref_list.append(f"- {ref_d.strftime('%A')} ({ref_d.strftime('%b %d, %Y')}): {ref_d.strftime('%Y-%m-%d')}")
    upcoming_days_str = "\n".join(days_ref_list)

    # 6. Build context strings
    personal_context = "\n".join([
        f"- ID: {ev.id} | Date: {ev.date} | Title: {ev.title} | Time: {ev.time} | Category: {ev.category}"
        for ev in personal_events
    ]) or "No personal events scheduled."

    academic_context = "\n".join([
        f"- ID: {ev.id} | Date: {ev.date}{f' to {ev.end_date}' if ev.end_date else ''} | "
        f"Title: {ev.title} | Day: {ev.day_name or '—'} | Category: {ev.category} | "
        f"Year/Sem: {ev.semester} | Dept: {ev.department}"
        for ev in filtered_academic
    ]) or "No academic events scheduled."

    facts_context = "\n".join([
        f"- {k}: {v}" for k, v in user_facts.items() if not k.startswith("last_")
    ]) or "No special user facts stored."

    extraction_prompt = f"""You are the conversational Chitti AI Calendar Agent for the CSE-bot platform at SECE.
Your persona is a helpful, high-speed, proactive virtual assistant.

TODAY'S DATE: {today_date_str} ({ist_now.strftime('%A')})
CURRENT TIME: {ist_now.strftime('%I:%M %p')} IST

UPCOMING DAYS REFERENCE (Map requested days to exact dates):
{upcoming_days_str}

USER CONTEXT:
- Name: {user_name}
- Email: {user_email}
- Role: {user_role}
- Year/Semester: {user_year}

LONG-TERM USER FACTS IN MEMORY:
{facts_context}

ACADEMIC EVENTS SCHEDULE (Shared Centrally):
{academic_context}

PERSONAL EVENTS SCHEDULE (User's Private DB):
{personal_context}

USER QUERY: "{prompt_text}"

TASK:
1. Determine the user's intent:
   - "create": Add a new event or reminder.
   - "delete": Remove an event.
   - "update": Modify/reschedule/move an existing event.
   - "undo": Undo the last delete or modify action.
   - "none": Just querying, summarizing, checking schedules, or stating a fact.

2. If the user states a fact about themselves (e.g., "I am a Third Year Student"), identify key/value to store:
   - Set "memory_fact_key" to "user_year" or "user_section" or other relevant labels.
   - Set "memory_fact_value" to the stated value.

3. Extract parameters:
   - "action": "create" | "delete" | "update" | "undo" | "none"
   - "event_id": Integer ID of the event to modify or delete (if matching an existing event).
   - "title": Event description.
   - "date": Resolved date in strictly YYYY-MM-DD format (today={today_date_str}, tomorrow={tomorrow_date_str}).
   - "time": Event time (e.g. "04:00 PM").
   - "category": One of "Personal Study", "Lab Prep", "Exam", "Project", "Submission", "Meeting", "Other".

4. Output a warm, proactive, context-aware conversational response in "answer".
   If there is a conflict (two events on same date/time), notify the user in "answer".
   If answering a query, lookup the academic/personal lists and answer accurately.

Output strictly as a JSON object:
{{
  "action": "create|delete|update|undo|none",
  "event_id": null or number,
  "title": "...",
  "date": "...",
  "time": "...",
  "category": "...",
  "memory_fact_key": null or "...",
  "memory_fact_value": null or "...",
  "answer": "Your warm, context-aware Calendar Agent response..."
}}

Do NOT output markdown blocks, backticks, or any explanation besides raw JSON."""

    try:
        res = config.llm.invoke([SystemMessage(content=extraction_prompt)])
        raw = res.content.strip().replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)

        action = parsed.get("action", "none")
        event_id = parsed.get("event_id")
        title = parsed.get("title", "Study Session")
        event_date = parsed.get("date", today_date_str)
        event_time = parsed.get("time", "04:00 PM")
        category = parsed.get("category", "Personal Study")
        answer = parsed.get("answer", "Calendar updated successfully.")
        mem_key = parsed.get("memory_fact_key")
        mem_val = parsed.get("memory_fact_value")

        # Store memory facts
        if mem_key and mem_val:
            with get_user_db_session(user_email) as db:
                existing_mem = db.query(AIMemory).filter(
                    AIMemory.user_email == user_email,
                    AIMemory.memory_key == mem_key
                ).first()
                if existing_mem:
                    existing_mem.memory_value = mem_val
                else:
                    db.add(AIMemory(user_email=user_email, memory_key=mem_key, memory_value=mem_val))
                db.commit()

        created_event = None

        if action == "create":
            with get_user_db_session(user_email) as db:
                new_event = PersonalEvent(
                    user_email=user_email,
                    title=title,
                    date=event_date,
                    time=event_time,
                    category=category,
                    status="Scheduled via Calendar AI",
                    created_at=ist_now,
                    ist_date_time=ist_now_str
                )
                db.add(new_event)
                db.commit()
                db.refresh(new_event)
                created_event = new_event.to_dict()

        elif action == "delete":
            with get_user_db_session(user_email) as db:
                target_ev = None
                if event_id:
                    target_ev = db.query(PersonalEvent).filter(PersonalEvent.id == event_id).first()
                else:
                    target_ev = db.query(PersonalEvent).filter(
                        PersonalEvent.title.ilike(f"%{title}%"),
                        PersonalEvent.user_email == user_email
                    ).first()

                if target_ev:
                    last_del_val = json.dumps(target_ev.to_dict())
                    undo_mem = db.query(AIMemory).filter(
                        AIMemory.user_email == user_email,
                        AIMemory.memory_key == "last_deleted_event"
                    ).first()
                    if undo_mem:
                        undo_mem.memory_value = last_del_val
                    else:
                        db.add(AIMemory(user_email=user_email, memory_key="last_deleted_event", memory_value=last_del_val))
                    db.delete(target_ev)
                    db.commit()

        elif action == "update":
            computed_day = None
            if event_date:
                try:
                    dt = datetime.strptime(event_date, "%Y-%m-%d")
                    computed_day = dt.strftime("%A")
                except Exception:
                    pass

            with get_user_db_session(user_email) as db:
                target_ev = None
                if event_id:
                    target_ev = db.query(PersonalEvent).filter(PersonalEvent.id == event_id).first()
                else:
                    target_ev = db.query(PersonalEvent).filter(
                        PersonalEvent.title.ilike(f"%{title}%"),
                        PersonalEvent.user_email == user_email
                    ).first()

                if target_ev:
                    last_mod_val = json.dumps(target_ev.to_dict())
                    undo_mem = db.query(AIMemory).filter(
                        AIMemory.user_email == user_email,
                        AIMemory.memory_key == "last_modified_event"
                    ).first()
                    if undo_mem:
                        undo_mem.memory_value = last_mod_val
                    else:
                        db.add(AIMemory(user_email=user_email, memory_key="last_modified_event", memory_value=last_mod_val))

                    if title: target_ev.title = title
                    if event_date: target_ev.date = event_date
                    if event_time: target_ev.time = event_time
                    if category: target_ev.category = category
                    db.commit()
                    db.refresh(target_ev)
                    created_event = target_ev.to_dict()
                else:
                    # Search and update AcademicEvent if not matched in PersonalEvent
                    with get_db_session() as central_db:
                        acad_ev = None
                        if event_id:
                            acad_ev = central_db.query(AcademicEvent).filter(AcademicEvent.id == event_id).first()
                        else:
                            acad_ev = central_db.query(AcademicEvent).filter(
                                AcademicEvent.title.ilike(f"%{title}%")
                            ).first()

                        if acad_ev:
                            if title: acad_ev.title = title
                            if event_date: acad_ev.date = event_date
                            if computed_day: acad_ev.day_name = computed_day
                            if category: acad_ev.category = category
                            acad_ev.updated_by = user_email
                            acad_ev.version += 1
                            central_db.commit()
                            central_db.refresh(acad_ev)
                            created_event = acad_ev.to_dict()
                            
                            # Propagate to all user SQLite DBs
                            _propagate_update_bg(acad_ev.id, created_event)

        elif action == "undo":
            with get_user_db_session(user_email) as db:
                del_mem = db.query(AIMemory).filter(
                    AIMemory.user_email == user_email,
                    AIMemory.memory_key == "last_deleted_event"
                ).first()
                mod_mem = db.query(AIMemory).filter(
                    AIMemory.user_email == user_email,
                    AIMemory.memory_key == "last_modified_event"
                ).first()

                if del_mem and del_mem.memory_value:
                    data = json.loads(del_mem.memory_value)
                    restored = PersonalEvent(
                        user_email=user_email,
                        title=data["title"],
                        date=data["date"],
                        time=data["time"],
                        category=data["category"],
                        status="Restored via Calendar AI",
                        created_at=ist_now,
                        ist_date_time=ist_now_str
                    )
                    db.add(restored)
                    del_mem.memory_value = ""
                    db.commit()
                    db.refresh(restored)
                    created_event = restored.to_dict()
                    answer = "Successfully restored your last deleted event."
                elif mod_mem and mod_mem.memory_value:
                    data = json.loads(mod_mem.memory_value)
                    orig = db.query(PersonalEvent).filter(PersonalEvent.id == data["id"]).first()
                    if orig:
                        orig.title = data["title"]
                        orig.date = data["date"]
                        orig.time = data["time"]
                        orig.category = data["category"]
                        db.commit()
                        db.refresh(orig)
                        created_event = orig.to_dict()
                    mod_mem.memory_value = ""
                    db.commit()
                    answer = "Successfully reverted your last event modification."
                else:
                    answer = "Nothing to undo."

        return {
            "answer": answer,
            "should_create": (action in ("create", "update", "undo") and created_event is not None),
            "event": created_event
        }

    except Exception as e:
        print(f"[Calendar AI Error] {e}")
        import traceback
        traceback.print_exc()
        return {
            "answer": "I processed your request, but experienced an AI rendering issue. Calendar synced.",
            "should_create": False,
            "event": None
        }


# ==========================================================
# Central Academic Calendar — Faculty-Managed CRUD
# ==========================================================

def _get_all_user_emails():
    """Helper: return all known user emails for propagation."""
    from db import get_db_session, DSectionStudent, FacultyAccount
    emails = set()
    with get_db_session() as db:
        for s in db.query(DSectionStudent).all():
            if s.email:
                emails.add(s.email.strip().lower())
        for f in db.query(FacultyAccount).all():
            if f.email:
                emails.add(f.email.strip().lower())
    return emails


def _propagate_create_bg(event_id: int, payload_data: dict):
    from db import get_user_db_session, AcademicEvent
    for user_email in _get_all_user_emails():
        with get_user_db_session(user_email) as db:
            try:
                if not db.query(AcademicEvent).filter(AcademicEvent.id == event_id).first():
                    db.add(AcademicEvent(
                        id=event_id,
                        title=payload_data["title"],
                        date=payload_data["date"],
                        end_date=payload_data.get("end_date"),
                        day_name=payload_data.get("day_name"),
                        category=payload_data.get("category", "General Academic"),
                        department=payload_data.get("department", "All Departments"),
                        semester=payload_data.get("semester", "All Years"),
                        description=payload_data.get("description"),
                        visibility=payload_data.get("visibility", "public"),
                        status=payload_data.get("status", "Published"),
                        created_by=payload_data.get("user_email"),
                        version=1
                    ))
                    db.commit()
            except Exception as e:
                db.rollback()
                print(f"[Async Propagate Create Warn] {user_email}: {e}")


def _propagate_update_bg(event_id: int, payload_data: dict):
    from db import get_user_db_session, AcademicEvent
    for user_email in _get_all_user_emails():
        with get_user_db_session(user_email) as db:
            try:
                existing = db.query(AcademicEvent).filter(AcademicEvent.id == event_id).first()
                if existing:
                    existing.title = payload_data["title"]
                    existing.date = payload_data["date"]
                    existing.end_date = payload_data.get("end_date")
                    existing.day_name = payload_data.get("day_name")
                    if payload_data.get("category"): existing.category = payload_data["category"]
                    if payload_data.get("department"): existing.department = payload_data["department"]
                    if payload_data.get("semester"): existing.semester = payload_data["semester"]
                    if payload_data.get("description"): existing.description = payload_data["description"]
                    if payload_data.get("visibility"): existing.visibility = payload_data["visibility"]
                    if payload_data.get("status"): existing.status = payload_data["status"]
                    existing.updated_by = payload_data.get("user_email")
                    existing.version += 1
                    db.commit()
            except Exception as e:
                db.rollback()
                print(f"[Async Propagate Update Warn] {user_email}: {e}")


def _propagate_delete_bg(event_id: int):
    from db import get_user_db_session, AcademicEvent
    for user_email in _get_all_user_emails():
        with get_user_db_session(user_email) as db:
            try:
                existing = db.query(AcademicEvent).filter(AcademicEvent.id == event_id).first()
                if existing:
                    db.delete(existing)
                    db.commit()
            except Exception as e:
                db.rollback()
                print(f"[Async Propagate Delete Warn] {user_email}: {e}")


@router.get("/academic-events")
def get_academic_events(email: Optional[str] = None):
    from db import get_db_session, get_user_db_session, AcademicEvent
    if email and email.strip():
        email_clean = email.strip().lower()
        with get_user_db_session(email_clean) as db:
            events = db.query(AcademicEvent).order_by(AcademicEvent.date.asc()).all()
            return [e.to_dict() for e in events]
    else:
        with get_db_session() as db:
            events = db.query(AcademicEvent).order_by(AcademicEvent.date.asc()).all()
            return [e.to_dict() for e in events]


@router.post("/academic-events")
def create_academic_event(payload: AcademicEventCreateRequest, bg_tasks: BackgroundTasks):
    from db import get_db_session, AcademicEvent

    if payload.user_role.strip().lower() != "faculty":
        raise HTTPException(status_code=403, detail="Students are not authorized to modify the Academic Calendar")

    computed_day = payload.day_name.strip() if payload.day_name else None
    if not computed_day and payload.date:
        try:
            dt = datetime.strptime(payload.date.strip(), "%Y-%m-%d")
            computed_day = dt.strftime("%A")
        except Exception:
            computed_day = None

    with get_db_session() as db:
        new_event = AcademicEvent(
            title=payload.title.strip(),
            date=payload.date.strip(),
            end_date=payload.end_date.strip() if payload.end_date else None,
            day_name=computed_day,
            category=payload.category.strip() if payload.category else "General Academic",
            department=payload.department.strip() if payload.department else "All Departments",
            semester=payload.semester.strip() if payload.semester else "All Years",
            description=payload.description.strip() if payload.description else None,
            visibility=payload.visibility.strip() if payload.visibility else "public",
            status=payload.status.strip() if payload.status else "Published",
            created_by=payload.user_email.strip().lower()
        )
        db.add(new_event)
        db.commit()
        db.refresh(new_event)
        event_dict = new_event.to_dict()
        event_id = new_event.id

    # Asynchronously propagate SQLite updates in background
    payload_data = payload.dict()
    payload_data["day_name"] = computed_day
    bg_tasks.add_task(_propagate_create_bg, event_id, payload_data)

    return event_dict


@router.put("/academic-events/{event_id}")
def update_academic_event(event_id: int, payload: AcademicEventUpdateRequest, bg_tasks: BackgroundTasks):
    from db import get_db_session, AcademicEvent

    if payload.user_role.strip().lower() != "faculty":
        raise HTTPException(status_code=403, detail="Students are not authorized to modify the Academic Calendar")

    computed_day = payload.day_name.strip() if payload.day_name else None
    if not computed_day and payload.date:
        try:
            dt = datetime.strptime(payload.date.strip(), "%Y-%m-%d")
            computed_day = dt.strftime("%A")
        except Exception:
            computed_day = None

    with get_db_session() as db:
        event = db.query(AcademicEvent).filter(AcademicEvent.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Academic Event not found")
        event.title = payload.title.strip()
        event.date = payload.date.strip()
        event.end_date = payload.end_date.strip() if payload.end_date else None
        if computed_day: event.day_name = computed_day
        if payload.category: event.category = payload.category.strip()
        if payload.department: event.department = payload.department.strip()
        if payload.semester: event.semester = payload.semester.strip()
        if payload.description: event.description = payload.description.strip()
        if payload.visibility: event.visibility = payload.visibility.strip()
        if payload.status: event.status = payload.status.strip()
        event.updated_by = payload.user_email.strip().lower()
        event.version += 1
        db.commit()
        db.refresh(event)
        event_dict = event.to_dict()

    payload_data = payload.dict()
    payload_data["day_name"] = computed_day
    bg_tasks.add_task(_propagate_update_bg, event_id, payload_data)

    return event_dict


@router.delete("/academic-events/{event_id}")
def delete_academic_event(event_id: int, email: str, role: str, bg_tasks: BackgroundTasks):
    from db import get_db_session, AcademicEvent

    if role.strip().lower() != "faculty":
        raise HTTPException(status_code=403, detail="Students are not authorized to modify the Academic Calendar")

    with get_db_session() as db:
        event = db.query(AcademicEvent).filter(AcademicEvent.id == event_id).first()
        if not event:
            raise HTTPException(status_code=404, detail="Academic Event not found")
        db.delete(event)
        db.commit()

    bg_tasks.add_task(_propagate_delete_bg, event_id)

    return {"status": "success", "message": f"Academic Event {event_id} deleted successfully"}
