'use client';

import { CouncilLogo } from './Icons';
import { WalletButton } from './WalletButton';
import { useWallet } from '@/contexts/WalletContext';

interface NavigationProps {
  onTabChange: (tab: string) => void;
}

export default function Navigation({ onTabChange }: NavigationProps) {
  const { connected, verified } = useWallet();
  const gated = !connected || !verified;

  const handleNavClick = (tab: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onTabChange(tab);
    document.querySelector('.tab-button')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <nav className="flex items-center justify-between py-5 px-10 border-b border-[rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-3">
        <CouncilLogo />
        <span className="font-solaire text-[22px] tracking-wide text-[#1a1a1a]">Council</span>
      </div>
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6">
          <a 
            href="#live" 
            onClick={handleNavClick('live')}
            className="font-ui text-[11px] uppercase tracking-wider text-[#444] hover:text-[#1a1a1a] transition-colors cursor-pointer"
          >
            Live Council
          </a>
          <a 
            href="#court" 
            onClick={handleNavClick('court')}
            className="font-ui text-[11px] uppercase tracking-wider text-[#444] hover:text-[#1a1a1a] transition-colors cursor-pointer"
          >
            The Court
            {gated && <span className="ml-1 text-[10px] text-[#aaa]">◇</span>}
          </a>
          <a 
            href="#predictions" 
            onClick={handleNavClick('predictions')}
            className="font-ui text-[11px] uppercase tracking-wider text-[#444] hover:text-[#1a1a1a] transition-colors cursor-pointer"
          >
            Predictions
          </a>
        </div>
        
        <WalletButton />
      </div>
    </nav>
  );
}
