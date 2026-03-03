"use client";

import { useWallet } from "@/contexts/WalletContext";

export function WalletButton() {
  const { connected, publicKey, verified, connecting, verifying, connectWallet, disconnectWallet } = useWallet();

  if (connecting) {
    return (
      <button 
        className="font-roos text-[13px] px-4 py-2 border border-[#d4cfc7] text-[#666] cursor-not-allowed"
        disabled
      >
        Connecting...
      </button>
    );
  }

  if (connected && publicKey) {
    const short = publicKey.slice(0, 4) + "..." + publicKey.slice(-4);
    return (
      <div className="flex items-center gap-2">
        {verifying ? (
          <span className="font-mono text-[12px] text-[#888]">...</span>
        ) : (
          <span className={`font-mono text-[14px] ${verified ? "text-[#4a7c59]" : "text-[#aaa]"}`}>
            {verified ? "◈" : "○"}
          </span>
        )}
        <span className="font-mono text-[12px] text-[#888]">{short}</span>
        <button 
          className="text-[#aaa] hover:text-[#c0392b] transition-colors text-[16px] leading-none"
          onClick={disconnectWallet}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <button 
      className="font-roos text-[13px] px-4 py-2 border border-[#d4cfc7] text-[#333] hover:border-[#1a1a1a] transition-colors"
      onClick={connectWallet}
    >
      Connect Wallet
    </button>
  );
}
