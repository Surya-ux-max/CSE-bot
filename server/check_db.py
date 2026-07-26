import sys
from db import SessionLocal, KnowledgeRegistry, get_sector_model

def inspect_database():
    session = SessionLocal()
    try:
        registry_entries = session.query(KnowledgeRegistry).order_by(KnowledgeRegistry.table_name).all()

        print("\n==========================================================================")
        print("                 POSTGRESQL KNOWLEDGE DATABASE STATUS                     ")
        print("==========================================================================")
        print(f"{'Table Name':<28} | {'Records':<8} | {'Version':<8} | {'Last Updated'}")
        print("-" * 74)

        total_sections = 0
        for entry in registry_entries:
            print(f"{entry.table_name:<28} | {entry.total_records:<8} | v{entry.version:<7} | {entry.updated_at.strftime('%Y-%m-%d %H:%M:%S') if entry.updated_at else 'N/A'}")
            total_sections += entry.total_records

        print("-" * 74)
        print(f"Total Knowledge Tables: {len(registry_entries)}")
        print(f"Total Knowledge Sections Seeded: {total_sections}")
        print("==========================================================================\n")

        # Display a sample from 'professors' table if available
        if registry_entries:
            sample_table = "professors"
            model_cls = get_sector_model(sample_table)
            samples = session.query(model_cls).limit(3).all()
            print(f"--- Sample Entries from '{sample_table}' table ---")
            for item in samples:
                print(f"ID {item.id} | Title: {item.section_title}")
                print(f"Content Preview: {item.content[:120].strip()}...\n")

    except Exception as e:
        print(f"Error checking database: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    inspect_database()
