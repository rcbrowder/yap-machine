import React, { createContext, useContext, useState } from 'react';

// Create the chat context
const ChatContext = createContext();

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
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateMessages = (newMessages) => {
    setMessages(newMessages);
  };

  const resetChat = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        updateMessages,
        setIsLoading,
        resetChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 