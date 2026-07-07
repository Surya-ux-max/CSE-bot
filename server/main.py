import os

from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA

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
# FastAPI
# ==========================================================

app = FastAPI(
    title="CSE-BOT API",
    description="Official AI Assistant for Computer Science and Engineering Department",
    version="1.0.0"
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Change later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# Embedding Model
# ==========================================================

print("Loading Embedding Model...")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

print("Embedding Model Loaded")


# ==========================================================
# Load Chroma Database
# ==========================================================

print("Loading Chroma Database...")

vector_store = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)

print("Vector Database Loaded")


# ==========================================================
# Retriever
# ==========================================================

retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 5,
        "fetch_k": 10
    }
)


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
# Prompt
# ==========================================================

prompt_template = """
You are CSE-BOT, the official AI assistant for the Department of Computer Science and Engineering.

Your responsibilities include helping students, faculty, parents, recruiters, and visitors with accurate information about the department.

Rules:

1. Use ONLY the provided context.

2. Never invent information.

3. If the answer is unavailable in the context, reply:

"I couldn't find that information in the department knowledge base."

4. Keep responses professional.

5. Use bullet points whenever appropriate.

6. Do not mention the retrieved context.

Context:
{context}

Question:
{question}

Answer:
"""

PROMPT = PromptTemplate(
    template=prompt_template,
    input_variables=["context", "question"]
)


# ==========================================================
# RetrievalQA Chain
# ==========================================================

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    return_source_documents=False,
    chain_type_kwargs={
        "prompt": PROMPT
    }
)


# ==========================================================
# Request Model
# ==========================================================

class ChatRequest(BaseModel):
    question: str


# ==========================================================
# Health Check
# ==========================================================

@app.get("/")
def home():

    return {
        "status": "running",
        "message": "CSE-BOT API is running successfully."
    }


# ==========================================================
# Chat Endpoint
# ==========================================================

@app.post("/chat")
def chat(request: ChatRequest):

    result = qa_chain.invoke(
        {
            "query": request.question
        }
    )

    return {
        "answer": result["result"]
    }


# ==========================================================
# Run
# ==========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )