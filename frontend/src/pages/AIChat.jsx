import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import chatService from '../api/chatService';
import './AIChat.css';
import { useChat } from '../contexts/ChatContext';

function AIChat() {
  // Use the chat context instead of local state
  const {
    messages,
    retrievedContexts,
    isLoading,
    updateMessages,
    updateRetrievedContexts,
    setIsLoading,
    resetChat
  } = useChat();
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Sync the vector database with journal entries when the component mounts
    const syncVectorDatabase = async () => {
      try {
        const response = await fetch('http://localhost:8000/vector/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        console.log('Vector database synced:', data);
      } catch (error) {
        console.error('Error syncing vector database:', error);
      }
    };
    
    syncVectorDatabase();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: inputText
    };
    
    // Create a new array with the user message
    const updatedMessages = [...messages, userMessage];
    
    // Update messages in context
    updateMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Call the chat service with the full chat history
      const response = await chatService.contextualChat(userMessage.content, messages);
      
      // Add the AI's response to the messages
      updateMessages([...updatedMessages, {
        role: 'assistant',
        content: response.content
      }]);

      // Set retrieved contexts if available
      if (response.contexts) {
        updateRetrievedContexts(response.contexts);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Add an error message
      updateMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: "I'm sorry, I had trouble processing your request. Please try again later."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to display timestamp for messages
  const getMessageTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      {/* Chat header */}
      <div className="chat-header">
        <div className="header-content">
          <div className="avatar">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="header-info">
            <h2 className="header-title">AI Journal Assistant</h2>
            <p className="header-subtitle">Ask questions about your journal entries</p>
          </div>
          <button 
            onClick={resetChat} 
            className="reset-button"
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>
      
      <div className="chat-layout">
        {/* Chat messages */}
        <div className="messages-container">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={message.role === 'user' ? 'message-row user' : 'message-row assistant'}
            >
              <div className={message.role === 'user' ? 'message user' : 'message assistant'}>
                <div className="message-content">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <div className={message.role === 'user' ? 'message-time user' : 'message-time assistant'}>
                  {getMessageTime()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message-row assistant">
              <div className="message assistant">
                <div className="typing-indicator">
                  <div className="dot" style={{ animationDelay: '0ms' }}></div>
                  <div className="dot" style={{ animationDelay: '150ms' }}></div>
                  <div className="dot" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Retrieved contexts sidebar */}
        {retrievedContexts && retrievedContexts.length > 0 && (
          <div className="contexts-sidebar">
            <h3 className="contexts-header">Referenced Journal Entries</h3>
            <div className="contexts-list">
              {retrievedContexts.map((context, index) => (
                <div key={index} className="context-item">
                  <div className="context-title">
                    {context.title}
                    <span className="context-date">{new Date(context.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="context-content">
                    <ReactMarkdown>{context.content_snippet}</ReactMarkdown>
                  </div>
                  <div className="context-similarity">
                    Relevance: {Math.round(context.similarity_score * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Input form */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about your journal entries..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="send-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="icon-small" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIChat; 