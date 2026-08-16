import { useState, useRef, useEffect } from 'react';
import { useFieldData } from '../context/FieldDataContext';
import { chatWithAdvisor } from '../services/api';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Message[]>([
    { role: 'model', content: 'Hi there! I am your AI Agricultural Advisor. How can I help you with your farm today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { soilType, budget, desiredCrop, analysisData } = useFieldData();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    
    // Add user message to history
    const updatedHistory: Message[] = [...history, { role: 'user', content: userMessage }];
    setHistory(updatedHistory);
    setIsLoading(true);

    try {
      // Create a context object from current field data
      const context = {
        soilType: soilType,
        budget: budget,
        desiredCrop: desiredCrop,
        climateRisks: analysisData?.climateRisks
      };

      // Gemini requires conversation history to alternate and typically start with the user.
      // We must strip out the initial hardcoded "Hi there!" greeting from the history we send.
      const apiHistory = history.filter((msg, idx) => !(idx === 0 && msg.role === 'model'));

      const response = await chatWithAdvisor(userMessage, context, apiHistory);
      
      setHistory([...updatedHistory, { role: 'model', content: response.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setHistory([...updatedHistory, { 
        role: 'model', 
        content: 'Sorry, I am having trouble connecting to the network right now. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] max-h-[70vh] flex flex-col bg-white/90 backdrop-blur-md border border-green-200 shadow-2xl rounded-2xl overflow-hidden animate-slide-up origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-robot text-xl"></i>
              <h3 className="font-bold font-heading text-lg">AI Advisor</h3>
            </div>
            <button 
              onClick={toggleChat} 
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close Chat"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {history.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white rounded-br-none shadow-sm' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-green-100">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about crops, soil, budget..."
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-md active:scale-95"
              >
                <i className="fa-solid fa-paper-plane text-sm"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gray-800 text-white scale-90 rotate-90 opacity-0 pointer-events-none absolute' 
            : 'bg-green-600 hover:bg-green-500 text-white hover:scale-110 active:scale-95 animate-bounce-slow'
        }`}
        aria-label="Open AI Advisor Chat"
      >
        <i className="fa-solid fa-message text-2xl"></i>
      </button>
    </div>
  );
}
