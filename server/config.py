import os
from dotenv import load_dotenv

# Load environmental variables
load_dotenv()

# Base Directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# LLM & API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/CSE_bot")
