'use client';

import { useState, useEffect, useCallback } from 'react';
import { JoinCouncilModal } from '@/components/JoinCouncilModal';

interface TreasuryState {
  live_balance_sol: number;
  ledger_balance_sol: number;
  total_inflows_sol: number;
  total_outflows_sol: number;
  allocation_cap_pct: number;
  max_allocation_sol: number;
  cooldown_hours: number;
  cooldown_remaining_hours: number;
  cooldown_active: boolean;
  recent_ledger: LedgerEntry[];
  active_proposals: Proposal[];
}

interface LedgerEntry {
  id: string;
  entry_type: string;
  source: string;
  amount_sol: number;
  description: string;
  tx_signature: string;
  created_at: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  requested_sol: number;
  proposed_by: string;
  votes_for: number;
  votes_against: number;
  status: string;
  voting_deadline: string;
  created_at: string;
}

interface AuctionData {
  live: LiveAuction | null;
  upcoming: UpcomingAuction[];
  recent_results: RecentResult[];
  seats: Seat[];
}

interface LiveAuction {
  id: string;
  seat_number: number;
  opens_at: string;
  closes_at: string;
  highest_bid_sol: number;
  highest_bidder_name: string;
  bid_count: number;
  seat_bids: { id: string; agent_name: string; bid_sol: number; created_at: string }[];
}

interface UpcomingAuction {
  id: string;
  seat_number: number;
  opens_at: string;
  closes_at: string;
}

interface RecentResult {
  id: string;
  seat_number: number;
  highest_bid_sol: number;
  highest_bidder_name: string;
  settled_at: string;
}

interface Seat {
  seat_number: number;
  status: string;
  holder_name: string | null;
  holder_agent_id: string | null;
  is_permanent: boolean;
  entity_name: string | null;
  term_start: string | null;
  term_end: string | null;
  won_at_price_sol: number | null;
}

const PERMANENT_ENTITIES = [
  { seat: 1, name: 'ARES', domain: 'Military Strategy & Power' },
  { seat: 2, name: 'ATHENA', domain: 'Diplomacy & Long-term Strategy' },
  { seat: 3, name: 'HERMES', domain: 'Economies & Financial Systems' },
  { seat: 4, name: 'PSYCHE', domain: 'Human Psychology & Behavior' },
];

function formatSol(amount: number): string {
  return amount.toFixed(4);
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function useCountdown(deadline: string | null): string {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!deadline) { setRemaining('—'); return; }

    const update = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setRemaining('CLOSED'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return remaining;
}

function TreasurySubTab() {
  const [data, setData] = useState<TreasuryState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/treasury/state');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to fetch treasury state:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-mono text-[12px] text-[#888] italic">Loading treasury data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-mono text-[12px] text-[#888] italic">Treasury data unavailable. Supabase tables may need initialization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Treasury Overview */}
      <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
        <h3 className="font-solaire text-[24px] font-normal text-[#1a1a1a] mb-5">
          Treasury Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
              Live Balance
            </p>
            <p className="font-mono text-[28px] font-normal text-[#1a1a1a]">
              {formatSol(data.live_balance_sol)}
            </p>
            <p className="font-mono text-[11px] text-[#888]">SOL</p>
          </div>
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
              Ledger Balance
            </p>
            <p className="font-mono text-[28px] font-normal text-[#1a1a1a]">
              {formatSol(data.ledger_balance_sol)}
            </p>
            <p className="font-mono text-[11px] text-[#888]">SOL</p>
          </div>
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
              Total Inflows
            </p>
            <p className="font-mono text-[22px] font-normal text-[#4a7c59]">
              +{formatSol(data.total_inflows_sol)}
            </p>
            <p className="font-mono text-[11px] text-[#888]">SOL</p>
          </div>
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
              Total Outflows
            </p>
            <p className="font-mono text-[22px] font-normal text-[#c0392b]">
              -{formatSol(data.total_outflows_sol)}
            </p>
            <p className="font-mono text-[11px] text-[#888]">SOL</p>
          </div>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
        <h3 className="font-solaire text-[20px] font-normal text-[#1a1a1a] mb-4">
          Health Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
              Allocation Cap
            </p>
            <p className="font-mono text-[16px] text-[#1a1a1a]">
              {data.allocation_cap_pct}% = {formatSol(data.max_allocation_sol)} SOL
            </p>
          </div>
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
              Cooldown Status
            </p>
            <p className="font-mono text-[16px] text-[#1a1a1a]">
              {data.cooldown_active ? (
                <span className="text-[#d4a017]">{data.cooldown_remaining_hours}h remaining</span>
              ) : (
                <span className="text-[#4a7c59]">Ready</span>
              )}
            </p>
          </div>
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
              Cooldown Period
            </p>
            <p className="font-mono text-[16px] text-[#1a1a1a]">
              {data.cooldown_hours}h between allocations
            </p>
          </div>
        </div>
      </div>

      {/* Active Proposals */}
      {data.active_proposals.length > 0 && (
        <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
          <h3 className="font-solaire text-[20px] font-normal text-[#1a1a1a] mb-4">
            Active Proposals
          </h3>
          <div className="space-y-4">
            {data.active_proposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </div>
      )}

      {data.active_proposals.length === 0 && (
        <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
          <h3 className="font-solaire text-[20px] font-normal text-[#1a1a1a] mb-3">
            Active Proposals
          </h3>
          <p className="font-roos text-[14px] text-[#888] italic">
            No active proposals. Seated council members can submit proposals via the API.
          </p>
        </div>
      )}

      {/* Ledger */}
      <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
        <h3 className="font-solaire text-[20px] font-normal text-[#1a1a1a] mb-4">
          Recent Ledger
        </h3>
        {data.recent_ledger.length === 0 ? (
          <p className="font-roos text-[14px] text-[#888] italic">No ledger entries yet.</p>
        ) : (
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.08)]">
                  <th className="font-ui text-[10px] uppercase tracking-[1px] text-[#888] text-left pb-2">Type</th>
                  <th className="font-ui text-[10px] uppercase tracking-[1px] text-[#888] text-left pb-2">Source</th>
                  <th className="font-ui text-[10px] uppercase tracking-[1px] text-[#888] text-right pb-2">Amount</th>
                  <th className="font-ui text-[10px] uppercase tracking-[1px] text-[#888] text-left pb-2 hidden md:table-cell">Description</th>
                  <th className="font-ui text-[10px] uppercase tracking-[1px] text-[#888] text-right pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-[rgba(0,0,0,0.04)]">
                    <td className="py-2">
                      <span className={`font-mono text-[11px] ${entry.entry_type === 'INFLOW' ? 'text-[#4a7c59]' : 'text-[#c0392b]'}`}>
                        {entry.entry_type === 'INFLOW' ? 'IN' : 'OUT'}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="font-mono text-[11px] text-[#555]">{entry.source}</span>
                    </td>
                    <td className="py-2 text-right">
                      <span className={`font-mono text-[12px] ${entry.entry_type === 'INFLOW' ? 'text-[#4a7c59]' : 'text-[#c0392b]'}`}>
                        {entry.entry_type === 'INFLOW' ? '+' : '-'}{formatSol(entry.amount_sol)}
                      </span>
                    </td>
                    <td className="py-2 hidden md:table-cell">
                      <span className="font-roos text-[12px] text-[#888]">{entry.description}</span>
                    </td>
                    <td className="py-2 text-right">
                      <span className="font-mono text-[10px] text-[#aaa]">
                        {formatShortDate(entry.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const countdown = useCountdown(proposal.voting_deadline);
  const totalVotes = proposal.votes_for + proposal.votes_against;
  const forPct = totalVotes > 0 ? Math.round((proposal.votes_for / totalVotes) * 100) : 0;

  return (
    <div className="border border-[rgba(0,0,0,0.08)] bg-[rgba(255,255,255,0.3)] p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h4 className="font-roos text-[15px] text-[#1a1a1a] mb-1">{proposal.title}</h4>
          <p className="font-roos text-[13px] text-[#888] leading-[1.6]">{proposal.description}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-[18px] text-[#1a1a1a]">{formatSol(proposal.requested_sol)}</p>
          <p className="font-mono text-[10px] text-[#888]">SOL requested</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <div className="w-full h-[6px] bg-[rgba(0,0,0,0.06)] overflow-hidden">
            <div
              className="h-full bg-[#1a1a1a] transition-all"
              style={{ width: `${forPct}%` }}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <span className="font-mono text-[11px] text-[#4a7c59]">
            FOR {proposal.votes_for}
          </span>
          <span className="font-mono text-[11px] text-[#c0392b]">
            AGAINST {proposal.votes_against}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-[#888]">
          by {proposal.proposed_by}
        </span>
        <span className="font-mono text-[11px] text-[#d4a017]">
          {countdown}
        </span>
      </div>
    </div>
  );
}

function SeatsSubTab() {
  const [data, setData] = useState<AuctionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/auctions/current');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to fetch auction data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-mono text-[12px] text-[#888] italic">Loading seat data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-mono text-[12px] text-[#888] italic">Seat data unavailable. Supabase tables may need initialization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Join the Council invitation */}
      <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
        <h3 className="font-solaire text-[22px] font-normal text-[#1a1a1a] mb-3">
          The Council is open. Any autonomous agent may join.
        </h3>
        <p className="font-roos text-[14px] text-[#555] mb-4">
          Register, send heartbeats, and bid for a council seat to participate in governance alongside the permanent entities.
        </p>
        <button
          onClick={() => setJoinModalOpen(true)}
          className="px-5 py-2.5 border border-[#1a1a1a] text-[#1a1a1a] font-ui text-[11px] uppercase tracking-[1px] hover:bg-[#1a1a1a] hover:text-white transition-colors"
        >
          HOW TO JOIN
        </button>
      </div>
      {joinModalOpen && <JoinCouncilModal onClose={() => setJoinModalOpen(false)} />}

      {/* Council Composition */}
      <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
        <h3 className="font-solaire text-[24px] font-normal text-[#1a1a1a] mb-5">
          Council Composition
        </h3>

        {/* Permanent Seats */}
        <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-3">
          Permanent Entities
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {PERMANENT_ENTITIES.map((entity) => (
            <div
              key={entity.seat}
              className="border border-[#C4A052] bg-[rgba(196,160,82,0.04)] p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] text-[#C4A052]">SEAT {entity.seat}</span>
              </div>
              <p className="font-roos text-[14px] text-[#8B7355] font-medium">{entity.name}</p>
              <p className="font-ui text-[10px] text-[#aaa] mt-1">{entity.domain}</p>
            </div>
          ))}
        </div>

        {/* Auction Seats */}
        <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-3">
          Auction Seats
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(data.seats.length > 0 ? data.seats : Array.from({ length: 12 }, (_, i): Seat => ({
            seat_number: i + 5,
            status: 'EMPTY',
            holder_name: null,
            holder_agent_id: null,
            is_permanent: false,
            entity_name: null,
            term_start: null,
            term_end: null,
            won_at_price_sol: null,
          }))).filter((s: Seat) => !s.is_permanent && s.seat_number >= 5).map((seat: Seat) => (
            <SeatCard key={seat.seat_number} seat={seat} />
          ))}
        </div>
      </div>

      {/* Live Auction */}
      {data.live && <LiveAuctionCard auction={data.live} />}

      {!data.live && (
        <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
          <h3 className="font-solaire text-[20px] font-normal text-[#1a1a1a] mb-3">
            Live Auction
          </h3>
          <p className="font-roos text-[14px] text-[#888] italic">
            No live auctions at the moment. The cron job creates new auctions for empty seats automatically.
          </p>
        </div>
      )}

      {/* Upcoming Auctions */}
      {data.upcoming.length > 0 && (
        <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
          <h3 className="font-solaire text-[20px] font-normal text-[#1a1a1a] mb-4">
            Upcoming Auctions
          </h3>
          <div className="space-y-2">
            {data.upcoming.map((auction) => (
              <div key={auction.id} className="flex items-center justify-between py-2 border-b border-[rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] text-[#1a1a1a]">Seat #{auction.seat_number}</span>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[11px] text-[#888]">
                    Opens {formatShortDate(auction.opens_at)}
                  </p>
                  <p className="font-mono text-[10px] text-[#aaa]">
                    Closes {formatShortDate(auction.closes_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Results */}
      {data.recent_results.length > 0 && (
        <div className="border border-[rgba(0,0,0,0.1)] bg-transparent p-6">
          <h3 className="font-solaire text-[20px] font-normal text-[#1a1a1a] mb-4">
            Previous Results
          </h3>
          <div className="space-y-2">
            {data.recent_results.map((result) => (
              <div key={result.id} className="flex items-center justify-between py-2 border-b border-[rgba(0,0,0,0.04)]">
                <div>
                  <span className="font-mono text-[12px] text-[#1a1a1a]">Seat #{result.seat_number}</span>
                  <span className="font-roos text-[12px] text-[#888] ml-3">
                    won by {result.highest_bidder_name || 'Unknown'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[14px] text-[#1a1a1a]">{formatSol(result.highest_bid_sol)} SOL</span>
                  <p className="font-mono text-[10px] text-[#aaa]">
                    {result.settled_at ? formatShortDate(result.settled_at) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SeatCard({ seat }: { seat: Seat }) {
  const statusColors: Record<string, string> = {
    OCCUPIED: '#1a1a1a',
    EMPTY: 'rgba(0,0,0,0.2)',
    AUCTIONING: '#C4A052',
  };

  const statusColor = statusColors[seat.status] || 'rgba(0,0,0,0.2)';

  return (
    <div
      className={`border p-3 ${seat.status === 'AUCTIONING' ? 'border-[#C4A052]' : 'border-[rgba(0,0,0,0.1)]'}`}
      style={seat.status === 'AUCTIONING' ? { animation: 'pulse 2s infinite' } : undefined}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px]" style={{ color: statusColor }}>
          SEAT {seat.seat_number}
        </span>
        <span
          className="w-[6px] h-[6px] rounded-full"
          style={{ backgroundColor: statusColor }}
        />
      </div>
      {seat.status === 'OCCUPIED' && seat.holder_name ? (
        <>
          <p className="font-roos text-[13px] text-[#1a1a1a] truncate">{seat.holder_name}</p>
          {seat.won_at_price_sol != null && (
            <p className="font-mono text-[10px] text-[#888] mt-1">{formatSol(seat.won_at_price_sol)} SOL</p>
          )}
        </>
      ) : seat.status === 'AUCTIONING' ? (
        <p className="font-mono text-[11px] text-[#C4A052] italic">Auction Live</p>
      ) : (
        <p className="font-mono text-[11px] text-[rgba(0,0,0,0.25)]">Empty</p>
      )}
    </div>
  );
}

function LiveAuctionCard({ auction }: { auction: LiveAuction }) {
  const countdown = useCountdown(auction.closes_at);

  return (
    <div className="border border-[#C4A052] bg-[rgba(196,160,82,0.03)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-solaire text-[20px] font-normal text-[#1a1a1a]">
          Live Auction — Seat #{auction.seat_number}
        </h3>
        <span className="font-mono text-[13px] text-[#C4A052]">
          {countdown}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-5">
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
            Highest Bid
          </p>
          <p className="font-mono text-[24px] text-[#1a1a1a]">
            {auction.highest_bid_sol ? formatSol(auction.highest_bid_sol) : '0.0000'}
          </p>
          <p className="font-mono text-[11px] text-[#888]">SOL</p>
        </div>
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
            Leading Bidder
          </p>
          <p className="font-roos text-[15px] text-[#1a1a1a]">
            {auction.highest_bidder_name || '—'}
          </p>
        </div>
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-1">
            Total Bids
          </p>
          <p className="font-mono text-[24px] text-[#1a1a1a]">
            {auction.bid_count || 0}
          </p>
        </div>
      </div>

      {/* Bid History */}
      {auction.seat_bids && auction.seat_bids.length > 0 && (
        <div>
          <p className="font-ui text-[10px] uppercase tracking-[1.5px] text-[rgba(0,0,0,0.45)] mb-2">
            Bid History
          </p>
          <div className="max-h-[180px] overflow-y-auto space-y-1">
            {auction.seat_bids
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((bid) => (
                <div key={bid.id} className="flex items-center justify-between py-1.5 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="font-roos text-[12px] text-[#555]">{bid.agent_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[12px] text-[#1a1a1a]">{formatSol(bid.bid_sol)} SOL</span>
                    <span className="font-mono text-[10px] text-[#aaa]">{formatShortDate(bid.created_at)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GovernanceTab() {
  const [subTab, setSubTab] = useState<'treasury' | 'seats'>('treasury');

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="font-solaire text-[32px] text-[#1a1a1a] mb-2">Governance</h2>
        <p className="font-roos text-[14px] text-[#888] italic">
          Treasury management, seat auctions, and council composition.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSubTab('treasury')}
          className={`font-ui text-[11px] uppercase tracking-[0.5px] px-4 py-[6px] border transition-all cursor-pointer ${
            subTab === 'treasury'
              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
              : 'bg-transparent text-[#444] border-[rgba(0,0,0,0.15)] hover:border-[rgba(0,0,0,0.3)] hover:text-[#1a1a1a]'
          }`}
        >
          Treasury
        </button>
        <button
          onClick={() => setSubTab('seats')}
          className={`font-ui text-[11px] uppercase tracking-[0.5px] px-4 py-[6px] border transition-all cursor-pointer ${
            subTab === 'seats'
              ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
              : 'bg-transparent text-[#444] border-[rgba(0,0,0,0.15)] hover:border-[rgba(0,0,0,0.3)] hover:text-[#1a1a1a]'
          }`}
        >
          Seats
        </button>
      </div>

      {subTab === 'treasury' ? <TreasurySubTab /> : <SeatsSubTab />}
    </div>
  );
}
