/**
 * The content model for the deep-dive decks.
 *
 * Each slide kind exists because a presentation panel will push on it: the
 * decision behind the design, what failed, who had to be convinced, what was
 * cut, how an outcome was measured. The layouts are fixed; the words are yours.
 *
 * Any string wrapped in square brackets — '[like this]' — renders as an
 * unfilled placeholder, and the cover page and overview count what is left.
 *
 * Image fields take anything in public/images. A .mp4 or .webm plays muted on
 * loop while its slide is up — for prototypes and interactions.
 */

/** Surface colour. `tint` is the deck's own colour, set on the Deck. */
export type Tone = 'bone' | 'ink' | 'tint';

/** A question you expect to be asked, and your answer. Presenter view only. */
export interface Pushback {
  q: string;
  a: string;
  /**
   * The id of a backup slide that proves the answer. Presenter view shows a
   * button that puts it on screen; Escape returns to where the talk was.
   */
  show?: string;
}

interface SlideBase {
  /** Stable handle for the overview, the presenter view, and `Pushback.show`. Unique within a deck. */
  id: string;
  /** Override the kind's default surface. */
  tone?: Tone;
  /** Talking points. Presenter view only — never on the projected slide. */
  notes?: string[];
  /** Challenges you expect on this slide. Presenter view only. */
  pushback?: Pushback[];
}

export interface Meta {
  label: string;
  value: string;
}

/** Opens a deck. */
export interface TitleSlide extends SlideBase {
  kind: 'title';
  kicker?: string;
  title: string;
  /** One sentence: why this project is worth the time. */
  hook: string;
  meta: Meta[];
  image?: string;
}

/**
 * An act break. Every slide after a chapter belongs to it until the next one,
 * and the progress rail is drawn from these.
 */
export interface ChapterSlide extends SlideBase {
  kind: 'chapter';
  title: string;
  /** The question this act answers. */
  question?: string;
  /** Set beside the text, on the right. */
  image?: string;
}

/** One idea, big. A thesis, a turn in the story, a line to land. */
export interface StatementSlide extends SlideBase {
  kind: 'statement';
  kicker?: string;
  statement: string;
  support?: string;
}

export interface Person {
  role: string;
  context?: string;
  tryingTo: string;
  blockedBy: string;
  quote?: string;
}

/** Who lives in this experience — analysts, admins, developers. 1–4 people. */
export interface PeopleSlide extends SlideBase {
  kind: 'people';
  heading: string;
  intro?: string;
  people: Person[];
}

export type EvidenceType = 'data' | 'quote' | 'observation' | 'support';

export interface Evidence {
  type: EvidenceType;
  /** The number, for `data`. Rendered large. */
  value?: string;
  text: string;
  source?: string;
}

/**
 * The problem and the proof it was real. The right column shows `evidence`
 * when there is any, otherwise `image`.
 */
export interface ProblemSlide extends SlideBase {
  kind: 'problem';
  heading: string;
  body?: string[];
  evidence?: Evidence[];
  image?: string;
}

export interface Constraint {
  /** Short category — Time, Technical, Org, Data, Scope. */
  type: string;
  constraint: string;
  /** What the constraint forced you to do. */
  forced: string;
}

/** What you could not change, and what that made you do. 2–6 constraints. */
export interface ConstraintsSlide extends SlideBase {
  kind: 'constraints';
  heading: string;
  constraints: Constraint[];
}

/** 0 is smooth, 4 is stuck. */
export type Friction = 0 | 1 | 2 | 3 | 4;

export interface JourneyStep {
  label: string;
  detail?: string;
  before: Friction;
  /** Leave off every step to show only the original journey. */
  after?: Friction;
}

/** The experience as a friction curve, before and after. 3–7 steps. */
export interface JourneySlide extends SlideBase {
  kind: 'journey';
  heading: string;
  intro?: string;
  steps: JourneyStep[];
}

export interface DecisionOption {
  name: string;
  summary: string;
  /**
   * What the option actually looked like — a sketch, a wireframe, the rejected
   * direction. Real artefacts are what make the options read as options you
   * weighed rather than a matrix drawn afterwards.
   */
  image?: string;
  pros?: string[];
  cons?: string[];
  /** Exactly one option should be chosen. */
  chosen?: boolean;
  /** Shown on the options you rejected, once the choice is revealed. */
  whyNot?: string;
}

/**
 * A decision record. By default it takes two presses: the options first, then
 * the choice — so the room weighs them before you say which one won.
 */
export interface DecisionSlide extends SlideBase {
  kind: 'decision';
  /** The small label above the question. Defaults to "Decision". */
  kicker?: string;
  question: string;
  context?: string;
  /** 2–3 options; 4 fit, but only without images. */
  options: DecisionOption[];
  rationale: string;
  gaveUp?: string;
  /** What evidence would have sent you the other way. */
  changeMind?: string;
  /** Set false to show the choice straight away. */
  reveal?: boolean;
}

export interface Iteration {
  label: string;
  image?: string;
  tried: string;
  learned: string;
  shipped?: boolean;
}

/** How the thinking moved, round by round. 2–4 iterations. */
export interface IterationSlide extends SlideBase {
  kind: 'iteration';
  heading: string;
  iterations: Iteration[];
}

/** Something that did not work, owned plainly. */
export interface FailureSlide extends SlideBase {
  kind: 'failure';
  tried: string;
  happened: string;
  learned: string;
  changed: string;
}

export interface Callout {
  /** Position on the image, 0–100 from the left. */
  x: number;
  /** Position on the image, 0–100 from the top. */
  y: number;
  title: string;
  body?: string;
}

/** A close look at the craft: one image, numbered callouts. 1–5 callouts. */
export interface DetailSlide extends SlideBase {
  kind: 'detail';
  heading: string;
  body?: string;
  image: string;
  callouts: Callout[];
}

export interface Pane {
  /** Defaults to "Before" / "After". */
  label?: string;
  image: string;
  caption?: string;
}

export interface BeforeAfterSlide extends SlideBase {
  kind: 'beforeAfter';
  heading: string;
  before: Pane;
  after: Pane;
}

/** Where someone stood on the work, from most opposed to most invested. */
export type Stance = 'against' | 'wary' | 'neutral' | 'for' | 'champion';

export interface Stakeholder {
  group: string;
  wanted: string;
  worried: string;
  /** What changed their mind — the evidence, the concession, the demo. */
  moved: string;
  from: Stance;
  to: Stance;
}

/**
 * Who had to be convinced, and what did it. Each row draws the stance shift,
 * so the room sees the influence rather than hearing it claimed. 2–5 groups.
 */
export interface AlignmentSlide extends SlideBase {
  kind: 'alignment';
  heading: string;
  intro?: string;
  stakeholders: Stakeholder[];
}

export interface ScopeItem {
  item: string;
  why?: string;
}

/** What made the cut, what did not, and what waits. The prioritisation, on one slide. */
export interface ScopeSlide extends SlideBase {
  kind: 'scope';
  heading: string;
  kept: ScopeItem[];
  cut: ScopeItem[];
  later?: ScopeItem[];
}

export interface Phase {
  label: string;
  when?: string;
  what: string;
  /** What the phase taught you, or what had to be true to move on. */
  learned?: string;
}

/** Phases over time — a rollout, a migration, a programme. 3–5 phases. */
export interface TimelineSlide extends SlideBase {
  kind: 'timeline';
  heading: string;
  intro?: string;
  phases: Phase[];
}

export interface Metric {
  /** Small label above the number — what kind of result it is. */
  kicker?: string;
  /** A whole number with a suffix ("30%", "100+") counts up when the slide comes up. */
  value: string;
  label: string;
  baseline?: string;
  /** How the number was measured. Expect to be asked. */
  method?: string;
}

/** Results, with the method and the caveat on the slide. 1–4 metrics. */
export interface OutcomeSlide extends SlideBase {
  kind: 'outcome';
  heading: string;
  metrics: Metric[];
  qualitative?: string[];
  /** A label over the qualitative bullets. */
  qualitativeLabel?: string;
  /** What the numbers do not prove. */
  caveat?: string;
}

export interface QuoteSlide extends SlideBase {
  kind: 'quote';
  quote: string;
  who: string;
  role?: string;
}

export interface ImageSlide extends SlideBase {
  kind: 'image';
  heading?: string;
  image: string;
  caption?: string;
}

export interface ReflectionSlide extends SlideBase {
  kind: 'reflection';
  heading: string;
  keep: string[];
  change: string[];
  open: string[];
}

/** A marker pinned to a screenshot, positioned in percentages of the image. */
export interface Pin {
  /** 0–100 from the left. */
  x: number;
  /** 0–100 from the top. */
  y: number;
  title: string;
  body?: string;
  /**
   * `trap` marks something the screen let people do wrong, `good` something
   * that already worked. Both draw differently to a plain note.
   */
  tone?: 'note' | 'trap' | 'good';
  /**
   * Which side of x/y the numbered marker sits on, so it points at the thing
   * rather than covering it. Defaults to the side with more room: left of a
   * pin in the right half of the image, right of one in the left half.
   */
  place?: 'left' | 'right' | 'above' | 'below';
}

/** A region of a screenshot the room can click, in percentages of the image. */
export interface Hotspot {
  x: number;
  y: number;
  w: number;
  h: number;
  /** The `id` of the state clicking it moves to. */
  goes: string;
  /** What clicking it is — read out, and shown as the nudge before the first click. */
  label: string;
}

/** One state of a real screen: what it looked like, and what it was hiding. */
export interface ScreenState {
  /** Unique within the slide; `Hotspot.goes` points at it. */
  id: string;
  /** Set it on every state to draw the screens as a switcher instead of a sequence. */
  tab?: string;
  image: string;
  /** The line the room should read first — the invitation, or the reveal. */
  prompt?: string;
  /** What this screen is, under the frame. */
  caption?: string;
  pins?: Pin[];
  hotspots?: Hotspot[];
  /** What the product did that the screen never said. Drawn as a readout. */
  system?: { label: string; value: string }[];
}

/**
 * A real screen, live on the slide. The room clicks it and it answers the way
 * the product did, so a trap is something they fall into rather than something
 * they are told about.
 *
 * States are steps, so a clicker walks the same path as a mouse and the
 * presenter window mirrors wherever the screen has got to.
 */
export interface ScreenSlide extends SlideBase {
  kind: 'screen';
  heading: string;
  intro?: string;
  /** Bullets beside the screen, under the intro. */
  points?: Point[];
  /** 2–4. The first is where the screen starts. */
  states: ScreenState[];
}

/**
 * The whole answer on one slide, in the order a panel scores it. Put it early:
 * the room gets the situation, what was yours in it, what you did and what
 * changed inside a minute, and everything after it is the evidence.
 */
export interface StarSlide extends SlideBase {
  kind: 'star';
  kicker?: string;
  /** The line the four columns are evidence for. */
  heading: string;
  situation: string;
  /** What was yours — the assignment, and what you took on instead. */
  task: string;
  action: string;
  result: string;
}

export interface Hole {
  q: string;
  a: string;
}

/**
 * The questions the work had to survive, one press at a time: the room gets
 * the question, and a beat to answer it, before the answer lands. 2–4.
 */
export interface QaSlide extends SlideBase {
  kind: 'qa';
  heading: string;
  intro?: string;
  items: Hole[];
  /** The line after the last answer. */
  landing?: string;
}

/** One bullet. Its own `points` nest under it, up to two levels deep. */
export interface Point {
  text: string;
  /** A bold lead-in, set as "Pro: text". */
  lead?: string;
  points?: Point[];
}

/**
 * A label drawn on a screenshot, joined by a line to the thing it is about.
 * Positions are percentages of the image, 0–100 from the left and top.
 */
export interface Annotation {
  /** The thing being pointed at. */
  x: number;
  y: number;
  /** The centre of the label. Put it over empty space in the screenshot. */
  labelX: number;
  labelY: number;
  text: string;
  /**
   * Label width in canvas px. Labels fit their text up to 320px; set this for
   * a long one that would otherwise wrap to three lines.
   */
  width?: number;
  /** `trap` draws in the accent, for something the screen let people get wrong. */
  tone?: 'note' | 'trap';
}

/** A slide as you wrote it: a heading and nested bullets, in your words and your order. */
export interface PointsSlide extends SlideBase {
  kind: 'points';
  heading: string;
  points: Point[];
  /** A screenshot beside the bullets. */
  image?: string;
  /** Labels drawn on `image`. */
  annotations?: Annotation[];
  /** Several screenshots instead, stacked top to bottom beside the bullets. */
  images?: string[];
  /** Cap on the image column's width, in canvas px. Narrower gives the bullets more room. */
  imageWidth?: number;
}

export interface Highlight {
  /** Small label above the statement. */
  kicker?: string;
  /** The statement, set large. */
  text: string;
  /** A supporting line under it. */
  detail?: string;
}

/**
 * Two or three statements set like the results: large, side by side, each
 * landing with an accent bar. For the closing "what I did and what it did".
 */
export interface HighlightsSlide extends SlideBase {
  kind: 'highlights';
  heading: string;
  items: Highlight[];
}

export type Slide =
  | TitleSlide
  | ChapterSlide
  | StatementSlide
  | PeopleSlide
  | ProblemSlide
  | ConstraintsSlide
  | JourneySlide
  | DecisionSlide
  | IterationSlide
  | FailureSlide
  | DetailSlide
  | BeforeAfterSlide
  | AlignmentSlide
  | ScopeSlide
  | TimelineSlide
  | OutcomeSlide
  | QuoteSlide
  | ImageSlide
  | ReflectionSlide
  | ScreenSlide
  | QaSlide
  | StarSlide
  | PointsSlide
  | HighlightsSlide;

export interface Deck {
  /** The URL segment: /deep-dive/<slug>. */
  slug: string;
  title: string;
  /** Top-left of every slide. Keep it to a few words. */
  shortTitle: string;
  company: string;
  year: string;
  /** Surface colour for `tint` slides. */
  tint: string;
  /** One line for the cover: what the project was. */
  summary: string;
  /**
   * What this deep dive demonstrates, in two or three short phrases. Shown on
   * the cover, so the room knows what to look for before the first slide.
   */
  shows: string[];
  /** Planned talk time. Presenter view paces against it. */
  minutes: number;
  /**
   * For a talk given from somewhere else — a Figma file — rather than these
   * slides. The cover's row opens it in a new tab, it stays out of the cover's
   * running time, and no deck hands off to it.
   */
  link?: { href: string; label: string };
  /** A short tag on the cover's row, e.g. "Work in progress". */
  status?: string;
  /**
   * The frame the talk is told in, e.g. Situation, Task, Action, Result. Title
   * each chapter with one of its words: the chapter slide then draws the frame
   * as initials, with that chapter's lit, in place of the act number.
   */
  framework?: string[];
  /** The talk, in order. */
  slides: Slide[];
  /**
   * Backup slides: never in the running order, one press away when a
   * question needs them. Link them from `Pushback.show`.
   */
  appendix?: Slide[];
}
