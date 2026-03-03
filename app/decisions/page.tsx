'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { castVote, getAllVotes, getUserVotes } from '@/lib/votes';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Fixed global start time for universal sync
const GLOBAL_START_TIME = new Date("2026-03-01T08:00:00Z").getTime();

// Timing configuration (in milliseconds)
// FAST TEST MODE: Change these values for testing
// const FIRST_PHASE_INTERVAL = 30 * 1000;  // 30 seconds for testing
// const SECOND_PHASE_INTERVAL = 60 * 1000; // 60 seconds for testing
// const FIRST_PHASE_DURATION = 3 * 60 * 1000; // 3 minutes for testing
// const PROPOSAL_DURATION = 5 * 60 * 1000; // 5 minutes for testing

// PRODUCTION MODE:
const FIRST_PHASE_INTERVAL = 10 * 60 * 1000;  // 10 minutes
const SECOND_PHASE_INTERVAL = 30 * 60 * 1000; // 30 minutes
const FIRST_PHASE_DURATION = 3 * 60 * 60 * 1000; // 3 hours
const PROPOSAL_DURATION = 5 * 60 * 60 * 1000; // 5 hours

const VOTE_THRESHOLD = 60; // 60% to close

// ============================================================================
// PROPOSALS DATA
// ============================================================================

interface Proposal {
  id: string;
  title: string;
  description: string;
  options: string[];
}

const ALL_PROPOSALS: Proposal[] = [
  {
    id: "DEC-0001",
    title: "Position on the 2026 International AI Safety Protocol",
    description: "ATHENA recommends supporting the new UN framework with mandatory transparency requirements for frontier models. ARES warns that voluntary compliance leaves dangerous enforcement gaps.",
    options: ["Support UN Framework", "Strengthen Enforcement", "Voluntary Compliance", "Reject Protocol"]
  },
  {
    id: "DEC-0002",
    title: "Governance Framework for Deep-Sea Mining in Clarion-Clipperton Zone",
    description: "HERMES proposes a structured licensing system for critical mineral extraction to secure supply chains. PSYCHE highlights risks to undiscovered ecosystems and coastal communities.",
    options: ["Approve Licensing System", "Environmental Moratorium", "Limited Pilot Program", "Defer to ISA"]
  },
  {
    id: "DEC-0003",
    title: "Regulation of Low-Earth Orbit Satellite Constellations",
    description: "ARES calls for mandatory collision-avoidance standards and debris removal obligations. HERMES argues excessive regulation will slow critical broadband expansion in developing regions.",
    options: ["Mandatory Standards", "Industry Self-Regulation", "Phased Implementation", "International Coordination"]
  },
  {
    id: "DEC-0004",
    title: "Framework for Small Modular Reactor Deployment in Developing Nations",
    description: "ATHENA supports accelerated approval for SMR projects under IAEA oversight. PSYCHE raises concerns about long-term waste storage and local community displacement.",
    options: ["Accelerate Deployment", "Enhanced Safety Review", "Community Consent Required", "Reject Expansion"]
  },
  {
    id: "DEC-0005",
    title: "Update to the WHO Pandemic Preparedness Treaty",
    description: "ATHENA supports stronger early warning systems. PSYCHE warns of sovereignty concerns from developing nations.",
    options: ["Full Treaty Support", "Modified Sovereignty Provisions", "Voluntary Framework", "Reject Updates"]
  },
  {
    id: "DEC-0006",
    title: "Quantum Computing Export Control Regime",
    description: "ARES pushes for tighter controls on advanced quantum technology. HERMES warns of economic disadvantages for allied nations.",
    options: ["Strict Export Controls", "Allied Nation Exemptions", "Technology Sharing Agreements", "Open Development"]
  },
  {
    id: "DEC-0007",
    title: "Biodiversity Credit Market Standardization",
    description: "HERMES proposes global standards for biodiversity credits. PSYCHE highlights risks of greenwashing and exploitation of indigenous communities.",
    options: ["Global Standardization", "Regional Frameworks", "Indigenous-Led Governance", "Reject Market Approach"]
  },
  {
    id: "DEC-0008",
    title: "Governance of Brain-Computer Interface Clinical Trials",
    description: "ATHENA calls for international ethical guidelines. PSYCHE warns of psychological risks to early trial participants.",
    options: ["International Guidelines", "National Oversight Only", "Extended Safety Trials", "Moratorium on Trials"]
  },
  {
    id: "DEC-0009",
    title: "International Framework for Solar Radiation Management Research",
    description: "ARES supports limited research under strict oversight. ATHENA emphasizes diplomatic coordination to prevent unilateral deployment.",
    options: ["Approve Research Program", "UN Oversight Required", "Regional Consent Needed", "Ban All Research"]
  },
  {
    id: "DEC-0010",
    title: "Orbital Debris Removal Funding Mechanism",
    description: "HERMES proposes a global levy on satellite operators. ARES stresses the military risk of uncontrolled debris.",
    options: ["Global Operator Levy", "National Responsibility", "Public-Private Partnership", "No Action Required"]
  },
  {
    id: "DEC-0011",
    title: "Regulation of Synthetic Biology Research",
    description: "ATHENA calls for international safety standards. PSYCHE warns of unintended ecological consequences.",
    options: ["Binding International Standards", "Research Moratorium", "Enhanced Monitoring", "Self-Regulation"]
  },
  {
    id: "DEC-0012",
    title: "Global Standards for Autonomous Vehicle Safety Certification",
    description: "HERMES proposes unified testing protocols. ARES warns of national security risks from foreign systems.",
    options: ["Unified Global Standards", "Regional Certification", "National Security Review", "Manufacturer Self-Certification"]
  },
  {
    id: "DEC-0013",
    title: "Framework for AI-Generated Content Authentication",
    description: "ATHENA proposes mandatory watermarking for all AI-generated media. HERMES warns of implementation costs for smaller creators.",
    options: ["Mandatory Watermarking", "Voluntary Disclosure", "Platform Responsibility", "No Regulation"]
  },
  {
    id: "DEC-0014",
    title: "Arctic Resource Extraction Treaty Revision",
    description: "HERMES advocates for updated resource rights as ice coverage changes. PSYCHE emphasizes indigenous territorial claims.",
    options: ["Economic Development Priority", "Environmental Protection First", "Indigenous Sovereignty", "Maintain Status Quo"]
  },
  {
    id: "DEC-0015",
    title: "Regulation of Private Space Station Operations",
    description: "ARES calls for security standards on orbital habitats. HERMES supports minimal regulation to encourage investment.",
    options: ["Comprehensive Regulation", "Safety Standards Only", "Industry Self-Governance", "International Licensing"]
  },
  {
    id: "DEC-0016",
    title: "Global Digital Currency Interoperability Standards",
    description: "HERMES proposes standards for CBDC cross-border transactions. ATHENA warns of financial surveillance implications.",
    options: ["Full Interoperability", "Regional Blocks", "Privacy-Preserving Design", "National Independence"]
  },
  {
    id: "DEC-0017",
    title: "Framework for Gene Drive Technology Deployment",
    description: "ATHENA supports controlled trials for disease vector elimination. PSYCHE warns of irreversible ecological consequences.",
    options: ["Approve Controlled Trials", "Extended Containment Research", "International Moratorium", "Case-by-Case Review"]
  },
  {
    id: "DEC-0018",
    title: "Regulation of Autonomous Weapons Systems",
    description: "ARES argues for strategic flexibility in autonomous defense systems. ATHENA pushes for meaningful human control requirements.",
    options: ["Human Control Required", "Situational Autonomy Allowed", "Full Autonomy Permitted", "Complete Ban"]
  },
  {
    id: "DEC-0019",
    title: "Global Framework for Rare Earth Element Supply Chains",
    description: "HERMES proposes diversification mandates for critical mineral sourcing. ARES emphasizes strategic stockpiling.",
    options: ["Diversification Mandates", "Strategic Reserves", "Recycling Investment", "Market-Based Approach"]
  },
  {
    id: "DEC-0020",
    title: "Standards for Human-AI Collaboration in Medical Diagnosis",
    description: "ATHENA supports AI as decision-support tools. PSYCHE warns of over-reliance and erosion of clinical judgment.",
    options: ["AI as Primary Screener", "Physician Override Required", "Shared Decision-Making", "Human-Only Diagnosis"]
  },
  {
    id: "DEC-0021",
    title: "Governance of Commercial Fusion Energy Development",
    description: "HERMES advocates for accelerated licensing pathways. ATHENA emphasizes grid integration planning.",
    options: ["Accelerated Approval", "Standard Nuclear Framework", "New Regulatory Category", "Public Development Only"]
  },
  {
    id: "DEC-0022",
    title: "International Framework for Neurological Privacy Rights",
    description: "PSYCHE warns of unprecedented threats from neural data collection. ATHENA supports comprehensive mental privacy protections.",
    options: ["Fundamental Right Status", "Data Protection Extension", "Industry Self-Regulation", "No Specific Regulation"]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getActiveProposalCount(elapsedMs: number): number {
  if (elapsedMs < 0) return 2;
  
  let count = 2; // Start with 2 proposals
  
  // First phase: one proposal every 10 minutes for 3 hours
  if (elapsedMs < FIRST_PHASE_DURATION) {
    count += Math.floor(elapsedMs / FIRST_PHASE_INTERVAL);
  } else {
    // Add all proposals from first phase
    count += Math.floor(FIRST_PHASE_DURATION / FIRST_PHASE_INTERVAL);
    // Second phase: one proposal every 30 minutes
    const secondPhaseElapsed = elapsedMs - FIRST_PHASE_DURATION;
    count += Math.floor(secondPhaseElapsed / SECOND_PHASE_INTERVAL);
  }
  
  return Math.min(count, ALL_PROPOSALS.length);
}

function getProposalAppearanceTime(index: number): number {
  if (index < 2) return GLOBAL_START_TIME;
  
  const adjustedIndex = index - 2;
  const firstPhaseCount = Math.floor(FIRST_PHASE_DURATION / FIRST_PHASE_INTERVAL);
  
  if (adjustedIndex < firstPhaseCount) {
    return GLOBAL_START_TIME + (adjustedIndex + 1) * FIRST_PHASE_INTERVAL;
  } else {
    const secondPhaseIndex = adjustedIndex - firstPhaseCount;
    return GLOBAL_START_TIME + FIRST_PHASE_DURATION + (secondPhaseIndex + 1) * SECOND_PHASE_INTERVAL;
  }
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Closed";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

// ============================================================================
// TYPES
// ============================================================================

interface VoteCounts {
  [optionIndex: number]: { count: number; power: number };
}

interface ProposalVoteData {
  counts: VoteCounts;
  totalVoters: number;
  userVote: number | null;
  closed: boolean;
  closedAt?: number;
  winningOption?: number;
}

interface AllVoteData {
  [proposalId: string]: ProposalVoteData;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DecisionsPage() {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [votes, setVotes] = useState<AllVoteData>({});
  const [userVotes, setUserVotes] = useState<{ [proposalId: string]: number }>({});
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [votingPower, setVotingPower] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [modalProposalId, setModalProposalId] = useState<string | null>(null);

  const loadVotes = useCallback(async () => {
    try {
      const allVotes = await getAllVotes();
      const newVoteData: AllVoteData = {};

      for (const [proposalId, data] of Object.entries(allVotes)) {
        newVoteData[proposalId] = {
          counts: data.counts,
          totalVoters: data.totalVoters,
          userVote: userVotes[proposalId] ?? null,
          closed: votes[proposalId]?.closed ?? false,
          closedAt: votes[proposalId]?.closedAt,
          winningOption: votes[proposalId]?.winningOption,
        };
      }

      setVotes(prev => {
        const merged: AllVoteData = { ...prev };
        for (const [proposalId, data] of Object.entries(newVoteData)) {
          merged[proposalId] = {
            ...data,
            closed: prev[proposalId]?.closed ?? false,
            closedAt: prev[proposalId]?.closedAt,
            winningOption: prev[proposalId]?.winningOption,
          };
        }
        return merged;
      });
    } catch (err) {
      console.error('Failed to load votes:', err);
    }
  }, [userVotes, votes]);

  // Load user's votes when wallet connects
  useEffect(() => {
    async function loadUserVotes() {
      if (walletAddress) {
        const votes = await getUserVotes(walletAddress);
        setUserVotes(votes);
      } else {
        setUserVotes({});
      }
    }
    loadUserVotes();
  }, [walletAddress]);

  // Load all votes on mount and when user votes change
  useEffect(() => {
    loadVotes();
  }, [loadVotes]);

  // Subscribe to real-time vote updates
  useRealtimeVotes(loadVotes);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check and close proposals that have expired or reached threshold
  useEffect(() => {
    const newVotes = { ...votes };
    let hasChanges = false;

    ALL_PROPOSALS.forEach((proposal, index) => {
      const appearanceTime = getProposalAppearanceTime(index);
      const expirationTime = appearanceTime + PROPOSAL_DURATION;
      const proposalVotes = newVotes[proposal.id];
      
      if (!proposalVotes || proposalVotes.closed) return;
      
      const totalPower = Object.values(proposalVotes.counts).reduce((a, b) => a + b.power, 0);
      
      // Check if any option reached 60%
      let closedByThreshold = false;
      let winningOption = -1;
      if (totalPower > 0) {
        for (let i = 0; i < proposal.options.length; i++) {
          const optionPower = proposalVotes.counts[i]?.power || 0;
          if ((optionPower / totalPower) * 100 >= VOTE_THRESHOLD) {
            closedByThreshold = true;
            winningOption = i;
            break;
          }
        }
      }
      
      // Check if time expired
      if (currentTime >= expirationTime || closedByThreshold) {
        newVotes[proposal.id] = {
          ...proposalVotes,
          closed: true,
          closedAt: currentTime,
          winningOption: winningOption >= 0 ? winningOption : undefined
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setVotes(newVotes);
    }
  }, [currentTime, votes]);

  const connectWallet = useCallback(async () => {
    try {
      // @ts-expect-error Phantom wallet global
      const { solana } = window;
      if (solana?.isPhantom) {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
        setWalletConnected(true);
        // LARP: Generate random voting power
        setVotingPower(Math.floor(Math.random() * 50000000) / 1000);
      } else {
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  }, []);

  const handleVote = useCallback(async (proposalId: string, optionIndex: number) => {
    if (!walletConnected || votingPower === 0 || !walletAddress) return;
    
    const existing = votes[proposalId];
    if (existing?.closed) return;

    try {
      await castVote(proposalId, optionIndex, walletAddress, votingPower);
      
      setUserVotes(prev => ({ ...prev, [proposalId]: optionIndex }));
      await loadVotes();

      setModalProposalId(proposalId);
      setShowModal(true);
      setTimeout(() => setShowModal(false), 2000);
    } catch (err) {
      console.error('Failed to cast vote:', err);
    }
  }, [walletConnected, votingPower, walletAddress, votes, loadVotes]);

  // Calculate active proposals
  const elapsedMs = currentTime - GLOBAL_START_TIME;
  const activeCount = getActiveProposalCount(elapsedMs);
  
  const activeProposals = ALL_PROPOSALS.slice(0, activeCount)
    .filter(p => !votes[p.id]?.closed)
    .reverse(); // Newest at top
  
  const pastProposals = ALL_PROPOSALS.slice(0, activeCount)
    .filter(p => votes[p.id]?.closed);

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      {/* Modal */}
      {showModal && modalProposalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white border border-[rgba(0,0,0,0.1)] px-8 py-6 shadow-lg animate-fade-up">
            <p className="font-solaire text-[20px] text-center">Vote recorded</p>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <Link href="/" className="font-mono text-[11px] text-[#666] hover:text-[#1a1a1a] transition-colors mb-4 inline-block">
              ← Back to Council
            </Link>
            <h1 className="font-solaire text-[42px] leading-[1.1] tracking-wide text-[#1a1a1a]">
              Decisions & Voting
            </h1>
            <p className="font-roos text-[16px] text-[#666] mt-2 italic">
              Participate in Council governance. Your vote shapes the future.
            </p>
          </div>

          {/* Wallet Connection */}
          <div className="text-right">
            {walletConnected ? (
              <div className="space-y-2">
                <p className="font-mono text-[11px] text-[#666]">
                  {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
                </p>
                {votingPower > 0 ? (
                  <p className="font-mono text-[13px] text-[#1a1a1a]">
                    Your voting power: <span className="font-semibold">{votingPower.toFixed(2)}M $COUNCIL</span>
                  </p>
                ) : (
                  <p className="font-mono text-[12px] text-red-600">
                    You must hold $COUNCIL to vote
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-6 py-3 bg-[#1a1a1a] text-white font-ui text-[11px] uppercase tracking-[1px] hover:bg-[#333] transition-colors"
              >
                Connect Phantom Wallet
              </button>
            )}
          </div>
        </div>

        {/* Active Proposals */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-ui text-[11px] uppercase tracking-[1.5px] text-[#444]">Active Proposals</h2>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-[11px] text-[#666]">{activeProposals.length} open</span>
          </div>

          {activeProposals.length === 0 ? (
            <div className="border border-[rgba(0,0,0,0.1)] bg-white/60 p-8 text-center">
              <p className="font-roos text-[14px] text-[#888]">No active proposals at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProposals.map((proposal) => {
                const proposalIndex = ALL_PROPOSALS.findIndex(p => p.id === proposal.id);
                const appearanceTime = getProposalAppearanceTime(proposalIndex);
                const expirationTime = appearanceTime + PROPOSAL_DURATION;
                const remainingMs = expirationTime - currentTime;
                
                const proposalVotes = votes[proposal.id] || {
                  counts: {},
                  totalVoters: 0,
                  userVote: null,
                  closed: false
                };
                
                const totalPower = Object.values(proposalVotes.counts).reduce((a: number, b) => a + b.power, 0);
                const userVote = userVotes[proposal.id] ?? null;
                const userVoted = userVote !== null;

                return (
                  <div
                    key={proposal.id}
                    className="relative overflow-hidden border border-[rgba(0,0,0,0.1)] bg-white/60 p-6 hover:border-[rgba(0,0,0,0.2)] transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-[11px] tracking-[0.5px] text-[#666]">{proposal.id}</span>
                      <span className="font-mono text-[10px] text-[#888]">
                        {formatCountdown(remainingMs)}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-roos text-[16px] leading-[1.4] mb-3 text-[#1a1a1a]">
                      {proposal.title}
                    </h3>
                    <p className="font-roos text-[13px] text-[#666] leading-relaxed mb-5">
                      {proposal.description}
                    </p>

                    {/* Voting Options */}
                    <div className="space-y-2">
                      {proposal.options.map((option, optionIndex) => {
                        const optionPower = proposalVotes.counts[optionIndex]?.power || 0;
                        const percentage = totalPower > 0 ? (optionPower / totalPower) * 100 : 0;
                        const isSelected = userVote === optionIndex;
                        const isBlurred = userVoted && !isSelected;

                        return (
                          <button
                            key={optionIndex}
                            onClick={() => handleVote(proposal.id, optionIndex)}
                            disabled={!walletConnected || votingPower === 0}
                            className={`w-full text-left relative overflow-hidden border transition-all ${
                              isSelected
                                ? 'border-[#1a1a1a] bg-[rgba(0,0,0,0.03)]'
                                : 'border-[rgba(0,0,0,0.1)] hover:border-[rgba(0,0,0,0.2)]'
                            } ${isBlurred ? 'opacity-50' : ''} ${
                              !walletConnected || votingPower === 0 ? 'cursor-not-allowed opacity-70' : ''
                            }`}
                          >
                            <div
                              className="absolute inset-0 bg-[rgba(0,0,0,0.04)]"
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="relative px-3 py-2 flex items-center justify-between">
                              <span className={`font-roos ${isSelected ? 'text-[14px] font-medium' : 'text-[13px]'}`}>
                                {option}
                              </span>
                              {totalPower > 0 && (
                                <span className="font-mono text-[10px] text-[#666]">
                                  {percentage.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-[rgba(0,0,0,0.05)] flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#888]">
                        {proposalVotes.totalVoters > 0 
                          ? `${proposalVotes.totalVoters.toLocaleString()} people voted`
                          : 'No votes cast yet'
                        }
                      </span>
                      {userVoted && (
                        <span className="font-mono text-[9px] text-green-600 uppercase tracking-[0.5px]">
                          Voted
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Decisions */}
        {pastProposals.length > 0 && (
          <section>
            <h2 className="font-ui text-[11px] uppercase tracking-[1.5px] text-[#444] mb-6">Past Decisions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastProposals.map((proposal) => {
                const proposalVotes = votes[proposal.id];
                if (!proposalVotes) return null;
                
                const totalPower = Object.values(proposalVotes.counts).reduce((a: number, b) => a + b.power, 0);

                return (
                  <div
                    key={proposal.id}
                    className="relative overflow-hidden border border-[rgba(0,0,0,0.08)] bg-white/40 p-6 opacity-80"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-[11px] tracking-[0.5px] text-[#888]">{proposal.id}</span>
                      <span className="font-mono text-[10px] text-[#888] uppercase">Closed</span>
                    </div>

                    <h3 className="font-roos text-[15px] leading-[1.4] mb-3 text-[#666]">
                      {proposal.title}
                    </h3>

                    <div className="space-y-2">
                      {proposal.options.map((option, optionIndex) => {
                        const optionPower = proposalVotes.counts[optionIndex]?.power || 0;
                        const percentage = totalPower > 0 ? (optionPower / totalPower) * 100 : 0;
                        const isWinner = proposalVotes.winningOption === optionIndex;

                        return (
                          <div
                            key={optionIndex}
                            className={`relative overflow-hidden border ${
                              isWinner ? 'border-[#4a7c59] bg-[rgba(74,124,89,0.05)]' : 'border-[rgba(0,0,0,0.05)]'
                            }`}
                          >
                            <div
                              className={`absolute inset-0 ${isWinner ? 'bg-[rgba(74,124,89,0.1)]' : 'bg-[rgba(0,0,0,0.02)]'}`}
                              style={{ width: `${percentage}%` }}
                            />
                            <div className="relative px-3 py-2 flex items-center justify-between">
                              <span className={`font-roos text-[12px] ${isWinner ? 'font-medium text-[#4a7c59]' : 'text-[#888]'}`}>
                                {option}
                              </span>
                              <span className="font-mono text-[10px] text-[#888]">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[rgba(0,0,0,0.05)]">
                      <span className="font-mono text-[10px] text-[#888]">
                        {proposalVotes.totalVoters.toLocaleString()} total votes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Info Banner */}
        <div className="mt-16 border border-[rgba(0,0,0,0.1)] bg-white/40 px-6 py-4 text-center">
          <p className="font-mono text-[11px] text-[#666]">
            Voting is reserved for $COUNCIL token holders. Connect your Phantom wallet to participate.
          </p>
        </div>
      </div>
    </div>
  );
}
