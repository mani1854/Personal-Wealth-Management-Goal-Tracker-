import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, User, Loader2, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiPost } from '../lib/api';

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  tools_used?: string[];
  sources?: string[];
  recommendations?: string[];
  model?: string;
}

interface AgentResponse {
  reply: string;
  intent: string;
  tools_used: string[];
  sources: string[];
  recommendations: string[];
  model: string;
}

const SUGGESTIONS = [
  "What is my net worth?",
  "Am I at high risk?",
  "Am I on track for retirement?",
  "Should I rebalance my portfolio?",
  "Calculate tax on ₹50,000 gain held 400 days",
  "What is the price of AAPL?",
];

function MessageBubble({ msg }: { msg: AgentMessage }) {
  const [showMeta, setShowMeta] = useState(false);
  const hasMeta = (msg.tools_used?.length ?? 0) > 0 || (msg.recommendations?.length ?? 0) > 0;

  return (
    <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        msg.role === 'assistant'
          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      }`}>
        {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>

      <div className={`max-w-[78%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
        {/* Main bubble */}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          msg.role === 'user'
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>

        {/* Intent + Tools badges (assistant only) */}
        {msg.role === 'assistant' && (
          <div className="flex flex-wrap gap-1.5 ml-1">
            {msg.intent && (
              <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800 font-medium">
                {msg.intent}
              </span>
            )}
            {msg.tools_used?.map((tool, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                {tool}
              </span>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {msg.role === 'assistant' && (msg.recommendations?.length ?? 0) > 0 && (
          <div className="ml-1 space-y-1">
            {msg.recommendations!.map((rec, i) => (
              <div key={i} className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg">
                {rec}
              </div>
            ))}
          </div>
        )}

        {/* Model tag */}
        {msg.role === 'assistant' && msg.model && (
          <p className="text-xs text-gray-400 ml-1">via {msg.model}</p>
        )}
      </div>
    </div>
  );
}

export default function Chatbot() {
  const { token } = useAuth();
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your **Advanced AI Financial Advisor** powered by Groq's Llama-3.3-70B with 6 specialized financial tools.\n\nI can analyze your portfolio, predict stock prices, calculate taxes, suggest rebalancing, track your goals, and more — all using your real data!\n\nWhat would you like to know?",
      intent: '💬 General',
      tools_used: [],
      recommendations: [],
      model: 'llama-3.3-70b-versatile',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const res = await aiPost<AgentResponse>('/ai/agent/chat', token, { message: msg });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.reply,
        intent: res.intent,
        tools_used: res.tools_used,
        sources: res.sources,
        recommendations: res.recommendations,
        model: res.model,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try { await aiPost('/ai/agent/memory', token, {}); } catch {}
    setMessages([{
      role: 'assistant',
      content: "Memory cleared! I'm ready to start fresh. How can I help?",
      intent: '💬 General',
      tools_used: [],
      recommendations: [],
    }]);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Bot className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </span>
            AI Financial Advisor
          </h1>
          <div className="flex items-center gap-2 mt-1 ml-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Groq · llama-3.3-70b · Intent Classification · 6 Financial Tools · Memory
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Clear Memory
        </button>
      </div>

      {/* Tool chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['📊 Portfolio', '⚠️ Risk', '🎯 Goals', '📈 Market', '🧾 Tax', '⚖️ Rebalancer'].map((t, i) => (
          <span key={i} className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
            {t}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 mb-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40">
              <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-sm text-gray-500">Analyzing with AI tools...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length <= 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => sendMessage(s)}
              className="text-left text-xs px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 shadow-sm">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about your portfolio, risk, goals, stock prices, taxes..."
          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 px-2 text-sm"
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
