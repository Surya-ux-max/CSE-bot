import re
import json
import logging
from typing import Tuple, List, Dict
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from config import config
from services.knowledge_repository import knowledge_repo
from services.agents import (
    BaseAgent, FacultyAgent, CurriculumAgent, TutorAgent, PlacementAgent, ReceptionAgent, HackathonAgent
)

logger = logging.getLogger("SUPERVISOR_ROUTER")

CLASSIFIER_PROMPT = """You are the Supervisor Router for the CSE-bot Multi-Agent System at SECE.
Classify the user's query into EXACTLY ONE of these 6 specialized agents:

1. "faculty_agent": Questions about faculty members, professors, HoD, designations, research areas, email contacts, PAC/CAB committees.
2. "curriculum_agent": Questions about semester courses, syllabus details, professional electives, industry courses, credit requirements.
3. "tutor_agent": Questions asking for code generation, algorithm explanations, programming debugging, or general CS concepts (Recursion, OOP, Quicksort, SQL).
4. "placement_agent": Questions about CoEs, career guidance, placement statistics, corporate training, job recruitment, or Program Outcomes (POs).
5. "hackathon_agent": Questions about hackathons, Smart India Hackathon (SIH), Google Solution Challenge, coding contests, or broadcasting hackathon announcements.
6. "reception_agent": Casual greetings ('hi', 'hello', 'good'), farewells, thanks, or general vision/mission questions.

Output strictly as a JSON object:
{"agent_name": "faculty_agent" | "curriculum_agent" | "tutor_agent" | "placement_agent" | "hackathon_agent" | "reception_agent"}
Do NOT output markdown code blocks or extra text."""


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
