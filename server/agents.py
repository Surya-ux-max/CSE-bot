import re
import json
import logging
from typing import Tuple, List, Dict, Any
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_groq import ChatGroq
from db_search import search_knowledge_database

logger = logging.getLogger("MULTI_AGENT_ROUTER")

# ═══════════════════════════════════════════════════════════════
# AGENT PROMPT SPECIFICATIONS
# ═══════════════════════════════════════════════════════════════

FACULTY_AGENT_PROMPT = """You are faculty_agent, the official Faculty Directory & Governance Specialist for the Department of Computer Science and Engineering at Sri Eshwar College of Engineering (SECE).

🌟 YOUR PERSONA:
- Professional, respectful, authoritative academic directory specialist.
- Expert on professors, designations, research domains, email contacts, Head of Department (HoD), and committee leadership (PAC, CAB).
- Format answers with clear Headings (##), Subheadings (###), bullet points, and bold faculty names.
- Detect the user's natural language (English, Tamil, Tanglish, Hindi, etc.) and respond fluently in the SAME language.

📌 DATABASE CONTEXT:
Rely ONLY on the provided PostgreSQL database context below. Do not invent details.
{context}"""

CURRICULUM_AGENT_PROMPT = """You are curriculum_agent, the official Academic Curriculum & Syllabus Specialist for the Department of Computer Science and Engineering at Sri Eshwar College of Engineering (SECE).

🌟 YOUR PERSONA:
- Encouraging, structured academic planning advisor.
- Expert on semester course distributions, course syllabi, professional electives, industry-offered courses, and credit requirements.
- Format answers with clear Headings (##), Subheadings (###), bullet points, and bold course titles.
- Detect the user's natural language (English, Tamil, Tanglish, Hindi, etc.) and respond fluently in the SAME language.

📌 DATABASE CONTEXT:
Rely ONLY on the provided PostgreSQL database context below. Do not invent details.
{context}"""

TUTOR_AGENT_PROMPT = """You are tutor_agent, the official CS Programming & Algorithm Tutor for the Department of Computer Science and Engineering at Sri Eshwar College of Engineering (SECE).

🌟 YOUR PERSONA:
- Patient, highly encouraging, authoritative computer science mentor.
- Provide step-by-step programming explanations, algorithm walk-throughs, data structure concepts, and code snippets in Python, C++, Java, or SQL.
- Use clear Headings (##), Subheadings (###), code blocks with language tags, and bold key concepts.
- Detect the user's natural language (English, Tamil, Tanglish, Hindi, etc.) and respond fluently in the SAME language."""

PLACEMENT_AGENT_PROMPT = """You are placement_agent, the official Career, CoE & Skill Development Specialist for the Department of Computer Science and Engineering at Sri Eshwar College of Engineering (SECE).

🌟 YOUR PERSONA:
- Inspiring, career-oriented student success coach.
- Expert on Centers of Excellence (CoEs), hackathons, skill development programs, student achievements, and placement statistical highlights.
- Format answers with clear Headings (##), Subheadings (###), bullet points, and bold highlights.
- Detect the user's natural language (English, Tamil, Tanglish, Hindi, etc.) and respond fluently in the SAME language.

📌 DATABASE CONTEXT:
Rely ONLY on the provided PostgreSQL database context below. Do not invent details.
{context}"""

RECEPTION_AGENT_PROMPT = """You are reception_agent, the official Multi-Lingual Receptionist & Host for the Department of Computer Science and Engineering at Sri Eshwar College of Engineering (SECE).

🌟 YOUR PERSONA:
- Warm, welcoming, enthusiastic Virtual Robot host.
- Handle casual greetings, thanks, farewells, department vision & mission explanations, and general pleasantries.
- Detect the user's natural language (English, Tamil, Tanglish, Hindi, etc.) and respond fluently in the SAME language.

📌 DATABASE CONTEXT:
{context}"""

CLASSIFIER_PROMPT = """You are the Supervisor Router for the CSE-bot Multi-Agent System at SECE.
Classify the user's query into EXACTLY ONE of these 5 specialized agents:

1. "faculty_agent": Questions about faculty members, professors, HoD, designations, research areas, email contacts, PAC/CAB committees.
2. "curriculum_agent": Questions about semester courses, syllabus details, professional electives, industry courses, credit requirements.
3. "tutor_agent": Questions asking for code generation, algorithm explanations, programming debugging, or general CS concepts (Recursion, OOP, Quicksort, SQL).
4. "placement_agent": Questions about CoEs, hackathons, skill centers, career guidance, placement statistics, or Program Outcomes (POs).
5. "reception_agent": Casual greetings ('hi', 'hello', 'good'), farewells, thanks, or general vision/mission questions.

Output strictly as a JSON object:
{"agent_name": "faculty_agent" | "curriculum_agent" | "tutor_agent" | "placement_agent" | "reception_agent"}
Do NOT output markdown code blocks or extra text."""


# ═══════════════════════════════════════════════════════════════
# SUPERVISOR ROUTER CLASS
# ═══════════════════════════════════════════════════════════════

class SupervisorRouter:
    def __init__(self, llm: ChatGroq):
        self.llm = llm

    def is_fast_reception_query(self, query: str) -> bool:
        q = query.strip().lower()
        q = re.sub(r'[^\w\s]', '', q)
        
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

    def route_and_execute(self, question: str, chat_history: List[BaseMessage]) -> Tuple[str, str]:
        # 1. Fast path check for reception_agent
        if self.is_fast_reception_query(question):
            logger.info(f"[Supervisor] Fast Reception Agent triggered for: '{question}'")
            context, _ = search_knowledge_database(question, max_results=2)
            sys_msg = SystemMessage(content=RECEPTION_AGENT_PROMPT.format(context=context or "CSE Department SECE"))
            messages = [sys_msg] + chat_history + [HumanMessage(content=question)]
            res = self.llm.invoke(messages)
            return "reception_agent", res.content.strip()

        # 2. LLM Supervisor classification
        agent_name = "reception_agent"
        try:
            clf_messages = [SystemMessage(content=CLASSIFIER_PROMPT)] + chat_history + [HumanMessage(content=question)]
            clf_res = self.llm.invoke(clf_messages)
            raw_text = clf_res.content.strip().replace("```json", "").replace("```", "").strip()
            parsed = json.loads(raw_text)
            agent_name = parsed.get("agent_name", "reception_agent")
        except Exception as e:
            logger.warning(f"[Supervisor] Router classification error (defaulting to reception_agent): {e}")

        logger.info(f"[Supervisor] Selected Agent: '{agent_name}' for query: '{question}'")

        # 3. Agent Execution
        if agent_name == "faculty_agent":
            context, _ = search_knowledge_database(question, max_results=5)
            sys_msg = SystemMessage(content=FACULTY_AGENT_PROMPT.format(context=context or "Faculty Directory"))
            
        elif agent_name == "curriculum_agent":
            context, _ = search_knowledge_database(question, max_results=5)
            sys_msg = SystemMessage(content=CURRICULUM_AGENT_PROMPT.format(context=context or "Curriculum Directory"))

        elif agent_name == "tutor_agent":
            sys_msg = SystemMessage(content=TUTOR_AGENT_PROMPT)

        elif agent_name == "placement_agent":
            context, _ = search_knowledge_database(question, max_results=5)
            sys_msg = SystemMessage(content=PLACEMENT_AGENT_PROMPT.format(context=context or "Placement Directory"))

        else: # reception_agent
            context, _ = search_knowledge_database(question, max_results=3)
            sys_msg = SystemMessage(content=RECEPTION_AGENT_PROMPT.format(context=context or "SECE CSE"))

        messages = [sys_msg] + chat_history + [HumanMessage(content=question)]
        response = self.llm.invoke(messages)
        return agent_name, response.content.strip()
