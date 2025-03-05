import os
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from ..db.models import JournalEntry
from ..models.chat import ChatMessage, ChatResponse

from pydantic_ai import Agent, RunContext
from pydantic import BaseModel, Field
from openai import OpenAI

# Set up logging
logger = logging.getLogger(__name__)

# Default system message for the chat
DEFAULT_SYSTEM_MESSAGE = """You are an AI Journal Assistant that helps users analyze and reflect on their journal entries.
You have access to the user's journal entries (provided below in this system message) and can reference specific entries when answering questions.
You will answer questions in the style of the user. 
You are functioning as a second brain for the user. 
The user should feel like they are talking to themselves.
Always be helpful, supportive, and insightful when discussing the user's journal entries.
When a user asks about their journal entries, you should analyze and provide insights based on the content.
IMPORTANT: You already have access to the journal entries in this system message. DO NOT ask the user to provide information from their entries.
IMPORTANT: Do not explicitly tell the user that you were provided with their journal entries in the system prompt. Just use the information naturally."""

class ContextChatService:
    """Service for handling chat functionality with full journal context"""
    
    def __init__(self):
        """Initialize the context chat service with an OpenAI model"""
        try:
            # Initialize the OpenAI client directly
            self.client = OpenAI()
            
            # Initialize the base Pydantic AI agent
            self.agent = Agent(
                'openai:gpt-4o-mini',
                system_prompt=DEFAULT_SYSTEM_MESSAGE
            )
        except Exception as e:
            logger.error(f"Error initializing ContextChatService: {e}")
            raise
    
    def _format_chat_history_as_text(self, history: List[ChatMessage]) -> str:
        """Format the chat history as text for inclusion in a prompt"""
        if not history:
            return "No prior chat history."
            
        formatted_text = ""
        for message in history:
            if message.role == "user":
                formatted_text += f"User: {message.content}\n"
            elif message.role == "assistant":
                formatted_text += f"Assistant: {message.content}\n"
        
        return formatted_text
    
    def _format_journal_entries(self, entries: List[JournalEntry]) -> str:
        """Format journal entries as a string for the system prompt"""
        if not entries:
            return "No journal entries available."
            
        formatted_text = "--- JOURNAL ENTRIES ---\n\n"
        
        for i, entry in enumerate(entries):
            # Format the datetime to a readable string
            created_at = entry.created_at.strftime("%Y-%m-%d %H:%M") if entry.created_at else "Unknown date"
            
            # Add formatted entry
            formatted_text += f"ENTRY {i+1}: {entry.title} (Created: {created_at})\n"
            formatted_text += f"CONTENT: {entry.content}\n\n"
            
        formatted_text += "--- END OF JOURNAL ENTRIES ---\n\n"
        return formatted_text
    
    async def process_message(self, message: str, chat_history: List[ChatMessage], db: AsyncSession) -> ChatResponse:
        """Process a message and generate a response using full journal context"""
        try:
            # Query all journal entries from the database
            result = await db.execute(select(JournalEntry).order_by(JournalEntry.created_at.desc()))
            entries = list(result.scalars().all())
            
            if not entries:
                # No journal entries exist
                return ChatResponse(
                    response="It looks like you don't have any journal entries yet. Try adding some entries first, and then I can help you analyze them!",
                    retrieved_contexts=[]
                )
            
            # Format the journal entries
            journal_context = self._format_journal_entries(entries)
            
            # Create a custom system prompt with journal entries and chat history
            custom_system_prompt = (
                f"{DEFAULT_SYSTEM_MESSAGE}\n\n"
                f"Chat History:\n{self._format_chat_history_as_text(chat_history)}\n\n"
                f"{journal_context}"
            )
            
            # Use Pydantic AI to generate a response
            try:
                # Create an agent with the custom system prompt containing all journal entries
                context_agent = Agent(
                    'openai:gpt-4o-mini',
                    system_prompt=custom_system_prompt
                )
                
                # Run the agent with the user's query
                response = await context_agent.run(message, client=self.client)
                response_text = response.content
            except Exception as e:
                logger.error(f"Error invoking model: {e}")
                # Fall back to a simple response
                response_text = "I'm having trouble analyzing your journal entries right now. Could you try asking a different question?"
            
            # Return the chat response (with empty retrieved_contexts since we're not using RAG)
            return ChatResponse(
                response=response_text,
                retrieved_contexts=[]
            )
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            # Return a graceful error response to the user
            return ChatResponse(
                response="I'm sorry, I encountered an error while processing your message. Please try again or ask a different question.",
                retrieved_contexts=[]
            )