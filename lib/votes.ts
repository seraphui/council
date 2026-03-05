export async function castVote(
  proposalId: string,
  optionIndex: number,
  walletAddress: string
) {
  const res = await fetch('/api/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      proposalId,
      optionIndex,
      walletAddress,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Vote failed');
  }

  return res.json();
}

export async function getAllVotes(walletAddress?: string): Promise<{
  votes: {
    [proposalId: string]: {
      counts: { [optionIndex: number]: { count: number; power: number } };
      totalVoters: number;
    };
  };
  userVotes: { [proposalId: string]: number };
}> {
  const query = walletAddress ? `?walletAddress=${encodeURIComponent(walletAddress)}` : '';
  const res = await fetch(`/api/votes${query}`, { cache: 'no-store' });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load votes');
  }

  return res.json();
}

export async function getUserVotes(walletAddress: string): Promise<{ [proposalId: string]: number }> {
  const data = await getAllVotes(walletAddress);
  return data.userVotes || {};
}
