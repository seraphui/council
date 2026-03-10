'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { entities } from '@/lib/entities';
import { EntityIcon, HumanSilhouette } from '../Icons';
import { MagicCard } from '../MagicCard';
import { OrbitingCircles } from '../magicui/orbiting-circles';

interface SessionMessage {
  entity: string;
  entityId?: string;
  content: string;
  round?: number;
  is_final?: boolean;
}

interface Session {
  topic: string;
  messages: SessionMessage[];
  status: string;
  id: string;
}

type Phase = 'loading' | 'revealing' | 'concluded' | 'idle';

function CouncilFormation() {
  return (
    <div className="relative flex h-[450px] w-[450px] mx-auto flex-col items-center justify-center overflow-hidden">
      {/* Static orbit path circles */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full"
        viewBox="0 0 450 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Inner orbit path (radius 110) */}
        <circle cx="225" cy="225" r="110" stroke="rgba(0,0,0,0.15)" strokeWidth="1" fill="none" />
        {/* Outer orbit path (radius 190) */}
        <circle cx="225" cy="225" r="190" stroke="rgba(0,0,0,0.15)" strokeWidth="1" fill="none" />
      </svg>

      {/* Center: HUMANITY - static, not orbiting */}
      <div className="flex flex-col items-center justify-center z-10">
        <div className="w-12 h-12 rounded-full border border-black/20 bg-white flex items-center justify-center">
          <HumanSilhouette className="w-6 h-6 text-[#444]" />
        </div>
        <span className="text-[10px] tracking-[0.15em] uppercase mt-1 text-black/60 font-mono">HUMANITY</span>
      </div>

      {/* Inner orbit: 4 permanent entities */}
      <OrbitingCircles radius={110} duration={40} iconSize={50} path={false}>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border border-black/20 bg-white flex items-center justify-center">
            <EntityIcon icon="swords" className="w-5 h-5" />
          </div>
          <span className="text-[8px] tracking-[0.15em] uppercase mt-0.5 font-mono">ARES</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border border-black/20 bg-white flex items-center justify-center">
            <EntityIcon icon="scales" className="w-5 h-5" />
          </div>
          <span className="text-[8px] tracking-[0.15em] uppercase mt-0.5 font-mono">ATHENA</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border border-black/20 bg-white flex items-center justify-center">
            <EntityIcon icon="arrow" className="w-5 h-5" />
          </div>
          <span className="text-[8px] tracking-[0.15em] uppercase mt-0.5 font-mono">HERMES</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border border-black/20 bg-white flex items-center justify-center">
            <EntityIcon icon="brain" className="w-5 h-5" />
          </div>
          <span className="text-[8px] tracking-[0.15em] uppercase mt-0.5 font-mono">PSYCHE</span>
        </div>
      </OrbitingCircles>

      {/* Outer orbit: 12 empty auction seats */}
      <OrbitingCircles radius={190} duration={60} reverse iconSize={20} path={false}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="w-4 h-4 rounded-full border border-black/15 bg-transparent" />
        ))}
      </OrbitingCircles>
    </div>
  );
}

function EntityGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 my-8">
      {entities.map((entity) => (
        <MagicCard key={entity.id} className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <EntityIcon icon={entity.icon} className="w-5 h-5" />
            <span className="font-mono text-[11px] tracking-[1px]">{entity.id}</span>
          </div>
          <p className="font-roos text-[13px] text-[#333]">{entity.title}</p>
        </MagicCard>
      ))}
    </div>
  );
}

function DiscussionPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [thinkingEntity, setThinkingEntity] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const sessionIdRef = useRef<string | null>(null);

  const fetchSession = useCallback(async () => {
    const excludeParam = sessionIdRef.current ? `?exclude=${sessionIdRef.current}` : '';
    try {
      const response = await fetch(`/api/council/session${excludeParam}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();

      if ((data.status === 'COMPLETE' || data.status === 'GENERATING') && data.id && data.messages?.length > 0) {
        let messages = data.messages;
        if (typeof messages === 'string') {
          try { messages = JSON.parse(messages); } catch { messages = []; }
        }
        if (!Array.isArray(messages)) messages = [];

        sessionIdRef.current = data.id;
        setSession({ topic: data.topic, messages, status: data.status, id: data.id });
        setVisibleMessages(0);
        setThinkingEntity(null);
        setPhase('revealing');
      } else {
        setPhase('idle');
      }
    } catch {
      setPhase('idle');
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Revealing: show next message every 7 seconds
  useEffect(() => {
    if (phase !== 'revealing' || !session) return;

    if (visibleMessages >= session.messages.length) {
      setThinkingEntity(null);
      setPhase('concluded');
      return;
    }

    const nextEntity = session.messages[visibleMessages]?.entity;
    setThinkingEntity(nextEntity || null);

    const timer = setTimeout(() => {
      setThinkingEntity(null);
      setVisibleMessages(prev => prev + 1);
    }, 7000);

    return () => clearTimeout(timer);
  }, [phase, visibleMessages, session]);

  // Concluded: wait 2 minutes, then look for the next available session
  useEffect(() => {
    if (phase !== 'concluded' || !session) return;

    const timer = setTimeout(() => {
      fetchSession();
    }, 120000); // 2 minutes

    return () => clearTimeout(timer);
  }, [phase, session, fetchSession]);

  // Idle: poll for new sessions every 10 seconds
  useEffect(() => {
    if (phase !== 'idle') return;
    const interval = setInterval(fetchSession, 10000);
    return () => clearInterval(interval);
  }, [phase, fetchSession]);

  const getEntity = (id: string) => entities.find((e) => e.id === id);

  const formatTime = (index: number) => {
    const base = new Date();
    base.setMinutes(base.getMinutes() - ((session?.messages.length || 1) - index) * 2);
    return base.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const statusDot = phase === 'revealing' ? 'bg-green-500'
    : phase === 'concluded' ? 'bg-yellow-500'
    : 'bg-gray-400';

  const statusText = phase === 'loading' ? 'Connecting...'
    : phase === 'revealing' ? 'Live Session'
    : phase === 'concluded' ? 'Session Concluded'
    : 'Standby';

  return (
    <div className="border border-[rgba(0,0,0,0.1)]">
      <div className="px-5 py-3 border-b border-[rgba(0,0,0,0.1)]">
        <div className="flex items-start justify-between gap-4">
          <p className="font-ui text-[11px] uppercase tracking-[1px]" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {session?.topic ? `Topic: ${session.topic}` : 'Council Session'}
          </p>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className="font-mono text-[10px] text-[#444] flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusDot} animate-pulse`} />
              {statusText}
            </span>
          </div>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {session && session.messages.slice(0, visibleMessages).map((msg, index) => {
          const entity = getEntity(msg.entity);
          return (
            <div
              key={`${session.id}-${index}`}
              className="flex gap-4 px-5 py-4 border-b border-[rgba(0,0,0,0.05)] animate-fade-up"
            >
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur border border-[rgba(0,0,0,0.1)] flex items-center justify-center flex-shrink-0">
                <EntityIcon icon={entity?.icon || 'brain'} className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-ui text-[11px] uppercase tracking-[0.5px]">{msg.entity}</span>
                  <span className="font-mono text-[10px] text-[#444]">{formatTime(index)}</span>
                </div>
                <p className="font-roos text-[14px] text-[#333] leading-relaxed">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {thinkingEntity && phase === 'revealing' && (
          <div className="px-5 py-3 text-center">
            <span className="font-mono text-[10px] text-[#444] italic">
              {thinkingEntity} is deliberating...
            </span>
          </div>
        )}

        {phase === 'concluded' && (
          <div className="px-5 py-4 text-center">
            <span className="font-mono text-[10px] text-[#444] italic">
              Session concluded. The Council will reconvene shortly.
            </span>
          </div>
        )}

        {phase === 'idle' && (
          <div className="px-5 py-6 text-center">
            <span className="font-mono text-[10px] text-[#444] italic">
              The Council will reconvene shortly.
            </span>
          </div>
        )}

        {phase === 'loading' && (
          <div className="px-5 py-6 text-center">
            <span className="font-mono text-[10px] text-[#444] italic">
              Connecting to Council chambers...
            </span>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-[rgba(0,0,0,0.02)] border-t border-[rgba(0,0,0,0.1)]">
        <p className="font-mono text-[10px] text-[#444] text-center">
          Live council discussions are classified. Observer access only.
        </p>
      </div>
    </div>
  );
}

export default function LiveCouncilTab() {
  return (
    <div className="space-y-8">
      <CouncilFormation />
      <EntityGrid />
      <DiscussionPanel />
    </div>
  );
}
