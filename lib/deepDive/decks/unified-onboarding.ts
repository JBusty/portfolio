import type { Deck } from '../types';

/**
 * The FortiGate integration — the integration revamp, told in S.T.A.R.
 *
 * The bullet slides are Joshua's own words, slide for slide, from his deck.
 * Only typos have been corrected. Keep it that way: edit his wording, don't
 * rewrite it. The `screen` slides are the interactive walkthroughs
 * from the earlier build, placed where they land in his story.
 */
export const unifiedOnboarding: Deck = {
  slug: 'unified-onboarding',
  title: 'The FortiGate integration',
  shortTitle: 'The FortiGate integration',
  company: 'Red Canary',
  year: '2025',
  tint: 'var(--hero-work)',
  summary: 'One simple request, one giant trap, one simple solution',
  shows: [],
  minutes: 15,
  framework: ['Situation', 'Task', 'Action', 'Result'],

  slides: [
    {
      id: 'title',
      kind: 'title',
      kicker: 'Red Canary',
      title: 'The FortiGate integration',
      hook: 'One simple request, one giant trap, one simple solution',
      meta: [
        { label: 'Role', value: 'Design lead' },
        { label: 'Team', value: '1 PM, 6 Devs' },
        { label: 'Shipped', value: '2025' },
      ],
    },
    {
      id: 'background',
      kind: 'points',
      heading: 'Some quick background',
      points: [
        {
          text: 'Red Canary has 100s of integrations (including Okta):',
          points: [{ text: 'External Alert Sources' }, { text: 'External Services' }],
        },
        {
          text: 'External Service UX = Good',
          points: [{ text: 'This is the gold standard for an integration at Red Canary' }],
        },
        {
          text: 'External Alert Source UX = Pain',
          points: [{ text: 'It’s old, it’s janky, it was built by the CEO, and it’s the elephant in the room with us' }],
        },
      ],
      image: '/images/unified-onboarding/meme-background.jpg',
      imageWidth: 640,
    },

    {
      id: 'situation',
      kind: 'chapter',
      title: 'Situation',
      question: 'We needed to add a new Alert Source integration for Fortinet.',
      image: '/images/unified-onboarding/meme-im-in-danger.jpg',
    },
    {
      id: 'simple-request',
      kind: 'points',
      heading: 'One simple request',
      points: [
        {
          text: 'PM came to me with a simple design ticket.',
          points: [
            { text: 'We needed a new Alert Source integration for Fortinet FortiGate.' },
            { text: 'Same pattern as the rest of the Alert Sources with 1 or 2 new flow additions.' },
          ],
        },
        {
          text: 'Just a couple story points for engineering',
          points: [
            { text: '2 weeks to deliver was the estimate.' },
            { text: 'We met to kick this off and talked about what data we needed, field validations, the usual.' },
          ],
        },
        {
          text: 'Some quick research',
          points: [
            { text: 'Before Figma, I needed a quick refresher on how customers onboard a new Alert Source integration.' },
          ],
        },
      ],
      image: '/images/unified-onboarding/meme-simple-request.jpg',
    },
    {
      id: 'the-trap',
      kind: 'screen',
      heading: 'So I went to set one up',
      points: [
        { text: 'Before designing a new one, I went through the existing flow the way a customer would.' },
        { text: 'This is a brand new integration — nothing has been configured yet.' },
      ],
      states: [
        {
          id: 'blank',
          image: '/images/unified-onboarding/before-alert-source.png',
          prompt: 'Go on — turn it on.',
          caption: 'An Alert Source that needs provisioning. An empty form, and the greenest button on the screen sitting up in the header.',
          hotspots: [{ x: 89.8, y: 8.2, w: 6.4, h: 4.8, goes: 'active', label: 'Activate' }],
        },
        {
          id: 'active',
          image: '/images/unified-onboarding/before-alert-source-active.png',
          prompt: 'It worked. That is the problem.',
          caption: 'The same screen, one click later. No certificate, no key, no confirmation — and the integration is now live.',
          system: [
            { label: 'Collector', value: 'Provisioned' },
            { label: 'Integration', value: 'Active' },
            { label: 'Configuration', value: 'None' },
            { label: 'Data arriving', value: 'None' },
            { label: 'Told the customer', value: 'Nothing' },
          ],
        },
      ],
    },
    {
      id: 'set-one-up',
      kind: 'points',
      heading: 'Recap: The real problem',
      points: [
        { text: 'Oh boy, it just doesn’t work the way you expect' },
        {
          text: 'Alert Sources need to be provisioned (we set up a collector) in order to function.',
          points: [{ text: 'A customer is able to provision an integration without completing it.' }],
        },
        {
          text: 'This is very bad (it will be very broken and not function).',
          points: [
            { text: 'We don’t tell customers this is bad, worse is that we let them do it in the first place.' },
            {
              text: 'We could fix this with some more validations, but we still have a flow that did a poor job of explaining to a customer how to create one successfully.',
            },
          ],
        },
      ],
      image: '/images/unified-onboarding/before-alert-source-active.png',
      annotations: [
        {
          x: 92.2,
          y: 14.4,
          labelX: 73,
          labelY: 24,
          tone: 'trap',
          text: 'This integration is active and not functioning',
        },
        {
          x: 34,
          y: 38.2,
          labelX: 80,
          labelY: 38.2,
          text: 'Setup never completed',
        },
        {
          x: 94.9,
          y: 84.6,
          labelX: 62,
          labelY: 92.3,
          width: 430,
          tone: 'trap',
          text: 'Save button provisions the integration but does not activate it',
        },
      ],
    },
    {
      id: 'sanity-check',
      kind: 'points',
      heading: 'Sanity check',
      points: [
        {
          text: 'After I mapped out the UX and all the pitfalls with it, the question I wanted answered next was… who else knows about this?',
          points: [
            { text: 'I scheduled some deep dives with PM and Eng to make sure we were all aligned on how janky this flow was.' },
            { text: 'Eng was mostly aware, PM was partially aware, the can had been kicked down the road for years.' },
            { text: 'One of those “it’s too expensive to fix this, we’ll do it next quarter” kind of deals.' },
          ],
        },
        { text: 'Executive leadership also knew, it was just not really talked about much.' },
      ],
      image: '/images/unified-onboarding/meme-sanity-check.png',
      imageWidth: 700,
    },

    {
      id: 'task',
      kind: 'chapter',
      title: 'Task',
      question: 'Do we blow up scope or kick the can down the road?',
      image: '/images/unified-onboarding/meme-two-buttons.jpg',
    },
    {
      id: 'crossroads',
      kind: 'points',
      heading: 'Crossroads',
      points: [
        {
          text: 'Now that everyone is aligned on the situation, I have to make a big decision:',
          points: [{ text: 'Do I design this epic as written?' }],
        },
        {
          text: 'If I design it as written:',
          points: [
            { lead: 'Pro', text: 'We deliver on time, we make another one in a few weeks.' },
            { lead: 'Con', text: 'I become a can kicker, down the road it goes. We design around the janky and engineering builds around it.' },
          ],
        },
        {
          text: 'If I spend my political capital and blow up scope:',
          points: [
            { lead: 'Pro', text: 'I can solve this problem once and for all for engineering, design, and customers!' },
            { lead: 'Con', text: 'It will cost us time, lots of time, and it will be very tricky to test. Buy-in will be tough.' },
          ],
        },
      ],
      image: '/images/unified-onboarding/meme-crossroads.jpg',
    },
    {
      id: 'why-blow-it-up',
      kind: 'points',
      heading: 'Why blow it all up?',
      points: [
        {
          text: 'It was a tough call when faced with the complexity and hidden costs.',
          points: [
            { text: 'It will take lots of Eng time/resources' },
            { text: 'Testing will be tricky and leadership is not stoked about pushing the existing deadline' },
          ],
        },
        {
          text: 'Why is it worth it?',
          points: [
            { text: 'The customer should not need to care about our tech debt, nor should they be burdened by it.' },
            { text: 'We owe them the best experience and we stand to benefit in many ways by providing it.' },
          ],
        },
        {
          text: 'North Star:',
          points: [{ text: 'We can’t afford NOT to fix this problem.' }],
        },
      ],
    },

    {
      id: 'action',
      kind: 'chapter',
      title: 'Action',
      question: 'Let’s blow that scope and fix this thing once and for all.',
      image: '/images/unified-onboarding/meme-action.jpg',
    },
    {
      id: 'plan',
      kind: 'points',
      heading: 'Let’s make a plan',
      points: [
        {
          text: 'To be successful here I needed to achieve 2 things:',
          points: [
            { text: 'Design a sturdy, scalable UX for Alert Sources that feels like External Services' },
            { text: 'Get buy-in from PM, Eng, and Leadership (CEO).' },
          ],
        },
        {
          text: 'The key design problems to solve here were:',
          points: [
            { text: 'How do we consolidate many different integrations’ onboarding steps into a cohesive flow that feels consistent?' },
            { text: 'How do we solve for provisioning and activation so that it just makes sense?' },
            { text: 'How do we ensure it works for everyone?' },
          ],
        },
      ],
    },
    {
      id: 'options',
      kind: 'decision',
      kicker: 'Thought process',
      question: 'How do I fix the Alert Source flow?',
      options: [
        {
          name: 'Add more validations',
          summary: 'Keep the existing flow, and stop customers leaving an integration half set up.',
          whyNot: 'We’d be teaching customers what to do through validation errors instead of familiar UX patterns.',
        },
        {
          name: 'Design FortiGate as written',
          summary: 'Same pattern as the rest of the Alert Sources, with 1 or 2 new flow additions.',
          whyNot: 'I become a can kicker. We design around the janky and engineering builds around it.',
        },
        {
          name: 'Adopt the External Service pattern',
          summary: 'The gold standard for an integration at Red Canary.',
          chosen: true,
        },
      ],
      rationale: 'Use the External Service onboarding flow as the north star. This was the flow we wanted to proliferate, and Alert Sources should use this pattern.',
      gaveUp: 'Time: 2 weeks became 8.',
    },
    {
      id: 'how-i-solved-them',
      kind: 'points',
      heading: 'How I solved this',
      points: [
        {
          text: 'Consolidation',
          points: [
            { text: 'Step 1 = Name, ingest method, storage.' },
            { text: 'Step 2 = Provisioning and any follow-up steps for permissions.' },
            { text: 'Step 3 = Customize how data from this integration is handled.' },
          ],
        },
        {
          text: 'Dynamic steps',
          points: [
            {
              text: 'Since Alert Sources can be so different for onboarding, step 2 is dynamic based on the selections in step 1 (product type).',
            },
          ],
        },
        {
          text: 'Activate on save',
          points: [
            { text: 'No more extra action, just like External Services.' },
            { text: 'Integrations that are set up correctly and pass validations are active on save.' },
          ],
        },
      ],
      image: '/images/unified-onboarding/external-service-flow.png',
      annotations: [
        {
          x: 32,
          y: 22.8,
          labelX: 66,
          labelY: 22.8,
          width: 380,
          text: 'Product type chosen in step 1',
        },
        {
          x: 47,
          y: 57.9,
          labelX: 50,
          labelY: 75,
          width: 480,
          text: 'Step 2 changes based on the product type',
        },
        {
          x: 94.9,
          y: 66.6,
          labelX: 72,
          labelY: 88,
          width: 440,
          text: 'Active on save, no extra Activate step',
        },
      ],
    },
    {
      id: 'tradeoffs',
      kind: 'points',
      heading: 'Trade-offs and gotchas',
      points: [
        {
          text: 'There were some Alert Sources that did not cleanly fit into this new model.',
          points: [
            {
              text: 'We needed a plan for them but didn’t want to derail launching the new UX.',
            },
            {
              text: 'We had to leave a couple out of initial launch and then fast-follow them into the new model.',
            },
          ],
        },
        {
          text: 'Sometimes customers would provision an integration but not finish setting it up.',
          points: [
            {
              text: 'Fairly common and before we were just marking them as active.',
            },
            {
              text: 'We created a new status for these called “Configuration Required” and sorted them to the top of the integration list.',
            },
          ],
        },
      ],
      images: [
        '/images/unified-onboarding/tradeoff-status.png',
        '/images/unified-onboarding/tradeoff-save-activate.png',
        '/images/unified-onboarding/tradeoff-activate-disabled.png',
      ],
    },
    {
      id: 'buy-in',
      kind: 'points',
      heading: 'Getting buy-in',
      points: [
        {
          text: 'Get buy-in from leadership',
          points: [
            {
              text: 'All designs are pitched and approved by the CEO, this was no different.',
            },
            { text: 'He built this flow and I needed to convince him it was a real problem.' },
          ],
        },
        {
          text: 'CEO pushback',
          points: [
            { text: 'Why does this need to be redesigned? Can we just add more validations?' },
            {
              lead: 'Answer',
              text: 'We can, but at what point are we teaching customers what to do through validation errors vs just using familiar UX patterns?',
            },
          ],
        },
        {
          text: 'Consistency wins the day.',
          points: [
            {
              text: 'In the end, the CEO agreed that we needed to ship a consistent experience and this was real tech debt that needed to be paid.',
            },
          ],
        },
      ],
      image: '/images/unified-onboarding/meme-buy-in.jpg',
      imageWidth: 600,
    },
    {
      id: 'shipped-flow',
      kind: 'screen',
      heading: 'Recap: The flow that shipped',
      points: [
        {
          text: 'One shape for both kinds of integration:',
          points: [
            { text: 'Choose how the data arrives' },
            { text: 'Configure it' },
            { text: 'Customize how it is handled' },
          ],
        },
        { text: 'Provisioning became something you do, not something that happens to you.' },
        { text: 'This affected over 100 integrations.' },
      ],
      states: [
        {
          id: 'provision',
          tab: 'Provision, on purpose',
          image: '/images/unified-onboarding/solution-1.png',
          caption: 'Provisioning is its own step, with its own button, inside the step it belongs to. It used to happen on save.',
        },
        {
          id: 'confirm',
          tab: 'Say when it worked',
          image: '/images/unified-onboarding/solution-2.png',
          caption: 'The collector confirms itself, and the steps that depend on it only appear once it has succeeded.',
        },
        {
          id: 'validate',
          tab: 'Save means valid',
          image: '/images/unified-onboarding/solution-3.png',
          caption: 'Save validates every field. It used to let you walk away leaving the integration in a non-functioning state.',
        },
      ],
    },

    {
      id: 'result',
      kind: 'chapter',
      title: 'Result',
      question: 'Hard work pays off.',
    },
    {
      id: 'results',
      kind: 'outcome',
      tone: 'ink',
      heading: 'Results',
      metrics: [
        {
          kicker: 'Customer',
          value: '30%',
          label: 'Reduction in Zendesk tickets for Alert Source integrations',
        },
        {
          kicker: 'Scale',
          value: '100+',
          label: 'Integrations fixed by this design',
        },
        {
          kicker: 'Timeline',
          value: '2 → 8',
          label: 'It was supposed to take 2 weeks, it took 8.',
        },
      ],
      qualitativeLabel: 'Internal',
      qualitative: [
        'We were able to roll out new Alert Source integrations much cleaner and faster, with the new template being much more developer friendly.',
        'New integrations easily fit into the system we built, faster time to deploy and no 1-off bugs or inconsistencies.',
      ],
    },
    {
      id: 'how-we-know',
      kind: 'highlights',
      heading: 'How we knew it worked',
      items: [
        {
          kicker: 'Support tickets',
          text: 'We measured support tickets post-launch for Alert Source onboarding and compared them to pre-launch.',
        },
        {
          kicker: 'Customers',
          text: 'We heard from churn-risk customers that they had an easier time onboarding new integrations.',
          detail: 'CSM checked in',
        },
        {
          kicker: 'Dev effort',
          text: 'We saw a point reduction for new Alert Source integration tickets.',
          detail: 'Story points: 3–5s became 1–2s.',
        },
      ],
    },
    {
      id: 'reflection',
      kind: 'highlights',
      heading: 'Reflection',
      items: [
        {
          kicker: 'What I’d do differently',
          text: 'I would have engaged exec leadership earlier on and flagged the UX issue instead of all the build-up.',
          detail: 'It was nice to get all our ducks lined up, but it could have been expedited with some Slack messages to the right people earlier on.',
        },
      ],
    },
    {
      id: 'role-and-impact',
      kind: 'highlights',
      heading: 'Recap: My role and impact',
      items: [
        {
          kicker: 'My role',
          text: 'Advocated for a massive scope increase to deliver the best customer experience.',
          detail: 'Negotiated this with PM, Engineering and Leadership',
        },
        {
          kicker: 'Impact',
          text: 'Designed a unified integration experience that reduced support tickets and boosted our dev velocity.',
        },
      ],
    },
  ],

  appendix: [
    {
      id: 'before-after',
      kind: 'beforeAfter',
      heading: 'The same setup, before and after',
      before: {
        image: '/images/unified-onboarding/before-alert-source.png',
        caption: 'One page, two primary actions, and a switch that provisions a collector before anything has been configured.',
      },
      after: {
        image: '/images/unified-onboarding/solution-2.png',
        caption: 'Numbered steps, provisioning as a step with a result you can see, and nothing live until the setup is actually done.',
      },
    },
    {
      id: 'three-screens',
      kind: 'screen',
      heading: 'One product, three contracts',
      points: [
        { text: 'I mapped the two kinds of integration against each other, screen by screen.' },
        { text: 'Same product, same job for the customer, three different sets of rules.' },
      ],
      states: [
        {
          id: 'provisioned',
          tab: 'Alert source · provisioning',
          image: '/images/unified-onboarding/before-alert-source.png',
          caption: 'Everything on one page, with two primary actions in two places that mean two different things.',
          pins: [
            {
              x: 92.8,
              y: 10.7,
              place: 'below',
              tone: 'trap',
              title: 'Activate, in the header',
              body: 'Provisions a collector and turns the integration on. Available before anything has been filled in.',
            },
            {
              x: 95,
              y: 80.8,
              place: 'below',
              title: 'Save, in the footer',
              body: 'A second primary action, somewhere else, meaning something else — and not validating what it saved.',
            },
          ],
        },
        {
          id: 'unprovisioned',
          tab: 'Alert source · no provisioning',
          image: '/images/unified-onboarding/before-alert-source-basic.png',
          caption: 'The same kind of integration, one that needs no collector. No header at all, and Activate has moved to the bottom.',
          pins: [
            {
              x: 28.1,
              y: 75,
              place: 'right',
              tone: 'trap',
              title: 'Activate, in the footer',
              body: 'Same word, different place, different job — here it is simply the save button.',
            },
          ],
        },
        {
          id: 'external',
          tab: 'External service',
          image: '/images/unified-onboarding/before-external-service.png',
          caption: 'The other integration type, doing the same job for the customer — and doing it far more simply.',
          pins: [
            {
              x: 94.8,
              y: 19.2,
              place: 'left',
              tone: 'good',
              title: 'Numbered steps',
              body: 'One decision at a time. Step two stays shut until step one has been answered.',
            },
            {
              x: 95,
              y: 56.9,
              place: 'below',
              tone: 'good',
              title: 'No Activate at all',
              body: 'Setup finishes by saving, so there is no separate switch to get wrong.',
            },
          ],
        },
      ],
    },
  ],
};
