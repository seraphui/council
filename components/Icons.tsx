import { Brain } from 'lucide-react';
import Image from 'next/image';

export const SwordsIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="M16 16l4 4" />
    <path d="M19 21l2-2" />
    <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" />
    <path d="M11 19l-6-6" />
    <path d="M8 16l-4 4" />
    <path d="M5 21l-2-2" />
  </svg>
);

export const ScalesIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
    <path d="M12 3v18" />
    <path d="M5 7l7-3 7 3" />
    <path d="M3 13l2-6 4 6a4 4 0 0 1-6 0z" />
    <path d="M15 13l2-6 4 6a4 4 0 0 1-6 0z" />
    <path d="M9 21h6" />
  </svg>
);

export const ArrowUpIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M12 19V5" />
    <path d="M5 12l7-7 7 7" />
  </svg>
);

export const BrainIcon = ({ className = '' }: { className?: string }) => (
  <Brain className={className} strokeWidth={1.5} />
);

export const HumanSilhouette = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
  </svg>
);

export const CouncilLogo = () => (
  <Image 
    src="/images/council-logo.png" 
    alt="Council" 
    width={36} 
    height={36} 
    style={{ objectFit: 'contain' }}
  />
);

export const EntityIcon = ({ icon, className = '' }: { icon: string; className?: string }) => {
  switch (icon) {
    case 'swords':
      return <SwordsIcon className={className} />;
    case 'scales':
      return <ScalesIcon className={className} />;
    case 'arrow':
      return <ArrowUpIcon className={className} />;
    case 'brain':
      return <BrainIcon className={className} />;
    default:
      return null;
  }
};
