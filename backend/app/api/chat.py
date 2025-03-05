from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional

from ..db.database import get_db
from ..db.models import JournalEntry
from ..models.chat import ChatInput, ChatResponse, ChatMessage
from ..services.context_chat import ContextChatService

router = APIRouter(prefix="/chat", tags=["chat"])

# Initialize the context chat service
context_chat_service = ContextChatService()

@router.post("/message", response_model=ChatResponse)
async def chat_message(
    chat_input: ChatInput,
    db: AsyncSession = Depends(get_db)
) -> ChatResponse:
    """Process a chat message using full journal context"""
    try:
        # Get the chat history
        chat_history = chat_input.history
        
        # Process the message using the context chat service
        response = await context_chat_service.process_message(
            message=chat_input.message,
            chat_history=chat_history,
            db=db
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")