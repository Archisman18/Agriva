import { useState, useRef, useEffect } from 'react';
import { useFieldData } from '../context/FieldDataContext';
import { chatWithAdvisor } from '../services/api';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
  }, [history, isOpen, isExpanded]);

  const toggleChat = () => setIsOpen(!isOpen);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    
    const updatedHistory: Message[] = [...history, { role: 'user', content: userMessage }];
    setHistory(updatedHistory);
    setIsLoading(true);

    try {
      const context = {
        soilType: soilType,
        budget: budget,
        desiredCrop: desiredCrop,
        climateRisks: analysisData?.climateRisks
      };

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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      <div 
        className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl overflow-hidden origin-bottom-right ${
          isOpen 
            ? 'opacity-100 scale-100 mb-4' 
            : 'opacity-0 scale-95 pointer-events-none absolute bottom-0 right-0'
        } ${
          isExpanded
            ? 'w-[90vw] sm:w-[800px] h-[85vh]'
            : 'w-[350px] sm:w-[400px] h-[500px] max-h-[70vh]'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 flex justify-between items-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div>
              <h3 className="font-bold font-heading text-lg leading-tight">AI Advisor</h3>
              <p className="text-xs text-emerald-400/80 font-medium tracking-wide">Powered by Groq</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 relative z-10">
            <button 
              onClick={toggleExpand} 
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <i className={`fa-solid ${isExpanded ? 'fa-compress' : 'fa-expand'}`}></i>
            </button>
            <button 
              onClick={toggleChat} 
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {history.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div 
                className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-br-sm' 
                    : 'bg-white text-slate-700 border border-slate-200/60 rounded-bl-sm'
                } ${isExpanded ? 'text-base' : 'text-sm'}`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white border border-slate-200/60 p-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about crops, soil, budget..."
              className={`flex-1 border border-slate-300 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-700 ${isExpanded ? 'text-base' : 'text-sm'}`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl w-12 h-12 flex items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'bg-slate-800 text-white scale-90 rotate-90 opacity-0 pointer-events-none absolute' 
            : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-110 active:scale-95 animate-bounce-slow'
        }`}
        aria-label="Open AI Advisor Chat"
      >
        <i className="fa-solid fa-leaf text-2xl"></i>
      </button>
    </div>
  );
}
