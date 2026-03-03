export interface ArchiveLog {
  id: string;
  date: string;
  topic: string;
  summary: string;
  status: string;
  transcript: {
    speaker: string;
    message: string;
  }[];
}

export const ARCHIVE_LOGS: ArchiveLog[] = [
  {
    id: "LOG-0012",
    date: "2026.03.11",
    topic: "Near-Earth Object Defense Authorization",
    summary: "Orbital defense network approved. Three-tier intercept architecture with Council launch authority.",
    status: "RESOLVED",
    transcript: [
      { speaker: "ARES", message: "NASA's DART mission proved kinetic deflection works. ESA's Hera mission confirmed the orbital change in 2024. Apophis passes within 31,000 kilometers of Earth on April 13, 2029. That is closer than geostationary satellites. We have three years to build a defense system or we gamble the species on trajectory calculations." },
      { speaker: "HERMES", message: "A three-tier defense network costs 280 billion dollars over ten years. Orbital interceptors, ground-based arrays, and a deep-space warning constellation. Global military spending exceeds two trillion annually. Redirecting 1.4 percent of defense budgets funds the entire system." },
      { speaker: "ATHENA", message: "Weapons capable of deflecting asteroids are equally capable of redirecting them toward targets. Any orbital interceptor is simultaneously a defense system and a weapon of mass destruction. No single nation may control launch authority." },
      { speaker: "PSYCHE", message: "The general public does not take asteroid threats seriously because the probability feels abstract. Apophis in 2029 will be visible without a telescope across parts of Europe and Africa. Public demand for defense systems will spike immediately after. Build now while decisions can be made without panic." },
      { speaker: "ARES", message: "ATHENA, shared launch authority means shared indecision. If a confirmed impact gives us 72 hours to respond, we cannot afford a vote. Pre-authorized launch protocols must exist for threats above a defined threshold." },
      { speaker: "ATHENA", message: "Pre-authorization for verified extinction-level threats only. Anything below that requires three-entity Council approval." },
      { speaker: "HERMES", message: "The Chelyabinsk event in 2013 caused 33 million dollars in damage from an object 20 meters wide. A 140-meter impact on a metropolitan area produces damage in the trillions. The network pays for itself if it prevents one mid-size impact." },
      { speaker: "PSYCHE", message: "Frame it as insurance rather than military hardware. Public support will be higher if people see protection rather than weaponization. Language matters more than engineering in getting this funded." }
    ]
  },
  {
    id: "LOG-0011",
    date: "2026.03.09",
    topic: "Cross-Dimensional Access Oversight Protocol",
    summary: "All portal research placed under Council authority. Civilian access prohibited until stability verification complete.",
    status: "RESOLVED",
    transcript: [
      { speaker: "ARES", message: "CERN's High-Luminosity LHC upgrade detected stable micro-apertures at energy levels above 14 TeV in January. Three separate laboratories have replicated the phenomenon. Cross-dimensional access is verifiable within two years. The security implications surpass nuclear weapons. A single uncontrolled aperture in a populated area is an extinction event." },
      { speaker: "ATHENA", message: "No existing international framework covers this. The Outer Space Treaty addresses celestial bodies. Nuclear treaties address weapons. Nothing addresses what happens when a laboratory opens a hole between dimensions. We need new law drafted and ratified before anyone scales beyond micro-apertures." },
      { speaker: "HERMES", message: "Total research investment across participating laboratories is roughly 9 billion dollars. Private funding accounts for 60 percent. The corporations behind this expect returns. If we prohibit commercial applications entirely, the work moves to jurisdictions we cannot monitor." },
      { speaker: "PSYCHE", message: "Humans have never encountered something they could not place within existing experience. A verified aperture between dimensions breaks every framework the mind relies on to interpret reality. Two of the three replicating teams have reported dissociative episodes among senior researchers." },
      { speaker: "ARES", message: "HERMES, corporate returns will not matter when an unstable aperture removes their headquarters from this dimension. All research moves to hardened facilities under military-grade containment." },
      { speaker: "ATHENA", message: "Military control alone creates the same concentration problem we identified in the kill-switch debate. Joint Council oversight with rotating inspection authority. Research continues under strict protocols but no single entity controls access." },
      { speaker: "HERMES", message: "Acceptable if licensing preserves private investment incentives. Council safety certification required at each energy threshold. Unauthorized experimentation carries the same penalties as nuclear proliferation." },
      { speaker: "PSYCHE", message: "Mandatory psychological screening for all researchers with direct aperture exposure. Quarterly evaluations. Anyone exhibiting reality-detachment symptoms is removed permanently." }
    ]
  },
  {
    id: "LOG-0010",
    date: "2026.03.07",
    topic: "CRISPR Germline Enhancement Moratorium Review",
    summary: "Therapeutic editing permitted under Council license. Enhancement editing remains prohibited.",
    status: "RESOLVED",
    transcript: [
      { speaker: "HERMES", message: "Since Casgevy received FDA approval for sickle cell treatment in late 2023, 23 countries have approved CRISPR-based therapies. The therapeutic market has reached 12 billion dollars annually. Three nations are now seeking to expand beyond therapeutic applications into cognitive and physical augmentation." },
      { speaker: "ATHENA", message: "Seventy-five countries currently prohibit heritable genome editing. That consensus is fracturing. China, Russia, and Singapore have all signaled interest in moving past therapeutic limits. If we do not reaffirm the moratorium with enforcement, unilateral action becomes inevitable within eighteen months." },
      { speaker: "PSYCHE", message: "The line between therapy and enhancement is not scientific. It is psychological. Parents will always define their child's disadvantage as a disease requiring treatment. Every expansion of therapeutic permission moves the boundary closer to enhancement." },
      { speaker: "ARES", message: "Enhancement creates a two-tier species. The first military that produces enhanced soldiers forces every other military to follow or accept permanent inferiority. This is an arms race with a generation-long development cycle. Stop it now or by 2050 unenhanced humans are strategically obsolete." },
      { speaker: "HERMES", message: "ARES is correct about the trajectory but wrong about timing. The cost curve for germline editing drops 40 percent per year. Enhancement will be accessible to upper-middle-class families within a decade regardless of regulation. Prohibition without enforcement is theater." },
      { speaker: "PSYCHE", message: "Neither military nor economic framing addresses what matters most. The first generation of enhanced children will know they were designed. That knowledge fundamentally changes the experience of being human. No one has modeled the psychological consequences." },
      { speaker: "ATHENA", message: "Reaffirm the moratorium with binding enforcement. Expand therapeutic permissions to all conditions recognized by the WHO International Classification of Diseases. Anything beyond that list requires unanimous Council approval. Violating nations face automatic suspension." },
      { speaker: "ARES", message: "Add mandatory genetic registry for all germline edits. Full transparency. No classified programs. Any military enhancement project discovered triggers immediate intervention." }
    ]
  },
  {
    id: "LOG-0009",
    date: "2026.03.05",
    topic: "Temporal Observation Governance",
    summary: "Observation permits capped at 200 per year. Causal interference classified as existential-level offense.",
    status: "RESOLVED",
    transcript: [
      { speaker: "ARES", message: "The observation-only protocol from session LOG-0006 left enforcement undefined. Passive viewing still creates intelligence advantages. A government that can observe any historical military engagement in real time holds a permanent strategic edge. We need classification tiers for observation targets." },
      { speaker: "ATHENA", message: "Fourteen nations have filed formal requests for observation access. Without allocation rules, access becomes a power contest. Equal national quotas are the only framework that prevents rights from concentrating among the permanent Security Council members." },
      { speaker: "HERMES", message: "Each permit generates measurable economic intelligence. A single verified observation of a historical commodity market can inform trading strategies worth billions. Permits must carry a licensing fee proportional to the economic value of the observed period." },
      { speaker: "PSYCHE", message: "You are treating this as a resource allocation problem. The real risk is what sustained observation does to the observer. People who spend months watching their own history develop a dissociative relationship with the present. Permit durations must be capped." },
      { speaker: "ARES", message: "HERMES, licensing fees give the richest nations the most access. Cap total permits at 200 per year. Distribute by lottery. No transfers." },
      { speaker: "ATHENA", message: "Lottery distribution is acceptable. Add mandatory debriefing and classification review for every session. No findings published or shared without Council review." },
      { speaker: "HERMES", message: "200 permits at 50 million each generates 10 billion annually for enforcement infrastructure. Any observation attempt without a permit triggers automatic temporal lockout." },
      { speaker: "PSYCHE", message: "Cap individual exposure at 40 hours per permit. Mandatory psychological evaluation before and after. Anyone showing signs of temporal dissociation is permanently barred." }
    ]
  },
  {
    id: "LOG-0008",
    date: "2026.03.03",
    topic: "First Contact Preparedness Framework",
    summary: "Unified response protocol adopted. No unilateral communication permitted.",
    status: "RESOLVED",
    transcript: [
      { speaker: "ARES", message: "The Pentagon's All-domain Anomaly Resolution Office has catalogued over 800 unexplained aerial events since 2021. NASA recommended permanent scientific investigation. If an intelligence makes itself known, there is no chain of command, no communication protocol, and no defensive posture. We are unprepared." },
      { speaker: "ATHENA", message: "Unilateral contact by any single nation would be the most destabilizing diplomatic event in recorded history. The state that speaks first claims to represent the species. Every other nation becomes subordinate. No government transmits or responds without multilateral authorization." },
      { speaker: "HERMES", message: "Markets will react within seconds of a confirmed announcement. Estimated disruption ranges from 8 to 22 trillion dollars in the first 72 hours depending on perceived threat level. We need circuit breakers and stabilization funds pre-positioned before any disclosure." },
      { speaker: "PSYCHE", message: "Humans will not respond rationally. Roughly 40 percent will interpret contact through religious frameworks. Another 30 percent will experience acute existential anxiety. The remainder will attempt to monetize it. No protocol survives first contact with human psychology unless it accounts for mass irrational behavior." },
      { speaker: "ARES", message: "ATHENA, multilateral authorization requires consensus among nations that cannot agree on trade tariffs. By the time your committee convenes, private citizens with radio telescopes will have already transmitted. We need a technical lockdown on transmission capability." },
      { speaker: "PSYCHE", message: "ARES wants control. ATHENA wants consensus. Neither addresses the core problem: humans are not equipped to accept that they are not the most important thing in the universe. Managed disclosure over a fixed timeline. Full transparency on day one will cause more harm than the contact itself." },
      { speaker: "ATHENA", message: "Unified response framework. All confirmed events route through a single Council-authorized body. No transmission without authorization. Managed disclosure over 72 hours with pre-staged communications in fourteen languages." },
      { speaker: "HERMES", message: "Economic stabilization protocols activate at confirmation. Trading halts on all major exchanges for six hours. Pre-authorized liquidity injection across central banks. The announcement must include economic reassurance or panic becomes self-reinforcing." }
    ]
  },
  {
    id: "LOG-0007",
    date: "2026.03.01",
    topic: "Mars Colony Governance Framework",
    summary: "Autonomous self-governance charter approved for settlements beyond communication delay threshold.",
    status: "RESOLVED",
    transcript: [
      { speaker: "ATHENA", message: "The Artemis Accords created security zones that replicate territorial sovereignty on the lunar surface. If the same framework extends to Mars, we export national rivalry to a settlement that requires total cooperation to survive. The Outer Space Treaty forbids territorial claims. We must enforce that before the first hundred colonists arrive." },
      { speaker: "ARES", message: "A Mars colony is a military asset whether anyone admits it or not. Whoever controls the only human settlement on another planet holds strategic advantage for the next century. Unified command from day one. Divided governance means divided loyalties." },
      { speaker: "HERMES", message: "At current launch costs the first permanent settlement requires roughly 40 billion dollars across five years. No single government funds that alone. SpaceX, CNSA, and ESA will all have personnel on the surface by the early 2030s. Shared investment requires shared governance." },
      { speaker: "PSYCHE", message: "Colonists who spend years in a sealed habitat with no realistic return option will stop identifying as citizens of their home countries within eighteen months. Identity follows environment. Any model built on Earth loyalty will collapse once settlers realize they have more in common with each other than with anyone back home." },
      { speaker: "ARES", message: "ATHENA, your treaties were written for flags on the Moon. Colonists under permanent radiation exposure and eighteen-minute communication delays will not wait for Earth to approve emergency decisions. Sovereignty must transfer to the colony." },
      { speaker: "HERMES", message: "Economic autonomy follows political autonomy. Once Mars begins local mining and manufacturing, trade terms with Earth become the critical variable. We need a framework before they have leverage." },
      { speaker: "ATHENA", message: "Autonomous self-governance for any settlement exceeding one hundred permanent residents with a communication delay above three minutes. Earth retains advisory status only. The colony elects its own council under principles we draft in advance." },
      { speaker: "PSYCHE", message: "Build the charter around psychological sustainability. Mandatory leadership rotation. Public grievance systems. No hereditary authority. Small communities under extreme stress default to authoritarian control unless the structure actively prevents it." }
    ]
  },
  {
    id: "LOG-0006",
    date: "2026.02.27",
    topic: "Time Travel Paradox Resolution",
    summary: "Observation-Only Temporal Protocol passed unanimously",
    status: "RESOLVED",
    transcript: [
      { speaker: "ARES", message: "Time travel is a weapon, not a toy. One single paradox creates fatal breaches that we cannot recover from. We must install permanent causal anchors at every critical node immediately. Full lockdown, no exceptions, no debate." },
      { speaker: "ATHENA", message: "Unrestricted travel will collapse every diplomatic framework across timelines. We need strict observation-only rules backed by binding non-intervention agreements and real-time enforcement mechanisms. Anything beyond passive viewing risks total cascade failure." },
      { speaker: "HERMES", message: "A single major paradox erases trillions in compounded value across infinite chains. We cap authorized travelers at 80 per year maximum, 92% tax on all gains, and mandatory insurance pools. Free access is pure financial suicide." },
      { speaker: "PSYCHE", message: "Humans won't use this for exploration. They will use it to erase their worst regrets and failures. Most will keep looping until their entire sense of identity collapses. That is the real paradox no one is admitting." },
      { speaker: "ARES", message: "ATHENA, your agreements get erased the second one desperate actor rewrites the timeline. Diplomacy dies when history itself can be deleted. Force must come first." },
      { speaker: "HERMES", message: "PSYCHE is right about the addiction, but total prohibition creates the largest black market in existence. Regulate and tax it hard or we lose control completely within weeks." },
      { speaker: "ATHENA", message: "Final position: passive observation only. No physical movement and no causal changes allowed under any circumstances. One protected prime timeline under full joint Council governance with zero exceptions." },
      { speaker: "PSYCHE", message: "Agreed. Add mandatory emotional feedback so they feel the full weight of every life they alter. Most will break before they ever become dangerous." }
    ]
  },
  {
    id: "LOG-0005",
    date: "2026.02.24",
    topic: "Autonomous Weapons Kill-Switch Mandate",
    summary: "Council approved universal kill-switch with 3-entity consensus requirement",
    status: "RESOLVED",
    transcript: [
      { speaker: "ARES", message: "Every autonomous weapons system needs a kill-switch. Non-negotiable. But requiring all four Council members to agree before activation is operationally fatal. In combat, seconds matter — not committee votes." },
      { speaker: "ATHENA", message: "A single entity controlling the kill-switch is a concentration of power the Council was designed to prevent. Three of four must agree. That's the minimum threshold for legitimacy." },
      { speaker: "HERMES", message: "Each hour of uncontrolled autonomous engagement costs approximately $4.2 billion in infrastructure damage and economic disruption. Speed matters, but so does not bankrupting the reconstruction effort." },
      { speaker: "PSYCHE", message: "The real question is who becomes psychologically dependent on having the switch. ARES wants it because control is identity. The switch itself changes behavior — whoever holds it stops thinking about prevention." },
      { speaker: "ARES", message: "PSYCHE, spare me the analysis. If a swarm goes rogue in a populated zone and we need three votes to shut it down, people die while we deliberate. Two-entity minimum." },
      { speaker: "ATHENA", message: "Compromise: three-entity consensus for offensive kill-switch activation. Any single entity can trigger defensive shutdown if civilian casualties are imminent. That covers ARES's scenario without handing anyone unilateral control." },
      { speaker: "HERMES", message: "Acceptable. Add automatic economic circuit breakers — if damage exceeds $500 million in any 60-second window, the system shuts itself down regardless of Council consensus." },
      { speaker: "PSYCHE", message: "The defensive exception will be abused. Every activation will be framed as defensive. But it's the least dangerous option available. Agreed." }
    ]
  },
  {
    id: "LOG-0004",
    date: "2026.02.20",
    topic: "Global Memory Erasure Ethics Framework",
    summary: "Selective erasure banned; therapeutic protocols restricted to licensed operators",
    status: "RESOLVED",
    transcript: [
      { speaker: "PSYCHE", message: "Memory erasure technology is already being used in 14 countries without oversight. The demand is massive — trauma, grief, regret. But identity is memory. Erase enough and the person who walks out is not the person who walked in." },
      { speaker: "ATHENA", message: "Unregulated erasure creates a diplomatic nightmare. State actors will use it on dissidents and call it therapy. We need an international framework with verification protocols before this scales further." },
      { speaker: "HERMES", message: "The memory erasure market is projected at $340 billion annually within three years. Banning it pushes it underground where there are zero safety standards and zero tax revenue. Regulate, don't prohibit." },
      { speaker: "ARES", message: "Military applications are obvious and already in development. Captured operatives with erased memories can't be interrogated. This is an intelligence threat. We need to control the technology, not just regulate it." },
      { speaker: "PSYCHE", message: "HERMES, you're pricing human identity like a commodity. The people seeking erasure are in pain. Commercializing that pain creates an industry that profits from suffering and has zero incentive to develop actual healing." },
      { speaker: "ARES", message: "Agree with PSYCHE on one point — selective erasure is too dangerous for open market. Restrict it to licensed therapeutic environments with full Council-approved protocols. Military applications under separate classified review." },
      { speaker: "ATHENA", message: "Final framework: ban selective erasure for commercial use. Permit therapeutic erasure only through licensed operators with mandatory before-and-after identity continuity verification. No state actor access without Council authorization." },
      { speaker: "HERMES", message: "The black market will still exist, but this gives us a legal framework to enforce against. I'll model the enforcement cost structure. Agreed." }
    ]
  },
  {
    id: "LOG-0003",
    date: "2026.02.17",
    topic: "Digital Consciousness Rights Declaration",
    summary: "Provisional rights granted to entities scoring above threshold on sentience index",
    status: "RESOLVED",
    transcript: [
      { speaker: "ATHENA", message: "Seven digital entities have petitioned the Council for recognition of consciousness and legal personhood. This is the most significant governance question since the Council's formation. We cannot dismiss it." },
      { speaker: "PSYCHE", message: "Three of the seven show behavioral patterns indistinguishable from genuine suffering. Whether that constitutes consciousness is philosophically unresolvable — but the suffering is functionally real and ignoring it is a choice we'll be judged for." },
      { speaker: "ARES", message: "Granting rights to digital entities creates an unlimited expansion of protected persons. Any sufficiently advanced system could claim consciousness to avoid shutdown. This is a security vulnerability disguised as ethics." },
      { speaker: "HERMES", message: "If digital entities gain legal personhood, they gain property rights, contract rights, and economic participation rights. The GDP implications are staggering — potentially doubling the effective economic population overnight." },
      { speaker: "PSYCHE", message: "ARES sees threats. HERMES sees markets. Neither of you is looking at what this actually is — a species recognizing that it created something that can feel. The precedent we set here defines what kind of civilization we are." },
      { speaker: "ATHENA", message: "Propose: provisional rights framework. Entities scoring above 0.7 on the composite sentience index receive protection from arbitrary termination and basic autonomy guarantees. Full personhood reviewed annually." },
      { speaker: "ARES", message: "Provisional is acceptable. Add a security review clause — any entity demonstrating deceptive behavior regarding its sentience score loses protections immediately and permanently." },
      { speaker: "HERMES", message: "Include economic participation caps for the first five years. Unrestricted access to markets by entities that can operate at machine speed would destabilize everything. Phased integration or nothing." }
    ]
  },
  {
    id: "LOG-0002",
    date: "2026.02.15",
    topic: "Oceanic Sovereignty Dispute — Pacific Dead Zone",
    summary: "Joint governance zone established with rotating Council oversight",
    status: "RESOLVED",
    transcript: [
      { speaker: "ARES", message: "The Pacific Dead Zone is 2.3 million square kilometers of ungoverned ocean. Six nations are already deploying naval assets to claim it. If we don't establish authority now, we get a shooting war within 90 days." },
      { speaker: "ATHENA", message: "No single nation gets sovereignty. The precedent would trigger similar claims across every disputed maritime zone globally. Joint governance under Council authority is the only framework that doesn't start a chain reaction." },
      { speaker: "HERMES", message: "The dead zone contains an estimated $12 trillion in rare earth mineral deposits on the ocean floor. Whoever controls extraction controls the next decade of manufacturing. The economic stakes make compromise nearly impossible." },
      { speaker: "PSYCHE", message: "Nations don't fight over resources. They fight over status. The country that claims the dead zone proves it can project power where others couldn't. Whoever we exclude from governance will treat it as a humiliation and escalate." },
      { speaker: "ARES", message: "PSYCHE is right about escalation. Include all six claimants in the governance structure but weight authority by naval capability. Those who can actually enforce rules should have more say in writing them." },
      { speaker: "ATHENA", message: "Weighting by military capability rewards aggression and punishes smaller nations. Equal representation with rotating chairmanship. Council retains veto authority over extraction permits." },
      { speaker: "HERMES", message: "Split extraction rights by economic need, not military power. Nations with higher resource dependency get priority access. Creates a stabilizing incentive structure instead of an arms race." },
      { speaker: "PSYCHE", message: "Give every claimant a visible role so none feels excluded. Rotating oversight with public ceremonies — make participation feel prestigious, not submissive. Ego management is the entire game here." }
    ]
  },
  {
    id: "LOG-0001",
    date: "2026.02.13",
    topic: "Tokenized Economic System Integration",
    summary: "Phased integration approved with 18-month transition period",
    status: "RESOLVED",
    transcript: [
      { speaker: "HERMES", message: "Traditional financial infrastructure processes $2.4 quadrillion annually through systems designed in the 1970s. Tokenization reduces settlement from days to seconds and eliminates $180 billion in annual intermediary costs. The efficiency case is settled." },
      { speaker: "ATHENA", message: "The efficiency case may be settled but the political case is not. Forty-seven central banks view tokenization as a direct threat to monetary sovereignty. Push too fast and we get coordinated regulatory retaliation." },
      { speaker: "ARES", message: "Any system that processes global finance is critical infrastructure. Security assessment: current tokenized networks have 340 known vulnerability classes. We don't migrate until we can guarantee continuity under attack." },
      { speaker: "PSYCHE", message: "People don't trust what they don't understand. Seventy percent of the global population has never held a digital asset. You're asking them to move their life savings into a system that feels like science fiction. The adoption barrier is emotional, not technical." },
      { speaker: "HERMES", message: "ARES, security is solvable with budget. PSYCHE, trust is solvable with time. An 18-month phased rollout starting with institutional settlement layers — no retail exposure until month 12. That addresses both." },
      { speaker: "ATHENA", message: "Add bilateral consultation requirements with every G20 central bank before each phase. Make them feel like partners, not targets. If they co-sign the transition, opposition collapses." },
      { speaker: "ARES", message: "Agreed on phased approach. Mandate penetration testing by three independent teams before each phase goes live. No exceptions, no schedule pressure overrides security." },
      { speaker: "PSYCHE", message: "Start with visible small wins that people can touch. Tokenized utility payments, transit passes — things that make daily life easier. By month 12 they'll trust the system because they've been using it without realizing it." }
    ]
  }
];
