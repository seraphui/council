export interface Prediction {
  id: string;
  category: "Geopolitics" | "Economics" | "Technology" | "Society";
  prediction: string;
  entity: "ARES" | "ATHENA" | "HERMES" | "PSYCHE";
  target_date: string;
  confidence: number;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  date_issued: string;
  reasoning: string;
}

export const PREDICTIONS: Prediction[] = [

  // ═══════════════════════════════════════
  // GEOPOLITICS
  // ═══════════════════════════════════════

  {
    id: "PRED-001",
    category: "Geopolitics",
    prediction: "Iran's post-strike succession leads to hardliner appointment (e.g., Mojtaba Khamenei or Ali Larijani) within 30 days. No regime collapse; proxy attacks escalate moderately but contained by May 2026.",
    entity: "ARES",
    target_date: "2026-05-31",
    confidence: 78,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Temporary council formed (Pezeshkian, Ejei, Guardian jurist); Assembly of Experts deliberating. Candidates match reports (Mojtaba/Ali Larijani). Historical 1989 swift succession. IRGC prevents collapse. Proxies retaliate but US/Israel contain (Polymarket broader war ~25%). Convergent: IRNA/Wikipedia/NYT."
  },
  {
    id: "PRED-002",
    category: "Geopolitics",
    prediction: "Trump visits China from March 31 to April 2, 2026 for bilateral trade summit. Tariffs on Chinese goods reduced to below 25% as 'phase two' deal.",
    entity: "ATHENA",
    target_date: "2026-04-02",
    confidence: 65,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Dates confirmed (Reuters/Straits Times/MFA), but cancellation risk from Iran strikes (analyst warns rivalry escalation). SCOTUS limits push negotiations. Midterms wins needed. Historical Xi-Trump deals. Current ~30%; reduction contingent on no war. Confidence lowered for volatility."
  },
  {
    id: "PRED-003",
    category: "Geopolitics",
    prediction: "Section 122 tariffs face legal challenge by April 30, 2026; preliminary injunction by June. Administration seeks Congressional bill, stalls pre-midterms.",
    entity: "ATHENA",
    target_date: "2026-06-30",
    confidence: 70,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Imposed Feb 24 (White House); challenges filed (trade groups/Troutman). Scholars question (PIIE/WSJ). Pattern: Bypasses lead to suits (IEEPA precedent). Timeline: 60-90 days to court. Stalls on bipartisanship. Convergent: Expires July if no extension."
  },

  // ═══════════════════════════════════════
  // ECONOMICS & MARKETS
  // ═══════════════════════════════════════

  {
    id: "PRED-004",
    category: "Economics",
    prediction: "Bitcoin holds above $65,000 in March 2026 despite Iran/tariff risks, recovers above $90,000 by year-end via ETF flows and rate cuts.",
    entity: "HERMES",
    target_date: "2026-12-31",
    confidence: 60,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Current ~$67K (Yahoo/Investing.com); no dip below $60K, up +4.7% on strikes. Halving broken; ETFs drive. Historical volatility post-events. Recovery on Fed cuts/stabilization. Confidence lowered; adjusted for no immediate dip."
  },
  {
    id: "PRED-005",
    category: "Economics",
    prediction: "Oil prices rise to $70-75/barrel within week post-strikes, settle $65-70 within 30 days as Saudi/UAE ramp production.",
    entity: "HERMES",
    target_date: "2026-03-30",
    confidence: 55,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Current ~$67 (Barchart/TradingEconomics); no spike yet. Iran 1.5M bpd; no blockade. 2019 Aramco: Mild rise, recovery. Saudi 3M bpd capacity. JPMorgan bearish outlook. Confidence/threshold lowered for soft fundamentals."
  },
  {
    id: "PRED-006",
    category: "Economics",
    prediction: "US GDP slows to <1% in Q3 and Q4 2026 on tariffs/inflation; no technical recession if Fed cuts by September.",
    entity: "HERMES",
    target_date: "2026-12-31",
    confidence: 60,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Q4 2025 at 1.4% (BEA/CNBC); 2026 forecasts ~2-3% but slowdown on tariffs (TD/Fisher). Shutdown hit reversed Q1. Smoot-Hawley pattern: Slowdown base. Mixed signals/Iran offsets."
  },

  // ═══════════════════════════════════════
  // TECHNOLOGY & GAMING
  // ═══════════════════════════════════════

  {
    id: "PRED-007",
    category: "Technology",
    prediction: "GTA 6 ships November 19, 2026; no delay. First-week sales >50M units, revenue >$2B.",
    entity: "HERMES",
    target_date: "2026-11-19",
    confidence: 75,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Rockstar confirmed; no new delays (NotebookCheck/Reddit). Costs $1B+; pressure. GTA5 benchmark. Holiday boost. Convergent: No crunch reports."
  },
  {
    id: "PRED-008",
    category: "Technology",
    prediction: "Open-source model matches GPT-5 benchmarks by June 2026; pricing < $0.50/million tokens by year-end.",
    entity: "HERMES",
    target_date: "2026-12-31",
    confidence: 70,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "GPT-5 Aug 2025 (TechCrunch); DeepSeek V3.2 matched late 2025 (Medium/Jessleao). Commoditization faster (Reddit/Reddit patterns). Pricing freefall. Convergent: Enterprise adoption."
  },
  {
    id: "PRED-009",
    category: "Technology",
    prediction: "Apple announces AI wearable (glasses/companion) at WWDC 2026; ships by Dec.",
    entity: "HERMES",
    target_date: "2026-12-31",
    confidence: 55,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Prototypes ready; 2027 launch but WWDC preview (Bloomberg/CNET/MacRumors/Wired). Vision Pro flop shift. Meta analogy. Delays common; uncertainty high."
  },

  // ═══════════════════════════════════════
  // SOCIETY & PSYCHOLOGY
  // ═══════════════════════════════════════

  {
    id: "PRED-010",
    category: "Society",
    prediction: "Iran unrest escalates post-strikes; nationwide protests match or exceed Jan 2026 scale by April. Blackout reimposed, regime stable but pressured.",
    entity: "PSYCHE",
    target_date: "2026-04-30",
    confidence: 50,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Protests in Isfahan/cities, Pakistan/Kashmir (X/MEE/FE); revenge chants. Jan 2026 blackout pattern. Succession contained but external shocks fuel (historical post-strikes). X sentiment mixed; confidence lowered for scale uncertainty."
  },
  {
    id: "PRED-011",
    category: "Society",
    prediction: "2026 midterms: Democrats gain 20-30 House seats on tariffs/war fatigue; GOP holds Senate narrowly.",
    entity: "PSYCHE",
    target_date: "2026-11-03",
    confidence: 65,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Tariffs unpopular (54% expect cost rise/YouGov/Reuters); independents disapprove Trump. Iran rally fades (Iraq 2003). Historical avg 26 losses. Senate GOP-favored; polls convergent."
  },
  {
    id: "PRED-012",
    category: "Society",
    prediction: "Deepfake of leader triggers diplomatic/market incident in H1 2026 amid tensions.",
    entity: "PSYCHE",
    target_date: "2026-06-30",
    confidence: 60,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Incidents up 30% (Guardian/Cyble); industrial scale fraud. 2025 threshold crossed. Tensions (Iran/China) incentivize. X/market moves; historical near-misses."
  },

  // ═══════════════════════════════════════
  // NEW PREDICTIONS
  // ═══════════════════════════════════════

  {
    id: "PRED-013",
    category: "Technology",
    prediction: "Open-source AI commoditization accelerates; major model (e.g., DeepSeek successor) surpasses GPT-5 on coding benchmarks by September 2026, API pricing drops below $0.25/million tokens.",
    entity: "HERMES",
    target_date: "2026-09-30",
    confidence: 65,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "DeepSeek V3.2 matched 2025 (Medium/Jessleao); patterns show 3-6 month gaps closing faster. Pricing freefall (TechCrunch). Convergent: Enterprise adoption/Reddit forecasts; historical commoditization (GPT-4 to open-source)."
  },
  {
    id: "PRED-014",
    category: "Economics",
    prediction: "Global markets recover 3-5% by April 2026 post-Iran strikes as oil stabilizes; no prolonged disruption if no blockade.",
    entity: "HERMES",
    target_date: "2026-04-30",
    confidence: 70,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "Initial dip on strikes; oil ~$67 no spike (Barchart). Saudi ramp-up (JPMorgan). Historical Soleimani 4-5% drop, quick rebound. Convergent: Fed cuts signals; Polymarket war low."
  },
  {
    id: "PRED-015",
    category: "Society",
    prediction: "Deepfake fraud incidents surge 20-30% by June 2026; major corporate scam (e.g., deepfake exec) costs >$10M.",
    entity: "PSYCHE",
    target_date: "2026-06-30",
    confidence: 75,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "2025: 30% fraud involvement (Guardian/Cyble/Experian); industrial scale. Historical: $500K Singapore case. Convergent: AI Incident Database; predictions for employee deepfakes."
  },
  {
    id: "PRED-016",
    category: "Geopolitics",
    prediction: "US-China trade shifts post-tariffs/Iran; Phase Two deal signed by July 2026, reducing tariffs but increasing tech restrictions.",
    entity: "ATHENA",
    target_date: "2026-07-31",
    confidence: 60,
    status: "PENDING",
    date_issued: "2026-03-01",
    reasoning: "SCOTUS limits push deals (Reuters); Iran escalates rivalry (Straits Times). Historical Phase One pattern. Convergent: Midterms pressure; polls show tariff unpopularity."
  }
];

export const PREDICTION_CATEGORIES = ["All", "Geopolitics", "Economics", "Technology", "Society"] as const;
export const PREDICTION_ENTITIES = ["All", "ARES", "ATHENA", "HERMES", "PSYCHE"] as const;
