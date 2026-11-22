/**
 * Capítulo 4 · El abanico del azar.
 * Izquierda: trayectorias de un paseo aleatorio (±1 € por paso desde 20 €), con la deriva y las
 * bandas ±σ√n y ±2σ√n. Derecha: desviación típica entre trayectorias frente a n en ejes
 * logarítmicos, junto a la recta de pendiente 1/2.
 *
 * Truco de rendimiento: los números aleatorios solo dependen de la semilla; la probabilidad de
 * subida solo decide qué números cuentan como subida.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng } from './rng';
import { linear, pathFrom, areaFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S4 extends Record<string, number> { p: number; n: number; m: number; seed: number }

export const MAX_STEPS = 1000;
export const MAX_PATHS = 500;
export const S0 = 20;
const DRAWN = 100;          // trayectorias dibujadas como mucho (las estadísticas usan todas)

export const stepMean = (p: number) => 2 * p - 1;
export const stepSd = (p: number) => 2 * Math.sqrt(p * (1 - p));

/** Probabilidad exacta de acabar por encima de S0 tras n pasos de ±1 con prob. de subida p. */
export function probAbove(n: number, p: number): number {
  let lc = 0;
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    if (k > 0) lc += Math.log(n - k + 1) - Math.log(k);
    if (2 * k - n > 0) sum += Math.exp(lc + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  return sum;
}

interface Base { seed: number; u: Float32Array }   // MAX_PATHS × MAX_STEPS
let cache: Base | null = null;

function buildBase(seed: number): Base {
  if (cache && cache.seed === seed) return cache;
  const rng = new Rng(seed);
  const u = new Float32Array(MAX_PATHS * MAX_STEPS);
  for (let i = 0; i < u.length; i++) u[i] = rng.uniform();
  cache = { seed, u };
  return cache;
}

export interface D4 {
  n: number;
  m: number;
  mu: number;
  sd: number;
  ts: number[];             // instantes dibujados
  paths: number[][];        // trayectorias dibujadas, en los instantes ts
  sdN: number[];            // n en los que se mide la dispersión (escala log)
  sdObs: number[];          // desviación típica observada entre trayectorias
  finalSd: number;
  above: number;            // fracción de trayectorias por encima de S0 al final
}

export function computeWalk(s: S4): D4 {
  const n = Math.round(s.n);
  const m = Math.round(s.m);
  const { u } = buildBase(s.seed);
  const k = Math.max(1, Math.ceil(n / 300));
  const ts: number[] = [];
  for (let t = 0; t < n; t += k) ts.push(t);
  ts.push(n);
  const sdN: number[] = [];
  for (let e = 0; e <= 40; e++) {
    const v = Math.round(10 ** ((Math.log10(n) * e) / 40));
    if (v >= 1 && v <= n && v !== sdN[sdN.length - 1]) sdN.push(v);
  }
  const sum = new Float64Array(sdN.length);
  const sum2 = new Float64Array(sdN.length);
  const paths: number[][] = [];
  const drawEvery = Math.max(1, Math.floor(m / DRAWN));
  let above = 0;
  for (let j = 0; j < m; j++) {
    const o = j * MAX_STEPS;
    const draw = j % drawEvery === 0 && paths.length < DRAWN;
    const row: number[] = [];
    let x = S0;
    let ti = 0;
    let si = 0;
    if (draw && ts[0] === 0) { row.push(x); ti = 1; }
    for (let t = 1; t <= n; t++) {
      x += u[o + t - 1] < s.p ? 1 : -1;
      if (draw && ts[ti] === t) { row.push(x); ti++; }
      if (sdN[si] === t) { sum[si] += x; sum2[si] += x * x; si++; }
    }
    if (x > S0) above++;
    if (draw) paths.push(row);
  }
  const sdObs = sdN.map((_, i) => (m > 1 ? Math.sqrt(Math.max(0, (sum2[i] - (sum[i] * sum[i]) / m) / (m - 1))) : NaN));
  return { n, m, mu: stepMean(s.p), sd: stepSd(s.p), ts, paths, sdN, sdObs, finalSd: sdObs[sdObs.length - 1], above: above / m };
}

const M = { top: 12, right: 16, bottom: 44, left: 52 };
const eur = (v: number, ctx: ChartCtx, d = 0) => fmtNum(v, d, ctx.fmt) + ' €';
const num = (v: number, ctx: ChartCtx, d = 2) => fmtNum(v, d, ctx.fmt);

export const chart04: ChartDef<S4, D4> = {
  id: 'paseo',
  simulated: true,
  defaults: { p: 0.5, n: 256, m: 200, seed: 11 },
  sliders: [
    { key: 'p', label: 'c4.prob', min: 0.4, max: 0.6, step: 0.01, format: (v, c) => num(v, c, 2) },
    { key: 'n', label: 'c4.steps', min: 10, max: MAX_STEPS, step: 1, format: (v, c) => fmtNum(v, 0, c.fmt) },
    { key: 'm', label: 'c4.paths', min: 1, max: MAX_PATHS, step: 1, format: (v, c) => fmtNum(v, 0, c.fmt) },
  ],
  compute: computeWalk,
  panels: [
    {
      id: 'abanico',
      title: (c) => c.tr('c4.panelLeft'),
      height: () => 320,
      render(d, s, w, ctx) {
        const items = [
          { cls: 'path', label: ctx.tr('c4.legendPaths') },
          { cls: 's1', label: ctx.tr('c4.legendDrift') },
          { cls: 'band', label: ctx.tr('c4.legendBands'), box: true },
        ];
        const h = 320;
        const lh = legendHeight(items, w - M.left - M.right);
        const ts = d.ts;
        const drift = ts.map((t) => S0 + t * d.mu);
        const b1l = ts.map((t, i) => drift[i] - d.sd * Math.sqrt(t));
        const b1h = ts.map((t, i) => drift[i] + d.sd * Math.sqrt(t));
        const b2l = ts.map((t, i) => drift[i] - 2 * d.sd * Math.sqrt(t));
        const b2h = ts.map((t, i) => drift[i] + 2 * d.sd * Math.sqrt(t));
        let lo = Math.min(...b2l);
        let hi = Math.max(...b2h);
        for (const p of d.paths) for (const v of p) { if (v < lo) lo = v; if (v > hi) hi = v; }
        const pad = (hi - lo) * 0.04 + 1;
        const sx = linear([0, d.n], [M.left, w - M.right]);
        const sy = linear([lo - pad, hi + pad], [h - M.bottom, M.top + lh + 8]);
        let paths = '';
        const one = d.paths.length === 1;
        for (const p of d.paths) paths += `<path class="${one ? 's2 line' : 'path'}" d="${pathFrom(ts, p, sx, sy)}"/>`;
        return svgOpen(w, h, ctx.tr('c4.panelLeft'), ctx.tr('c4.descLeft', { m: d.m, n: d.n, sd: num(d.sd * Math.sqrt(d.n), ctx, 1) }), 'c4a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => eur(v, ctx) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('c4.axisSteps') }) +
          `<path class="band" d="${areaFrom(ts, b2l, b2h, sx, sy)}"/>` +
          `<path class="band" d="${areaFrom(ts, b1l, b1h, sx, sy)}"/>` +
          paths +
          `<path class="s1 line thick" d="${pathFrom(ts, drift, sx, sy)}"/>` +
          (d.paths.length < d.m ? `<text class="value-label small" x="${M.left + 6}" y="${h - M.bottom - 8}">${esc(ctx.tr('c4.drawnNote', { k: d.paths.length, m: d.m }))}</text>` : '') +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, d.n], [M.left, w - M.right]);
        const t = Math.round(Math.min(d.n, Math.max(0, sx.invert(xpx))));
        return { x: sx(t), lines: [ctx.tr('c4.afterN', { n: t }), `${ctx.tr('c4.legendDrift')}: ${eur(S0 + t * d.mu, ctx, 1)}`, `σ√n = ${num(d.sd * Math.sqrt(t), ctx, 2)} €`] };
      },
    },
    {
      id: 'raiz',
      title: (c) => c.tr('c4.panelRight'),
      height: () => 320,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's2', label: ctx.tr('c4.legendObs') },
          { cls: 's1', label: ctx.tr('c4.legendSqrt'), dash: true },
        ];
        const h = 320;
        const lh = legendHeight(items, w - M.left - M.right);
        const L = Math.log10;
        const xs = d.sdN.map(L);
        const theo = d.sdN.map((t) => d.sd * Math.sqrt(t));
        const obs = d.sdObs.filter(Number.isFinite);
        const lo = Math.min(...theo, ...(obs.length ? obs.filter((v) => v > 0) : [Infinity])) * 0.7;
        const hi = Math.max(...theo, ...obs) * 1.4;
        const sx = linear([0, L(d.n)], [M.left, w - M.right]);
        const sy = linear([L(lo), L(hi)], [h - M.bottom, M.top + lh + 8]);
        const decs = (a: number, b: number) => { const r: number[] = []; for (const base of [1, 2, 5]) for (let e = Math.floor(L(a)) - 1; e <= Math.ceil(L(b)); e++) { const v = base * 10 ** e; if (v >= a && v <= b) r.push(v); } return r.sort((x, y) => x - y); };
        const xt = decs(1, d.n).filter((v) => [1, 10, 100, 1000].includes(v) || d.n < 100);
        const yt = decs(lo, hi);
        let dots = '';
        d.sdN.forEach((t, i) => { const v = d.sdObs[i]; if (Number.isFinite(v) && v > 0) dots += `<circle class="s2 dot" cx="${r1(sx(L(t)))}" cy="${r1(sy(L(v)))}" r="3.5"/>`; });
        return svgOpen(w, h, ctx.tr('c4.panelRight'), ctx.tr('c4.descRight', { n: d.n, o: Number.isFinite(d.finalSd) ? num(d.finalSd, ctx) : '—', t: num(d.sd * Math.sqrt(d.n), ctx) }), 'c4b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, ticks: yt.map(L), format: (v) => num(10 ** v, ctx, 10 ** v < 1 ? 1 : 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, ticks: xt.map(L), format: (v) => fmtNum(10 ** v, 0, ctx.fmt), label: ctx.tr('c4.axisStepsLog') }) +
          `<path class="s1 line dash" d="${pathFrom(xs, theo.map(L), sx, sy)}"/>` +
          dots +
          (d.m < 2 ? `<text class="value-label small" x="${r1((M.left + w - M.right) / 2)}" y="${r1(h / 2)}" text-anchor="middle">${esc(ctx.tr('c4.needTwo'))}</text>` : '') +
          '</svg>';
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c4.statDrift', { n: d.n }), value: eur(S0 + d.n * d.mu, ctx, 1) },
    { label: ctx.tr('c4.statSdTheory', { n: d.n }), value: `${num(d.sd * Math.sqrt(d.n), ctx)} €` },
    { label: ctx.tr('c4.statSdObs'), value: Number.isFinite(d.finalSd) ? `${num(d.finalSd, ctx)} €` : '—' },
    { label: ctx.tr('c4.statAbove'), value: fmtPct(d.above, 0, ctx.fmt) },
  ],
  describe: (d, s, ctx) => ctx.tr('c4.describe', {
    p: num(s.p, ctx), m: d.m, n: d.n, drift: eur(S0 + d.n * d.mu, ctx, 1), t: num(d.sd * Math.sqrt(d.n), ctx),
    o: Number.isFinite(d.finalSd) ? num(d.finalSd, ctx) : '—', a: fmtPct(d.above, 0, ctx.fmt),
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c4.tableCaption', { m: d.m }),
    head: [ctx.tr('c4.axisSteps'), ctx.tr('c4.legendDrift'), ctx.tr('c4.colTheory'), ctx.tr('c4.colObs')],
    rows: d.sdN.filter((_, i) => i % 4 === 0 || i === d.sdN.length - 1).map((t) => {
      const i = d.sdN.indexOf(t);
      const v = d.sdObs[i];
      return [fmtNum(t, 0, ctx.fmt), eur(S0 + t * d.mu, ctx, 1), `${num(d.sd * Math.sqrt(t), ctx)} €`, Number.isFinite(v) ? `${num(v, ctx)} €` : '—'];
    }),
  }),
};
