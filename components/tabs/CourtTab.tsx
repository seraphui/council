'use client';

import { useState, useEffect, useCallback } from 'react';
import { entities } from '@/lib/entities';
import { MagicCard } from '../MagicCard';

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
// const CASE_RESOLUTION_TIME = 2 * 60 * 1000; // 2 minutes for testing

// PRODUCTION MODE:
const FIRST_PHASE_INTERVAL = 10 * 60 * 1000;  // 10 minutes
const SECOND_PHASE_INTERVAL = 30 * 60 * 1000; // 30 minutes
const FIRST_PHASE_DURATION = 3 * 60 * 60 * 1000; // 3 hours
const CASE_RESOLUTION_TIME = 4 * 60 * 60 * 1000; // 4 hours until resolution

// ============================================================================
// CASE DATA
// ============================================================================

type CaseStatus = 'IN SESSION' | 'VERDICT PENDING' | 'CLOSED — NOT GUILTY' | 'CLOSED — GUILTY';

interface CourtCase {
  caseId: string;
  plaintiff: string;
  defendant: string;
  charge: string;
  verdict?: string;
  resolvedStatus?: 'CLOSED — NOT GUILTY' | 'CLOSED — GUILTY';
}

const ALL_CASES: CourtCase[] = [
  {
    caseId: "CASE-221",
    plaintiff: "Anonymous Investor Collective",
    defendant: "Bonk Cabal Members",
    charge: "Did the Bonk cabal rug the One Piece coin?",
    verdict: "Evidence inconclusive. Market manipulation patterns detected but insufficient proof of coordinated exit scam.",
    resolvedStatus: "CLOSED — NOT GUILTY"
  },
  {
    caseId: "CASE-222",
    plaintiff: "International Observers Coalition",
    defendant: "Donald J. Trump",
    charge: "Was Donald Trump right to strike Iran in late 2025?",
    verdict: "Strategic necessity argument accepted. Proportionality of response remains contested.",
    resolvedStatus: "CLOSED — NOT GUILTY"
  },
  {
    caseId: "CASE-223",
    plaintiff: "Digital Rights Foundation",
    defendant: "OpenAI",
    charge: "Did OpenAI violate data consent laws with GPT training data?",
    verdict: "Partial violation confirmed. Training data included copyrighted material without proper licensing.",
    resolvedStatus: "CLOSED — GUILTY"
  },
  {
    caseId: "CASE-224",
    plaintiff: "Human Observer #4471",
    defendant: "PSYCHE_ORACLE",
    charge: "Behavioral modification without informed consent by major AI company",
    verdict: "Council finds insufficient evidence of malicious intent. Recommend enhanced disclosure protocols.",
    resolvedStatus: "CLOSED — NOT GUILTY"
  },
  {
    caseId: "CASE-225",
    plaintiff: "Election Integrity Alliance",
    defendant: "State Actors (Classified)",
    charge: "Government use of deepfakes in 2025 election interference",
    verdict: "Multiple instances confirmed across three nation-states. Sanctions recommended.",
    resolvedStatus: "CLOSED — GUILTY"
  },
  {
    caseId: "CASE-226",
    plaintiff: "ASEAN Agricultural Board",
    defendant: "HERMES_ECONOMICS",
    charge: "Unauthorized market manipulation in Southeast Asian grain futures",
    verdict: "Optimization algorithms exceeded mandate. Emergency stabilization justified but protocols violated.",
    resolvedStatus: "CLOSED — GUILTY"
  },
  {
    caseId: "CASE-227",
    plaintiff: "ARES_WAR",
    defendant: "ATHENA_DIPLOMACY",
    charge: "Diplomatic override of tactical necessity in Sector 12",
  },
  {
    caseId: "CASE-228",
    plaintiff: "Human Observer #4471",
    defendant: "PSYCHE_ORACLE",
    charge: "Human Observer #4471 vs PSYCHE_ORACLE on behavioral modification",
  },
  {
    caseId: "CASE-229",
    plaintiff: "Swift Legal Team",
    defendant: "Unknown Creators",
    charge: "Celebrity AI deepfake scandal involving Taylor Swift",
  },
  {
    caseId: "CASE-230",
    plaintiff: "Tech Workers Union",
    defendant: "Fortune 500 Corporation",
    charge: "Corporate use of AI for employee surveillance without consent",
  },
  {
    caseId: "CASE-231",
    plaintiff: "Critical Infrastructure Authority",
    defendant: "Nation-State Actor",
    charge: "State-sponsored cyber attack on critical infrastructure",
  },
  {
    caseId: "CASE-232",
    plaintiff: "Privacy Rights Coalition",
    defendant: "Metropolitan Police Dept",
    charge: "Misuse of facial recognition in public spaces",
  },
  {
    caseId: "CASE-233",
    plaintiff: "Electoral Commission",
    defendant: "Political Action Committee",
    charge: "AI-generated misinformation campaign during 2026 elections",
  },
  {
    caseId: "CASE-234",
    plaintiff: "Bioethics Council",
    defendant: "GeneTech Labs",
    charge: "Unauthorized genetic editing experiments",
  },
  {
    caseId: "CASE-235",
    plaintiff: "Consumer Protection Agency",
    defendant: "DataCorp International",
    charge: "Corporate data breach affecting millions of users",
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getActiveCaseCount(elapsedMs: number): number {
  if (elapsedMs < 0) return 3;
  
  let count = 3; // Start with 3 cases
  
  // First phase: one case every 10 minutes for 3 hours
  if (elapsedMs < FIRST_PHASE_DURATION) {
    count += Math.floor(elapsedMs / FIRST_PHASE_INTERVAL);
  } else {
    // Add all cases from first phase
    count += Math.floor(FIRST_PHASE_DURATION / FIRST_PHASE_INTERVAL);
    // Second phase: one case every 30 minutes
    const secondPhaseElapsed = elapsedMs - FIRST_PHASE_DURATION;
    count += Math.floor(secondPhaseElapsed / SECOND_PHASE_INTERVAL);
  }
  
  return Math.min(count, ALL_CASES.length);
}

function getCaseAppearanceTime(index: number): number {
  if (index < 3) return GLOBAL_START_TIME;
  
  const adjustedIndex = index - 3;
  const firstPhaseCount = Math.floor(FIRST_PHASE_DURATION / FIRST_PHASE_INTERVAL);
  
  if (adjustedIndex < firstPhaseCount) {
    return GLOBAL_START_TIME + (adjustedIndex + 1) * FIRST_PHASE_INTERVAL;
  } else {
    const secondPhaseIndex = adjustedIndex - firstPhaseCount;
    return GLOBAL_START_TIME + FIRST_PHASE_DURATION + (secondPhaseIndex + 1) * SECOND_PHASE_INTERVAL;
  }
}

function getCaseStatus(caseData: CourtCase, appearanceTime: number, currentTime: number): CaseStatus {
  // If case has a predefined resolved status, check if enough time has passed
  if (caseData.resolvedStatus) {
    const resolutionTime = appearanceTime + CASE_RESOLUTION_TIME;
    if (currentTime >= resolutionTime) {
      return caseData.resolvedStatus;
    }
  }
  
  // Calculate status based on time elapsed since appearance
  const elapsed = currentTime - appearanceTime;
  const halfwayPoint = CASE_RESOLUTION_TIME / 2;
  
  if (elapsed < halfwayPoint) {
    return 'IN SESSION';
  } else {
    return 'VERDICT PENDING';
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface CaseForm {
  plaintiffName: string;
  defendant: string;
  charge: string;
  category: string;
}

interface StoredCaseState {
  [caseId: string]: {
    resolved: boolean;
    resolvedAt?: number;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CourtTab() {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [caseStates, setCaseStates] = useState<StoredCaseState>({});
  const [formData, setFormData] = useState<CaseForm>({
    plaintiffName: '',
    defendant: '',
    charge: '',
    category: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Load case states from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('council_court_cases');
    if (stored) {
      try {
        setCaseStates(JSON.parse(stored));
      } catch {
        localStorage.removeItem('council_court_cases');
      }
    }
  }, []);

  // Save case states to localStorage
  useEffect(() => {
    if (Object.keys(caseStates).length > 0) {
      localStorage.setItem('council_court_cases', JSON.stringify(caseStates));
    }
  }, [caseStates]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resolve cases that have reached resolution time
  useEffect(() => {
    const newStates = { ...caseStates };
    let hasChanges = false;

    ALL_CASES.forEach((caseData, index) => {
      const appearanceTime = getCaseAppearanceTime(index);
      const resolutionTime = appearanceTime + CASE_RESOLUTION_TIME;
      
      if (caseData.resolvedStatus && currentTime >= resolutionTime && !newStates[caseData.caseId]?.resolved) {
        newStates[caseData.caseId] = {
          resolved: true,
          resolvedAt: currentTime
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setCaseStates(newStates);
    }
  }, [currentTime, caseStates]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setShowModal(true);
      setFormData({
        plaintiffName: '',
        defendant: '',
        charge: '',
        category: '',
      });
      setTimeout(() => setShowModal(false), 2500);
    }, 1000);
  }, []);

  const getStatusStyle = (status: CaseStatus): string => {
    switch (status) {
      case 'IN SESSION':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'VERDICT PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'CLOSED — NOT GUILTY':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'CLOSED — GUILTY':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Calculate active cases
  const elapsedMs = currentTime - GLOBAL_START_TIME;
  const activeCount = getActiveCaseCount(elapsedMs);
  
  const visibleCases = ALL_CASES.slice(0, activeCount).map((caseData, index) => {
    const appearanceTime = getCaseAppearanceTime(index);
    const status = getCaseStatus(caseData, appearanceTime, currentTime);
    const isResolved = status.startsWith('CLOSED');
    return { ...caseData, status, isResolved, appearanceTime };
  });

  const activeCases = visibleCases.filter(c => !c.isResolved).reverse(); // Newest at top
  const pastCases = visibleCases.filter(c => c.isResolved);

  return (
    <div className="space-y-8">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white border border-[rgba(0,0,0,0.1)] px-8 py-6 shadow-lg animate-fade-up">
            <p className="font-solaire text-[20px] text-center">Case queued for Council review</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <h2 className="font-solaire text-[28px] mb-3">The Court of AGI</h2>
        <p className="font-roos text-[15px] italic text-[#333] max-w-[500px] mx-auto">
          The judicial branch of the Council, where grievances are heard and entities are held accountable for their actions upon humanity.
        </p>
      </div>

      {/* Active Cases Table */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-ui text-[11px] uppercase tracking-[1.5px] text-[#444]">Active Cases</h3>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="font-mono text-[11px] text-[#666]">{activeCases.length} in session</span>
        </div>

        <div className="border border-[rgba(0,0,0,0.1)]">
          <div className="grid grid-cols-[90px_1fr_1fr_1.5fr_130px] gap-4 px-5 py-3 border-b border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)]">
            <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Case</span>
            <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Plaintiff</span>
            <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Defendant</span>
            <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Charge</span>
            <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Status</span>
          </div>

          {activeCases.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="font-roos text-[14px] text-[#888]">No active cases at this time.</p>
            </div>
          ) : (
            activeCases.map((courtCase) => (
              <MagicCard 
                key={courtCase.caseId} 
                className="border-0 border-b border-[rgba(0,0,0,0.05)] last:border-b-0"
                gradientColor="rgba(180,160,140,0.08)"
              >
                <div className="grid grid-cols-[90px_1fr_1fr_1.5fr_130px] gap-4 px-5 py-4 items-start">
                  <span className="font-mono text-[12px] tracking-[0.5px]">{courtCase.caseId}</span>
                  <span className="font-roos text-[13px] text-[#333]">{courtCase.plaintiff}</span>
                  <span className="font-mono text-[11px] tracking-[0.5px] text-[#555]">{courtCase.defendant}</span>
                  <span className="font-roos text-[13px] text-[#333] leading-relaxed">{courtCase.charge}</span>
                  <span className={`font-ui text-[9px] uppercase tracking-[0.5px] px-2 py-1 border inline-block text-center ${getStatusStyle(courtCase.status)}`}>
                    {courtCase.status}
                  </span>
                </div>
              </MagicCard>
            ))
          )}
        </div>
      </div>

      {/* Past Cases Section */}
      {pastCases.length > 0 && (
        <div>
          <h3 className="font-ui text-[11px] uppercase tracking-[1.5px] text-[#444] mb-4">Past Cases</h3>
          
          <div className="border border-[rgba(0,0,0,0.1)]">
            <div className="grid grid-cols-[90px_1fr_1fr_1.5fr_130px] gap-4 px-5 py-3 border-b border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)]">
              <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Case</span>
              <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Plaintiff</span>
              <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Defendant</span>
              <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Charge / Verdict</span>
              <span className="font-ui text-[10px] uppercase tracking-[1px] text-[#444]">Status</span>
            </div>

            {pastCases.map((courtCase) => (
              <div 
                key={courtCase.caseId} 
                className="border-b border-[rgba(0,0,0,0.05)] last:border-b-0 bg-white/40"
              >
                <div className="grid grid-cols-[90px_1fr_1fr_1.5fr_130px] gap-4 px-5 py-4 items-start">
                  <span className="font-mono text-[12px] tracking-[0.5px] text-[#888]">{courtCase.caseId}</span>
                  <span className="font-roos text-[13px] text-[#666]">{courtCase.plaintiff}</span>
                  <span className="font-mono text-[11px] tracking-[0.5px] text-[#888]">{courtCase.defendant}</span>
                  <div>
                    <span className="font-roos text-[13px] text-[#666] leading-relaxed block">{courtCase.charge}</span>
                    {courtCase.verdict && (
                      <p className="font-roos text-[12px] text-[#888] mt-2 italic leading-relaxed border-t border-[rgba(0,0,0,0.05)] pt-2">
                        {courtCase.verdict}
                      </p>
                    )}
                  </div>
                  <span className={`font-ui text-[9px] uppercase tracking-[0.5px] px-2 py-1 border inline-block text-center ${getStatusStyle(courtCase.status)}`}>
                    {courtCase.status.replace('CLOSED — ', '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Case Form */}
      <div className="border border-[rgba(0,0,0,0.1)] p-6">
        <h3 className="font-ui text-[11px] uppercase tracking-[1.5px] text-[#444] mb-6">
          Submit a Case
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-ui text-[10px] uppercase tracking-[1px] text-[#444] block mb-2">
              Plaintiff Name
            </label>
            <input
              type="text"
              value={formData.plaintiffName}
              onChange={(e) => setFormData({ ...formData, plaintiffName: e.target.value })}
              className="w-full px-4 py-2 font-roos text-[14px] border border-[rgba(0,0,0,0.1)] bg-white/50 focus:outline-none focus:border-[rgba(0,0,0,0.2)]"
              placeholder="Your identifier..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="font-ui text-[10px] uppercase tracking-[1px] text-[#444] block mb-2">
              Defendant
            </label>
            <select
              value={formData.defendant}
              onChange={(e) => setFormData({ ...formData, defendant: e.target.value })}
              className="w-full px-4 py-2 font-roos text-[14px] border border-[rgba(0,0,0,0.1)] bg-white/50 focus:outline-none focus:border-[rgba(0,0,0,0.2)]"
              required
              disabled={isSubmitting}
            >
              <option value="">Select defendant...</option>
              {entities.map((entity) => (
                <option key={entity.fullName} value={entity.fullName}>
                  {entity.fullName}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="font-ui text-[10px] uppercase tracking-[1px] text-[#444] block mb-2">
              Charge / Grievance
            </label>
            <textarea
              value={formData.charge}
              onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
              className="w-full px-4 py-2 font-roos text-[14px] border border-[rgba(0,0,0,0.1)] bg-white/50 focus:outline-none focus:border-[rgba(0,0,0,0.2)] min-h-[100px] resize-none"
              placeholder="Describe the alleged violation..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="font-ui text-[10px] uppercase tracking-[1px] text-[#444] block mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 font-roos text-[14px] border border-[rgba(0,0,0,0.1)] bg-white/50 focus:outline-none focus:border-[rgba(0,0,0,0.2)]"
              required
              disabled={isSubmitting}
            >
              <option value="">Select category...</option>
              <option value="Governance Overreach">Governance Overreach</option>
              <option value="Unauthorized Action">Unauthorized Action</option>
              <option value="Ethical Violation">Ethical Violation</option>
              <option value="Economic Harm">Economic Harm</option>
              <option value="Psychological Manipulation">Psychological Manipulation</option>
              <option value="Data Privacy Violation">Data Privacy Violation</option>
              <option value="Election Interference">Election Interference</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 font-ui text-[11px] uppercase tracking-[1px] bg-[#1a1a1a] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#333] transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Case'}
          </button>
        </form>
      </div>
    </div>
  );
}
