from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional, List
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

class VectorUpdateRequest(BaseModel):
    """Model for updating vector entries"""
    id: str = Field(..., description="ID of the entry to update")
    text: str = Field(..., min_length=1, description="Text content to be embedded")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata for the entry")
    
    @validator('text')
    def text_not_empty(cls, v):
        v = v.strip()
        if not v:
            raise ValueError('Text content cannot be empty')
        return v

class VectorBatchOperation(BaseModel):
    """Model for batch operations on vector entries"""
    ids: List[str] = Field(..., min_items=1, description="List of entry IDs")
    texts: List[str] = Field(..., min_items=1, description="List of text contents to be embedded")
    metadatas: Optional[List[Dict[str, Any]]] = Field(default=None, description="List of metadata dictionaries")
    
    @validator('texts')
    def validate_texts(cls, v, values):
        if 'ids' in values and len(values['ids']) != len(v):
            raise ValueError('Number of texts must match number of IDs')
        return v
    
    @validator('metadatas')
    def validate_metadatas(cls, v, values):
        if v is not None and 'ids' in values and len(values['ids']) != len(v):
            raise ValueError('Number of metadatas must match number of IDs')
        return v

class VectorGetByIdsRequest(BaseModel):
    """Model for getting vector entries by IDs"""
    ids: List[str] = Field(..., min_items=1, description="List of entry IDs to retrieve") 