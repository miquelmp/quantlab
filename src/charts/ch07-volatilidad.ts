/**
 * Capítulo 7 · Mismo destino, distinto viaje.
 * Izquierda: dos trayectorias diarias de precio a 5 años (volatilidad 5 % y la elegida), con los
 * mismos números aleatorios y la misma deriva logarítmica del 6 % anual.
 * Derecha: distribución normal de la rentabilidad logarítmica de un año para ambas, con el área
 * de pérdidas sombreada y su probabilidad.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng, normCdf } from './rng';
import { linear, pathFrom, areaFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S7 extends Record<string, number> { sigma: number; seed: number }

export const MU = 0.06;
export const REF_SIGMA = 0.05;
export const DAYS = 252;
export const YEARS = 5;
const N = DAYS * YEARS;
const S0 = 100;

/** Probabilidad de un año con pérdidas si la rentabilidad logarítmica anual es N(μ, σ²). */
export const probLoss = (sigma: number, mu = MU) => normCdf(-mu / sigma);

/** Volatilidad muestral (dividiendo por N − 1). */
export function sampleVol(r: number[]): number {
  const m = r.reduce((a, b) => a + b, 0) / r.length;
  return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1));
}

let cache: { seed: number; z: Float64Array } | null = null;
function normals(seed: number): Float64Array {
  if (cache && cache.seed === seed) return cache.z;
  const rng = new Rng(seed);
  const z = new Float64Array(N);
  for (let i = 0; i < N; i++) z[i] = rng.normal();
  cache = { seed, z };
  return z;
}

export interface D7 {
  t: number[];             // años
  ref: number[];           // precio con volatilidad del 5 %
  sel: number[];           // precio con la volatilidad elegida
  pRef: number;
  pSel: number;
  realized: number;        // volatilidad anualizada observada en la trayectoria elegida
  negYears: number;        // años naturales con rentabilidad negativa (de 5)
}

export function computeVol(s: S7): D7 {
  const z = normals(s.seed);
  const dt = 1 / DAYS;
  const t: number[] = [0];
  const ref: number[] = [S0];
  const sel: number[] = [S0];
  let lr = 0;
  let ls = 0;
  const daily: number[] = [];
  for (let i = 0; i < N; i++) {
    const a = MU * dt + REF_SIGMA * Math.sqrt(dt) * z[i];
    const b = MU * dt + s.sigma * Math.sqrt(dt) * z[i];
    lr += a;
    ls += b;
    daily.push(b);
    t.push((i + 1) / DAYS);
    ref.push(S0 * Math.exp(lr));
    sel.push(S0 * Math.exp(ls));
  }
  let negYears = 0;
  for (let y = 0; y < YEARS; y++) if (sel[(y + 1) * DAYS] < sel[y * DAYS]) negYears++;
  return { t, ref, sel, pRef: probLoss(REF_SIGMA), pSel: probLoss(s.sigma), realized: sampleVol(daily) * Math.sqrt(DAYS), negYears };
}

const M = { top: 12, right: 16, bottom: 44, left: 52 };
const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const dens = (x: number, s: number) => Math.exp(-((x - MU) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));

export const chart07: ChartDef<S7, D7> = {
  id: 'volatilidad',
  simulated: true,
  defaults: { sigma: 0.25, seed: 7 },
  sliders: [
    { key: 'sigma', label: 'c7.sigma', min: 0.02, max: 0.5, step: 0.01, format: (v, c) => pct(v, c, 0) },
  ],
  compute: computeVol,
  panels: [
    {
      id: 'trayectorias',
      title: (c) => c.tr('c7.panelLeft'),
      height: () => 320,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('c7.legendRef') },
          { cls: 's2', label: ctx.tr('c7.legendSel', { s: pct(s.sigma, ctx, 0) }) },
          { cls: 'muted', label: ctx.tr('c7.legendTrend'), dash: true },
        ];
        const h = 320;
        const lh = legendHeight(items, w - M.left - M.right);
        // Se dibuja un punto por semana (suficiente para el ojo, mucho más ligero).
        const idx: number[] = [];
        for (let i = 0; i <= N; i += 5) idx.push(i);
        if (idx[idx.length - 1] !== N) idx.push(N);
        const xs = idx.map((i) => d.t[i]);
        const a = idx.map((i) => d.ref[i]);
        const b = idx.map((i) => d.sel[i]);
        const trend = xs.map((x) => S0 * Math.exp(MU * x));
        const L = Math.log10;
        const lo = Math.min(...a, ...b, ...trend);
        const hi = Math.max(...a, ...b, ...trend);
        const sx = linear([0, YEARS], [M.left, w - M.right]);
        const sy = linear([L(lo) - 0.02, L(hi) + 0.02], [h - M.bottom, M.top + lh + 8]);
        let ticks: number[] = [];
        for (const v of [10, 15, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 250, 300, 400, 500, 700, 1000]) if (v >= lo && v <= hi) ticks.push(v);
        while (ticks.length > 7) ticks = ticks.filter((_, i) => i % 2 === 0);
        return svgOpen(w, h, ctx.tr('c7.panelLeft'), ctx.tr('c7.descLeft', { s: pct(s.sigma, ctx, 0), e: fmtNum(d.sel[N], 0, ctx.fmt), r: fmtNum(d.ref[N], 0, ctx.fmt) }), 'c7a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, ticks: ticks.map(L), format: (v) => fmtNum(10 ** v, 0, ctx.fmt) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, ticks: [0, 1, 2, 3, 4, 5], label: ctx.tr('c7.axisYears') }) +
          `<path class="muted line dash" d="${pathFrom(xs, trend.map(L), sx, sy)}"/>` +
          `<path class="s2 line" d="${pathFrom(xs, b.map(L), sx, sy)}"/>` +
          `<path class="s1 line thick" d="${pathFrom(xs, a.map(L), sx, sy)}"/>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, YEARS], [M.left, w - M.right]);
        const x = Math.min(YEARS, Math.max(0, sx.invert(xpx)));
        const i = Math.round(x * DAYS);
        return { x: sx(d.t[i]), lines: [ctx.tr('c7.yearN', { y: fmtNum(d.t[i], 1, ctx.fmt) }), `${ctx.tr('c7.legendRef')}: ${fmtNum(d.ref[i], 1, ctx.fmt)}`, `${pct(s.sigma, ctx, 0)}: ${fmtNum(d.sel[i], 1, ctx.fmt)}`] };
      },
    },
    {
      id: 'distribucion',
      title: (c) => c.tr('c7.panelRight'),
      height: () => 320,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('c7.legendRef') },
          { cls: 's2', label: ctx.tr('c7.legendSel', { s: pct(s.sigma, ctx, 0) }) },
          { cls: 'neg', label: ctx.tr('c7.legendLoss'), box: true },
        ];
        const h = 320;
        const lh = legendHeight(items, w - M.left - M.right);
        const span = Math.max(0.2, 3.2 * Math.max(s.sigma, REF_SIGMA));
        const x0 = MU - span;
        const x1 = MU + span;
        const xs: number[] = [];
        for (let i = 0; i <= 240; i++) xs.push(x0 + ((x1 - x0) * i) / 240);
        const yr = xs.map((x) => dens(x, REF_SIGMA));
        const ys = xs.map((x) => dens(x, s.sigma));
        const ymax = Math.max(...yr, ...ys) * 1.08;
        const sx = linear([x0, x1], [M.left, w - M.right]);
        const sy = linear([0, ymax], [h - M.bottom, M.top + lh + 8]);
        const negX = xs.filter((x) => x <= 0);
        const zeroes = negX.map(() => 0);
        const negSel = negX.map((x) => dens(x, s.sigma));
        const negRef = negX.map((x) => dens(x, REF_SIGMA));
        const labX = sx(Math.max(x0 + span * 0.15, -span * 0.45));
        return svgOpen(w, h, ctx.tr('c7.panelRight'), ctx.tr('c7.descRight', { s: pct(s.sigma, ctx, 0), p: pct(d.pSel, ctx), pr: pct(d.pRef, ctx) }), 'c7b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, grid: true, format: () => '' }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('c7.axisReturn') }) +
          (negX.length > 1 ? `<path class="neg-zone" d="${areaFrom(negX, zeroes, negSel, sx, sy)}"/>` : '') +
          (negX.length > 1 ? `<path class="neg-zone" d="${areaFrom(negX, zeroes, negRef, sx, sy)}"/>` : '') +
          `<line class="zero" x1="${r1(sx(0))}" x2="${r1(sx(0))}" y1="${r1(sy(0))}" y2="${r1(sy(ymax))}"/>` +
          `<path class="s1 line thick" d="${pathFrom(xs, yr, sx, sy)}"/>` +
          `<path class="s2 line" d="${pathFrom(xs, ys, sx, sy)}"/>` +
          `<text class="value-label" x="${r1(labX)}" y="${r1(sy(ymax * 0.55))}" text-anchor="middle">${esc(ctx.tr('c7.lossLabel', { p: pct(d.pSel, ctx) }))}</text>` +
          `<text class="value-label small" x="${r1(labX)}" y="${r1(sy(ymax * 0.55) + 16)}" text-anchor="middle">${esc(ctx.tr('c7.lossLabelRef', { p: pct(d.pRef, ctx) }))}</text>` +
          '</svg>';
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c7.statLossSel', { s: pct(s.sigma, ctx, 0) }), value: pct(d.pSel, ctx) },
    { label: ctx.tr('c7.statLossRef'), value: pct(d.pRef, ctx) },
    { label: ctx.tr('c7.statRealized'), value: pct(d.realized, ctx) },
    { label: ctx.tr('c7.statNegYears'), value: `${d.negYears} / ${YEARS}` },
  ],
  describe: (d, s, ctx) => ctx.tr('c7.describe', {
    s: pct(s.sigma, ctx, 0), p: pct(d.pSel, ctx), pr: pct(d.pRef, ctx), v: pct(d.realized, ctx), n: d.negYears,
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c7.tableCaption'),
    head: [ctx.tr('c7.sigma'), ctx.tr('c7.colLoss')],
    rows: [0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5].concat(s.sigma).filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b)
      .map((v) => [pct(v, ctx, 0), pct(probLoss(v), ctx)]),
  }),
};
