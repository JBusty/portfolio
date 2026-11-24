/**
 * A little cartoon Josh (bald, beard, grey quarter-zip) for canvas scenes.
 * Drawn facing right with his feet at (x, y); `face: -1` flips him.
 */
export type JoshPose = 'stand' | 'walk' | 'run' | 'tired';

export interface JoshOptions {
  face?: 1 | -1;
  /** Gait phase in radians; advance it to animate the legs and arms. */
  phase?: number;
  pose?: JoshPose;
  /** Seconds, for the sweat drops. */
  t?: number;
  sweat?: boolean;
  shadow?: boolean;
  /** Trouser colour; lighter reads better on dark backgrounds. */
  pants?: string;
}

export function drawJosh(g: CanvasRenderingContext2D, x: number, y: number, s: number, o: JoshOptions = {}) {
  const face = o.face ?? 1, ph = o.phase ?? 0, pose = o.pose ?? 'stand', t = o.t ?? 0;
  const INK = 'rgba(27,34,51,.7)', SKIN = '#E2B690', SKIN_D = '#C99873', BEARD = '#2A201B', FL = '#BCC0C7', FL_D = '#80858E', SHOE = '#151B29';
  const PANTS = o.pants ?? '#2C3446', PANTS_F = o.pants ? '#46557A' : '#222837';
  const run = pose === 'run', walk = pose === 'walk', tired = pose === 'tired';
  const amp = run ? 0.95 : walk ? 0.5 : 0;

  g.save();
  g.translate(x, y);
  g.scale(s * face, s);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  if (o.shadow !== false) { g.fillStyle = 'rgba(27,34,51,.16)'; g.beginPath(); g.ellipse(0, 0, 12, 3, 0, 0, 7); g.fill(); }
  g.translate(0, -(run ? 2.4 : walk ? 1.2 : 0) * Math.abs(Math.sin(ph)));

  const limb = (pts: number[][], w: number, col: string) => {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.strokeStyle = INK; g.lineWidth = w + 1.8; g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.stroke();
  };
  const bend = (a: number) => (run ? 0.3 + Math.max(0, -a) * 1.5 : walk ? 0.12 + Math.max(0, -a) * 0.7 : tired ? 0.75 : 0);
  const leg = (a: number, col: string) => {
    const hip = [0, -23], knee = [Math.sin(a) * 12, -23 + Math.cos(a) * 12], sa = a - bend(a);
    const foot = [knee[0] + Math.sin(sa) * 12, knee[1] + Math.cos(sa) * 12];
    limb([hip, knee, foot], 5, col);
    g.fillStyle = SHOE; g.beginPath(); g.ellipse(foot[0] + 2.4, foot[1] - 0.4, 4.6, 2.5, 0, 0, 7); g.fill();
  };
  const la = tired ? 0.38 : Math.sin(ph) * amp, lb = tired ? 0.3 : Math.sin(ph + Math.PI) * amp;
  leg(lb, PANTS_F);
  leg(la, PANTS);

  g.save();
  g.translate(0, -22);
  g.rotate(run ? 0.24 : tired ? 0.6 : walk ? 0.05 : 0);
  const arm = (a: number, be: number, col: string) => {
    const sh = [1, -17], el = [sh[0] + Math.sin(a) * 9.5, sh[1] + Math.cos(a) * 9.5], fa = a + be;
    const hand = [el[0] + Math.sin(fa) * 8.5, el[1] + Math.cos(fa) * 8.5];
    limb([sh, el, hand], 4.4, col);
    g.fillStyle = SKIN; g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.arc(hand[0], hand[1], 2.5, 0, 7); g.fill(); g.stroke();
  };
  const sw = Math.sin(ph) * amp * 1.1;
  arm(tired ? 0.25 : sw, tired ? 0.1 : run ? 1.4 : 0.3, '#9CA0A8');

  // torso: grey quarter-zip
  g.fillStyle = FL; g.strokeStyle = INK; g.lineWidth = 1.2;
  g.beginPath(); g.roundRect(-8, -21, 16, 22, 5.5); g.fill(); g.stroke();
  g.strokeStyle = FL_D; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(3.4, -20.5); g.lineTo(3.4, -12.5); g.stroke();
  g.beginPath(); g.moveTo(-2.5, -21); g.lineTo(3.4, -17.6); g.lineTo(7.4, -20.6); g.stroke();

  // head: bald, dark beard
  const hx = 1.5, hy = -31, hr = 9.6;
  g.fillStyle = SKIN; g.strokeStyle = INK; g.lineWidth = 1.2;
  g.beginPath(); g.arc(hx, hy, hr, 0, 7); g.fill(); g.stroke();
  g.fillStyle = BEARD; g.beginPath();
  g.moveTo(hx - 5.8, hy - 2);
  g.quadraticCurveTo(hx - 6.6, hy + 8.5, hx + 1, hy + 12);
  g.quadraticCurveTo(hx + 8.4, hy + 11.4, hx + 10.2, hy + 3);
  g.lineTo(hx + 9.8, hy + 1);
  g.quadraticCurveTo(hx + 5, hy + 0.6, hx + 2.6, hy + 3);
  g.quadraticCurveTo(hx - 0.4, hy + 0.4, hx - 2.6, hy - 2.6);
  g.closePath(); g.fill();
  g.strokeStyle = '#fff'; g.lineWidth = 1.3; g.beginPath(); g.arc(hx + 6.2, hy + 3.6, 2.2, 0.25, Math.PI - 0.25); g.stroke();
  g.fillStyle = SKIN_D; g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.ellipse(hx - 3.6, hy - 1.8, 2, 2.7, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = BEARD; g.beginPath(); g.arc(hx + 5.8, hy - 2.8, 1.2, 0, 7); g.fill();
  g.strokeStyle = BEARD; g.lineWidth = 1.7; g.beginPath(); g.moveTo(hx + 3.2, hy - 6); g.lineTo(hx + 8.4, hy - 5.4); g.stroke();
  g.fillStyle = SKIN; g.strokeStyle = INK; g.lineWidth = 1; g.beginPath(); g.arc(hx + 9.7, hy - 0.9, 1.8, -1.3, 1.7); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.beginPath(); g.arc(hx - 1.5, hy - 2.5, 5.2, Math.PI * 1.2, Math.PI * 1.45); g.stroke();
  if (o.sweat) {
    for (let k = 0; k < 2; k++) {
      const p = (t * 1.4 + k * 0.5) % 1;
      g.fillStyle = `rgba(150,195,240,${1 - p})`;
      g.beginPath(); g.ellipse(hx - 9 - p * 9, hy - 7 - p * 7 + p * p * 16, 1.4, 2.1, 0.4, 0, 7); g.fill();
    }
  }
  arm(tired ? 0.35 : -sw, tired ? 0.05 : run ? 1.4 : 0.3, FL);
  g.restore();
  g.restore();
}
