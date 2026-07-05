import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Send, Bot, User, Trash2, ArrowRight } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'assistant';
  message: str;
}

const RecyclingAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      message: 'Hello! I am your AI Recycling Assistant. Upload images on reports, or ask me how to classify and dispose of household waste (paper, plastic, glass, battery, or biological matter) and I will provide recycling guidelines.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll chat to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message to history
    setMessages(prev => [...prev, { sender: 'user', message: userMessage }]);
    setLoading(true);

    try {
      // Structure historical context to help the assistant
      const formattedHistory = messages.map(msg => ({
        sender: msg.sender,
        message: msg.message
      }));

      const response = await api.post('/api/assistant/chat', {
        message: userMessage,
        history: formattedHistory
      });

      setMessages(prev => [...prev, { sender: 'assistant', message: response.data.reply }]);
    } catch (e) {
      console.error('Failed to communicate with chat API', e);
      setMessages(prev => [
        ...prev,
        { sender: 'assistant', message: "Sorry, I'm experiencing connectivity issues. Please try again. For standard guidelines: place clean bottles/cans/paper in green bins, and batteries/bulbs in purple E-waste bins." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated" style={{ maxWidth: '800px', margin: '1rem auto' }}>
      <h2 style={{ color: 'var(--primary-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bot style={{ color: 'var(--primary)' }} /> Recycling Advisor AI
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Ask quick questions about how to classify material or find local guidelines.</p>
      
      <div className="chat-container">
        {/* Messages list */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              {msg.sender === 'assistant' && (
                <div style={{ background: '#E8F5E9', color: 'var(--primary)', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
                  <Bot size={16} />
                </div>
              )}
              <div className={`chat-message ${msg.sender}`}>
                {msg.message}
              </div>
              {msg.sender === 'user' && (
                <div style={{ background: '#ECEFF1', color: 'var(--text-secondary)', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: '#E8F5E9', color: 'var(--primary)', padding: '0.4rem', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
                <Bot size={16} />
              </div>
              <div className="chat-message assistant" style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                Analyzing item composition...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="chat-input-area">
          <input
            type="text"
            className="form-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. Can I recycle pizza boxes or aluminum foil?"
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }} disabled={loading}>
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Suggested prompts list */}
      <div style={{ marginTop: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Suggested Questions:</h4>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            'Can plastic soda bottles be recycled?',
            'Where do I throw phone batteries?',
            'Are greasy pizza boxes recyclable?',
            'What belongs in the general waste bin?'
          ].map((prompt, index) => (
            <button
              key={index}
              onClick={() => setInputValue(prompt)}
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '30px' }}
            >
              {prompt} <ArrowRight size={12} style={{ display: 'inline', marginLeft: '0.2rem' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecyclingAssistant;
