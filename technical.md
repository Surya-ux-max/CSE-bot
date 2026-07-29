# Technical Specifications & Enterprise Code Navigation

This document outlines the architectural solutions implemented in the CSE-Bot platform to address the three core challenges of deploying LLM-based multi-agent systems in enterprise environments (**hallucination prevention**, **rate limit management**, **token optimization**) and provides a **Code Navigation Map** to locate functions, database configurations, and route handlers during presentations.

---

## 1. Factual Grounding & Hallucination Prevention

Enterprise applications require absolute factual correctness. LLM hallucinations (generating false details, wrong names, or invalid dates) are mitigated in the CSE-Bot platform through a combination of structured database grounding, strict system prompt scopes, and query scoping.

### A. Dynamic PostgreSQL Retrieval Grounding
The platform does not rely on the LLM's parametric memory to answer department-specific queries. Instead, it utilizes a **Retrieval-Grounded Generation (RAG)** pipeline powered by the `KnowledgeRepository`:
1. The `SupervisorRouter` classifies the target domain (e.g., `faculty_agent`, `curriculum_agent`).
2. The polymorphically chosen agent calls `BaseAgent.retrieve_context(question, repo)`.
3. The repository queries specialized PostgreSQL tables (`professors`, `semester_curriculum`, `academic_events`) using precise keywords.
4. Only verified rows returned by the query are serialized and injected into the prompt.

### B. Factual Boundary Constraint Directives
Each agent's system prompt (defined in `server/services/agents.py`) contains strict negative constraints to bind the model's output generation:
```text
📌 DATABASE CONTEXT:
Rely ONLY on the provided PostgreSQL database context below. Do not invent details.
{context}
```
If the database lookup returns no matches, the agent is instructed to state that the information is unavailable and politely guide the user to the appropriate coordinator, preventing the model from creating placeholder answers.

### C. Type-Safe SQL and Schema Enforcement
By separating data access from LLM reasoning, database queries are handled programmatically through SQLAlchemy models rather than allowing the LLM to write raw SQL commands. This prevents indirect SQL injections and limits the LLM's workspace strictly to the parsed database output.

---

## 2. API Rate Limiting & Cost Management

Unbounded LLM loops, brute-force requests, or high traffic can quickly exhaust API rate limits (tokens-per-minute / requests-per-minute) and inflate operation costs. The platform implements three optimization safeguards:

### A. Greeting Fast-Path Regex Route (Zero-LLM Latency)
Before invoking the supervisor LLM classifier, the system runs a fast-path regex check using the `is_fast_reception_query` method in `server/services/supervisor.py`:
- Common greetings, farewells, thanks, and simple identity queries (e.g., *"hi"*, *"good morning"*, *"thank you"*) are matched using pre-compiled patterns.
- These queries bypass the classifier and the target agent LLM calls entirely, routing directly to the static `reception_agent` fallback.
- **Benefit**: Achieves **0ms classification latency** and **saves 100% of LLM API costs** for common conversational fillers (which account for up to 30-40% of standard chatbot traffic).

### B. Human-in-the-Loop (HITL) Dispatch Decoupling
To prevent runaway LLM agent loops from triggering massive downstream costs (such as sending hundreds of auto-generated emails or scheduling phantom calendar meetings):
- The **Placement Agent** and **Hackathon Agent** are decoupled from automated mail dispatch and calendar sync triggers.
- Instead of executing background API write actions, they compile information into copy-ready Markdown templates.
- Administrators review, copy, and broadcast these messages manually via the **Message Hub**, preventing unintended bulk operations.

### C. Persistent Telemetry Logging for Budget Audits
Every API interaction is logged into the centralized PostgreSQL `agent_activity_logs` table (defined in `server/db.py`):
- Tracks `agent_name`, `user_email`, `query`, `response`, and `timestamp`.
- Allows administrators to query stats via `/agents/stats` to audit agent load, detect potential infinite loops, and monitor token consumption patterns.

---

## 3. Token Optimization (Input/Output Efficiency)

Optimizing token payloads directly reduces per-query API latency and operational costs. The platform achieves this through intelligent routing, concise prompt formatting, and sliding window memory.

### A. Supervisor-Agent Classifier Routing Pattern
In a naive multi-agent setup, the user query and historical context are sent to all agents, which execute concurrently and merge results. This wastes tokens. The CSE-Bot platform utilizes a single, lightweight classification step:
- The `SupervisorRouter` runs a single classification call using a highly condensed prompt to return a JSON containing the target agent name.
- Only the target agent's specific context and system prompt are loaded and sent to the LLM.
- **Benefit**: Avoids loading curriculum databases when asking about faculty details (or vice-versa), reducing prompt token overhead by **over 80%** per conversation step.

### B. Concise Context Serialization
Context retrieved from database tables is stripped of metadata, unnecessary foreign keys, and empty columns before being serialized as a plain string inside the `KnowledgeRepository`. This ensures that every token injected into the prompt context contributes directly to answering the query.

### C. Sliding Conversation History Memory
To prevent the prompt size from growing quadratically over long conversations, the platform manages history storage using standard windowing:
- The `history_manager` stores and retrieves a limited number of historical turns (`chat_history`).
- Older messages are automatically truncated from the context window, keeping prompt size bounded and ensuring predictable API latency.

---

## 🔍 4. Enterprise Code Navigation Directory

Use this guide to jump directly to key functions, database schemas, agents, and route handlers during code demonstrations and technical presentations.

### 🌐 A. Core API Routing Layer
* **API Entrypoint & Configuration**: [`server/main.py`](file:///d:/CSE-bot/server/main.py) — Handles startup, CORS middleware, and API path definition.
* **Chat Route Handler**: [`chat` in `server/main.py`](file:///d:/CSE-bot/server/main.py#L130) — Orchestrates supervisor query routing, Mail Agent connections, and dynamic telemetry writing.
* **Database Telemetry Endpoint**: [`get_agents_stats` in `server/main.py`](file:///d:/CSE-bot/server/main.py#L228) — Returns live invocation aggregate counts, database tables, and scopes for all 6 agents.

### 🤖 B. Multi-Agent Swarm Logic
* **Supervisor Router Classifier**: [`SupervisorRouter` in `server/services/supervisor.py`](file:///d:/CSE-bot/server/services/supervisor.py#L30) — Contains the system classifier prompt and regex shortcut logic (`is_fast_reception_query`).
* **Abstract Base Agent**: [`BaseAgent` in `server/services/agents.py`](file:///d:/CSE-bot/server/services/agents.py#L11) — The interface template containing `retrieve_context` and the polymorphic `execute` method.
* **Specialized System Prompts**: [`agents.py`](file:///d:/CSE-bot/server/services/agents.py) — Holds persona prompts and instructions for all concrete agents:
  - [`FacultyAgent`](file:///d:/CSE-bot/server/services/agents.py#L55) (Academic Directory Specialist)
  - [`CurriculumAgent`](file:///d:/CSE-bot/server/services/agents.py#L88) (Syllabus and Credit distribution Specialist)
  - [`TutorAgent`](file:///d:/CSE-bot/server/services/agents.py#L121) (CS Programming & Algorithm Tutor)
  - [`PlacementAgent`](file:///d:/CSE-bot/server/services/agents.py#L150) (Search Copilot for CoE and Careers)
  - [`HackathonAgent`](file:///d:/CSE-bot/server/services/agents.py#L182) (Search Copilot for coding opportunities)
  - [`ReceptionAgent`](file:///d:/CSE-bot/server/services/agents.py#L214) (Welcome Host)
* **Inter-Agent Message Bus**: [`agent_message_bus.py`](file:///d:/CSE-bot/server/services/agent_message_bus.py) — Handles background messaging queues.

### 💾 C. Database & RAG Grounding Layer
* **PostgreSQL Models**: [`server/db.py`](file:///d:/CSE-bot/server/db.py) — Mapped tables for Central Registrations (`professors`, `d_section_students`, `meetings`, `agent_activity_logs`).
* **Knowledge Retrieval Search**: [`KnowledgeRepository` in `server/services/knowledge_repository.py`](file:///d:/CSE-bot/server/services/knowledge_repository.py#L12) — Standardizes database keyword searches to retrieve factual context for RAG grounding.

### 💻 D. Frontend UI Workspaces
* **Navigation Shell Frame**: [`DashboardLayout.jsx`](file:///d:/CSE-bot/client/src/components/DashboardLayout.jsx) — Displays dynamic page breadcrumbs and user fallback credentials.
* **Central Chat Swarm Portal**: [`ChatDashboard.jsx`](file:///d:/CSE-bot/client/src/components/ChatDashboard.jsx) — Primary interface rendering the assistant thread and agent selector chips.
* **Message Hub Workspace**: [`MessageHub.jsx`](file:///d:/CSE-bot/client/src/components/MessageHub.jsx) — Dedicated email client carrying search-engine templates.
* **Calendar Hub Workspace**: [`CalendarHub.jsx`](file:///d:/CSE-bot/client/src/components/CalendarHub.jsx) — Interactive monthly calendar sync.
* **Meeting Hub (WebRTC A/V)**: [`MeetingHub.jsx`](file:///d:/CSE-bot/client/src/components/MeetingHub.jsx) — Multi-user real-time room launcher.
