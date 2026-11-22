/**
 * Capítulo 3 · El juego de los dos dados.
 * Izquierda: ganancia acumulada de 50 jugadores y la recta de la ganancia esperada n·E.
 * Derecha: ganancia media por jugada de un jugador, con la banda E ± 2σ/√n.
 *
 * Truco de rendimiento: los dados solo dependen de la semilla. Se guarda, para cada jugador y
 * jugada, cuántas veces ha ganado (W); la ganancia con cualquier premio es W·premio − (n − W).
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng } from './rng';
import { linear, pathFrom, areaFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S3 extends Record<string, number> { n: number; prize: number; seed: number }

export const PLAYERS = 50;
export const MAX_N = 5000;
export const P_WIN = 1 / 6;
const STAKE = 1;

/** Ganancia esperada por jugada: premio/6 − 5/6. */
export const expectedGain = (prize: number) => P_WIN * prize - (1 - P_WIN) * STAKE;
export const sdGain = (prize: number) => Math.sqrt(P_WIN * (1 - P_WIN)) * (prize + STAKE);

/** Probabilidad exacta (binomial) de ir ganando tras n jugadas: P(W·premio − (n−W) > 0). */
export function probAhead(n: number, prize: number): number {
  const kMin = Math.floor((n * STAKE) / (prize + STAKE)) + 1;   // W > n/(premio+1)
  if (kMin > n) return 0;
  const lp = Math.log(P_WIN);
  const lq = Math.log(1 - P_WIN);
  // log C(n,k) acumulado de forma incremental
  let lc = 0;
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    if (k > 0) lc += Math.log(n - k + 1) - Math.log(k);
    if (k >= kMin) sum += Math.exp(lc + k * lp + (n - k) * lq);
  }
  return Math.min(1, sum);
}

interface Base { seed: number; wins: Uint16Array }   // PLAYERS × (MAX_N + 1)
let cache: Base | null = null;

function buildBase(seed: number): Base {
  if (cache && cache.seed === seed) return cache;
  const rng = new Rng(seed);
  const wins = new Uint16Array(PLAYERS * (MAX_N + 1));
  for (let j = 0; j < PLAYERS; j++) {
    const o = j * (MAX_N + 1);
    let w = 0;
    for (let t = 1; t <= MAX_N; t++) {
      const a = 1 + Math.floor(rng.uniform() * 6);
      const b = 1 + Math.floor(rng.uniform() * 6);
      if (a + b === 7) w++;
      wins[o + t] = w;
    }
  }
  cache = { seed, wins };
  return cache;
}

export interface D3 {
  base: Base;
  E: number;
  sd: number;
  ahead: number;          // fracción de los 50 jugadores que va ganando tras n jugadas
  theoryAhead: number;
  mean0: number;          // ganancia media por jugada del jugador 1 tras n jugadas
}

const gainOf = (w: number, t: number, prize: number) => w * prize - (t - w) * STAKE;

export function computeDice(s: S3): D3 {
  const base = buildBase(s.seed);
  const n = Math.round(s.n);
  let ahead = 0;
  for (let j = 0; j < PLAYERS; j++) if (gainOf(base.wins[j * (MAX_N + 1) + n], n, s.prize) > 0) ahead++;
  return {
    base,
    E: expectedGain(s.prize),
    sd: sdGain(s.prize),
    ahead: ahead / PLAYERS,
    theoryAhead: probAhead(n, s.prize),
    mean0: gainOf(base.wins[n], n, s.prize) / n,
  };
}

/** Instantes en los que se dibuja cada línea (como mucho ~400 puntos). */
function steps(n: number): number[] {
  const k = Math.max(1, Math.ceil(n / 400));
  const out: number[] = [];
  for (let t = 0; t < n; t += k) out.push(t);
  out.push(n);
  return out;
}

const M = { top: 12, right: 16, bottom: 44, left: 56 };
const eur = (v: number, ctx: ChartCtx, d = 0) => fmtNum(v, d, ctx.fmt) + ' €';
const pct = (v: number, ctx: ChartCtx, d = 0) => fmtPct(v, d, ctx.fmt);

export const chart03: ChartDef<S3, D3> = {
  id: 'dados',
  simulated: true,
  defaults: { n: 1000, prize: 4, seed: 3 },
  sliders: [
    { key: 'n', label: 'c3.plays', min: 1, max: MAX_N, step: 1, format: (v, c) => fmtNum(v, 0, c.fmt) },
    { key: 'prize', label: 'c3.prize', min: 2, max: 8, step: 0.5, format: (v, c) => eur(v, c, v % 1 ? 1 : 0) },
  ],
  compute: computeDice,
  panels: [
    {
      id: 'acumulada',
      title: (c) => c.tr('c3.panelLeft'),
      height: () => 320,
      render(d, s, w, ctx) {
        const n = Math.round(s.n);
        const items = [
          { cls: 'path', label: ctx.tr('c3.legendPlayers') },
          { cls: 's1', label: ctx.tr('c3.legendExpected') },
        ];
        const h = 320;
        const lh = legendHeight(items, w - M.left - M.right);
        const ts = steps(n);
        let lo = Math.min(0, n * d.E);
        let hi = Math.max(0, n * d.E);
        const ys: number[][] = [];
        for (let j = 0; j < PLAYERS; j++) {
          const o = j * (MAX_N + 1);
          const y = ts.map((t) => gainOf(d.base.wins[o + t], t, s.prize));
          for (const v of y) { if (v < lo) lo = v; if (v > hi) hi = v; }
          ys.push(y);
        }
        if (hi - lo < 4) { hi += 2; lo -= 2; }
        const sx = linear([0, Math.max(1, n)], [M.left, w - M.right]);
        const sy = linear([lo, hi], [h - M.bottom, M.top + lh + 8]);
        let paths = '';
        for (const y of ys) paths += `<path class="path" d="${pathFrom(ts, y, sx, sy)}"/>`;
        const label = ctx.tr('c3.aheadLabel', { p: pct(d.ahead, ctx) });
        return svgOpen(w, h, ctx.tr('c3.panelLeft'), ctx.tr('c3.descLeft', { n: fmtNum(n, 0, ctx.fmt), p: pct(d.ahead, ctx), e: eur(n * d.E, ctx) }), 'c3a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => eur(v, ctx) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('c3.axisPlays') }) +
          `<line class="zero" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
          paths +
          `<path class="s1 line thick" d="M${r1(sx(0))},${r1(sy(0))}L${r1(sx(n))},${r1(sy(n * d.E))}"/>` +
          `<text class="value-label" x="${M.left + 8}" y="${r1(M.top + lh + 26)}">${esc(label)}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const n = Math.round(s.n);
        const sx = linear([0, Math.max(1, n)], [M.left, w - M.right]);
        const t = Math.round(Math.min(n, Math.max(1, sx.invert(xpx))));
        let ahead = 0;
        for (let j = 0; j < PLAYERS; j++) if (gainOf(d.base.wins[j * (MAX_N + 1) + t], t, s.prize) > 0) ahead++;
        return { x: sx(t), lines: [ctx.tr('c3.afterN', { n: fmtNum(t, 0, ctx.fmt) }), `${ctx.tr('c3.legendExpected')}: ${eur(t * d.E, ctx, 2)}`, ctx.tr('c3.aheadLabel', { p: pct(ahead / PLAYERS, ctx) })] };
      },
    },
    {
      id: 'media',
      title: (c) => c.tr('c3.panelRight'),
      height: () => 320,
      render(d, s, w, ctx) {
        const n = Math.round(s.n);
        const items = [
          { cls: 's2', label: ctx.tr('c3.legendMean') },
          { cls: 's1', label: ctx.tr('c3.legendE', { e: eur(d.E, ctx, 3) }), dash: true },
          { cls: 'band', label: ctx.tr('c3.legendBand'), box: true },
        ];
        const h = 320;
        const lh = legendHeight(items, w - M.left - M.right);
        const ts = steps(n).filter((t) => t >= 1);
        // Escala vertical centrada en E: muestra la banda desde ~10 jugadas; lo de antes se recorta.
        const half = (2 * d.sd) / Math.sqrt(10) + 0.1;
        const lo = d.E - half;
        const hi = d.E + half;
        const clamp = (v: number) => Math.min(hi, Math.max(lo, v));
        const mean = ts.map((t) => clamp(gainOf(d.base.wins[t], t, s.prize) / t));
        const bLo = ts.map((t) => clamp(d.E - (2 * d.sd) / Math.sqrt(t)));
        const bHi = ts.map((t) => clamp(d.E + (2 * d.sd) / Math.sqrt(t)));
        const sx = linear([0, Math.max(1, n)], [M.left, w - M.right]);
        const sy = linear([lo, hi], [h - M.bottom, M.top + lh + 8]);
        const px = sx(n);
        return svgOpen(w, h, ctx.tr('c3.panelRight'), ctx.tr('c3.descRight', { n: fmtNum(n, 0, ctx.fmt), m: eur(d.mean0, ctx, 3), e: eur(d.E, ctx, 3) }), 'c3b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => eur(v, ctx, 2) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('c3.axisPlays') }) +
          (ts.length > 1 ? `<path class="band" d="${areaFrom(ts, bLo, bHi, sx, sy)}"/>` : '') +
          (lo < 0 && hi > 0 ? `<line class="zero" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` : '') +
          `<path class="s1 line dash" d="M${r1(sx(0))},${r1(sy(d.E))}L${r1(sx(n))},${r1(sy(d.E))}"/>` +
          `<path class="s2 line" d="${pathFrom(ts, mean, sx, sy)}"/>` +
          `<circle class="s2 dot" cx="${r1(px)}" cy="${r1(sy(clamp(d.mean0)))}" r="5"/>` +
          `<text class="value-label" x="${r1(px - 8)}" y="${r1(sy(clamp(d.mean0)) - 10)}" text-anchor="end">${esc(eur(d.mean0, ctx, 3))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const n = Math.round(s.n);
        const sx = linear([0, Math.max(1, n)], [M.left, w - M.right]);
        const t = Math.round(Math.min(n, Math.max(1, sx.invert(xpx))));
        const m = gainOf(d.base.wins[t], t, s.prize) / t;
        return { x: sx(t), lines: [ctx.tr('c3.afterN', { n: fmtNum(t, 0, ctx.fmt) }), `${ctx.tr('c3.legendMean')}: ${eur(m, ctx, 3)}`, `${ctx.tr('c3.legendBand')}: ${eur(d.E - (2 * d.sd) / Math.sqrt(t), ctx, 2)} … ${eur(d.E + (2 * d.sd) / Math.sqrt(t), ctx, 2)}`] };
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c3.statE'), value: eur(d.E, ctx, 3) },
    { label: ctx.tr('c3.statAhead', { n: fmtNum(Math.round(s.n), 0, ctx.fmt) }), value: pct(d.ahead, ctx), note: ctx.tr('c3.theoryNote', { p: pct(d.theoryAhead, ctx, d.theoryAhead < 0.01 ? 2 : 1) }) },
    { label: ctx.tr('c3.statMean'), value: eur(d.mean0, ctx, 3) },
  ],
  describe: (d, s, ctx) => ctx.tr('c3.describe', {
    prize: eur(s.prize, ctx, s.prize % 1 ? 1 : 0), e: eur(d.E, ctx, 3), n: fmtNum(Math.round(s.n), 0, ctx.fmt),
    p: pct(d.ahead, ctx), t: pct(d.theoryAhead, ctx, d.theoryAhead < 0.01 ? 2 : 1), m: eur(d.mean0, ctx, 3),
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c3.tableCaption', { prize: eur(s.prize, ctx, s.prize % 1 ? 1 : 0) }),
    head: [ctx.tr('c3.axisPlays'), ctx.tr('c3.colExpected'), ctx.tr('c3.colAhead'), ctx.tr('c3.colTheory')],
    rows: [1, 10, 100, 500, 1000, 2000, 5000].map((t) => {
      let a = 0;
      for (let j = 0; j < PLAYERS; j++) if (gainOf(d.base.wins[j * (MAX_N + 1) + t], t, s.prize) > 0) a++;
      const th = probAhead(t, s.prize);
      return [fmtNum(t, 0, ctx.fmt), eur(t * d.E, ctx, 2), pct(a / PLAYERS, ctx), pct(th, ctx, th < 0.01 ? 2 : 1)];
    }),
  }),
};
