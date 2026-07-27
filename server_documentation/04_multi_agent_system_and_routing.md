# 04: Multi-Agent System & Supervisor Routing Architecture

The CSE-Bot server features a multi-agent orchestration architecture powered by Groq Llama-3.3-70b, 5 specialized domain agents, and PostgreSQL grounding tables.

---

## 🤖 1. The 5 Specialized AI Agent Personas

Each AI agent operates within a dedicated domain boundary, system persona, and target set of PostgreSQL database tables:

| Agent Name | Persona & Specialty | Target PostgreSQL Tables | Sample Queries Handled |
| :--- | :--- | :--- | :--- |
| **`faculty_agent`** | Professional academic directory advisor for professors, HoD, research, and email contacts. | `professors`, `yuvaraj`, `assessment_committee`, `corporate_board` | *"Who is the Head of Department?"*, *"What is Dr. Subha's email address?"*, *"UG PAC members?"* |
| **`curriculum_agent`** | Encouraging academic planning advisor for courses, syllabi, electives, and credits. | `semester_curriculum`, `professional_electives`, `curriculum_overview`, `industry_courses`, `curriculum_faq` | *"Syllabus for Cloud Computing?"*, *"Sem 6 electives?"*, *"How many credits required per semester?"* |
| **`tutor_agent`** | Patient, authoritative CS mentor for algorithms, syntax debugging, and complexity analysis. | *None (Pure LLM code reasoning)* | *"Write quicksort algorithm in C++ with explanation"*, *"Database normalization example?"* |
| **`placement_agent`** | Inspiring career coach for CoEs, hackathons, skill labs, and placement statistics. | `enhance_learning`, `learning_scope`, `program_outcomes`, `program_details` | *"What hackathons & CoE labs are available?"*, *"Program Outcomes for CSE?"* |
| **`reception_agent`** | Warm, welcoming Virtual Robot host for greetings, farewells, vision, and mission. | `cvm`, `program_scope` | *"Hi"*, *"Vanakkam"*, *"Tell me about CSE department vision and mission"* |

---

## 🧭 2. Supervisor Routing Mechanism

The `SupervisorRouter` in [services/supervisor.py](file:///d:/CSE-bot/server/services/supervisor.py) routes user queries through a 2-stage pipeline:

```
                  ┌───────────────────────────────┐
                  │      Incoming User Query      │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                     [Fast Regex Pre-Match Check]
                      Is it a common greeting/thanks?
                                 / \
                         YES    /   \   NO
                               /     \
                              ▼       ▼
              ┌──────────────────┐  ┌─────────────────────────────────┐
              │ reception_agent  │  │ Groq Llama-3.3-70b Classifier   │
              │ (Zero Latency)   │  │ Parses intent to strict JSON    │
              └──────────────────┘  └────────────────┬────────────────┘
                                                     │
                                                     ▼
                                     ┌──────────────────────────────┐
                                     │ Polymorphic Agent Execution  │
                                     │ (DB Context + Memory Window) │
                                     └──────────────────────────────┘
```

### Stage 1: Fast Regex Pre-Matching
Common casual greetings (e.g. `"hello"`, `"hi"`, `"vanakkam"`, `"good morning"`, `"thanks"`, `"bye"`) bypass LLM classification completely, eliminating classification latency and API token costs.

### Stage 2: Groq LLM Intent Classifier
If the query requires domain intelligence, the supervisor invokes Groq Llama-3.3-70b with `CLASSIFIER_PROMPT`. The LLM classifies the intent into a strict JSON payload:

```json
{
  "agent_name": "faculty_agent"
}
```

---

## 📊 3. Database Sector Knowledge Mapping

The `KnowledgeRepository` maintains an `INTENT_MAP` linking agent categories to 15 PostgreSQL sector tables:

```python
INTENT_MAP = {
    "faculty": [
        "professors", 
        "yuvaraj", 
        "assessment_committee", 
        "corporate_board"
    ],
    "curriculum": [
        "semester_curriculum", 
        "professional_electives", 
        "curriculum_overview", 
        "industry_courses", 
        "curriculum_faq"
    ],
    "placement": [
        "enhance_learning", 
        "learning_scope", 
        "program_outcomes", 
        "program_details"
    ],
    "reception": [
        "cvm", 
        "program_scope"
    ]
}
```

---

## 🌐 4. Multi-Lingual Capability & Context Grounding

### Natural Language Auto-Detection
All system prompts instruct agents to auto-detect the user's input language (English, Tamil, Tanglish, Hindi, etc.) and respond fluently in the **same language**.

### Hallucination Prevention Directive
To guarantee academic accuracy, system prompts strictly constrain retrieval-augmented agents:
> *"Rely ONLY on the provided PostgreSQL database context below. Do not invent details."*
