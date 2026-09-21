import type { Deck } from '../types';

/**
 * Identity profiles — a judgment story.
 *
 * The arc: what analysts were stuck on, the calls about how much AI to put in
 * front of them, what did not work, and what it changed. Depth that the talk
 * does not need but a question might lives in `appendix`, and the pushback
 * that would call for it links there.
 *
 * Scaffold: every '[bracketed]' string is a prompt to replace; the word counts
 * are ceilings, so slides stay talking points. Images are the case study's
 * own screenshots standing in until the real artefacts are chosen. The arc is
 * a starting point — reorder it to fit what actually happened.
 */
export const identityProfiles: Deck = {
  slug: 'identity-profiles',
  title: 'Identity profiles',
  shortTitle: 'Identity profiles',
  company: 'Red Canary',
  year: '2025',
  tint: 'var(--hero-case)',
  summary: 'Still a work in progress. If there’s time, this one’s more shop talk than presentation — we’ll dig through the Figma file together.',
  shows: [],
  minutes: 15,
  // Talked through in Figma, not presented from these slides: the scaffold
  // below stays for later, but the cover opens the file.
  link: {
    href: 'https://www.figma.com/design/dWyfO8oj9GzICuUZWBxruF/Identities?node-id=5614-24875&p=f&t=MhC66YGJGFIonWo1-0',
    label: 'Opens in Figma',
  },
  status: 'Work in progress',

  slides: [
    {
      id: 'title',
      kind: 'title',
      kicker: 'Red Canary',
      title: 'Identity profiles',
      hook: '[Why this project is worth fifteen minutes (≤20 words)]',
      meta: [
        { label: 'Role', value: 'Senior Product Designer' },
        { label: 'Team', value: '1 PM · 4 Eng · 1 Designer' },
        { label: 'Shipped', value: 'Q3 2025' },
        { label: 'What was mine', value: '[Yours, as distinct from the team’s (≤10 words)]' },
      ],
      notes: ['[Your first sentence out loud]'],
      pushback: [
        { q: '[Likely: Which parts were yours, and which were the team’s?]', a: '[Your answer]' },
      ],
    },
    {
      id: 'thesis',
      kind: 'statement',
      kicker: 'If you remember one thing',
      statement: '[The judgment call this project turned on (≤12 words)]',
      support: '[The evidence that earns it (≤20 words)]',
    },

    {
      id: 'act-problem',
      kind: 'chapter',
      title: 'The problem',
      question: '[What were analysts actually stuck on? (≤10 words)]',
    },
    {
      id: 'problem',
      kind: 'problem',
      heading: '[The problem as analysts felt it (≤10 words)]',
      body: ['[Why it mattered to the business right then (≤25 words)]'],
      evidence: [
        { type: 'data', value: '[0]', text: '[What the number measures (≤12 words)]', source: '[Source]' },
        { type: 'quote', text: '[What an analyst or customer said (≤15 words)]', source: '[Role, not name]' },
        { type: 'observation', text: '[What research showed that numbers missed (≤15 words)]' },
      ],
      pushback: [
        {
          q: '[Likely: How did you know this was the problem and not a symptom?]',
          a: '[Your answer]',
          show: 'people',
        },
      ],
    },
    {
      id: 'journey',
      kind: 'journey',
      heading: '[Where an investigation slowed down (≤10 words)]',
      intro: '[How you mapped it (≤15 words)]',
      steps: [
        { label: '[Alert fires]', detail: '[What happens (≤6 words)]', before: 1, after: 1 },
        { label: '[Open the identity]', detail: '[What happens (≤6 words)]', before: 3, after: 1 },
        { label: '[Correlate activity]', detail: '[What happens (≤6 words)]', before: 4, after: 2 },
        { label: '[Decide]', detail: '[What happens (≤6 words)]', before: 3, after: 1 },
        { label: '[Act]', detail: '[What happens (≤6 words)]', before: 2, after: 1 },
      ],
    },

    {
      id: 'act-judgment',
      kind: 'chapter',
      title: 'The judgment calls',
      question: '[What did you have to decide? (≤10 words)]',
    },
    {
      id: 'decision-ai',
      kind: 'decision',
      question: '[The call, as a question — e.g. how much AI is too much? (≤14 words)]',
      context: '[What made it a real tradeoff (≤25 words)]',
      options: [
        {
          name: '[Option A (≤4 words)]',
          summary: '[What it was (≤12 words)]',
          image: '/images/identity-profiles/solution-1.png',
          pros: ['[Upside (≤8 words)]'],
          cons: ['[Downside (≤8 words)]'],
          whyNot: '[Why not (≤12 words)]',
        },
        {
          name: '[Option B (≤4 words)]',
          summary: '[What it was (≤12 words)]',
          image: '/images/identity-profiles/solution-2.png',
          pros: ['[Upside (≤8 words)]'],
          cons: ['[Downside (≤8 words)]'],
          chosen: true,
        },
        {
          name: '[Option C (≤4 words)]',
          summary: '[What it was (≤12 words)]',
          image: '/images/identity-profiles/wireframe-1.svg',
          pros: ['[Upside (≤8 words)]'],
          cons: ['[Downside (≤8 words)]'],
          whyNot: '[Why not (≤12 words)]',
        },
      ],
      rationale: '[Why this one (≤20 words)]',
      gaveUp: '[What it cost (≤15 words)]',
      changeMind: '[The evidence that would have sent you the other way (≤15 words)]',
      notes: ['[Ask which they would pick before you reveal]'],
      pushback: [
        {
          q: '[Likely: How did you know the summaries were accurate enough to trust?]',
          a: '[Your answer]',
          show: 'constraints',
        },
        { q: '[Likely: Why not let analysts turn the AI off?]', a: '[Your answer]' },
        { q: '[Likely: What did you leave out of the first release?]', a: '[Your answer]', show: 'scope' },
      ],
    },
    {
      id: 'iteration',
      kind: 'iteration',
      heading: '[How the AI content changed across six rounds (≤10 words)]',
      iterations: [
        {
          label: '[Round 1]',
          image: '/images/identity-profiles/wireframe-1.svg',
          tried: '[What you tried (≤8 words)]',
          learned: '[What you learned (≤15 words)]',
        },
        {
          label: '[Round 3]',
          image: '/images/identity-profiles/solution-2.png',
          tried: '[What you tried (≤8 words)]',
          learned: '[What you learned (≤15 words)]',
        },
        {
          label: '[Shipped]',
          image: '/images/identity-profiles/solution-1.png',
          tried: '[What shipped (≤8 words)]',
          learned: '[What made it the one (≤15 words)]',
          shipped: true,
        },
      ],
      pushback: [
        { q: '[Likely: What were you benchmarking against?]', a: '[Your answer]', show: 'benchmark' },
      ],
    },
    {
      id: 'failure',
      kind: 'failure',
      tried: '[What didn’t work (≤10 words)]',
      happened: '[What happened when it met real analysts (≤25 words)]',
      learned: '[What you took from it (≤20 words)]',
      changed: '[What you changed (≤20 words)]',
      pushback: [{ q: '[Likely: Should you have caught this earlier?]', a: '[Your answer]' }],
    },
    {
      id: 'detail',
      kind: 'detail',
      heading: '[A detail that earns trust (≤8 words)]',
      body: '[Why it matters more than it looks (≤20 words)]',
      image: '/images/identity-profiles/solution-3.png',
      callouts: [
        { x: 18, y: 12, title: '[Callout (≤5 words)]', body: '[Why (≤10 words)]' },
        { x: 70, y: 40, title: '[Callout (≤5 words)]', body: '[Why (≤10 words)]' },
        { x: 35, y: 78, title: '[Callout (≤5 words)]', body: '[Why (≤10 words)]' },
      ],
    },

    {
      id: 'act-outcome',
      kind: 'chapter',
      title: 'The outcome',
      question: '[Did it work, and how do you know? (≤10 words)]',
    },
    {
      id: 'before-after',
      kind: 'beforeAfter',
      heading: '[The same identity, before and after (≤8 words)]',
      before: { image: '/images/identity-profiles/problem-overview.png', caption: '[What analysts had to do (≤15 words)]' },
      after: { image: '/images/identity-profiles/solution-2.png', caption: '[What they do now (≤15 words)]' },
    },
    {
      id: 'outcome',
      kind: 'outcome',
      heading: '[What changed (≤8 words)]',
      metrics: [
        {
          value: '~15%',
          label: 'Faster correlation',
          baseline: '[Baseline]',
          method: '[How it was measured, over what period (≤15 words)]',
        },
        { value: '[0]', label: '[Second metric (≤4 words)]', baseline: '[Baseline]', method: '[How it was measured (≤15 words)]' },
      ],
      qualitative: ['[What customers or leadership said (≤15 words)]'],
      caveat: '[What these numbers don’t prove (≤20 words)]',
      pushback: [
        {
          q: '[Likely: How do you separate the redesign from everything else that shipped?]',
          a: '[Your answer]',
          show: 'rollout',
        },
      ],
    },
    {
      id: 'reflection',
      kind: 'reflection',
      heading: 'Looking back',
      keep: ['[What you’d do again (≤12 words)]'],
      change: ['[What you’d do differently (≤12 words)]'],
      open: ['[What’s still unresolved (≤12 words)]'],
    },
  ],

  appendix: [
    {
      id: 'people',
      kind: 'people',
      heading: '[Who investigates an identity, under what pressure (≤10 words)]',
      people: [
        {
          role: '[SOC analyst]',
          context: '[Where they are when they land here (≤10 words)]',
          tryingTo: '[The decision they need to make (≤10 words)]',
          blockedBy: '[What the old page made them do (≤12 words)]',
          quote: '[Something one of them said (≤12 words)]',
        },
        {
          role: '[Customer security lead]',
          context: '[Their relationship to the page (≤10 words)]',
          tryingTo: '[What they need from it (≤10 words)]',
          blockedBy: '[What got in the way (≤12 words)]',
        },
      ],
    },
    {
      id: 'benchmark',
      kind: 'image',
      heading: '[What the competitive benchmark showed (≤8 words)]',
      image: '/images/identity-profiles/problem-overview.png',
      caption: '[The floor you had to meet, and where you could go past it (≤20 words)]',
    },
    {
      id: 'constraints',
      kind: 'constraints',
      heading: '[What boxed the work in (≤8 words)]',
      constraints: [
        { type: 'Time', constraint: '[The window (≤10 words)]', forced: '[What it made you cut or sequence (≤12 words)]' },
        { type: 'Model', constraint: '[A limit of the generated content (≤10 words)]', forced: '[How the design worked around it (≤12 words)]' },
        { type: 'Trust', constraint: '[Why analysts distrust generated text (≤10 words)]', forced: '[What that ruled out (≤12 words)]' },
      ],
    },
    {
      id: 'scope',
      kind: 'scope',
      heading: '[What made the first release (≤8 words)]',
      kept: [{ item: '[In (≤6 words)]', why: '[Why (≤12 words)]' }],
      cut: [{ item: '[Cut (≤6 words)]', why: '[Why (≤12 words)]' }],
      later: [{ item: '[Later (≤6 words)]', why: '[What it waits on (≤12 words)]' }],
    },
    {
      id: 'rollout',
      kind: 'timeline',
      heading: '[How it rolled out (≤8 words)]',
      phases: [
        { label: '[Pilot]', when: '[When]', what: '[Who got it, and why them (≤12 words)]', learned: '[What it taught you (≤12 words)]' },
        { label: '[Early access]', when: '[When]', what: '[Who got it (≤12 words)]', learned: '[What it taught you (≤12 words)]' },
        { label: '[General release]', when: '[When]', what: '[What changed before it (≤12 words)]', learned: '[What you watched after (≤12 words)]' },
      ],
    },
  ],
};
