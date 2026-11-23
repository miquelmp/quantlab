/**
 * Tema D · Estacionariedad y cointegración (RF-TEM-02).
 * Izquierda: diferencial s_t = φ·s_{t−1} + ε_t simulado, con las bandas ±2 desviaciones típicas
 * estacionarias; con φ = 1 es un paseo aleatorio y deja de volver a cero.
 * Derecha: semivida de reversión ln 2/(−ln φ) según φ.
 *
 * Truco de rendimiento: los ruidos ε solo dependen de la semilla; φ solo los combina.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng } from './rng';
import { linear, pathFrom, areaFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtNum } from '../lib/format';

export interface SD extends Record<string, number> { phi: number; days: number; seed: number }
export const MAX_DAYS = 1000;

export const halfLife = (phi: number) => (phi > 0 && phi < 1 ? Math.log(2) / -Math.log(phi) : Infinity);
/** Desviación típica estacionaria de un AR(1) con ruido de desviación 1. */
export const stationarySd = (phi: number) => (Math.abs(phi) < 1 ? 1 / Math.sqrt(1 - phi * phi) : Infinity);

interface Base { seed: number; e: Float64Array }
let cache: Base | null = null;
function base(seed: number): Base {
  if (cache && cache.seed === seed) return cache;
  const rng = new Rng(seed);
  const e = new Float64Array(MAX_DAYS);
  for (let i = 0; i < MAX_DAYS; i++) e[i] = rng.normal();
  cache = { seed, e };
  return cache;
}

export interface DD { ts: number[]; spread: number[]; sd: number; hl: number; crossings: number; phis: number[]; hls: number[] }

function compute(s: SD): DD {
  const n = Math.round(s.days);
  const { e } = base(s.seed);
  const ts: number[] = [0], spread: number[] = [0];
  let x = 0, crossings = 0;
  for (let t = 1; t <= n; t++) {
    const nx = s.phi * x + e[t - 1];
    if ((x < 0 && nx >= 0) || (x > 0 && nx <= 0)) crossings++;
    x = nx; ts.push(t); spread.push(x);
  }
  const phis: number[] = [], hls: number[] = [];
  for (let k = 0; k <= 200; k++) { const p = 0.5 + (0.499 * k) / 200; phis.push(p); hls.push(halfLife(p)); }
  return { ts, spread, sd: stationarySd(s.phi), hl: halfLife(s.phi), crossings, phis, hls };
}

const M = { top: 12, right: 16, bottom: 44, left: 48 };
const num = (v: number, c: ChartCtx, d = 1) => (Number.isFinite(v) ? fmtNum(v, d, c.fmt) : '∞');
const HL_MAX = 60;

export const chartD: ChartDef<SD, DD> = {
  id: 'cointegracion',
  simulated: true,
  defaults: { phi: 0.95, days: 250, seed: 4 },
  sliders: [
    { key: 'phi', label: 'tD.phi', min: 0.5, max: 1, step: 0.005, format: (v, c) => fmtNum(v, 3, c.fmt) },
    { key: 'days', label: 'tD.days', min: 50, max: MAX_DAYS, step: 10, format: (v, c) => c.tr('tD.nDays', { n: v }) },
  ],
  compute,
  panels: [
    {
      id: 'diferencial',
      title: (c) => c.tr('tD.panelLeft'),
      height: () => 300,
      render(d, s, w, ctx) {
        const finite = Number.isFinite(d.sd);
        const items = [{ cls: 's1', label: ctx.tr('tD.legendSpread') }, ...(finite ? [{ cls: 'band', label: ctx.tr('tD.legendBand'), box: true }] : [])];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const ext = Math.max(...d.spread.map(Math.abs), finite ? 2.4 * d.sd : 0, 3);
        const sx = linear([0, s.days], [M.left, w - M.right]);
        const sy = linear([-ext, ext], [h - M.bottom, M.top + lh + 8]);
        const band = finite ? `<path class="band" d="${areaFrom([0, s.days], [-2 * d.sd, -2 * d.sd], [2 * d.sd, 2 * d.sd], sx, sy)}"/>` : '';
        return svgOpen(w, h, ctx.tr('tD.panelLeft'), ctx.tr('tD.descLeft', { p: fmtNum(s.phi, 3, ctx.fmt), n: s.days, c: d.crossings }), 'tDa') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) + band +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('tD.axisDays') }) +
          `<line class="zero" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
          `<path class="s1 line" d="${pathFrom(d.ts, d.spread, sx, sy)}"/>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, s.days], [M.left, w - M.right]);
        const t = Math.round(Math.min(s.days, Math.max(0, sx.invert(xpx))));
        return { x: sx(t), lines: [ctx.tr('tD.nDays', { n: t }), `${ctx.tr('tD.legendSpread')}: ${fmtNum(d.spread[t], 2, ctx.fmt)}`] };
      },
    },
    {
      id: 'semivida',
      title: (c) => c.tr('tD.panelRight'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [{ cls: 's1', label: ctx.tr('tD.legendHl') }];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const sx = linear([0.5, 1], [M.left, w - M.right]);
        const sy = linear([0, HL_MAX], [h - M.bottom, M.top + lh + 8]);
        const ys = d.hls.map((v) => (v <= HL_MAX ? v : NaN));
        const shown = Math.min(d.hl, HL_MAX);
        const px = sx(s.phi);
        return svgOpen(w, h, ctx.tr('tD.panelRight'), ctx.tr('tD.descRight', { p: fmtNum(s.phi, 3, ctx.fmt), h: num(d.hl, ctx) }), 'tDb') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('tD.axisPhi') }) +
          `<path class="s1 line thick" d="${pathFrom(d.phis, ys, sx, sy)}"/>` +
          `<line class="guide" x1="${r1(px)}" x2="${r1(px)}" y1="${M.top + lh + 8}" y2="${h - M.bottom}"/>` +
          `<circle class="s1 dot" cx="${r1(px)}" cy="${r1(sy(shown))}" r="5"/>` +
          `<text class="value-label" x="${r1(px - 8)}" y="${r1(sy(shown) - 10)}" text-anchor="end">${esc(ctx.tr('tD.hlLabel', { h: num(d.hl, ctx) }))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0.5, 1], [M.left, w - M.right]);
        const p = Math.round(Math.min(0.999, Math.max(0.5, sx.invert(xpx))) * 1000) / 1000;
        return { x: sx(p), lines: [`φ = ${fmtNum(p, 3, ctx.fmt)}`, `${ctx.tr('tD.legendHl')}: ${num(halfLife(p), ctx)}`] };
      },
    },
  ],
  stats(d, s, ctx) {
    return [
      { label: ctx.tr('tD.statHl'), value: Number.isFinite(d.hl) ? ctx.tr('tD.nDays', { n: num(d.hl, ctx) }) : '∞', note: Number.isFinite(d.hl) ? undefined : ctx.tr('tD.rwNote') },
      { label: ctx.tr('tD.statSd'), value: num(d.sd, ctx, 2), panels: ['diferencial'] },
      { label: ctx.tr('tD.statCross'), value: String(d.crossings), panels: ['diferencial'] },
    ];
  },
  describe: (d, s, ctx) => ctx.tr(Number.isFinite(d.hl) ? 'tD.describe' : 'tD.describeRw', { p: fmtNum(s.phi, 3, ctx.fmt), h: num(d.hl, ctx), n: s.days, c: d.crossings }),
  table(d, s, ctx) {
    const ps = [...new Set([0.5, 0.8, 0.9, 0.95, 0.98, 0.99, 0.995, 1, s.phi])].sort((a, b) => a - b);
    return {
      caption: ctx.tr('tD.tableCaption'),
      head: ['φ', ctx.tr('tD.legendHl'), ctx.tr('tD.statSd')],
      rows: ps.map((p) => [fmtNum(p, 3, ctx.fmt), num(halfLife(p), ctx), num(stationarySd(p), ctx, 2)]),
    };
  },
};
