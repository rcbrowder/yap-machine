from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class ChatMessage(BaseModel):
    """Model representing a chat message"""
    role: str = Field(..., description="Role of the message sender (user, assistant, or system)")
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

class ChatResponse(BaseModel):
    """Model representing a chat response"""
    response: str = Field(..., description="The AI's response to the user's message")
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }