"use client";

import { useWallet } from "@/contexts/WalletContext";
import { ReactNode } from "react";
import Image from "next/image";

interface TokenGateProps {
  children: ReactNode;
  feature: string;
}

export function TokenGate({ children, feature }: TokenGateProps) {
  const { connected, verified, verifying, connectWallet, connecting, error } = useWallet();

  if (connected && verified) return <>{children}</>;

  if (verifying) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-[480px]">
          <p className="font-mono text-[12px] text-[#888] italic">Verifying token holdings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-[480px] space-y-6">
        <Image
          src="/images/council-icon.png"
          alt="Council"
          width={64}
          height={64}
          className="w-16 h-16 mx-auto opacity-50"
        />
        <h2 className="font-solaire text-[24px] text-[#2a2a2a]">Council Access Required</h2>
        <p className="font-roos text-[15px] text-[#666] leading-[1.6]">
          {!connected
            ? `${feature} is available to $COUNCIL token holders. Connect your Phantom wallet to verify your holdings.`
            : `Your wallet is connected but does not hold $COUNCIL tokens. Acquire $COUNCIL to access ${feature}.`
          }
        </p>
        {!connected ? (
          <button 
            className="px-6 py-3 border border-[#2a2a2a] text-[#2a2a2a] font-ui text-[11px] uppercase tracking-[1px] hover:bg-[#2a2a2a] hover:text-white transition-colors"
            onClick={connectWallet} 
            disabled={connecting}
          >
            {connecting ? "Connecting..." : "Connect Phantom Wallet"}
          </button>
        ) : (
          <a 
            href="https://pump.fun" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-block text-[#4a7c59] font-roos text-[14px] hover:underline"
          >
            Get $COUNCIL on pump.fun →
          </a>
        )}
        <p className="font-mono text-[11px] text-[#aaa] italic">
          Read-only verification. No transactions are signed.
        </p>
        {error && (
          <p className="font-mono text-[11px] text-[#c0392b]">{error}</p>
        )}
      </div>
    </div>
  );
}
