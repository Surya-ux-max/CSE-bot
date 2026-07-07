import os
import shutil

from dotenv import load_dotenv

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma


# -------------------------------------------------------
# Load Environment Variables
# -------------------------------------------------------

load_dotenv()


# -------------------------------------------------------
# Load Knowledge Base
# -------------------------------------------------------

print("Loading knowledge base...")

loader = DirectoryLoader(
    "./knowledge",
    glob="**/*.txt",
    loader_cls=TextLoader,
    loader_kwargs={"encoding": "utf-8"}
)

documents = loader.load()

print(f"Loaded {len(documents)} documents.")


# -------------------------------------------------------
# Add Metadata
# -------------------------------------------------------

for doc in documents:
    doc.metadata["source"] = os.path.basename(
        doc.metadata["source"]
    )


# -------------------------------------------------------
# Split Documents
# -------------------------------------------------------

print("Splitting documents...")

splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=150,
    separators=[
        "\n\n",
        "\n",
        ". ",
        " ",
        ""
    ]
)

chunks = splitter.split_documents(documents)

print(f"Generated {len(chunks)} chunks.")


# -------------------------------------------------------
# Load Embedding Model
# -------------------------------------------------------

print("Loading embedding model...")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# -------------------------------------------------------
# Delete Existing Chroma Database
# -------------------------------------------------------

persist_directory = "./chroma_db"

if os.path.exists(persist_directory):
    print("Removing existing Chroma database...")
    shutil.rmtree(persist_directory)


# -------------------------------------------------------
# Create Chroma Database
# -------------------------------------------------------

print("Creating vector database...")

vector_store = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory=persist_directory
)


print("\nTraining Completed Successfully!")
print(f"Vector Database saved at : {persist_directory}")
print(f"Total Documents : {len(documents)}")
print(f"Total Chunks    : {len(chunks)}")