import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional
from ..core.config import CHROMA_DATA_DIR

class ChromaManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChromaManager, cls).__new__(cls)
            cls._instance._client = None
            cls._instance._journal_collection = None
            cls._instance.initialize()
        return cls._instance
    
    def initialize(self):
        """Initialize Chroma client and collections"""
        self._client = chromadb.PersistentClient(
            path=str(CHROMA_DATA_DIR),
            settings=Settings(
                anonymized_telemetry=False
            )
        )
        
        # Get or create the journal collection
        self._journal_collection = self._client.get_or_create_collection(
            name="journal_entries",
            metadata={"hnsw:space": "cosine"}  # Using cosine similarity
        )
    
    @property
    def client(self):
        """Get the ChromaDB client instance"""
        return self._client
    
    @property
    def journal_collection(self):
        """Get the journal entries collection"""
        return self._journal_collection
    
    def add_entry(self, id: str, text: str, metadata: dict = None):
        """Add an entry to the journal collection
        
        Args:
            id: Unique identifier for the entry
            text: Text content to be embedded
            metadata: Additional metadata for the entry
        """
        self.journal_collection.add(
            ids=[id],
            documents=[text],
            metadatas=[metadata or {}]
        )
    
    def update_entry(self, id: str, text: str, metadata: dict = None):
        """Update an existing entry in the journal collection
        
        Args:
            id: Unique identifier for the entry to update
            text: Updated text content to be embedded
            metadata: Updated metadata for the entry
        """
        # Chroma handles upserts automatically
        # If the ID exists, it will update it, otherwise create it
        self.journal_collection.upsert(
            ids=[id],
            documents=[text],
            metadatas=[metadata or {}]
        )
    
    def batch_add_entries(self, ids: List[str], texts: List[str], metadatas: Optional[List[Dict[str, Any]]] = None):
        """Add multiple entries to the journal collection in a single batch
        
        Args:
            ids: List of unique identifiers for the entries
            texts: List of text contents to be embedded
            metadatas: List of metadata dictionaries for the entries
        """
        if metadatas is None:
            metadatas = [{} for _ in ids]
        
        # Make sure all lists have the same length
        if not (len(ids) == len(texts) == len(metadatas)):
            raise ValueError("ids, texts, and metadatas must have the same length")
            
        self.journal_collection.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )
    
    def query_similar(self, query_text: str, n_results: int = 5):
        """Query for similar entries
        
        Args:
            query_text: Text to search for
            n_results: Maximum number of results to return
            
        Returns:
            List of similar entries
        """
        results = self.journal_collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        return results
    
    def get_entries_by_ids(self, ids: List[str]):
        """Get entries by their IDs
        
        Args:
            ids: List of entry IDs to retrieve
            
        Returns:
            Dictionary containing the retrieved entries
        """
        results = self.journal_collection.get(
            ids=ids,
            include=["documents", "metadatas", "embeddings"]
        )
        return results
    
    def delete_entry(self, id: str):
        """Delete an entry from the collection
        
        Args:
            id: Unique identifier for the entry to delete
        """
        self.journal_collection.delete(ids=[id])
    
    def bulk_delete_entries(self, ids: List[str]):
        """Delete multiple entries from the collection
        
        Args:
            ids: List of unique identifiers for the entries to delete
        """
        self.journal_collection.delete(ids=ids)
    
    def get_count(self):
        """Get the count of entries in the journal collection"""
        return self.journal_collection.count()

# Singleton instance
vector_db = ChromaManager() 