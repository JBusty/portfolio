/**
 * Copy for the homepage's two working pieces: the Bussey-Matic 3000 in the hero
 * and the process line under it. Kept here rather than in the components so the
 * words can be edited without reading canvas code.
 */

export interface MachineFeature {
  slug: string;
  name: string;
  company: string;
  outcome: string;
  img: string;
  /** One line per stage: Discover, Design, Build, Validate, Ship. */
  log: [string, string, string, string, string];
}

/** What the machine "builds" when the lever is pulled, in order. Drafted from the case studies. */
export const MACHINE_FEATURES: MachineFeature[] = [
  { slug: 'status-checks', name: 'Integration health', company: 'Red Canary', outcome: '~25% fewer support escalations', img: '/images/status-checks/carousel-2.png',
    log: ['Reading the support tickets', 'Prototyping the warning state', 'Wiring up the status checks', 'Piloting with customers', 'Released. Escalations down ~25%'] },
  { slug: 'identity-profiles', name: 'Identity profiles', company: 'Red Canary · AI', outcome: '~15% faster decisions', img: '/images/identity-profiles/solution-4.png',
    log: ['Benchmarking the category', 'Deciding how much the AI says', 'Building the snapshot view', 'Tiered rollout to customers', 'Released. Decisions ~15% faster'] },
  { slug: 'unified-onboarding', name: 'Unified onboarding', company: 'Red Canary', outcome: '1 pattern, 100+ integrations', img: '/images/unified-onboarding/solution-3.png',
    log: ['Cataloguing 100+ setup flows', 'Designing one numbered spine', 'Building the shared pattern', 'Testing the worst offenders', 'Released across 100+ integrations'] },
  { slug: 'security-data-lake', name: 'Security Data Lake', company: 'Red Canary', outcome: 'GA in 9 months', img: '/images/security-data-lake/solution-3.png',
    log: ['Mining support requests', 'Prototyping the query tool', 'Building on familiar SQL', 'Early-adopter testing', 'Generally available in 9 months'] },
  { slug: 'commuter-benefits', name: 'Commuter Benefits', company: 'Edenred', outcome: 'Won the Google contract', img: '/images/commuter-benefits/solution-final.png',
    log: ['Untangling three legacy systems', 'Designing a gradual rollout', 'Rebuilding the admin portal', 'Validating with big clients', 'Shipped. Won the Google contract'] },
  { slug: 'fleet-card', name: 'Fleet Card', company: 'Edenred', outcome: '200+ businesses converted', img: '/images/fleet-card/solution-1.png',
    log: ['Interviewing fleet managers', 'Sketching it on an index card', 'Building real-time controls', 'Beta with early fleets', 'Launched. 200+ businesses'] },
];

export const MACHINE_STAGES = ['Discover', 'Design', 'Build', 'Validate', 'Ship'] as const;

/** What Josh keeps tossing into the intake while the machine runs, in turn (icon names map to glyphs in MachineHero). */
export const MACHINE_INPUTS = [
  { label: 'Ambiguity', icon: 'ask' },
  { label: 'Slack: “quick q?”', icon: 'chat' },
  { label: 'PRD v7 (final)', icon: 'doc' },
  { label: 'Eng sync', icon: 'cal' },
  { label: 'Design system', icon: 'grid' },
  { label: 'User interviews', icon: 'people' },
  { label: 'Edge cases', icon: 'warn' },
  { label: 'Exec feedback', icon: 'horn' },
  { label: 'Jira backlog', icon: 'list' },
] as const;

export interface ProcessStep {
  title: string;
  line: string;
  planBQ: string;
  planBA: string;
  /** Short label for this step's stop on the Plan B detour. */
  planBStop: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  { title: 'Discover', line: 'I talk to the people using it, and I read every support ticket I can find.',
    planBQ: 'No time for research?', planBA: 'I spend a day in the support queue and get three customers on a call.', planBStop: 'Talk to 3 users' },
  { title: 'Design', line: 'I prototype early, test it with real people, and change my mind when they prove me wrong.',
    planBQ: 'No time for polish?', planBA: 'I skip the polished mocks and prototype in code against real data.', planBStop: 'Prototype in code' },
  { title: 'Build', line: 'I prototype with AI, so ideas turn into working software in days, not sprints. I was a front-end developer first, so I can take it the rest of the way.',
    planBQ: 'Short on engineers?', planBA: 'I build it myself with AI and ship the smallest version that works.', planBStop: 'Build it with AI' },
  { title: 'Validate', line: 'I get it in front of real customers before everyone gets it.',
    planBQ: 'Can’t reach customers?', planBA: 'I go to the people who hear from them every day (support, sales and solutions engineers) and back it up with usage data.', planBStop: 'Ask support & sales' },
  { title: 'Ship', line: 'I ship it, then check whether it actually helped.',
    planBQ: 'Had to cut corners?', planBA: 'I ship it, then make sure the cleanup is on the roadmap, not just in my head.', planBStop: 'Schedule the cleanup' },
];

/** The sixth column: what powers the line. */
export const PROCESS_POWER = {
  label: 'Power source',
  title: 'Self-propelled',
  line: 'I don’t wait for a ticket to start. If something’s stuck, I’m already running.',
  planBQ: 'Hamster down?',
  planBA: 'I get out and push. It isn’t pretty, but it ships.',
};

export const RESUME_URL = 'https://drive.google.com/file/d/17OJanguMKHAdKGfoBDpI_eS_1_a5fZEh/view';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/joshuabussey/';
export const EMAIL = 'jbusseywork@gmail.com';

/**
 * Detail for the Results cards under the process line. Taken from the comments on
 * STATS in lib/data.ts: the 0→1 products, and the industries behind "5".
 */
export const RESULT_PRODUCTS: { short: string; name: string }[] = [
  { short: 'Data Lake', name: 'Security Data Lake' },
  { short: 'Fleet Card', name: 'Fleet Card' },
  { short: 'Groundbase', name: 'Groundbase' },
  { short: 'RemoteTechRoles', name: 'RemoteTechRoles' },
];
export const RESULT_INDUSTRIES = ['Security', 'Banking', 'Healthcare', 'Benefits', 'Food service'];

/** The quiet "Shipped at" line under the hero buttons: the most recognizable names from COMPANIES. */
export const HERO_COMPANIES = ['Zscaler', 'Red Canary', 'Edenred', 'CIT Bank'];
