# CSE-Bot — Intelligent Multi-Agent AI Assistant

![CSE-Bot Interface & Architecture](./client/public/readme.png)

## Overview & Description

**CSE-Bot** is an intelligent, multi-agent AI assistant designed for the **Department of Computer Science & Engineering (CSE)** at **Sri Eshwar College of Engineering (SECE)**. Powered by React 19, Vite, Tailwind CSS v4, FastAPI, LangChain, Groq (Llama-3.3-70b-versatile), and PostgreSQL, CSE-Bot delivers real-time, context-grounded assistance across department governance, academic planning, programming mentorship, and career development.

The system utilizes a **Supervisor Router** that inspects incoming user queries and dynamically delegates them to one of **5 specialized domain AI agents**:

1. **Faculty Directory Specialist (`faculty_agent`)**: Provides instant information on professors, Head of Department (HoD), designations, research domains, email contacts, and committee leadership (UG PAC, Corporate Board).
2. **Curriculum & Syllabus Specialist (`curriculum_agent`)**: Guides students through semester course distributions, course syllabi, professional electives, industry-offered courses, and credit requirements.
3. **CS Programming & Algorithm Tutor (`tutor_agent`)**: Mentors students in programming syntax (Python, C++, Java, SQL), data structures, algorithm complexities ($O(n \log n)$), and code debugging.
4. **Career & Placement Coach (`placement_agent`)**: Details Centers of Excellence (CoEs), hackathons, skill development labs, student achievements, placement highlights, and Program Outcomes (POs).
5. **Multi-Lingual Receptionist (`reception_agent`)**: Handles casual greetings (English, Tamil, Tanglish, Hindi), farewells, department vision and mission explanations, and general pleasantries.

---

## Comprehensive Documentation

Detailed technical documentation suites for developers, maintainers, and system administrators are available in the repository:

- **[Client Documentation Suite](file:///d:/CSE-bot/client_documentation/README.md)**: Architectural breakdown, OOP design patterns, component functions, Material 3 design system, mobile responsive layout fixes, and developer setup guide.
- **[Server Documentation Suite](file:///d:/CSE-bot/server_documentation/README.md)**: FastAPI backend architecture, Supervisor intent classification, polymorphic agent hierarchy, PostgreSQL knowledge repository, and deployment blueprints (credentials sanitized).