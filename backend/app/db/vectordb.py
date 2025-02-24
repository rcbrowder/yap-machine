import chromadb
from chromadb.config import Settings
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
    
    def delete_entry(self, id: str):
        """Delete an entry from the collection
        
        Args:
            id: Unique identifier for the entry to delete
        """
        self.journal_collection.delete(ids=[id])
    
    def get_count(self):
        """Get the count of entries in the journal collection"""
        return self.journal_collection.count()

# Singleton instance
vector_db = ChromaManager() 