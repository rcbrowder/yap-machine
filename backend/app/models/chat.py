from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class ChatMessage(BaseModel):
    """Model representing a chat message"""
    role: str = Field(..., description="Role of the message sender (user or assistant)")
    content: str = Field(..., description="Content of the message")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="Timestamp of the message")
    
    @validator('role')
    def validate_role(cls, v):
        allowed_roles = {'user', 'assistant', 'system'}
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of {allowed_roles}")
        return v
    
    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Message content cannot be empty")
        return v

class ChatInput(BaseModel):
    """Model for chat input"""
    message: str = Field(..., min_length=1, description="The message from the user")
    history: List[ChatMessage] = Field(default_factory=list, description="Chat history")
    
    @validator('message')
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError("Message cannot be empty")
        return v

# Keep RetrievedContext for API compatibility, though we won't be using it anymore
class RetrievedContext(BaseModel):
    """Model representing retrieved context from journal entries"""
    entry_id: str = Field(..., description="ID of the retrieved journal entry")
    title: str = Field(..., description="Title of the journal entry")
    content_snippet: str = Field(..., description="Relevant snippet from the journal entry")
    similarity_score: float = Field(..., ge=0, le=1, description="Similarity score")
    created_at: Union[datetime, str] = Field(..., description="Creation date of the entry")
    
    class Config:
        # This ensures that we can pass datetimes, strings, or other serializable types
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
        
    @validator('created_at')
    def validate_created_at(cls, v):
        # If it's already a datetime, return it
        if isinstance(v, datetime):
            return v
        
        # If it's a string, try to parse it
        if isinstance(v, str):
            try:
                # Try ISO format
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                # If parsing fails, keep it as a string
                pass
        
        return v

class ChatResponse(BaseModel):
    """Model for chat response"""
    response: str = Field(..., description="Response message from the assistant")
    retrieved_contexts: Optional[List[RetrievedContext]] = Field(
        default_factory=list, 
        description="Contexts retrieved from journal entries (kept for API compatibility)"
    )
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp of the response")