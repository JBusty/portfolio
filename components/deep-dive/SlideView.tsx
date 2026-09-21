'use client';

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import Image from 'next/image';
import { imageMeta } from '@/lib/imageMeta';
import { CANVAS, actIndexAt, actsFor, allSlides, defaultTone, isBackup, isPlaceholder, type Act } from '@/lib/deepDive';
import type {
  AlignmentSlide,
  Annotation,
  BeforeAfterSlide,
  ChapterSlide,
  ConstraintsSlide,
  Deck,
  DecisionSlide,
  DetailSlide,
  EvidenceType,
  FailureSlide,
  HighlightsSlide,
  ImageSlide,
  IterationSlide,
  JourneySlide,
  OutcomeSlide,
  PeopleSlide,
  Point,
  PointsSlide,
  ProblemSlide,
  QaSlide,
  QuoteSlide,
  ReflectionSlide,
  ScopeSlide,
  ScreenSlide,
  Slide,
  StarSlide,
  Stance,
  StatementSlide,
  TimelineSlide,
  TitleSlide,
} from '@/lib/deepDive/types';
import s from './slides.module.css';

/** Content area inside the chrome, in canvas px. Image slots are sized from it. */
const AREA = { w: CANVAS.w - 240, h: 790 };

const LETTERS = ['A', 'B', 'C', 'D'];

/** How far a slide may shrink to fit. Past this it is a content problem, not a layout one. */
const MIN_FIT = 0.72;

const EVIDENCE_LABEL: Record<EvidenceType, string> = {
  data: 'Data',
  quote: 'In their words',
  observation: 'Observed',
  support: 'Support ticket',
};

const STANCES: Stance[] = ['against', 'wary', 'neutral', 'for', 'champion'];

const STANCE_LABEL: Record<Stance, string> = {
  against: 'Against',
  wary: 'Wary',
  neutral: 'Neutral',
  for: 'For',
  champion: 'Champion',
};

const VIDEO = /\.(mp4|webm|mov)$/i;

interface SlideEnv {
  /** The slide being presented: it animates and its images open full screen. */
  live: boolean;
  /** Stage and neighbours load images up front so the next press is instant. */
  eager: boolean;
  onZoom?: (src: string, alt: string) => void;
  /** Moves within the slide — a hotspot on a live screen. Absent where the slide is only being shown. */
  onStep?: (step: number) => void;
  /** Jumps to another slide — a section on the progress rail. Absent where the slide is only being shown. */
  onGoto?: (index: number) => void;
}

const Env = createContext<SlideEnv>({ live: false, eager: false });

export default function SlideView({
  deck,
  index,
  step = 0,
  live = false,
  eager = false,
  onZoom,
  onStep,
  onGoto,
  onFit,
}: {
  deck: Deck;
  /** Into the talk followed by the backup slides — see allSlides(). */
  index: number;
  step?: number;
  live?: boolean;
  eager?: boolean;
  onZoom?: (src: string, alt: string) => void;
  onStep?: (step: number) => void;
  onGoto?: (index: number) => void;
  /** Reports how far the slide had to shrink to fit: 1 means it fits as written. */
  onFit?: (scale: number) => void;
}) {
  const slide = allSlides(deck)[index];
  const acts = actsFor(deck.slides);
  const act = acts[actIndexAt(acts, index)];
  const tone = defaultTone(slide);
  const rootRef = useRef<HTMLDivElement>(null);
  useFitToFrame(rootRef, slide, step, live, onFit);

  return (
    <Env.Provider value={{ live, eager, onZoom, onStep, onGoto }}>
      <div
        ref={rootRef}
        className={cx(s.slide, tone === 'ink' && s.ink, tone === 'tint' && s.tint, live && s.live)}
        style={{ '--deck-tint': deck.tint } as CSSProperties}
      >
        <Layout slide={slide} step={step} act={act} framework={deck.framework} />
        <Chrome deck={deck} index={index} acts={acts} />
      </div>
    </Env.Provider>
  );
}

function Layout({ slide, step, act, framework }: { slide: Slide; step: number; act: Act; framework?: string[] }) {
  switch (slide.kind) {
    case 'title': return <TitleLayout slide={slide} />;
    case 'chapter': return <ChapterLayout slide={slide} n={act.n} framework={framework} />;
    case 'statement': return <StatementLayout slide={slide} />;
    case 'people': return <PeopleLayout slide={slide} />;
    case 'problem': return <ProblemLayout slide={slide} />;
    case 'constraints': return <ConstraintsLayout slide={slide} />;
    case 'journey': return <JourneyLayout slide={slide} />;
    case 'decision': return <DecisionLayout slide={slide} revealed={slide.reveal === false || step >= 1} />;
    case 'iteration': return <IterationLayout slide={slide} />;
    case 'failure': return <FailureLayout slide={slide} />;
    case 'detail': return <DetailLayout slide={slide} />;
    case 'beforeAfter': return <BeforeAfterLayout slide={slide} />;
    case 'alignment': return <AlignmentLayout slide={slide} />;
    case 'scope': return <ScopeLayout slide={slide} />;
    case 'timeline': return <TimelineLayout slide={slide} />;
    case 'outcome': return <OutcomeLayout slide={slide} />;
    case 'quote': return <QuoteLayout slide={slide} />;
    case 'image': return <ImageLayout slide={slide} />;
    case 'reflection': return <ReflectionLayout slide={slide} />;
    case 'screen': return <ScreenLayout slide={slide} step={step} />;
    case 'qa': return <QaLayout slide={slide} step={step} />;
    case 'star': return <StarLayout slide={slide} />;
    case 'points': return <PointsLayout slide={slide} />;
    case 'highlights': return <HighlightsLayout slide={slide} />;
  }
}

/* ---- chrome ---- */

function Chrome({
  deck,
  index,
  acts,
}: {
  deck: Deck;
  index: number;
  acts: Act[];
}) {
  const slide = allSlides(deck)[index];
  const { onGoto } = useContext(Env);

  // Backup sits outside the running order, so it has no act and no place on
  // the rail — it says what it is, and which one of how many.
  if (isBackup(deck, index)) {
    const count = deck.appendix?.length ?? 0;
    return (
      <>
        <div className={s.chromeTop}>
          <span>{deck.shortTitle}</span>
          <span>Backup</span>
        </div>
        <div className={s.chromeBottom} aria-hidden>
          <span className={s.rail} />
          <span className={s.counter}>
            Backup {pad(index - deck.slides.length + 1)} / {pad(count)}
          </span>
        </div>
      </>
    );
  }

  const current = actIndexAt(acts, index);
  const act = acts[current];

  // The title slide has no header: its own title says what the talk is. A
  // chapter slide is already the act name, so it does not repeat it in the corner.
  const right = act.title && slide.kind !== 'chapter' ? `${pad(act.n)} ${act.title}` : '';

  return (
    <>
      {slide.kind !== 'title' && (
        <div className={s.chromeTop}>
          <span>{deck.shortTitle}</span>
          <span>{right}</span>
        </div>
      )}
      {/* On the live slide the rail is also the section menu: each act jumps to its first slide. */}
      <div className={s.chromeBottom} aria-hidden={onGoto ? undefined : true}>
        <ol className={s.rail} aria-label={onGoto ? 'Sections' : undefined}>
          {acts.map((a, i) => {
            const fill = i < current ? 1 : i > current ? 0 : (index - a.start + 1) / (a.end - a.start);
            const title = a.title ?? 'Opening';
            const inner = (
              <>
                <span className={s.railTrack}>
                  <span className={s.railFill} style={{ width: `${fill * 100}%` }} />
                </span>
                <span className={s.railLabel}>{title}</span>
              </>
            );
            return (
              <li
                key={a.start}
                className={s.railItem}
                style={{ flexGrow: a.end - a.start }}
                data-current={i === current || undefined}
              >
                {onGoto ? (
                  <button
                    type="button"
                    className={s.railHit}
                    onClick={() => onGoto(a.start)}
                    aria-label={`Go to ${title}`}
                    aria-current={i === current ? 'step' : undefined}
                  >
                    {inner}
                  </button>
                ) : (
                  <span className={s.railHit}>{inner}</span>
                )}
              </li>
            );
          })}
        </ol>
        <span className={s.counter}>
          {pad(index + 1)} / {pad(deck.slides.length)}
        </span>
      </div>
    </>
  );
}

/* ---- layouts ---- */

function TitleLayout({ slide }: { slide: TitleSlide }) {
  return (
    <div className={s.body}>
      <div className={s.titleMain}>
        <div>
          {slide.kicker && <div className={s.label}><T>{slide.kicker}</T></div>}
          <h1 className={s.display} style={{ marginTop: 32 }}><T>{slide.title}</T></h1>
          <p className={s.lede} style={{ marginTop: 44 }}><T>{slide.hook}</T></p>
        </div>
        {slide.image && <Img src={slide.image} alt={slide.title} maxW={720} maxH={520} />}
      </div>
      <dl className={s.meta} style={cols(slide.meta.length)}>
        {slide.meta.map((m) => (
          <div key={m.label}>
            <dt className={cx(s.label, s.metaLabel)}>{m.label}</dt>
            <dd className={s.metaValue}><T>{m.value}</T></dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ChapterLayout({ slide, n, framework }: { slide: ChapterSlide; n: number; framework?: string[] }) {
  // A chapter titled with a word of the deck's framework draws the whole frame
  // as initials — S.T.A.R. — with this chapter's letter lit.
  const inFrame = framework?.includes(slide.title);

  const text = (
    <>
      <div className={s.chapterNum} aria-hidden>
        {inFrame
          ? framework!.map((word) => (
              <span key={word} className={s.frameLetter} data-on={word === slide.title || undefined}>
                {word[0]}.
              </span>
            ))
          : pad(n)}
      </div>
      <h2 className={s.chapterTitle}><T>{slide.title}</T></h2>
      {slide.question && <p className={cx(s.serif, s.chapterQuestion)}><T>{slide.question}</T></p>}
    </>
  );

  if (!slide.image) {
    return (
      <div className={s.body} style={{ justifyContent: 'center' }}>
        {text}
      </div>
    );
  }

  // The image is centred on the same line as the text, out at the right edge.
  const TEXT_W = 900;
  const GAP = 80;

  return (
    <div className={cx(s.body, s.row)} style={{ alignItems: 'center', gap: GAP }}>
      <div style={{ flex: `0 0 ${TEXT_W}px` }}>{text}</div>
      <div className={s.chapterMedia}>
        <Img src={slide.image} alt="" maxW={AREA.w - TEXT_W - GAP} maxH={AREA.h} />
      </div>
    </div>
  );
}

function StatementLayout({ slide }: { slide: StatementSlide }) {
  return (
    <div className={s.body} style={{ justifyContent: 'center' }}>
      {slide.kicker && <div className={s.label}><T>{slide.kicker}</T></div>}
      <p className={s.statement}><T>{slide.statement}</T></p>
      {slide.support && <p className={s.lede} style={{ marginTop: 56 }}><T>{slide.support}</T></p>}
    </div>
  );
}

function PeopleLayout({ slide }: { slide: PeopleSlide }) {
  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      {slide.intro && <p className={s.copy} style={{ marginTop: 20, maxWidth: '60ch' }}><T>{slide.intro}</T></p>}
      <div className={s.columns} style={cols(slide.people.length)}>
        {slide.people.map((person, i) => (
          <article key={i} className={s.column}>
            <h3 className={s.personRole}><T>{person.role}</T></h3>
            {person.context && <p className={s.small} style={{ marginTop: 10 }}><T>{person.context}</T></p>}
            <dl className={s.personFields}>
              <div>
                <dt className={cx(s.label, s.labelSub)}>Trying to</dt>
                <dd className={s.fieldText}><T>{person.tryingTo}</T></dd>
              </div>
              <div>
                <dt className={s.label}>Blocked by</dt>
                <dd className={s.fieldText}><T>{person.blockedBy}</T></dd>
              </div>
            </dl>
            {person.quote && <blockquote className={cx(s.serif, s.personQuote)}><T>{person.quote}</T></blockquote>}
          </article>
        ))}
      </div>
    </div>
  );
}

function ProblemLayout({ slide }: { slide: ProblemSlide }) {
  const MAIN_W = 700;
  const GAP = 96;

  return (
    <div className={cx(s.body, s.row)} style={{ gap: GAP }}>
      <div className={s.problemMain} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 className={s.h2}><T>{slide.heading}</T></h2>
        {slide.body?.map((paragraph, i) => (
          <p key={i} className={s.copy} style={{ marginTop: i ? 20 : 36, maxWidth: '40ch' }}>
            <T>{paragraph}</T>
          </p>
        ))}
      </div>
      <div className={s.aside}>
        {slide.evidence?.length ? (
          <ul className={s.evidence}>
            {slide.evidence.map((item, i) => (
              <li key={i} className={s.evidenceItem}>
                <div className={cx(s.label, s.labelSub)}>{EVIDENCE_LABEL[item.type]}</div>
                {item.type === 'data' && item.value && <div className={s.evidenceValue}><T>{item.value}</T></div>}
                <p className={item.type === 'quote' ? cx(s.serif, s.evidenceQuote) : s.evidenceText}>
                  <T>{item.text}</T>
                </p>
                {item.source && <div className={s.evidenceSource}><T>{item.source}</T></div>}
              </li>
            ))}
          </ul>
        ) : slide.image ? (
          <Img src={slide.image} alt={slide.heading} maxW={AREA.w - MAIN_W - GAP} maxH={AREA.h} />
        ) : null}
      </div>
    </div>
  );
}

function ConstraintsLayout({ slide }: { slide: ConstraintsSlide }) {
  const n = slide.constraints.length;
  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      <div className={s.columns} style={{ ...cols(n <= 4 ? n : 3), marginTop: 72 }}>
        {slide.constraints.map((c, i) => (
          <div key={i} className={s.column}>
            <div className={s.label}><T>{c.type}</T></div>
            <p className={s.constraintText}><T>{c.constraint}</T></p>
            <div className={s.forced}>
              <div className={cx(s.label, s.labelSub)}>Which meant</div>
              <p className={s.fieldText}><T>{c.forced}</T></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JourneyLayout({ slide }: { slide: JourneySlide }) {
  const { steps } = slide;
  const W = AREA.w;
  const H = 330;
  const top = 20;
  const base = 300;
  const col = W / steps.length;
  const x = (i: number) => col * (i + 0.5);
  const y = (friction: number) => base - (friction / 4) * (base - top);
  const hasAfter = steps.some((step) => step.after !== undefined);

  // Horizontal tangents at every step, so the line reads as terrain rather
  // than a stock chart: flat where a step sits, sloped only between steps.
  function curve(values: number[]) {
    return values
      .map((v, i) => {
        if (i === 0) return `M ${x(0)} ${y(v)}`;
        const mid = (x(i - 1) + x(i)) / 2;
        return `C ${mid} ${y(values[i - 1])} ${mid} ${y(v)} ${x(i)} ${y(v)}`;
      })
      .join(' ');
  }

  const before = steps.map((step) => step.before);
  const after = steps.map((step) => step.after ?? step.before);
  const beforePath = curve(before);

  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      {slide.intro && <p className={s.copy} style={{ marginTop: 20, maxWidth: '60ch' }}><T>{slide.intro}</T></p>}

      <div className={s.journeyChart} style={{ marginTop: 'auto' }}>
        <div className={s.legend}>
          <span>
            <svg width="40" height="8" aria-hidden><line x1="4" x2="36" y1="4" y2="4" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" /></svg>
            Before
          </span>
          {hasAfter && (
            <span>
              <svg width="40" height="8" aria-hidden><line x1="3" x2="37" y1="4" y2="4" stroke="currentColor" strokeWidth="4" strokeDasharray="10 8" strokeLinecap="round" /></svg>
              After
            </span>
          )}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: 'block', overflow: 'visible', color: 'inherit' }} aria-hidden>
          <text className={s.axis} x="0" y={top + 5}>Stuck</text>
          <text className={s.axis} x="0" y={base - 10}>Smooth</text>
          {steps.map((_, i) => (
            <line key={i} x1={x(i)} x2={x(i)} y1={top} y2={base} stroke="var(--line)" strokeWidth="2" strokeDasharray="4 8" />
          ))}
          <line x1="0" x2={W} y1={base} y2={base} stroke="var(--line-strong)" strokeWidth="2" />
          <path
            className={s.late}
            d={`${beforePath} L ${x(steps.length - 1)} ${base} L ${x(0)} ${base} Z`}
            fill="rgba(225, 59, 20, 0.08)"
          />
          <path className={s.draw} d={beforePath} pathLength={1} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
          {hasAfter && (
            <path className={s.late} d={curve(after)} fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="14 12" strokeLinecap="round" />
          )}
          {before.map((v, i) => <circle key={`b${i}`} className={s.late} cx={x(i)} cy={y(v)} r="9" fill="var(--accent)" />)}
          {hasAfter && after.map((v, i) => <circle key={`a${i}`} className={s.late} cx={x(i)} cy={y(v)} r="6" fill="currentColor" />)}
        </svg>
      </div>

      <ol className={s.steps} style={cols(steps.length)}>
        {steps.map((step, i) => (
          <li key={i}>
            <p className={s.stepLabel}><T>{step.label}</T></p>
            {step.detail && <p className={cx(s.small, s.stepDetail)}><T>{step.detail}</T></p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function DecisionLayout({ slide, revealed }: { slide: DecisionSlide; revealed: boolean }) {
  const reasons = [
    ['Why this one', slide.rationale],
    ['What it cost', slide.gaveUp],
    ['What would have changed my mind', slide.changeMind],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  const n = slide.options.length;
  const GAP = 28;
  // Card width less its padding and border, so the image slot is sized exactly.
  const cardInner = (AREA.w - GAP * (n - 1)) / n - 56 - 4;
  // Every card gets a well once any option has an image, so names and
  // tradeoffs still line up across the row.
  const hasImages = slide.options.some((option) => option.image);
  // Two options leave each card wide enough to set the image beside the text:
  // a bigger picture of the work, and a shorter card.
  const split = hasImages && n <= 2;
  const mediaH = split ? 270 : 150;
  const mediaW = split ? (cardInner - 28) / 2 : cardInner;

  return (
    <>
      <div className={s.decisionGrid} aria-hidden />
      <div className={cx(s.body, s.decision, revealed && s.revealed)}>
        <div className={s.label}><T>{slide.kicker ?? 'Decision'}</T></div>
        <h2 className={s.decisionQuestion}><T>{slide.question}</T></h2>
        {slide.context && <p className={cx(s.copy, s.decisionContext)}><T>{slide.context}</T></p>}

        <ul className={s.options} style={{ ...cols(n), gap: GAP }}>
          {slide.options.map((option, i) => (
            <li key={i} className={cx(s.option, split && s.optionSplit)} data-chosen={option.chosen || undefined}>
              <div className={s.optionHead}>
                <span className={cx(s.label, s.labelSub, s.optionKey)}>Option {LETTERS[i]}</span>
                {option.chosen && <span className={s.chosen} aria-hidden={!revealed}>Chosen</span>}
              </div>
              {hasImages && (
                <div className={cx(s.well, s.optionMedia)} style={{ height: mediaH }}>
                  {option.image && <Img src={option.image} alt={option.name} maxW={mediaW - 24} maxH={mediaH - 24} />}
                </div>
              )}
              <h3 className={s.optionName}><T>{option.name}</T></h3>
              <p className={cx(s.copy, s.optionSummary)}><T>{option.summary}</T></p>
              {(option.pros?.length || option.cons?.length) ? (
                <ul className={s.tradeoffs}>
                  {option.pros?.map((pro, j) => <li key={`p${j}`} data-sign="+"><span><T>{pro}</T></span></li>)}
                  {option.cons?.map((con, j) => <li key={`c${j}`} data-sign="−"><span><T>{con}</T></span></li>)}
                </ul>
              ) : null}
              {!option.chosen && option.whyNot && (
                <p className={s.whyNot} aria-hidden={!revealed}>
                  <span className={s.label}>Why not</span>
                  <T>{option.whyNot}</T>
                </p>
              )}
            </li>
          ))}
        </ul>

        {/* "Why this one" is the argument; the others are asides, so it gets the room. */}
        <dl
          className={s.rationale}
          style={{ gridTemplateColumns: reasons.map((_, i) => (i === 0 && reasons.length > 1 ? '2fr' : '1fr')).join(' ') }}
          aria-hidden={!revealed}
        >
          {reasons.map(([label, text]) => (
            <div key={label}>
              <dt className={s.label}>{label}</dt>
              <dd><T>{text}</T></dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

function IterationLayout({ slide }: { slide: IterationSlide }) {
  const n = slide.iterations.length;
  const GAP = 72;
  const colW = (AREA.w - GAP * (n - 1)) / n;
  const wellH = n >= 4 ? 260 : 320;
  const headH = 34;

  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      <ol className={s.iterations} style={{ ...cols(n), gap: GAP }}>
        {slide.iterations.map((it, i) => (
          <li key={i} className={s.iteration}>
            <div className={s.iterationHead}>
              <span className={s.label}><T>{it.label}</T></span>
              {it.shipped && <span className={s.badge}>Shipped</span>}
            </div>
            <div className={s.well} style={{ height: wellH }}>
              {it.image && <Img src={it.image} alt={it.label} maxW={colW - 48} maxH={wellH - 48} />}
            </div>
            {i < n - 1 && (
              <svg className={s.iterationArrow} style={{ top: headH + 16 + wellH / 2 - 24 }} viewBox="0 0 24 48" aria-hidden>
                <polyline points="5,6 19,24 5,42" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <p className={s.iterationTried}><T>{it.tried}</T></p>
            <div className={cx(s.label, s.labelSub)} style={{ marginTop: 18, fontSize: 15 }}>Learned</div>
            <p className={cx(s.fieldText, s.iterationLearned)} style={{ marginTop: 8 }}><T>{it.learned}</T></p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FailureLayout({ slide }: { slide: FailureSlide }) {
  return (
    <div className={cx(s.body, s.row)} style={{ gap: 120 }}>
      <div className={s.failureMain}>
        <div className={s.label}>What didn’t work</div>
        <h2 className={s.failureTried}>
          <span className={s.strike}><T>{slide.tried}</T></span>
        </h2>
        <div className={cx(s.label, s.labelSub)} style={{ marginTop: 64 }}>What happened</div>
        <p className={s.lede} style={{ marginTop: 14 }}><T>{slide.happened}</T></p>
      </div>
      <dl className={s.failureAside}>
        <div className={s.column}>
          <dt className={s.label}>What I took from it</dt>
          <dd><T>{slide.learned}</T></dd>
        </div>
        <div className={s.column}>
          <dt className={s.label}>What we changed</dt>
          <dd><T>{slide.changed}</T></dd>
        </div>
      </dl>
    </div>
  );
}

function DetailLayout({ slide }: { slide: DetailSlide }) {
  const TEXT_W = 520;
  const GAP = 72;

  return (
    <div className={cx(s.body, s.row)} style={{ gap: GAP }}>
      <div className={s.detailText}>
        <h2 className={cx(s.h2, s.h2Sm)}><T>{slide.heading}</T></h2>
        {slide.body && <p className={s.copy} style={{ marginTop: 24 }}><T>{slide.body}</T></p>}
        <ol className={s.callouts}>
          {slide.callouts.map((c, i) => (
            <li key={i}>
              <span className={s.calloutNum} aria-hidden>{i + 1}</span>
              <div>
                <h3 className={s.calloutTitle}><T>{c.title}</T></h3>
                {c.body && <p className={s.small} style={{ marginTop: 6 }}><T>{c.body}</T></p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className={s.detailMedia}>
        <Img src={slide.image} alt={slide.heading} maxW={AREA.w - TEXT_W - GAP} maxH={AREA.h}>
          {slide.callouts.map((c, i) => (
            <span key={i} className={s.marker} style={{ left: `${c.x}%`, top: `${c.y}%` }} aria-hidden>
              {i + 1}
            </span>
          ))}
        </Img>
      </div>
    </div>
  );
}

function BeforeAfterLayout({ slide }: { slide: BeforeAfterSlide }) {
  const GAP = 64;
  const paneW = (AREA.w - GAP) / 2;
  const wellH = 440;
  const panes = [
    { fallback: 'Before', pane: slide.before },
    { fallback: 'After', pane: slide.after },
  ];

  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      <div className={s.panes} style={{ gap: GAP }}>
        {panes.map(({ fallback, pane }, i) => (
          <figure key={fallback} className={cx(s.pane, i === 1 && s.paneAfter)}>
            <figcaption className={cx(s.label, s.labelSub)}>{pane.label ?? fallback}</figcaption>
            <div className={s.well} style={{ height: wellH }}>
              <Img src={pane.image} alt={pane.label ?? fallback} maxW={paneW - 48} maxH={wellH - 48} />
            </div>
            {pane.caption && <p className={s.copy} style={{ marginTop: 20 }}><T>{pane.caption}</T></p>}
          </figure>
        ))}
      </div>
    </div>
  );
}

function AlignmentLayout({ slide }: { slide: AlignmentSlide }) {
  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      {slide.intro && <p className={s.copy} style={{ marginTop: 20, maxWidth: '60ch' }}><T>{slide.intro}</T></p>}

      <div className={s.alignment} role="table">
        <div className={s.alignmentRow} role="row">
          {['Who', 'Where they moved', 'Wanted', 'Worried about', 'What moved them'].map((label) => (
            <span key={label} role="columnheader" className={cx(s.label, s.labelSub, s.alignmentHead)}>{label}</span>
          ))}
        </div>
        {slide.stakeholders.map((person, i) => (
          <div key={i} className={s.alignmentRow} role="row">
            <p role="cell" className={s.alignmentGroup}><T>{person.group}</T></p>
            <div role="cell">
              <StanceShift from={person.from} to={person.to} />
            </div>
            <p role="cell" className={s.alignmentText}><T>{person.wanted}</T></p>
            <p role="cell" className={s.alignmentText}><T>{person.worried}</T></p>
            <p role="cell" className={cx(s.alignmentText, s.alignmentMoved)}><T>{person.moved}</T></p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Where someone started and where they ended up, on one five-point track. The
 * filled dot travels from the hollow one when the slide comes up, so the
 * movement is the thing the eye follows.
 */
function StanceShift({ from, to }: { from: Stance; to: Stance }) {
  const W = 250;
  const pad = 10;
  const x = (stance: Stance) => pad + (STANCES.indexOf(stance) / (STANCES.length - 1)) * (W - pad * 2);
  const moved = from !== to;

  return (
    <div>
      <svg width={W} height="28" viewBox={`0 0 ${W} 28`} className={s.stance} aria-hidden>
        <line x1={pad} x2={W - pad} y1="14" y2="14" stroke="var(--line-strong)" strokeWidth="2" />
        {STANCES.map((stance) => (
          <line key={stance} x1={x(stance)} x2={x(stance)} y1="8" y2="20" stroke="var(--line-strong)" strokeWidth="2" />
        ))}
        {moved && (
          <>
            <line className={s.stanceTrail} x1={x(from)} x2={x(to)} y1="14" y2="14" stroke="var(--accent)" strokeWidth="4" />
            <circle cx={x(from)} cy="14" r="7" fill="var(--slide-bg, var(--bone))" stroke="var(--fg-sub)" strokeWidth="2.5" />
          </>
        )}
        <circle
          className={s.stanceDot}
          style={{ '--travel': `${x(from) - x(to)}px` } as CSSProperties}
          cx={x(to)}
          cy="14"
          r="9"
          fill="var(--accent)"
        />
      </svg>
      <p className={s.stanceLabel}>
        {moved ? `${STANCE_LABEL[from]} to ${STANCE_LABEL[to].toLowerCase()}` : `${STANCE_LABEL[to]} throughout`}
      </p>
    </div>
  );
}

function ScopeLayout({ slide }: { slide: ScopeSlide }) {
  const groups = [
    { key: 'kept', label: 'What made it', items: slide.kept },
    { key: 'cut', label: 'What we cut', items: slide.cut },
    { key: 'later', label: 'What waits', items: slide.later ?? [] },
  ].filter((group) => group.items.length > 0);

  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      <div className={s.columns} style={{ ...cols(groups.length), marginTop: 64 }}>
        {groups.map((group) => (
          <div key={group.key} className={cx(s.column, s.scopeColumn)} data-group={group.key}>
            <h3 className={cx(s.label, group.key !== 'cut' && s.labelSub)} style={{ margin: 0 }}>{group.label}</h3>
            <ul className={s.scopeList}>
              {group.items.map((entry, i) => (
                <li key={i}>
                  <p className={s.scopeItem}><T>{entry.item}</T></p>
                  {entry.why && <p className={s.scopeWhy}><T>{entry.why}</T></p>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineLayout({ slide }: { slide: TimelineSlide }) {
  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      {slide.intro && <p className={s.copy} style={{ marginTop: 20, maxWidth: '60ch' }}><T>{slide.intro}</T></p>}

      <ol className={s.phases} style={cols(slide.phases.length)}>
        {slide.phases.map((phase, i) => (
          <li key={i} className={s.phase}>
            <span className={s.phaseNode} aria-hidden>{i + 1}</span>
            {phase.when && <div className={cx(s.label, s.labelSub)} style={{ marginTop: 22 }}><T>{phase.when}</T></div>}
            <h3 className={s.phaseLabel}><T>{phase.label}</T></h3>
            <p className={s.fieldText} style={{ margin: '12px 0 22px' }}><T>{phase.what}</T></p>
            {phase.learned && (
              <div className={s.phaseLearned}>
                <div className={s.label} style={{ fontSize: 15 }}>Learned</div>
                <p className={s.fieldText}><T>{phase.learned}</T></p>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function OutcomeLayout({ slide }: { slide: OutcomeSlide }) {
  const n = slide.metrics.length;
  // The results land one after another, not all at once.
  const STAGGER = 220;

  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      <div className={s.columns} style={cols(n)}>
        {slide.metrics.map((m, i) => (
          <div
            key={i}
            className={cx(s.column, s.metricCol)}
            style={{ '--delay': `${i * STAGGER}ms` } as CSSProperties}
          >
            {m.kicker && <div className={cx(s.label, s.metricKicker)}><T>{m.kicker}</T></div>}
            <div className={cx(s.metricValue, n <= 2 && s.metricValueLg)}>
              <CountUp value={m.value} delay={i * STAGGER} />
            </div>
            <div className={s.metricLabel}><T>{m.label}</T></div>
            {m.baseline && <p className={s.small} style={{ marginTop: 10 }}>Baseline: <T>{m.baseline}</T></p>}
            {m.method && (
              <div className={s.metricMethod}>
                <div className={cx(s.label, s.labelSub)} style={{ fontSize: 15 }}>How it was measured</div>
                <p className={s.fieldText} style={{ fontSize: 21 }}><T>{m.method}</T></p>
              </div>
            )}
          </div>
        ))}
      </div>
      {(slide.qualitative?.length || slide.caveat) ? (
        <div className={s.outcomeFoot} style={slide.caveat ? undefined : { gridTemplateColumns: '1fr' }}>
          {slide.qualitative?.length ? (
            <div>
              {slide.qualitativeLabel && (
                <div className={cx(s.label, s.metricKicker)}><T>{slide.qualitativeLabel}</T></div>
              )}
              <ul className={s.wins} style={cols(slide.caveat ? 1 : slide.qualitative.length)}>
                {slide.qualitative.map((line, i) => <li key={i}><T>{line}</T></li>)}
              </ul>
            </div>
          ) : <span />}
          {slide.caveat && (
            <div>
              <div className={s.label}>What this doesn’t prove</div>
              <p className={s.fieldText} style={{ marginTop: 10 }}><T>{slide.caveat}</T></p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Statements set like the results: side by side, each landing with its accent bar. */
function HighlightsLayout({ slide }: { slide: HighlightsSlide }) {
  const STAGGER = 260;

  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      <div className={s.columns} style={{ ...cols(slide.items.length), gap: 80, marginTop: 80 }}>
        {slide.items.map((item, i) => (
          <div
            key={i}
            className={cx(s.column, s.metricCol)}
            style={{ '--delay': `${i * STAGGER}ms` } as CSSProperties}
          >
            {item.kicker && <div className={cx(s.label, s.metricKicker)}><T>{item.kicker}</T></div>}
            <div className={s.highlightBody}>
              <p className={cx(s.highlightText, slide.items.length >= 3 && s.highlightTextSm)}><T>{item.text}</T></p>
              {item.detail && <p className={s.highlightDetail}><T>{item.detail}</T></p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A result that counts up from zero when its slide comes up: "30%", "100+".
 * Anything else — "2 → 8", a placeholder — and any slide that is only being
 * shown (a neighbour, print, reduced motion) renders exactly as written.
 */
function CountUp({ value, delay = 0 }: { value: string; delay?: number }) {
  const { live } = useContext(Env);
  const match = /^(\d+)(\D*)$/.exec(value);
  const target = match ? Number(match[1]) : null;
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = live && target !== null && !reduced;
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!animate || target === null) return;
    const DURATION = 1300;
    // Past the slide transition before it starts, so the room sees it move.
    const start = performance.now() + 250 + delay;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / DURATION));
      setN(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setN(0);
    };
  }, [animate, target, delay]);

  if (!animate || !match) return <T>{value}</T>;
  return <>{n}{match[2]}</>;
}

function QuoteLayout({ slide }: { slide: QuoteSlide }) {
  return (
    <div className={s.body} style={{ justifyContent: 'center' }}>
      <div className={s.quoteMark} aria-hidden>“</div>
      <blockquote className={cx(s.serif, s.quote)}><T>{slide.quote}</T></blockquote>
      <div className={s.quoteWho}>
        <T>{slide.who}</T>
        {slide.role && <p className={s.small} style={{ marginTop: 6, fontWeight: 400 }}><T>{slide.role}</T></p>}
      </div>
    </div>
  );
}

function ImageLayout({ slide }: { slide: ImageSlide }) {
  const headH = slide.heading ? 60 + 32 : 0;
  const captionH = slide.caption ? 24 + 80 : 0;

  return (
    <div className={s.body}>
      {slide.heading && <h2 className={cx(s.h2, s.h2Sm)}><T>{slide.heading}</T></h2>}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: slide.heading ? 32 : 0 }}>
        <Img src={slide.image} alt={slide.caption ?? slide.heading ?? ''} maxW={AREA.w} maxH={AREA.h - headH - captionH} />
      </div>
      {slide.caption && <p className={s.copy} style={{ marginTop: 24, maxWidth: '64ch' }}><T>{slide.caption}</T></p>}
    </div>
  );
}

function ReflectionLayout({ slide }: { slide: ReflectionSlide }) {
  const groups = [
    { label: 'What I’d keep', items: slide.keep },
    { label: 'What I’d change', items: slide.change },
    { label: 'Still open', items: slide.open },
  ].filter((group) => group.items.length > 0);

  return (
    <div className={s.body}>
      <h2 className={s.h2}><T>{slide.heading}</T></h2>
      <div className={s.columns} style={{ ...cols(groups.length), marginTop: 72 }}>
        {groups.map((group) => (
          <div key={group.label} className={s.column}>
            <h3 className={s.label} style={{ margin: 0 }}>{group.label}</h3>
            <ul className={s.reflectList}>
              {group.items.map((item, i) => <li key={i}><T>{item}</T></li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- pieces ---- */

/**
 * When a slide's copy runs past its frame, shrink the content until it fits —
 * the way Keynote shrinks text in a full box — rather than letting it run into
 * the progress rail mid-talk. The frame is widened before it is scaled, so
 * lines reflow longer instead of everything just getting smaller.
 */
function useFitToFrame(
  root: RefObject<HTMLDivElement | null>,
  slide: Slide,
  // A step can change what is on the slide — a screen's readout, an answer — so it refits too.
  step: number,
  warn: boolean,
  onFit?: (scale: number) => void,
) {
  const onFitRef = useRef(onFit);
  useEffect(() => {
    onFitRef.current = onFit;
  }, [onFit]);

  useLayoutEffect(() => {
    const frame = root.current?.querySelector<HTMLElement>(`:scope > .${CSS.escape(s.body)}`);
    if (!frame) return;
    let cancelled = false;

    function fit(settled: boolean) {
      if (cancelled || !frame) return;
      for (const prop of ['transform', 'transformOrigin', 'width', 'height', 'right', 'bottom'] as const) {
        frame.style[prop] = '';
      }
      const width = frame.clientWidth;
      const height = frame.clientHeight;
      let scale = 1;

      for (let i = 0; i < 6; i++) {
        const over = frame.scrollHeight / frame.clientHeight;
        if (over <= 1.005 || scale <= MIN_FIT) break;
        scale = Math.max(MIN_FIT, scale / over);
        Object.assign(frame.style, {
          right: 'auto',
          bottom: 'auto',
          width: `${width / scale}px`,
          height: `${height / scale}px`,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        });
      }

      onFitRef.current?.(scale);
      if (settled && warn && scale < 1 && process.env.NODE_ENV !== 'production') {
        console.warn(`[deep dive] Slide "${slide.id}" was shrunk to ${Math.round(scale * 100)}% to fit. Trim its copy to present it full size.`);
      }
    }

    // Metrics change when a web font arrives, so fit again against the real
    // ones. `ready` alone is not enough: a slide pre-rendered as a neighbour
    // can be the first thing on the page to use a face, and that face only
    // starts loading after this runs — `ready` has already resolved by then.
    const refit = () => fit(true);
    fit(false);
    document.fonts?.ready.then(refit);
    document.fonts?.addEventListener('loadingdone', refit);
    return () => {
      cancelled = true;
      document.fonts?.removeEventListener('loadingdone', refit);
    };
  }, [root, slide, step, warn]);
}

/**
 * A screen the room can use. The state on show is the slide's step, so a
 * hotspot click and an arrow press are the same move — and the presenter
 * window, which has no mouse on the projected screen, follows either.
 */
function ScreenLayout({ slide, step }: { slide: ScreenSlide; step: number }) {
  const { live, onStep } = useContext(Env);
  const current = Math.min(Math.max(step, 0), slide.states.length - 1);
  const state = slide.states[current];
  const pins = state.pins ?? [];
  // Every state named: a set of screens to compare, not a sequence to walk.
  const tabbed = slide.states.length > 1 && slide.states.every((st) => st.tab);
  const canClick = live && Boolean(onStep);

  const RAIL = 520;
  const GAP = 72;
  const mediaW = AREA.w - RAIL - GAP;
  // The frame gives up room to the tab bar and the caption under it.
  const mediaH = AREA.h - (tabbed ? 96 : 0) - (state.caption ? 72 : 0);

  return (
    <div className={cx(s.body, s.row)} style={{ gap: GAP }}>
      <div className={s.screenRail}>
        <h2 className={cx(s.h2, s.h2Sm)}><T>{slide.heading}</T></h2>
        {slide.intro && <p className={s.copy} style={{ marginTop: 18 }}><T>{slide.intro}</T></p>}
        {slide.points && <PointList points={slide.points} depth={0} />}
        {state.prompt && (
          <p className={cx(s.serif, s.screenPrompt)}><T>{state.prompt}</T></p>
        )}
        {pins.length > 0 && (
          <ol className={s.callouts}>
            {pins.map((pin, i) => (
              <li key={i}>
                <span className={cx(s.calloutNum, pin.tone === 'trap' && s.pinTrap, pin.tone === 'good' && s.pinGood)}>
                  {i + 1}
                </span>
                <div>
                  <h3 className={s.calloutTitle}><T>{pin.title}</T></h3>
                  {pin.body && <p className={s.small} style={{ marginTop: 8 }}><T>{pin.body}</T></p>}
                </div>
              </li>
            ))}
          </ol>
        )}
        {state.system && (
          <div className={s.system}>
            <div className={cx(s.label, s.systemLabel)}>Behind the glass</div>
            <dl className={s.systemRows}>
              {state.system.map((row, i) => (
                <div key={i}>
                  <dt><T>{row.label}</T></dt>
                  <dd><T>{row.value}</T></dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className={s.screenMedia}>
        {tabbed && (
          <div className={s.tabs} role={canClick ? 'tablist' : undefined}>
            {slide.states.map((st, i) => {
              const on = i === current;
              const label = <T>{st.tab!}</T>;
              return canClick ? (
                <button
                  key={st.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={s.tab}
                  data-on={on || undefined}
                  onClick={() => onStep!(i)}
                >
                  {label}
                </button>
              ) : (
                <span key={st.id} className={s.tab} data-on={on || undefined}>{label}</span>
              );
            })}
          </div>
        )}
        <Img src={state.image} alt={state.caption ?? slide.heading} maxW={mediaW} maxH={mediaH}>
          {pins.map((pin, i) => (
            <span
              key={i}
              className={cx(s.marker, pin.tone === 'trap' && s.pinTrap, pin.tone === 'good' && s.pinGood)}
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              data-place={pin.place ?? (pin.x > 50 ? 'left' : 'right')}
              aria-hidden
            >
              {i + 1}
            </span>
          ))}
          {canClick && state.hotspots?.map((spot, i) => (
            <button
              key={i}
              type="button"
              className={s.hotspot}
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.w}%`, height: `${spot.h}%` }}
              onClick={() => onStep!(slide.states.findIndex((st) => st.id === spot.goes))}
            >
              <span className={s.hotspotLabel}>{spot.label}</span>
            </button>
          ))}
        </Img>
        {state.caption && <p className={cx(s.small, s.screenCaption)}><T>{state.caption}</T></p>}
      </div>
    </div>
  );
}

/**
 * The whole answer, before the evidence for it. Four columns in scoring order,
 * with the result carrying the accent — it is the column the room came for.
 */
function StarLayout({ slide }: { slide: StarSlide }) {
  const columns = [
    { label: 'Situation', text: slide.situation },
    { label: 'Task', text: slide.task },
    { label: 'Action', text: slide.action },
    { label: 'Result', text: slide.result },
  ];

  return (
    <div className={s.body} style={{ justifyContent: 'center' }}>
      {slide.kicker && <div className={s.label}><T>{slide.kicker}</T></div>}
      <h2 className={cx(s.h2, s.h2Sm)} style={{ marginTop: slide.kicker ? 26 : 0 }}>
        <T>{slide.heading}</T>
      </h2>
      <div className={s.star}>
        {columns.map((column) => (
          <div key={column.label} className={s.starCol} data-result={column.label === 'Result' || undefined}>
            <div className={cx(s.label, s.labelSub, s.starLabel)}>{column.label}</div>
            <p className={s.starText}><T>{column.text}</T></p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Bullets as written, nested up to three levels — beside an annotated screenshot, if there is one. */
function PointsLayout({ slide }: { slide: PointsSlide }) {
  const shots = slide.image ? [slide.image] : slide.images ?? [];

  if (!shots.length) {
    return (
      <div className={s.body}>
        <h2 className={s.h2}><T>{slide.heading}</T></h2>
        <PointList points={slide.points} depth={0} />
      </div>
    );
  }

  const TEXT_MIN = 760;
  const GAP = 64;
  const STACK_GAP = 24;
  // Every shot shares one width: as wide as the column allows while the whole
  // stack still fits the height, and never wider than the shots themselves —
  // beside bullets an image is never enlarged. Whatever width the images give
  // up, the bullets take.
  const tall = shots.reduce((sum, src) => {
    const { w, h } = imageMeta(src);
    return sum + h / w;
  }, 0);
  const widest = Math.max(...shots.map((src) => imageMeta(src).w));
  const mediaW = Math.min(
    AREA.w - TEXT_MIN - GAP,
    (AREA.h - STACK_GAP * (shots.length - 1)) / tall,
    widest,
    slide.imageWidth ?? Infinity,
  );

  return (
    <div className={cx(s.body, s.row)} style={{ gap: GAP }}>
      <div className={s.pointsSide} style={{ flex: `0 0 ${AREA.w - mediaW - GAP}px` }}>
        <h2 className={cx(s.h2, s.h2Sm)}><T>{slide.heading}</T></h2>
        <PointList points={slide.points} depth={0} />
      </div>
      <div className={s.pointsMedia} style={{ gap: STACK_GAP }}>
        {shots.map((src, i) => (
          <Img key={src} src={src} alt={slide.heading} maxW={mediaW} maxH={AREA.h} grow={1}>
            {i === 0 && slide.annotations && <Annotations items={slide.annotations} />}
          </Img>
        ))}
      </div>
    </div>
  );
}

/**
 * Labels drawn on the screenshot itself, the way a screen gets marked up: a dot
 * on the thing, a line, and the label. The lines share one SVG stretched over
 * the image, so their ends land on the same percentages as the dots and labels.
 */
function Annotations({ items }: { items: Annotation[] }) {
  return (
    <>
      <svg className={s.annotationLines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {items.map((a, i) => (
          <line key={i} x1={a.x} y1={a.y} x2={a.labelX} y2={a.labelY} data-tone={a.tone} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {items.map((a, i) => (
        <span key={i} className={s.annotationDot} data-tone={a.tone} style={{ left: `${a.x}%`, top: `${a.y}%` }} aria-hidden />
      ))}
      {items.map((a, i) => (
        <p
          key={i}
          className={s.annotation}
          data-tone={a.tone}
          style={{ left: `${a.labelX}%`, top: `${a.labelY}%`, ...(a.width && { width: a.width, maxWidth: 'none' }) }}
        >
          <T>{a.text}</T>
        </p>
      ))}
    </>
  );
}

function PointList({ points, depth }: { points: Point[]; depth: number }) {
  return (
    <ul className={s.points} data-depth={depth}>
      {points.map((point, i) => (
        <li key={i}>
          <p className={s.point}>
            {point.lead && <><strong>{point.lead}</strong>: </>}
            <T>{point.text}</T>
          </p>
          {point.points?.length ? <PointList points={point.points} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

/** The questions the work had to survive. One press gives the room a beat to answer. */
function QaLayout({ slide, step }: { slide: QaSlide; step: number }) {
  return (
    <div className={s.body}>
      <h2 className={cx(s.h2, s.h2Sm)}><T>{slide.heading}</T></h2>
      {slide.intro && <p className={s.copy} style={{ marginTop: 18, maxWidth: '62ch' }}><T>{slide.intro}</T></p>}
      <div className={s.holes} style={cols(slide.items.length)}>
        {slide.items.map((item, i) => (
          <article key={i} className={s.hole} data-answered={i < step || undefined}>
            <div className={cx(s.label, s.labelSub)}>{`They asked ${pad(i + 1)}`}</div>
            <p className={cx(s.serif, s.holeQ)}><T>{item.q}</T></p>
            <div className={s.holeA} aria-hidden={i >= step}>
              <p className={s.copy}><T>{item.a}</T></p>
            </div>
          </article>
        ))}
      </div>
      {slide.landing && (
        <p className={cx(s.lede, s.holeLanding)} data-on={step >= slide.items.length || undefined}>
          <T>{slide.landing}</T>
        </p>
      )}
    </div>
  );
}

/** Slide copy. Bracketed placeholders render as visibly unfilled. */
function T({ children }: { children?: string }) {
  if (!children) return null;
  return isPlaceholder(children) ? <span className={s.ph}>{children}</span> : <>{children}</>;
}

/**
 * A screenshot fitted inside a slot, at its true aspect ratio. Sized in JS
 * rather than with object-fit so the frame hugs the image — and so callout
 * markers, placed in percentages of the image, land where they were aimed.
 */
function Img({
  src,
  alt,
  maxW,
  maxH,
  grow = 2,
  children,
}: {
  src: string;
  alt: string;
  maxW: number;
  maxH: number;
  /** How far a small image may be enlarged to fill its slot. 1 keeps it at its own size. */
  grow?: number;
  children?: ReactNode;
}) {
  const { live, eager, onZoom } = useContext(Env);
  const { w, h } = imageMeta(src);
  // Up to 2x by default: small crops still fill their slot without turning to mush.
  const scale = Math.min(maxW / w, maxH / h, grow);
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  const label = isPlaceholder(alt) ? '' : alt;

  if (VIDEO.test(src)) {
    return (
      <div className={s.img} style={{ width, height }}>
        <SlideVideo src={src} label={label} live={live} eager={eager} />
        {children}
      </div>
    );
  }

  return (
    <div className={s.img} style={{ width, height }}>
      <Image
        src={src}
        alt={label}
        width={w}
        height={h}
        sizes={`${Math.ceil((width / CANVAS.w) * 100)}vw`}
        loading={eager ? 'eager' : 'lazy'}
        unoptimized={src.endsWith('.svg')}
      />
      {children}
      {live && onZoom && (
        <button
          type="button"
          className={s.zoom}
          onClick={() => onZoom(src, label)}
          aria-label={label ? `Enlarge image: ${label}` : 'Enlarge image'}
        />
      )}
    </div>
  );
}

/**
 * A prototype or interaction recording. Plays muted on loop only while its
 * slide is up, and rewinds when it leaves, so it starts from the top every
 * time you land on it. Elsewhere — thumbnails, neighbours, print — it sits on
 * its first frame.
 */
function SlideVideo({ src, label, live, eager }: { src: string; label: string; live: boolean; eager: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (live) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [live]);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload={eager ? 'auto' : 'metadata'}
      aria-label={label || undefined}
    />
  );
}

function cols(n: number): CSSProperties {
  return { gridTemplateColumns: `repeat(${Math.max(1, n)}, minmax(0, 1fr))` };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function cx(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(' ');
}
