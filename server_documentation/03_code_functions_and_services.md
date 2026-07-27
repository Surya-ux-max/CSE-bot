# 03: Server Code Functions & Services Breakdown

This document provides an exhaustive function-by-function reference for all backend FastAPI endpoints, database ORM generators, repository search methods, supervisor routing functions, and agent classes.

---

## 🌐 1. `main.py` (FastAPI Application & Session Manager)

**Path**: [server/main.py](file:///d:/CSE-bot/server/main.py)

### Startup Lifecycle Hook
- `@app.on_event("startup") def on_startup()`:
  - Triggered automatically on deployment startup (e.g. Render / local uvicorn start).
  - Calls `db.init_db()` to create PostgreSQL tables if they do not exist.
  - Queries `KnowledgeRegistry`. If `count == 0`, invokes `seed_db.seed_database()` to automatically populate all 15 department sector tables.

### Endpoints:
1. `GET /`: Returns service metadata, server status, and version (`2.1.0`).
2. `POST /chat`:
   - Accepts `ChatRequest` (`question: str`, `session_id: str`).
   - Retrieves conversation history from `history_manager`.
   - Delegates query execution to `supervisor_router.route_and_execute(question, history)`.
   - Records HumanMessage and AIMessage back into `history_manager`.
   - Returns JSON `{"answer": str, "agent_name": str}`.
3. `POST /session/clear`:
   - Accepts `ClearSessionRequest` (`session_id: str`).
   - Invokes `history_manager.clear_history(session_id)`.

---

## ⚙️ 2. `config.py` (AppConfig & LLM Initialization)

**Path**: [server/config.py](file:///d:/CSE-bot/server/config.py)

### `AppConfig` Methods:
- `_initialize()`:
  - Reads environment variables via `dotenv.load_dotenv()`.
  - Sanitizes Render PostgreSQL connection strings (`postgres://` -> `postgresql://`).
  - Stores `groq_api_key` and `database_url`.
- `llm` (property):
  - Lazily instantiates and caches the `ChatGroq` model (`llama-3.3-70b-versatile`, `temperature=0.3`).

---

## 🧭 3. `services/supervisor.py` (Supervisor Router)

**Path**: [server/services/supervisor.py](file:///d:/CSE-bot/server/services/supervisor.py)

### Methods:
- `is_fast_reception_query(query: str) -> bool`:
  - Uses regex normalization (`re.sub(r'[^\w\s]', '', query.lower())`) to pre-match common greetings (`"hi"`, `"hello"`, `"vanakkam"`, `"thanks"`, `"who are you"`).
  - Bypasses LLM classification to execute `reception_agent` instantly with zero classification latency.
- `route_and_execute(question: str, chat_history: List[BaseMessage]) -> Tuple[str, str]`:
  - Executes fast-path greeting check.
  - If not a casual greeting, constructs `CLASSIFIER_PROMPT` message chain and invokes Groq LLM to classify query into one of 5 agent keys (`faculty_agent`, `curriculum_agent`, `tutor_agent`, `placement_agent`, `reception_agent`).
  - Delegates execution to the target agent instance and returns `(agent_name, answer)`.

---

## 🔎 4. `services/knowledge_repository.py` (PostgreSQL Repository)

**Path**: [server/services/knowledge_repository.py](file:///d:/CSE-bot/server/services/knowledge_repository.py)

### Methods:
- `calculate_relevance(query: str, text: str) -> float`:
  - Tokenizes query and target text into word sets.
  - Calculates keyword match density ratio ($matches / len(text\_words)$).
- `search(query: str, category: Optional[str] = None, max_results: int = 5) -> Tuple[str, List[Dict]]`:
  - Maps agent category to target PostgreSQL sector tables via `INTENT_MAP`.
  - Dynamically fetches table ORM class via `get_sector_model(table_name)`.
  - Queries active records (`is_active == True`).
  - Scores matches with 3x weight for section title occurrences and 1x for content occurrences.
  - Sorts matched records descending by total score and formats top 5 results into formatted context blocks (`--- Record #i [Sector: ...] ---`).

---

## 🤖 5. `services/agents.py` (Polymorphic AI Agents)

**Path**: [server/services/agents.py](file:///d:/CSE-bot/server/services/agents.py)

### Class Hierarchy:
- `BaseAgent(ABC)`:
  - `retrieve_context(question, repo)`: Queries `KnowledgeRepository` for relevant database context.
  - `execute(question, history, repo)`: Synthesizes system prompt, attaches memory history, invokes Groq LLM inference, and returns response string.
- `FacultyAgent`: Generates prompt for professors, designations, research, and email contacts.
- `CurriculumAgent`: Generates prompt for course syllabi, electives, credit requirements, and industry tracks.
- `TutorAgent`: Generates prompt for algorithm walk-throughs, debugging, syntax, and CS concepts (bypasses DB lookup).
- `PlacementAgent`: Generates prompt for CoEs, hackathons, skill development labs, and placement statistics.
- `ReceptionAgent`: Generates prompt for greetings, department vision, mission, and pleasantries.

---

## 🗄️ 6. `db.py` (Dynamic ORM & Connection Manager)

**Path**: [server/db.py](file:///d:/CSE-bot/server/db.py)

### Key Functions & Models:
- `KnowledgeRegistry`: Central SQLAlchemy model tracking initialized sector tables, record counts, and versions.
- `get_sector_model(table_name: str) -> Type`: Dynamic ORM model factory generating SQLAlchemy class definitions with standard columns (`id`, `section_title`, `content`, `metadata_json`, `version`, `is_active`, `effective_date`, `created_at`, `updated_at`).
- `init_db()`: Executes `Base.metadata.create_all(bind=engine)` to create PostgreSQL database tables.
- `get_db_session()`: Context manager (`@contextmanager`) providing transactional database sessions.

---

## 🌱 7. `seed_db.py` (Database Populator)

**Path**: [server/seed_db.py](file:///d:/CSE-bot/server/seed_db.py)

### Key Functions:
- `seed_database()`: Iterates through 15 department sector datasets (Faculty directory, HoD profile, UG PAC, Corporate Advisory Board, 8-semester course curriculum, professional electives, industry courses, CoE labs, hackathons, and department vision/mission) and inserts records into PostgreSQL.
