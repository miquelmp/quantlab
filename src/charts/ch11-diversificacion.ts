/**
 * Capítulo 11 · Hasta dónde llega la diversificación.
 * Izquierda: volatilidad de la cartera de pesos iguales frente al número de activos, con el suelo
 * σ√ρ y el riesgo específico aún no diversificado. Derecha: dos activos (acciones 18 % y bonos
 * 6 %, como en el ejemplo): volatilidad frente al peso en acciones para varias correlaciones.
 */
import type { ChartDef, ChartCtx } from './types';
import { linear, pathFrom, areaFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S11 extends Record<string, number> { sigma: number; rho: number; nmax: number }

/** Volatilidad de N activos iguales (volatilidad σ, correlación ρ, pesos 1/N). */
export const equalWeightVol = (n: number, sigma: number, rho: number) => sigma * Math.sqrt(1 / n + (1 - 1 / n) * rho);
export const floorVol = (sigma: number, rho: number) => sigma * Math.sqrt(rho);
export const twoAssetVol = (w: number, s1: number, s2: number, rho: number) =>
  Math.sqrt(Math.max(0, w * w * s1 * s1 + (1 - w) * (1 - w) * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2));
/** Número efectivo de activos: 1 / Σ w². */
export const effectiveN = (w: number[]) => 1 / w.reduce((a, x) => a + x * x, 0);

export const S_EQ = 0.18;
export const S_BD = 0.06;
const REF_RHOS = [-1, 0, 1];

export interface D11 { ns: number[]; vols: number[]; floor: number; volMax: number }

export function computeDiv(s: S11): D11 {
  const nmax = Math.round(s.nmax);
  const ns: number[] = [];
  for (let n = 1; n <= nmax; n++) ns.push(n);
  const vols = ns.map((n) => equalWeightVol(n, s.sigma, s.rho));
  const floor = floorVol(s.sigma, s.rho);
  return { ns, vols, floor, volMax: vols[vols.length - 1] };
}

const M = { top: 12, right: 16, bottom: 44, left: 52 };
const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const num = (v: number, ctx: ChartCtx, d = 2) => fmtNum(v, d, ctx.fmt);

export const chart11: ChartDef<S11, D11> = {
  id: 'diversificacion',
  simulated: false,
  defaults: { sigma: 0.25, rho: 0.2, nmax: 50 },
  sliders: [
    { key: 'sigma', label: 'c11.sigma', min: 0.1, max: 0.5, step: 0.01, format: (v, c) => pct(v, c, 0) },
    { key: 'rho', label: 'c11.rho', min: 0, max: 0.9, step: 0.05, format: (v, c) => num(v, c) },
    { key: 'nmax', label: 'c11.nmax', min: 5, max: 200, step: 1, format: (v, c) => fmtNum(v, 0, c.fmt) },
  ],
  compute: computeDiv,
  panels: [
    {
      id: 'activos',
      title: (c) => c.tr('c11.panelLeft'),
      height: () => 320,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('c11.legendVol') },
          { cls: 'muted', label: ctx.tr('c11.legendFloor'), dash: true },
          { cls: 'band', label: ctx.tr('c11.legendSpecific'), box: true },
        ];
        const h = panelH(w, 320);
        const lh = legendHeight(items, w - M.left - M.right);
        const nmax = d.ns.length;
        const sx = linear([1, nmax], [M.left, w - M.right]);
        const sy = linear([0, s.sigma * 1.08], [h - M.bottom, M.top + lh + 8]);
        const fl = d.ns.map(() => d.floor);
        const lab = (n: number) => `<circle class="muted dot" cx="${r1(sx(n))}" cy="${r1(sy(equalWeightVol(n, s.sigma, s.rho)))}" r="3.5"/>`;
        const marks = [5, 20, 50, 100, 200].filter((n) => n <= nmax).map(lab).join('');
        const midN = Math.max(2, Math.round(nmax * 0.35));
        const midY = (sy(equalWeightVol(midN, s.sigma, s.rho)) + sy(d.floor)) / 2;
        const showLabel = sy(d.floor) - sy(equalWeightVol(midN, s.sigma, s.rho)) > 18;
        return svgOpen(w, h, ctx.tr('c11.panelLeft'), ctx.tr('c11.descLeft', { n: nmax, v: pct(d.volMax, ctx), f: pct(d.floor, ctx) }), 'c11a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('c11.axisN') }) +
          `<path class="band" d="${areaFrom(d.ns, fl, d.vols, sx, sy)}"/>` +
          `<path class="muted line dash" d="${pathFrom([1, nmax], [d.floor, d.floor], sx, sy)}"/>` +
          `<path class="s1 line thick" d="${pathFrom(d.ns, d.vols, sx, sy)}"/>` +
          marks +
          (showLabel ? `<text class="value-label small" x="${r1(sx(midN) + 6)}" y="${r1(midY + 4)}">${esc(ctx.tr('c11.specificLabel'))}</text>` : '') +
          `<text class="value-label small" x="${r1(w - M.right - 4)}" y="${r1(sy(d.floor) + 16)}" text-anchor="end">${esc(ctx.tr('c11.floorLabel', { f: pct(d.floor, ctx) }))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const nmax = d.ns.length;
        const sx = linear([1, nmax], [M.left, w - M.right]);
        const n = Math.round(Math.min(nmax, Math.max(1, sx.invert(xpx))));
        return { x: sx(n), lines: [ctx.tr('c11.nAssets', { n }), `${ctx.tr('c11.legendVol')}: ${pct(equalWeightVol(n, s.sigma, s.rho), ctx)}`, `${ctx.tr('c11.legendFloor')}: ${pct(d.floor, ctx)}`] };
      },
    },
    {
      id: 'dos',
      title: (c) => c.tr('c11.panelRight'),
      height: () => 320,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('c11.legendRho', { r: num(s.rho, ctx) }) },
          { cls: 'muted', label: ctx.tr('c11.legendRefs'), dash: true },
        ];
        const h = panelH(w, 320);
        const lh = legendHeight(items, w - M.left - M.right);
        const ws: number[] = [];
        for (let i = 0; i <= 100; i++) ws.push(i / 100);
        const sx = linear([0, 1], [M.left, w - M.right]);
        const sy = linear([0, 0.2], [h - M.bottom, M.top + lh + 8]);
        let refs = '';
        for (const r of REF_RHOS) {
          const ys = ws.map((x) => twoAssetVol(x, S_EQ, S_BD, r));
          refs += `<path class="muted line dash" d="${pathFrom(ws, ys, sx, sy)}"/>` +
            `<text class="value-label small" x="${r1(sx(r === -1 ? 0.12 : 0.4))}" y="${r1(sy(ys[r === -1 ? 12 : 40]) + (r === 1 ? -8 : 16))}" text-anchor="middle">ρ = ${num(r, ctx, 0)}</text>`;
        }
        const ys = ws.map((x) => twoAssetVol(x, S_EQ, S_BD, s.rho));
        const v60 = twoAssetVol(0.6, S_EQ, S_BD, s.rho);
        return svgOpen(w, h, ctx.tr('c11.panelRight'), ctx.tr('c11.descRight', { r: num(s.rho, ctx), v: pct(v60, ctx) }), 'c11b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('c11.axisW') }) +
          refs +
          `<path class="s1 line thick" d="${pathFrom(ws, ys, sx, sy)}"/>` +
          `<circle class="s2 dot" cx="${r1(sx(0.6))}" cy="${r1(sy(v60))}" r="6"/>` +
          `<text class="value-label" x="${r1(sx(0.6) + 10)}" y="${r1(sy(v60) + 22)}" text-anchor="start">${esc(`60/40: ${pct(v60, ctx)}`)}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, 1], [M.left, w - M.right]);
        const x = Math.min(1, Math.max(0, sx.invert(xpx)));
        return { x: sx(x), lines: [`${ctx.tr('c11.axisW')}: ${pct(x, ctx, 0)}`, ...[-1, 0, s.rho, 1].map((r) => `ρ = ${num(r, ctx)}: ${pct(twoAssetVol(x, S_EQ, S_BD, r), ctx)}`)] };
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c11.statOne'), value: pct(s.sigma, ctx) },
    { label: ctx.tr('c11.statN', { n: d.ns.length }), value: pct(d.volMax, ctx) },
    { label: ctx.tr('c11.statFloor'), value: pct(d.floor, ctx) },
    { label: ctx.tr('c11.stat6040', { r: num(s.rho, ctx) }), value: pct(twoAssetVol(0.6, S_EQ, S_BD, s.rho), ctx), note: ctx.tr('c11.weightedNote', { v: pct(0.6 * S_EQ + 0.4 * S_BD, ctx) }) },
  ],
  describe: (d, s, ctx) => ctx.tr('c11.describe', {
    s: pct(s.sigma, ctx, 0), r: num(s.rho, ctx), n: d.ns.length, v: pct(d.volMax, ctx), f: pct(d.floor, ctx),
    v5: pct(equalWeightVol(5, s.sigma, s.rho), ctx), b: pct(twoAssetVol(0.6, S_EQ, S_BD, s.rho), ctx),
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c11.tableCaption', { s: pct(s.sigma, ctx, 0), r: num(s.rho, ctx) }),
    head: [ctx.tr('c11.axisN'), ctx.tr('c11.legendVol')],
    rows: [1, 2, 5, 10, 20, 50, 100, 200].map((n) => [fmtNum(n, 0, ctx.fmt), pct(equalWeightVol(n, s.sigma, s.rho), ctx)]).concat([[ctx.tr('c11.infinite'), pct(d.floor, ctx)]]),
  }),
};
