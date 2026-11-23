/**
 * Tema E · Caídas máximas (RF-TEM-02).
 * Arriba: valor de una cartera simulada (movimiento browniano geométrico, pasos semanales) y su
 * máximo anterior. Abajo: curva de caídas DD_t = 1 − W_t / max_{s≤t} W_s, con la caída máxima.
 *
 * Truco de rendimiento: los aleatorios solo dependen de la semilla; μ, σ y los años los transforman.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng } from './rng';
import { linear, ticks, pathFrom, areaFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtNum, fmtPct } from '../lib/format';

export interface SE extends Record<string, number> { mu: number; sigma: number; years: number; seed: number }
export const STEPS_PER_YEAR = 52;
export const MAX_YEARS = 40;
export const W0 = 100;

/** Caídas de una serie de valores: DD_t = 1 − W_t / máximo anterior. */
export function drawdowns(W: ArrayLike<number>): number[] {
  const out: number[] = [];
  let peak = -Infinity;
  for (let i = 0; i < W.length; i++) { peak = Math.max(peak, W[i]); out.push(1 - W[i] / peak); }
  return out;
}
export const recoveryNeeded = (D: number) => D / (1 - D);

interface Base { seed: number; z: Float64Array }
let cache: Base | null = null;
function base(seed: number): Base {
  if (cache && cache.seed === seed) return cache;
  const rng = new Rng(seed);
  const z = new Float64Array(STEPS_PER_YEAR * MAX_YEARS);
  for (let i = 0; i < z.length; i++) z[i] = rng.normal();
  cache = { seed, z };
  return cache;
}

export interface DE { ts: number[]; W: number[]; peak: number[]; dd: number[]; mdd: number; mddAt: number; cagr: number; longest: number }

function compute(s: SE): DE {
  const n = Math.round(s.years * STEPS_PER_YEAR);
  const dt = 1 / STEPS_PER_YEAR;
  const { z } = base(s.seed);
  const ts: number[] = [0], W: number[] = [W0], peak: number[] = [W0];
  let w = W0, pk = W0;
  for (let i = 0; i < n; i++) {
    // μ es la tasa de crecimiento (logarítmica) anual: el lastre de la volatilidad ya está incluido.
    w *= Math.exp(s.mu * dt + s.sigma * Math.sqrt(dt) * z[i]);
    pk = Math.max(pk, w);
    ts.push((i + 1) * dt); W.push(w); peak.push(pk);
  }
  const dd = drawdowns(W);
  let mdd = 0, mddAt = 0, run = 0, longest = 0;
  dd.forEach((v, i) => { if (v > mdd) { mdd = v; mddAt = i; } run = v > 1e-12 ? run + 1 : 0; longest = Math.max(longest, run); });
  return { ts, W, peak, dd, mdd, mddAt, cagr: (w / W0) ** (1 / s.years) - 1, longest: longest * dt };
}

const M = { top: 12, right: 16, bottom: 44, left: 56 };
const pct = (v: number, c: ChartCtx, d = 1) => fmtPct(v, d, c.fmt);
const yrs = (v: number, c: ChartCtx) => c.tr('tE.nYears', { n: fmtNum(v, 1, c.fmt) });

export const chartE: ChartDef<SE, DE> = {
  id: 'caidas',
  simulated: true,
  defaults: { mu: 0.06, sigma: 0.2, years: 20, seed: 30 },
  sliders: [
    { key: 'sigma', label: 'tE.sigma', min: 0.05, max: 0.5, step: 0.01, format: (v, c) => pct(v, c, 0) },
    { key: 'years', label: 'tE.years', min: 1, max: MAX_YEARS, step: 1, format: (v, c) => c.tr('tE.nYears', { n: v }) },
    { key: 'mu', label: 'tE.mu', min: -0.05, max: 0.15, step: 0.005, format: (v, c) => pct(v, c), more: true },
  ],
  compute,
  panels: [
    {
      id: 'valor',
      title: (c) => c.tr('tE.panelTop'),
      wide: true,
      height: () => 240,
      render(d, s, w, ctx) {
        const items = [{ cls: 's1', label: ctx.tr('tE.legendValue') }, { cls: 'muted', label: ctx.tr('tE.legendPeak'), dash: true }];
        const h = panelH(w, 240);
        const lh = legendHeight(items, w - M.left - M.right);
        const lo = Math.min(...d.W), hi = Math.max(...d.W);
        const sx = linear([0, s.years], [M.left, w - M.right]);
        const sy = linear([lo * 0.95, hi * 1.05], [h - M.bottom, M.top + lh + 8]);
        const mx = sx(d.ts[d.mddAt]);
        return svgOpen(w, h, ctx.tr('tE.panelTop'), ctx.tr('tE.descTop', { n: s.years, f: fmtNum(d.W[d.W.length - 1], 0, ctx.fmt) }), 'tEa') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, ticks: ticks(lo * 0.95, hi * 1.05, 3), format: (v) => fmtNum(v, 0, ctx.fmt) + ' €' }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('tE.axisYears') }) +
          `<path class="band" d="${areaFrom(d.ts, d.W, d.peak, sx, sy)}"/>` +
          `<path class="muted line dash" d="${pathFrom(d.ts, d.peak, sx, sy)}"/>` +
          `<path class="s1 line" d="${pathFrom(d.ts, d.W, sx, sy)}"/>` +
          (d.mdd > 0 ? `<circle class="s2 dot" cx="${r1(mx)}" cy="${r1(sy(d.W[d.mddAt]))}" r="5"/>` : '') +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, s.years], [M.left, w - M.right]);
        const i = Math.round(Math.min(d.ts.length - 1, Math.max(0, sx.invert(xpx) * STEPS_PER_YEAR)));
        return { x: sx(d.ts[i]), lines: [yrs(d.ts[i], ctx), `${ctx.tr('tE.legendValue')}: ${fmtNum(d.W[i], 1, ctx.fmt)} €`, `${ctx.tr('tE.legendDd')}: ${pct(d.dd[i], ctx)}`] };
      },
    },
    {
      id: 'caidas',
      title: (c) => c.tr('tE.panelBottom'),
      wide: true,
      height: () => 200,
      render(d, s, w, ctx) {
        const items = [{ cls: 'neg-zone legendbox', label: ctx.tr('tE.legendDd'), box: true }];
        const h = panelH(w, 200);
        const lh = legendHeight(items, w - M.left - M.right);
        const sx = linear([0, s.years], [M.left, w - M.right]);
        const lo = -Math.max(0.1, d.mdd * 1.15);
        const sy = linear([lo, 0], [h - M.bottom, M.top + lh + 8]);
        const neg = d.dd.map((v) => -v);
        const zero = d.dd.map(() => 0);
        const mx = sx(d.ts[d.mddAt]);
        return svgOpen(w, h, ctx.tr('tE.panelBottom'), ctx.tr('tE.descBottom', { m: pct(d.mdd, ctx) }), 'tEb') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, ticks: ticks(lo, 0, 3), format: (v) => pct(-v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('tE.axisYears') }) +
          `<path class="neg-zone" d="${areaFrom(d.ts, zero, neg, sx, sy)}"/>` +
          `<line class="zero" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
          (d.mdd > 0 ? `<circle class="s2 dot" cx="${r1(mx)}" cy="${r1(sy(-d.mdd))}" r="5"/>` +
            `<text class="value-label" x="${r1(mx + (mx > w * 0.7 ? -8 : 8))}" y="${r1(sy(-d.mdd) + 4)}" text-anchor="${mx > w * 0.7 ? 'end' : 'start'}">${esc(ctx.tr('tE.mddLabel', { m: pct(d.mdd, ctx) }))}</text>` : '') +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, s.years], [M.left, w - M.right]);
        const i = Math.round(Math.min(d.ts.length - 1, Math.max(0, sx.invert(xpx) * STEPS_PER_YEAR)));
        return { x: sx(d.ts[i]), lines: [yrs(d.ts[i], ctx), `${ctx.tr('tE.legendDd')}: ${pct(d.dd[i], ctx)}`] };
      },
    },
  ],
  stats(d, s, ctx) {
    return [
      { label: ctx.tr('tE.statMdd'), value: pct(d.mdd, ctx), note: ctx.tr('tE.statRecover', { r: pct(recoveryNeeded(d.mdd), ctx, 0) }) },
      { label: ctx.tr('tE.statCagr'), value: pct(d.cagr, ctx) },
      { label: ctx.tr('tE.statCalmar'), value: d.mdd > 0 ? fmtNum(d.cagr / d.mdd, 2, ctx.fmt) : '—' },
      { label: ctx.tr('tE.statLongest'), value: yrs(d.longest, ctx) },
    ];
  },
  describe: (d, s, ctx) => ctx.tr('tE.describe', {
    n: s.years, sig: pct(s.sigma, ctx, 0), m: pct(d.mdd, ctx), r: pct(recoveryNeeded(d.mdd), ctx, 0), g: pct(d.cagr, ctx), l: fmtNum(d.longest, 1, ctx.fmt),
  }),
  table(d, s, ctx) {
    const rows: string[][] = [];
    for (let y = 0; y <= s.years; y += Math.max(1, Math.round(s.years / 10))) {
      const i = y * STEPS_PER_YEAR;
      rows.push([String(y), fmtNum(d.W[i], 1, ctx.fmt) + ' €', fmtNum(d.peak[i], 1, ctx.fmt) + ' €', pct(d.dd[i], ctx)]);
    }
    return { caption: ctx.tr('tE.tableCaption'), head: [ctx.tr('tE.axisYears'), ctx.tr('tE.legendValue'), ctx.tr('tE.legendPeak'), ctx.tr('tE.legendDd')], rows };
  },
};
