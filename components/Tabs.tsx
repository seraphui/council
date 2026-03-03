'use client';

import { useWallet } from '@/contexts/WalletContext';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'live', label: 'Live Council', gated: false },
  { id: 'archive', label: 'Archive Logs', gated: false },
  { id: 'predictions', label: 'Predictions', gated: false },
  { id: 'decisions', label: 'Decisions and Voting', gated: true },
  { id: 'direct', label: 'Direct Chat', gated: true },
  { id: 'group', label: 'Group Chat', gated: true },
  { id: 'court', label: 'The Court', gated: true },
  { id: 'documentation', label: 'Documentation', gated: false },
];

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  const { connected, verified } = useWallet();
  const showGateIndicator = !connected || !verified;

  return (
    <section className="py-8 px-10">
      <p className="font-ui text-[11px] uppercase tracking-[1.5px] text-[#444] text-center mb-6">
        What the Council Provides
      </p>
      
      <div className="flex flex-wrap justify-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
            {tab.gated && showGateIndicator && (
              <span className="ml-1 text-[10px] text-[#aaa]">◇</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
