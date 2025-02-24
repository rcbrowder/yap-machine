from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional
from .journal import JournalEntry

class VectorSearchQuery(BaseModel):
    """Model for vector search queries"""
    query_text: str = Field(..., min_length=1, description="The text to search for similar entries")
    max_results: int = Field(5, ge=1, le=20, description="Maximum number of results to return")
    
    @validator('query_text')
    def query_text_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Query text cannot be empty')
        return v

class VectorSearchResult(BaseModel):
    """Model for vector search results"""
    entry: JournalEntry
    similarity_score: float = Field(..., ge=0, le=1, description="Similarity score between 0 and 1")
    
    class Config:
        from_attributes = True 