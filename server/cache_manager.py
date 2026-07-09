import os
import json
import hashlib
from typing import Dict, Any, Optional
from config import CACHE_FILE

class IncrementalCache:
    """Manages files and chunk enrichment caching to support incremental RAG indexing."""
    
    def __init__(self, cache_path: str = CACHE_FILE):
        self.cache_path = cache_path
        self.data = self._load_cache()

    def _load_cache(self) -> Dict[str, Any]:
        if os.path.exists(self.cache_path):
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load cache file, starting fresh. Error: {e}")
        
        return {
            "files": {},        # filepath -> {"hash": str, "mtime": float}
            "enrichments": {}   # content_hash -> enrichment_dict
        }

    def save(self):
        """Persists the cache data back to disk."""
        try:
            os.makedirs(os.path.dirname(self.cache_path), exist_ok=True)
            with open(self.cache_path, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving cache to disk: {e}")

    @staticmethod
    def compute_hash(text: str) -> str:
        """Computes SHA-256 hash of a string."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def get_file_mtime_and_hash(self, filepath: str) -> tuple[float, str]:
        """Gets the last modified time and content hash of a file."""
        mtime = os.path.getmtime(filepath)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        file_hash = self.compute_hash(content)
        return mtime, file_hash

    def is_file_changed(self, filepath: str) -> bool:
        """Determines if a file has been modified or is new since the last cache update."""
        if not os.path.exists(filepath):
            return True
        
        cached_file = self.data["files"].get(filepath)
        if not cached_file:
            return True
            
        try:
            current_mtime = os.path.getmtime(filepath)
            if current_mtime != cached_file.get("mtime"):
                # If timestamp is different, check content hash to avoid false positives
                _, current_hash = self.get_file_mtime_and_hash(filepath)
                return current_hash != cached_file.get("hash")
            return False
        except Exception:
            return True

    def update_file(self, filepath: str):
        """Updates the cache record for a file."""
        if os.path.exists(filepath):
            try:
                mtime, file_hash = self.get_file_mtime_and_hash(filepath)
                self.data["files"][filepath] = {
                    "hash": file_hash,
                    "mtime": mtime
                }
            except Exception as e:
                print(f"Error updating file cache for {filepath}: {e}")

    def remove_file(self, filepath: str):
        """Removes a file from the cache tracking."""
        if filepath in self.data["files"]:
            del self.data["files"][filepath]

    def get_cached_enrichment(self, content_hash: str) -> Optional[Dict[str, Any]]:
        """Retrieves cached enrichment data for a chunk's content hash."""
        return self.data["enrichments"].get(content_hash)

    def set_cached_enrichment(self, content_hash: str, enrichment_data: Dict[str, Any]):
        """Caches enrichment data for a chunk's content hash."""
        self.data["enrichments"][content_hash] = enrichment_data
