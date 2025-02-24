from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any

from ..db.vectordb import vector_db
from ..db.database import get_db
from ..db.models import JournalEntry
from ..models.vector import VectorSearchQuery, VectorSearchResult

router = APIRouter(prefix="/vector", tags=["vector"])

@router.post("/search", response_model=List[VectorSearchResult])
async def search_similar(
    query: VectorSearchQuery,
    db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Search for journal entries similar to the query text"""
    # Perform vector search
    results = vector_db.query_similar(
        query_text=query.query_text,
        n_results=query.max_results
    )
    
    # Get matched IDs
    if not results['ids'][0]:
        return []
    
    entry_ids = results['ids'][0]
    distances = results['distances'][0]
    
    # Fetch the actual journal entries from the database
    entries = []
    for i, entry_id in enumerate(entry_ids):
        # Query the database for the entry
        result = await db.execute(
            select(JournalEntry).where(JournalEntry.id == entry_id)
        )
        db_entry = result.scalar_one_or_none()
        
        if db_entry:
            entries.append({
                "entry": db_entry,
                "similarity_score": 1 - distances[i]  # Convert distance to similarity score
            })
    
    return entries

@router.get("/stats")
async def get_vector_stats():
    """Get statistics about the vector database"""
    try:
        count = vector_db.get_count()
        return {
            "status": "ok",
            "entry_count": count,
            "collection_name": vector_db.journal_collection.name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accessing vector database: {str(e)}")

@router.post("/sync")
async def sync_vectors(
    db: AsyncSession = Depends(get_db)
):
    """Sync all journal entries to the vector database"""
    # Get all entries from SQL database
    result = await db.execute(select(JournalEntry))
    db_entries = list(result.scalars().all())
    
    # Clear existing collection and re-add all entries
    # (A more sophisticated approach would be to only add new/changed entries)
    try:
        # First, get existing IDs to delete
        existing_count = vector_db.get_count()
        
        # Add each entry to vector database
        for entry in db_entries:
            # Combine title and content for better semantic search
            full_text = f"{entry.title}\n\n{entry.content}"
            metadata = {
                "title": entry.title,
                "created_at": entry.created_at.isoformat(),
                "updated_at": entry.updated_at.isoformat()
            }
            
            # Add to vector database
            vector_db.add_entry(
                id=entry.id,
                text=full_text,
                metadata=metadata
            )
        
        return {
            "status": "success",
            "previous_count": existing_count,
            "current_count": vector_db.get_count(),
            "synced_entries": len(db_entries)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing to vector database: {str(e)}") 