import re
import json
from typing import List, Tuple, Dict, Any, Optional
from db import get_db_session, get_sector_model

class KnowledgeRepository:
    """Repository Pattern encapsulating PostgreSQL sector table search operations."""
    
    INTENT_MAP: Dict[str, List[str]] = {
        "faculty": ["professors", "yuvaraj", "assessment_committee", "corporate_board"],
        "curriculum": ["semester_curriculum", "professional_electives", "curriculum_overview", "industry_courses", "curriculum_faq"],
        "placement": ["enhance_learning", "learning_scope", "program_outcomes", "program_details"],
        "reception": ["cvm", "program_scope"],
    }
    
    ALL_TABLES: List[str] = [
        "assessment_committee", "corporate_board", "curriculum_faq", "curriculum_overview",
        "cvm", "enhance_learning", "industry_courses", "learning_scope",
        "professional_electives", "professors", "program_details", "program_outcomes",
        "program_scope", "semester_curriculum", "yuvaraj"
    ]

    @classmethod
    def calculate_relevance(cls, query: str, text: str) -> float:
        """Calculates keyword match density score between query and record text."""
        q_words = set(re.findall(r'\w+', query.lower()))
        t_words = re.findall(r'\w+', text.lower())
        if not q_words or not t_words:
            return 0.0
        matches = sum(1 for w in t_words if w in q_words)
        return matches / len(t_words)

    def search(self, query: str, category: Optional[str] = None, max_results: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
        """Searches target sector tables in PostgreSQL and returns formatted context + matches."""
        target_tables = self.INTENT_MAP.get(category, self.ALL_TABLES) if category else self.ALL_TABLES
        query_tokens = [w for w in re.findall(r'\w+', query.lower()) if len(w) > 2]
        
        if not query_tokens:
            query_tokens = [query.strip().lower()]

        scored_records = []
        
        with get_db_session() as session:
            for table_name in target_tables:
                model_cls = get_sector_model(table_name)
                try:
                    records = session.query(model_cls).filter(model_cls.is_active == True).all()
                    for rec in records:
                        searchable_text = f"{rec.section_title or ''} {rec.content or ''}"
                        score = 0
                        for token in query_tokens:
                            if token in searchable_text.lower():
                                score += 3 if (rec.section_title and token in rec.section_title.lower()) else 1
                        
                        if score > 0:
                            rel = self.calculate_relevance(query, searchable_text)
                            scored_records.append({
                                "table": table_name,
                                "id": rec.id,
                                "section_title": rec.section_title,
                                "content": rec.content,
                                "metadata": rec.metadata_json,
                                "score": score + rel
                            })
                except Exception as e:
                    print(f"[KnowledgeRepository] Error querying table '{table_name}': {e}")
                    continue

            # Dynamic search in Placements and Hackathons live tables
            if not category or category in ["placement"]:
                try:
                    from db import Placement, Hackathon
                    placements = session.query(Placement).filter(Placement.status == "Active").all()
                    for p in placements:
                        searchable_text = f"{p.title} {p.company} {p.description}"
                        score = 0
                        for token in query_tokens:
                            if token in searchable_text.lower():
                                score += 3 if token in p.title.lower() or token in p.company.lower() else 1
                        if score > 0:
                            rel = self.calculate_relevance(query, searchable_text)
                            scored_records.append({
                                "table": "placements",
                                "id": p.id,
                                "section_title": f"{p.title} ({p.company})",
                                "content": f"Company: {p.company}\nDeadline: {p.deadline}\nDescription: {p.description}\nApply Link: {p.apply_link or 'N/A'}",
                                "metadata": None,
                                "score": score + rel
                            })
                    
                    hackathons = session.query(Hackathon).filter(Hackathon.status == "Active").all()
                    for h in hackathons:
                        searchable_text = f"{h.title} {h.description}"
                        score = 0
                        for token in query_tokens:
                            if token in searchable_text.lower():
                                score += 3 if token in h.title.lower() else 1
                        if score > 0:
                            rel = self.calculate_relevance(query, searchable_text)
                            scored_records.append({
                                "table": "hackathons",
                                "id": h.id,
                                "section_title": h.title,
                                "content": f"Deadline: {h.deadline}\nDescription: {h.description}\nApply Link: {h.apply_link or 'N/A'}",
                                "metadata": None,
                                "score": score + rel
                            })
                except Exception as dyn_err:
                    print(f"[KnowledgeRepository] Error searching dynamic opportunities: {dyn_err}")

        scored_records.sort(key=lambda x: x["score"], reverse=True)
        top_matches = scored_records[:max_results]

        if not top_matches:
            return "", []

        context_blocks = []
        for i, match in enumerate(top_matches, 1):
            block = f"--- Record #{i} [Sector: {match['table']}] ---\nTitle: {match['section_title']}\nContent: {match['content']}"
            context_blocks.append(block)

        context_str = "\n\n".join(context_blocks)
        return context_str, top_matches


# Global repository instance
knowledge_repo = KnowledgeRepository()
