
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { getChatResponse } from '../services/gemini';
import { ChatMessage } from '../types';

const ChatScreen: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your NoEquip AI Coach. I can help with workout techniques, app guidance, or no-equipment modifications. How can I assist today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    setIsTyping(true);
    const response = await getChatResponse(messages, userMsg);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsTyping(false);
  };

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Chat Header */}
      <div className="p-4 pt-12 flex items-center gap-4 bg-zinc-900/50 backdrop-blur-md border-b border-zinc-900">
        <button onClick={() => navigate('/plan')} className="text-zinc-400">
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="flex-1">
          <h2 className="font-bold">AI Coach</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
              ? 'bg-red-600 text-white rounded-tr-none' 
              : 'bg-zinc-900 text-zinc-300 rounded-tl-none border border-zinc-800'
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 p-4 rounded-2xl rounded-tl-none border border-zinc-800 flex gap-1">
              <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 pb-10 bg-black">
        <div className="bg-zinc-900 rounded-2xl flex items-center px-4 py-2 border border-zinc-800 focus-within:border-red-600 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about no-equip workouts..."
            className="flex-1 bg-transparent py-3 focus:outline-none text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center disabled:opacity-50"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
