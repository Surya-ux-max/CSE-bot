# CSE-Bot Server Documentation

Welcome to the technical documentation for the **CSE-Bot Production Multi-Agent Server Engine**. Built with FastAPI, LangChain, Groq (Llama-3.3-70b-versatile), SQLAlchemy, and PostgreSQL, the server powers intelligent query classification, context retrieval, and polymorphic agent execution for the CSE department at Sri Eshwar College of Engineering.

---

## 🔒 Confidentiality Notice
> [!IMPORTANT]
> All credentials, database connection strings, passwords, and API keys in this documentation suite have been sanitized and redacted (`<REDACTED_DATABASE_URL>`, `<REDACTED_GROQ_API_KEY>`) to ensure security compliance.

---

## 📚 Documentation Index

| Module | Document | Description |
| :--- | :--- | :--- |
| **01** | [Code Structure & Paths](file:///d:/CSE-bot/server_documentation/01_code_structure_and_paths.md) | Complete directory layout, module linkages, and backend path mappings. |
| **02** | [OOP Concepts & Design Patterns](file:///d:/CSE-bot/server_documentation/02_oops_concepts_and_patterns.md) | Polymorphic BaseAgent, Strategy Pattern router, Repository Pattern, Singleton AppConfig, and thread-safe history manager. |
| **03** | [Code Functions & Services Breakdown](file:///d:/CSE-bot/server_documentation/03_code_functions_and_services.md) | Exhaustive method reference for FastAPI endpoints, database ORM generators, knowledge searches, and agents. |
| **04** | [Multi-Agent System & Routing](file:///d:/CSE-bot/server_documentation/04_multi_agent_system_and_routing.md) | Supervisor Router, fast regex pre-matching, 5 specialized AI agent personas, 15 PostgreSQL sector tables, and prompt engineering. |
| **05** | [Developer Deployment & Configuration Guide](file:///d:/CSE-bot/server_documentation/05_developer_deployment_and_configuration_guide.md) | Installation, redacted `.env` setup, automatic database seeding, Uvicorn execution, and Render deployment (`render.yaml`, `Procfile`). |

---

## 🚀 Key Server Architecture Features

- **FastAPI Core**: Asynchronous Python API engine delivering JSON responses.
- **5 Polymorphic AI Agents**: Specialized agents (`faculty_agent`, `curriculum_agent`, `tutor_agent`, `placement_agent`, `reception_agent`) inheriting from abstract `BaseAgent`.
- **Supervisor Intent Classifier**: Groq Llama-3.3-70b classifier with zero-latency regex pre-matching for instant greetings.
- **Dynamic PostgreSQL ORM & Knowledge Repository**: 15 sector tables created via dynamic SQLAlchemy ORM models (`get_sector_model`) with keyword density relevance scoring.
- **Thread-Safe Session Memory**: `SessionHistoryManager` with a sliding window memory limit (6 turns / 12 messages).
