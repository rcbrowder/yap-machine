import os
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..db.vectordb import vector_db
from ..db.models import JournalEntry
from ..models.chat import ChatMessage, ChatResponse, RetrievedContext

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, FunctionMessage, BaseMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langchain.retrievers.multi_query import MultiQueryRetriever

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

class RAGChatService:
    """Service for handling RAG-based chat functionality"""
    
    def __init__(self):
        """Initialize the RAG chat service with an OpenAI model"""
        try:
            # Initialize the language model
            self.llm = ChatOpenAI(
                model="gpt-3.5-turbo",
                temperature=0.7
            )
            
            # Define the tools for the agent
            self.tools = [self._create_retrieval_tool()]
            
            # Create a description of the available tools
            tool_descriptions = [
                {
                    "type": "function",
                    "function": {
                        "name": "retrieve_entries",
                        "description": "Retrieve relevant journal entries based on the provided query",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {
                                    "type": "string",
                                    "description": "The search query to find relevant journal entries"
                                }
                            },
                            "required": ["query"]
                        }
                    }
                }
            ]
            
            # Bind tools to the model using the updated approach
            self.llm_with_tools = self.llm.bind_tools(self.tools)
        except Exception as e:
            logger.error(f"Error initializing RAGChatService: {e}")
            raise
    
    def _create_retrieval_tool(self):
        """Create a tool for retrieving journal entries"""
        @tool("retrieve_entries")
        def retrieve_entries(query: str) -> str:
            """
            Retrieve relevant journal entries based on the provided query.
            
            Args:
                query: The search query to find relevant journal entries
                
            Returns:
                A formatted string with the relevant journal entries
            """
            try:
                # Instead of trying to run the async function with asyncio.run(),
                # we'll return a placeholder message and let the main process handle
                # the entry retrieval asynchronously
                return f"Searching for journal entries related to: {query}"
            except Exception as e:
                logger.error(f"Error in retrieve_entries tool: {e}")
                return "Sorry, I encountered an error while retrieving journal entries."
        
        return retrieve_entries
    
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
    
    def _format_chat_history(self, history: List[ChatMessage]) -> List[BaseMessage]:
        """Format the chat history into LangChain messages"""
        formatted_history = []
        
        for message in history:
            if message.role == "user":
                formatted_history.append(HumanMessage(content=message.content))
            elif message.role == "assistant":
                formatted_history.append(AIMessage(content=message.content))
            elif message.role == "system":
                formatted_history.append(SystemMessage(content=message.content))
        
        return formatted_history
    
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
            # Create a list with the system message
            messages = [SystemMessage(content=DEFAULT_SYSTEM_MESSAGE)]
            
            # Add chat history
            messages.extend(self._format_chat_history(chat_history))
            
            # Add the current user message
            messages.append(HumanMessage(content=message))
            
            # Try to retrieve relevant entries first
            retrieved_contexts = await self.retrieve_relevant_entries(message)
            
            if retrieved_contexts:
                # Create a context string from entries
                context_str = self._create_context_string(retrieved_contexts)
                
                # Direct approach: Create a single prompt that combines instructions, context, and query
                direct_prompt = f"""
System: {DEFAULT_SYSTEM_MESSAGE}

Chat History:
{self._format_chat_history_as_text(chat_history)}

User Query: {message}

Retrieved Journal Entries:
{context_str}

Instructions: Analyze the retrieved journal entries above and provide a direct, helpful response to the user query.
DO NOT ask for additional information - you already have the relevant context.
"""
                
                # Invoke the model directly with the combined prompt
                try:
                    response = self.llm.invoke(direct_prompt)
                    response_text = response.content
                except Exception as e:
                    logger.error(f"Error invoking LLM with direct prompt: {e}")
                    # Fall back to a simple response
                    response_text = f"Based on your journal entries, I can see that you have entries about {', '.join([ctx.title for ctx in retrieved_contexts[:2]])}. How can I help you analyze or reflect on these entries?"
            else:
                # If no relevant entries are found, use the tool-equipped model
                # This will allow it to decide if it wants to use the retrieval tool
                try:
                    response = self.llm_with_tools.invoke(messages)
                    
                    # Log the response structure for debugging
                    logger.info(f"LLM response type: {type(response)}")
                    if hasattr(response, "tool_calls"):
                        logger.info(f"Tool calls type: {type(response.tool_calls)}")
                        if response.tool_calls:
                            logger.info(f"First tool call type: {type(response.tool_calls[0])}")
                            logger.info(f"First tool call content: {str(response.tool_calls[0])}")
                    else:
                        logger.info("Response has no tool_calls attribute")
                    
                    # Check if the model decided to use tools
                    if hasattr(response, "tool_calls") and response.tool_calls:
                        # Process tool calls with enhanced error handling
                        for i, tool_call in enumerate(response.tool_calls):
                            try:
                                logger.info(f"Processing tool call {i}")
                                
                                # Extract tool name and args with extensive error handling
                                tool_name = ""
                                tool_args = {}
                                
                                # Case 1: tool_call is a dictionary
                                if isinstance(tool_call, dict):
                                    logger.info(f"Tool call is a dict with keys: {tool_call.keys()}")
                                    tool_name = tool_call.get('name', '')
                                    tool_args = tool_call.get('args', {})
                                    # If 'name' is not directly in dict, look for it in nested structure
                                    if not tool_name and 'function' in tool_call:
                                        if isinstance(tool_call['function'], dict):
                                            tool_name = tool_call['function'].get('name', '')
                                        elif hasattr(tool_call['function'], 'name'):
                                            tool_name = tool_call['function'].name
                                    
                                    # If args are nested in a 'arguments' or similar field
                                    if not tool_args and 'arguments' in tool_call:
                                        # Arguments might be JSON string or dict
                                        if isinstance(tool_call['arguments'], str):
                                            try:
                                                import json
                                                tool_args = json.loads(tool_call['arguments'])
                                            except:
                                                tool_args = {'query': tool_call['arguments']}
                                        elif isinstance(tool_call['arguments'], dict):
                                            tool_args = tool_call['arguments']
                                    
                                    if not tool_args and 'function' in tool_call and 'arguments' in tool_call['function']:
                                        # Similar handling for nested arguments
                                        if isinstance(tool_call['function']['arguments'], str):
                                            try:
                                                import json
                                                tool_args = json.loads(tool_call['function']['arguments'])
                                            except:
                                                tool_args = {'query': tool_call['function']['arguments']}
                                        elif isinstance(tool_call['function']['arguments'], dict):
                                            tool_args = tool_call['function']['arguments']
                                
                                # Case 2: tool_call is an object with direct attributes
                                elif hasattr(tool_call, 'name') and hasattr(tool_call, 'args'):
                                    logger.info("Tool call has direct name and args attributes")
                                    tool_name = tool_call.name
                                    tool_args = tool_call.args
                                
                                # Case 3: tool_call has a function attribute containing name/args
                                elif hasattr(tool_call, 'function'):
                                    logger.info("Tool call has a function attribute")
                                    if isinstance(tool_call.function, dict):
                                        tool_name = tool_call.function.get('name', '')
                                        # Arguments might be in different formats
                                        if 'arguments' in tool_call.function:
                                            if isinstance(tool_call.function['arguments'], str):
                                                try:
                                                    import json
                                                    tool_args = json.loads(tool_call.function['arguments'])
                                                except:
                                                    tool_args = {'query': tool_call.function['arguments']}
                                            elif isinstance(tool_call.function['arguments'], dict):
                                                tool_args = tool_call.function['arguments']
                                    elif hasattr(tool_call.function, 'name'):
                                        tool_name = tool_call.function.name
                                        if hasattr(tool_call.function, 'arguments'):
                                            tool_args = tool_call.function.arguments
                                
                                # Case 4: Neither a dict nor has expected attributes
                                else:
                                    # Log the tool_call structure for debugging
                                    logger.warning(f"Unexpected tool_call structure: {str(tool_call)}")
                                    logger.warning(f"Tool call dir: {dir(tool_call) if not isinstance(tool_call, dict) else 'N/A'}")
                                    # Try to extract anything useful
                                    if hasattr(tool_call, '__dict__'):
                                        logger.info(f"Tool call __dict__: {tool_call.__dict__}")
                                    # Default to basic values to allow processing to continue
                                    tool_name = 'retrieve_entries'
                                    tool_args = {'query': message}
                                
                                logger.info(f"Extracted tool_name: {tool_name}")
                                logger.info(f"Extracted tool_args: {tool_args}")
                                
                                # If we couldn't extract a valid tool name, use a default
                                if not tool_name and 'retrieve' in str(tool_call).lower():
                                    tool_name = 'retrieve_entries'
                                    if not tool_args:
                                        tool_args = {'query': message}
                                
                                # Find the tool
                                tool_to_use = next((t for t in self.tools if t.name == tool_name), None)
                                
                                if tool_to_use:
                                    try:
                                        # Ensure query parameter exists for retrieve_entries
                                        if tool_name == 'retrieve_entries' and 'query' not in tool_args:
                                            tool_args['query'] = message
                                        
                                        # Call the tool with proper error handling using invoke() instead of direct call
                                        logger.info(f"Calling tool {tool_name} with args {tool_args}")
                                        
                                        # Use correct tool invocation based on LangChain's API
                                        if hasattr(tool_to_use, 'invoke'):
                                            # New API: Use invoke method with proper input format
                                            if tool_name == 'retrieve_entries':
                                                # Structure input based on what the tool expects
                                                input_value = tool_args.get('query', message)
                                                # For simple string tools - just get the placeholder response
                                                placeholder_result = tool_to_use.invoke(input_value)
                                                
                                                # Now actually perform the async retrieval directly
                                                n_results = 5  # Default number of results
                                                try:
                                                    # Directly await the async method since we're in an async function
                                                    actual_result = await self._retrieve_entries_async(input_value, n_results)
                                                    # Use the actual result instead of the placeholder
                                                    tool_result = actual_result
                                                except Exception as e:
                                                    logger.error(f"Error retrieving entries: {e}")
                                                    tool_result = "Error retrieving journal entries."
                                            else:
                                                # For other tools that expect a dictionary
                                                tool_result = tool_to_use.invoke(tool_args)
                                        else:
                                            # Fallback to direct call (deprecated)
                                            if tool_name == 'retrieve_entries':
                                                # For retrieve_entries, we need to handle async directly
                                                query = tool_args.get('query', message)
                                                n_results = 5  # Default
                                                tool_result = await self._retrieve_entries_async(query, n_results)
                                            else:
                                                # Other tools
                                                tool_result = tool_to_use(**tool_args)
                                        
                                        # Add the result as a message
                                        messages.append(FunctionMessage(
                                            name=tool_name,
                                            content=str(tool_result)
                                        ))
                                    except Exception as e:
                                        # If tool call fails, log it and add an error message
                                        logger.error(f"Error using tool {tool_name}: {e}")
                                        messages.append(FunctionMessage(
                                            name=tool_name,
                                            content=f"Error using this tool: {str(e)}"
                                        ))
                                else:
                                    logger.warning(f"No matching tool found for name: {tool_name}")
                            except Exception as e:
                                logger.error(f"Error processing tool call {i}: {e}")
                                # Continue with next tool call
                        
                        # Get a final response after tool use
                        final_response = self.llm.invoke(messages)
                        response_text = final_response.content
                    else:
                        # No tools were used, just use the response
                        response_text = response.content
                
                except Exception as e:
                    logger.error(f"Error during LLM invocation or tool processing: {e}")
                    # Fall back to a direct response without tools
                    response = self.llm.invoke([
                        SystemMessage(content=DEFAULT_SYSTEM_MESSAGE),
                        HumanMessage(content=f"I couldn't find any specific journal entries related to: '{message}'. Please provide a generic response to the user, letting them know you couldn't find relevant entries but you're still here to help with general journal questions.")
                    ])
                    response_text = response.content
            
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