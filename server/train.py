import os
import sys
import asyncio
import logging
import numpy as np
from typing import List, Set
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Import modules from local directory
from config import (
    KNOWLEDGE_DIR,
    CHROMA_DB_DIR,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DEVICE,
    SEMANTIC_DEDUPLICATION_THRESHOLD
)
from document_processor import SemanticStructuralSplitter
from cache_manager import IncrementalCache
from enricher import LLMEnricher

# Setup Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("RAG_TRAINING_PIPELINE")


def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """Calculates cosine similarity between two vectors."""
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))


def deduplicate_chunks(chunks: List[Document], embeddings_model) -> List[Document]:
    """
    Removes exact duplicate chunks (using content hashing) and near-duplicates 
    (using vector cosine similarity).
    """
    if not chunks:
        return []
    
    # 1. Exact content hash deduplication
    unique_by_hash = []
    seen_hashes: Set[str] = set()
    
    for chunk in chunks:
        content = chunk.metadata.get("original_content", chunk.page_content)
        content_hash = IncrementalCache.compute_hash(content)
        if content_hash not in seen_hashes:
            seen_hashes.add(content_hash)
            unique_by_hash.append(chunk)
            
    logger.info(f"Filtered exact duplicates: {len(chunks)} -> {len(unique_by_hash)} chunks")
    
    if len(unique_by_hash) <= 1:
        return unique_by_hash

    # 2. Near-duplicate semantic deduplication (similarity threshold)
    logger.info("Performing semantic deduplication on the indexing batch...")
    
    # Compute embeddings for all candidate chunks
    texts_to_embed = [c.page_content for c in unique_by_hash]
    try:
        embeddings = embeddings_model.embed_documents(texts_to_embed)
    except Exception as e:
        logger.error(f"Failed to generate embeddings for deduplication: {e}")
        return unique_by_hash # Fallback to hash-only if embedding fails
        
    final_chunks = []
    final_embeddings = []
    
    for idx, chunk in enumerate(unique_by_hash):
        current_emb = np.array(embeddings[idx])
        is_duplicate = False
        
        # Compare with already accepted chunks
        for accepted_emb in final_embeddings:
            sim = cosine_similarity(current_emb, accepted_emb)
            if sim >= SEMANTIC_DEDUPLICATION_THRESHOLD:
                is_duplicate = True
                logger.info(
                    f"Skipping semantic near-duplicate chunk: "
                    f"'{chunk.metadata.get('section_title')}' (similarity: {sim:.3f})"
                )
                break
                
        if not is_duplicate:
            final_chunks.append(chunk)
            final_embeddings.append(current_emb)
            
    logger.info(f"Filtered semantic duplicates: {len(unique_by_hash)} -> {len(final_chunks)} chunks")
    return final_chunks


async def main_async():
    logger.info("Initializing RAG Redesigned Training Pipeline...")
    
    # 1. Load Cache and check file states
    cache = IncrementalCache()
    
    if not os.path.exists(KNOWLEDGE_DIR):
        logger.error(f"Knowledge directory '{KNOWLEDGE_DIR}' not found. Please create it.")
        return
        
    # Get all text files in the knowledge directory
    knowledge_files = []
    for root, _, files in os.walk(KNOWLEDGE_DIR):
        for file in files:
            if file.endswith(".txt"):
                knowledge_files.append(os.path.join(root, file))
                
    # Detect changes
    deleted_files = []
    modified_or_new_files = []
    
    # Check for deleted files
    cached_paths = list(cache.data["files"].keys())
    for cached_path in cached_paths:
        if not os.path.exists(cached_path):
            deleted_files.append(cached_path)
            
    # Check for modified or new files
    for filepath in knowledge_files:
        if cache.is_file_changed(filepath):
            modified_or_new_files.append(filepath)
            
    if not deleted_files and not modified_or_new_files:
        logger.info("[SUCCESS] Vector database is up-to-date. No files changed. Indexing skipped.")
        return

    logger.info(f"Changes detected:")
    logger.info(f"  - New/Modified files: {len(modified_or_new_files)}")
    logger.info(f"  - Deleted files: {len(deleted_files)}")

    # 2. Load Embedding Model
    logger.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME} on {EMBEDDING_DEVICE}...")
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL_NAME,
            model_kwargs={"device": EMBEDDING_DEVICE}
        )
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")
        return

    # 3. Load existing Vector Store or create a new one
    logger.info("Connecting to Vector Database...")
    vector_store = Chroma(
        persist_directory=CHROMA_DB_DIR,
        embedding_function=embeddings
    )

    # 4. Handle Deleted Files
    for filepath in deleted_files:
        filename = os.path.basename(filepath)
        logger.info(f"Removing deleted file from database: {filename}")
        try:
            # Delete vectors matching this source filename
            vector_store.delete(where={"source": filename})
            cache.remove_file(filepath)
        except Exception as e:
            logger.error(f"Error removing {filename} from DB: {e}")

    # 5. Process and split new/modified files
    all_new_chunks = []
    splitter = SemanticStructuralSplitter()
    
    for filepath in modified_or_new_files:
        filename = os.path.basename(filepath)
        logger.info(f"Processing and splitting: {filename}")
        
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
                
            doc = Document(page_content=content, metadata={"source": filename})
            # Split the document structurally & recursively
            chunks = splitter.split_document(doc)
            all_new_chunks.extend(chunks)
            logger.info(f"Generated {len(chunks)} chunks for {filename}")
        except Exception as e:
            logger.error(f"Failed to process file {filename}: {e}")

    if all_new_chunks:
        # 6. Enrich chunks using LLM
        try:
            enricher = LLMEnricher()
            enriched_chunks = await enricher.enrich_all_chunks(all_new_chunks, cache)
        except Exception as e:
            logger.error(f"Knowledge enrichment failed: {e}")
            logger.info("Proceeding without semantic enrichment...")
            enriched_chunks = all_new_chunks

        # 7. Deduplicate new chunks
        cleaned_chunks = deduplicate_chunks(enriched_chunks, embeddings)
        
        # 8. Upsert in Chroma (Delete old vectors of modified files before inserting new ones)
        for filepath in modified_or_new_files:
            filename = os.path.basename(filepath)
            logger.info(f"Cleaning existing vectors for modified file: {filename}")
            try:
                vector_store.delete(where={"source": filename})
            except Exception as e:
                logger.warning(f"No existing vectors or error deleting for {filename}: {e}")
                
        # Insert chunks with deterministic IDs based on content hash
        if cleaned_chunks:
            logger.info(f"Writing {len(cleaned_chunks)} chunks to vector database...")
            try:
                chunk_ids = []
                for chunk in cleaned_chunks:
                    orig_content = chunk.metadata.get("original_content", chunk.page_content)
                    content_hash = IncrementalCache.compute_hash(orig_content)
                    chunk_ids.append(content_hash)
                    
                vector_store.add_documents(documents=cleaned_chunks, ids=chunk_ids)
                logger.info("Chroma database upsert successful.")
            except Exception as e:
                logger.error(f"Failed to insert documents into Chroma: {e}")
                return
    else:
        logger.info("No new chunks to insert.")

    # 9. Update cache and save
    for filepath in modified_or_new_files:
        cache.update_file(filepath)
        
    cache.save()
    logger.info("[SUCCESS] Training pipeline execution completed successfully!")


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()