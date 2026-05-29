export interface Project {
  slug: string;
  num: string;
  company: string;
  title: string;
  blurb: string;
  year: string;
  quarter: string;
  role: string;
  team: string;
  tags: string[];
  metric: string;
  accent?: string;
}

export interface JourneyStep {
  range: string;
  title: string;
  body: string;
  companies: { name: string; url: string }[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Company {
  name: string;
  note: string;
  url: string;
}

export interface Stat {
  n: string;
  label: string;
  unit: string;
}

export interface Value {
  kind: 'collab' | 'relentless' | 'craft';
  tag: string;
  title: string;
  body: string;
}

export interface CrewMember {
  name: string;
  role: string;
  note: string;
  label: string;
  img: string;
}

export const PROJECTS: Project[] = [
  {
    slug: 'identity-profiles',
    num: '01',
    company: 'Red Canary',
    title: 'Reimagining identity profiles with AI-driven insights',
    blurb:
      'An identity could appear a half-dozen times across integrations. I unified the picture and folded in Gen-AI summaries — without making people read a wall of text.',
    year: '2025',
    quarter: 'Q3 2025',
    role: 'Lead Product Designer',
    team: '1 PM · 4 Eng · 1 Designer',
    tags: ['Strategy', 'AI'],
    metric: '-15% time-to-decision',
    accent: '#E13B14',
  },
  {
    slug: 'security-data-lake',
    num: '02',
    company: 'Red Canary',
    title: 'Security Data Lake',
    blurb:
      'A net-new product letting customers query everything their integrations capture. Zero-to-one from research through GA.',
    year: '2024',
    quarter: 'Q3 2024',
    role: 'Lead Product Designer',
    team: '2 PM · 6 Eng · 1 Designer',
    tags: ['0→1', 'Strategy'],
    metric: 'GA in 9 months',
  },
  {
    slug: 'unified-onboarding',
    num: '03',
    company: 'Red Canary',
    title: 'Unified integration onboarding',
    blurb:
      '100+ integrations, 100+ flavors of onboarding. I built one pattern that survives contact with every vendor.',
    year: '2024',
    quarter: 'Q4 2024',
    role: 'Lead Product Designer',
    team: '1 PM · 3 Eng · 1 Designer',
    tags: ['Strategy', 'Systems'],
    metric: '1 pattern, 100+ integrations',
  },
  {
    slug: 'status-checks',
    num: '04',
    company: 'Red Canary',
    title: 'Integrations with failing status checks',
    blurb:
      'An expired cert during a live incident eroded customer trust. I designed the surface that surfaces brokenness before customers notice.',
    year: '2025',
    quarter: '2025',
    role: 'Senior Designer',
    team: '1 PM · 2 Eng · 1 Designer',
    tags: ['Strategy', 'Systems'],
    metric: '−40% support tickets',
  },
  {
    slug: 'commuter-benefits',
    num: '05',
    company: 'Edenred',
    title: 'Commuter Benefits',
    blurb:
      'A product duct-taped together from three legacy systems. I rebuilt the experience without forcing a big-bang migration.',
    year: '2023',
    quarter: 'Q2 2023',
    role: 'Senior UX Designer',
    team: '2 PM · 8 Eng · 2 Designers',
    tags: ['Systems', 'Strategy'],
    metric: 'Re-platformed in 11 months',
  },
  {
    slug: 'fleet-card',
    num: '06',
    company: 'Edenred',
    title: 'Fleet Card',
    blurb:
      'A real-time spend-controlled card for fleets. New product line, new revenue, designed from a single index card.',
    year: '2022',
    quarter: 'Q2 2022',
    role: 'Senior UX Designer',
    team: '1 PM · 5 Eng · 1 Designer',
    tags: ['0→1', 'Strategy'],
    metric: '$NEW line of revenue',
  },
  {
    slug: 'groundbase',
    num: '07',
    company: 'Personal Project',
    title: 'Groundbase',
    blurb:
      'There are no good tools for managing a home build. So I built one. Yes, my house is also a stress test.',
    year: '2024',
    quarter: '2024',
    role: 'Founder / Everything',
    team: 'Me, late at night',
    tags: ['0→1'],
    metric: '1 house, 0 spreadsheets',
  },
];

export const JOURNEY: JourneyStep[] = [
  {
    range: '2011 — 2013',
    title: 'Web Designer',
    body:
      'Cut my teeth on marketing sites. Learned that hierarchy is most of the job and that a grid is a tool, not a religion.',
    companies: [
      { name: 'Catertrax', url: 'https://www.catertrax.com' },
    ],
  },
  {
    range: '2013 — 2018',
    title: 'Front-end Developer',
    body:
      'Wrote production HTML/CSS/JS for companies that cared a lot about pixels. Learned what\'s expensive vs. cheap to build — knowledge I still use every single day.',
    companies: [
      { name: 'U. of Rochester', url: 'https://www.urmc.rochester.edu' },
      { name: 'Circadence', url: 'https://www.circadence.com' },
    ],
  },
  {
    range: '2018 — 2021',
    title: 'UX Designer',
    body:
      'Moved into enterprise: finance, healthcare, security. Owned design systems, accessibility, and end-to-end flows. Started thinking in systems instead of screens.',
    companies: [
      { name: 'CIT Bank', url: 'https://www.cit.com' },
    ],
  },
  {
    range: '2021 — Now',
    title: 'Senior / Lead Product Designer',
    body:
      'Leading 0→1 and platform work. Partnering closely with PM and Eng to ship faster and argue less. Comfortable with both the strategy doc and the spec.',
    companies: [
      { name: 'Edenred', url: 'https://www.edenred.com' },
      { name: 'Red Canary', url: 'https://redcanary.com' },
      { name: 'Zscaler', url: 'https://www.zscaler.com' },
    ],
  },
];

export const FAQ: FaqItem[] = [
  {
    q: "What's your design superpower?",
    a: "Translating an ambiguous problem into a deck of options that engineering can actually estimate. I think in flows and trade-offs more than in screens.",
  },
  {
    q: "What kind of problems do you solve best?",
    a: 'Enterprise-y systems with too many states and not enough hierarchy. Onboarding, settings, admin, anything with the word "console" in it.',
  },
  {
    q: "What's it like working with you?",
    a: "Bias to action. Quick comps over a week-long Figma file. I write specs. I write tickets. I'll close the loop with engineering instead of throwing a file over the wall.",
  },
  {
    q: 'Remote-friendly?',
    a: "I'm fully remote, US East Coast. I overlap with EU mornings and West Coast afternoons. I'm in Slack, not vibes.",
  },
  {
    q: 'How do you handle disagreement?',
    a: "Stronger opinions, loosely held. If you have data or context I don't, I want it. If you don't, I'll defend the design.",
  },
];

export const COMPANIES: Company[] = [
  { name: 'Zscaler', note: 'Cloud security', url: 'https://www.zscaler.com' },
  { name: 'CIT Bank', note: 'Consumer banking', url: 'https://www.cit.com' },
  { name: 'Circadence', note: 'Cyber training', url: 'https://www.circadence.com' },
  { name: 'Red Canary', note: 'MDR + security ops', url: 'https://redcanary.com' },
  { name: 'U. of Rochester', note: 'Healthcare / research', url: 'https://www.urmc.rochester.edu' },
  { name: 'Edenred', note: 'Benefits + payments', url: 'https://www.edenred.com' },
  { name: 'Catertrax', note: 'Catering platform', url: 'https://www.catertrax.com' },
];

export const STATS: Stat[] = [
  { n: '12+', label: 'Years building things people use', unit: 'yrs' },
  { n: '1M+', label: 'Humans touched by work I shipped', unit: 'ppl' },
  { n: '3', label: 'Disciplines crossed — code, design, lead', unit: 'hats' },
  { n: '1,000+', label: 'Rounds of feedback survived', unit: 'loops' },
];

export const VALUES: Value[] = [
  {
    kind: 'collab',
    tag: 'WE will take the ring to mordor',
    title: 'Collaborator',
    body: 'Exploring new ideas, jumping into CSS tweaks, or whiteboarding through a problem — I work best shoulder-to-shoulder with the team to drive the strongest outcome.',
  },
  {
    kind: 'relentless',
    tag: 'Comfortable with hidden dragons',
    title: 'Relentless',
    body: 'Comfortable with ambiguity and persistent through blockers. The interesting problems are always behind a few boring ones — I\'ll go find them.',
  },
  {
    kind: 'craft',
    tag: 'Design AND code',
    title: 'Craft across disciplines',
    body: "I design and I code. That mix lets me bridge vision and implementation, ship realistic specs, and keep the gap between Figma and production thin.",
  },
];

export const CREW: CrewMember[] = [
  {
    name: 'Josh',
    role: 'The human',
    note: 'Designs by day. Builds furniture badly by night.',
    label: 'PHOTO — JOSH (REAL)',
    img: 'https://framerusercontent.com/images/pQVssKXDl3MGeXUnsOIlyRrk.jpg',
  },
  {
    name: 'Squash',
    role: 'Director of Vibes',
    note: 'Goldendoodle. Has opinions on every stand-up.',
    label: 'PHOTO — SQUASH',
    img: 'https://framerusercontent.com/images/a0oeWqUB7vLiZ92mkZpIsvP3hkQ.jpg',
  },
  {
    name: 'Noodles',
    role: 'VP of Snacks',
    note: 'Smaller. Faster. Slightly worse manners.',
    label: 'PHOTO — NOODLES',
    img: 'https://framerusercontent.com/images/hcFB78uQ64NAhoDDNKBiPdG1Dg.jpg',
  },
];
