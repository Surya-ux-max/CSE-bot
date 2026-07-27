# 01: Server Code Structure & File Paths

This document outlines the file layout, backend package structure, module linkages, and path reference tables for the CSE-Bot server application.

---

## 📁 Backend Workspace File Tree

```
server/
├── services/                        # Business Logic & Agent Execution Services
│   ├── agents.py                    # Concrete Polymorphic Agent Classes (Faculty, Curriculum, Tutor, Placement, Reception)
│   ├── knowledge_repository.py      # Repository Pattern encapsulating PostgreSQL table search & relevance scoring
│   └── supervisor.py                # Strategy Router classifying intent & delegating agent execution
├── .env                             # Environment variables template (API keys & DB URL)
├── .gitignore                       # Git exclusion rules for Python virtual environments & bytecode
├── .python-version                  # Target Python version runtime pin (3.11+)
├── Procfile                         # Gunicorn / Uvicorn production start command for Render / Heroku
├── agents.py                        # Legacy fallback agent definitions & prompt references
├── check_db.py                      # Database inspection & row verification utility script
├── config.py                        # Singleton AppConfig managing Groq LLM & DB connection URL
├── db.py                            # SQLAlchemy ORM setup, Central Knowledge Registry & Dynamic Sector Model Generator
├── db_search.py                     # Standalone DB query inspection utility
├── main.py                          # FastAPI Application Entry Point & SessionHistoryManager
├── pyproject.toml                   # Project metadata & uv dependency configuration
├── render.yaml                      # Render Cloud Deployment Blueprint (Web Service + PostgreSQL DB)
├── requirements.txt                 # Frozen pip dependency requirements file
└── seed_db.py                       # Automated database populator seeding all 15 department sector tables
```

---

## 🔍 Module Dependency & Control Flow Graph

### Request Execution Lifecycle
```
Client Request (POST /chat)
   │
   ▼
[main.py] (FastAPI endpoint & SessionHistoryManager lookup)
   │
   ▼
[services/supervisor.py] (SupervisorRouter)
   ├── 1. Fast Regex Check ──► (If greeting) ──► [ReceptionAgent] ──► Output
   └── 2. Groq LLM Classifier ──► Identifies target agent name
         │
         ▼
   [services/agents.py] (Polymorphic Concrete Agent)
         │
         ├──► [services/knowledge_repository.py] (KnowledgeRepository)
         │       │
         │       └──► [db.py] (SQLAlchemy ORM + PostgreSQL query)
         │
         └──► Groq LLM (Llama-3.3-70b-versatile inference with prompt + context + memory)
         │
         ▼
   Response JSON returned to client: {"answer": "...", "agent_name": "..."}
```

---

## 📋 Comprehensive Server File Path Table

| Module Name | File Path | Scope & Primary Responsibility |
| :--- | :--- | :--- |
| **API Entry Point** | [server/main.py](file:///d:/CSE-bot/server/main.py) | FastAPI app initialization, CORS middleware, `/chat` endpoint, thread-safe session manager, startup auto-seeding check. |
| **Configuration Manager** | [server/config.py](file:///d:/CSE-bot/server/config.py) | Singleton `AppConfig` managing environment variables, sanitizing PostgreSQL URIs, and instantiating `ChatGroq`. |
| **Database & Dynamic ORM** | [server/db.py](file:///d:/CSE-bot/server/db.py) | SQLAlchemy engine, session maker, `KnowledgeRegistry` model, and `get_sector_model` dynamic table generator. |
| **Supervisor Router** | [server/services/supervisor.py](file:///d:/CSE-bot/server/services/supervisor.py) | `SupervisorRouter` strategy routing queries to agents via fast regex or Groq classifier. |
| **Polymorphic Agents** | [server/services/agents.py](file:///d:/CSE-bot/server/services/agents.py) | `BaseAgent` abstract class and 5 concrete agent implementations (`FacultyAgent`, `CurriculumAgent`, etc.). |
| **Knowledge Repository** | [server/services/knowledge_repository.py](file:///d:/CSE-bot/server/services/knowledge_repository.py) | `KnowledgeRepository` handling keyword search, intent mapping, and relevance scoring across 15 sector tables. |
| **Database Seeder** | [server/seed_db.py](file:///d:/CSE-bot/server/seed_db.py) | `seed_database()` populating initial department data for professors, curriculum, electives, CoEs, and vision/mission. |
| **DB Inspector** | [server/check_db.py](file:///d:/CSE-bot/server/check_db.py) | Command-line utility inspecting PostgreSQL tables, column names, and row counts. |
| **Render Blueprint** | [server/render.yaml](file:///d:/CSE-bot/server/render.yaml) | Deployment configuration for Render web service and managed PostgreSQL database instance. |
| **Process File** | [server/Procfile](file:///d:/CSE-bot/server/Procfile) | Web worker process command (`uvicorn main:app --host 0.0.0.0 --port $PORT`). |
