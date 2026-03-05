import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getSupabaseServer } from '@/lib/supabase-server';
import { isTokenHolder } from '@/lib/solana';

type VoteRow = {
  proposal_id: string;
  option_index: number;
  voting_power: number | string;
};

type UserVoteRow = {
  proposal_id: string;
  option_index: number;
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');

    const { data, error } = await supabase
      .from('votes')
      .select('proposal_id, option_index, voting_power');

    if (error) {
      return NextResponse.json({ error: 'Failed to load votes' }, { status: 500 });
    }

    const result: {
      [proposalId: string]: {
        counts: { [optionIndex: number]: { count: number; power: number } };
        totalVoters: number;
      };
    } = {};

    for (const vote of (data || []) as VoteRow[]) {
      if (!result[vote.proposal_id]) {
        result[vote.proposal_id] = { counts: {}, totalVoters: 0 };
      }

      const proposal = result[vote.proposal_id];
      if (!proposal.counts[vote.option_index]) {
        proposal.counts[vote.option_index] = { count: 0, power: 0 };
      }

      proposal.counts[vote.option_index].count += 1;
      proposal.counts[vote.option_index].power += Number(vote.voting_power);
      proposal.totalVoters += 1;
    }

    const userVotes: { [proposalId: string]: number } = {};
    if (walletAddress) {
      try {
        new PublicKey(walletAddress);
      } catch {
        return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
      }

      const { data: userData, error: userError } = await supabase
        .from('votes')
        .select('proposal_id, option_index')
        .eq('wallet_address', walletAddress);

      if (userError) {
        return NextResponse.json({ error: 'Failed to load user votes' }, { status: 500 });
      }

      for (const vote of (userData || []) as UserVoteRow[]) {
        userVotes[vote.proposal_id] = vote.option_index;
      }
    }

    return NextResponse.json({ votes: result, userVotes });
  } catch (error) {
    console.error('Votes API GET error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { proposalId, optionIndex, walletAddress } = await request.json();

    if (!proposalId || typeof proposalId !== 'string') {
      return NextResponse.json({ error: 'Missing proposalId' }, { status: 400 });
    }

    if (!Number.isInteger(optionIndex) || optionIndex < 0) {
      return NextResponse.json({ error: 'Invalid optionIndex' }, { status: 400 });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'Missing walletAddress' }, { status: 400 });
    }

    try {
      new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const verification = await isTokenHolder(walletAddress);
    if (verification.reason === 'TOKEN_MINT_NOT_CONFIGURED') {
      return NextResponse.json(
        { error: 'Voting is unavailable: token mint is not configured on the server' },
        { status: 500 }
      );
    }

    if (!verification.verified || verification.balance <= 0) {
      return NextResponse.json({ error: 'Wallet is not eligible to vote' }, { status: 403 });
    }

    const supabase = getSupabaseServer();
    const { error } = await supabase
      .from('votes')
      .upsert(
        {
          proposal_id: proposalId,
          wallet_address: walletAddress,
          option_index: optionIndex,
          voting_power: verification.balance,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'proposal_id,wallet_address' }
      );

    if (error) {
      return NextResponse.json({ error: 'Vote failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      votingPower: verification.balance,
    });
  } catch (error) {
    console.error('Votes API POST error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
