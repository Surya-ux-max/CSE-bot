# SKILLS.md — CSE-Bot Skill Catalog & Tool Specifications

This document catalogs the executable skills and tools available to the 5 specialized agents in the CSE-bot system.

---

## 🛠️ 1. PostgreSQL Database Retrieval Skill (`db_search_skill`)

* **Skill Name**: `db_search_skill`
* **Used By**: `faculty_agent`, `curriculum_agent`, `placement_agent`, `reception_agent`
* **Description**: Performs PostgreSQL text search across 15 dedicated knowledge sector tables (`professors`, `semester_curriculum`, `assessment_committee`, etc.).
* **Input**: `query` (string), `target_tables` (list of table names)
* **Output**: Formatted text context containing section titles, contents, and update timestamps (`updated_at`).

---

## 🛠️ 2. Multi-Lingual Translation & Detection Skill (`multilingual_skill`)

* **Skill Name**: `multilingual_skill`
* **Used By**: All 5 Agents
* **Description**: Automatically detects the user's natural input language (English, Tamil, Tanglish, Hindi, French, Spanish) and enforces response generation in the matching language.
* **Output Rules**:
  - Tamil / Tanglish query $\rightarrow$ Tamil / Tanglish response.
  - English query $\rightarrow$ English response.
  - Hindi query $\rightarrow$ Hindi response.

---

## 🛠️ 3. CS Code Generation & Formatting Skill (`code_generation_skill`)

* **Skill Name**: `code_generation_skill`
* **Used By**: `tutor_agent`
* **Description**: Generates production-ready, syntax-highlighted code snippets in Python, C++, Java, C, SQL, or HTML/JS with line-by-line explanations.
* **Formatting Rules**: Must wrap code in triple backticks with specified language (e.g. ` ```cpp `, ` ```python `).

---

## 🛠️ 4. Formatted Markdown & Callout Skill (`rich_formatting_skill`)

* **Skill Name**: `rich_formatting_skill`
* **Used By**: All 5 Agents
* **Description**: Formats responses using impressive markdown typography:
  - `## Section Heading`: Gold-accented section headers.
  - `### Subheading`: Cyber cyan sub-headers.
  - `**Bold Highlights**`: Amber highlighted key text.
  - `* Bullet Points`: Structured itemized lists.
