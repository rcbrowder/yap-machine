import axios from 'axios';

// In development, use localhost:8000, in production (Docker) use /api
const API_URL = import.meta.env.DEV ? 'http://localhost:8000' : '/api';

// Chat service implementation using the backend RAG chatbot API
const chatService = {
  // Send a message to the AI assistant
  sendMessage: async (message) => {
    try {
      const response = await axios.post(`${API_URL}/chat/message`, {
        message: message,
        history: []
      });
      return response.data;
    } catch (error) {
      console.error('Error in chat service:', error);
      throw error;
    }
  },
  
  // Search journal entries and use them for context in the chat
  contextualChat: async (message, history = []) => {
    try {
      // Format the history for the API
      const formattedHistory = history.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date().toISOString()
      }));
      
      // Send the message to the backend
      const response = await axios.post(`${API_URL}/chat/message`, {
        message: message,
        history: formattedHistory
      });
      
      // Return the response in the expected format
      return {
        role: 'assistant',
        content: response.data.response,
        contexts: response.data.retrieved_contexts
      };
    } catch (error) {
      console.error('Error with contextual chat:', error);
      // Return a fallback response in case of an error
      return {
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again later."
      };
    }
  }
};

export default chatService; 