import os
import re
from datetime import datetime
from db import get_db_session, AcademicEvent

MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12
}

def parse_academic_calendar_files(calendar_dir: str):
    """
    Scans the calendar_dir for markdown files, parses dates and events,
    classifies categories/semesters/departments dynamically, and inserts them
    into the central database 'academic_events' table.
    """
    if not os.path.exists(calendar_dir):
        print(f"[Calendar Parser Warning] Directory '{calendar_dir}' does not exist.")
        return

    # Clear existing automatically parsed records to refresh calendar entries on reload
    with get_db_session() as db:
        try:
            db.query(AcademicEvent).delete()
            db.commit()
            print("[Calendar Parser] Cleared existing central AcademicEvents.")
        except Exception as e:
            db.rollback()
            print(f"[Calendar Parser Error] Failed to clear central AcademicEvents: {e}")

    all_events = []

    for filename in os.listdir(calendar_dir):
        if not filename.endswith(".md"):
            continue
        
        filepath = os.path.join(calendar_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"[Calendar Parser Warning] Failed to read {filename}: {e}")
            continue

        lines = [line.strip() for line in content.split("\n") if line.strip()]
        if not lines:
            continue

        # Parse Month and Year from first line, e.g., "August 2026"
        first_line = lines[0]
        match_title = re.search(r"([A-Za-z]+)\s+(\d{4})", first_line)
        if not match_title:
            print(f"[Calendar Parser Warning] Skipping {filename}: Title line '{first_line}' does not match expected format.")
            continue
        
        month_name = match_title.group(1).lower()
        year = int(match_title.group(2))
        month_num = MONTH_MAP.get(month_name)
        if not month_num:
            print(f"[Calendar Parser Warning] Unknown month '{month_name}' in {filename}.")
            continue

        for line in lines[1:]:
            # Check if this line is header
            if line.startswith("Date") and "Event" in line:
                continue

            # Check if this line is a footnote / margin note
            # E.g., "(Ongoing band, Oct 8 – Dec 13): Placement Training..."
            # E.g., "(Right-margin notes): Placement Training for IV Years..."
            if line.startswith("("):
                # Search for date ranges like "30.11 to 13.12.2026" or "25.12.2026 to 03.01.2027" or "Oct 8 – Dec 13"
                range_match = re.search(r"(\d{1,2}(?:\.\d{1,2})?(?:\.\d{4})?)\s*(?:to|–|-)\s*(\d{1,2}\.\d{1,2}\.\d{4})", line)
                if range_match:
                    start_str = range_match.group(1)
                    end_str = range_match.group(2)
                    
                    if len(start_str.split(".")) == 2:
                        year_suffix = end_str.split(".")[-1]
                        start_str = f"{start_str}.{year_suffix}"
                    
                    try:
                        start_date = datetime.strptime(start_str, "%d.%m.%Y").strftime("%Y-%m-%d")
                        end_date = datetime.strptime(end_str, "%d.%m.%Y").strftime("%Y-%m-%d")
                    except Exception:
                        start_date = f"{year}-{month_num:02d}-01"
                        end_date = f"{year}-{month_num:02d}-28"
                else:
                    name_range_match = re.search(r"([A-Za-z]+)\s+(\d{1,2})\s*(?:–|-|to)\s*([A-Za-z]+)\s+(\d{1,2})", line)
                    if name_range_match:
                        m1 = MONTH_MAP.get(name_range_match.group(1).lower())
                        d1 = int(name_range_match.group(2))
                        m2 = MONTH_MAP.get(name_range_match.group(3).lower())
                        d2 = int(name_range_match.group(4))
                        if m1 and m2:
                            # If start month is greater than end month, assume it crosses year boundary (e.g. Dec to Jan)
                            y2 = year + 1 if m1 > m2 else year
                            start_date = f"{year}-{m1:02d}-{d1:02d}"
                            end_date = f"{y2}-{m2:02d}-{d2:02d}"
                        else:
                            start_date = f"{year}-{month_num:02d}-01"
                            end_date = f"{year}-{month_num:02d}-28"
                    else:
                        start_date = f"{year}-{month_num:02d}-01"
                        end_date = f"{year}-{month_num:02d}-28"

                event_part = line.split("):", 1)[-1].strip() if "):" in line else line
                # Split events by semicolon
                parts = [p.strip() for p in event_part.split(";") if p.strip()]
                for part in parts:
                    if part == "—" or not part:
                        continue
                    all_events.append({
                        "title": part,
                        "date": start_date,
                        "end_date": end_date,
                        "day_name": "—"
                    })
                continue

            # Parse standard table row, e.g.: "1	Sat	Saturday Holiday"
            tokens = re.split(r"\t+", line)
            if len(tokens) < 3:
                tokens = re.split(r"\s{2,}", line)

            if len(tokens) >= 3:
                date_part = tokens[0].strip()
                day_part = tokens[1].strip()
                event_part = tokens[2].strip()

                if event_part == "—" or not event_part:
                    continue

                if "–" in date_part or "-" in date_part:
                    delim = "–" if "–" in date_part else "-"
                    parts = date_part.split(delim)
                    try:
                        start_d = int(parts[0].strip())
                        end_d = int(parts[1].strip())
                        start_date = f"{year}-{month_num:02d}-{start_d:02d}"
                        end_date = f"{year}-{month_num:02d}-{end_d:02d}"
                    except ValueError:
                        start_date = f"{year}-{month_num:02d}-01"
                        end_date = None
                else:
                    try:
                        d_val = int(date_part)
                        start_date = f"{year}-{month_num:02d}-{d_val:02d}"
                        end_date = None
                    except ValueError:
                        continue

                sub_events = [se.strip() for se in event_part.split(";") if se.strip()]
                for se in sub_events:
                    if se == "—" or not se:
                        continue
                    all_events.append({
                        "title": se,
                        "date": start_date,
                        "end_date": end_date,
                        "day_name": day_part
                    })

    # Save to database and classify dynamically!
    with get_db_session() as db:
        for ev in all_events:
            title = ev["title"]
            title_lower = title.lower()
            
            # 1. Classify Category
            category = "General Academic"
            if any(k in title_lower for k in ["holiday", "independence day", "deepavali", "christmas", "ayutha pooja", "vijaya dasami", "vinayagar chaturthi", "krishna jayanthi"]):
                category = "Holiday"
            elif any(k in title_lower for k in ["exam", "assessment", "cia", "review", "reopening", "practical"]):
                category = "Exam/Assessment"
            elif any(k in title_lower for k in ["sprint", "hackathon", "contest", "challenge"]):
                category = "Hackathon/Sprint"
            elif any(k in title_lower for k in ["workshop", "master class", "training", "vac", "seminar", "bootcamp"]):
                category = "Workshop/Training"
            elif any(k in title_lower for k in ["remedial", "slow learners"]):
                category = "Remedial"

            # 2. Classify Semester / Target Year
            semester = "All Years"
            if "ii yr" in title_lower or "ii year" in title_lower or "second year" in title_lower or "-ii" in title_lower:
                semester = "II Year"
            elif "iii yr" in title_lower or "iii year" in title_lower or "third year" in title_lower or "-iii" in title_lower:
                semester = "III Year"
            elif "iv yr" in title_lower or "iv year" in title_lower or "fourth year" in title_lower or "-iv" in title_lower:
                semester = "IV Year"

            # 3. Classify Department
            department = "All Departments"
            if any(k in title_lower for k in ["cse", "java", "algo", "daa", "data science", "dbms", "se", "embedded", "iot"]):
                department = "CSE"

            db_event = AcademicEvent(
                title=title,
                date=ev["date"],
                end_date=ev["end_date"],
                day_name=ev["day_name"],
                category=category,
                department=department,
                semester=semester,
                description=f"Auto-imported from academic calendar records.",
                visibility="public",
                status="Published",
                created_by="system@sece.ac.in",
                version=1
            )
            db.add(db_event)
        
        try:
            db.commit()
            print(f"[Calendar Parser Success] Successfully parsed and imported {len(all_events)} academic calendar events.")
            # Sync to all users' isolated databases
            sync_academic_events_to_all_users()
        except Exception as e:
            db.rollback()
            print(f"[Calendar Parser Error] Failed to commit parsed academic events: {e}")


def seed_user_academic_calendar(email: str):
    """
    Copies all AcademicEvent records from the central database into the user's isolated database.
    """
    from db import get_db_session, get_user_db_session, AcademicEvent
    
    email_clean = email.strip().lower()
    if not email_clean:
        return
        
    # 1. Fetch all central academic events
    with get_db_session() as central_db:
        central_events = central_db.query(AcademicEvent).all()
        
    # 2. Open user database and write them
    with get_user_db_session(email_clean) as user_db:
        try:
            # Clear existing user academic events to avoid duplicates
            user_db.query(AcademicEvent).delete()
            
            # Copy all central events
            for e in central_events:
                user_event = AcademicEvent(
                    id=e.id, # keep same id for easy updates
                    title=e.title,
                    date=e.date,
                    end_date=e.end_date,
                    day_name=e.day_name,
                    category=e.category,
                    department=e.department,
                    semester=e.semester,
                    description=e.description,
                    visibility=e.visibility,
                    status=e.status,
                    version=e.version,
                    created_by=e.created_by,
                    updated_by=e.updated_by,
                    created_at=e.created_at,
                    updated_at=e.updated_at
                )
                user_db.add(user_event)
            user_db.commit()
            print(f"[User Calendar Seed] Successfully seeded {len(central_events)} academic events to {email_clean}")
        except Exception as ex:
            user_db.rollback()
            print(f"[User Calendar Seed Error] Failed to seed academic events to {email_clean}: {ex}")


def sync_academic_events_to_all_users():
    """
    Propagates all academic events in the central database to every registered student and faculty member.
    """
    from db import get_db_session, DSectionStudent, FacultyAccount
    
    # 1. Get emails of all registered students and faculty from central database
    emails = set()
    with get_db_session() as db:
        students = db.query(DSectionStudent).all()
        for s in students:
            emails.add(s.email.strip().lower())
        faculty = db.query(FacultyAccount).all()
        for f in faculty:
            emails.add(f.email.strip().lower())
            
    # Always include the core testing accounts
    emails.add("suryaprakash.s.d@csebot.edu")
    emails.add("tamilselvan.d@csebot.edu")
    
    # Let's seed for all these emails
    for email in sorted(emails):
        if email:
            seed_user_academic_calendar(email)

