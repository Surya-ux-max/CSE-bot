import os
import re
import sys
import logging
from datetime import datetime
from typing import List, Dict, Tuple

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("DB_SEEDER")


from db import Base, engine, SessionLocal, KnowledgeRegistry, get_sector_model, init_db

# Knowledge references directory path
REFERENCES_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", ".agents", "skills", "cse-knowledge", "references")
)


def split_markdown_into_sections(content: str, doc_name: str) -> List[Tuple[str, str]]:
    """
    Splits markdown content into section title and section text blocks based on headers (## or ###).
    """
    sections = []
    lines = content.splitlines()
    current_title = doc_name.replace("_", " ").title()
    current_lines = []

    for line in lines:
        if line.startswith("# ") or line.startswith("## ") or line.startswith("### "):
            # Save previous section if it has content
            text_block = "\n".join(current_lines).strip()
            if text_block:
                sections.append((current_title, text_block))
            current_title = line.lstrip("#").strip()
            current_lines = [line]
        else:
            current_lines.append(line)

    # Save final section
    text_block = "\n".join(current_lines).strip()
    if text_block:
        sections.append((current_title, text_block))

    if not sections:
        sections.append((doc_name.replace("_", " ").title(), content.strip()))

    return sections


def seed_database():
    logger.info("Starting PostgreSQL Knowledge Seeding Pipeline...")
    logger.info(f"Scanning references directory: {REFERENCES_DIR}")

    if not os.path.exists(REFERENCES_DIR):
        logger.error(f"References directory '{REFERENCES_DIR}' does not exist!")
        return

    md_files = [f for f in os.listdir(REFERENCES_DIR) if f.endswith(".md")]
    md_files.sort()

    logger.info(f"Found {len(md_files)} .md files to seed into dedicated tables.")

    # 1. Register all sector models with SQLAlchemy Metadata
    model_map: Dict[str, Tuple[str, any]] = {}
    for filename in md_files:
        table_name = filename[:-3].lower().replace("-", "_").replace(" ", "_")
        model_cls = get_sector_model(table_name)
        model_map[filename] = (table_name, model_cls)

    # 2. Create tables in PostgreSQL
    logger.info("Initializing database schema and creating tables in PostgreSQL...")
    init_db()
    logger.info("Database schema initialized successfully.")

    # 3. Open DB session and seed tables
    session = SessionLocal()
    try:
        now = datetime.utcnow()

        for filename in md_files:
            table_name, model_cls = model_map[filename]
            filepath = os.path.join(REFERENCES_DIR, filename)

            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            sections = split_markdown_into_sections(content, table_name)
            logger.info(f"Seeding table '{table_name}' with {len(sections)} sections from {filename}...")

            # Clear existing data in table for fresh seed
            session.query(model_cls).delete()

            # Insert sections
            for idx, (title, section_text) in enumerate(sections, 1):
                entry = model_cls(
                    section_title=title[:250],
                    content=section_text,
                    metadata_json={
                        "source_file": filename,
                        "section_index": idx,
                        "seeded_at": now.isoformat()
                    },
                    version=1,
                    is_active=True,
                    effective_date=now,
                    created_at=now,
                    updated_at=now
                )
                session.add(entry)

            # Update or create knowledge registry entry
            registry_entry = session.query(KnowledgeRegistry).filter_by(table_name=table_name).first()
            if not registry_entry:
                registry_entry = KnowledgeRegistry(
                    table_name=table_name,
                    description=f"Dedicated knowledge table for sector '{filename}'",
                    total_records=len(sections),
                    version=1,
                    created_at=now,
                    updated_at=now
                )
                session.add(registry_entry)
            else:
                registry_entry.total_records = len(sections)
                registry_entry.version += 1
                registry_entry.updated_at = now

            session.commit()
            logger.info(f"[SUCCESS] Table '{table_name}' seeded successfully with {len(sections)} records.")

        logger.info("[COMPLETE] All 15 department knowledge tables seeded successfully in PostgreSQL!")

    except Exception as e:
        session.rollback()
        logger.error(f"Error seeding PostgreSQL database: {e}")
        raise e
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
