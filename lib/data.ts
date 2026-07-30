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
  /** Representative image for list rows and homepage cards — the shipped state, not the problem. */
  thumb: string;
  /**
   * object-position for the thumbnail crop. These screenshots range from ar 0.92 to 3.80,
   * so the interesting region is not always the centre. Defaults to 'top center'.
   */
  thumbPosition?: string;
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
  kind: 'collab' | 'relentless' | 'craft' | 'ai';
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
      'An identity could appear a half-dozen times across integrations. I unified the picture and folded in Gen-AI summaries without making people read a wall of text.',
    year: '2025',
    quarter: 'Q3 2025',
    role: 'Senior Product Designer',
    team: '1 PM · 4 Eng · 1 Designer',
    tags: ['Strategy', 'Refactor'],
    metric: '~15% faster time-to-decision',
    // solution-4 is an annotated skeleton-loader spec; solution-2 is the actual AI feature.
    thumb: '/images/identity-profiles/solution-2.png',
    thumbPosition: 'left top',
    accent: '#E13B14',
  },
  {
    slug: 'status-checks',
    num: '02',
    company: 'Red Canary',
    title: 'Integrations with failing status checks',
    blurb:
      'An expired cert during a live incident eroded customer trust. I designed the surface that surfaces brokenness before customers notice.',
    year: '2025',
    quarter: 'Q1 2025',
    role: 'Senior Product Designer',
    team: '1 PM · 2 Eng · 1 Designer',
    tags: ['Design Advocacy', 'UX Loopholes'],
    metric: '~25% fewer support escalations',
    thumb: '/images/status-checks/carousel-2.png',
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
    role: 'Senior Product Designer',
    team: '1 PM · 3 Eng · 1 Designer',
    tags: ['Strategy', 'UX Cleanup'],
    metric: '1 pattern, 100+ integrations',
    thumb: '/images/unified-onboarding/solution-3.png',
  },
  {
    slug: 'groundbase',
    num: '04',
    company: 'Personal Project',
    title: 'Groundbase',
    blurb:
      'There are no good tools for managing a home build. So I built one. Yes, my house is also a stress test.',
    year: '2024',
    quarter: '2024',
    role: 'Founder / Everything',
    team: 'Me, late at night',
    tags: ['Founder', '0→1'],
    metric: '1 house, 0 spreadsheets',
    thumb: '/images/groundbase/solution-3.png',
  },
  {
    slug: 'security-data-lake',
    num: '05',
    company: 'Red Canary',
    title: 'Security Data Lake',
    blurb:
      'A net-new product letting customers query everything their integrations capture. Zero-to-one from research through GA.',
    year: '2024',
    quarter: 'Q3 2024',
    role: 'Senior Product Designer',
    team: '2 PM · 6 Eng · 1 Designer',
    tags: ['0→1', 'Innovate'],
    metric: 'GA in 9 months',
    thumb: '/images/security-data-lake/solution-4.png',
  },
  {
    slug: 'commuter-benefits',
    num: '06',
    company: 'Edenred',
    title: 'Commuter Benefits',
    blurb:
      'A product duct-taped together from three legacy systems. I rebuilt the experience without forcing a big-bang migration.',
    year: '2023',
    quarter: 'Q2 2023',
    role: 'Senior Product Designer',
    team: '2 PM · 8 Eng · 2 Designers',
    tags: ['Refactor', 'Strategy'],
    metric: 'Won the Google contract',
    thumb: '/images/commuter-benefits/solution-final.png',
  },
  {
    slug: 'fleet-card',
    num: '07',
    company: 'Edenred',
    title: 'Fleet Card',
    blurb:
      'A real-time spend-controlled card for fleets. New product line, new revenue, designed from a single index card.',
    year: '2022',
    quarter: 'Q2 2022',
    role: 'Senior Product Designer',
    team: '1 PM · 5 Eng · 1 Designer',
    tags: ['Strategy', '0→1'],
    metric: '200+ businesses converted',
    thumb: '/images/fleet-card/solution-4.png',
  },
];

/**
 * The three studies that lead the homepage. Chosen to cover security, fintech,
 * and founder/0→1 range rather than to be the three most recent.
 */
export const FEATURED_SLUGS = ['identity-profiles', 'commuter-benefits', 'groundbase'] as const;

export const FEATURED_PROJECTS: Project[] = FEATURED_SLUGS.map((slug) => {
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) throw new Error(`FEATURED_SLUGS references unknown project: ${slug}`);
  return project;
});

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
      'Wrote production HTML/CSS/JS for companies that cared a lot about pixels. Learned what\'s expensive vs. cheap to build, knowledge I still use every single day.',
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
      'Leading 0→1 and platform work in security operations, including the GenAI surfaces analysts now rely on. Partnering closely with PM and Eng to ship faster and argue less. Comfortable with both the strategy doc and the spec.',
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
    a: "Systems thinking. I default to building scalable patterns and component libraries rather than one-off solutions, so the work compounds over time instead of creating more debt.",
  },
  {
    q: "What kind of problems do you solve best?",
    a: "Complex enterprise workflows that have gotten out of hand, the kind where users have learned to work around the product instead of with it. I've spent 12+ years across five industries, going deepest in cybersecurity, finance, and healthcare, which means I'm comfortable with high-stakes, high-complexity problems where getting it wrong actually matters.",
  },
  {
    q: "What's it like working with you?",
    a: "I'm the person teammates come to when something's stuck. Friendly, collaborative, and genuinely dependable. When something's blocking us, I'll kick down whatever doors are necessary to move forward. People know that when I'm involved, it gets done.",
  },
  {
    q: "How do you work with engineers?",
    a: "Closely and directly, which is easier when you can speak their language. I've contributed to front-end production code, built design systems in code from Bootstrap through React and Tailwind, and spent enough time in the codebase to know what's actually feasible.",
  },
  {
    q: "What environments bring out your best work?",
    a: "Teams where design has a real seat at the table and engineers are treated as partners, not executors. I do my best work when there's a hard problem, a collaborative team, and enough trust to move fast and iterate.",
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
  { n: '1M+', label: 'Humans impacted by work I shipped', unit: 'ppl' },
  // Counted from the 0→1 tag: Security Data Lake, Fleet Card, Groundbase.
  { n: '3', label: 'Products taken 0→1, concept to ship', unit: 'builds' },
  // Derived from COMPANIES below: security (Zscaler, Circadence, Red Canary),
  // banking (CIT Bank), healthcare (U. of Rochester), benefits + payments (Edenred),
  // food service (Catertrax). Drops to 4 if payments is grouped under finance.
  { n: '5', label: 'Industries, from security to healthcare', unit: 'fields' },
];

export const VALUES: Value[] = [
  {
    kind: 'collab',
    tag: 'WE will take the ring to mordor',
    title: 'Collaborator',
    body: 'Exploring new ideas, jumping into CSS tweaks, or whiteboarding through a problem. I work best shoulder-to-shoulder with the team to drive the strongest outcome.',
  },
  {
    kind: 'relentless',
    tag: 'Comfortable with hidden dragons',
    title: 'Relentless',
    body: 'Comfortable with ambiguity and persistent through blockers. The interesting problems are always behind a few boring ones. I\'ll go find them.',
  },
  {
    kind: 'craft',
    tag: 'Design AND code',
    title: 'Craft across disciplines',
    body: "I design and I code. That mix lets me bridge vision and implementation, ship realistic specs, and keep the gap between Figma and production thin.",
  },
  {
    kind: 'ai',
    tag: 'Summaries, not essays',
    title: 'Fluent in AI',
    body: 'I design the AI surfaces, not just around them. Deciding how much a model should say, where confidence belongs, and when generated content helps versus gets in the way. I also prototype with AI, which means direction gets pressure-tested in days instead of sprints.',
  },
];

export const CREW: CrewMember[] = [
  {
    name: 'Josh',
    role: 'The human',
    note: 'Designs by day. Builds furniture badly by night.',
    label: 'PHOTO — JOSH (REAL)',
    img: '/images/crew/josh.jpg',
  },
  {
    name: 'Squash',
    role: 'Director of Vibes',
    note: 'Goldendoodle. Has opinions on every stand-up.',
    label: 'PHOTO — SQUASH',
    img: '/images/crew/squash.jpg',
  },
  {
    name: 'Noodles',
    role: 'VP of Snacks',
    note: 'Smaller. Faster. Slightly worse manners.',
    label: 'PHOTO — NOODLES',
    img: '/images/crew/noodles.jpg',
  },
];

