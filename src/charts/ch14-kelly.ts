/**
 * Capítulo 14 · El tamaño de la apuesta.
 * Izquierda: curva de crecimiento g(f) con el máximo de Kelly y la zona negativa.
 * Derecha: 1.000 jugadores × 1.000 jugadas con la fracción elegida (escala logarítmica).
 *
 * Truco de rendimiento: la riqueza de un jugador solo depende de cuántas jugadas ha ganado
 * (k), y crece con k. Así que basta con guardar, en cada jugada, cuántos jugadores llevan
 * k aciertos: los percentiles, la media y el % de arruinados salen de ese recuento para
 * cualquier fracción f y pago b sin volver a simular.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng } from './rng';
import { linear, pathFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtPct, fmtNum, fmtEur } from '../lib/format';

export interface S14 extends Record<string, number> { p: number; b: number; f: number; seed: number }

export const PLAYERS = 1000;
export const PLAYS = 1000;
export const START = 100;
const SAMPLE = 30;
const LN10 = Math.log(10);

export function growth(f: number, p: number, b = 1): number {
  if (f >= 1) return -Infinity;
  return p * Math.log(1 + b * f) + (1 - p) * Math.log(1 - f);
}

export function kellyFraction(p: number, b = 1): number {
  return Math.max(0, p - (1 - p) / b);
}

interface Base {
  key: string;
  hist: Uint16Array;          // triangular: recuento de jugadores con k aciertos tras t jugadas
  sample: Uint16Array;        // aciertos acumulados de SAMPLE jugadores (SAMPLE × (PLAYS+1))
}

const off = (t: number) => (t * (t + 1)) / 2;

let cache: Base | null = null;

function buildBase(seed: number, p: number): Base {
  const key = `${seed}|${p}`;
  if (cache && cache.key === key) return cache;
  const rng = new Rng(seed);
  const k = new Uint16Array(PLAYERS);
  const hist = new Uint16Array(off(PLAYS + 1));
  const sample = new Uint16Array(SAMPLE * (PLAYS + 1));
  hist[off(0)] = PLAYERS;
  for (let t = 1; t <= PLAYS; t++) {
    const o = off(t);
    for (let i = 0; i < PLAYERS; i++) {
      if (rng.uniform() < p) k[i]++;
      hist[o + k[i]]++;
    }
    for (let j = 0; j < SAMPLE; j++) sample[j * (PLAYS + 1) + t] = k[j];
  }
  cache = { key, hist, sample };
  return cache;
}

export interface D14 {
  base: Base;
  fStar: number;
  g: number;
  /** log10 de la riqueza por jugada (0..PLAYS) */
  l10: Float64Array; l50: Float64Array; l90: Float64Array; lMean: Float64Array;
  belowTen: number;            // fracción de jugadores por debajo de 10 € al final
  theoryMedian: number;        // 100·e^{n g}
  theoryMeanLog10: number;     // log10 de 100·(1 + (pb − q) f)^n
}

/** Aciertos del jugador situado en la posición `rank` (0..P−1) tras t jugadas. */
function kAtRank(hist: Uint16Array, t: number, rank: number): number {
  const o = off(t);
  let acc = 0;
  for (let k = 0; k <= t; k++) {
    acc += hist[o + k];
    if (acc > rank) return k;
  }
  return t;
}

export function computeKelly(s: S14): D14 {
  const base = buildBase(Math.round(s.seed), s.p);
  const a = Math.log(1 + s.b * s.f);
  const c = s.f < 1 ? Math.log(1 - s.f) : -Infinity;
  const lnStart = Math.log(START);
  const lnW = (k: number, t: number) => lnStart + k * a + (t - k) * c;
  const qs = (q: number, t: number) => {
    const pos = q * (PLAYERS - 1);
    const lo = Math.floor(pos);
    const k0 = kAtRank(base.hist, t, lo);
    const k1 = kAtRank(base.hist, t, Math.min(PLAYERS - 1, lo + 1));
    const w0 = lnW(k0, t);
    const w1 = lnW(k1, t);
    return (w0 + (w1 - w0) * (pos - lo)) / LN10;
  };
  const l10 = new Float64Array(PLAYS + 1);
  const l50 = new Float64Array(PLAYS + 1);
  const l90 = new Float64Array(PLAYS + 1);
  const lMean = new Float64Array(PLAYS + 1);
  for (let t = 0; t <= PLAYS; t++) {
    l10[t] = qs(0.1, t); l50[t] = qs(0.5, t); l90[t] = qs(0.9, t);
    // media = (1/P) Σ_k n_k · e^{lnW(k)}, calculada con log-sum-exp para no desbordar
    const o = off(t);
    let mx = -Infinity;
    for (let k = 0; k <= t; k++) if (base.hist[o + k]) mx = Math.max(mx, lnW(k, t));
    let sum = 0;
    for (let k = 0; k <= t; k++) { const n = base.hist[o + k]; if (n) sum += n * Math.exp(lnW(k, t) - mx); }
    lMean[t] = (mx + Math.log(sum / PLAYERS)) / LN10;
  }
  let below = 0;
  const o = off(PLAYS);
  for (let k = 0; k <= PLAYS; k++) if (lnW(k, PLAYS) < Math.log(10)) below += base.hist[o + k];
  const g = growth(s.f, s.p, s.b);
  return {
    base, fStar: kellyFraction(s.p, s.b), g, l10, l50, l90, lMean,
    belowTen: below / PLAYERS,
    theoryMedian: START * Math.exp(PLAYS * g),
    theoryMeanLog10: (lnStart + PLAYS * Math.log(1 + (s.p * s.b - (1 - s.p)) * s.f)) / LN10,
  };
}

const pct = (v: number, c: ChartCtx, k = 1) => fmtPct(v, k, c.fmt);

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };

/** Riqueza a partir de su log10, legible: 1.234 €, 0,05 €, 10¹⁵ €. */
export function wealthFromLog10(l: number, ctx: ChartCtx): string {
  if (!Number.isFinite(l)) return l > 0 ? '∞' : '0 €';
  if (l > 9 || l < -3) {
    const e = Math.floor(l);
    const m = 10 ** (l - e);
    const exp = String(e).split('').map((ch) => SUP[ch]).join('');
    return `${fmtNum(m, 1, ctx.fmt)}·10${exp} €`;
  }
  const v = 10 ** l;
  return fmtEur(v, v < 10 ? 2 : 0, ctx.fmt);
}

function tickLabel(e: number, ctx: ChartCtx): string {
  if (e >= -2 && e <= 6) return fmtEur(10 ** e, e < 0 ? -e : 0, ctx.fmt);
  return `10${String(e).split('').map((ch) => SUP[ch]).join('')} €`;
}

const ML = { top: 10, right: 14, bottom: 42, left: 62 };

function growthPanel(d: D14, s: S14, w: number, ctx: ChartCtx): string {
  const h = panelH(w, 320);
  const items = [
    { cls: 's1', label: ctx.tr('c14.curve') },
    { cls: 'neg', label: ctx.tr('c14.negZone'), box: true },
  ];
  const lh = legendHeight(items, w - ML.left - ML.right);
  const xs: number[] = []; const ys: number[] = [];
  let gmax = -Infinity;
  for (let i = 0; i <= 250; i++) {
    const f = (0.5 * i) / 250;
    const g = growth(f, s.p, s.b);
    xs.push(f); ys.push(g);
    gmax = Math.max(gmax, g);
  }
  const top = gmax > 0 ? gmax * 1.25 : 0.001;
  const bottom = gmax > 0 ? -gmax * 1.6 : Math.max(-0.5, Math.min(...ys)) * 1.05;
  const sx = linear([0, 0.5], [ML.left, w - ML.right]);
  const sy = linear([bottom, top], [h - ML.bottom, ML.top + lh + 12]);
  // Zona de crecimiento negativo: valores de f con g(f) < 0.
  let neg = '';
  let startF: number | null = null;
  for (let i = 0; i < xs.length; i++) {
    const isNeg = ys[i] < 0 && xs[i] > 0;
    if (isNeg && startF === null) startF = xs[i];
    if ((!isNeg || i === xs.length - 1) && startF !== null) {
      const endF = isNeg ? xs[i] : xs[i - 1];
      neg += `<rect class="neg-zone" x="${r1(sx(startF))}" y="${r1(sy(top))}" width="${r1(sx(endF) - sx(startF))}" height="${r1(sy(bottom) - sy(top))}"/>`;
      startF = null;
    }
  }
  const clipped = ys.map((y) => Math.max(bottom, y));
  const gy = Math.max(bottom, Math.min(top, d.g));
  const px = sx(s.f);
  const py = sy(gy);
  const fs = d.fStar;
  const kellyMark = fs > 0 && fs <= 0.5
    ? `<line class="s1 dash" x1="${r1(sx(fs))}" x2="${r1(sx(fs))}" y1="${r1(sy(growth(fs, s.p, s.b)))}" y2="${r1(sy(bottom))}"/>` +
      `<text class="value-label small" x="${r1(sx(fs))}" y="${r1(sy(bottom) - 6)}" text-anchor="middle">${esc(ctx.tr('c14.kellyMark', { f: pct(fs, ctx, 1) }))}</text>` +
      (2 * fs <= 0.5 ? `<line class="muted dash" x1="${r1(sx(2 * fs))}" x2="${r1(sx(2 * fs))}" y1="${r1(sy(top))}" y2="${r1(sy(bottom))}"/><text class="value-label small" x="${r1(sx(2 * fs) + 4)}" y="${r1(sy(top) + 12)}">${esc(ctx.tr('c14.doubleKelly'))}</text>` : '')
    : '';
  const anchor = px > w * 0.6 ? 'end' : 'start';
  const yTicks = (() => {
    const span = top - bottom;
    const raw = span / 5;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map((m) => m * mag).find((v) => v >= raw) ?? raw;
    const out: number[] = [];
    for (let v = Math.ceil(bottom / step) * step; v <= top + 1e-12; v += step) out.push(+v.toPrecision(10));
    return out;
  })();
  const dec = Math.max(2, -Math.floor(Math.log10(Math.max(1e-9, yTicks[1] - yTicks[0]))));
  return svgOpen(w, h, ctx.tr('c14.panelLeft'), ctx.tr('c14.descLeft', { f: pct(s.f, ctx, 1), g: fmtNum(d.g, 5, ctx.fmt), k: pct(d.fStar, ctx, 1) }), 'c14a') +
    `<defs><clipPath id="c14clip"><rect x="${ML.left}" y="${r1(sy(top))}" width="${r1(w - ML.left - ML.right)}" height="${r1(sy(bottom) - sy(top))}"/></clipPath></defs>` +
    legend(items, ML.left, ML.top + 10, w - ML.left - ML.right) +
    neg +
    axisY(sy, ML.left, w - ML.right, { fmt: ctx.fmt, ticks: yTicks, format: (v) => fmtNum(v, dec, ctx.fmt) }) +
    axisX(sx, h - ML.bottom, ML.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('c14.axisF') }) +
    `<line class="zero" x1="${ML.left}" x2="${w - ML.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
    `<g clip-path="url(#c14clip)"><path class="s1 line thick" d="${pathFrom(xs, clipped, sx, sy)}"/></g>` +
    kellyMark +
    `<circle class="s2 dot" cx="${r1(px)}" cy="${r1(py)}" r="7"/>` +
    `<text class="value-label" x="${r1(anchor === 'end' ? px - 10 : px + 10)}" y="${r1(py < sy(top) + 30 ? py + 22 : py - 12)}" text-anchor="${anchor}">${esc(`g = ${fmtNum(d.g, 5, ctx.fmt)}`)}</text>` +
    '</svg>';
}

function domainRight(d: D14): [number, number] {
  let lo = Infinity;
  let hi90 = -Infinity;
  let hiMean = -Infinity;
  for (let t = 0; t <= PLAYS; t++) {
    lo = Math.min(lo, d.l10[t]);
    hi90 = Math.max(hi90, d.l90[t]);
    hiMean = Math.max(hiMean, d.lMean[t]);
  }
  let hi = Math.ceil(Math.min(Math.max(hiMean, hi90, 2.5), Math.max(hi90, 2) + 4) + 0.3);
  let l = Math.floor(Math.min(lo, 0.7));
  if (hi - l > 14) l = hi - 14;
  return [l, hi];
}

function playersPanel(d: D14, s: S14, w: number, ctx: ChartCtx): string {
  const h = panelH(w, 320);
  const items = [
    { cls: 's1', label: ctx.tr('c14.median') },
    { cls: 's2', label: ctx.tr('c14.p1090'), dash: true },
    { cls: 's3', label: ctx.tr('c14.mean') },
    { cls: 'path', label: ctx.tr('c14.players', { n: SAMPLE }) },
  ];
  const lh = legendHeight(items, w - ML.left - ML.right);
  const [lo, hi] = domainRight(d);
  const sx = linear([0, PLAYS], [ML.left, w - ML.right]);
  const sy = linear([lo, hi], [h - ML.bottom, ML.top + lh + 12]);
  const step = Math.max(1, Math.round(PLAYS / Math.max(100, Math.min(500, w))));
  const xs: number[] = [];
  const pick = (arr: Float64Array) => { const out: number[] = []; for (let t = 0; t <= PLAYS; t += step) out.push(Math.max(lo - 1, Math.min(hi + 1, arr[t]))); return out; };
  for (let t = 0; t <= PLAYS; t += step) xs.push(t);
  const a = Math.log(1 + s.b * s.f);
  const c = Math.log(1 - s.f);
  let sample = '';
  for (let j = 0; j < SAMPLE; j++) {
    const ys: number[] = [];
    for (let t = 0; t <= PLAYS; t += step) {
      const k = d.base.sample[j * (PLAYS + 1) + t];
      ys.push(Math.max(lo - 1, Math.min(hi + 1, (Math.log(START) + k * a + (t - k) * c) / LN10)));
    }
    sample += pathFrom(xs, ys, sx, sy);
  }
  const ticksY: number[] = [];
  const stepY = hi - lo > 8 ? 2 : 1;
  for (let e = Math.ceil(lo); e <= hi; e += stepY) ticksY.push(e);
  const meanClipped = d.lMean[PLAYS] > hi;
  return svgOpen(w, h, ctx.tr('c14.panelRight'), ctx.tr('c14.descRight', { med: wealthFromLog10(d.l50[PLAYS], ctx), below: pct(d.belowTen, ctx, 1) }), 'c14b') +
    `<defs><clipPath id="c14clip2"><rect x="${ML.left}" y="${r1(sy(hi))}" width="${r1(w - ML.left - ML.right)}" height="${r1(sy(lo) - sy(hi))}"/></clipPath></defs>` +
    legend(items, ML.left, ML.top + 10, w - ML.left - ML.right) +
    axisY(sy, ML.left, w - ML.right, { fmt: ctx.fmt, ticks: ticksY, format: (e) => tickLabel(e, ctx) }) +
    axisX(sx, h - ML.bottom, ML.top, { fmt: ctx.fmt, label: ctx.tr('c14.axisPlays') }) +
    `<g clip-path="url(#c14clip2)">` +
    `<path class="path" d="${sample}"/>` +
    `<line class="ref" x1="${ML.left}" x2="${w - ML.right}" y1="${r1(sy(2))}" y2="${r1(sy(2))}"/>` +
    `<line class="neg dash" x1="${ML.left}" x2="${w - ML.right}" y1="${r1(sy(1))}" y2="${r1(sy(1))}"/>` +
    `<path class="s3 line" d="${pathFrom(xs, pick(d.lMean), sx, sy)}"/>` +
    `<path class="s2 line dash" d="${pathFrom(xs, pick(d.l10), sx, sy)}"/>` +
    `<path class="s2 line dash" d="${pathFrom(xs, pick(d.l90), sx, sy)}"/>` +
    `<path class="s1 line thick" d="${pathFrom(xs, pick(d.l50), sx, sy)}"/>` +
    `</g>` +
    `<text class="value-label small" x="${w - ML.right - 4}" y="${r1(sy(1) - 4)}" text-anchor="end">${esc(ctx.tr('c14.tenLine'))}</text>` +
    (meanClipped ? `<text class="value-label small" x="${w - ML.right - 4}" y="${r1(sy(hi) + 12)}" text-anchor="end">${esc(ctx.tr('c14.meanOff', { v: wealthFromLog10(d.lMean[PLAYS], ctx) }))}</text>` : '') +
    '</svg>';
}

export const chart14: ChartDef<S14, D14> = {
  id: 'kelly',
  simulated: true,
  defaults: { p: 0.53, b: 1, f: 0.06, seed: 2024 },
  sliders: [
    { key: 'p', label: 'c14.p', min: 0.5, max: 0.7, step: 0.01, format: (v, c) => fmtNum(v, 2, c.fmt) },
    { key: 'b', label: 'c14.b', min: 0.5, max: 5, step: 0.1, format: (v, c) => fmtNum(v, 1, c.fmt) },
    { key: 'f', label: 'c14.f', min: 0, max: 0.5, step: 0.005, format: (v, c) => pct(v, c, 1) },
  ],
  compute: computeKelly,
  panels: [
    {
      id: 'crecimiento', title: (c) => c.tr('c14.panelLeft'), height: () => 320, render: growthPanel,
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, 0.5], [ML.left, w - ML.right]);
        const f = Math.min(0.5, Math.max(0, sx.invert(xpx)));
        return { x: sx(f), lines: [`f = ${pct(f, ctx, 1)}`, `g(f) = ${fmtNum(growth(f, s.p, s.b), 5, ctx.fmt)}`] };
      },
    },
    {
      id: 'jugadores', title: (c) => c.tr('c14.panelRight'), height: () => 320, render: playersPanel,
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, PLAYS], [ML.left, w - ML.right]);
        const t = Math.round(Math.min(PLAYS, Math.max(0, sx.invert(xpx))));
        return {
          x: sx(t), lines: [
            ctx.tr('c14.playN', { n: fmtNum(t, 0, ctx.fmt) }),
            `${ctx.tr('c14.mean')}: ${wealthFromLog10(d.lMean[t], ctx)}`,
            `P90: ${wealthFromLog10(d.l90[t], ctx)}`,
            `${ctx.tr('c14.median')}: ${wealthFromLog10(d.l50[t], ctx)}`,
            `P10: ${wealthFromLog10(d.l10[t], ctx)}`,
          ],
        };
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c14.statKelly'), value: pct(d.fStar, ctx, 1), note: d.fStar <= 0 ? ctx.tr('c14.noEdge') : ctx.tr('c14.ratio', { r: d.fStar > 0 ? fmtNum(s.f / d.fStar, 2, ctx.fmt) : '—' }) },
    { label: ctx.tr('c14.statG', { f: pct(s.f, ctx, 1) }), value: fmtNum(d.g, 5, ctx.fmt) },
    { label: ctx.tr('c14.statMedian'), value: wealthFromLog10(d.l50[PLAYS], ctx), note: ctx.tr('c14.theory', { v: wealthFromLog10(Math.log10(d.theoryMedian), ctx) }) },
    { label: ctx.tr('c14.statMean'), value: wealthFromLog10(d.lMean[PLAYS], ctx), note: ctx.tr('c14.theory', { v: wealthFromLog10(d.theoryMeanLog10, ctx) }) },
    { label: 'P10 · P90', value: `${wealthFromLog10(d.l10[PLAYS], ctx)} · ${wealthFromLog10(d.l90[PLAYS], ctx)}` },
    { label: ctx.tr('c14.statBelow'), value: pct(d.belowTen, ctx, 1) },
  ],
  describe: (d, s, ctx) => ctx.tr('c14.describe', {
    p: fmtNum(s.p, 2, ctx.fmt), b: fmtNum(s.b, 1, ctx.fmt), f: pct(s.f, ctx, 1), k: pct(d.fStar, ctx, 1),
    g: fmtNum(d.g, 5, ctx.fmt), med: wealthFromLog10(d.l50[PLAYS], ctx), mean: wealthFromLog10(d.lMean[PLAYS], ctx),
    below: pct(d.belowTen, ctx, 1), seed: s.seed,
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c14.tableCaption'),
    head: [ctx.tr('c14.colPlay'), 'P10', ctx.tr('c14.median'), 'P90', ctx.tr('c14.mean')],
    rows: [0, 100, 250, 500, 750, 1000].map((t) => [fmtNum(t, 0, ctx.fmt), wealthFromLog10(d.l10[t], ctx), wealthFromLog10(d.l50[t], ctx), wealthFromLog10(d.l90[t], ctx), wealthFromLog10(d.lMean[t], ctx)]),
  }),
};
