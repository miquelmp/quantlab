/**
 * Capítulo 10 · Moverse juntos.
 * Izquierda: nube de 500 pares de rentabilidades diarias con la correlación elegida, o un caso no
 * lineal (parábola) con correlación casi nula. Derecha: volatilidad de una cartera 50/50 de dos
 * activos de volatilidad 20 % en función de la correlación.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng } from './rng';
import { linear, pathFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S10 extends Record<string, number> { rho: number; mode: number; seed: number }

export const PAIRS = 500;
export const DAILY = 0.01;
export const ASSET_VOL = 0.2;

/** Volatilidad de una cartera con pesos w y 1 − w (volatilidades s1, s2 y correlación ρ). */
export const portVol = (rho: number, s1 = ASSET_VOL, s2 = ASSET_VOL, w = 0.5) =>
  Math.sqrt(Math.max(0, w * w * s1 * s1 + (1 - w) * (1 - w) * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2));

export function correlation(x: ArrayLike<number>, y: ArrayLike<number>): number {
  const n = x.length;
  let mx = 0; let my = 0;
  for (let i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
  mx /= n; my /= n;
  let sxy = 0; let sxx = 0; let syy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx; const b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return sxy / Math.sqrt(sxx * syy);
}

let cache: { seed: number; z1: Float64Array; z2: Float64Array } | null = null;
function normals(seed: number) {
  if (cache && cache.seed === seed) return cache;
  const rng = new Rng(seed);
  const z1 = new Float64Array(PAIRS);
  const z2 = new Float64Array(PAIRS);
  for (let i = 0; i < PAIRS; i++) { z1[i] = rng.normal(); z2[i] = rng.normal(); }
  cache = { seed, z1, z2 };
  return cache;
}

export interface D10 { x: Float64Array; y: Float64Array; r: number; vol: number }

export function computeCorr(s: S10): D10 {
  const { z1, z2 } = normals(s.seed);
  const x = new Float64Array(PAIRS);
  const y = new Float64Array(PAIRS);
  const c = Math.sqrt(Math.max(0, 1 - s.rho * s.rho));
  const parab = Math.round(s.mode) === 1;
  for (let i = 0; i < PAIRS; i++) {
    // Parábola: relación perfecta y = x² (centrada). La mitad de los puntos son el reflejo de la
    // otra mitad (x → −x), así que la nube es simétrica y la correlación es prácticamente cero.
    const zx = parab && i >= PAIRS / 2 ? -z1[i - PAIRS / 2] : z1[i];
    x[i] = DAILY * zx;
    y[i] = parab ? (zx * zx - 1) * DAILY / Math.SQRT2 : DAILY * (s.rho * zx + c * z2[i]);
  }
  return { x, y, r: correlation(x, y), vol: portVol(s.rho) };
}

const M = { top: 12, right: 16, bottom: 44, left: 52 };
const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const num = (v: number, ctx: ChartCtx, d = 2) => fmtNum(v, d, ctx.fmt);
const modeName = (v: number, ctx: ChartCtx) => ctx.tr(Math.round(v) === 1 ? 'c10.modeParab' : 'c10.modeLinear');

export const chart10: ChartDef<S10, D10> = {
  id: 'correlacion',
  simulated: true,
  defaults: { rho: 0.5, mode: 0, seed: 10 },
  sliders: [
    { key: 'rho', label: 'c10.rho', min: -1, max: 1, step: 0.05, format: (v, c) => num(v, c) },
    { key: 'mode', label: 'c10.mode', min: 0, max: 1, step: 1, format: modeName },
  ],
  compute: computeCorr,
  panels: [
    {
      id: 'nube',
      title: (c) => c.tr('c10.panelLeft'),
      height: () => 340,
      render(d, s, w, ctx) {
        const h = 340;
        const items = [{ cls: 'hist', label: ctx.tr('c10.legendPairs'), box: true }];
        const lh = legendHeight(items, w - M.left - M.right);
        const lim = 0.035;
        const side = Math.min(w - M.left - M.right, h - M.bottom - (M.top + lh + 8));
        const x0 = M.left + (w - M.left - M.right - side) / 2;
        const sx = linear([-lim, lim], [x0, x0 + side]);
        const sy = linear([-lim, lim], [M.top + lh + 8 + side, M.top + lh + 8]);
        let dots = '';
        for (let i = 0; i < PAIRS; i++) {
          if (Math.abs(d.x[i]) > lim || Math.abs(d.y[i]) > lim) continue;
          dots += `<circle class="pt-in" cx="${r1(sx(d.x[i]))}" cy="${r1(sy(d.y[i]))}" r="2.2" opacity="0.6"/>`;
        }
        const tk = [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03];
        return svgOpen(w, h, ctx.tr('c10.panelLeft'), ctx.tr('c10.descLeft', { m: modeName(s.mode, ctx), r: num(d.r, ctx) }), 'c10a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, x0, x0 + side, { fmt: ctx.fmt, ticks: tk, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, M.top + lh + 8 + side, M.top + lh + 8, { fmt: ctx.fmt, ticks: tk, format: (v) => pct(v, ctx, 0), label: ctx.tr('c10.axisX') }) +
          `<line class="zero" x1="${r1(sx(0))}" x2="${r1(sx(0))}" y1="${r1(sy(-lim))}" y2="${r1(sy(lim))}"/>` +
          `<line class="zero" x1="${r1(sx(-lim))}" x2="${r1(sx(lim))}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
          dots +
          `<text class="value-label" x="${r1(x0 + 8)}" y="${r1(M.top + lh + 26)}">${esc(ctx.tr('c10.rLabel', { r: num(d.r, ctx) }))}</text>` +
          '</svg>';
      },
    },
    {
      id: 'cartera',
      title: (c) => c.tr('c10.panelRight'),
      height: () => 340,
      render(d, s, w, ctx) {
        const h = 340;
        const items = [{ cls: 's1', label: ctx.tr('c10.legendVol') }];
        const lh = legendHeight(items, w - M.left - M.right);
        const xs: number[] = [];
        for (let i = 0; i <= 100; i++) xs.push(-1 + (2 * i) / 100);
        const ys = xs.map((r) => portVol(r));
        const sx = linear([-1, 1], [M.left, w - M.right]);
        const sy = linear([0, 0.22], [h - M.bottom, M.top + lh + 8]);
        let refs = '';
        for (const r of [-1, -0.5, 0, 0.5, 1]) refs += `<circle class="muted dot" cx="${r1(sx(r))}" cy="${r1(sy(portVol(r)))}" r="4"/>` +
          `<text class="value-label small" x="${r1(sx(r) + (r === 1 ? -6 : 6))}" y="${r1(sy(portVol(r)) - 8)}" text-anchor="${r === 1 ? 'end' : 'start'}">${esc(pct(portVol(r), ctx))}</text>`;
        const linear0 = Math.round(s.mode) === 0;
        const px = sx(s.rho);
        const py = sy(d.vol);
        return svgOpen(w, h, ctx.tr('c10.panelRight'), ctx.tr('c10.descRight', { rho: num(s.rho, ctx), v: pct(d.vol, ctx) }), 'c10b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, ticks: [-1, -0.5, 0, 0.5, 1], format: (v) => num(v, ctx, 1), label: ctx.tr('c10.rho') }) +
          `<path class="s1 line thick" d="${pathFrom(xs, ys, sx, sy)}"/>` +
          refs +
          (linear0 ? `<circle class="s2 dot" cx="${r1(px)}" cy="${r1(py)}" r="7"/>` : '') +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([-1, 1], [M.left, w - M.right]);
        const r = Math.min(1, Math.max(-1, sx.invert(xpx)));
        return { x: sx(r), lines: [`ρ = ${num(r, ctx)}`, `${ctx.tr('c10.legendVol')}: ${pct(portVol(r), ctx)}`] };
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c10.statR'), value: num(d.r, ctx), note: Math.round(s.mode) === 1 ? ctx.tr('c10.parabNote') : ctx.tr('c10.targetNote', { rho: num(s.rho, ctx) }) },
    { label: ctx.tr('c10.statVol', { rho: num(s.rho, ctx) }), value: pct(d.vol, ctx) },
    { label: ctx.tr('c10.statReduction'), value: pct(1 - d.vol / ASSET_VOL, ctx, 0) },
  ],
  describe: (d, s, ctx) => Math.round(s.mode) === 1
    ? ctx.tr('c10.describeParab', { r: num(d.r, ctx) })
    : ctx.tr('c10.describe', { rho: num(s.rho, ctx), r: num(d.r, ctx), v: pct(d.vol, ctx) }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c10.tableCaption'),
    head: [ctx.tr('c10.rho'), ctx.tr('c10.legendVol')],
    rows: [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1].map((r) => [num(r, ctx), pct(portVol(r), ctx)]),
  }),
};
