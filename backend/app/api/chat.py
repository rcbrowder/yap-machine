from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional

from ..db.vectordb import vector_db
from ..db.database import get_db
from ..db.models import JournalEntry
from ..models.chat import ChatInput, ChatResponse, ChatMessage
from ..services.rag_chat import RAGChatService

router = APIRouter(prefix="/chat", tags=["chat"])

# Initialize the RAG chat service
rag_chat_service = RAGChatService()

@router.post("/message", response_model=ChatResponse)
async def chat_message(
    chat_input: ChatInput,
    db: AsyncSession = Depends(get_db)
) -> ChatResponse:
    """Process a chat message using RAG to retrieve relevant journal entries"""
    try:
        # Get the chat history
        chat_history = chat_input.history
        
        # Process the message using the RAG chat service
        response = await rag_chat_service.process_message(
            message=chat_input.message,
            chat_history=chat_history,
            db=db
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}") 