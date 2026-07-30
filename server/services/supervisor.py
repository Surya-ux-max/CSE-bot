import re
import json
import logging
from typing import Tuple, List, Dict
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from config import config
from services.knowledge_repository import knowledge_repo
from services.prompt_loader import load_prompt_template
from services.agents import (
    BaseAgent, FacultyAgent, CurriculumAgent, TutorAgent, PlacementAgent, ReceptionAgent, HackathonAgent
)

logger = logging.getLogger("SUPERVISOR_ROUTER")

CLASSIFIER_PROMPT = load_prompt_template("supervisor_agent")



class SupervisorRouter:
    """Strategy Pattern router for intent classification and polymorphic agent delegation."""
    
    def __init__(self):
        self.llm = config.llm
        self.agents: Dict[str, BaseAgent] = {
            "faculty_agent": FacultyAgent(),
            "curriculum_agent": CurriculumAgent(),
            "tutor_agent": TutorAgent(),
            "placement_agent": PlacementAgent(),
            "hackathon_agent": HackathonAgent(),
            "reception_agent": ReceptionAgent(),
        }

    def is_fast_reception_query(self, query: str) -> bool:
        """Regex pre-match check to handle common greetings with zero classification latency."""
        q = re.sub(r'[^\w\s]', '', query.strip().lower())
        casual = {
            "hello", "hi", "hey", "greetings", "good morning", "good afternoon", 
            "good evening", "howdy", "hola", "yo", "namaste", "sup", "welcome", "vanakkam",
            "good", "great", "awesome", "cool", "perfect", "ok", "okay", "nice", "super",
            "thanks", "thank you", "thankyou", "fine", "bye", "goodbye", "see you",
            "who are you", "what is your name", "whats your name", "what can you do"
        }
        if q in casual:
            return True
        words = q.split()
        if len(words) <= 3 and any(w in casual for w in words):
            return True
        return False

    def route_and_execute(self, question: str, chat_history: List[BaseMessage], user_role: str = "student") -> Tuple[str, str]:
        """Classifies intent and delegates execution to target polymorphic agent instance."""
        # 1. Fast path reception check
        if self.is_fast_reception_query(question):
            agent = self.agents["reception_agent"]
            answer = agent.execute(question, chat_history, knowledge_repo, user_role)
            return agent.name, answer

        # 2. LLM Supervisor intent classification
        target_agent_name = "reception_agent"
        try:
            clf_messages = [SystemMessage(content=CLASSIFIER_PROMPT)] + chat_history + [HumanMessage(content=question)]
            clf_res = self.llm.invoke(clf_messages)
            raw_text = clf_res.content.strip().replace("```json", "").replace("```", "").strip()
            parsed = json.loads(raw_text)
            target_agent_name = parsed.get("agent_name", "reception_agent")
        except Exception as e:
            logger.warning(f"[SupervisorRouter] Classification error (fallback to reception_agent): {e}")

        # 3. Retrieve agent instance & execute
        target_agent = self.agents.get(target_agent_name, self.agents["reception_agent"])
        logger.info(f"[SupervisorRouter] Delegating execution to '{target_agent.name}' for role '{user_role}'")
        
        answer = target_agent.execute(question, chat_history, knowledge_repo, user_role)
        return target_agent.name, answer


# Global router instance
supervisor_router = SupervisorRouter()
