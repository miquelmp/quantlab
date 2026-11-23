/**
 * Capítulo 9 · La media engaña.
 * Izquierda: 300 trayectorias de riqueza a 20 años desde 100 € (pasos mensuales, escala
 * logarítmica) con la riqueza media y la mediana entre trayectorias.
 * Derecha: tasa de crecimiento g = μ − σ²/2 frente a la volatilidad, con el corte en σ = √(2μ).
 *
 * Truco de rendimiento: los números aleatorios solo dependen de la semilla; μ y σ los transforman.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng } from './rng';
import { linear, pathFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtPct, fmtNum, fmtEur } from '../lib/format';

export interface S9 extends Record<string, number> { mu: number; sigma: number; seed: number }

export const PATHS = 300;
export const YEARS = 20;
const STEPS = 12 * YEARS;
const DRAWN = 80;
const W0 = 100;

export const growthRate = (mu: number, sigma: number) => mu - 0.5 * sigma * sigma;
export const zeroGrowthVol = (mu: number) => Math.sqrt(2 * mu);

let cache: { seed: number; z: Float64Array } | null = null;
function normals(seed: number): Float64Array {
  if (cache && cache.seed === seed) return cache.z;
  const rng = new Rng(seed);
  const z = new Float64Array(PATHS * STEPS);
  for (let i = 0; i < z.length; i++) z[i] = rng.normal();
  cache = { seed, z };
  return z;
}

export interface D9 {
  t: number[];            // años en los que se guarda (cada 3 meses)
  drawn: number[][];      // log10 de la riqueza de las trayectorias dibujadas
  mean: number[];         // riqueza media entre las 300 trayectorias
  median: number[];
  below: number;          // fracción de trayectorias por debajo de 100 € al final
  g: number;
}

export function computeDrag(s: S9): D9 {
  const z = normals(s.seed);
  const dt = 1 / 12;
  const drift = (s.mu - 0.5 * s.sigma * s.sigma) * dt;
  const vol = s.sigma * Math.sqrt(dt);
  const keep: number[] = [];
  for (let k = 0; k <= STEPS; k += 3) keep.push(k);
  const cols = keep.length;
  const logw = new Float64Array(PATHS * cols);
  for (let j = 0; j < PATHS; j++) {
    let x = Math.log(W0);
    let c = 0;
    logw[j * cols + c++] = x;
    for (let k = 1; k <= STEPS; k++) {
      x += drift + vol * z[j * STEPS + k - 1];
      if (k % 3 === 0) logw[j * cols + c++] = x;
    }
  }
  const mean: number[] = [];
  const median: number[] = [];
  const col = new Float64Array(PATHS);
  for (let c = 0; c < cols; c++) {
    let sum = 0;
    for (let j = 0; j < PATHS; j++) { col[j] = logw[j * cols + c]; sum += Math.exp(col[j]); }
    mean.push(sum / PATHS);
    col.sort();
    median.push(Math.exp((col[PATHS / 2 - 1] + col[PATHS / 2]) / 2));
  }
  let below = 0;
  for (let j = 0; j < PATHS; j++) if (logw[j * cols + cols - 1] < Math.log(W0)) below++;
  const drawn: number[][] = [];
  const every = Math.floor(PATHS / DRAWN);
  for (let j = 0; j < PATHS && drawn.length < DRAWN; j += every) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) row.push(logw[j * cols + c] / Math.LN10);
    drawn.push(row);
  }
  return { t: keep.map((k) => k / 12), drawn, mean, median, below: below / PATHS, g: growthRate(s.mu, s.sigma) };
}

const M = { top: 12, right: 16, bottom: 44, left: 56 };
const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const eur = (v: number, ctx: ChartCtx) => fmtEur(v, 0, ctx.fmt);
const last = (a: number[]) => a[a.length - 1];

export const chart09: ChartDef<S9, D9> = {
  id: 'lastre',
  simulated: true,
  defaults: { mu: 0.08, sigma: 0.3, seed: 9 },
  sliders: [
    { key: 'mu', label: 'c9.mu', min: 0, max: 0.15, step: 0.005, format: (v, c) => pct(v, c, 1) },
    { key: 'sigma', label: 'c9.sigma', min: 0, max: 0.6, step: 0.01, format: (v, c) => pct(v, c, 0) },
  ],
  compute: computeDrag,
  panels: [
    {
      id: 'trayectorias',
      title: (c) => c.tr('c9.panelLeft'),
      height: () => 340,
      render(d, s, w, ctx) {
        const items = [
          { cls: 'path', label: ctx.tr('c9.legendPaths') },
          { cls: 's2', label: ctx.tr('c9.legendMean') },
          { cls: 's1', label: ctx.tr('c9.legendMedian') },
        ];
        const h = panelH(w, 340);
        const lh = legendHeight(items, w - M.left - M.right);
        const L = Math.log10;
        let lo = Infinity;
        let hi = -Infinity;
        for (const p of d.drawn) for (const v of p) { if (v < lo) lo = v; if (v > hi) hi = v; }
        for (const v of d.mean) { lo = Math.min(lo, L(v)); hi = Math.max(hi, L(v)); }
        lo = Math.min(lo, L(W0) - 0.1);
        hi = Math.max(hi, L(W0) + 0.1);
        const sx = linear([0, YEARS], [M.left, w - M.right]);
        const sy = linear([lo, hi], [h - M.bottom, M.top + lh + 8]);
        const ticks: number[] = [];
        for (let e = Math.floor(lo); e <= Math.ceil(hi); e++) for (const m of [1, 3]) { const v = m * 10 ** e; if (L(v) >= lo && L(v) <= hi) ticks.push(L(v)); }
        let paths = '';
        for (const p of d.drawn) paths += `<path class="path" d="${pathFrom(d.t, p, sx, sy)}"/>`;
        return svgOpen(w, h, ctx.tr('c9.panelLeft'), ctx.tr('c9.descLeft', { mean: eur(last(d.mean), ctx), med: eur(last(d.median), ctx), b: pct(d.below, ctx, 0) }), 'c9a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, ticks, format: (v) => eur(10 ** v, ctx) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, ticks: [0, 5, 10, 15, 20], label: ctx.tr('c9.axisYears') }) +
          `<line class="ref" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(L(W0)))}" y2="${r1(sy(L(W0)))}"/>` +
          paths +
          `<path class="s2 line thick" d="${pathFrom(d.t, d.mean.map(L), sx, sy)}"/>` +
          `<path class="s1 line thick" d="${pathFrom(d.t, d.median.map(L), sx, sy)}"/>` +
          `<text class="value-label" x="${r1(w - M.right - 4)}" y="${r1(sy(L(last(d.mean))) - 8)}" text-anchor="end">${esc(eur(last(d.mean), ctx))}</text>` +
          `<text class="value-label" x="${r1(w - M.right - 4)}" y="${r1(sy(L(last(d.median))) + 18)}" text-anchor="end">${esc(eur(last(d.median), ctx))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, YEARS], [M.left, w - M.right]);
        const x = Math.min(YEARS, Math.max(0, sx.invert(xpx)));
        const i = Math.round(x * 4);
        return { x: sx(d.t[i]), lines: [ctx.tr('c9.yearN', { y: fmtNum(d.t[i], 1, ctx.fmt) }), `${ctx.tr('c9.legendMean')}: ${eur(d.mean[i], ctx)}`, `${ctx.tr('c9.legendMedian')}: ${eur(d.median[i], ctx)}`] };
      },
    },
    {
      id: 'parabola',
      title: (c) => c.tr('c9.panelRight'),
      height: () => 340,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('c9.legendG', { mu: pct(s.mu, ctx) }) },
          { cls: 'neg', label: ctx.tr('c9.legendNeg'), box: true },
        ];
        const h = panelH(w, 340);
        const lh = legendHeight(items, w - M.left - M.right);
        const xs: number[] = [];
        for (let i = 0; i <= 120; i++) xs.push((0.6 * i) / 120);
        const ys = xs.map((x) => growthRate(s.mu, x));
        const lo = Math.min(-0.05, growthRate(s.mu, 0.6));
        const hi = Math.max(0.05, s.mu) * 1.15;
        const sx = linear([0, 0.6], [M.left, w - M.right]);
        const sy = linear([lo, hi], [h - M.bottom, M.top + lh + 8]);
        const zc = zeroGrowthVol(s.mu);
        const px = sx(s.sigma);
        const py = sy(d.g);
        return svgOpen(w, h, ctx.tr('c9.panelRight'), ctx.tr('c9.descRight', { mu: pct(s.mu, ctx), s: pct(s.sigma, ctx, 0), g: pct(d.g, ctx, 2), z: pct(zc, ctx, 1) }), 'c9b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          `<rect class="neg-zone" x="${M.left}" y="${r1(sy(0))}" width="${r1(w - M.right - M.left)}" height="${r1(sy(lo) - sy(0))}"/>` +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('c9.sigma') }) +
          `<line class="zero" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
          `<path class="s1 line thick" d="${pathFrom(xs, ys, sx, sy)}"/>` +
          (zc <= 0.6 && zc > 0 ? `<line class="guide" x1="${r1(sx(zc))}" x2="${r1(sx(zc))}" y1="${r1(sy(0))}" y2="${r1(h - M.bottom)}"/>` +
            `<text class="value-label small" x="${r1(sx(zc) + 6)}" y="${r1(sy(0) - 8)}">${esc(ctx.tr('c9.zeroLabel', { z: pct(zc, ctx, 1) }))}</text>` : '') +
          `<circle class="s2 dot" cx="${r1(px)}" cy="${r1(py)}" r="6"/>` +
          `<text class="value-label" x="${r1(px + (px > w * 0.6 ? -10 : 10))}" y="${r1(py - 10)}" text-anchor="${px > w * 0.6 ? 'end' : 'start'}">${esc(`g = ${pct(d.g, ctx, 2)}`)}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, 0.6], [M.left, w - M.right]);
        const x = Math.min(0.6, Math.max(0, sx.invert(xpx)));
        return { x: sx(x), lines: [`σ = ${pct(x, ctx, 1)}`, `g = ${pct(growthRate(s.mu, x), ctx, 2)}`] };
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c9.statG'), value: pct(d.g, ctx, 2) },
    { label: ctx.tr('c9.statMean'), value: eur(W0 * Math.exp(s.mu * YEARS), ctx), note: ctx.tr('c9.simNote', { v: eur(last(d.mean), ctx) }) },
    { label: ctx.tr('c9.statMedian'), value: eur(W0 * Math.exp(d.g * YEARS), ctx), note: ctx.tr('c9.simNote', { v: eur(last(d.median), ctx) }) },
    { label: ctx.tr('c9.statBelow'), value: pct(d.below, ctx, 0) },
  ],
  describe: (d, s, ctx) => ctx.tr('c9.describe', {
    mu: pct(s.mu, ctx), s: pct(s.sigma, ctx, 0), g: pct(d.g, ctx, 2), mean: eur(W0 * Math.exp(s.mu * YEARS), ctx),
    med: eur(W0 * Math.exp(d.g * YEARS), ctx), b: pct(d.below, ctx, 0), z: pct(zeroGrowthVol(s.mu), ctx, 1),
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c9.tableCaption', { mu: pct(s.mu, ctx) }),
    head: [ctx.tr('c9.sigma'), ctx.tr('c9.statG'), ctx.tr('c9.statMedian')],
    rows: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((v) => [pct(v, ctx, 0), pct(growthRate(s.mu, v), ctx, 2), eur(W0 * Math.exp(growthRate(s.mu, v) * YEARS), ctx)]),
  }),
};
