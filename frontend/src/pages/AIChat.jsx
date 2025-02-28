import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import chatService from '../api/chatService';
import { useChat } from '../contexts/ChatContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

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
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Chat header */}
      <Card className="mb-0 rounded-b-none p-4 bg-main text-black">
        <div className="flex items-center gap-4 relative">
          <div className="w-10 h-10 bg-white/20 rounded-full flex justify-center items-center border-2 border-black">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold m-0">AI Journal Assistant</h2>
            <p className="text-sm opacity-80">Ask questions about your journal entries</p>
          </div>
          <Button 
            onClick={resetChat}
            variant="outline"
            className="border-2 border-black bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </Button>
        </div>
      </Card>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Chat messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-bg border-l-2 border-r-2 border-black">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-main text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' 
                  : 'bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              }`}>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <div className={`text-xs mt-2 text-right ${
                  message.role === 'user' ? 'text-black/70' : 'text-gray-500'
                }`}>
                  {getMessageTime()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border-2 border-black rounded-lg p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-main rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-main rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-main rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Retrieved contexts sidebar */}
        {retrievedContexts && retrievedContexts.length > 0 && (
          <div className="w-80 border-r-2 border-black bg-bg p-4 overflow-y-auto hidden md:block">
            <h3 className="text-lg font-bold mb-4 pb-2 border-b-2 border-black">Referenced Journal Entries</h3>
            <div className="space-y-3">
              {retrievedContexts.map((context, index) => (
                <Card key={index} className="p-3 bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                  <div className="font-medium mb-1 flex justify-between items-start">
                    <div>{context.title}</div>
                    <span className="text-xs text-gray-500 ml-2">{new Date(context.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="text-sm prose prose-sm max-w-none mb-2">
                    <ReactMarkdown>{context.content_snippet}</ReactMarkdown>
                  </div>
                  <div className="text-xs text-gray-500">
                    Relevance: {Math.round(context.similarity_score * 100)}%
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Input form */}
      <div className="p-4 border-2 border-t-0 border-black bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about your journal entries..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !inputText.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

export default AIChat; 