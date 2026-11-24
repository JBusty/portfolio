/*
 * The /skills page. Copy comes from Josh's résumé (keep it in his words). The
 * two figures not on the résumé, "~25%" and "15,900", are from the case-study
 * cards in lib/data.ts.
 *
 * Each proof lists which of its group's skills it backs up (by index), so
 * every skill has at least one result behind it and the page can highlight them.
 */

export interface SkillProof {
  /** The headline number. Omit for results that don't have one: they get a check icon instead. */
  metric?: string;
  text: string;
  source: string;
  /** Case study that shows it, if there is one. */
  slug?: string;
  /** Indexes into the group's `skills`. */
  skills: number[];
}

export interface SkillGroup {
  id: string;
  name: string;
  /** SVG path data, 24×24, stroked. */
  icon: string;
  skills: string[];
  proofs: SkillProof[];
}

export const SKILLS_SUMMARY =
  'Product designer with 12+ years building enterprise SaaS across cybersecurity, fintech, and healthcare. I specialize in 0→1 product definition, complex workflows, and platform experiences where reliability and clarity matter. I bridge product strategy, systems thinking, and engineering to turn ambiguous technical problems into products teams can ship.';

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: 'product',
    name: 'Product & Platform',
    icon: 'M3 7l9-4 9 4-9 4zM3 12l9 4 9-4M3 17l9 4 9-4',
    skills: ['0→1 product definition', 'Enterprise platforms', 'Complex workflows', 'Design systems', 'Information architecture'],
    proofs: [
      { metric: 'GA in 9 mo', text: 'Took Security Data Lake from research to GA in 9 months as the only designer.', source: 'Red Canary · 2024', slug: 'security-data-lake', skills: [0, 1] },
      { metric: '100+ → 1', text: 'Replaced 100+ bespoke integration onboarding flows with one unifying, scalable pattern. Every integration after it got cheaper to design and build.', source: 'Red Canary · 2024', slug: 'unified-onboarding', skills: [1, 2, 3, 4] },
      { metric: '~25%', text: 'Designed integration status checks that catch a broken telemetry source before an analyst finds out mid-incident.', source: 'Red Canary · 2025 · fewer support escalations', slug: 'status-checks', skills: [2] },
      { metric: '< 1 yr', text: 'Shipped the fleet card product line from zero to production in under a year against a hard market deadline.', source: 'Edenred · 2022', slug: 'fleet-card', skills: [0, 3] },
    ],
  },
  {
    id: 'ai',
    name: 'AI Augmented Design',
    icon: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
    skills: ['AI-assisted prototyping', 'GenAI experiences', 'Claude Code & Figma Make', 'Pressure tested direction', 'Human-in-the-loop UX'],
    proofs: [
      { metric: '~15%', text: 'Led the GenAI redesign of Identity Profiles, pulling an identity that was scattered across a half-dozen integrations into one view analysts could act on. Cut correlation time ~15% during investigations.', source: 'Red Canary · 2025', slug: 'identity-profiles', skills: [1, 4] },
      { text: 'Used AI-assisted prototypes to validate product direction with PMs and engineers before implementation, reducing debate and accelerating decision making.', source: 'Red Canary', skills: [0, 3] },
      { metric: '15,900', text: 'Designed, prompted, and shipped a 0 -> 1 tool for seekers of remote tech jobs. Always free.', source: 'RemoteTechRoles · 2026 · job boards, one list', slug: 'remote-tech-roles', skills: [0, 2] },
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering Fluency',
    icon: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
    skills: ['Production contributions', 'HTML/CSS/Tailwind/React', 'Technical feasibility', 'Design-to-code handoff', 'WCAG'],
    proofs: [
      { metric: '25%', text: 'Built the design system in both design and code. Cut iteration time 25%, and new features stopped arriving with their own one-off components.', source: 'Edenred · 2021–23', slug: 'fleet-card', skills: [1, 3] },
      { text: 'Designed prototypes and built the components in production, which removed the handoff step entirely on system work.', source: 'CIT Group · 2018–21', skills: [0, 3] },
      { metric: 'TB-scale', text: 'Threat hunting queries, monitoring, export, and a cost preview so customers could see what a terabyte-scale telemetry search would spend before running it.', source: 'Red Canary · Security Data Lake', slug: 'security-data-lake', skills: [2] },
      { metric: 'WCAG AA', text: 'Refactored a legacy codebase to semantic HTML5 and WCAG AA compliance.', source: 'CIT Group · also URMC & Edenred', skills: [4] },
    ],
  },
];

/** Extra search words, so the ⌘K palette finds a skill by the plain-English name people type. */
export const SKILL_AKA: Record<string, string> = {
  '0→1 product definition': '0-1 zero to one new product greenfield strategy',
  'Enterprise platforms': 'b2b saas enterprise software platform',
  'Complex workflows': 'workflow ux flows',
  'Design systems': 'component library ui kit tokens',
  'Information architecture': 'ia navigation structure',
  'AI-assisted prototyping': 'ai prototype vibe coding',
  'GenAI experiences': 'generative ai llm ai ux',
  'Claude Code & Figma Make': 'ai tools vibe coding claude figma',
  'Pressure tested direction': 'validation decision making',
  'Human-in-the-loop UX': 'ai trust oversight review',
  'Production contributions': 'shipping code production bug bash',
  'HTML/CSS/Tailwind/React': 'front-end frontend code coding javascript typescript',
  'Technical feasibility': 'engineering collaboration constraints',
  'Design-to-code handoff': 'developer handoff engineering dev',
  'WCAG': 'accessibility a11y ada inclusive',
};

export interface Role {
  title: string;
  company: string;
  dates: string;
  where: string;
  note?: string;
  /** The résumé's opening line for the role, when it has one (some roles are bullets only). */
  intro?: string;
  highlights: string[];
  current?: boolean;
}

export const ROLES: Role[] = [
  {
    current: true,
    title: 'Senior Product Designer', company: 'Red Canary → Zscaler', dates: 'Aug 2023 – Present', where: 'Remote · Cybersecurity',
    note: 'Red Canary acquired by Zscaler, Aug 2025',
    intro: 'Design lead for Integrations, Security Data Lake, and AI Science. Sole designer on most initiatives, from early research through launch.',
    highlights: [
      'Led the GenAI redesign of Identity Profiles, pulling an identity that was scattered across a half-dozen integrations into one view analysts could act on. Cut correlation time ~15% during investigations.',
      'Took Security Data Lake from research to GA in 9 months as the only designer. Threat hunting queries, monitoring, export, and a cost preview so customers could see what a terabyte-scale telemetry search would spend before running it.',
      'Replaced 100+ bespoke integration onboarding flows with one unifying, scalable pattern. Every integration after it got cheaper to design and build.',
      'Used AI-assisted prototypes to validate product direction with PMs and engineers before implementation, reducing debate and accelerating decision making.',
      'Designed integration status checks that catch a broken telemetry source before an analyst finds out mid-incident.',
      'Leading the post-acquisition work to bring Red Canary capabilities into a new Zscaler product.',
      'Started a design vigilance program, auditing the platform for inconsistencies nobody owned and turning them into scoped work.',
      'Built and rolled out design workflows across teams. Cut design churn ~20%.',
      'Contributed UI fixes directly to production and established a recurring bug bash cadence.',
    ],
  },
  {
    title: 'Senior Product Designer', company: 'Edenred Fleet & Mobility', dates: 'Apr 2021 – Aug 2023', where: 'Remote · Fintech & Payments',
    intro: 'Fleet payments and mobility. Directed design across business units and owned the system behind a new product line.',
    highlights: [
      'Shipped the fleet card product line from zero to production in under a year against a hard market deadline.',
      'Built the design system in both design and code. Cut iteration time 25%, and new features stopped arriving with their own one-off components.',
      'Connected workflows that had lived in separate departments, which opened cross-sell paths the product could not support before.',
      'Owned accessibility to WCAG AA across platforms and ran the usability testing behind it.',
      'Mentored offshore designers on the system and on when to deviate from it.',
    ],
  },
  {
    title: 'UX Designer', company: 'CIT Group', dates: 'Nov 2018 – Apr 2021', where: 'Portsmouth, NH · Fintech & Banking',
    intro: 'Consumer and commercial banking. First designer to treat the front end as a shared system rather than per-product work.',
    highlights: [
      'Owned the enterprise design system and component library across a suite of regulated financial applications.',
      'Designed prototypes and built the components in production, which removed the handoff step entirely on system work.',
      'Refactored a legacy codebase to semantic HTML5 and WCAG AA compliance.',
    ],
  },
  {
    title: 'Front-End Developer', company: 'Circadence', dates: 'Aug 2017 – Nov 2018', where: 'Remote · Cybersecurity',
    intro: 'Led development of a customer-facing portal for the US Army Cyber Protection Brigade, translating cyber training operations into something usable under pressure.',
    highlights: [],
  },
  {
    title: 'Front-End Developer', company: 'University of Rochester Medical Center', dates: 'Jun 2013 – Aug 2017', where: 'Rochester, NY · Healthcare',
    highlights: [
      'Led WCAG AA compliance across the full family of sites and applications.',
      'Developed a custom in-house responsive platform for rapid template deployment.',
      'Developed responsive template conversion within CMS.',
    ],
  },
  {
    title: 'Interactive Web Developer', company: 'CaterTrax', dates: 'Jun 2011 – May 2013', where: 'Rochester, NY · Foodservice SaaS',
    intro: 'Built marketing sites in an in-house CMS. Created the company’s first design system.',
    highlights: [],
  },
];

export const SIDE_PROJECTS = [
  {
    name: 'Groundbase', when: 'Founder · 2026 – Present', meta: 'Building & Construction · getgroundbase.com', slug: 'groundbase',
    text: 'Construction finance for owner-builders. Most people manage a six-figure home build in a spreadsheet and a group chat.',
    highlights: [
      'Made the foundational product call early: build for owners and contractors together rather than either alone. That meant a shared data model with role-aware views, so both sides work from the same project reality.',
      'Mapped both journeys end-to-end before designing screens, then built the design system before the product to avoid a pile of one-off decisions later.',
    ],
  },
  {
    name: 'RemoteTechRoles', when: 'Founder · 2026 – Present', meta: 'Job hunting · remotetechroles.com', slug: 'remote-tech-roles',
    text: 'Job hunting is not fun, especially when you’re checking on dozens of different sites. I built a tool that grabs them all and sweeps them daily, for free.',
    highlights: [
      'Designed, prompted, and shipped a 0 -> 1 tool for seekers of remote tech jobs. Always free.',
      'Users can track/manage their application journeys.',
      'Crawler fetches new jobs daily and notifies the user if they opted in.',
    ],
  },
];

/** The résumé's education dates read "Sept 2026 – May 2010" (a typo), so only the graduation year is shown. */
export const EDUCATION = 'BS, Computer Graphics and Digital Arts, Springfield College, 2010';
