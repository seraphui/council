'use client';

import { useState, useRef, useEffect } from 'react';
import { entities } from '@/lib/entities';
import { EntityIcon, HumanSilhouette } from '../Icons';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationHistory {
  [entityId: string]: Message[];
}

export default function DirectChatTab() {
  const [selectedEntity, setSelectedEntity] = useState(entities[0]);
  const [conversations, setConversations] = useState<ConversationHistory>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMessages = conversations[selectedEntity.id] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setConversations((prev) => ({
      ...prev,
      [selectedEntity.id]: [...(prev[selectedEntity.id] || []), userMessage],
    }));
    setInput('');
    setIsLoading(true);
    setIsOffline(false);

    try {
      const history = (conversations[selectedEntity.id] || []).map(m => ({
        role: m.role,
        content: m.content
      }));

      console.log('Sending request to:', '/api/chat/direct');
      const response = await fetch('/api/chat/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: selectedEntity.id,
          message: userMessage.content,
          history: history,
        }),
      });

      console.log('API Response status:', response.status, response.ok);
      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      console.log('API Response data:', data);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setConversations((prev) => ({
        ...prev,
        [selectedEntity.id]: [...(prev[selectedEntity.id] || []), assistantMessage],
      }));
    } catch (error: unknown) {
      console.error('API Error:', error);
      const err = error as Error;
      console.error('Error details:', err?.message, err?.stack);
      setIsOffline(true);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Council is currently offline. Neural link disrupted.',
        timestamp: new Date(),
      };
      setConversations((prev) => ({
        ...prev,
        [selectedEntity.id]: [...(prev[selectedEntity.id] || []), errorMessage],
      }));
    }

    setIsLoading(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex border border-[rgba(0,0,0,0.1)]" style={{ height: '500px' }}>
      <div className="w-[220px] border-r border-[rgba(0,0,0,0.1)] flex flex-col">
        <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.1)]">
          <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">
            Select Entity
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {entities.map((entity) => (
            <button
              key={entity.id}
              onClick={() => setSelectedEntity(entity)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                selectedEntity.id === entity.id
                  ? 'bg-[#1a1a1a] text-white'
                  : 'hover:bg-[rgba(0,0,0,0.03)]'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selectedEntity.id === entity.id ? 'bg-white/20' : 'bg-white/70 border border-[rgba(0,0,0,0.1)]'
              }`}>
                <EntityIcon icon={entity.icon} className="w-4 h-4" />
              </div>
              <span className="font-mono text-[11px] tracking-[0.5px]">{entity.id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(0,0,0,0.1)]">
          <span className="font-roos text-[16px] italic">{selectedEntity.id}</span>
          <span className="font-mono text-[10px] text-[#444] flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500'}`} />
            {isOffline ? 'Offline' : 'Connected'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {currentMessages.length === 0 && (
            <div className="text-center py-10">
              <p className="font-mono text-[11px] text-[#444]">
                Begin your dialogue with {selectedEntity.id}
              </p>
            </div>
          )}
          
          {currentMessages.map((msg, index) => (
            <div key={index} className="flex gap-3 animate-fade-up">
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur border border-[rgba(0,0,0,0.1)] flex items-center justify-center flex-shrink-0">
                {msg.role === 'user' ? (
                  <HumanSilhouette className="w-4 h-4 text-[#444]" />
                ) : (
                  <EntityIcon icon={selectedEntity.icon} className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-ui text-[11px] uppercase tracking-[0.5px]">
                    {msg.role === 'user' ? 'YOU' : selectedEntity.id}
                  </span>
                  <span className="font-mono text-[10px] text-[#444]">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="font-roos text-[14px] text-[#333] leading-relaxed">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur border border-[rgba(0,0,0,0.1)] flex items-center justify-center entity-thinking">
                <EntityIcon icon={selectedEntity.icon} className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-mono text-[11px] text-[#444] italic">
                  {selectedEntity.id} is deliberating...
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-3 p-4 border-t border-[rgba(0,0,0,0.1)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Address the entity..."
            className="flex-1 px-4 py-2 font-roos text-[14px] border border-[rgba(0,0,0,0.1)] bg-white/50 focus:outline-none focus:border-[rgba(0,0,0,0.2)]"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 font-ui text-[11px] uppercase tracking-[1px] bg-[#1a1a1a] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
