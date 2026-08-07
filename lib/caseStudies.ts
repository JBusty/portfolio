import type { Project } from './data';

export interface CaseStudyCard {
  n: string;
  h: string;
  b: string;
}

export interface CaseStudyStep {
  n: string;
  h: string;
  body: string;
}

export interface CaseStudyStat {
  n: string;
  label: string;
}

export interface CaseStudyCaption {
  label: string;
  body: string;
}

export interface CaseStudyImages {
  logo?: string;
  problem?: string;
  wireframes?: string[];
  wireframeCaptions?: CaseStudyCaption[];
  solution?: string[];
  solutionCaptions?: CaseStudyCaption[];
}

export interface CaseStudy {
  images?: CaseStudyImages;
  summary: string;
  problemTitle: string[];
  problemBody: string[];
  decisionQuestion: string;
  decisionContext: string;
  decisionAnswerTitle: string;
  decisionAnswerBody: string;
  outcomes: {
    painPoints: string[];
    role: string[];
    shipped: string[];
  };
  solutionTitle: string[];
  solutionIntro?: string;
  solutionCards: CaseStudyCard[];
  /** Copy for the "Exploration" bookend that opens the process timeline. */
  explorationBody?: string;
  /** Copy for the "Shipped" bookend that closes the process timeline. */
  shippedBody?: string;
  processTitle: string[];
  processStats: CaseStudyStat[];
  processSteps: CaseStudyStep[];
  reflection: {
    wins: string[];
    challenges: string[];
  };
}

export const CASE_STUDIES: Partial<Record<string, CaseStudy>> = {
  'identity-profiles': {
    images: {
      logo: '/images/shared/red-canary-hero.png',
      problem: '/images/identity-profiles/problem-overview.png',
      wireframes: ['/images/identity-profiles/wireframe-1.svg'],
      wireframeCaptions: [
        { label: 'Early structure', body: 'The two-column behavioral split — consistent signals left, anomalies right — tested in grey boxes before any visual polish.' },
      ],
      solution: [
        '/images/identity-profiles/solution-1.png',
        '/images/identity-profiles/solution-2.png',
        '/images/identity-profiles/solution-3.png',
        '/images/identity-profiles/solution-4.png',
      ],
      solutionCaptions: [
        { label: 'The summary, up top', body: 'The AI wrap-up sits directly under the identity header. The date control beside it steps back to an earlier snapshot of the same identity.' },
        { label: 'Consistent vs. anomalous', body: 'Behavioral signals split two ways: what this identity always does on the left, what broke pattern on the right.' },
        { label: 'Evidence, one tab down', body: 'Logon insights by geolocation, VPN, browser, and IP. None of it was removed — it just stopped being the first thing you hit.' },
        { label: 'Loading states, specified', body: 'The skeleton loader, annotated for handoff. The page assembles in pieces, so the empty state needed designing too.' },
      ],
    },
    summary:
      "I led the redesign of Red Canary's Identity Profiles, introducing actionable insights powered by generative AI and a modernized user experience. The update strengthened customer retention and gave us a significant competitive edge in a previously stagnant area of UX.",
    problemTitle: ['Flat. Boring.', 'Behind the curve'],
    problemBody: [
      "The original Identity Profiles were a wall of raw activity. Customers found them unhelpful, and compared with competitors' identity tools, the experience felt behind in both utility and perception.",
      'The team also had strong in-house GenAI capabilities, but the real design problem was deciding how to use them without making analysts read a novel in the middle of an investigation.',
    ],
    decisionQuestion: 'How much GenAI content is too much?',
    decisionContext:
      "We had an in-house GenAI product with a lot of untapped potential. It could generate plenty of content, but that did not mean customers needed to read all of it.",
    decisionAnswerTitle: "Don't make people read (oh the irony).",
    decisionAnswerBody:
      'Use GenAI to create brief, high-value summaries only, while keeping the underlying evidence available when customers want to dig deeper.',
    outcomes: {
      painPoints: [
        'Customers said identity pages were unhelpful and were comparing them unfavorably to competitors.',
        'Important identity context was buried in long pages instead of surfaced as actionable insight.',
      ],
      role: [
        'Owned the full design process from research and ideation through prototyping and handoff.',
        'Pushed for forward-looking AI features without losing the core investigation workflow.',
      ],
      shipped: [
        'Delivered parity with competitors while introducing new AI-driven insights.',
        'Cut analyst time spent correlating threats by roughly 15%.',
        'Created a summary pattern that leadership and customers both responded well to.',
      ],
    },
    solutionTitle: ['Less reading.', 'More answers'],
    solutionIntro:
      'The redesign focused on surfacing actionable insights instead of making people parse raw data first.',
    solutionCards: [
      {
        n: '01',
        h: 'Benchmark the category',
        b: 'I reverse-engineered the identity flows from the teams we needed to beat, then separated the expected baseline from the places we could move the experience forward.',
      },
      {
        n: '02',
        h: 'Use AI where it helps',
        b: 'GenAI summarized and contextualized identity activity directly in the product, but only in short, high-value moments that accelerated decisions.',
      },
      {
        n: '03',
        h: 'Let analysts rewind',
        b: 'An identity looks different week to week, so the page keeps dated snapshots. Analysts can step back to how an account looked before the thing they are investigating happened.',
      },
    ],
    explorationBody:
      'Before touching visuals, I needed to know whether the two-column behavioral split would hold: consistent signals on one side, anomalies on the other.',
    shippedBody: 'What shipped after six iterations and a tiered rollout.',
    processTitle: ['Five months.', 'Six iterations'],
    processStats: [
      { n: '5 months', label: 'Design phase' },
      { n: '6', label: 'Major iterations' },
      { n: '~15%', label: 'Faster correlation' },
    ],
    processSteps: [
      {
        n: '01',
        h: 'Competitive benchmarking',
        body: 'I started by mapping the products customers were already comparing us to so we knew exactly where the floor was and where we still had room to differentiate.',
      },
      {
        n: '02',
        h: 'Designing and prototyping',
        body: 'Low-fidelity prototypes helped validate direction early, then high-fidelity work tightened the interaction model and the right amount of AI assistance.',
      },
      {
        n: '03',
        h: 'Customer-driven validation',
        body: 'Pilot feedback shaped the final IA and a tiered rollout let us capture usability issues before the broader launch.',
      },
    ],
    reflection: {
      wins: [
        'Having a wealth of usable data made the AI layer genuinely valuable instead of decorative.',
        'The identity wrap-up summaries landed well with both leadership and customers.',
        'Phased release planning helped the team get the MVP out sooner and learn continuously.',
      ],
      challenges: [
        'We iterated heavily on how much LLM content was useful versus distracting.',
        'Existing information still needed a home, which made the page hierarchy trickier than it looked.',
        'Customer expectations were already shaped by competitors, so the bar for usefulness was high from day one.',
      ],
    },
  },
  'security-data-lake': {
    images: {
      logo: '/images/shared/red-canary-hero.png',
      problem: '/images/security-data-lake/problem-overview.png',
      wireframes: ['/images/security-data-lake/wireframe-1.svg'],
      wireframeCaptions: [
        { label: 'Query tool skeleton', body: 'How much room a schema browser needs beside a SQL editor, settled in grey boxes before quota visibility and results were layered on.' },
      ],
      solution: [
        '/images/security-data-lake/solution-1.png',
        '/images/security-data-lake/solution-2.png',
        '/images/security-data-lake/solution-3.png',
        '/images/security-data-lake/solution-4.png',
      ],
      solutionCaptions: [
        { label: 'Usage at a glance', body: 'Licensed size, ingest broken out by integration, and retention windows in one view — with the export that compliance teams kept asking for.' },
        { label: 'The editor', body: 'Saved and active searches as tabs, the schema browser down the left, and the daily quota ring parked where you cannot miss it.' },
        { label: 'Know the table first', body: 'Selecting a table shows its integrations, row count, size, and columns before you write a line of SQL against it.' },
        { label: 'Saved searches', body: 'Recurring investigations keep their last run, owner, and cost, so the same question does not get rewritten from scratch every week.' },
      ],
    },
    summary:
      "We built the Security Data Lake (SDL), a new feature enabling customers to query their Red Canary data in real time. It solved compliance pain, elevated customer satisfaction, and gave users far more transparency and control over the data they were already sending into the platform.",
    problemTitle: ['Customers sent the data.', "They just couldn't use it"],
    problemBody: [
      'Customers had very little visibility into the huge volume of data flowing into Red Canary. Outside of detections, they had no simple way to inspect, query, or report on what was already theirs.',
      'That gap created compliance headaches for regulated customers and blocked deeper investigations for security teams that needed more than the default product views.',
    ],
    decisionQuestion: 'How do we handle search quotas?',
    decisionContext:
      'When customers can query data measured in terabytes, one careless search can burn through a usage limit quickly. We needed a control that informed without getting in the way.',
    decisionAnswerTitle: 'Make query cost visible.',
    decisionAnswerBody:
      'Show customers how much data a search will consume before they run it, instead of letting quota risk stay invisible until it is too late.',
    outcomes: {
      painPoints: [
        'Customer data was not retained in an accessible way for long enough.',
        'Customers could only see data when it was attached to a security threat, not on their own terms.',
      ],
      role: [
        'Led UX strategy and design in close partnership with product and engineering.',
        'Defined the workflows for monitoring, exporting, and querying data lake content.',
      ],
      shipped: [
        'Shipped SDL on time with especially strong praise from enterprise customers.',
        'Reduced compliance-driven churn risk.',
        'Won positive feedback and new contracts once the search experience launched.',
      ],
    },
    solutionTitle: ['Visibility first.', 'Query power second'],
    solutionIntro:
      'SDL was intentionally phased so the team could solve compliance and reporting pain early, then layer in deeper search capability without blocking the whole initiative.',
    solutionCards: [
      {
        n: '01',
        h: 'Usage dashboard first',
        b: 'The first release focused on a dashboard with at-a-glance usage, integration-level breakdowns, historical trends, and export support for compliance work.',
      },
      {
        n: '02',
        h: 'Familiar SQL workflow',
        b: 'For the query tool, I leaned on patterns customers already understood so the product felt powerful without forcing them to learn a bespoke interface.',
      },
      {
        n: '03',
        h: 'Make the data legible first',
        b: 'Every table exposes its integrations, size, and columns up front, so customers know what they are pointing a query at before they run it against terabytes.',
      },
    ],
    explorationBody:
      'The first question was structural: how much room does a schema browser need next to a SQL editor before either one stops being usable?',
    shippedBody: 'The phased release, dashboard first and query tool second.',
    processTitle: ['Two months of design.', 'Nine to GA'],
    processStats: [
      { n: '2 months', label: 'Design time' },
      { n: '14', label: 'Early access customers' },
      { n: '8', label: 'Major iterations' },
    ],
    processSteps: [
      {
        n: '01',
        h: 'Identify the real customer need',
        body: 'Support tickets and recurring feedback made it obvious that customers needed direct control over their own data, not just another preset dashboard.',
      },
      {
        n: '02',
        h: 'Define the MVP phases',
        body: 'We prioritized a high-impact snapshot dashboard first, then followed with the SQL query tool for deeper investigation and more technical workflows.',
      },
      {
        n: '03',
        h: 'Design and test quickly',
        body: 'I worked closely with engineering to validate feasibility and tested prototypes with early adopters so we could refine usability before wider release.',
      },
    ],
    reflection: {
      wins: [
        'The team managed a changing scope well enough to still ship on time.',
        'Data Lake Search received immediate positive feedback and helped win additional business.',
        'Leaning on familiar query-tool patterns made the advanced workflow easier to adopt.',
      ],
      challenges: [
        'The search experience required a lot of net-new design patterns in a short window.',
        'Quota management had to be obvious without making the tool feel intimidating.',
        'Chart choices mattered more than expected because the wrong visual could communicate the wrong message fast.',
      ],
    },
  },
  'unified-onboarding': {
    images: {
      logo: '/images/shared/red-canary-hero.png',
      problem: '/images/unified-onboarding/problem-overview.png',
      wireframes: ['/images/unified-onboarding/wireframe-1.svg'],
      wireframeCaptions: [
        { label: 'The accordion shell', body: 'The numbered step structure, and the rule that only one stays open, tested before any integration-specific content went near it.' },
      ],
      solution: [
        '/images/unified-onboarding/solution-1.png',
        '/images/unified-onboarding/solution-2.png',
        '/images/unified-onboarding/solution-3.png',
      ],
      solutionCaptions: [
        { label: 'A step for provisioning', body: 'Provisioning used to happen silently on save, which left people unsure whether anything had worked. It became its own step with its own button.' },
        { label: 'Say when it worked', body: 'A confirmation on successful provisioning, with the following steps only appearing once there is something real to act on.' },
        { label: 'Save that actually validates', body: 'Save now checks every field first. It used to let people walk away leaving an integration in a non-functioning state.' },
      ],
    },
    summary:
      'Red Canary has over 100 integrations, each with its own onboarding flow. I replaced the pile of one-offs with a single adaptable pattern that survives contact with every vendor while cutting the design and engineering cost of every integration that comes after.',
    problemTitle: ['100 integrations.', '100 different onboarding flows'],
    problemBody: [
      "Every time a new integration was added, onboarding was designed from scratch. The result was a product that felt inconsistent and an engineering process that couldn't scale.",
      'The technical debt was obvious, but the bigger problem was that customers experienced meaningfully different flows depending on which integration they were setting up, and none of them were as good as they should have been.',
    ],
    decisionQuestion: 'Do we fix one flow at a time, or do we design a system?',
    decisionContext:
      'The safer play was incremental: fix the worst offenders and move on. The riskier play was building a unified pattern that would require more upfront investment but pay off across every integration after.',
    decisionAnswerTitle: 'Build the pattern once.',
    decisionAnswerBody:
      "Design a shared onboarding shell flexible enough to absorb every vendor's edge cases, so the next integration ships faster than the last one, and the one after that faster still.",
    outcomes: {
      painPoints: [
        'Each integration had a bespoke onboarding flow, creating inconsistency for customers and toil for engineering.',
        'New integrations required designing and building onboarding from scratch every time.',
      ],
      role: [
        'Defined the unified onboarding pattern and information architecture.',
        'Collaborated across product, engineering, and integration owners to pressure-test the system against real edge cases.',
      ],
      shipped: [
        'One shared onboarding pattern that works across 100+ integrations.',
        'Reduced engineering overhead per new integration.',
        'A more consistent, professional experience for customers setting up any integration.',
      ],
    },
    solutionTitle: ['One pattern.', '100+ integrations covered'],
    solutionIntro:
      'The pattern is three numbered stages and a set of rules about what may vary inside them. Everything below describes the shape every integration now inherits.',
    solutionCards: [
      {
        n: '01',
        h: 'One numbered spine',
        b: 'Every integration moves through the same three stages — choose how data arrives, configure it, then customize how it is handled — with only one stage open at a time.',
      },
      {
        n: '02',
        h: 'Vendor detail, contained',
        b: 'Anything specific to a vendor lives inside a labelled sub-step rather than reshaping the flow around it. The spine stays recognisable no matter whose product is on the other end.',
      },
      {
        n: '03',
        h: 'Nothing saves half-broken',
        b: 'Provisioning and validation became explicit states in the pattern, so an integration can no longer look finished while silently doing nothing.',
      },
    ],
    explorationBody:
      'The wireframes existed to test one idea: could a numbered step structure with a single expanded step absorb every vendor\'s quirks?',
    shippedBody: 'The pattern, after surviving the ugliest integrations we had.',
    processTitle: ['Two months.', 'One pattern'],
    processStats: [
      { n: '2 months', label: 'Design phase' },
      { n: '1', label: 'Designer' },
      { n: '23', label: 'Unique stakeholders' },
    ],
    processSteps: [
      {
        n: '01',
        h: 'Map the existing landscape',
        body: 'I catalogued the full range of integration onboarding flows to find what was truly shared versus what was genuinely integration-specific.',
      },
      {
        n: '02',
        h: 'Define the shared structure',
        body: 'The common steps became the pattern. The edge cases got explicit slots in the system so they would stop becoming one-offs.',
      },
      {
        n: '03',
        h: 'Prove it on the worst offenders',
        body: 'The messiest integrations were the test. If the pattern worked for those, it would work for everything else.',
      },
    ],
    reflection: {
      wins: [
        'Once the pattern was established, new integrations shipped significantly faster.',
        'Engineering bought in quickly once they saw the reduction in design back-and-forth.',
        'The system created a higher quality floor across every integration, not just the ones we redesigned.',
      ],
      challenges: [
        'Getting stakeholders across 100+ integrations aligned on a single direction required sustained effort.',
        'Some vendor constraints genuinely broke the pattern and required thoughtful exceptions rather than workarounds.',
        'The audit phase surfaced more edge cases than expected, which pushed the timeline.',
      ],
    },
  },
  'status-checks': {
    images: {
      logo: '/images/shared/red-canary-hero.png',
      wireframes: ['/images/status-checks/wireframe-1.svg'],
      wireframeCaptions: [
        { label: 'Badge placement in context', body: 'Where a health badge could sit in the integrations list, and how much a failing-checks tooltip has to say to be worth stopping for.' },
      ],
      solution: [
        '/images/status-checks/carousel-1.png',
        '/images/status-checks/carousel-2.png',
      ],
      solutionCaptions: [
        { label: 'A sub-status for "active but broken"', body: 'An integration can be active and still failing its checks. The list now says so, and the tooltip explains what it means for ingest.' },
        { label: 'Failures sorted to the top', body: 'A banner on the config page whenever issues exist, and a Status Checks tab listing each check with its result and how long it has been that way.' },
      ],
    },
    summary:
      "I designed a proactive notification system for failing integrations so customers could see problems in real time instead of discovering them during an incident. The solution reduced support load, improved troubleshooting, and strengthened trust in the platform's reliability.",
    problemTitle: ['Failures were happening.', 'Customers were blind'],
    problemBody: [
      "Failing integrations and expired certificates were creating real security posture risk, but customers were not being told clearly when an integration had stopped working.",
      'That gap drove support requests, slowed troubleshooting, and made the platform feel less trustworthy right when customers needed it most.',
    ],
    decisionQuestion: 'To toast or not to toast?',
    decisionContext:
      'A small notification would have been cheap to build, but the real question was whether a toast was enough for something this important.',
    decisionAnswerTitle: 'Expose the actual failing checks.',
    decisionAnswerBody:
      'Put integration health directly in context so customers can see what is broken, why it matters, and what action they should take next.',
    outcomes: {
      painPoints: [
        "Customers did not know why an integration suddenly failed to send data.",
        'Failing integrations created a major security risk while customers remained unaware of the health problem.',
      ],
      role: [
        'Advocated for a proactive solution instead of waiting for support to absorb the damage.',
        'Designed the notification and status UX so the messaging was clear, actionable, and hard to miss.',
      ],
      shipped: [
        'Increased transparency and reduced support tickets.',
        "Strengthened customer trust in Red Canary's reliability.",
        'Established a pattern for proactive alerting elsewhere in the product.',
      ],
    },
    solutionTitle: ['Health that is', 'hard to miss'],
    solutionIntro:
      'This was less about inventing a brand-new pattern and more about assembling the right existing pieces into a system customers could actually trust.',
    solutionCards: [
      {
        n: '01',
        h: 'Flag health in the list view',
        b: 'A new status badge on the integrations list page made it immediately obvious which integrations needed attention.',
      },
      {
        n: '02',
        h: 'Show failing checks in context',
        b: 'The integration detail page gained a dedicated status-checks area so customers could inspect the exact failing checks instead of guessing.',
      },
      {
        n: '03',
        h: 'Always include an action',
        b: 'Contextual help and plain-language messaging gave users a clear next step instead of just telling them something was broken.',
      },
    ],
    explorationBody:
      'Two weeks of runway meant the wireframes had one job — find where a health badge could live in the integrations list without adding noise.',
    shippedBody: 'Two weeks of work, live in the product.',
    processTitle: ['Two weeks.', 'A small team'],
    processStats: [
      { n: '100+', label: 'Integrations monitored' },
      { n: '2 weeks', label: 'Total project time' },
      { n: '2', label: 'Surfaces touched' },
    ],
    processSteps: [
      {
        n: '01',
        h: 'Call out the gap',
        body: 'The project started with a simple observation: a serious product health issue was going mostly unaddressed, even though the fix was within reach.',
      },
      {
        n: '02',
        h: 'Reuse a new surface',
        body: 'We had just introduced a new section on integration pages, so I used that momentum to extend it with a status-checks tab instead of inventing a new destination.',
      },
      {
        n: '03',
        h: 'Pair signal with guidance',
        body: 'The list badge and the detail-page checks worked together so users could spot a problem fast and then understand what needed to happen next.',
      },
    ],
    reflection: {
      wins: [
        'Buy-in was easy because the gap was obvious and the effort was relatively low.',
        'Design review moved smoothly once the failure states were made concrete.',
        'The work created a reusable pattern for proactive alerting in the platform.',
      ],
      challenges: [
        'The alert had to be visible without making users panic.',
        'The status-checks area was already important but overlooked, so the design had to pull attention there intentionally.',
        'A low-cost fix still needed enough depth to solve the trust problem, not just decorate it.',
      ],
    },
  },
  'commuter-benefits': {
    images: {
      logo: '/images/shared/edenred-hero.png',
      problem: '/images/commuter-benefits/problem-overview.png',
      wireframes: ['/images/commuter-benefits/wireframe-1.svg'],
      wireframeCaptions: [
        { label: 'Participant detail skeleton', body: 'Tab layout, benefit balance chips, and the right-hand card panel were pinned down before the visual system existed to dress them in.' },
      ],
      solution: [
        '/images/commuter-benefits/carousel-2.png',
        '/images/commuter-benefits/carousel-3.png',
        '/images/commuter-benefits/carousel-4.png',
        '/images/commuter-benefits/solution-final.png',
      ],
      solutionCaptions: [
        { label: 'One participant, one page', body: 'Elections, subsidies, balances, card status, and spend gathered into a single participant view instead of four separate lookups.' },
        { label: 'Election history', body: 'Every election with its product, status, and total in one filterable table — the record admins were previously reconstructing by hand.' },
        { label: 'The admin landing', body: 'Program-level numbers up top, the participant roster underneath, and enrolment handled without leaving the page.' },
        { label: 'Spend, explained', body: 'Category and trend charts sit above the raw purchase history, so "where is the money going" gets answered without an export.' },
      ],
    },
    summary:
      'I led the consolidation of multiple fragmented commuter products into a single cohesive platform backed by a new design system. The overhaul simplified workflows, reduced admin overhead, increased interest during demos, and helped the business win the Google contract.',
    problemTitle: ['Too many products.', 'Not enough platform'],
    problemBody: [
      "Edenred's commuter benefits offering was a patchwork of standalone applications with inconsistent workflows, mismatched design patterns, and technical constraints that kept compounding.",
      'That fragmentation hurt customers, slowed engineering, introduced QA issues, and made it harder to tell a polished enterprise story to prospects.',
    ],
    decisionQuestion: 'Do we keep separate apps, or unify them into one platform?',
    decisionContext:
      'Incremental cleanup would have been safer for engineering in the short term, but it would not address the structural issues holding the whole product line back.',
    decisionAnswerTitle: 'Consolidate and conquer.',
    decisionAnswerBody:
      'A shared platform shell and design system could solve the systemic problems faster than polishing each app one by one.',
    outcomes: {
      painPoints: [
        'Multiple products had no cohesion.',
        'Disjointed engineering efforts slowed new feature delivery and created inconsistency.',
        'The product line was losing competitiveness and business opportunities.',
      ],
      role: [
        'Implemented a new information architecture spanning the commuter product suite.',
        'Built a design system to support a unified experience across products.',
        'Drove collaboration across many stakeholders and teams.',
      ],
      shipped: [
        'Simplified workflows and cut setup and management overhead.',
        'Improved demos and contributed directly to winning the Google contract.',
        'Created a scalable platform foundation the team could keep building on.',
      ],
    },
    solutionTitle: ['One platform.', 'Less duct tape'],
    solutionIntro:
      'Three products had to end up feeling like one. The work split into a frame that could hold them, the flows that ran through it, and the order they went live in.',
    solutionCards: [
      {
        n: '01',
        h: 'One shell for three products',
        b: 'The first move was a platform frame that could house every commuter application under one coherent experience instead of a set of disconnected tools.',
      },
      {
        n: '02',
        h: 'Rework the workflows',
        b: 'I mapped and rewired the end-to-end flows so individual tasks felt like one product journey rather than a handoff across apps.',
      },
      {
        n: '03',
        h: 'Roll out in tiers',
        b: 'The customer-facing portal launched first, then the administrative side followed, which reduced risk and let production usage validate the approach.',
      },
    ],
    explorationBody:
      'Three legacy products had to fit inside one shell. The wireframes were about finding the shared skeleton before arguing about pixels.',
    shippedBody: 'The consolidated platform, rolled out customer-side first.',
    processTitle: ['Discovery first.', 'Then consolidation'],
    processStats: [
      { n: '2 months', label: 'Discovery phase' },
      { n: '3', label: 'Legacy products merged' },
      { n: '12', label: 'On the core team' },
    ],
    processSteps: [
      {
        n: '01',
        h: 'Audit everything',
        body: 'I cataloged every commuter product and mapped the end-to-end journeys so the team could see inconsistencies, overlaps, and edge cases in one place.',
      },
      {
        n: '02',
        h: 'Build the system around the flows',
        body: 'The design system and information architecture were developed in service of the workflows, not the other way around, so the new platform stayed grounded in real tasks.',
      },
      {
        n: '03',
        h: 'Validate and roll out',
        body: 'Low-fidelity validation with stakeholders and customers surfaced issues early, then the phased rollout helped the team prove the new platform in production.',
      },
    ],
    reflection: {
      wins: [
        'Once engineering bought into the design system, UI production accelerated noticeably.',
        'Early prototypes generated a lot of customer interest and stronger demo energy.',
        'Customers were eager for the updates, which made the iteration cycle productive.',
      ],
      challenges: [
        'Winning engineering over to a shared system took longer than the design work itself did.',
        'The flow edge cases were everywhere and easy to miss without deep auditing.',
        'The team occasionally lost sight of the core workflows and had to re-center on what mattered most.',
      ],
    },
  },
  'fleet-card': {
    images: {
      logo: '/images/shared/edenred-hero.png',
      problem: '/images/fleet-card/problem-overview.png',
      wireframes: ['/images/fleet-card/wireframe-1.svg'],
      wireframeCaptions: [
        { label: 'Cards list with status states', body: 'Every card state — active, frozen, pending, fraud — laid out at once, to check the table could carry all of them without turning into noise.' },
      ],
      solution: [
        '/images/fleet-card/solution-1.png',
        '/images/fleet-card/solution-2.png',
        '/images/fleet-card/solution-3.png',
        '/images/fleet-card/solution-4.png',
      ],
      solutionCaptions: [
        { label: 'Every transaction, with context', body: 'Merchant, fuel product, gallons, PIN, odometer, and exception flags on a single row — what a fleet manager needs to spot a bad purchase without opening it.' },
        { label: 'Card states, all of them', body: 'Active, frozen, canceled, pending, lost, stolen, fraud. The status column had to carry the entire lifecycle and stay scannable.' },
        { label: 'Real-time spend controls', body: 'Limits per card by transaction, day, week, and month, each showing what has already been spent against it. This was the product.' },
        { label: 'Exceptions, ranked', body: 'Which policy breaches happen most often, over what range, and on which cards — turning a pile of declines into something a manager can act on.' },
      ],
    },
    summary:
      "I designed and launched Edenred USA's first Fleet Card platform, taking it from concept to live in under a year. Built with VISA, it enabled real-time spending controls, opened a new market for the company, and converted more than 200 businesses.",
    problemTitle: ['New market.', 'Very short runway'],
    problemBody: [
      'Edenred wanted to enter a fleet card market already dominated by a few strong incumbents. To do it well, the team needed an entirely new platform, a workable MVP, and support for a strategic VISA partnership.',
      'The deadline was aggressive enough that every choice about scope and architecture had long-term consequences.',
    ],
    decisionQuestion: 'Where do we draw the line for what MVP means?',
    decisionContext:
      'Ambition was not the problem. The hard part was deciding what had to exist for launch versus what could come after customers were already spending in the product.',
    decisionAnswerTitle: 'Get customers spending fast.',
    decisionAnswerBody:
      'MVP meant getting cards into customers hands with real-time controls in place, then building outward from that foundation instead of waiting for a perfect first release.',
    outcomes: {
      painPoints: [
        'There were many strong product ideas but no clear place to start.',
        'The company needed to launch a brand-new product line on an aggressive timeline.',
      ],
      role: [
        'Led the design of a new platform from 0→1.',
        'Built a scalable design system from scratch and aligned with engineering on implementation.',
      ],
      shipped: [
        "Launched Edenred's first Fleet Card platform in the U.S.",
        'Helped secure the VISA partnership.',
        'Created a solid foundation for future products in the category.',
      ],
    },
    solutionTitle: ['System first.', 'Product second'],
    solutionIntro:
      'With a fixed launch date and a partner watching, the only way to move fast later was to spend the first weeks on things that would not need redoing.',
    solutionCards: [
      {
        n: '01',
        h: 'Build the design system early',
        b: 'I defined the visual system and component direction before the screen work ramped up so customer and admin experiences would stay aligned.',
      },
      {
        n: '02',
        h: 'Create a flexible shell',
        b: 'The platform architecture needed to support current workflows and future expansion, so the shell was designed to hold more than just the MVP.',
      },
      {
        n: '03',
        h: 'Work in short cycles',
        b: 'Features were scoped into roughly two-week chunks and validated continuously with internal stakeholders and VISA to reduce risk as the deadline approached.',
      },
    ],
    explorationBody:
      'Card status was the whole product, so the wireframes started there: Active, Frozen, Pending, Fraud, all legible in one table.',
    shippedBody: 'Under a year from index card to live product.',
    processTitle: ['Concept to launch.', 'Under a year'],
    processStats: [
      { n: '<1 year', label: 'From concept to launch' },
      { n: '200+', label: 'Businesses converted' },
      { n: '~2 weeks', label: 'Average time per feature' },
    ],
    processSteps: [
      {
        n: '01',
        h: 'Define the architecture',
        body: 'I started by shaping the platform shell and the information architecture so the rest of the work had a scalable place to land.',
      },
      {
        n: '02',
        h: 'Design for customers and admins',
        body: 'The customer side needed real-time spending controls, but the admin side had to be just as scalable and intuitive for the product to hold up in practice.',
      },
      {
        n: '03',
        h: 'Stay close to implementation',
        body: 'Strong engineering alignment and ongoing design oversight were essential because front-end decisions had a huge effect on whether the product stayed coherent.',
      },
    ],
    reflection: {
      wins: [
        'The team moved fast and still shipped on time.',
        'The project set a new internal standard for how a new product could be built and launched.',
        'Starting with a code-aware design system reduced rework later on.',
      ],
      challenges: [
        'Some post-MVP features turned out to matter more to customers than expected.',
        'Engineering handoffs were painful because front-end expertise was uneven.',
        'MVP discipline had to be defended constantly against understandable ambition.',
      ],
    },
  },
  jobwatch: {
    images: {
      problem: '/images/jobwatch/problem-overview.png',
      wireframes: ['/images/jobwatch/wireframe-1.svg'],
      wireframeCaptions: [
        { label: 'Triage, not browsing', body: 'The bet the layout had to prove: judge a posting and act on it without leaving the row, read it without leaving the frame, and keep the controls pinned while the rest scrolls away.' },
      ],
      solution: [
        '/images/jobwatch/solution-1.png',
        '/images/jobwatch/solution-2.png',
        '/images/jobwatch/solution-3.png',
        '/images/jobwatch/solution-4.png',
        '/images/jobwatch/solution-5.png',
      ],
      solutionCaptions: [
        { label: 'The working view', body: 'List on the left, posting on the right, filters pinned above both. Every row says why it surfaced — seniority and pay — so a posting can be ruled out without opening it.' },
        { label: 'Dismissals, turned into a proposal', body: 'Three answers that agree become a specific change with the evidence attached: exclude a word, drop a seniority, raise the pay floor. Nothing applies itself.' },
        { label: 'Ask after, not before', body: 'The posting is gone the moment the button is pressed; this only decides whether the removal teaches anything. A question standing between you and a list you are clearing gets answered at random.' },
        { label: 'A room, not a filter', body: 'The dismissed pile ignores every preference except the search box — tighten a filter and the posting you wanted back would vanish from the only view that could return it.' },
        { label: 'Where the postings come from', body: '1,166 companies in the current index, discovered rather than typed. The watchlist stopped being a list of companies I could think of.' },
      ],
    },
    summary:
      'Job boards search their own index, not the internet, and the hiring platforms underneath them have no cross-company search at all. Jobwatch sweeps roughly 15,900 company career pages across seven ATS platforms on a schedule and hands back one list — currently 2,626 postings from 1,166 companies — with the triage tools to get through it. I designed it and wrote every line of it.',
    problemTitle: ['15,900 boards.', 'No way to search across them'],
    problemBody: [
      'Every applicant tracking system publishes a public feed per company, and none of them publish an index across companies. There is no "every job on Greenhouse" endpoint. That makes a watchlist structurally required, and a hand-typed watchlist caps your search at the companies you happened to think of.',
      'I found that out the expensive way: a role I would have applied for was live for weeks and invisible to me, because the company was not on a list I had written by hand. Aggregators have the same shape of problem one level up — you are searching their coverage, not the market.',
    ],
    decisionQuestion: 'Should the tool change my search for me?',
    decisionContext:
      'Every time I marked a posting not relevant I was handing over a usable signal, and four of the reasons name a filter that already exists. The tool had enough evidence to start tuning itself. The question was whether it should.',
    decisionAnswerTitle: 'Propose it. Never apply it.',
    decisionAnswerBody:
      'A pattern in what you rejected is not the same as an intention. So a suggestion names the exact setting it would move, shows the postings it was read off, and waits to be pressed — and it stays quiet until at least three dismissals agree, because narrowing a job search wrongly costs you roles you never find out about.',
    outcomes: {
      painPoints: [
        'ATS platforms publish a feed per company and no index across them, so there is nothing to search.',
        'A hand-built watchlist silently caps coverage at the companies you already know to name.',
        'Everything a job aggregator shows you is filtered by its coverage before you ever see it.',
      ],
      role: [
        'Sole designer and engineer: product thinking, interaction design, and all of the code.',
        'Designed the triage loop — what a dismissal is worth, and what the tool is allowed to do with it.',
        'Built the discovery, sweep, and index pipeline on Next.js, Vercel Cron, Blob, and Neon Postgres.',
      ],
      shipped: [
        'One searchable list across seven ATS platforms, refreshed on a three-day lap.',
        'Board discovery that finds companies I would never have thought to add.',
        'A feedback loop that turns "not relevant" into a specific, reversible change to the search.',
      ],
    },
    solutionTitle: ['Sweep the boards.', 'Then make triage cheap'],
    solutionIntro:
      'Two halves that only work together: a pipeline that assembles the list nobody publishes, and an interface built for getting through it rather than browsing it.',
    solutionCards: [
      {
        n: '01',
        h: 'Discover boards, don\'t type them',
        b: 'Board tokens are derived from a crawl-backed dataset and a crawler of my own rather than a list I maintain. Nothing is ever removed automatically — a bad crawl must not be able to delete what a good one found.',
      },
      {
        n: '02',
        h: 'Filter before the network',
        b: 'The sweep runs server-side and applies the title test where the data already is, turning ~13,000 postings a shard into a few hundred. The browser makes one request for the result instead of fifteen thousand for the raw material.',
      },
      {
        n: '03',
        h: 'Make a dismissal worth something',
        b: 'Removing a posting is useful on its own. The reason is the other half: enough of them agreeing is a filter that is wrong, and the panel where filters live is where the evidence and the fix sit next to each other.',
      },
    ],
    explorationBody:
      'The layout had one question to answer before anything else: can you judge a posting, act on it, and read it without ever leaving the frame you are scanning in?',
    shippedBody: 'The tool as it runs today, against a live index.',
    processTitle: ['Three days to a list.', 'The rest on the loop'],
    processStats: [
      { n: '7', label: 'ATS platforms' },
      { n: '~15,900', label: 'Boards swept' },
      { n: '2,626', label: 'Postings indexed' },
    ],
    processSteps: [
      {
        n: '01',
        h: 'Try it in the browser, and fail',
        body: 'The first version fetched every board from the page. It worked at a dozen companies and fell apart at a hundred — tens of megabytes to render a few hundred rows. That failure is what defined the real architecture.',
      },
      {
        n: '02',
        h: 'Move the work to a schedule',
        body: 'A full pass does not fit in one serverless invocation, so the sweep is sharded across cron runs and each shard writes only its own file. Reading, merging, and rewriting one index looks fine and silently loses postings to CDN staleness.',
      },
      {
        n: '03',
        h: 'Design the triage loop',
        body: 'Dismiss first, ask second. The dismissed pile became its own room rather than a filtered view, because a posting you want back has to still be findable after you tighten something.',
      },
      {
        n: '04',
        h: 'Make the numbers describe the list',
        body: 'Every figure in the header was counted off the raw index while the list below showed a filtered subset. Two numbers that can never be reconciled by looking is worse than no numbers, so they all moved onto the list you actually get.',
      },
    ],
    reflection: {
      wins: [
        'Keeping filtering and feedback as pure functions meant the part that decides what you see could be reasoned about without a browser in the way.',
        'Per-shard files removed a data-loss race outright instead of trying to order around it.',
        '"Propose, never apply" held up every time I was tempted to let the tool be cleverer.',
        'Being the only user meant the tool got corrected the week it was wrong — the mismatched header counts were caught by using it, not by reviewing it.',
      ],
      challenges: [
        'The suggestion thresholds took real tuning — two agreeing dismissals is a coincidence, and shipping it as a finding was embarrassing.',
        'Blob\'s CDN cannot be made to serve a fresh read, which I only established by measuring it; the fix was a rule about never re-reading your own write.',
        'What "new" means needed three passes before the badge and the count agreed with each other.',
        'A per-company industry filter had to be deleted once discovery scaled — nothing publishes a sector, so almost every row read "other".',
      ],
    },
  },
  groundbase: {
    images: {
      problem: '/images/groundbase/problem-overview.png',
      wireframes: ['/images/groundbase/wireframe-1.svg'],
      wireframeCaptions: [
        { label: 'Build timeline structure', body: 'The dark sidebar, chronological milestone feed, and right-hand budget summary all existed on paper before a single component was coded.' },
      ],
      solution: [
        '/images/groundbase/solution-1.png',
        '/images/groundbase/solution-2.png',
        '/images/groundbase/solution-3.png',
      ],
      solutionCaptions: [
        { label: 'Draws against the budget', body: 'Each draw splits what you fund from what the bank funds, tracked against the total. The panel beside it says whether the build is still on plan.' },
        { label: 'The build timeline', body: 'Milestones, contractor events, and draw approvals in one chronology, so nothing falls through the gap between trades.' },
        { label: 'Where you actually stand', body: 'Project health, budget pressure, draw interest, and DTI together — the numbers you want before approving the next draw, not after.' },
      ],
    },
    summary:
      'I built Groundbase to solve a problem I kept running into: there are no good tools for managing the financial side of a home build. I designed the product from scratch and wrote all of the code for a platform that helps owner-builders and contractors manage budgets, milestones, and draw requests in one place.',
    problemTitle: ['Home building is still', 'spreadsheet software'],
    problemBody: [
      'Building a home is one of the most financially complex things most people ever do, but the tools around construction loans, draw schedules, contingency budgets, and contractor coordination are still shockingly bad.',
      "Most people manage six-figure decisions in a spreadsheet and a group chat. Contractors are not much better off either; they are often chasing approvals over text with no shared source of truth.",
    ],
    decisionQuestion: 'Do we build for owners, contractors, or both from day one?',
    decisionContext:
      'Building for either audience alone would already be hard. Building for both changes the entire data model, which made this the foundational product decision.',
    decisionAnswerTitle: 'Build one app for both roles.',
    decisionAnswerBody:
      'Use a shared data model with a role toggle so owners and contractors work from the same project reality while still getting the workflows each group needs.',
    outcomes: {
      painPoints: [
        'There are no purpose-built financial tools for construction loan management.',
        'Owner-builders make huge decisions with very little real budget visibility.',
        'Owners and contractors often work from different versions of reality across texts and email threads.',
      ],
      role: [
        'Owned all of it: brand strategy, product thinking, UX design, and every line of code.',
        'Built the design system from scratch, designed every screen, and shipped the whole thing solo.',
        'Used React 19, Vite, Tailwind CSS v4, Supabase, and React Router v7.',
      ],
      shipped: [
        'Created a role-aware product for both owner-builders and contractors.',
        'Early users said they finally felt in control of their construction budget.',
        'The draw approval flow cut down back-and-forth significantly.',
      ],
    },
    solutionTitle: ['One product.', 'Two role-aware views'],
    solutionIntro:
      'The product is intentionally serious in tone because it supports real financial decisions, not casual task tracking.',
    solutionCards: [
      {
        n: '01',
        h: 'Shared model, different views',
        b: 'Owner-builders get financial planning and milestone tracking. Contractors get bid management and project status. Both sides stay anchored to the same project data.',
      },
      {
        n: '02',
        h: 'Tokens I had to live with',
        b: 'I was also the engineer, so color, type, spacing, and interaction rules got written as code I would have to maintain. That kept the system honest and small.',
      },
      {
        n: '03',
        h: 'Serious UX for serious money',
        b: 'A dark palette, terracotta accents, bottom navigation on mobile, and a sidebar on desktop help the app feel like a real work tool instead of a novelty app.',
      },
    ],
    explorationBody:
      'I sketched the timeline and budget panel first, because if those two didn\'t work together the rest of the app wouldn\'t matter.',
    shippedBody: 'What is live today, with a real build running through it.',
    processTitle: ['Solo 0→1.', 'Built in the open'],
    processStats: [
      { n: '1', label: 'Person team' },
      { n: '2', label: 'User types served' },
      { n: '3', label: 'Data model rewrites' },
    ],
    processSteps: [
      {
        n: '01',
        h: 'Map both journeys first',
        body: 'Before designing screens, I mapped the owner-builder and contractor journeys end-to-end so the overlap and divergence points were explicit.',
      },
      {
        n: '02',
        h: 'Write the primitives first',
        body: 'As a team of one, the primitives were the only leverage I had. Getting them right up front was what made every screen after cheap to build.',
      },
      {
        n: '03',
        h: 'Build the hardest thing first',
        body: 'Draw management was the most complex feature, so I attacked it early rather than discovering late that the rest of the architecture needed to change.',
      },
      {
        n: '04',
        h: 'Ship and keep developing',
        body: 'The app is deployed, in active development, and already generating feedback from real users managing real construction decisions.',
      },
    ],
    reflection: {
      wins: [
        'Designing and implementing the primitives myself meant no translation loss between intent and build.',
        'The role-toggle architecture created a natural network effect between owners and contractors.',
        'The mobile bottom nav and desktop sidebar pattern tested well without explanation.',
      ],
      challenges: [
        'The draw-management schema took three rewrites before it felt right.',
        'Scope expanded quickly because financial planning, milestone tracking, and contractor workflows all pull on each other.',
        'Supabase auth and React Router took longer than expected to get right.',
      ],
    },
  },
};

export function getCaseStudy(project: Project): CaseStudy {
  return CASE_STUDIES[project.slug] ?? createDraftCaseStudy(project);
}

function createDraftCaseStudy(project: Project): CaseStudy {
  return {
    summary: `${project.title} is still in progress as a full write-up, but the core story is already clear: ${project.blurb}`,
    problemTitle: ['A system with too', 'many exceptions'],
    problemBody: [
      project.blurb,
      `This work focused on turning a messy, high-variance workflow into something ${project.tags.join(', ').toLowerCase()} teams could actually scale and support.`,
    ],
    decisionQuestion: 'How do we create one pattern that can survive real-world complexity?',
    decisionContext:
      'The challenge was not designing the happy path. It was finding a framework that still held up once every vendor, edge case, and internal constraint showed up.',
    decisionAnswerTitle: 'Design the reusable core first.',
    decisionAnswerBody:
      'Start with the common structure, leave space for the exceptions, and avoid solving the same onboarding problem over and over again.',
    outcomes: {
      painPoints: [
        'Too many inconsistent states and too many one-off onboarding paths.',
        'Scaling the work required a pattern, not another bespoke flow.',
      ],
      role: [
        `Worked as ${project.role}.`,
        `Partnered with a team of ${project.team}.`,
      ],
      shipped: [
        `${project.metric}.`,
        `Shipped in ${project.quarter}.`,
        `Created a stronger foundation for future ${project.company} work.`,
      ],
    },
    solutionTitle: ['Reusable structure.', 'Flexible details'],
    solutionCards: [
      {
        n: '01',
        h: 'Define the shared shell',
        b: 'The reusable skeleton comes first so every new case is not starting from zero.',
      },
      {
        n: '02',
        h: 'Make room for exceptions',
        b: 'The pattern needs to absorb vendor-specific differences without collapsing back into custom one-offs.',
      },
      {
        n: '03',
        h: 'Ship the pattern, not just the page',
        b: 'The real outcome is a repeatable approach the team can keep using after the first release.',
      },
    ],
    processTitle: ['Pattern making.', 'Under pressure'],
    processStats: [
      { n: project.year, label: 'Project year' },
      { n: project.quarter, label: 'Shipped' },
      { n: project.metric, label: 'Headline result' },
    ],
    processSteps: [
      {
        n: '01',
        h: 'Map the common path',
        body: 'Start by identifying the pieces every workflow shares before trying to solve the edge cases.',
      },
      {
        n: '02',
        h: 'Test the exceptions',
        body: 'Pressure-test the design against the ugliest flows early so the pattern is honest about what it can support.',
      },
      {
        n: '03',
        h: 'Hand off a system',
        body: 'The value comes from making the next implementation cheaper and clearer than the last one.',
      },
    ],
    reflection: {
      wins: [
        'The structure created more consistency than the previous bespoke approach.',
        'Shared patterns made collaboration with engineering smoother.',
        'The work laid the foundation for broader reuse.',
      ],
      challenges: [
        'Real-world edge cases always show up faster than expected.',
        'Reusable patterns have to balance flexibility with clarity.',
        'The final polish is less important than making the system hold up in production.',
      ],
    },
  };
}
