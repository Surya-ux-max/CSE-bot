import os
from dotenv import load_dotenv

# Load environmental variables
load_dotenv()

# Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KNOWLEDGE_DIR = os.path.join(BASE_DIR, "knowledge")
CHROMA_DB_DIR = os.path.join(BASE_DIR, "chroma_db")
CACHE_FILE = os.path.join(BASE_DIR, "indexing_cache.json")

# Embeddings Configuration
# BAAI/bge-small-en-v1.5 is a top-performing 384-dimensional model.
# Matches the dimensions of MiniLM-L6-v2 but delivers far superior retrieval quality.
EMBEDDING_MODEL_NAME = "BAAI/bge-small-en-v1.5"
EMBEDDING_DEVICE = "cpu" # Change to "cuda" if GPU is available

# LLM Configuration for Knowledge Enrichment
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ENRICHMENT_MODEL = "llama-3.3-70b-versatile"
ENRICHMENT_TEMPERATURE = 0.1

# Chunking Configuration
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Semantic Deduplication Threshold
# Chunks with cosine similarity >= this threshold will be considered duplicates
SEMANTIC_DEDUPLICATION_THRESHOLD = 0.95

# Retrieval Configuration
RELEVANCE_SCORE_THRESHOLD = 0.35  # Cut off irrelevant queries (0.0 to 1.0)
RETRIEVAL_K = 5                  # Number of chunks to retrieve

