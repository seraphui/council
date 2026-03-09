import { Connection, PublicKey } from '@solana/web3.js';

const TREASURY_WALLET = process.env.TREASURY_WALLET_ADDRESS!;
const SOLANA_RPC = process.env.SOLANA_RPC_URL!;

export async function getTreasuryBalanceSol(): Promise<number> {
  const connection = new Connection(SOLANA_RPC);
  const pubkey = new PublicKey(TREASURY_WALLET);
  const lamports = await connection.getBalance(pubkey);
  return lamports / 1e9;
}

export async function verifySolTransfer(
  txSignature: string,
  expectedSender: string,
  expectedAmountSol: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const connection = new Connection(SOLANA_RPC);
    const tx = await connection.getParsedTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return { valid: false, error: 'Transaction not found' };
    if (tx.meta?.err) return { valid: false, error: 'Transaction failed on-chain' };

    const preBalances = tx.meta?.preBalances || [];
    const postBalances = tx.meta?.postBalances || [];
    const accountKeys = tx.transaction.message.accountKeys;

    const treasuryIndex = accountKeys.findIndex(
      (key) => key.pubkey.toBase58() === TREASURY_WALLET
    );
    if (treasuryIndex === -1) return { valid: false, error: 'Treasury wallet not in transaction' };

    const received = (postBalances[treasuryIndex] - preBalances[treasuryIndex]) / 1e9;
    if (received < expectedAmountSol * 0.99) {
      return { valid: false, error: `Insufficient amount: received ${received} SOL, expected ${expectedAmountSol}` };
    }

    const senderKey = accountKeys[0].pubkey.toBase58();
    if (senderKey !== expectedSender) {
      return { valid: false, error: 'Transaction sender does not match agent wallet' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Verification failed: ${err}` };
  }
}
