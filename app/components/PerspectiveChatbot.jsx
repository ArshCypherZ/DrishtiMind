'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot } from 'lucide-react';

const PerspectiveChatbot = ({ sessionId, cards, userInput }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  
  const storageKey = sessionId ? `perspective-chat:${sessionId}` : null;

  // Hydrate messages from storage on mount/session change
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const hydrated = Array.isArray(parsed)
          ? parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
          : [];
        setMessages(hydrated);
      }
    } catch (e) {
      // ignore corrupt storage
      console.warn('Failed to load chat history from storage', e);
    }
  }, [storageKey]);

  // Persist messages to storage
  useEffect(() => {
    if (!storageKey) return;
    try {
      const serializable = messages.map(m => ({ ...m, timestamp: m.timestamp?.toISOString?.() || new Date().toISOString() }));
      localStorage.setItem(storageKey, JSON.stringify(serializable));
    } catch (e) {
      // ignore storage errors
    }
  }, [messages, storageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setIsLoading(true);
    setError('');

    // Build role-based history from previous messages (exclude the just-typed one)
    const historyPayload = messages.map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Add user message to UI immediately
    const newMessages = [...messages, { type: 'user', content: message, timestamp: new Date() }];
    setMessages(newMessages);
    setInputMessage('');

    try {
      const response = await fetch('/api/perspective/chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          message,
          history: historyPayload,
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add AI response to UI
      setMessages(prev => [...prev, { type: 'ai', content: data.message, timestamp: new Date() }]);

    } catch (err) {
      setError('Sorry, I encountered an error. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!sessionId || cards.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 mt-8"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
        <Bot className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Perspective Coach</h3>
        {error && (
          <div className="ml-auto text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="h-80 overflow-y-auto px-4 py-3 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className={`text-sm ${message.type === 'user' ? 'text-right' : ''}`}>
                  {message.content}
                </p>
                <p className={`text-xs opacity-75 mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 p-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-600">Thinking...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your insights..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            whileHover={!isLoading && inputMessage.trim() ? { scale: 1.05 } : {}}
            whileTap={!isLoading && inputMessage.trim() ? { scale: 0.95 } : {}}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Context */}
      <div className="px-4 pb-4 text-xs text-gray-500">
        <p className="text-center">💡 I'm here to help you explore your perspective cards</p>
      </div>
    </motion.div>
  );
};

export default PerspectiveChatbot;
