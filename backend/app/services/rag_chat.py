import os
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db.vectordb import vector_db
from ..db.models import JournalEntry
from ..models.chat import ChatMessage, ChatResponse, RetrievedContext

from pydantic_ai import Agent, RunContext
from pydantic import BaseModel, Field
from openai import OpenAI

# Set up logging
logger = logging.getLogger(__name__)

# Default system message for the chat
DEFAULT_SYSTEM_MESSAGE = """You are an AI Journal Assistant that helps users analyze and reflect on their journal entries.
You have access to the user's journal entries and can reference specific entries when answering questions.
You will answer questions in the style of the user. 
You are functioning as a second brain for the user. 
The user should feel like they are talking to themselves.
Always be helpful, supportive, and insightful when discussing the user's journal entries.
When a user asks about their journal entries, you should analyze and provide insights based on the content.
IMPORTANT: You already have access to the relevant journal entries through context retrieval. DO NOT ask the user to provide information from their entries - use the information that has been retrieved for you."""

class RetrieveEntriesParams(BaseModel):
    """Parameters for retrieving journal entries"""
    query: str = Field(..., description="The search query to find relevant journal entries")

class RAGChatService:
    """Service for handling RAG-based chat functionality"""
    
    def __init__(self):
        """Initialize the RAG chat service with an OpenAI model"""
        try:
            # Initialize the OpenAI client directly
            self.client = OpenAI()
            
            # Initialize the Pydantic AI agent
            self.agent = Agent(
                'openai:gpt-4o-mini',
                system_prompt=DEFAULT_SYSTEM_MESSAGE
            )
            
            # Register the retrieve_entries tool
            @self.agent.tool
            async def retrieve_entries(ctx: RunContext, query: str) -> str:
                """
                Retrieve relevant journal entries based on the provided query.
                
                Args:
                    query: The search query to find relevant journal entries
                        
                Returns:
                    A formatted string with the relevant journal entries
                """
                try:
                    # Return a placeholder message since the actual retrieval will be done asynchronously
                    return f"Searching for journal entries related to: {query}"
                except Exception as e:
                    logger.error(f"Error in retrieve_entries tool: {e}")
                    return "Sorry, I encountered an error while retrieving journal entries."
            
        except Exception as e:
            logger.error(f"Error initializing RAGChatService: {e}")
            raise
    
    async def _retrieve_entries_async(self, query: str, n_results: int = 5) -> str:
        """Async implementation of entry retrieval with proper error handling"""
        try:
            # Check if the vector DB is empty first
            if vector_db.get_count() == 0:
                return "You don't have any journal entries yet. Try adding some entries first!"
                
            # Use Chroma's vector search to find relevant entries
            results = vector_db.query_similar(
                query_text=query,
                n_results=n_results
            )
            
            # Check if there are any results
            if not results or not results.get('ids') or not results['ids'][0]:
                return "No relevant journal entries found."
            
            entry_ids = results['ids'][0]
            if not entry_ids:  # Empty list
                return "No relevant journal entries found."
                
            # Safely access distances
            distances = []
            if 'distances' in results and results['distances'] and results['distances'][0]:
                distances = results['distances'][0]
            else:
                # Default distances if not available
                distances = [1.0] * len(entry_ids)
            
            # Create a formatted response
            response = "Here are the relevant journal entries I found:\n\n"
            
            for i, entry_id in enumerate(entry_ids):
                # Safely retrieve the metadata from Chroma
                metadata = {}
                document = ""
                
                if (results.get("metadatas") and 
                    results["metadatas"] and 
                    results["metadatas"][0] and 
                    i < len(results["metadatas"][0])):
                    metadata = results["metadatas"][0][i]
                
                if (results.get("documents") and 
                    results["documents"] and 
                    results["documents"][0] and 
                    i < len(results["documents"][0])):
                    document = results["documents"][0][i]
                
                # Calculate similarity score (1 - distance)
                similarity = 0.0
                if i < len(distances):
                    similarity = max(0, min(1, 1 - distances[i]))
                
                # Format each entry
                response += f"Entry {i+1}: {metadata.get('title', 'Untitled Entry')} "
                response += f"(Created: {metadata.get('created_at', 'Unknown date')})\n"
                response += f"Content: {document[:300] + '...' if len(document) > 300 else document}\n\n"
            
            return response
        
        except Exception as e:
            logger.error(f"Error retrieving entries: {e}")
            return "I encountered an error retrieving journal entries. You might not have any entries yet, or there might be a system issue."
    
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
            elif message.role == "system":
                formatted_text += f"System: {message.content}\n"
        
        return formatted_text
    
    async def retrieve_relevant_entries(self, query: str, n_results: int = 5) -> List[RetrievedContext]:
        """Retrieve relevant journal entries based on the query with robust error handling"""
        try:
            # Check if vector DB is empty first
            if vector_db.get_count() == 0:
                logger.info("Vector database is empty - no entries to retrieve")
                return []
                
            # Use Chroma's vector search to find relevant entries
            results = vector_db.query_similar(
                query_text=query,
                n_results=n_results
            )
            
            # Check if there are any results
            if not results or not results.get('ids') or not results['ids'][0]:
                logger.info("No relevant entries found for query")
                return []
            
            entry_ids = results['ids'][0]
            if not entry_ids:  # Empty list
                logger.info("Empty entry IDs list returned from vector search")
                return []
                
            # Safely access distances
            distances = []
            if 'distances' in results and results['distances'] and results['distances'][0]:
                distances = results['distances'][0]
            else:
                # Default distances if not available
                distances = [1.0] * len(entry_ids)
            
            # Create RetrievedContext objects from the search results
            contexts = []
            for i, entry_id in enumerate(entry_ids):
                try:
                    # Safely retrieve the metadata from Chroma
                    metadata = {}
                    document = ""
                    
                    if (results.get("metadatas") and 
                        results["metadatas"] and 
                        results["metadatas"][0] and 
                        i < len(results["metadatas"][0])):
                        metadata = results["metadatas"][0][i]
                    
                    if (results.get("documents") and 
                        results["documents"] and 
                        results["documents"][0] and 
                        i < len(results["documents"][0])):
                        document = results["documents"][0][i]
                    
                    # Calculate similarity score (1 - distance)
                    similarity = max(0, min(1, 1 - distances[i])) if i < len(distances) else 0.0
                    
                    # Ensure created_at is in the correct format
                    created_at = metadata.get("created_at", "Unknown date")
                    
                    # Try to parse the date if it's a string
                    from datetime import datetime
                    if isinstance(created_at, str) and created_at != "Unknown date":
                        try:
                            # Parse ISO format
                            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        except ValueError:
                            # If parsing fails, leave as is
                            pass
                    
                    # Create a context entry
                    contexts.append(
                        RetrievedContext(
                            entry_id=entry_id,
                            title=metadata.get("title", "Untitled Entry"),
                            content_snippet=document[:300] + "..." if len(document) > 300 else document,
                            similarity_score=similarity,
                            created_at=created_at
                        )
                    )
                except Exception as e:
                    logger.error(f"Error creating context for entry {entry_id}: {e}")
                    # Continue with the next entry
            
            return contexts
        
        except Exception as e:
            logger.error(f"Error retrieving contexts: {e}", exc_info=True)
            return []
    
    async def process_message(self, message: str, chat_history: List[ChatMessage], db: AsyncSession) -> ChatResponse:
        """Process a message and generate a response using RAG"""
        try:
            # Check if the database is empty at the start
            count = vector_db.get_count()
            print(f"DEBUG: Vector DB count in process_message: {count}")
            
            if count == 0:
                # Skip the complex processing and just respond with a simple message
                print("DEBUG: Returning empty database message")
                return ChatResponse(
                    response="It looks like you don't have any journal entries yet. Try adding some entries first, and then I can help you analyze them!",
                    retrieved_contexts=[]
                )
            
            print("DEBUG: Proceeding with RAG processing")
            
            # Try to retrieve relevant entries first
            retrieved_contexts = await self.retrieve_relevant_entries(message)
            
            if retrieved_contexts:
                # Create a context string from entries
                context_str = self._create_context_string(retrieved_contexts)
                
                # Use a custom system prompt with the context and chat history
                custom_system_prompt = (
                    f"{DEFAULT_SYSTEM_MESSAGE}\n\n"
                    f"Chat History:\n{self._format_chat_history_as_text(chat_history)}\n\n"
                    f"Retrieved Journal Entries:\n{context_str}"
                )
                
                # Use Pydantic AI to generate a response
                try:
                    # Create a temporary agent with the custom system prompt
                    temp_agent = Agent(
                        'openai:gpt-4o-mini',
                        system_prompt=custom_system_prompt
                    )
                    
                    # Run the agent with the user's query
                    response = await temp_agent.run(message, client=self.client)
                    response_text = response.content
                except Exception as e:
                    logger.error(f"Error invoking model with direct prompt: {e}")
                    # Fall back to a simple response
                    response_text = f"Based on your journal entries, I can see that you have entries about {', '.join([ctx.title for ctx in retrieved_contexts[:2]])}. How can I help you analyze or reflect on these entries?"
            else:
                # If no relevant entries are found, use the agent's tools
                try:
                    # Custom system prompt with chat history
                    custom_system_prompt = (
                        f"{DEFAULT_SYSTEM_MESSAGE}\n\n"
                        f"Chat History:\n{self._format_chat_history_as_text(chat_history)}"
                    )
                    
                    # Create an agent with the retrieve_entries tool
                    tool_agent = Agent(
                        'openai:gpt-4o-mini',
                        system_prompt=custom_system_prompt
                    )
                    
                    # Register the retrieve entries tool
                    @tool_agent.tool
                    async def retrieve_entries(ctx: RunContext, query: str) -> str:
                        """Retrieve relevant journal entries based on the query."""
                        result = await self._retrieve_entries_async(query)
                        return result
                    
                    # Run the agent
                    response = await tool_agent.run(message, client=self.client)
                    
                    # Extract the response
                    response_text = response.content
                    
                except Exception as e:
                    logger.error(f"Error during model invocation or tool processing: {e}")
                    # Fall back to a direct response without tools
                    response_text = "I couldn't find any specific journal entries related to your query. Would you like to try asking in a different way, or would you like me to help with a general journal question?"
            
            # Return the chat response
            return ChatResponse(
                response=response_text,
                retrieved_contexts=retrieved_contexts
            )
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            # Return a graceful error response to the user
            return ChatResponse(
                response="I'm sorry, I encountered an error while processing your message. Please try again or ask a different question.",
                retrieved_contexts=[]
            )
    
    def _create_context_string(self, contexts: List[RetrievedContext]) -> str:
        """Create a formatted string containing the retrieved contexts"""
        if not contexts:
            return "No relevant journal entries found."
        
        context_str = "Here are the relevant journal entries that should be used to answer the query:\n\n"
        
        for i, context in enumerate(contexts):
            try:
                # Safe conversion for date formatting if needed
                created_at = context.created_at
                if isinstance(created_at, str):
                    try:
                        # Try to parse the date string into a datetime object
                        from datetime import datetime
                        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        # Format as a readable string
                        created_at = created_at.strftime("%Y-%m-%d %H:%M")
                    except Exception:
                        # If parsing fails, just use the string as is
                        pass
                
                context_str += f"Entry {i+1}: {context.title} (Created: {created_at})\n"
                context_str += f"Content: {context.content_snippet}\n\n"
            except Exception as e:
                # If there's any error with a specific context, add a generic entry
                logger.error(f"Error formatting context {i}: {e}")
                context_str += f"Entry {i+1}: [Error displaying entry]\n\n"
        
        context_str += "\nYou MUST use the above information to directly answer the user's query. Do not ask for more information or context."
        
        return context_str 