import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import chatService from '../api/chatService';
import { useChat } from '../contexts/ChatContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

function AIChat() {
  const {
    messages,
    isLoading,
    updateMessages,
    setIsLoading,
    resetChat
  } = useChat();
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    updateMessages([...messages, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(inputText);
      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      updateMessages([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      updateMessages([...messages, userMessage, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b-2 border-black bg-white">
        <h1 className="text-2xl font-bold">AI Journal Assistant</h1>
        <Button onClick={resetChat} variant="outline">
          Reset Chat
        </Button>
      </div>

      {/* Main chat area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white border-2 border-black'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-lg bg-white border-2 border-black">
                  <div className="animate-pulse">Thinking...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t-2 border-black bg-white">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask me anything about your journal entries..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AIChat; 