from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class JournalEntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntryUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: Optional[str] = Field(None)

class JournalEntry(JournalEntryBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 