/**
 * Capítulo 6 · Un laboratorio de futuros.
 * Arriba: estimación de π con puntos al azar y su banda de ±2 errores estándar.
 * Abajo: plan de ahorro simulado (10.000 € a 20 años, rentabilidad logarítmica normal).
 *
 * Para que mover un deslizador sea instantáneo, los números aleatorios dependen solo de la
 * semilla, del número de escenarios y del horizonte; la media y la volatilidad solo
 * transforman esos números (riqueza = W0·exp(μt + σ·S_t), con S_t suma de normales).
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng, normCdf, quantileSorted } from './rng';
import { linear, pathFrom, areaFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtPct, fmtEur, fmtNum, withEur } from '../lib/format';

export interface S6 extends Record<string, number> { mu: number; sigma: number; years: number; M: number; seed: number }

export const W0 = 10_000;
export const N_PATHS = 200;
const Z_P10 = 1.2815515655446004;

interface Base {
  key: string;
  M: number; T: number;
  S: Float64Array[];          // S[t][m] = suma de t normales del escenario m (t = 1..T), sin ordenar
  sorted: Float64Array[];     // S[t] ordenado
  piX: Float32Array; piY: Float32Array; piIn: Uint8Array; piEst: Float64Array;
}

export interface D6 {
  base: Base;
  q10: number[]; q50: number[]; q90: number[];  // riqueza por año (0..T)
  probLoss: number; seLoss: number;
  meanFinal: number;
  theory: { median: number; p10: number; p90: number; probLoss: number; mean: number };
  piHat: number; piSe: number;
  piShown?: number;           // puntos dibujados (animación en el navegador)
  useCanvas?: boolean;
}

let cache: Base | null = null;

function buildBase(seed: number, M: number, T: number): Base {
  const key = `${seed}|${M}|${T}`;
  if (cache && cache.key === key) return cache;
  const rng = new Rng(seed);
  const S: Float64Array[] = [new Float64Array(M)];
  for (let t = 1; t <= T; t++) S.push(new Float64Array(M));
  for (let m = 0; m < M; m++) {
    let acc = 0;
    for (let t = 1; t <= T; t++) { acc += rng.normal(); S[t][m] = acc; }
  }
  const sorted = S.map((a) => Float64Array.from(a).sort());
  // π: flujo aleatorio independiente del plan de ahorro.
  const prng = new Rng((seed * 2654435761) ^ 0x5bd1e995);
  const piX = new Float32Array(M);
  const piY = new Float32Array(M);
  const piIn = new Uint8Array(M);
  const piEst = new Float64Array(M);
  let inside = 0;
  for (let i = 0; i < M; i++) {
    const x = prng.uniform();
    const y = prng.uniform();
    piX[i] = x; piY[i] = y;
    if (x * x + y * y <= 1) { piIn[i] = 1; inside++; }
    piEst[i] = (4 * inside) / (i + 1);
  }
  cache = { key, M, T, S, sorted, piX, piY, piIn, piEst };
  return cache;
}

function lowerCount(sorted: Float64Array, x: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] < x) lo = mid + 1; else hi = mid; }
  return lo;
}

export function computeMC(s: S6): D6 {
  const T = Math.round(s.years);
  const M = Math.round(s.M);
  const base = buildBase(Math.round(s.seed), M, T);
  const q10: number[] = []; const q50: number[] = []; const q90: number[] = [];
  for (let t = 0; t <= T; t++) {
    const so = base.sorted[t];
    q10.push(W0 * Math.exp(s.mu * t + s.sigma * quantileSorted(so, 0.1)));
    q50.push(W0 * Math.exp(s.mu * t + s.sigma * quantileSorted(so, 0.5)));
    q90.push(W0 * Math.exp(s.mu * t + s.sigma * quantileSorted(so, 0.9)));
  }
  // Pérdida: W_T < W0  ⇔  μT + σ S_T < 0  ⇔  S_T < −μT/σ
  const thr = s.sigma > 0 ? (-s.mu * T) / s.sigma : (s.mu < 0 ? Infinity : -Infinity);
  const probLoss = lowerCount(base.sorted[T], thr) / M;
  const seLoss = Math.sqrt((probLoss * (1 - probLoss)) / M);
  let sum = 0;
  const fin = base.S[T];
  for (let m = 0; m < M; m++) sum += Math.exp(s.mu * T + s.sigma * fin[m]);
  const sd = s.sigma * Math.sqrt(T);
  const theory = {
    median: W0 * Math.exp(s.mu * T),
    p10: W0 * Math.exp(s.mu * T - Z_P10 * sd),
    p90: W0 * Math.exp(s.mu * T + Z_P10 * sd),
    probLoss: sd > 0 ? normCdf((-s.mu * T) / sd) : (s.mu < 0 ? 1 : 0),
    mean: W0 * Math.exp(s.mu * T + (sd * sd) / 2),
  };
  const piHat = base.piEst[M - 1];
  const p = Math.PI / 4;
  return {
    base, q10, q50, q90, probLoss, seLoss, meanFinal: (W0 * sum) / M, theory,
    piHat, piSe: 4 * Math.sqrt((p * (1 - p)) / M),
  };
}

/** Riqueza del escenario m en el año t. */
function wealth(d: D6, s: S6, m: number, t: number): number {
  return W0 * Math.exp(s.mu * t + s.sigma * d.base.S[t][m]);
}

const pct = (v: number, c: ChartCtx, k = 1) => fmtPct(v, k, c.fmt);
const eur = (v: number, c: ChartCtx) => fmtEur(v, 0, c.fmt);

function compactEur(v: number, c: ChartCtx): string {
  if (v >= 1e6) return withEur(fmtNum(v / 1e6, 1, c.fmt), c.fmt, 'M');
  if (v >= 1e3) return withEur(fmtNum(v / 1e3, 0, c.fmt), c.fmt, 'k');
  return withEur(fmtNum(v, 0, c.fmt), c.fmt);
}

const MS = { top: 10, right: 12, bottom: 40, left: 40 };

function scatterPanel(d: D6, s: S6, w: number, ctx: ChartCtx): string {
  const size = Math.min(w, panelH(w, 340) < 340 ? 250 : 340);
  const h = size;
  const ox = (w - size) / 2 + 30;
  const inner = size - 52;
  const sx = linear([0, 1], [ox, ox + inner]);
  const sy = linear([0, 1], [10 + inner, 10]);
  const shown = Math.min(d.piShown ?? d.base.M, d.base.M);
  let arc = `M${r1(sx(0))},${r1(sy(1))}`;
  for (let i = 0; i <= 60; i++) { const a = (Math.PI / 2) * (i / 60); arc += `L${r1(sx(Math.sin(a)))},${r1(sy(Math.cos(a)))}`; }
  let inP = '';
  let outP = '';
  if (!d.useCanvas) {
    const lim = Math.min(shown, 3000);
    for (let i = 0; i < lim; i++) {
      const seg = `M${r1(sx(d.base.piX[i]))},${r1(sy(d.base.piY[i]))}h1.6v1.6h-1.6z`;
      if (d.base.piIn[i]) inP += seg; else outP += seg;
    }
  }
  return svgOpen(w, h, ctx.tr('c6.panelPi'), ctx.tr('c6.descPi', { n: fmtNum(shown, 0, ctx.fmt), pi: fmtNum(d.base.piEst[Math.max(0, shown - 1)], 3, ctx.fmt) }), 'c6a') +
    `<rect class="frame" x="${r1(sx(0))}" y="${r1(sy(1))}" width="${r1(inner)}" height="${r1(inner)}"/>` +
    (d.useCanvas ? '' : `<path class="pt-in" d="${inP}"/><path class="pt-out" d="${outP}"/>`) +
    `<path class="arc" d="${arc}"/>` +
    axisX(sx, 10 + inner, 10, { fmt: ctx.fmt, ticks: [0, 0.5, 1] }) +
    axisY(sy, ox, ox + inner, { fmt: ctx.fmt, ticks: [0, 0.5, 1], grid: false }) +
    `<text class="value-label" x="${r1(ox + inner)}" y="${h - 4}" text-anchor="end">${esc(ctx.tr('c6.piLegend'))}</text>` +
    '</svg>';
}

function piPanel(d: D6, s: S6, w: number, ctx: ChartCtx): string {
  const h = panelH(w, 300);
  const M = d.base.M;
  const shown = Math.min(d.piShown ?? M, M);
  const items = [
    { cls: 's1', label: ctx.tr('c6.piEstimate') },
    { cls: 'band', label: ctx.tr('c6.piBand'), box: true },
    { cls: 'muted', label: 'π', dash: true },
  ];
  const lh = legendHeight(items, w - MS.left - MS.right - 20);
  const lx = (n: number) => Math.log10(n);
  const sx = linear([1, lx(M)], [MS.left + 12, w - MS.right]);
  const sy = linear([2.4, 3.9], [h - MS.bottom, MS.top + lh + 10]);
  const xs: number[] = []; const lo: number[] = []; const hi: number[] = []; const est: number[] = [];
  const p = Math.PI / 4;
  const steps = 240;
  for (let i = 0; i <= steps; i++) {
    const n = Math.round(10 ** (1 + ((lx(M) - 1) * i) / steps));
    const se = 4 * Math.sqrt((p * (1 - p)) / n);
    xs.push(lx(n)); lo.push(Math.max(2.4, Math.PI - 2 * se)); hi.push(Math.min(3.9, Math.PI + 2 * se));
    est.push(n <= shown ? Math.min(3.9, Math.max(2.4, d.base.piEst[n - 1])) : NaN);
  }
  const tk = [1, 2, 3, 4, 5].filter((k) => k <= lx(M) + 1e-9);
  return svgOpen(w, h, ctx.tr('c6.panelEst'), ctx.tr('c6.descEst'), 'c6b') +
    legend(items, MS.left + 12, MS.top + 10, w - MS.left - MS.right - 20) +
    axisY(sy, MS.left + 12, w - MS.right, { fmt: ctx.fmt, ticks: [2.5, 2.75, 3, 3.25, 3.5, 3.75], format: (v) => fmtNum(v, 2, ctx.fmt) }) +
    axisX(sx, h - MS.bottom, MS.top, { fmt: ctx.fmt, ticks: tk, format: (v) => fmtNum(10 ** v, 0, ctx.fmt), label: ctx.tr('c6.axisPoints') }) +
    `<path class="band" d="${areaFrom(xs, lo, hi, sx, sy)}"/>` +
    `<line class="muted dash line" x1="${r1(sx.range[0])}" x2="${r1(sx.range[1])}" y1="${r1(sy(Math.PI))}" y2="${r1(sy(Math.PI))}"/>` +
    `<path class="s1 line" d="${pathFrom(xs, est, sx, sy)}"/>` +
    '</svg>';
}

function savingsPanel(d: D6, s: S6, w: number, ctx: ChartCtx): string {
  const h = panelH(w, 400) < 400 ? 240 : Math.max(320, Math.min(400, w * 0.55));
  const T = d.base.T;
  const M = d.base.M;
  const items = [
    { cls: 'path', label: ctx.tr('c6.paths', { n: Math.min(N_PATHS, M) }) },
    { cls: 's1', label: ctx.tr('c6.median') },
    { cls: 's2', label: ctx.tr('c6.p1090'), dash: true },
    { cls: 'neg', label: ctx.tr('c6.lossZone'), box: true },
  ];
  const histW = Math.max(60, Math.min(120, w * 0.18));
  const plotR = w - MS.right - histW - 8;
  const left = 58;
  const lh = legendHeight(items, w - left - MS.right);
  const finals = d.base.S[T];
  const ymax = Math.max(d.q90[T] * 1.5, W0 * 1.5);
  const sx = linear([0, T], [left, plotR]);
  const sy = linear([0, ymax], [h - MS.bottom, MS.top + lh + 10]);
  const years = Array.from({ length: T + 1 }, (_, t) => t);
  let paths = '';
  const np = Math.min(N_PATHS, M);
  for (let m = 0; m < np; m++) {
    const ys = years.map((t) => wealth(d, s, m, t));
    paths += pathFrom(years, ys.map((y) => Math.min(y, ymax * 1.02)), sx, sy);
  }
  // Histograma lateral de la riqueza final (mismo eje vertical).
  const nb = 28;
  const bins = new Array(nb).fill(0);
  let above = 0;
  for (let m = 0; m < M; m++) {
    const v = W0 * Math.exp(s.mu * T + s.sigma * finals[m]);
    const b = Math.floor((v / ymax) * nb);
    if (b >= nb) above++; else bins[b]++;
  }
  const maxBin = Math.max(...bins, 1);
  const hx0 = plotR + 8;
  let hist = '';
  for (let b = 0; b < nb; b++) {
    const y0 = sy((b * ymax) / nb);
    const y1 = sy(((b + 1) * ymax) / nb);
    const bw = (bins[b] / maxBin) * (histW - 4);
    if (bw < 0.5) continue;
    const loss = ((b + 1) * ymax) / nb <= W0 + 1e-9;
    hist += `<rect class="${loss ? 'neg' : 'hist'}" x="${r1(hx0)}" y="${r1(y1 + 1)}" width="${r1(bw)}" height="${r1(Math.max(0.5, y0 - y1 - 1))}"/>`;
  }
  const y0 = sy(W0);
  return svgOpen(w, h, ctx.tr('c6.panelSavings'), ctx.tr('c6.descSavings', { T, med: eur(d.q50[T], ctx), p: pct(d.probLoss, ctx, 2) }), 'c6c') +
    `<defs><clipPath id="c6clip"><rect x="${left}" y="${r1(sy(ymax))}" width="${r1(plotR - left)}" height="${r1(sy(0) - sy(ymax))}"/></clipPath></defs>` +
    legend(items, left, MS.top + 10, w - left - MS.right) +
    `<rect class="neg-zone" x="${left}" y="${r1(y0)}" width="${r1(plotR - left)}" height="${r1(sy(0) - y0)}"/>` +
    axisY(sy, left, plotR, { fmt: ctx.fmt, format: (v) => compactEur(v, ctx) }) +
    axisX(sx, h - MS.bottom, MS.top, { fmt: ctx.fmt, label: ctx.tr('c6.axisYears') }) +
    `<g clip-path="url(#c6clip)"><path class="path" d="${paths}"/>` +
    `<path class="s2 line dash" d="${pathFrom(years, d.q10, sx, sy)}"/>` +
    `<path class="s2 line dash" d="${pathFrom(years, d.q90, sx, sy)}"/>` +
    `<path class="s1 line thick" d="${pathFrom(years, d.q50, sx, sy)}"/></g>` +
    `<line class="ref" x1="${left}" x2="${r1(plotR + histW)}" y1="${r1(y0)}" y2="${r1(y0)}"/>` +
    `<text class="value-label small" x="${left + 6}" y="${r1(y0 - 5)}">${esc(eur(W0, ctx))}</text>` +
    hist +
    `<text class="value-label" x="${r1(hx0)}" y="${r1(sy(ymax) - 4)}">${esc(ctx.tr('c6.histTitle'))}</text>` +
    (above ? `<text class="value-label small" x="${r1(hx0)}" y="${r1(sy(ymax) + 12)}">${esc(ctx.tr('c6.above', { n: fmtNum(above, 0, ctx.fmt) }))}</text>` : '') +
    `<text class="value-label" x="${r1(hx0)}" y="${r1(h - MS.bottom + 30)}">${esc(ctx.tr('c6.lossShort', { p: pct(d.probLoss, ctx, 2) }))}</text>` +
    '</svg>';
}

export const chart06: ChartDef<S6, D6> = {
  id: 'montecarlo',
  simulated: true,
  defaults: { mu: 0.05, sigma: 0.15, years: 20, M: 10000, seed: 2024 },
  sliders: [
    { key: 'mu', label: 'c6.mu', min: -0.05, max: 0.15, step: 0.005, format: (v, c) => pct(v, c, 1) },
    { key: 'sigma', label: 'c6.sigma', min: 0.01, max: 0.4, step: 0.01, format: (v, c) => pct(v, c, 0) },
    { key: 'years', label: 'c6.years', min: 1, max: 40, step: 1, format: (v, c) => c.tr('c6.yearsN', { n: v }) },
    { key: 'M', label: 'c6.M', min: 100, max: 20000, step: 100, format: (v, c) => fmtNum(v, 0, c.fmt) },
  ],
  compute: computeMC,
  panels: [
    { id: 'pi', title: (c) => c.tr('c6.panelPi'), height: (w) => Math.min(w, 340), render: scatterPanel },
    {
      id: 'pi-est', title: (c) => c.tr('c6.panelEst'), height: () => 300, render: piPanel,
      hover(d, s, w, xpx, ctx) {
        const M = d.base.M;
        const sx = linear([1, Math.log10(M)], [MS.left + 12, w - MS.right]);
        const n = Math.round(Math.min(M, Math.max(10, 10 ** sx.invert(xpx))));
        if (n > (d.piShown ?? M)) return null;
        const p = Math.PI / 4;
        return { x: sx(Math.log10(n)), lines: [`${ctx.tr('c6.axisPoints')}: ${fmtNum(n, 0, ctx.fmt)}`, `${ctx.tr('c6.piEstimate')}: ${fmtNum(d.base.piEst[n - 1], 4, ctx.fmt)}`, `±2 EE: ${fmtNum(8 * Math.sqrt((p * (1 - p)) / n), 4, ctx.fmt)}`] };
      },
    },
    {
      id: 'ahorro', title: (c) => c.tr('c6.panelSavings'), wide: true, height: (w) => Math.max(320, Math.min(400, w * 0.55)), render: savingsPanel,
      hover(d, s, w, xpx, ctx) {
        const histW = Math.max(60, Math.min(120, w * 0.18));
        const plotR = w - MS.right - histW - 8;
        const T = d.base.T;
        const sx = linear([0, T], [58, plotR]);
        if (xpx > plotR) return null;
        const t = Math.round(Math.min(T, Math.max(0, sx.invert(xpx))));
        return { x: sx(t), lines: [ctx.tr('c6.yearN', { n: t }), `P90: ${eur(d.q90[t], ctx)}`, `${ctx.tr('c6.median')}: ${eur(d.q50[t], ctx)}`, `P10: ${eur(d.q10[t], ctx)}`] };
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c6.statPi', { n: fmtNum(d.base.M, 0, ctx.fmt) }), value: `${fmtNum(d.piHat, 3, ctx.fmt)} ± ${fmtNum(d.piSe, 3, ctx.fmt)}`, note: ctx.tr('c6.noteSe'), panels: ['pi', 'pi-est'] },
    { label: ctx.tr('c6.median'), value: eur(d.q50[d.base.T], ctx), note: ctx.tr('c6.theory', { v: eur(d.theory.median, ctx) }), panels: ['ahorro'] },
    { label: ctx.tr('c6.p10'), value: eur(d.q10[d.base.T], ctx), note: ctx.tr('c6.theory', { v: eur(d.theory.p10, ctx) }), panels: ['ahorro'] },
    { label: ctx.tr('c6.p90'), value: eur(d.q90[d.base.T], ctx), note: ctx.tr('c6.theory', { v: eur(d.theory.p90, ctx) }), panels: ['ahorro'] },
    { label: ctx.tr('c6.statLoss'), value: `${pct(d.probLoss, ctx, 2)} ± ${pct(d.seLoss, ctx, 2)}`, note: ctx.tr('c6.theory', { v: pct(d.theory.probLoss, ctx, 2) }), panels: ['ahorro'] },
    { label: ctx.tr('c6.mean'), value: eur(d.meanFinal, ctx), note: ctx.tr('c6.theory', { v: eur(d.theory.mean, ctx) }), panels: ['ahorro'] },
  ],
  describe: (d, s, ctx) => ctx.tr('c6.describe', {
    M: fmtNum(d.base.M, 0, ctx.fmt), seed: s.seed, mu: pct(s.mu, ctx, 1), sigma: pct(s.sigma, ctx, 0), T: d.base.T,
    med: eur(d.q50[d.base.T], ctx), p10: eur(d.q10[d.base.T], ctx), p90: eur(d.q90[d.base.T], ctx),
    loss: pct(d.probLoss, ctx, 2), se: pct(d.seLoss, ctx, 2), theory: pct(d.theory.probLoss, ctx, 2),
    pi: fmtNum(d.piHat, 3, ctx.fmt), pise: fmtNum(d.piSe, 3, ctx.fmt),
  }),
  table: (d, s, ctx) => {
    const T = d.base.T;
    const step = T > 20 ? 5 : T > 10 ? 2 : 1;
    const rows: string[][] = [];
    for (let t = 0; t <= T; t += step) rows.push([String(t), eur(d.q10[t], ctx), eur(d.q50[t], ctx), eur(d.q90[t], ctx)]);
    if ((T % step) !== 0) rows.push([String(T), eur(d.q10[T], ctx), eur(d.q50[T], ctx), eur(d.q90[T], ctx)]);
    return { caption: ctx.tr('c6.tableCaption'), head: [ctx.tr('c6.colYear'), 'P10', ctx.tr('c6.median'), 'P90'], rows };
  },
};
