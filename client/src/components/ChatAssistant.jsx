import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";
// import { getHelpResponse } from '../services/geminiService';

const ChatAssistant = ({ onClose, context }) => {
  const initialGreeting =
    context === "access-enabled"
      ? "Remote access is active! You can now manage your computers. How can I help you navigate the dashboard?"
      : "Welcome to Orbital! Need help getting started with remote access? Just ask!";

  const [messages, setMessages] = useState([
    { role: "assistant", content: initialGreeting },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const contextAwareQuery = `[Context: User current status is ${context}] User says: ${userMsg}`;
      const response = await getHelpResponse(contextAwareQuery);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting to my core systems. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-8 w-[400px] h-[550px] bg-[#0d0d12]/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col z-50 overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-[#111116] to-[#0d0d12] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-white">
              Orbital Intelligence
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                Active Link
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20 rounded-tr-none"
                  : "bg-zinc-900 text-zinc-300 border border-zinc-800/50 rounded-tl-none"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900/50 p-4 rounded-2xl flex items-center gap-3 border border-zinc-800/50">
              <Loader2 size={16} className="animate-spin text-purple-500" />
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Analyzing
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 border-t border-zinc-800 bg-[#0a0a0c]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="How do I add a new computer?"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder:text-zinc-600"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 p-3 text-purple-500 hover:text-white disabled:text-zinc-700 transition-all active:scale-90"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
