import re
from typing import List, Dict, Any, Tuple
from sqlalchemy import or_, text
from db import SessionLocal, get_sector_model, KnowledgeRegistry

# List of all 15 sector table names in PostgreSQL
ALL_TABLES = [
    "assessment_committee",
    "corporate_board",
    "curriculum_faq",
    "curriculum_overview",
    "cvm",
    "enhance_learning",
    "industry_courses",
    "learning_scope",
    "professional_electives",
    "professors",
    "program_details",
    "program_outcomes",
    "program_scope",
    "semester_curriculum",
    "yuvaraj",
]

# Topic Keyword -> Candidate Tables Mapping
CATEGORY_MAP = {
    "faculty": ["professors", "yuvaraj"],
    "hod": ["yuvaraj", "professors"],
    "head": ["yuvaraj", "professors"],
    "professor": ["professors", "yuvaraj"],
    "teacher": ["professors"],
    "staff": ["professors"],
    "curriculum": ["semester_curriculum", "curriculum_overview", "curriculum_faq", "professional_electives"],
    "syllabus": ["semester_curriculum", "professional_electives", "curriculum_overview"],
    "subject": ["semester_curriculum", "professional_electives", "industry_courses"],
    "course": ["semester_curriculum", "professional_electives", "industry_courses"],
    "elective": ["professional_electives"],
    "semester": ["semester_curriculum"],
    "committee": ["assessment_committee", "corporate_board"],
    "board": ["corporate_board"],
    "pac": ["assessment_committee"],
    "cab": ["corporate_board"],
    "vision": ["cvm"],
    "mission": ["cvm"],
    "po": ["program_outcomes"],
    "peo": ["program_outcomes"],
    "outcome": ["program_outcomes"],
    "detail": ["program_details", "program_scope"],
    "scope": ["learning_scope", "program_scope"],
    "lab": ["enhance_learning"],
    "coe": ["enhance_learning"],
    "centre": ["enhance_learning"],
    "hackathon": ["enhance_learning"],
    "skill": ["enhance_learning", "learning_scope"],
    "faq": ["curriculum_faq"],
}


def determine_target_tables(query: str) -> List[str]:
    """
    Analyzes query text (case-insensitive) to choose priority candidate tables.
    Returns prioritized list of table names.
    """
    clean_q = query.lower()
    selected_tables = []

    for kw, tables in CATEGORY_MAP.items():
        if re.search(r'\b' + re.escape(kw) + r'\b', clean_q):
            for t in tables:
                if t not in selected_tables:
                    selected_tables.append(t)

    # If no specific keyword matched, include primary knowledge tables
    if not selected_tables:
        return ALL_TABLES

    # Always append remaining tables as secondary candidates
    for t in ALL_TABLES:
        if t not in selected_tables:
            selected_tables.append(t)

    return selected_tables


def search_knowledge_database(query: str, max_results: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Searches PostgreSQL knowledge tables for matching sections.
    Returns:
      - Formatted string context for LLM prompt
      - Raw match metadata list
    """
    clean_query = query.strip()
    if not clean_query:
        return "", []

    target_tables = determine_target_tables(clean_query)
    
    # Extract query terms for keyword matching (ignoring tiny words)
    words = [w.strip() for w in re.split(r'\W+', clean_query) if len(w.strip()) > 2]
    
    session = SessionLocal()
    matched_entries = []

    try:
        for table_name in target_tables:
            model_cls = get_sector_model(table_name)
            
            # Construct PostgreSQL ILIKE filters for section_title or content
            filters = []
            if words:
                word_filters = []
                for word in words:
                    pattern = f"%{word}%"
                    word_filters.append(model_cls.section_title.ilike(pattern))
                    word_filters.append(model_cls.content.ilike(pattern))
                filters.append(or_(*word_filters))

            query_obj = session.query(model_cls).filter(model_cls.is_active == True)
            if filters:
                query_obj = query_obj.filter(or_(*filters))

            results = query_obj.limit(max_results).all()

            for item in results:
                matched_entries.append({
                    "table_name": table_name,
                    "section_title": item.section_title,
                    "content": item.content,
                    "updated_at": item.updated_at.strftime("%Y-%m-%d") if item.updated_at else "N/A"
                })

            if len(matched_entries) >= max_results:
                break

        # Fallback if specific filters yielded no results: fetch top entries from priority tables
        if not matched_entries:
            for table_name in target_tables[:3]:
                model_cls = get_sector_model(table_name)
                results = session.query(model_cls).filter(model_cls.is_active == True).limit(2).all()
                for item in results:
                    matched_entries.append({
                        "table_name": table_name,
                        "section_title": item.section_title,
                        "content": item.content,
                        "updated_at": item.updated_at.strftime("%Y-%m-%d") if item.updated_at else "N/A"
                    })

    except Exception as e:
        print(f"[db_search] Error searching database: {e}")
    finally:
        session.close()

    # Format retrieved results into context text for LLM
    context_parts = []
    for idx, entry in enumerate(matched_entries[:max_results], 1):
        context_parts.append(
            f"--- Document Source [{entry['table_name']}] (Updated: {entry['updated_at']}) ---\n"
            f"Title: {entry['section_title']}\n"
            f"Content:\n{entry['content']}\n"
        )

    formatted_context = "\n\n".join(context_parts)
    return formatted_context, matched_entries
