import { createContext, useContext, useState, useCallback } from 'react';

// Create the chat context
const ChatContext = createContext(null);

// Initial chat state
const initialChatState = {
  messages: [
    {
      role: 'assistant',
      content: "Hello! I'm your AI-powered journal assistant. You can ask me questions about your journal entries or have a conversation about them."
    }
  ],
  retrievedContexts: [],
  isLoading: false
};

// Function to sanitize message content
const sanitizeContent = (content) => {
  // Basic sanitization - replace script tags and known XSS patterns
  if (typeof content === 'string') {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }
  return content;
};

// Chat context provider component
export function ChatProvider({ children }) {
  const [chatState, setChatState] = useState(initialChatState);

  // Update the chat state with new messages using memoized callbacks
  const updateMessages = useCallback((newMessages) => {
    // Sanitize all message content for security
    const sanitizedMessages = newMessages.map(message => ({
      ...message,
      content: sanitizeContent(message.content)
    }));
    
    setChatState(prevState => ({
      ...prevState,
      messages: sanitizedMessages
    }));
  }, []);

  // Update the retrieved contexts
  const updateRetrievedContexts = useCallback((contexts) => {
    // Sanitize context content for security
    const sanitizedContexts = contexts.map(context => ({
      ...context,
      content_snippet: sanitizeContent(context.content_snippet),
      title: sanitizeContent(context.title)
    }));
    
    setChatState(prevState => ({
      ...prevState,
      retrievedContexts: sanitizedContexts
    }));
  }, []);

  // Set the loading state
  const setIsLoading = useCallback((isLoading) => {
    setChatState(prevState => ({
      ...prevState,
      isLoading
    }));
  }, []);

  // Reset the chat to initial state
  const resetChat = useCallback(() => {
    setChatState(initialChatState);
  }, []);

  // The context value object
  const value = {
    messages: chatState.messages,
    retrievedContexts: chatState.retrievedContexts,
    isLoading: chatState.isLoading,
    updateMessages,
    updateRetrievedContexts,
    setIsLoading,
    resetChat
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (context === null) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 