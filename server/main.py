import os
import re
import json
import threading
from typing import Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_groq import ChatGroq

# ==========================================================
# Load Environment Variables
# ==========================================================

load_dotenv()

groq_api_key = os.getenv("GROQ_API_KEY")

if not groq_api_key:
    raise ValueError("GROQ_API_KEY not found in .env")


# ==========================================================
# FastAPI App
# ==========================================================

app = FastAPI(
    title="CSE-BOT API",
    description="Official AI Assistant for Computer Science and Engineering Department at Sri Eshwar College of Engineering",
    version="1.0.0"
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Change later if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# Embedding Model & Chroma Database Initialization
# ==========================================================

print("Loading Embedding Model...")
from config import EMBEDDING_MODEL_NAME, CHROMA_DB_DIR, RETRIEVAL_K, RELEVANCE_SCORE_THRESHOLD
embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL_NAME
)
print("Embedding Model Loaded")

print("Loading Chroma Database...")
vector_store = Chroma(
    persist_directory=CHROMA_DB_DIR,
    embedding_function=embeddings
)
print("Vector Database Loaded")

from typing import List

class EnterpriseRAGRetriever:
    """
    A modular, production-ready retriever interfacing with ChromaDB.
    Supports score thresholding, parent-child context restoration, and
    an extensible architecture for future hybrid and reranking enhancements.
    """
    def __init__(self, vector_store: Chroma, k: int = RETRIEVAL_K, score_threshold: float = RELEVANCE_SCORE_THRESHOLD):
        self.vector_store = vector_store
        self.k = k
        self.score_threshold = score_threshold

    def retrieve(self, query: str, category_filter: Optional[str] = None) -> List[Document]:
        """
        Performs semantic similarity search with score threshold filtering.
        """
        try:
            filter_dict = {"category": category_filter} if category_filter else None
            
            # Chroma returns a list of (Document, score) tuples.
            # Scores represent distance/similarity. We filter out documents below the relevance score threshold.
            docs_with_scores = self.vector_store.similarity_search_with_relevance_scores(
                query, 
                k=self.k,
                filter=filter_dict
            )
            
            filtered_docs = []
            for doc, score in docs_with_scores:
                print(f"[EnterpriseRAGRetriever] Match: '{doc.metadata.get('section_title')}' | Relevance Score: {score:.4f}")
                if score >= self.score_threshold:
                    filtered_docs.append(doc)
                else:
                    print(f"[EnterpriseRAGRetriever] Dropped low-relevance match: score {score:.4f} < {self.score_threshold}")
            
            return filtered_docs
        except Exception as e:
            print(f"Error during enterprise retrieval: {e}")
            # Fallback to simple similarity search
            return self.vector_store.similarity_search(query, k=self.k)

    def restore_parent_context(self, docs: List[Document]) -> str:
        """
        Extracts clean, raw original content (parent context) from chunk metadata.
        Filters out LLM-generated synonyms/questions to keep LLM context sizes minimal and focused.
        """
        if not docs:
            return ""
            
        context_parts = []
        for doc in docs:
            raw_content = doc.metadata.get("original_content", doc.page_content)
            title = doc.metadata.get("doc_title", "General Info")
            section = doc.metadata.get("section_title", "Detail")
            
            context_parts.append(
                f"Source Document: {title}\n"
                f"Section: {section}\n"
                f"Content:\n{raw_content}"
            )
        return "\n\n---\n\n".join(context_parts)

# Initialize the enterprise retriever using configurations
enterprise_retriever = EnterpriseRAGRetriever(vector_store)




# ==========================================================
# LLM
# ==========================================================

print("Loading Groq LLM...")
llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    groq_api_key=groq_api_key,
    temperature=0
)
print("LLM Loaded")


# ==========================================================
# Session Memory Manager
# ==========================================================

class SessionHistoryManager:
    """Manages thread-safe in-memory session history with a sliding window."""
    def __init__(self, max_history_turns: int = 6):
        self.history: Dict[str, List[BaseMessage]] = {}
        self._lock = threading.Lock()
        self.max_history_turns = max_history_turns

    def get_history(self, session_id: str) -> List[BaseMessage]:
        with self._lock:
            if session_id not in self.history:
                self.history[session_id] = []
            return self.history[session_id]

    def add_message(self, session_id: str, message: BaseMessage):
        with self._lock:
            if session_id not in self.history:
                self.history[session_id] = []
            self.history[session_id].append(message)
            # Limit history to self.max_history_turns turns (each turn has User + AI messages)
            limit = self.max_history_turns * 2
            if len(self.history[session_id]) > limit:
                self.history[session_id] = self.history[session_id][-limit:]

    def clear_history(self, session_id: str):
        with self._lock:
            if session_id in self.history:
                del self.history[session_id]

history_manager = SessionHistoryManager(max_history_turns=6)


# ==========================================================
# Prompt Templates and Routing Logic
# ==========================================================

def is_greeting_or_casual(query: str) -> bool:
    """Regex-based classifier to catch common greetings/farewells/thanks with zero tokens."""
    q = query.strip().lower()
    q = re.sub(r'[^\w\s]', '', q)
    
    greetings = {
        "hello", "hi", "hey", "greetings", "good morning", "good afternoon", 
        "good evening", "howdy", "hola", "yo", "namaste", "sup", "welcome"
    }
    farewells = {
        "bye", "goodbye", "see you", "farewell", "quit", "exit"
    }
    appreciation = {
        "thanks", "thank you", "thankyou", "awesome", "great", "cool", "perfect", "ok", "okay"
    }
    identity_queries = {
        "who are you", "what is your name", "whats your name", "what can you do", "what are you",
        "who is csebot", "what is csebot", "tell me about yourself", "how can you help me"
    }
    
    if q in greetings or q in farewells or q in appreciation or q in identity_queries:
        return True
        
    words = q.split()
    if len(words) <= 4:
        if any(w in greetings or w in farewells or w in appreciation for w in words):
            return True
            
    return False


QUERY_ANALYSIS_SYSTEM_PROMPT = (
    "You are the Query Analyst for CSE-BOT, the official AI assistant for the Department of Computer Science "
    "and Engineering at Sri Eshwar College of Engineering (SECE).\n\n"
    "Analyze the conversation history and the latest user query, and classify it into one of these categories:\n"
    "1. \"GREETING_OR_CASUAL\": General greetings, farewells, gratitude, or basic bot identity/capability questions "
    "(e.g., 'hello', 'thanks', 'who are you', 'how can you help me').\n"
    "2. \"GENERAL_ACADEMIC\": General educational, scientific, coding, or technological questions that do NOT ask "
    "about specific details, syllabus, leadership, faculty, or policies of this specific college/department "
    "(e.g., 'Explain recursion', 'Write a quicksort in Python', 'What is database normalization?', 'Explain cloud computing').\n"
    "3. \"DEPARTMENTAL_RAG\": Specific questions regarding the courses, syllabus, curriculum, faculty members, "
    "leadership, coordinators, committees, outcomes, or placements of the CSE department at Sri Eshwar College of Engineering "
    "(e.g., 'Who is the HoD?', 'Who teaches Java?', 'What is the syllabus for Cloud Computing?', 'What are the Program Outcomes?').\n\n"
    "REWRITE RULES FOR SEARCH QUERY:\n"
    "- If the query contains abbreviations or acronyms, ALWAYS expand them to their full semantic forms in the rewritten search_query:\n"
    "  * \"HoD\" / \"HOD\" -> \"Head of the Department\"\n"
    "  * \"CSE\" -> \"Computer Science and Engineering\"\n"
    "  * \"PAC\" -> \"Programme Assessment Committee\"\n"
    "  * \"CAB\" -> \"Corporate Advisory Board\"\n"
    "  * \"PO\" / \"POs\" -> \"Program Outcomes\"\n"
    "  * \"PEO\" / \"PEOs\" -> \"Programme Educational Objectives\"\n"
    "  * \"CoE\" / \"CoEs\" -> \"Centres of Excellence\"\n"
    "  * \"Lab\" / \"Labs\" -> \"Laboratory\"\n"
    "- Correct any obvious spelling mistakes or grammatical irregularities.\n"
    "- Resolve pronoun references using the conversation history (e.g., 'What is his email' -> 'What is Dr. Sivakumar\\'s email').\n"
    "- Produce a clean, search-engine friendly phrase that maximizes matches with the stored knowledge files.\n\n"
    "Output your response strictly as a JSON object with two keys:\n"
    "{\n"
    "  \"category\": \"GREETING_OR_CASUAL\" | \"GENERAL_ACADEMIC\" | \"DEPARTMENTAL_RAG\",\n"
    "  \"search_query\": \"the standalone expanded search query\"\n"
    "}\n"
    "Do NOT output any markdown tags, wrappers, backticks, or explanation. Only output the raw JSON object."
)

CONVERSATIONAL_SYSTEM_PROMPT = (
    "You are CSE-BOT, the official AI assistant for the Department of Computer Science and Engineering "
    "at Sri Eshwar College of Engineering (SECE).\n"
    "Respond to the user's greeting, farewell, appreciation, or casual query warmly, politely, and professionally.\n"
    "Be supportive, approachable, and encourage students, faculty, and visitors. "
    "Help direct them to ask questions about the department's faculty members, courses, committees, "
    "program details, syllabus, outcomes, and placements at Sri Eshwar College of Engineering."
)

GENERAL_ACADEMIC_SYSTEM_PROMPT = (
    "You are CSE-BOT, the official AI assistant for the Department of Computer Science and Engineering "
    "at Sri Eshwar College of Engineering (SECE).\n"
    "You are acting as an experienced academic advisor and highly knowledgeable research assistant.\n"
    "Provide clear, informative, accurate, and constructive responses to general educational, programming, "
    "or technological queries. Demonstrate broad domain expertise across technology, coding, engineering, science, "
    "research, and industry trends.\n"
    "Ensure your tone is supportive, encouraging, and authoritative. Adjust your depth to match the user's experience level, "
    "from beginners to experts, and provide clear code snippets or examples where appropriate."
)

RAG_SYSTEM_PROMPT = """You are CSE-BOT, the official AI assistant for the Department of Computer Science and Engineering at Sri Eshwar College of Engineering (SECE).
Your responsibilities include helping students, faculty, parents, recruiters, and visitors with accurate information about the department.

Guidelines for Answering:
1. Synthesize and connect facts naturally across the provided context (e.g., if a header names a title and a name is below it, understand they are linked).
2. Recognize common synonyms and abbreviations as identical to their full forms (e.g., "HoD" = "Head of the Department", "Lab" = "Laboratory", "Faculty" = "Professor").
3. Rely ONLY on the facts present in the provided context. Do not invent details.
4. If the answer is completely missing from the context, reply exactly:
"I couldn't find that information in the department knowledge base."
5. Use bullet points and clean structure where helpful. Avoid referencing the context itself (e.g., do not say "according to the text" or "in the context").

Context:
{context}"""


def contextualize_query(question: str, chat_history: List[BaseMessage]) -> dict:
    if not chat_history:
        # Fast zero-token pre-match for empty history
        if is_greeting_or_casual(question):
            return {"category": "GREETING_OR_CASUAL", "search_query": question}

    messages = [
        SystemMessage(content=QUERY_ANALYSIS_SYSTEM_PROMPT)
    ] + chat_history + [
        HumanMessage(content=question)
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # Clean markdown codeblocks if LLM returned them
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
        if content.endswith("```"):
            content = content.rsplit("\n", 1)[0]
        content = content.strip()
        if content.startswith("json"):
            content = content[4:].strip()
            
        data = json.loads(content)
        if "category" in data and "search_query" in data:
            return data
    except Exception as e:
        print(f"Error during query analysis: {e}")
        
    # Safe fallback
    return {
        "category": "DEPARTMENTAL_RAG",
        "search_query": question
    }


def get_conversational_response(question: str, chat_history: List[BaseMessage]) -> str:
    messages = [
        SystemMessage(content=CONVERSATIONAL_SYSTEM_PROMPT)
    ] + chat_history + [
        HumanMessage(content=question)
    ]
    response = llm.invoke(messages)
    return response.content.strip()


def get_general_academic_response(question: str, chat_history: List[BaseMessage]) -> str:
    messages = [
        SystemMessage(content=GENERAL_ACADEMIC_SYSTEM_PROMPT)
    ] + chat_history + [
        HumanMessage(content=question)
    ]
    response = llm.invoke(messages)
    return response.content.strip()


def get_rag_response(question: str, context: str, chat_history: List[BaseMessage]) -> str:
    system_content = RAG_SYSTEM_PROMPT.format(context=context)
    messages = [
        SystemMessage(content=system_content)
    ] + chat_history + [
        HumanMessage(content=question)
    ]
    response = llm.invoke(messages)
    return response.content.strip()


# ==========================================================
# Pydantic Request Models
# ==========================================================

class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"


class ClearSessionRequest(BaseModel):
    session_id: str


# ==========================================================
# Endpoints
# ==========================================================

@app.get("/")
def home():
    return {
        "status": "running",
        "message": "CSE-BOT API is running successfully."
    }


@app.post("/chat")
def chat(request: ChatRequest):
    session_id = request.session_id or "default"
    question = request.question.strip()
    
    if not question:
        return {"answer": "Please ask a question."}
        
    history = history_manager.get_history(session_id)
    
    # 1. Analyze user intent and contextualize query
    analysis = contextualize_query(question, history)
    category = analysis.get("category", "DEPARTMENTAL_RAG")
    search_query = analysis.get("search_query", question)
    
    # 2. Route request to appropriate generator
    if category == "GREETING_OR_CASUAL":
        try:
            answer = get_conversational_response(question, history)
        except Exception as e:
            print(f"Error generating conversational response: {e}")
            answer = "Hello! How can I assist you with the Computer Science and Engineering Department at Sri Eshwar College of Engineering today?"
            
    elif category == "GENERAL_ACADEMIC":
        try:
            answer = get_general_academic_response(question, history)
        except Exception as e:
            print(f"Error generating general academic response: {e}")
            answer = "I apologize, I encountered an error while processing your request. Please ask your question again."
            
    else: # DEPARTMENTAL_RAG
        try:
            retrieved_docs = enterprise_retriever.retrieve(search_query)
            context = enterprise_retriever.restore_parent_context(retrieved_docs)
        except Exception as e:
            print(f"Error during enterprise RAG retrieval: {e}")
            context = ""
            
        try:
            answer = get_rag_response(question, context, history)
        except Exception as e:
            print(f"Error generating RAG response: {e}")
            answer = "I'm sorry, I encountered an error while processing your request. Please try again."
            
    # 3. Save to history
    history_manager.add_message(session_id, HumanMessage(content=question))
    history_manager.add_message(session_id, AIMessage(content=answer))
    
    return {
        "answer": answer
    }


@app.post("/session/clear")
def clear_session(request: ClearSessionRequest):
    history_manager.clear_history(request.session_id)
    return {
        "status": "success",
        "message": f"Session history cleared for {request.session_id}"
    }


# ==========================================================
# Run Server
# ==========================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )