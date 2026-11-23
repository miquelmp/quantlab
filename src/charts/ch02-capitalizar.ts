/**
 * Capítulo 2 · Capitalizar y descontar.
 * Izquierda: 1.000 € con interés simple y compuesto; la diferencia sombreada son «intereses sobre intereses».
 * Derecha: factor de descuento 1/(1+i)^t para el tipo elegido y para ±2 puntos.
 */
import type { ChartDef, ChartCtx } from './types';
import { linear, pathFrom, areaFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtPct, fmtNum, fmtEur } from '../lib/format';

export interface S2 extends Record<string, number> { i: number; T: number }
export interface D2 {
  years: number[];
  simple: number[];
  compound: number[];
  disc: number[];
  discLo: number[];   // tipo − 2 puntos (factor mayor)
  discHi: number[];   // tipo + 2 puntos (factor menor)
}

export const P0 = 1000;
export const futureValue = (vp: number, i: number, t: number) => vp * (1 + i) ** t;
export const simpleValue = (vp: number, i: number, t: number) => vp * (1 + i * t);
export const discountFactor = (i: number, t: number) => (1 + i) ** -t;
export const presentValue = (flows: number[], i: number) => flows.reduce((a, c, k) => a + c / (1 + i) ** (k + 1), 0);
/** Cuota constante de un préstamo (renta constante): C = VP · i / (1 − (1+i)^−T). */
export const annuityPayment = (vp: number, i: number, T: number) => (i === 0 ? vp / T : (vp * i) / (1 - (1 + i) ** -T));

const M = { top: 12, right: 16, bottom: 44, left: 60 };
const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const eur = (v: number, ctx: ChartCtx, d = 0) => fmtEur(v, d, ctx.fmt);
const fac = (v: number, ctx: ChartCtx) => fmtNum(v, 3, ctx.fmt);

function compute(s: S2): D2 {
  const years: number[] = [];
  const simple: number[] = [];
  const compound: number[] = [];
  const disc: number[] = [];
  const discLo: number[] = [];
  const discHi: number[] = [];
  const n = 200;
  for (let k = 0; k <= n; k++) {
    const t = (s.T * k) / n;
    years.push(t);
    simple.push(simpleValue(P0, s.i, t));
    compound.push(futureValue(P0, s.i, t));
    disc.push(discountFactor(s.i, t));
    discLo.push(discountFactor(s.i - 0.02, t));
    discHi.push(discountFactor(s.i + 0.02, t));
  }
  return { years, simple, compound, disc, discLo, discHi };
}

const last = (a: number[]) => a[a.length - 1];

export const chart02: ChartDef<S2, D2> = {
  id: 'capitalizar',
  simulated: false,
  defaults: { i: 0.04, T: 20 },
  sliders: [
    { key: 'i', label: 'c2.rate', min: -0.01, max: 0.1, step: 0.001, format: (v, c) => pct(v, c, 1) },
    { key: 'T', label: 'c2.horizon', min: 1, max: 40, step: 1, format: (v, c) => c.tr('c2.years', { n: v }) },
  ],
  compute,
  panels: [
    {
      id: 'capitalizar',
      title: (c) => c.tr('c2.panelLeft'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('c2.legendCompound') },
          { cls: 's2', label: ctx.tr('c2.legendSimple'), dash: true },
          { cls: 'band', label: ctx.tr('c2.legendInterest'), box: true },
        ];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const all = [...d.simple, ...d.compound];
        const lo = Math.min(P0, ...all);
        const hi = Math.max(P0 * 1.1, ...all);
        const sx = linear([0, s.T], [M.left, w - M.right]);
        const sy = linear([lo - (hi - lo) * 0.05, hi + (hi - lo) * 0.05], [h - M.bottom, M.top + lh + 8]);
        const vf = last(d.compound);
        const vs = last(d.simple);
        const gap = vf - vs;
        const px = sx(s.T);
        const midY = (sy(vf) + sy(vs)) / 2;
        // Etiqueta «intereses sobre intereses» solo si el área se ve.
        const showGap = Math.abs(sy(vf) - sy(vs)) > 14;
        return svgOpen(w, h, ctx.tr('c2.panelLeft'), ctx.tr('c2.descLeft', { i: pct(s.i, ctx), T: s.T, vf: eur(vf, ctx, 2), vs: eur(vs, ctx, 2) }), 'c2a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => eur(v, ctx) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('c2.axisYears') }) +
          `<path class="band" d="${areaFrom(d.years, d.simple, d.compound, sx, sy)}"/>` +
          `<path class="s2 line dash" d="${pathFrom(d.years, d.simple, sx, sy)}"/>` +
          `<path class="s1 line thick" d="${pathFrom(d.years, d.compound, sx, sy)}"/>` +
          `<circle class="s1 dot" cx="${r1(px)}" cy="${r1(sy(vf))}" r="5"/>` +
          `<text class="value-label" x="${r1(px - 8)}" y="${r1(sy(vf) + (vf >= vs ? -10 : 18))}" text-anchor="end">${esc(eur(vf, ctx))}</text>` +
          (showGap ? `<text class="value-label small" x="${r1(sx(s.T * 0.72))}" y="${r1(midY + 4)}" text-anchor="middle">${esc(ctx.tr('c2.gapLabel', { g: eur(gap, ctx) }))}</text>` : '') +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, s.T], [M.left, w - M.right]);
        const t = Math.round(Math.min(s.T, Math.max(0, sx.invert(xpx))));
        const c = futureValue(P0, s.i, t);
        const si = simpleValue(P0, s.i, t);
        return { x: sx(t), lines: [ctx.tr('c2.years', { n: t }), `${ctx.tr('c2.legendCompound')}: ${eur(c, ctx, 2)}`, `${ctx.tr('c2.legendSimple')}: ${eur(si, ctx, 2)}`, `${ctx.tr('c2.legendInterest')}: ${eur(c - si, ctx, 2)}`] };
      },
    },
    {
      id: 'descontar',
      title: (c) => c.tr('c2.panelRight'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('c2.legendDisc', { i: pct(s.i, ctx) }) },
          { cls: 'muted', label: ctx.tr('c2.legendPm'), dash: true },
        ];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const hi = Math.max(1.05, ...d.discLo) * 1.02;
        const sx = linear([0, s.T], [M.left, w - M.right]);
        const sy = linear([0, hi], [h - M.bottom, M.top + lh + 8]);
        const f = last(d.disc);
        const px = sx(s.T);
        return svgOpen(w, h, ctx.tr('c2.panelRight'), ctx.tr('c2.descRight', { i: pct(s.i, ctx), T: s.T, f: fac(f, ctx) }), 'c2b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('c2.axisYears') }) +
          `<line class="ref" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(1))}" y2="${r1(sy(1))}"/>` +
          `<path class="muted line dash" d="${pathFrom(d.years, d.discLo, sx, sy)}"/>` +
          `<path class="muted line dash" d="${pathFrom(d.years, d.discHi, sx, sy)}"/>` +
          `<path class="s1 line thick" d="${pathFrom(d.years, d.disc, sx, sy)}"/>` +
          `<circle class="s1 dot" cx="${r1(px)}" cy="${r1(sy(f))}" r="5"/>` +
          `<text class="value-label" x="${r1(px - 8)}" y="${r1(sy(f) - 10)}" text-anchor="end">${esc(fac(f, ctx))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, s.T], [M.left, w - M.right]);
        const t = Math.round(Math.min(s.T, Math.max(0, sx.invert(xpx))));
        return {
          x: sx(t),
          lines: [
            ctx.tr('c2.years', { n: t }),
            `${pct(s.i - 0.02, ctx)}: ${fac(discountFactor(s.i - 0.02, t), ctx)}`,
            `${pct(s.i, ctx)}: ${fac(discountFactor(s.i, t), ctx)}`,
            `${pct(s.i + 0.02, ctx)}: ${fac(discountFactor(s.i + 0.02, t), ctx)}`,
          ],
        };
      },
    },
  ],
  stats(d, s, ctx) {
    const vf = last(d.compound);
    const vs = last(d.simple);
    return [
      { label: ctx.tr('c2.statCompound', { T: s.T }), value: eur(vf, ctx, 2) },
      { label: ctx.tr('c2.statSimple', { T: s.T }), value: eur(vs, ctx, 2) },
      { label: ctx.tr('c2.legendInterest'), value: eur(vf - vs, ctx, 2) },
      { label: ctx.tr('c2.statPv', { T: s.T }), value: eur(P0 * last(d.disc), ctx, 2), note: s.i < 0 ? ctx.tr('c2.negNote') : undefined },
    ];
  },
  describe: (d, s, ctx) => ctx.tr('c2.describe', {
    i: pct(s.i, ctx), T: s.T, vf: eur(last(d.compound), ctx, 2), vs: eur(last(d.simple), ctx, 2),
    g: eur(last(d.compound) - last(d.simple), ctx, 2), pv: eur(P0 * last(d.disc), ctx, 2),
  }),
  table(d, s, ctx) {
    const ts = [...new Set([1, 2, 3, 5, 10, 15, 20, 25, 30, 40].filter((t) => t <= s.T).concat(s.T))].sort((a, b) => a - b);
    return {
      caption: ctx.tr('c2.tableCaption', { i: pct(s.i, ctx) }),
      head: [ctx.tr('c2.axisYears'), ctx.tr('c2.legendSimple'), ctx.tr('c2.legendCompound'), ctx.tr('c2.colFactor')],
      rows: ts.map((t) => [String(t), eur(simpleValue(P0, s.i, t), ctx, 2), eur(futureValue(P0, s.i, t), ctx, 2), fac(discountFactor(s.i, t), ctx)]),
    };
  },
};
