# 02: Object-Oriented Programming (OOP) & Design Patterns

The CSE-Bot server architecture strictly adheres to modern Python Object-Oriented Programming (OOP) principles and architectural design patterns to achieve clean separation of concerns, scalability, and maintainability.

---

## 🏛️ 1. Abstract Base Class & Polymorphism (`BaseAgent`)

The [services/agents.py](file:///d:/CSE-bot/server/services/agents.py) module establishes a polymorphic class hierarchy using Python's `abc` module.

```python
from abc import ABC, abstractmethod

class BaseAgent(ABC):
    def __init__(self, name: str, category: Optional[str] = None):
        self.name = name
        self.category = category
        self.llm = config.llm

    @abstractmethod
    def get_system_prompt(self, context: str) -> str:
        """Returns agent-specific system prompt formatted with database context."""
        pass

    def retrieve_context(self, question: str, repo: KnowledgeRepository) -> str:
        """Retrieves grounded database context from KnowledgeRepository."""
        if not self.category:
            return ""
        context_str, _ = repo.search(question, category=self.category, max_results=5)
        return context_str or "No specific database matching records found for this query."

    def execute(self, question: str, history: List[BaseMessage], repo: KnowledgeRepository) -> str:
        """Polymorphic execution pipeline."""
        context = self.retrieve_context(question, repo)
        sys_prompt = self.get_system_prompt(context)
        messages = [SystemMessage(content=sys_prompt)] + history + [HumanMessage(content=question)]
        response = self.llm.invoke(messages)
        return response.content.strip()
```

### Concrete Agent Implementations:
- **`FacultyAgent(BaseAgent)`**: Specialized in professors, HoD, designations, research, and emails.
- **`CurriculumAgent(BaseAgent)`**: Specialized in course syllabi, electives, credit structures, and industry tracks.
- **`TutorAgent(BaseAgent)`**: Specialized in CS algorithms, coding debugging, and data structures (bypasses DB lookup for pure code reasoning).
- **`PlacementAgent(BaseAgent)`**: Specialized in Centers of Excellence (CoEs), hackathons, and career development.
- **`ReceptionAgent(BaseAgent)`**: Specialized in greetings, department vision/mission, and general pleasantries.

### OOP Principles Applied:
- **Interface Segregation & Polymorphism**: All concrete agents inherit from `BaseAgent` and override `get_system_prompt()`. The supervisor invokes `agent.execute(...)` without needing to know the concrete agent type.
- **Template Method Pattern**: `BaseAgent.execute()` defines the standard skeleton of an execution algorithm (retrieve context -> format prompt -> append memory -> call LLM), while deferred steps are customized in subclasses.

---

## 🎯 2. Strategy Pattern (`SupervisorRouter`)

The [services/supervisor.py](file:///d:/CSE-bot/server/services/supervisor.py) file implements the Strategy Pattern to encapsulate intent classification and agent selection.

```python
class SupervisorRouter:
    def __init__(self):
        self.llm = config.llm
        self.agents: Dict[str, BaseAgent] = {
            "faculty_agent": FacultyAgent(),
            "curriculum_agent": CurriculumAgent(),
            "tutor_agent": TutorAgent(),
            "placement_agent": PlacementAgent(),
            "reception_agent": ReceptionAgent(),
        }

    def route_and_execute(self, question: str, chat_history: List[BaseMessage]) -> Tuple[str, str]:
        # 1. Fast path regex pre-match check
        if self.is_fast_reception_query(question):
            agent = self.agents["reception_agent"]
            return agent.name, agent.execute(question, chat_history, knowledge_repo)

        # 2. LLM Supervisor intent classification
        target_agent_name = self.classify_intent(question, chat_history)

        # 3. Polymorphic delegation
        target_agent = self.agents.get(target_agent_name, self.agents["reception_agent"])
        return target_agent.name, target_agent.execute(question, chat_history, knowledge_repo)
```

---

## 📦 3. Repository Pattern (`KnowledgeRepository`)

The [services/knowledge_repository.py](file:///d:/CSE-bot/server/services/knowledge_repository.py) module decouples data retrieval logic from business execution.

```python
class KnowledgeRepository:
    INTENT_MAP = {
        "faculty": ["professors", "yuvaraj", "assessment_committee", "corporate_board"],
        "curriculum": ["semester_curriculum", "professional_electives", "curriculum_overview", "industry_courses", "curriculum_faq"],
        "placement": ["enhance_learning", "learning_scope", "program_outcomes", "program_details"],
        "reception": ["cvm", "program_scope"],
    }

    def search(self, query: str, category: Optional[str] = None, max_results: int = 5) -> Tuple[str, List[Dict[str, Any]]]:
        ...
```

### Pattern Benefits:
- **Centralized Data Access**: Agents request context via `repo.search(query, category)`, shielding agents from SQLAlchemy session management, table names, or scoring algorithms.

---

## 🏭 4. Dynamic Factory Pattern (`get_sector_model`)

The [db.py](file:///d:/CSE-bot/server/db.py) module generates SQLAlchemy ORM Model classes dynamically at runtime for any given table name.

```python
_SECTOR_MODEL_CACHE: Dict[str, Type] = {}

def get_sector_model(table_name: str) -> Type:
    clean_name = table_name.lower().strip().replace("-", "_").replace(" ", "_")
    if clean_name in _SECTOR_MODEL_CACHE:
        return _SECTOR_MODEL_CACHE[clean_name]

    class_name = "".join(part.capitalize() for part in clean_name.split("_")) + "Model"
    attributes = {
        "__tablename__": clean_name,
        "id": Column(Integer, primary_key=True, autoincrement=True),
        "section_title": Column(String(255), nullable=False),
        "content": Column(Text, nullable=False),
        "metadata_json": Column(JSON, nullable=True),
        "is_active": Column(Boolean, default=True),
        ...
    }

    model_cls = type(class_name, (Base,), attributes)
    _SECTOR_MODEL_CACHE[clean_name] = model_cls
    return model_cls
```

---

## 🔒 5. Singleton Configuration (`AppConfig`)

The [config.py](file:///d:/CSE-bot/server/config.py) module uses a thread-safe Singleton pattern to manage environment variables and initialize LLM instances lazily.

```python
class AppConfig:
    _instance: Optional['AppConfig'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AppConfig, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    @property
    def llm(self) -> ChatGroq:
        if self._llm is None:
            self._llm = ChatGroq(
                model_name="llama-3.3-70b-versatile",
                groq_api_key=self.groq_api_key,
                temperature=0.3
            )
        return self._llm
```

---

## 🛡️ 6. Thread-Safe Session History Manager (`SessionHistoryManager`)

The [main.py](file:///d:/CSE-bot/server/main.py) module implements a thread-safe sliding window session memory store using `threading.Lock()`.

```python
class SessionHistoryManager:
    def __init__(self, max_history_turns: int = 6):
        self.history: Dict[str, List[BaseMessage]] = {}
        self._lock = threading.Lock()
        self.max_history_turns = max_history_turns

    def get_history(self, session_id: str) -> List[BaseMessage]:
        with self._lock:
            return self.history.get(session_id, [])

    def add_message(self, session_id: str, message: BaseMessage):
        with self._lock:
            if session_id not in self.history:
                self.history[session_id] = []
            self.history[session_id].append(message)
            limit = self.max_history_turns * 2
            if len(self.history[session_id]) > limit:
                self.history[session_id] = self.history[session_id][-limit:]
```
