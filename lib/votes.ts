import { getSupabase } from './supabase';

export async function castVote(
  proposalId: string,
  optionIndex: number,
  walletAddress: string,
  votingPower: number
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('votes')
    .upsert(
      {
        proposal_id: proposalId,
        wallet_address: walletAddress,
        option_index: optionIndex,
        voting_power: votingPower,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'proposal_id,wallet_address' }
    );

  if (error) {
    console.error('Vote failed:', error);
    throw error;
  }

  return data;
}

export async function getVoteCounts(
  proposalId: string
): Promise<{ [optionIndex: number]: { count: number; power: number } }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('votes')
    .select('option_index, voting_power')
    .eq('proposal_id', proposalId);

  if (error) {
    console.error('Failed to load votes:', error);
    return {};
  }

  const counts: { [key: number]: { count: number; power: number } } = {};
  for (const vote of data || []) {
    if (!counts[vote.option_index]) {
      counts[vote.option_index] = { count: 0, power: 0 };
    }
    counts[vote.option_index].count += 1;
    counts[vote.option_index].power += Number(vote.voting_power);
  }

  return counts;
}

export async function getUserVote(
  proposalId: string,
  walletAddress: string
): Promise<number | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('votes')
    .select('option_index')
    .eq('proposal_id', proposalId)
    .eq('wallet_address', walletAddress)
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0].option_index;
}

export async function getAllVotes(): Promise<{
  [proposalId: string]: {
    counts: { [optionIndex: number]: { count: number; power: number } };
    totalVoters: number;
  };
}> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('votes')
    .select('proposal_id, option_index, voting_power');

  if (error) {
    console.error('Failed to load all votes:', error);
    return {};
  }

  const result: {
    [proposalId: string]: {
      counts: { [optionIndex: number]: { count: number; power: number } };
      totalVoters: number;
    };
  } = {};

  for (const vote of data || []) {
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

  return result;
}

export async function getUserVotes(
  walletAddress: string
): Promise<{ [proposalId: string]: number }> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('votes')
    .select('proposal_id, option_index')
    .eq('wallet_address', walletAddress);

  if (error) {
    console.error('Failed to load user votes:', error);
    return {};
  }

  const result: { [proposalId: string]: number } = {};
  for (const vote of data || []) {
    result[vote.proposal_id] = vote.option_index;
  }

  return result;
}
