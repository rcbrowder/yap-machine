import apiClient from './client';

// This is a placeholder service - we'll implement the actual
// chat API endpoints when we add Ollama integration to the backend
const chatService = {
  // Send a message to the AI assistant
  sendMessage: async (message) => {
    try {
      // This is a placeholder - in the final implementation,
      // we'll send the message to the backend which will use Ollama
      // For now, return a mock response
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        role: 'assistant',
        content: `This is a placeholder response. When the Ollama integration is complete, I'll be able to respond intelligently to: "${message}"`
      };
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiClient.post('/chat', { message });
      // return response.data;
    } catch (error) {
      console.error('Error sending message to AI assistant:', error);
      throw error;
    }
  },
  
  // Search journal entries and use them for context in the chat
  contextualChat: async (message) => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        role: 'assistant',
        content: `In the future, I'll search your journal for entries related to "${message}" and provide a contextual response based on your writing history.`
      };
      
      // TODO: Replace with actual implementation
      // 1. Search for relevant entries using vector search
      // 2. Send the entries along with the user message to Ollama
      // 3. Return the AI's response
    } catch (error) {
      console.error('Error with contextual chat:', error);
      throw error;
    }
  }
};

export default chatService; 