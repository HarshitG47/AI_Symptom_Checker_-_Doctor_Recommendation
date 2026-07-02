import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User, AlertCircle } from 'lucide-react';
import assessmentService from '../../services/assessmentService';

const ChatFollowUp = ({ assessmentId, initialHistory = [] }) => {
  const [messages, setMessages] = useState(initialHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const result = await assessmentService.chatFollowUp(assessmentId, msg);
      setMessages(result.chatHistory);
    } catch (err) {
      setError('Failed to get a response. Please try again.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestions = [
    'What foods should I avoid?',
    'When should I see a doctor urgently?',
    'Can this be managed at home?',
    'What tests might be recommended?',
  ];

  return (
    <div className="card flex flex-col" style={{ maxHeight: '600px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border-light dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-base font-bold text-text-primary dark:text-slate-100">AI Follow-up Chat</h3>
          <p className="text-xs text-text-muted dark:text-slate-400">Ask follow-up questions about your assessment</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-[200px] max-h-[340px] pr-1">
        {messages.length === 0 ? (
          <div className="py-4">
            <p className="text-sm text-text-muted dark:text-slate-400 mb-3 text-center">
              Ask any follow-up questions about your health assessment
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-lg bg-surface dark:bg-slate-800 text-text-secondary dark:text-slate-300 hover:bg-primary-light dark:hover:bg-primary/10 hover:text-primary border border-border-light dark:border-slate-700 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary-light dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-surface dark:bg-slate-800 text-text-primary dark:text-slate-100 border border-border-light dark:border-slate-700 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary-light dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-surface dark:bg-slate-800 border border-border-light dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-text-muted dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-text-muted dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-text-muted dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-text-muted dark:text-slate-500 mt-3 mb-2 px-0.5">
        ⚕️ AI responses are for informational purposes only. Always consult a licensed doctor.
      </p>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-border-light dark:border-slate-700">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          className="input-field text-sm py-2.5 flex-1"
          id="chat-input"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          id="chat-send"
          className="w-10 h-10 rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatFollowUp;
