import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  const mintAddress = process.env.COUNCIL_TOKEN_MINT_ADDRESS || "";
  return NextResponse.json({
    status: 'ok',
    hasMintConfigured: !!mintAddress,
    wouldAutoVerify: !mintAddress,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    const mintAddress = process.env.COUNCIL_TOKEN_MINT_ADDRESS || "";

    if (!mintAddress) {
      return NextResponse.json({ verified: true, balance: 0 });
    }

    const { PublicKey } = await import("@solana/web3.js");
    const { isTokenHolder } = await import("@/lib/solana");

    try {
      new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }

    const result = await isTokenHolder(walletAddress);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Wallet verification error:", error);
    return NextResponse.json({ verified: true, balance: 0 });
  }
}
