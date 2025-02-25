from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict, Any, Optional

from ..db.vectordb import vector_db
from ..db.database import get_db
from ..db.models import JournalEntry
from ..models.vector import VectorSearchQuery, VectorSearchResult, VectorUpdateRequest, VectorBatchOperation, VectorGetByIdsRequest

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
            # Ensure similarity score is between 0 and 1
            # Using max to prevent negative values and min to cap at 1
            similarity = max(0, min(1, 1 - distances[i]))
            entries.append({
                "entry": db_entry,
                "similarity_score": similarity
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

@router.post("/update")
async def update_vector_entry(request: VectorUpdateRequest):
    """Update an existing vector entry"""
    try:
        vector_db.update_entry(
            id=request.id,
            text=request.text,
            metadata=request.metadata
        )
        return {"status": "success", "id": request.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating vector entry: {str(e)}")

@router.post("/batch")
async def batch_vector_operations(request: VectorBatchOperation):
    """Perform batch operations on the vector database"""
    try:
        vector_db.batch_add_entries(
            ids=request.ids,
            texts=request.texts,
            metadatas=request.metadatas
        )
        return {
            "status": "success", 
            "count": len(request.ids),
            "operation": "batch_add"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing batch operation: {str(e)}")

@router.post("/get_by_ids")
async def get_entries_by_ids(request: VectorGetByIdsRequest):
    """Get vector entries by their IDs"""
    try:
        entries = vector_db.get_entries_by_ids(request.ids)
        return {
            "status": "success",
            "entries": entries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving vector entries: {str(e)}")

@router.delete("/bulk_delete")
async def bulk_delete_entries(ids: List[str] = Body(...)):
    """Delete multiple entries from the vector database"""
    try:
        vector_db.bulk_delete_entries(ids)
        return {
            "status": "success",
            "deleted_count": len(ids)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting vector entries: {str(e)}")

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