import os
import sys
from datetime import datetime
from db import init_db, SessionLocal, FacultyAccount, KnowledgeRegistry

def parse_and_seed_faculty():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    base_dir = os.path.dirname(os.path.abspath(__file__))
    md_path = os.path.join(base_dir, "faculty_acc_details", "details.md")

    if not os.path.exists(md_path):
        print(f"[Error] File not found at {md_path}")
        sys.exit(1)

    print(f"[Reading] Reading faculty account records from {md_path}...")

    with open(md_path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f if line.strip()]

    current_category = "Faculty Member"
    faculty_records = []

    for line in lines:
        # Category Headers
        if "Head of Department" in line:
            current_category = "Head of Department"
            continue
        elif "Associate Professors" in line:
            current_category = "Associate Professor"
            continue
        elif "Professors of Practice" in line:
            current_category = "Professor of Practice"
            continue
        elif "Professors" in line and "Associate" not in line and "Practice" not in line:
            current_category = "Professor"
            continue
        elif "Assistant Professors (Ph.D." in line:
            current_category = "Assistant Professor (Senior Grade)"
            continue
        elif "Assistant Professors" in line:
            current_category = "Assistant Professor"
            continue
        
        # Skip table header line
        if line.startswith("Faculty\t") or line.startswith("Faculty "):
            continue

        # Tab or space separated records
        parts = line.split("\t") if "\t" in line else line.split()
        if len(parts) >= 3:
            password = parts[-1].strip()
            email = parts[-2].strip()
            name = " ".join(parts[:-2]).strip() if "\t" not in line else parts[0].strip()

            faculty_records.append({
                "name": name,
                "email": email,
                "password": password,
                "designation": current_category,
                "section": "All Sections",
                "year": "All Years"
            })

    print(f"[Extracted] Extracted {len(faculty_records)} faculty account records.")

    # Initialize DB schema
    print("[Init] Initializing PostgreSQL tables (creating 'faculty_accounts' if not exists)...")
    init_db()

    session = SessionLocal()
    seeded_count = 0
    updated_count = 0

    try:
        for rec in faculty_records:
            existing = session.query(FacultyAccount).filter(FacultyAccount.email == rec["email"]).first()
            if existing:
                existing.name = rec["name"]
                existing.password = rec["password"]
                existing.designation = rec["designation"]
                existing.section = rec["section"]
                existing.year = rec["year"]
                existing.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                fac = FacultyAccount(
                    name=rec["name"],
                    email=rec["email"],
                    password=rec["password"],
                    designation=rec["designation"],
                    section=rec["section"],
                    year=rec["year"]
                )
                session.add(fac)
                seeded_count += 1

        session.commit()

        # Update Knowledge Registry Entry
        registry_entry = session.query(KnowledgeRegistry).filter(KnowledgeRegistry.table_name == "faculty_accounts").first()
        total_in_db = session.query(FacultyAccount).count()

        if registry_entry:
            registry_entry.total_records = total_in_db
            registry_entry.updated_at = datetime.utcnow()
        else:
            new_reg = KnowledgeRegistry(
                table_name="faculty_accounts",
                description="Sri Eshwar CSE Faculty Account Credentials & Profile Roster",
                total_records=total_in_db,
                version=1
            )
            session.add(new_reg)

        session.commit()

        print("\n==========================================================================")
        print("         POSTGRESQL SEEDING COMPLETE FOR FACULTY ACCOUNTS                ")
        print("==========================================================================")
        print(f"Table Name            : faculty_accounts")
        print(f"New Faculty Inserted  : {seeded_count}")
        print(f"Faculty Updated       : {updated_count}")
        print(f"Total Table Count     : {total_in_db}")
        print("==========================================================================\n")

        # Print Sample Entries
        print("--- Sample Seeded Faculty Account Entries ---")
        samples = session.query(FacultyAccount).limit(5).all()
        for f in samples:
            print(f"ID: {f.id:<3} | Name: {f.name:<25} | Email: {f.email:<38} | Desig: {f.designation}")

    except Exception as e:
        session.rollback()
        print(f"[Error] Error seeding database: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    parse_and_seed_faculty()
