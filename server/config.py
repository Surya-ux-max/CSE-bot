import os
from typing import Optional
from dotenv import load_dotenv
from langchain_groq import ChatGroq

class AppConfig:
    """Singleton configuration manager for backend application settings and LLM instances."""
    _instance: Optional['AppConfig'] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AppConfig, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        load_dotenv()
        self.groq_api_key: str = os.getenv("GROQ_API_KEY", "")
        self.database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/CSE_bot")
        
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment settings!")

        self._llm: Optional[ChatGroq] = None

    @property
    def llm(self) -> ChatGroq:
        if self._llm is None:
            print("[AppConfig] Instantiating Groq Llama-3.3-70b LLM Singleton...")
            self._llm = ChatGroq(
                model_name="llama-3.3-70b-versatile",
                groq_api_key=self.groq_api_key,
                temperature=0.3
            )
            print("[AppConfig] LLM Singleton ready.")
        return self._llm


# Global config instance
config = AppConfig()
