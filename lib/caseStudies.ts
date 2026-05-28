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

export interface CaseStudy {
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
    decisionAnswerTitle: "Don't make people read.",
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
        h: 'Keep the evidence visible',
        b: 'The old information still had to be available somewhere, so the page balanced quick insight up top with deeper supporting detail below.',
      },
    ],
    processTitle: ['Five months.', 'Six iterations'],
    processStats: [
      { n: '5 months', label: 'Design phase' },
      { n: '6', label: 'Major iterations' },
      { n: '1', label: 'Designer' },
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
        h: 'Warn on big queries',
        b: 'Searches exposed their expected cost before execution so customers could avoid blowing through query limits by accident.',
      },
    ],
    processTitle: ['Two months.', 'A phased MVP'],
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
  'status-checks': {
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
    processTitle: ['Two weeks.', 'A small team'],
    processStats: [
      { n: '100', label: 'Integrations improved' },
      { n: '2 weeks', label: 'Total project time' },
      { n: '3', label: 'Team size' },
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
    solutionCards: [
      {
        n: '01',
        h: 'Design the shared shell',
        b: 'The first move was a platform frame capable of housing all commuter applications under one coherent experience instead of a set of disconnected tools.',
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
    processTitle: ['Discovery first.', 'Then consolidation'],
    processStats: [
      { n: '2 months', label: 'Discovery phase' },
      { n: '1', label: 'Designer' },
      { n: '23', label: 'Unique stakeholders' },
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
        'Getting engineering bought in was one of the hardest parts of the project.',
        'The flow edge cases were everywhere and easy to miss without deep auditing.',
        'The team occasionally lost sight of the core workflows and had to re-center on what mattered most.',
      ],
    },
  },
  'fleet-card': {
    summary:
      "I designed and launched Edenred USA's first Fleet Card platform, taking it from concept to live in 13 months. Built with VISA, it enabled real-time spending controls, opened a new market for the company, and converted more than 200 businesses.",
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
        'Led the design of a new platform from 0->1.',
        'Built a scalable design system from scratch and aligned with engineering on implementation.',
      ],
      shipped: [
        "Launched Edenred's first Fleet Card platform in the U.S.",
        'Helped secure the VISA partnership.',
        'Created a solid foundation for future products in the category.',
      ],
    },
    solutionTitle: ['System first.', 'Product second'],
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
    processTitle: ['Concept to launch.', 'In 13 months'],
    processStats: [
      { n: '13 months', label: 'From concept to launch' },
      { n: '1', label: 'Designer' },
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
  groundbase: {
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
        h: 'Design system before screens',
        b: 'Color tokens, type, spacing, and interaction rules were defined early so the product could move quickly without turning into a pile of one-off decisions.',
      },
      {
        n: '03',
        h: 'Serious UX for serious money',
        b: 'A dark palette, terracotta accents, bottom navigation on mobile, and a sidebar on desktop help the app feel like a real work tool instead of a novelty app.',
      },
    ],
    processTitle: ['Solo 0->1.', 'Built in the open'],
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
        h: 'Define the system early',
        body: 'The design system came first because it was the only way to move quickly later without sacrificing consistency or burning time on rework.',
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
        'Building the design system before any screens paid off with day-one consistency.',
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
