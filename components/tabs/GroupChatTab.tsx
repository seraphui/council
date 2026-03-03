'use client';

import { useState, useRef, useEffect } from 'react';
import { entities } from '@/lib/entities';
import { EntityIcon, HumanSilhouette } from '../Icons';

interface Message {
  role: 'user' | 'assistant';
  entityId?: string;
  content: string;
  timestamp: Date;
}

export default function GroupChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [respondingEntities, setRespondingEntities] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, respondingEntities]);

  const getEntity = (id: string) => entities.find((e) => e.id === id || e.fullName === id);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsOffline(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          isGroupChat: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const entityResponses = data.responses || [];

      for (const entityResponse of entityResponses) {
        setRespondingEntities([entityResponse.entity]);
        
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

        const assistantMessage: Message = {
          role: 'assistant',
          entityId: entityResponse.entity,
          content: entityResponse.content,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setRespondingEntities([]);
        
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('API Error:', error);
      setIsOffline(true);
      const errorMessage: Message = {
        role: 'assistant',
        entityId: 'SYSTEM',
        content: 'Council is currently offline. Unable to reach the entities.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setRespondingEntities([]);
    setIsLoading(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="border border-[rgba(0,0,0,0.1)]" style={{ height: '500px' }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(0,0,0,0.1)]">
        <span className="font-ui text-[11px] uppercase tracking-[1px]">Group Discussion</span>
        <span className="font-mono text-[10px] text-[#444] flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500'}`} />
          {isOffline ? 'Offline' : 'All Entities'}
        </span>
      </div>

      <div className="h-[380px] overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="font-mono text-[11px] text-[#444]">
              Address the Council. 1-3 entities will respond.
            </p>
          </div>
        )}
        
        {messages.map((msg, index) => {
          const entity = msg.entityId ? getEntity(msg.entityId) : null;
          
          return (
            <div key={index} className="flex gap-3 animate-fade-up">
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur border border-[rgba(0,0,0,0.1)] flex items-center justify-center flex-shrink-0">
                {msg.role === 'user' ? (
                  <HumanSilhouette className="w-4 h-4 text-[#444]" />
                ) : (
                  <EntityIcon icon={entity?.icon || 'brain'} className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-ui text-[11px] uppercase tracking-[0.5px]">
                    {msg.role === 'user' ? 'YOU' : msg.entityId}
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
          );
        })}
        
        {respondingEntities.map((entityId) => {
          const entity = getEntity(entityId);
          return (
            <div key={entityId} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur border border-[rgba(0,0,0,0.1)] flex items-center justify-center entity-thinking">
                <EntityIcon icon={entity?.icon || 'brain'} className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="font-mono text-[11px] text-[#444] italic">
                  {entityId} is deliberating...
                </span>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-3 p-4 border-t border-[rgba(0,0,0,0.1)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Address the Council..."
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
  );
}
