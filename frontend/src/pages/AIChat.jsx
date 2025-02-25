import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import chatService from '../api/chatService';

// This is a placeholder for now - we'll add the actual API integration later
function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI-powered journal assistant. You can ask me questions about your journal entries or have a conversation about them."
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    try {
      // Call the chat service
      const response = await chatService.contextualChat(userMessage.content);
      
      // Add the AI's response to the messages
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Add an error message
      setMessages(prev => [
        ...prev,
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
    <div className="bg-white rounded-xl shadow-md flex flex-col h-[calc(100vh-12rem)]">
      {/* Chat header */}
      <div className="px-6 py-4 border-b border-secondary-200">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-secondary-900">AI Journal Assistant</h2>
            <p className="text-sm text-secondary-500">Ask questions about your journal entries</p>
          </div>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary-50">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-tr-none' 
                  : 'bg-white text-secondary-800 rounded-tl-none shadow-sm border border-secondary-200'
              }`}
            >
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              <div 
                className={`text-xs mt-1 text-right ${
                  message.role === 'user' ? 'text-primary-100' : 'text-secondary-400'
                }`}
              >
                {getMessageTime()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-secondary-800 rounded-2xl rounded-tl-none shadow-sm border border-secondary-200 px-4 py-3">
              <div className="flex space-x-2 items-center h-6">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input form */}
      <div className="border-t border-secondary-200 p-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about your journal entries..."
            className="flex-1 rounded-full border-secondary-300 bg-secondary-50 focus:ring-primary-500 focus:border-primary-500 py-3 px-4"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default AIChat; 