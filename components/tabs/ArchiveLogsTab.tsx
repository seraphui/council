'use client';

import { useState } from 'react';
import { ARCHIVE_LOGS, ArchiveLog } from '@/data/archive-logs';
import { MagicCard } from '../MagicCard';
import { ArrowLeft, Download } from 'lucide-react';
import { EntityIcon } from '../Icons';
import { entities } from '@/lib/entities';
export const dynamic = 'force-dynamic';

interface DynamicLog {
  id: string;
  date: string;
  topic: string;
  summary: string;
  status: string;
  transcript: { speaker: string; message: string }[];
}

const getEntityIcon = (entityId: string) => {
  const entity = entities.find(e => e.id === entityId);
  return entity?.icon || 'brain';
};

type AnyLog = ArchiveLog | DynamicLog;

function generateDownloadContent(log: AnyLog): string {
  let content = `COUNCIL OF AGI — ARCHIVE LOG\n`;
  content += `ID: ${log.id}\n`;
  content += `Date: ${log.date}\n`;
  content += `Topic: ${log.topic}\n`;
  content += `Resolution: ${log.summary}\n`;
  content += `─────────────────────────────────\n\n`;
  
  log.transcript.forEach((entry) => {
    content += `${entry.speaker}: ${entry.message}\n\n`;
  });
  
  return content;
}

function downloadTranscript(log: AnyLog) {
  const content = generateDownloadContent(log);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${log.id}-${log.topic.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ArchiveLogsTab() {
  const [selectedLog, setSelectedLog] = useState<ArchiveLog | DynamicLog | null>(null);

  // Only show static archive logs 1–12 (LOG-0001 through LOG-0012)
  const allLogs = ARCHIVE_LOGS;

  if (selectedLog) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedLog(null)}
          className="flex items-center gap-2 font-mono text-[12px] text-[#666] hover:text-[#1a1a1a] transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Archive
        </button>

        <div className="border border-[rgba(0,0,0,0.1)] p-6">
          <div className="border-b border-[rgba(0,0,0,0.1)] pb-4 mb-6">
            <div className="flex items-center gap-4 mb-2">
              <span className="font-mono text-[12px] tracking-[0.5px] text-[#666]">{selectedLog.id}</span>
              <span className="font-mono text-[12px] text-[#666]">{selectedLog.date}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.5px] text-[#4a7c59]">
                {selectedLog.status}
              </span>
            </div>
            <h2 className="font-solaire text-[24px] text-[#1a1a1a] mb-2">{selectedLog.topic}</h2>
            <p className="font-roos text-[14px] text-[#666] italic">{selectedLog.summary}</p>
          </div>

          <div className="space-y-4">
            {selectedLog.transcript.map((entry, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-8 h-8 rounded-full border border-[rgba(0,0,0,0.15)] bg-[rgba(255,255,255,0.6)] flex items-center justify-center flex-shrink-0">
                  <EntityIcon icon={getEntityIcon(entry.speaker)} className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="font-mono text-[11px] tracking-[1px] text-[#666] block mb-1">
                    {entry.speaker}
                  </span>
                  <p className="font-roos text-[15px] leading-[1.7] text-[#1a1a1a]">
                    {entry.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[rgba(0,0,0,0.1)] mt-8 pt-6">
            <button
              onClick={() => downloadTranscript(selectedLog)}
              className="flex items-center gap-2 font-mono text-[12px] text-[#666] hover:text-[#1a1a1a] transition-colors border border-[rgba(0,0,0,0.15)] px-4 py-2"
            >
              <Download size={14} />
              Download Transcript
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-[rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-[80px_90px_1fr_90px_50px] gap-4 px-5 py-3 border-b border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)]">
          <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">ID</span>
          <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Date</span>
          <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Topic</span>
          <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Status</span>
          <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]"></span>
        </div>

        {allLogs.map((log) => (
          <MagicCard 
            key={log.id} 
            className="border-0 border-b border-[rgba(0,0,0,0.05)] last:border-b-0 cursor-pointer"
            gradientColor="rgba(180,160,140,0.08)"
          >
            <div 
              className="grid grid-cols-[80px_90px_1fr_90px_50px] gap-4 px-5 py-4 items-center"
              onClick={() => setSelectedLog(log)}
            >
              <span className="font-mono text-[12px] tracking-[0.5px]">{log.id}</span>
              <span className="font-mono text-[12px] text-[#444]">{log.date}</span>
              <span className="font-roos text-[14px] text-[#333]">{log.topic}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.5px] text-[#4a7c59]">
                {log.status}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTranscript(log);
                }}
                className="font-mono text-[10px] text-[#666] hover:text-[#1a1a1a] transition-colors"
                title="Download transcript"
              >
                ↓ TXT
              </button>
            </div>
          </MagicCard>
        ))}
      </div>
    </div>
  );
}
