import asyncio
import time
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from cache_manager import IncrementalCache
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, ENRICHMENT_MODEL, ENRICHMENT_TEMPERATURE


class ChunkEnrichment(BaseModel):
    expanded_acronyms: Dict[str, str] = Field(
        default_factory=dict,
        description="Key-value pairs of acronyms/abbreviations in the chunk and their expanded forms (e.g. {'HoD': 'Head of the Department'})."
    )
    synonyms_and_alternate_terms: Dict[str, str] = Field(
        default_factory=dict,
        description="Key-value pairs of key terms in the chunk and their synonyms, alternate terms, or common search variations (e.g. {'syllabus': 'curriculum, subjects', 'faculty': 'professors, teachers'})."
    )
    hypothetical_user_queries: List[str] = Field(
        default_factory=list,
        description="List of exactly 5 diverse user queries (conversational questions, short queries, abbreviations, misspellings, keyword-based searches) that this chunk answers."
    )
    summary: str = Field(
        description="A concise 1-2 sentence context-preserving summary of the chunk."
    )
    extracted_keywords: List[str] = Field(
        default_factory=list,
        description="A list of 5-10 important searchable keywords, technical terms, entities, or concepts in this chunk."
    )
    category: str = Field(
        description="The primary classification category for this chunk (e.g., 'Leadership', 'Faculty', 'Placements', 'Syllabus', 'Committee', 'Facilities', 'Policy')."
    )

class LLMEnricher:
    """Uses OpenRouter LLM (free tier) to enrich documents with semantic search context."""
    
    def __init__(self, api_key: str = OPENROUTER_API_KEY):
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY is not configured in .env")
        
        # OpenRouter is OpenAI-compatible — just swap base_url and api_key
        self.llm = ChatOpenAI(
            model=ENRICHMENT_MODEL,
            api_key=api_key,
            base_url=OPENROUTER_BASE_URL,
            temperature=ENRICHMENT_TEMPERATURE,
            default_headers={
                "HTTP-Referer": "https://github.com/CSE-bot",
                "X-Title": "CSE-bot RAG Enricher"
            }
        )
        self.structured_llm = self.llm.with_structured_output(ChunkEnrichment)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", (
                "You are an expert Enterprise RAG Optimization Analyst specializing in semantic search.\n"
                "Your task is to enrich the given university document chunk with additional metadata "
                "and semantic search context to improve vector retrieval accuracy.\n"
                "Make sure all expansions, synonyms, and queries are strictly domain-appropriate and "
                "preserve factual accuracy without inventing new details outside the chunk."
            )),
            ("human", (
                "Analyze this document chunk and enrich it:\n\n"
                "Document Title: {doc_title}\n"
                "Section: {section_title}\n"
                "Content:\n{chunk_content}\n\n"
                "Generate the semantic enrichment JSON object."
            ))
        ])
        self.chain = self.prompt | self.structured_llm

    async def enrich_chunk(self, doc: Document, cache: IncrementalCache) -> Document:
        """Enriches a single chunk using Groq LLM, leveraging cache if available."""
        original_content = doc.metadata.get("original_content", doc.page_content)
        content_hash = cache.compute_hash(original_content)
        
        # Check cache first — cached chunks never hit the API
        cached_data = cache.get_cached_enrichment(content_hash)
        if cached_data:
            return self._apply_enrichment(doc, cached_data)

        # Not cached — call Groq with retry + backoff
        for attempt in range(3):
            try:
                loop = asyncio.get_event_loop()
                # Truncate content on late attempts if model is struggling with input size
                processing_content = original_content if attempt < 2 else original_content[:1500]
                
                enrichment: ChunkEnrichment = await loop.run_in_executor(
                    None,
                    lambda: self.chain.invoke({
                        "doc_title": doc.metadata.get("doc_title", "Unknown"),
                        "section_title": doc.metadata.get("section_title", "Unknown"),
                        "chunk_content": processing_content
                    })
                )
                enrichment_dict = enrichment.model_dump()
                cache.set_cached_enrichment(content_hash, enrichment_dict)
                return self._apply_enrichment(doc, enrichment_dict)
            except Exception as e:
                error_msg = str(e)
                is_empty_err = "model output must contain either output text or tool calls" in error_msg
                wait = 10 if is_empty_err else 5 * (attempt + 1)
                
                print(f"Error enriching chunk (Attempt {attempt + 1}/3): {e}")
                if attempt < 2:
                    print(f"  Waiting {wait}s before retry...")
                    await asyncio.sleep(wait)
                else:
                    print("Failed to enrich chunk after 3 attempts. Using fallback metadata.")

        # Fallback when all LLM attempts fail
        fallback_dict = {
            "expanded_acronyms": {},
            "synonyms_and_alternate_terms": {},
            "hypothetical_user_queries": [],
            "summary": doc.metadata.get("section_title", "Section detail"),
            "extracted_keywords": [],
            "category": "General"
        }
        return self._apply_enrichment(doc, fallback_dict)

    def _apply_enrichment(self, doc: Document, enrichment: Dict[str, Any]) -> Document:
        """Appends semantic context to page_content and updates metadata."""
        original_content = doc.metadata.get("original_content", doc.page_content)
        
        # Build text context block to append to the document body
        acronyms_str = ", ".join([f"{k} ({v})" for k, v in enrichment["expanded_acronyms"].items()])
        synonyms_str = ", ".join([f"{k} -> {v}" for k, v in enrichment["synonyms_and_alternate_terms"].items()])
        queries_str = "\n".join([f"- {q}" for q in enrichment["hypothetical_user_queries"]])
        keywords_str = ", ".join(enrichment["extracted_keywords"])
        
        enrichment_text = "\n\n[Enriched Search Context]"
        if enrichment["category"]:
            enrichment_text += f"\nCategory: {enrichment['category']}"
        if enrichment["summary"]:
            enrichment_text += f"\nSummary: {enrichment['summary']}"
        if acronyms_str:
            enrichment_text += f"\nAcronyms & Abbreviations: {acronyms_str}"
        if synonyms_str:
            enrichment_text += f"\nSynonyms & Variations: {synonyms_str}"
        if keywords_str:
            enrichment_text += f"\nKeywords: {keywords_str}"
        if queries_str:
            enrichment_text += f"\nExample Search Phrasings:\n{queries_str}"
            
        # Contextualize page_content fully
        doc.page_content = f"Document: {doc.metadata.get('doc_title')}\nSection: {doc.metadata.get('section_title')}\n\n{original_content}\n{enrichment_text}"
        
        # Save enrichment details directly in metadata
        doc.metadata["category"] = enrichment["category"]
        doc.metadata["summary"] = enrichment["summary"]
        doc.metadata["keywords"] = keywords_str
        doc.metadata["acronyms"] = json.dumps(enrichment["expanded_acronyms"])
        doc.metadata["synonyms"] = json.dumps(enrichment["synonyms_and_alternate_terms"])
        
        return doc

    async def enrich_all_chunks(self, chunks: List[Document], cache: IncrementalCache, max_concurrency: int = 5) -> List[Document]:
        """Enriches chunks sequentially with a token-budget delay to stay within Groq TPM limits.
        
        Groq free tier: 12,000 TPM. Each chunk costs ~800-1100 tokens.
        A 5-second gap between API calls keeps us safely under the limit.
        Cached chunks skip the API call entirely and have no delay.
        """
        enriched_chunks = []
        api_call_count = 0
        cached_count = 0
        total = len(chunks)

        print(f"Enriching {total} chunks with Groq LLM (sequential, rate-limited)...")

        for i, chunk in enumerate(chunks):
            original_content = chunk.metadata.get("original_content", chunk.page_content)
            content_hash = cache.compute_hash(original_content)
            is_cached = cache.get_cached_enrichment(content_hash) is not None

            if is_cached:
                cached_count += 1
            else:
                # Throttle: wait 5s before each real API call to stay under 12K TPM
                if api_call_count > 0:
                    await asyncio.sleep(5)
                api_call_count += 1

            enriched = await self.enrich_chunk(chunk, cache)
            enriched_chunks.append(enriched)

            status = "(cached)" if is_cached else f"(API call #{api_call_count})"
            print(f"  [{i + 1}/{total}] {chunk.metadata.get('section_title', 'chunk')[:60]} {status}")

        print(f"Enrichment complete. {cached_count} cached, {api_call_count} API calls made.")
        return enriched_chunks
