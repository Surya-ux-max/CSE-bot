import os
import re
from typing import List, Dict, Any
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import CHUNK_SIZE, CHUNK_OVERLAP

class IntelligentDocumentProcessor:
    """Cleans and standardizes raw text documents before chunking."""
    
    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        
        # Normalize carriage returns
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        
        # Clean lines: remove trailing spaces
        lines = [line.rstrip() for line in text.split("\n")]
        text = "\n".join(lines)
        
        # Normalize consecutive empty lines (limit to max 2 newlines)
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        # Clean formatting remnants (e.g., excessive tab spaces or multiple spaces)
        text = re.sub(r'[ \t]{2,}', ' ', text)
        
        return text.strip()


class SemanticStructuralSplitter:
    """
    A hybrid text splitter that splits documents by their logical sections,
    prepending document and section headers to maintain contextual relevance.
    """
    
    def __init__(self, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.recursive_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def split_document(self, doc: Document) -> List[Document]:
        text = IntelligentDocumentProcessor.clean_text(doc.page_content)
        source_name = os.path.basename(doc.metadata.get("source", "Unknown"))
        doc_title = self._extract_doc_title(text, source_name)
        
        # Split text into sections using common separators like horizontal rules (---)
        # or obvious header markers (e.g., section titles).
        sections = self._split_into_sections(text)
        
        chunks = []
        for section_idx, section in enumerate(sections):
            section_title = section["title"]
            section_content = section["content"]
            
            # If the section content is empty, skip
            if not section_content.strip():
                continue
                
            # If the section is small, create a single chunk
            if len(section_content) <= self.chunk_size:
                chunks.append(self._create_chunk_doc(
                    content=section_content,
                    doc_title=doc_title,
                    section_title=section_title,
                    chunk_idx=0,
                    source_metadata=doc.metadata
                ))
            else:
                # If large, recursively split and add index
                sub_chunks = self.recursive_splitter.split_text(section_content)
                for sub_idx, sub_chunk in enumerate(sub_chunks):
                    chunks.append(self._create_chunk_doc(
                        content=sub_chunk,
                        doc_title=doc_title,
                        section_title=section_title,
                        chunk_idx=sub_idx,
                        source_metadata=doc.metadata
                    ))
                    
        return chunks

    def _extract_doc_title(self, text: str, source_name: str) -> str:
        """Extracts the first line as the document title, or uses the file name."""
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        if lines:
            # Check if first line looks like a title (not too long)
            first_line = lines[0]
            if len(first_line) < 80:
                return first_line
        
        # Fallback to source name
        return os.path.splitext(source_name)[0].replace("_", " ").title()

    def _split_into_sections(self, text: str) -> List[Dict[str, str]]:
        """Splits a document into sections by looking for separators or headers."""
        # Check if the document has horizontal divider lines of 3+ dashes/hyphens
        divider_pattern = re.compile(r'\n-[-]+\n|\n={2,}\n')
        
        parts = divider_pattern.split(text)
        if len(parts) > 1:
            sections = []
            for idx, part in enumerate(parts):
                part = part.strip()
                if not part:
                    continue
                # Try to extract the first line as the section title
                lines = part.split("\n")
                first_line = lines[0].strip()
                
                # If the section is the very first one, it might contain the document title
                if idx == 0:
                    title = "Introduction"
                    content = part
                elif len(first_line) < 60 and first_line:
                    title = first_line
                    content = "\n".join(lines[1:]).strip()
                else:
                    title = f"Section {idx}"
                    content = part
                    
                sections.append({"title": title, "content": content})
            return sections

        # If no divider lines, split by double newlines followed by a potential short header
        lines = text.split("\n")
        sections = []
        current_section_title = "Introduction"
        current_section_lines = []
        
        for line in lines:
            line_stripped = line.strip()
            # A line is a header if it is capitalized, short, and follows empty spaces
            if (line_stripped and len(line_stripped) < 60 and 
                (line_stripped.isupper() or line_stripped.endswith(":") or 
                 (line_stripped[0].isupper() and any(keyword in line_stripped for keyword in ["Coordinator", "Leadership", "Board", "Outcome", "Scope", "Detail", "Professor"])))):
                
                if current_section_lines:
                    sections.append({
                        "title": current_section_title,
                        "content": "\n".join(current_section_lines).strip()
                    })
                current_section_title = line_stripped
                current_section_lines = []
            else:
                current_section_lines.append(line)
                
        if current_section_lines:
            sections.append({
                "title": current_section_title,
                "content": "\n".join(current_section_lines).strip()
            })
            
        return sections

    def _create_chunk_doc(self, content: str, doc_title: str, section_title: str, chunk_idx: int, source_metadata: Dict[str, Any]) -> Document:
        """Prepend metadata headers to page_content and construct Document."""
        # Construct clean page content with injected context
        contextualized_content = (
            f"Document: {doc_title}\n"
            f"Section: {section_title}\n"
            f"Content:\n{content}"
        )
        
        metadata = source_metadata.copy()
        metadata["doc_title"] = doc_title
        metadata["section_title"] = section_title
        metadata["chunk_index"] = chunk_idx
        # Store original raw content so we can retrieve it or use it for LLM response generation
        metadata["original_content"] = content
        
        return Document(page_content=contextualized_content, metadata=metadata)
