import apiClient from './client';

// Chat service implementation using the backend RAG chatbot API
const chatService = {
  // Send a message to the AI assistant
  sendMessage: async (message, history = []) => {
    try {
      const response = await apiClient.post('/chat/message', {
        message: message,
        history: history
      });
      
      return {
        role: 'assistant',
        content: response.data.response
      };
    } catch (error) {
      console.error('Error sending message to AI assistant:', error);
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
      const response = await apiClient.post('/chat/message', {
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