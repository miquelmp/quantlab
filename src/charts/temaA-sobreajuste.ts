/**
 * Tema A · Backtesting y sobreajuste (RF-TEM-02).
 * Izquierda: ratios de Sharpe de N estrategias sin ninguna habilidad (Sharpe real 0) medidos con
 * Y años de datos; la mejor parece buena por puro azar.
 * Derecha: Sharpe máximo esperado según N, frente a la aproximación √(2 ln N) veces el error estándar.
 *
 * Truco de rendimiento: los aleatorios (normales estándar) solo dependen de la semilla; los años
 * solo cambian la escala (error estándar ≈ 1/√Y).
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng, normCdf } from './rng';
import { linear, pathFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtNum } from '../lib/format';

export interface SA extends Record<string, number> { N: number; Y: number; seed: number }
export const MAX_N = 1000;

interface Base { seed: number; z: Float64Array }
let cache: Base | null = null;
function base(seed: number): Base {
  if (cache && cache.seed === seed) return cache;
  const rng = new Rng(seed);
  const z = new Float64Array(MAX_N);
  for (let i = 0; i < MAX_N; i++) z[i] = rng.normal();
  cache = { seed, z };
  return cache;
}

/** Error estándar del Sharpe anual estimado con Y años (Sharpe real 0): ≈ 1/√Y (capítulo 8). */
export const sharpeSe = (Y: number) => 1 / Math.sqrt(Y);

/** Valor esperado del máximo de N normales estándar independientes (integración numérica). */
export function expectedMaxNormal(N: number): number {
  if (N <= 1) return 0;
  let s = 0;
  const h = 0.01;
  for (let x = -8; x <= 8; x += h) {
    const phi = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
    s += x * N * phi * normCdf(x) ** (N - 1) * h;
  }
  return s;
}

export interface DA {
  sharpes: number[]; best: number; bestIdx: number; se: number;
  ns: number[]; expMax: number[]; approx: number[]; expBest: number;
}

const NS: number[] = (() => { const a: number[] = []; for (let e = 0; e <= 60; e++) { const v = Math.round(10 ** (e / 20)); if (v !== a[a.length - 1]) a.push(v); } return a; })();
const EXP_MAX = new Map<number, number>();
const expMaxCached = (n: number) => { let v = EXP_MAX.get(n); if (v === undefined) { v = expectedMaxNormal(n); EXP_MAX.set(n, v); } return v; };

function compute(s: SA): DA {
  const N = Math.round(s.N);
  const se = sharpeSe(s.Y);
  const { z } = base(s.seed);
  const sharpes: number[] = [];
  let best = -Infinity, bestIdx = 0;
  for (let i = 0; i < N; i++) { const v = z[i] * se; sharpes.push(v); if (v > best) { best = v; bestIdx = i; } }
  const expMax = NS.map((n) => expMaxCached(n) * se);
  const approx = NS.map((n) => Math.sqrt(2 * Math.log(n)) * se);
  return { sharpes, best, bestIdx, se, ns: NS, expMax, approx, expBest: expMaxCached(N) * se };
}

const M = { top: 12, right: 16, bottom: 44, left: 48 };
const num = (v: number, c: ChartCtx, d = 2) => fmtNum(v, d, c.fmt);

export const chartA: ChartDef<SA, DA> = {
  id: 'sobreajuste',
  simulated: true,
  defaults: { N: 100, Y: 5, seed: 7 },
  sliders: [
    { key: 'N', label: 'tA.strategies', min: 1, max: MAX_N, step: 1, format: (v) => String(v) },
    { key: 'Y', label: 'tA.years', min: 1, max: 20, step: 1, format: (v, c) => c.tr('tA.nYears', { n: v }) },
  ],
  compute,
  panels: [
    {
      id: 'estrategias',
      title: (c) => c.tr('tA.panelLeft'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [{ cls: 'hist', label: ctx.tr('tA.legendHist'), box: true }, { cls: 's2', label: ctx.tr('tA.legendBest') }];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const lim = Math.max(1.5, Math.abs(d.best) * 1.15, 3.2 * d.se);
        const bins = 30, bw = (2 * lim) / bins;
        const cnt = new Array(bins).fill(0);
        for (const v of d.sharpes) cnt[Math.min(bins - 1, Math.max(0, Math.floor((v + lim) / bw)))]++;
        const sx = linear([-lim, lim], [M.left, w - M.right]);
        const sy = linear([0, Math.max(...cnt) * 1.15], [h - M.bottom, M.top + lh + 8]);
        let bars = '';
        cnt.forEach((c, i) => { if (c) bars += `<rect class="hist" x="${r1(sx(-lim + i * bw) + 0.5)}" y="${r1(sy(c))}" width="${r1(Math.max(1, sx(bw) - sx(0) - 1))}" height="${r1(sy(0) - sy(c))}"/>`; });
        const bx = sx(d.best);
        return svgOpen(w, h, ctx.tr('tA.panelLeft'), ctx.tr('tA.descLeft', { N: s.N, Y: s.Y, b: num(d.best, ctx) }), 'tAa') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => fmtNum(v, 0, ctx.fmt) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('tA.axisSharpe') }) +
          bars +
          `<line class="zero" x1="${r1(sx(0))}" x2="${r1(sx(0))}" y1="${M.top + lh + 8}" y2="${h - M.bottom}"/>` +
          `<line class="s2 line thick" x1="${r1(bx)}" x2="${r1(bx)}" y1="${M.top + lh + 8}" y2="${h - M.bottom}"/>` +
          `<text class="value-label" x="${r1(bx + (bx > w * 0.75 ? -6 : 6))}" y="${M.top + lh + 24}" text-anchor="${bx > w * 0.75 ? 'end' : 'start'}">${esc(ctx.tr('tA.bestLabel', { b: num(d.best, ctx) }))}</text>` +
          '</svg>';
      },
    },
    {
      id: 'maximo',
      title: (c) => c.tr('tA.panelRight'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [{ cls: 's1', label: ctx.tr('tA.legendExp') }, { cls: 'muted', label: ctx.tr('tA.legendApprox'), dash: true }];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const lx = d.ns.map((n) => Math.log10(n));
        const sx = linear([0, 3], [M.left, w - M.right]);
        // Con pocas estrategias la mejor puede tener un Sharpe negativo: la escala lo incluye.
        const sy = linear([Math.min(0, d.best * 1.15), Math.max(...d.approx, d.best) * 1.1], [h - M.bottom, M.top + lh + 8]);
        const px = sx(Math.log10(s.N));
        return svgOpen(w, h, ctx.tr('tA.panelRight'), ctx.tr('tA.descRight', { N: s.N, e: num(d.expBest, ctx), b: num(d.best, ctx) }), 'tAb') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, ticks: [0, 1, 2, 3], format: (v) => fmtNum(10 ** v, 0, ctx.fmt), label: ctx.tr('tA.axisN') }) +
          `<path class="muted line dash" d="${pathFrom(lx, d.approx, sx, sy)}"/>` +
          `<path class="s1 line thick" d="${pathFrom(lx, d.expMax, sx, sy)}"/>` +
          `<circle class="s1 dot" cx="${r1(px)}" cy="${r1(sy(d.expBest))}" r="5"/>` +
          `<circle class="s2 dot" cx="${r1(px)}" cy="${r1(sy(d.best))}" r="5"/>` +
          `<text class="value-label small" x="${r1(px - 8)}" y="${r1(sy(d.best) - 8)}" text-anchor="end">${esc(ctx.tr('tA.thisSeed'))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, 3], [M.left, w - M.right]);
        const lv = Math.min(3, Math.max(0, sx.invert(xpx)));
        let i = 0; for (let k = 0; k < d.ns.length; k++) if (Math.abs(Math.log10(d.ns[k]) - lv) < Math.abs(Math.log10(d.ns[i]) - lv)) i = k;
        return { x: sx(Math.log10(d.ns[i])), lines: [ctx.tr('tA.nStrategies', { n: d.ns[i] }), `${ctx.tr('tA.legendExp')}: ${num(d.expMax[i], ctx)}`, `${ctx.tr('tA.legendApprox')}: ${num(d.approx[i], ctx)}`] };
      },
    },
  ],
  stats(d, s, ctx) {
    return [
      { label: ctx.tr('tA.statSe', { Y: s.Y }), value: num(d.se, ctx) },
      { label: ctx.tr('tA.statBest'), value: num(d.best, ctx), panels: ['estrategias', 'maximo'] },
      { label: ctx.tr('tA.statExp', { N: s.N }), value: num(d.expBest, ctx), panels: ['maximo'] },
      { label: ctx.tr('tA.statTrue'), value: num(0, ctx), panels: ['estrategias'] },
    ];
  },
  describe: (d, s, ctx) => ctx.tr('tA.describe', { N: s.N, Y: s.Y, se: num(d.se, ctx), b: num(d.best, ctx), e: num(d.expBest, ctx) }),
  table(d, s, ctx) {
    const ns = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
    return {
      caption: ctx.tr('tA.tableCaption', { Y: s.Y }),
      head: [ctx.tr('tA.axisN'), ctx.tr('tA.legendExp'), ctx.tr('tA.legendApprox')],
      rows: ns.map((n) => [String(n), num(expMaxCached(n) * d.se, ctx), num(Math.sqrt(2 * Math.log(n)) * d.se, ctx)]),
    };
  },
};
