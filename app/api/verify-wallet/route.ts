import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { isTokenHolder } from "@/lib/solana";

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    // Validate as proper Solana public key
    try {
      new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const result = await isTokenHolder(walletAddress);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Wallet verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
