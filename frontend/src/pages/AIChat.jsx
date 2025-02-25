import { useState } from 'react';
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

  return (
    <div className="flex flex-col h-[80vh]">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Chat with your Journal</h2>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-auto bg-white rounded-lg shadow p-4 mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-3/4 p-3 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-indigo-100 text-indigo-900' 
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="prose prose-sm">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about your journal entries..."
          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default AIChat; 