# 📐 CSE-Bot Multi-Agent System Architecture & Data Flow

This document provides visual diagrams and detailed explanations of the **CSE-Bot Multi-Agent Architecture**, illustrating how different users interact with specialized AI agents, how the **Supervisor Router** coordinates agent execution, and how agents query the underlying **PostgreSQL Knowledge Database**.

---

## 📦 High-Level System Block Diagram

```text
+---------------------------------------------------------------------------------------------------+
|                                      USER INTERACTION LAYER                                       |
|  +---------------------------+  +---------------------------+  +-------------------------------+  |
|  |     🎓 Student User       |  |   👨‍🏫 Faculty / HoD User  |  |    🌐 Guest / Visitor User    |  |
|  |  (Syllabus/Code/Careers)  |  |   (Governance/Directory)  |  |     (Greetings/Mission)       |  |
|  +-------------+-------------+  +-------------+-------------+  +---------------+---------------+  |
+----------------|------------------------------|--------------------------------|------------------+
                 |                              |                                |
                 +------------------------------+--------------------------------+
                                                |
                                                v
+---------------------------------------------------------------------------------------------------+
|                                      FRONTEND CLIENT LAYER                                        |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                  React 19 + Vite Web App                                    |  |
|  |             [Chat Dashboard]  --->  [Session Manager]  --->  [ApiClient Service]            |  |
|  +--------------------------------------------+------------------------------------------------+  |
+-----------------------------------------------|---------------------------------------------------+
                                                | HTTP POST /api/chat payload
                                                v
+---------------------------------------------------------------------------------------------------+
|                                       FASTAPI BACKEND GATEWAY                                     |
|  +---------------------------------------------------------------------------------------------+  |
|  |                        Session Memory & Request Handler (main.py)                           |  |
|  +--------------------------------------------+------------------------------------------------+  |
+-----------------------------------------------|---------------------------------------------------+
                                                |
                                                v
+---------------------------------------------------------------------------------------------------+
|                                      SUPERVISOR ROUTER ENGINE                                     |
|  +---------------------------------------------------------------------------------------------+  |
|  |              Regex Fast-Path Matcher  <--->  Groq LLM Intent Classifier (Llama 3.3)         |  |
|  +--------------------------------------------+------------------------------------------------+  |
+-----------------------------------------------|---------------------------------------------------+
                                                | Delegates Execution
                                                v
+---------------------------------------------------------------------------------------------------+
|                                  SPECIALIZED AGENT SWARM (agents.py)                              |
|  +---------------+  +------------------+  +---------------+  +-----------------+  +------------+  |
|  | faculty_agent |  | curriculum_agent |  |  tutor_agent  |  | placement_agent |  | ... agents |  |
|  +-------+-------+  +--------+---------+  +-------+-------+  +--------+--------+  +-----+------+  |
+----------|-------------------|--------------------|-------------------|-----------------|---------+
           |                   |                    |                   |                 |
           +-------------------+---------+----------+-------------------+-----------------+
                                         | RAG Search Request
                                         v
+---------------------------------------------------------------------------------------------------+
|                                     KNOWLEDGE REPOSITORY RAG                                      |
|  +---------------------------------------------------------------------------------------------+  |
|  |                              KnowledgeRepository (db_search.py)                             |  |
|  +--------------------------------------------+------------------------------------------------+  |
+-----------------------------------------------|---------------------------------------------------+
                                                | SQL Query Execution
                                                v
+---------------------------------------------------------------------------------------------------+
|                                     POSTGRESQL DATABASE LAYER                                     |
|  +--------------------+  +-----------------------+  +-------------------+  +-------------------+  |
|  | professors, yuvaraj|  | semester_curriculum,  |  | enhance_learning, |  | cvm, hackathons,  |  |
|  | assessment_comm... |  | professional_elect... |  | program_outcomes  |  | academic_calendar |  |
|  +--------------------+  +-----------------------+  +-------------------+  +-------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 👥 1. End-to-End Multi-Agent System Flowchart

The following diagram illustrates how **Student**, **Faculty**, and **Guest** users connect through the React UI to the FastAPI Supervisor Router, which classifies intent, delegates queries to specialized agents, and fetches context from PostgreSQL tables.

```mermaid
graph TD
    %% ───────────────────────────────────────────────────────────
    %% USER LAYER
    %% ───────────────────────────────────────────────────────────
    subgraph Users["👥 User Interaction Layer"]
        U1["🎓 Student User<br/>(Role: student)"]
        U2["👨‍🏫 Faculty / HoD User<br/>(Role: faculty)"]
        U3["🌐 Guest / Visitor User<br/>(Role: guest)"]
    end

    %% ───────────────────────────────────────────────────────────
    %% CLIENT & API LAYER
    %% ───────────────────────────────────────────────────────────
    subgraph Client["💻 React + Vite Frontend Client"]
        Dashboard["React Chat Dashboard<br/>(Dashboard.jsx)"]
        ApiClient["API Client Service<br/>(sendQuestion)"]
    end

    subgraph BackendAPI["⚡ FastAPI Server Backend"]
        Endpoint["REST API Endpoint<br/>/api/chat"]
        SessionMgr["Session History Manager<br/>(Sliding Window Memory)"]
    end

    %% ───────────────────────────────────────────────────────────
    %% SUPERVISOR ROUTER LAYER
    %% ───────────────────────────────────────────────────────────
    subgraph SupervisorLayer["🧠 Supervisor Routing Engine"]
        FastPath{"⚡ Fast-Path Matcher<br/>(Regex Greetings)"}
        LLMClassifier["🤖 LLM Intent Classifier<br/>(Groq Chat Model)"]
    end

    %% ───────────────────────────────────────────────────────────
    %% SPECIALIZED AGENTS LAYER
    %% ───────────────────────────────────────────────────────────
    subgraph Agents["🤖 Specialized AI Agent Swarm"]
        A1["👨‍🏫 faculty_agent<br/>(Faculty & Governance)"]
        A2["📚 curriculum_agent<br/>(Syllabus & Electives)"]
        A3["💻 tutor_agent<br/>(CS Code & Algo Tutor)"]
        A4["🚀 placement_agent<br/>(Career & CoE Coach)"]
        A5["🏆 hackathon_agent<br/>(Contests & SIH)"]
        A6["💬 reception_agent<br/>(Host & Greetings)"]
    end

    %% ───────────────────────────────────────────────────────────
    %% RAG & KNOWLEDGE LAYER
    %% ───────────────────────────────────────────────────────────
    subgraph KnowledgeLayer["🔍 Knowledge Repository & RAG Engine"]
        KnowledgeRepo["KnowledgeRepository<br/>(RAG Search Service)"]
        DBSearch["Database Search Engine<br/>(db_search.py)"]
    end

    %% ───────────────────────────────────────────────────────────
    %% DATABASE LAYER
    %% ───────────────────────────────────────────────────────────
    subgraph DBLayer["🗄️ PostgreSQL Database (15+ Sector Tables)"]
        DB_Faculty[("professors<br/>yuvaraj<br/>assessment_committee<br/>corporate_board")]
        DB_Curriculum[("semester_curriculum<br/>professional_electives<br/>curriculum_overview<br/>industry_courses")]
        DB_Placement[("enhance_learning<br/>learning_scope<br/>program_outcomes<br/>program_details")]
        DB_Reception[("cvm<br/>program_scope")]
        DB_Hackathons[("hackathons<br/>academic_calendar")]
    end

    %% ───────────────────────────────────────────────────────────
    %% CONNECTIONS
    %% ───────────────────────────────────────────────────────────
    U1 -->|Syllabus / Code / Placement| Dashboard
    U2 -->|Governance / Faculty Directory| Dashboard
    U3 -->|Greetings / Vision & Mission| Dashboard

    Dashboard --> ApiClient
    ApiClient -->|POST /api/chat payload| Endpoint
    Endpoint --> SessionMgr
    SessionMgr --> FastPath

    FastPath -->|Matches Hi / Vanakkam| A6
    FastPath -->|Complex Query| LLMClassifier

    LLMClassifier -->|Intent: faculty| A1
    LLMClassifier -->|Intent: curriculum| A2
    LLMClassifier -->|Intent: tutor| A3
    LLMClassifier -->|Intent: placement| A4
    LLMClassifier -->|Intent: hackathon| A5
    LLMClassifier -->|Intent: reception| A6

    A1 --> KnowledgeRepo
    A2 --> KnowledgeRepo
    A3 -->|Direct Generation| A3
    A4 --> KnowledgeRepo
    A5 --> KnowledgeRepo
    A6 --> KnowledgeRepo

    KnowledgeRepo --> DBSearch
    DBSearch --> DB_Faculty
    DBSearch --> DB_Curriculum
    DBSearch --> DB_Placement
    DBSearch --> DB_Reception
    DBSearch --> DB_Hackathons

    A1 -->|Synthesized Response| Endpoint
    A2 -->|Synthesized Response| Endpoint
    A3 -->|Code & Explanation| Endpoint
    A4 -->|Career Advice| Endpoint
    A5 -->|Hackathon Info| Endpoint
    A6 -->|Greeting / Mission| Endpoint

    Endpoint -->|JSON Response + agent_name| ApiClient
    ApiClient -->|Render Active Agent Badge & Response| Dashboard
```

---

## 🔄 2. Sequence Diagram: Inter-Agent Routing & Interaction

The following sequence diagram shows the step-by-step interaction between a user, the **Supervisor Router**, the targeted **Specialized Agent**, the **RAG Knowledge Repository**, and **PostgreSQL**.

```mermaid
sequenceDiagram
    autonumber
    actor User as 🎓 Student / 👨‍🏫 Faculty User
    participant UI as 💻 React Frontend (Dashboard)
    participant API as ⚡ FastAPI Server
    participant Router as 🧠 SupervisorRouter
    participant Agent as 🤖 Specialized Agent (e.g. faculty_agent)
    participant RAG as 🔍 KnowledgeRepository
    participant DB as 🗄️ PostgreSQL Database

    User->>UI: Types query: "Who is the Head of the Department?"
    UI->>API: POST /api/chat { question, session_id, user_role }
    API->>Router: route_and_execute(question, chat_history, user_role)
    
    rect rgb(240, 248, 255)
        note over Router: Intent Classification Phase
        Router->>Router: Fast-path regex check (Returns False)
        Router->>Router: LLM Classifier prompt with Chat History
        Router-->>Router: Target Identified: "faculty_agent"
    end

    Router->>Agent: execute(question, chat_history, knowledge_repo, user_role)
    
    rect rgb(255, 245, 238)
        note over Agent, DB: RAG Database Context Retrieval
        Agent->>RAG: search_knowledge(question, sector="faculty")
        RAG->>DB: SQL Query on 'professors' & 'assessment_committee'
        DB-->>RAG: Returns faculty tuples (HoD name, designation, email)
        RAG-->>Agent: Returns formatted PostgreSQL context string
    end

    rect rgb(245, 255, 250)
        note over Agent: LLM Response Synthesis
        Agent->>Agent: Inject Context into System Persona Prompt
        Agent-->>Router: Generated Markdown Response + agent_name
    end

    Router-->>API: ("faculty_agent", answer)
    API->>API: Update Session History Sliding Window
    API-->>UI: 200 OK { answer, agent_name: "faculty_agent" }
    UI-->>User: Displays response with 👨‍🏫 faculty_agent badge & styling
```

---

## 🏛️ 3. Agent-to-Database Mapping Table

| Specialized Agent | Role & Domain Boundary | Target PostgreSQL Tables | Sample Queries Handled |
| :--- | :--- | :--- | :--- |
| 👨‍🏫 **`faculty_agent`** | Faculty directory, HoD, designations, research domains, committees | `professors`, `yuvaraj`, `assessment_committee`, `corporate_board` | *"Who is the HoD?"*, *"Dr. Subha's email address?"* |
| 📚 **`curriculum_agent`** | Semester syllabus, electives, credit distribution, industry courses | `semester_curriculum`, `professional_electives`, `curriculum_overview`, `industry_courses` | *"Cloud computing syllabus details"*, *"Electives in Sem 6"* |
| 💻 **`tutor_agent`** | CS programming mentor, code generation, algorithm analysis | *Generates code directly / CS algorithm knowledge* | *"Write quicksort in C++"*, *"Explain recursion in Python"* |
| 🚀 **`placement_agent`** | Placement search engine, stats discovery, copy-ready template composer | `enhance_learning`, `learning_scope`, `program_outcomes`, `program_details` | *"CoE labs in CSE?"*, *"Placement statistics & tips"* |
| 🏆 **`hackathon_agent`** | Hackathon search engine, SIH/Google Challenge info, copy-ready announcement builder | `hackathons`, `academic_calendar` | *"Upcoming hackathons"*, *"SIH registration details"* |
| 💬 **`reception_agent`** | Host, greetings, farewells, department vision & mission | `cvm`, `program_scope` | *"Vanakkam"*, *"Tell me CSE vision and mission"* |

---

## 🔀 4. Multi-User Access & Role Context Matrix

```mermaid
graph LR
    subgraph UserRoles["User Roles"]
        R1["🎓 Student"]
        R2["👨‍🏫 Faculty"]
        R3["🌐 Guest"]
    end

    subgraph Router["Supervisor Router"]
        SR["SupervisorRouter"]
    end

    subgraph AgentSwarm["Specialized Agent Swarm"]
        FA["faculty_agent"]
        CA["curriculum_agent"]
        TA["tutor_agent"]
        PA["placement_agent"]
        HA["hackathon_agent"]
        RA["reception_agent"]
    end

    R1 -->|Query & student role| SR
    R2 -->|Query & faculty role| SR
    R3 -->|Query & guest role| SR

    SR -->|Role-tuned Prompting| FA
    SR -->|Role-tuned Prompting| CA
    SR -->|Role-tuned Prompting| TA
    SR -->|Role-tuned Prompting| PA
    SR -->|Role-tuned Prompting| HA
    SR -->|Role-tuned Prompting| RA
```
