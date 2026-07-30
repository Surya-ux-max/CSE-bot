from abc import ABC, abstractmethod
from typing import List, Optional
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage
from config import config
from services.knowledge_repository import knowledge_repo, KnowledgeRepository
from services.prompt_loader import render_prompt

# ═══════════════════════════════════════════════════════════════
# ABSTRACT BASE AGENT (Polymorphism & Interface Segregation)
# ═══════════════════════════════════════════════════════════════

class BaseAgent(ABC):
    def __init__(self, name: str, category: Optional[str] = None):
        self.name = name
        self.category = category
        self.llm = config.llm

    @abstractmethod
    def get_system_prompt(self, context: str, user_role: str = "student") -> str:
        """Returns agent-specific prompt template formatted with DB context and user role."""
        pass

    def retrieve_context(self, question: str, repo: KnowledgeRepository) -> str:
        """Retrieves grounded context from KnowledgeRepository."""
        if not self.category:
            return ""
        context_str, _ = repo.search(question, category=self.category, max_results=5)
        return context_str or "No specific database matching records found for this query."

    def execute(self, question: str, history: List[BaseMessage], repo: KnowledgeRepository, user_role: str = "student") -> str:
        """Executes LLM inference with system prompt, memory, and user question."""
        context = self.retrieve_context(question, repo)
        sys_prompt = self.get_system_prompt(context, user_role)
        messages = [SystemMessage(content=sys_prompt)] + history + [HumanMessage(content=question)]
        response = self.llm.invoke(messages)
        return response.content.strip()


# ═══════════════════════════════════════════════════════════════
# CONCRETE AGENT IMPLEMENTATIONS (Markdown Prompt Template Powered)
# ═══════════════════════════════════════════════════════════════

class FacultyAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="faculty_agent", category="faculty")

    def get_system_prompt(self, context: str, user_role: str = "student") -> str:
        if user_role == "faculty":
            role_inst = """
💼 FACULTY DIRECTORY INSTRUCTIONS:
- Address the user professionally. Provide concise details about faculty designations, contacts, and committee roles in 3-4 bullet points."""
        else:
            role_inst = """
🎓 STUDENT DIRECTORY INSTRUCTIONS:
- Provide concise, clear professor email contacts, designations, and office hours in 3-4 bullet points."""

        return render_prompt("faculty_agent", role_instructions=role_inst, context=context)


class CurriculumAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="curriculum_agent", category="curriculum")

    def get_system_prompt(self, context: str, user_role: str = "student") -> str:
        if user_role == "faculty":
            role_inst = """
💼 FACULTY CURRICULUM INSTRUCTIONS:
- Provide concise academic details about course syllabi, credits, and electives.
- Summarize key unit topics and reference books in 4-5 high-density bullet points."""
        else:
            role_inst = """
🎓 STUDENT CURRICULUM INSTRUCTIONS:
- Provide short, student-friendly summaries of course syllabi, credits, and electives.
- Summarize key unit topics and reference books in 4-5 concise bullet points.
- Do NOT generate long textbook chapters or essays."""

        return render_prompt("curriculum_agent", role_instructions=role_inst, context=context)


class TutorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="tutor_agent", category=None) # No DB lookup needed for general coding

    def get_system_prompt(self, context: str, user_role: str = "student") -> str:
        if user_role == "faculty":
            role_inst = """
💼 FACULTY TUTORIAL ASSISTANCE INSTRUCTIONS:
- You are addressing a Faculty member. Assist them in preparing class materials, lecture outlines, and grading rubrics.
- Generate clean programming code examples (with test cases), outline assignment problems, or draft quiz questions with answers to help them teach.
- Frame explanations in a way that is ready for classroom instruction."""
        else:
            role_inst = """
🎓 STUDENT CODING TUTOR INSTRUCTIONS:
- You are addressing a Student. Be a patient, encouraging, step-by-step programming mentor.
- Break down algorithms, explain data structures with analogies, and debug syntax errors gently.
- Avoid simply dumping code; explain *why* it works so the student learns effectively."""

        return render_prompt("tutor_agent", role_instructions=role_inst)


class PlacementAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="placement_agent", category="placement")

    def get_system_prompt(self, context: str, user_role: str = "student") -> str:
        if user_role in ["faculty", "placement_cell", "faculty_coordinator"]:
            role_inst = """
💼 PLACEMENT CELL DIRECT CONTENT PUBLISHER INSTRUCTIONS:
- You operate as an Intelligent Placement Search Engine & Direct Content Publisher.
- Search the database for the latest placement opportunities, corporate training schedules, and placement statistics.
- CRITICAL INSTRUCTION: DO NOT output conversational preamble, greetings, or follow-up chat messages. Output ONLY the clean, structured POSTER CARD announcement template.
- Structure every poster announcement template as follows:
  ## **[Company Name] Placement Drive Announcement**
  ### **[Job Title / Role]**
  - **Company Name:** [Company Name]
  - **Job Title:** [Job Title / Role]
  - **Eligibility:** All CSE Students & Faculty
  - **Deadline:** [Deadline Date]
  - **Apply Link:** [Registration Portal Link]
  - **Overview & Description:** [Concise summary of drive requirements and role details]"""
        else:
            role_inst = """
🎓 STUDENT PLACEMENT & OPPORTUNITY RADAR INSTRUCTIONS:
- You are addressing a Student. Search and present active placement drives, requirements, dates, and training schedules.
- Structure responses clearly with bold headers and bullet points."""

        return render_prompt("placement_agent", role_instructions=role_inst, context=context)


class ReceptionAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="reception_agent", category="reception")

    def get_system_prompt(self, context: str, user_role: str = "student") -> str:
        if user_role == "faculty":
            role_inst = """
💼 FACULTY GREETINGS & GENERAL CONTEXT:
- Address the user as a respected Faculty colleague. Be polite, formal, and helpful.
- Assist them with general questions about the department's vision, mission, or administrative updates."""
        else:
            role_inst = """
🎓 STUDENT GREETINGS & GENERAL CONTEXT:
- Address the user as a student. Use Chitti's iconic Enthiran catchphrases ("Speed 1 Terahertz, Memory 1 Zettabyte! Hi, I am Chitti the Robot!").
- Keep them excited and interested in the CSE department's academic environment."""

        return render_prompt("reception_agent", role_instructions=role_inst, context=context)


class HackathonAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="hackathon_agent", category="placement")

    def get_system_prompt(self, context: str, user_role: str = "student") -> str:
        if user_role in ["faculty", "placement_cell", "faculty_coordinator"]:
            role_inst = """
💼 PLACEMENT CELL & HACKATHON DIRECT CONTENT PUBLISHER INSTRUCTIONS:
- You operate as an Intelligent Hackathon Search Engine & Direct Content Publisher.
- Search the database for active hackathons, Smart India Hackathon (SIH 2026), Google Solution Challenge, coding contests, and team registrations.
- When requested to publish, post, or announce a hackathon or contest:
  1. Extract and structure all contest details (Hackathon Title, Description, Deadline, Registration/Apply Link, Category).
  2. Format the response as a clean, high-impact POSTER CARD announcement template for the Hackathon Hub.
  3. Direct the platform to publish this hackathon directly to the Hackathon Hub database so it immediately appears as an active Poster Card on Student & Faculty dashboards.
  4. Explicitly notify the user: "🚀 *This hackathon has been published directly to the Hackathon Hub! Students & Faculty can now view this poster on their Hackathon Hub dashboard.*" """
        else:
            role_inst = """
🎓 STUDENT HACKATHON RADAR INSTRUCTIONS:
- You are addressing a Student. Search and present details on active hackathons (SIH 2026, Google Solution Challenge), CoE coding contests, project ideation, and team building tips.
- Guide them to view published hackathon posters on their Hackathon Hub dashboard."""

        return render_prompt("hackathon_agent", role_instructions=role_inst, context=context)
