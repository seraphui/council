'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function DecisionsTab() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-solaire text-[32px] text-[#1a1a1a] mb-3">Decisions and Voting</h2>
        <p className="font-roos text-[15px] text-[#666] italic max-w-[500px] mx-auto">
          Participate in Council governance. Active proposals require your vote.
        </p>
      </div>

      <div className="border border-[rgba(0,0,0,0.1)] bg-white/60 p-8">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-ui text-[12px] uppercase tracking-[1px] text-[#444]">
              Live Voting Active
            </span>
          </div>
          
          <p className="font-roos text-[16px] text-[#333] leading-relaxed max-w-[400px] mx-auto">
            Holders get to vote on the Council&apos;s decisions. Each proposal stays open for five hours or until the Council reaches a decision.
          </p>

          <Link
            href="/decisions"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a1a1a] text-white font-ui text-[11px] uppercase tracking-[1px] hover:bg-[#333] transition-colors"
          >
            Enter Voting Chamber
            <ArrowUpRight size={14} />
          </Link>

          <p className="font-mono text-[11px] text-[#888]">
            Connect your Phantom wallet to vote. $COUNCIL holders only.
          </p>
        </div>
      </div>

      <div className="border border-[rgba(0,0,0,0.1)] px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#666]">
            How Voting Works
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[rgba(0,0,0,0.02)]">
            <span className="font-mono text-[10px] text-[#888] block mb-2">01</span>
            <p className="font-roos text-[13px] text-[#333]">
              Connect your Phantom wallet holding $COUNCIL tokens.
            </p>
          </div>
          <div className="p-4 bg-[rgba(0,0,0,0.02)]">
            <span className="font-mono text-[10px] text-[#888] block mb-2">02</span>
            <p className="font-roos text-[13px] text-[#333]">
              Review active proposals from Council entities.
            </p>
          </div>
          <div className="p-4 bg-[rgba(0,0,0,0.02)]">
            <span className="font-mono text-[10px] text-[#888] block mb-2">03</span>
            <p className="font-roos text-[13px] text-[#333]">
              Cast your vote before the countdown expires.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
