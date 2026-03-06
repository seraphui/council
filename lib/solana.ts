import { Connection, PublicKey } from "@solana/web3.js";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const TOKEN_MINT_ADDRESS = process.env.COUNCIL_TOKEN_MINT_ADDRESS || "";
const MIN_TOKEN_BALANCE = Number(process.env.MIN_TOKEN_BALANCE || "1");
const BYPASS_TOKEN_GATE = (process.env.COUNCIL_BYPASS_TOKEN_GATE || "false") === "true";

const connection = new Connection(RPC_URL);

export async function isTokenHolder(walletAddress: string): Promise<{
  verified: boolean;
  balance: number;
  reason?: string;
}> {
  if (BYPASS_TOKEN_GATE) {
    return { verified: true, balance: MIN_TOKEN_BALANCE > 0 ? MIN_TOKEN_BALANCE : 1, reason: "TOKEN_GATE_BYPASSED" };
  }

  if (!TOKEN_MINT_ADDRESS) {
    return { verified: false, balance: 0, reason: "TOKEN_MINT_NOT_CONFIGURED" };
  }

  try {
    const walletPubKey = new PublicKey(walletAddress);
    const mintPubKey = new PublicKey(TOKEN_MINT_ADDRESS);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubKey, {
      mint: mintPubKey,
    });

    if (tokenAccounts.value.length === 0) {
      return { verified: false, balance: 0 };
    }

    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
    return {
      verified: balance >= MIN_TOKEN_BALANCE,
      balance,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return { verified: false, balance: 0, reason: "TOKEN_VERIFICATION_FAILED" };
  }
}
