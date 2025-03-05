from datetime import datetime
from typing import List
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.journal import JournalEntry as JournalEntrySchema
from ..models.journal import JournalEntryCreate, JournalEntryUpdate
from ..db.database import get_db
from ..db.models import JournalEntry

router = APIRouter(prefix="/journal", tags=["journal"])

@router.post("", response_model=JournalEntrySchema)
async def create_entry(
    entry: JournalEntryCreate,
    db: AsyncSession = Depends(get_db)
) -> JournalEntry:
    db_entry = JournalEntry(
        id=str(uuid4()),
        title=entry.title,
        content=entry.content
    )
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    
    return db_entry

@router.get("", response_model=List[JournalEntrySchema])
async def list_entries(
    db: AsyncSession = Depends(get_db)
) -> List[JournalEntry]:
    result = await db.execute(select(JournalEntry))
    return list(result.scalars().all())

@router.get("/{entry_id}", response_model=JournalEntrySchema)
async def get_entry(
    entry_id: str,
    db: AsyncSession = Depends(get_db)
) -> JournalEntry:
    result = await db.execute(select(JournalEntry).where(JournalEntry.id == entry_id))
    db_entry = result.scalar_one_or_none()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return db_entry

@router.patch("/{entry_id}", response_model=JournalEntrySchema)
async def update_entry(
    entry_id: str,
    entry_update: JournalEntryUpdate,
    db: AsyncSession = Depends(get_db)
) -> JournalEntry:
    result = await db.execute(select(JournalEntry).where(JournalEntry.id == entry_id))
    db_entry = result.scalar_one_or_none()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Update the entry
    if entry_update.title is not None:
        db_entry.title = entry_update.title
    if entry_update.content is not None:
        db_entry.content = entry_update.content
    
    await db.commit()
    await db.refresh(db_entry)
    
    return db_entry

@router.delete("/{entry_id}")
async def delete_entry(
    entry_id: str,
    db: AsyncSession = Depends(get_db)
) -> dict:
    result = await db.execute(select(JournalEntry).where(JournalEntry.id == entry_id))
    db_entry = result.scalar_one_or_none()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    await db.delete(db_entry)
    await db.commit()
    
    return {"detail": "Entry deleted successfully"}