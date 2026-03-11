"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  verified: boolean;
  tokenBalance: number;
  connecting: boolean;
  verifying: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

function getPhantom() {
  if (typeof window === "undefined") return null;
  const w = window as any;
  // Phantom injects at window.phantom.solana (current) or window.solana (legacy)
  const provider = w?.phantom?.solana?.isPhantom ? w.phantom.solana : w?.solana;
  return provider?.isPhantom ? provider : null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    verified: false,
    tokenBalance: 0,
    connecting: false,
    verifying: false,
    error: null,
  });

  const verifyWallet = useCallback(async (address: string) => {
    setState(prev => ({ ...prev, verifying: true, error: null }));

    try {
      const res = await fetch("/api/verify-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Verification request failed");
      }

      const data = await res.json();

      setState(prev => ({
        ...prev,
        verified: data.verified,
        tokenBalance: data.balance,
        verifying: false,
      }));
    } catch (err) {
      console.error("Verification failed:", err);
      const message = err instanceof Error ? err.message : "Could not verify token holdings";
      setState(prev => ({
        ...prev,
        verified: false,
        verifying: false,
        error: message,
      }));
    }
  }, []);

  const connectWallet = useCallback(async () => {
    const phantom = getPhantom();

    if (!phantom) {
      // Open Phantom install page in new tab; do not navigate current window
      window.open("https://phantom.app/", "_blank", "noopener,noreferrer");
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const resp = await phantom.connect();
      const pubkey = resp.publicKey?.toString?.() ?? resp.publicKey;

      if (!pubkey) {
        throw new Error("No public key returned");
      }

      setState(prev => ({
        ...prev,
        connected: true,
        publicKey: pubkey,
        connecting: false,
      }));

      await verifyWallet(pubkey);
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: err?.message === "User rejected the request."
          ? "Connection cancelled"
          : "Failed to connect wallet",
      }));
    }
  }, [verifyWallet]);

  const disconnectWallet = useCallback(() => {
    const phantom = getPhantom();
    if (phantom) phantom.disconnect();

    setState({
      connected: false,
      publicKey: null,
      verified: false,
      tokenBalance: 0,
      connecting: false,
      verifying: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    const phantom = getPhantom();
    if (phantom?.isConnected && phantom?.publicKey) {
      const pubkey = phantom.publicKey?.toString?.() ?? phantom.publicKey;
      if (pubkey) {
        setState(prev => ({
          ...prev,
          connected: true,
          publicKey: String(pubkey),
        }));
        verifyWallet(String(pubkey));
      }
    }

    const handleChange = (newPubkey: any) => {
      if (newPubkey) {
        const addr = newPubkey?.toString?.() ?? String(newPubkey);
        setState(prev => ({ ...prev, publicKey: addr }));
        verifyWallet(addr);
      } else {
        setState({
          connected: false,
          publicKey: null,
          verified: false,
          tokenBalance: 0,
          connecting: false,
          verifying: false,
          error: null,
        });
      }
    };

    if (phantom) {
      phantom.on("accountChanged", handleChange);
      return () => phantom.removeListener("accountChanged", handleChange);
    }
  }, [verifyWallet]);

  return (
    <WalletContext.Provider value={{ ...state, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}
