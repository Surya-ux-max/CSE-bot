import os
import sys
from datetime import datetime
from db import init_db, SessionLocal, DSectionStudent, KnowledgeRegistry

def parse_and_seed_d_section():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    # Path to d_section.md
    base_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(base_dir, "section_d_students", "d_section.md")

    if not os.path.exists(md_path):
        print(f"[Error] File not found at {md_path}")
        sys.exit(1)

    print(f"[Reading] Reading student records from {md_path}...")
    
    with open(md_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    # Skip header line if present ("Student Email Temporary Password")
    student_records = []
    for line in lines:
        if line.lower().startswith("student email"):
            continue
        parts = line.split()
        if len(parts) >= 3:
            password = parts[-1]
            email = parts[-2]
            name = " ".join(parts[:-2])
            student_records.append({
                "name": name,
                "email": email,
                "password": password,
                "section": "Section D",
                "year": "3rd Year"
            })

    print(f"[Extracted] Extracted {len(student_records)} student records for Section D.")

    # Initialize DB schema
    print("[Init] Initializing PostgreSQL tables (creating 'd_section_students' if not exists)...")
    init_db()

    session = SessionLocal()
    seeded_count = 0
    updated_count = 0

    try:
        for rec in student_records:
            existing = session.query(DSectionStudent).filter(DSectionStudent.email == rec["email"]).first()
            if existing:
                existing.name = rec["name"]
                existing.password = rec["password"]
                existing.section = rec["section"]
                existing.year = rec["year"]
                existing.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                student = DSectionStudent(
                    name=rec["name"],
                    email=rec["email"],
                    password=rec["password"],
                    section=rec["section"],
                    year=rec["year"]
                )
                session.add(student)
                seeded_count += 1

        session.commit()

        # Seed initial Personal Events for suryaprakash.s.d@csebot.edu
        from db import PersonalEvent
        # Check if events already exist
        existing_events = session.query(PersonalEvent).filter(PersonalEvent.user_email == "suryaprakash.s.d@csebot.edu").count()
        if existing_events == 0:
            events_to_seed = [
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
            session.add_all(events_to_seed)
            session.commit()
            print("[Events Seeded] 3 personal calendar events seeded for suryaprakash.s.d@csebot.edu")

        # Seed initial Messages
        from db import Message
        existing_msgs = session.query(Message).count()
        if existing_msgs == 0:
            msgs_to_seed = [
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
            session.add_all(msgs_to_seed)
            session.commit()
            print("[Messages Seeded] 5 initial Gmail-style messages seeded in database.")


        # Update Knowledge Registry Entry
        registry_entry = session.query(KnowledgeRegistry).filter(KnowledgeRegistry.table_name == "d_section_students").first()
        total_in_db = session.query(DSectionStudent).count()
        
        if registry_entry:
            registry_entry.total_records = total_in_db
            registry_entry.updated_at = datetime.utcnow()
        else:
            new_reg = KnowledgeRegistry(
                table_name="d_section_students",
                description="Sri Eshwar CSE Section D Student Credentials & Profile Roster",
                total_records=total_in_db,
                version=1
            )
            session.add(new_reg)

        session.commit()

        print("\n==========================================================================")
        print("         POSTGRESQL SEEDING COMPLETE FOR D-SECTION STUDENTS               ")
        print("==========================================================================")
        print(f"Table Name            : d_section_students")
        print(f"New Students Inserted : {seeded_count}")
        print(f"Students Updated      : {updated_count}")
        print(f"Total Table Count     : {total_in_db}")
        print("==========================================================================\n")

        # Print Sample Entries
        print("--- Sample Seeded Student Entries ---")
        samples = session.query(DSectionStudent).limit(5).all()
        for s in samples:
            print(f"ID: {s.id:<3} | Name: {s.name:<25} | Email: {s.email:<32} | Pass: {s.password}")

    except Exception as e:
        session.rollback()
        print(f"[Error] Error seeding database: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    parse_and_seed_d_section()
