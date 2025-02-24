from datetime import datetime
from typing import List
from uuid import uuid4
from fastapi import APIRouter, HTTPException

from ..models.journal import JournalEntry, JournalEntryCreate, JournalEntryUpdate

router = APIRouter(prefix="/journal", tags=["journal"])

# Temporary in-memory store
journal_store: dict[str, JournalEntry] = {}

@router.post("", response_model=JournalEntry)
async def create_entry(entry: JournalEntryCreate) -> JournalEntry:
    entry_id = str(uuid4())
    now = datetime.utcnow()
    journal_entry = JournalEntry(
        id=entry_id,
        created_at=now,
        updated_at=now,
        **entry.model_dump()
    )
    journal_store[entry_id] = journal_entry
    return journal_entry

@router.get("", response_model=List[JournalEntry])
async def list_entries() -> List[JournalEntry]:
    return list(journal_store.values())

@router.get("/{entry_id}", response_model=JournalEntry)
async def get_entry(entry_id: str) -> JournalEntry:
    if entry_id not in journal_store:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return journal_store[entry_id]

@router.patch("/{entry_id}", response_model=JournalEntry)
async def update_entry(entry_id: str, entry_update: JournalEntryUpdate) -> JournalEntry:
    if entry_id not in journal_store:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    stored_entry = journal_store[entry_id]
    update_data = entry_update.model_dump(exclude_unset=True)
    
    updated_entry = JournalEntry(
        id=stored_entry.id,
        created_at=stored_entry.created_at,
        updated_at=datetime.utcnow(),
        title=update_data.get("title", stored_entry.title),
        content=update_data.get("content", stored_entry.content)
    )
    
    journal_store[entry_id] = updated_entry
    return updated_entry

@router.delete("/{entry_id}")
async def delete_entry(entry_id: str) -> dict:
    if entry_id not in journal_store:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    del journal_store[entry_id]
    return {"message": "Entry deleted successfully"} 