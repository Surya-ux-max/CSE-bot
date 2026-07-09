import asyncio
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from langchain_core.documents import Document
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from cache_manager import IncrementalCache
from config import GROQ_API_KEY, ENRICHMENT_MODEL, ENRICHMENT_TEMPERATURE


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
    """Uses Groq LLM to enrich documents with semantic search context."""
    
    def __init__(self, api_key: str = GROQ_API_KEY):
        if not api_key:
            raise ValueError("GROQ_API_KEY is not configured.")
        
        self.llm = ChatGroq(
            model_name=ENRICHMENT_MODEL,
            groq_api_key=api_key,
            temperature=ENRICHMENT_TEMPERATURE
        )
        # Configure LLM to output structured JSON matching the Pydantic schema
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

    async def enrich_chunk(self, doc: Document, cache: IncrementalCache, semaphore: asyncio.Semaphore) -> Document:
        """Enriches a single chunk using Groq LLM, leveraging cache if available."""
        original_content = doc.metadata.get("original_content", doc.page_content)
        content_hash = cache.compute_hash(original_content)
        
        # Check cache first
        cached_data = cache.get_cached_enrichment(content_hash)
        if cached_data:
            return self._apply_enrichment(doc, cached_data)
            
        async with semaphore:
            for attempt in range(3): # Simple retry logic
                try:
                    # Run the LangChain chain in an executor since invoke is synchronous
                    loop = asyncio.get_event_loop()
                    enrichment: ChunkEnrichment = await loop.run_in_executor(
                        None, 
                        lambda: self.chain.invoke({
                            "doc_title": doc.metadata.get("doc_title", "Unknown"),
                            "section_title": doc.metadata.get("section_title", "Unknown"),
                            "chunk_content": original_content
                        })
                    )
                    
                    enrichment_dict = enrichment.model_dump()
                    cache.set_cached_enrichment(content_hash, enrichment_dict)
                    return self._apply_enrichment(doc, enrichment_dict)
                except Exception as e:
                    print(f"Error enriching chunk (Attempt {attempt + 1}/3): {e}")
                    if attempt < 2:
                        await asyncio.sleep(2 ** attempt) # Exponential backoff
                    else:
                        print(f"Failed to enrich chunk after 3 attempts. Falling back to default metadata.")
            
            # Fallback when LLM calls fail
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
        """Runs the enrichment in parallel with a concurrency throttle."""
        semaphore = asyncio.Semaphore(max_concurrency)
        tasks = [self.enrich_chunk(chunk, cache, semaphore) for chunk in chunks]
        
        print(f"Enriching {len(chunks)} chunks with Groq LLM (Concurrency limit: {max_concurrency})...")
        enriched_chunks = await asyncio.gather(*tasks)
        print("All chunks enriched successfully.")
        return enriched_chunks
