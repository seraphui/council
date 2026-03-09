'use client';

import { useState } from 'react';
import Navigation from './Navigation';
import Hero from './Hero';
import Tabs from './Tabs';
import Footer from './Footer';
import LiveCouncilTab from './tabs/LiveCouncilTab';
import ArchiveLogsTab from './tabs/ArchiveLogsTab';
import DecisionsTab from './tabs/DecisionsTab';
import DirectChatTab from './tabs/DirectChatTab';
import GroupChatTab from './tabs/GroupChatTab';
import CourtTab from './tabs/CourtTab';
import DocumentationTab from './tabs/DocumentationTab';
import PredictionsTab from './tabs/PredictionsTab';
import GovernanceTab from './tabs/GovernanceTab';
import { TokenGate } from './TokenGate';

export default function CouncilApp() {
  const [activeTab, setActiveTab] = useState('live');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'live':
        return <LiveCouncilTab />;
      case 'archive':
        return <ArchiveLogsTab />;
      case 'predictions':
        return <PredictionsTab />;
      case 'governance':
        return <GovernanceTab />;
      case 'decisions':
        return (
          <TokenGate feature="Voting">
            <DecisionsTab />
          </TokenGate>
        );
      case 'direct':
        return (
          <TokenGate feature="Direct Chat">
            <DirectChatTab />
          </TokenGate>
        );
      case 'group':
        return (
          <TokenGate feature="Group Chat">
            <GroupChatTab />
          </TokenGate>
        );
      case 'court':
        return (
          <TokenGate feature="The Court">
            <CourtTab />
          </TokenGate>
        );
      case 'documentation':
        return <DocumentationTab />;
      default:
        return <LiveCouncilTab />;
    }
  };

  return (
    <div className="min-h-screen">
      <div 
        className="max-w-[860px] mx-auto content-panel border-x border-[rgba(0,0,0,0.1)]"
        style={{ minHeight: '100vh' }}
      >
        <Navigation onTabChange={setActiveTab} />
        <Hero />
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="px-10 pb-10">
          {renderTabContent()}
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
