/**
 * Capítulo 1 · La asimetría de las pérdidas.
 * Izquierda: ganancia necesaria para recuperar una pérdida L, L/(1−L).
 * Derecha: rentabilidad logarítmica ln(1+R) frente a la simple R.
 */
import type { ChartDef, ChartCtx } from './types';
import { linear, pathFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc } from './svg';
import { fmtPct } from '../lib/format';

export interface S1 extends Record<string, number> { L: number; R: number }
export interface D1 { gain: number; r: number }

export const recoveryGain = (L: number) => L / (1 - L);
export const logReturn = (R: number) => Math.log(1 + R);

const M = { top: 12, right: 16, bottom: 44, left: 52 };

function pct(v: number, ctx: ChartCtx, d = 1) { return fmtPct(v, d, ctx.fmt); }

export const chart01: ChartDef<S1, D1> = {
  id: 'perdidas',
  simulated: false,
  defaults: { L: 0.2, R: 0.25 },
  sliders: [
    { key: 'L', label: 'c1.loss', min: 0, max: 0.9, step: 0.01, format: (v, c) => pct(v, c, 0) },
    { key: 'R', label: 'c1.simple', min: -0.6, max: 1, step: 0.01, format: (v, c) => pct(v, c, 0) },
  ],
  compute: (s) => ({ gain: recoveryGain(s.L), r: logReturn(s.R) }),
  panels: [
    {
      id: 'recuperar',
      title: (c) => c.tr('c1.panelLeft'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('c1.legendNeeded') },
          { cls: 'muted', label: ctx.tr('c1.legendSymmetric'), dash: true },
        ];
        const lh = legendHeight(items, w - M.left - M.right);
        const h = 300;
        const sx = linear([0, 0.9], [M.left, w - M.right]);
        const sy = linear([0, 9], [h - M.bottom, M.top + lh + 8]);
        const xs: number[] = [];
        const ys: number[] = [];
        for (let i = 0; i <= 180; i++) { const L = (0.9 * i) / 180; xs.push(L); ys.push(recoveryGain(L)); }
        const px = sx(s.L);
        const py = sy(d.gain);
        const label = `${pct(s.L, ctx, 0)} → ${pct(d.gain, ctx, 1)}`;
        const anchor = px > w * 0.6 ? 'end' : 'start';
        const lx = anchor === 'end' ? px - 10 : px + 10;
        return svgOpen(w, h, ctx.tr('c1.panelLeft'), ctx.tr('c1.descLeft', { L: pct(s.L, ctx, 0), g: pct(d.gain, ctx) }), 'c1a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('c1.axisLoss') }) +
          `<path class="muted dash line" d="${pathFrom([0, 0.9], [0, 0.9], sx, sy)}"/>` +
          `<path class="s1 line" d="${pathFrom(xs, ys, sx, sy)}"/>` +
          `<line class="guide" x1="${r1(px)}" x2="${r1(px)}" y1="${r1(sy(0))}" y2="${r1(py)}"/>` +
          `<line class="guide" x1="${M.left}" x2="${r1(px)}" y1="${r1(py)}" y2="${r1(py)}"/>` +
          `<circle class="s1 dot" cx="${r1(px)}" cy="${r1(py)}" r="6"/>` +
          `<text class="value-label" x="${r1(lx)}" y="${r1(Math.max(py - 10, M.top + lh + 20))}" text-anchor="${anchor}">${esc(label)}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, 0.9], [M.left, w - M.right]);
        const L = Math.min(0.9, Math.max(0, sx.invert(xpx)));
        return { x: sx(L), lines: [`${ctx.tr('c1.loss')}: ${pct(L, ctx, 1)}`, `${ctx.tr('c1.legendNeeded')}: ${pct(recoveryGain(L), ctx, 1)}`] };
      },
    },
    {
      id: 'logaritmica',
      title: (c) => c.tr('c1.panelRight'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('c1.legendLog') },
          { cls: 'muted', label: ctx.tr('c1.legendDiag'), dash: true },
        ];
        const lh = legendHeight(items, w - M.left - M.right);
        const h = 300;
        const sx = linear([-0.6, 1], [M.left, w - M.right]);
        const sy = linear([-1, 1], [h - M.bottom, M.top + lh + 8]);
        const xs: number[] = [];
        const ys: number[] = [];
        for (let i = 0; i <= 160; i++) { const R = -0.6 + (1.6 * i) / 160; xs.push(R); ys.push(logReturn(R)); }
        const px = sx(s.R);
        const diff = s.R - d.r;
        const anchor = px > w * 0.55 ? 'end' : 'start';
        const lx = anchor === 'end' ? px - 10 : px + 10;
        const ly = (sy(s.R) + sy(d.r)) / 2 + 4;
        return svgOpen(w, h, ctx.tr('c1.panelRight'), ctx.tr('c1.descRight', { R: pct(s.R, ctx, 0), r: pct(d.r, ctx), d: pct(diff, ctx) }), 'c1b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('c1.axisSimple') }) +
          `<line class="zero" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
          `<line class="zero" x1="${r1(sx(0))}" x2="${r1(sx(0))}" y1="${r1(sy(-1))}" y2="${r1(sy(1))}"/>` +
          `<path class="muted dash line" d="${pathFrom([-0.6, 1], [-0.6, 1], sx, sy)}"/>` +
          `<path class="s1 line" d="${pathFrom(xs, ys, sx, sy)}"/>` +
          `<line class="gap" x1="${r1(px)}" x2="${r1(px)}" y1="${r1(sy(s.R))}" y2="${r1(sy(d.r))}"/>` +
          `<circle class="muted dot" cx="${r1(px)}" cy="${r1(sy(s.R))}" r="5"/>` +
          `<circle class="s1 dot" cx="${r1(px)}" cy="${r1(sy(d.r))}" r="6"/>` +
          `<text class="value-label" x="${r1(lx)}" y="${r1(ly)}" text-anchor="${anchor}">${esc(ctx.tr('c1.gapLabel', { d: pct(diff, ctx) }))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([-0.6, 1], [M.left, w - M.right]);
        const R = Math.min(1, Math.max(-0.6, sx.invert(xpx)));
        const r = logReturn(R);
        return { x: sx(R), lines: [`R = ${pct(R, ctx, 1)}`, `ln(1+R) = ${pct(r, ctx, 2)}`, `${ctx.tr('c1.difference')}: ${pct(R - r, ctx, 2)}`] };
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c1.statLoss'), value: pct(s.L, ctx, 0) },
    { label: ctx.tr('c1.statGain'), value: pct(d.gain, ctx, 1) },
    { label: ctx.tr('c1.statLog', { R: pct(s.R, ctx, 0) }), value: pct(d.r, ctx, 2) },
    { label: ctx.tr('c1.difference'), value: pct(s.R - d.r, ctx, 2) },
  ],
  describe: (d, s, ctx) => ctx.tr('c1.describe', {
    L: pct(s.L, ctx, 0), g: pct(d.gain, ctx, 1), R: pct(s.R, ctx, 0), r: pct(d.r, ctx, 2), d: pct(s.R - d.r, ctx, 2),
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c1.tableCaption'),
    head: [ctx.tr('c1.colMove'), ctx.tr('c1.colGain'), ctx.tr('c1.colLog')],
    rows: [-0.9, -0.5, -0.2, -0.1, -0.05, 0, 0.05, 0.1, 0.25, 0.5, 1].map((R) => [
      pct(R, ctx, 0),
      R < 0 ? pct(recoveryGain(-R), ctx, 1) : '—',
      pct(logReturn(R), ctx, 2),
    ]),
  }),
};
