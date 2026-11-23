/**
 * Tema B · Costes de transacción, liquidez e impacto de mercado (RF-TEM-02).
 * Izquierda: ratio de Sharpe antes y después de costes según la rotación anual
 * (coste anual ≈ rotación × coste por operación).
 * Derecha: ley de la raíz cuadrada del impacto, impacto ≈ Y·σ_día·√(Q/V), con Y = 1.
 */
import type { ChartDef, ChartCtx } from './types';
import { linear, pathFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtNum, fmtPct } from '../lib/format';

export interface SB extends Record<string, number> { mu: number; vol: number; cost: number; turn: number; sday: number; q: number }
export const MAX_TURN = 50;

export const sharpeAfterCosts = (mu: number, vol: number, cost: number, turn: number) => (mu - cost * turn) / vol;
export const breakevenTurnover = (mu: number, cost: number) => (cost > 0 ? mu / cost : Infinity);
/** Ley de la raíz cuadrada (Y = 1): impacto relativo de una orden de tamaño Q con volumen diario V. */
export const sqrtImpact = (sday: number, qOverV: number, Y = 1) => Y * sday * Math.sqrt(qOverV);

export interface DB { turns: number[]; net: number[]; gross: number; srNet: number; annualCost: number; be: number; qs: number[]; imp: number[]; impact: number }

function compute(s: SB): DB {
  const turns: number[] = [], net: number[] = [];
  for (let k = 0; k <= 200; k++) { const t = (MAX_TURN * k) / 200; turns.push(t); net.push(sharpeAfterCosts(s.mu, s.vol, s.cost, t)); }
  const qs: number[] = [], imp: number[] = [];
  for (let k = 0; k <= 200; k++) { const q = (0.2 * k) / 200; qs.push(q); imp.push(sqrtImpact(s.sday, q)); }
  return {
    turns, net, gross: s.mu / s.vol, srNet: sharpeAfterCosts(s.mu, s.vol, s.cost, s.turn), annualCost: s.cost * s.turn,
    be: breakevenTurnover(s.mu, s.cost), qs, imp, impact: sqrtImpact(s.sday, s.q),
  };
}

const M = { top: 12, right: 16, bottom: 44, left: 52 };
const num = (v: number, c: ChartCtx, d = 2) => fmtNum(v, d, c.fmt);
const pct = (v: number, c: ChartCtx, d = 1) => fmtPct(v, d, c.fmt);

export const chartB: ChartDef<SB, DB> = {
  id: 'costes',
  simulated: false,
  defaults: { mu: 0.05, vol: 0.1, cost: 0.002, turn: 10, sday: 0.02, q: 0.01 },
  sliders: [
    { key: 'turn', label: 'tB.turnover', min: 0, max: MAX_TURN, step: 1, format: (v, c) => c.tr('tB.times', { n: v }) },
    { key: 'cost', label: 'tB.cost', min: 0, max: 0.01, step: 0.0005, format: (v, c) => pct(v, c, 2) },
    { key: 'mu', label: 'tB.mu', min: 0, max: 0.15, step: 0.005, format: (v, c) => pct(v, c) },
    { key: 'q', label: 'tB.order', min: 0.001, max: 0.2, step: 0.001, format: (v, c) => pct(v, c) },
    { key: 'vol', label: 'tB.vol', min: 0.05, max: 0.3, step: 0.01, format: (v, c) => pct(v, c, 0), more: true },
    { key: 'sday', label: 'tB.sday', min: 0.005, max: 0.05, step: 0.001, format: (v, c) => pct(v, c), more: true },
  ],
  compute,
  panels: [
    {
      id: 'sharpe',
      title: (c) => c.tr('tB.panelLeft'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [{ cls: 's1', label: ctx.tr('tB.legendNet') }, { cls: 'muted', label: ctx.tr('tB.legendGross'), dash: true }];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const lo = Math.min(-0.2, ...d.net), hi = Math.max(0.2, d.gross) * 1.1;
        const sx = linear([0, MAX_TURN], [M.left, w - M.right]);
        const sy = linear([lo, hi], [h - M.bottom, M.top + lh + 8]);
        const px = sx(s.turn);
        const neg = sy(0) < h - M.bottom ? `<rect class="neg-zone" x="${M.left}" y="${r1(sy(0))}" width="${r1(w - M.right - M.left)}" height="${r1(h - M.bottom - sy(0))}"/>` : '';
        return svgOpen(w, h, ctx.tr('tB.panelLeft'), ctx.tr('tB.descLeft', { t: s.turn, g: num(d.gross, ctx), n: num(d.srNet, ctx) }), 'tBa') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) + neg +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('tB.axisTurn') }) +
          `<line class="zero" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
          `<line class="muted line dash" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(d.gross))}" y2="${r1(sy(d.gross))}"/>` +
          `<path class="s1 line thick" d="${pathFrom(d.turns, d.net, sx, sy)}"/>` +
          `<circle class="s1 dot" cx="${r1(px)}" cy="${r1(sy(d.srNet))}" r="5"/>` +
          `<text class="value-label" x="${r1(px + (px > w * 0.7 ? -8 : 8))}" y="${r1(sy(d.srNet) - 10)}" text-anchor="${px > w * 0.7 ? 'end' : 'start'}">${esc(num(d.srNet, ctx))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, MAX_TURN], [M.left, w - M.right]);
        const t = Math.round(Math.min(MAX_TURN, Math.max(0, sx.invert(xpx))));
        return { x: sx(t), lines: [ctx.tr('tB.times', { n: t }), `${ctx.tr('tB.statCost')}: ${pct(s.cost * t, ctx)}`, `${ctx.tr('tB.legendNet')}: ${num(sharpeAfterCosts(s.mu, s.vol, s.cost, t), ctx)}`] };
      },
    },
    {
      id: 'impacto',
      title: (c) => c.tr('tB.panelRight'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [{ cls: 's1', label: ctx.tr('tB.legendImpact') }, { cls: 'muted', label: ctx.tr('tB.legendLinear'), dash: true }];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const sx = linear([0, 0.2], [M.left, w - M.right]);
        const top = Math.max(...d.imp) * 1.1;
        const sy = linear([0, top], [h - M.bottom, M.top + lh + 8]);
        // Recta que coincide con la raíz en Q/V = 1 %: lo que se predeciría si el impacto fuera proporcional.
        const k = sqrtImpact(s.sday, 0.01) / 0.01;
        const lin = d.qs.map((q) => (k * q <= top ? k * q : NaN));
        const px = sx(s.q);
        return svgOpen(w, h, ctx.tr('tB.panelRight'), ctx.tr('tB.descRight', { q: pct(s.q, ctx), s: pct(s.sday, ctx), i: pct(d.impact, ctx, 2) }), 'tBb') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('tB.axisQ') }) +
          `<path class="muted line dash" d="${pathFrom(d.qs, lin, sx, sy)}"/>` +
          `<path class="s1 line thick" d="${pathFrom(d.qs, d.imp, sx, sy)}"/>` +
          `<circle class="s1 dot" cx="${r1(px)}" cy="${r1(sy(d.impact))}" r="5"/>` +
          `<text class="value-label" x="${r1(px + (px > w * 0.7 ? -8 : 8))}" y="${r1(sy(d.impact) + (px > w * 0.7 ? -10 : 16))}" text-anchor="${px > w * 0.7 ? 'end' : 'start'}">${esc(pct(d.impact, ctx, 2))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, 0.2], [M.left, w - M.right]);
        const q = Math.round(Math.min(0.2, Math.max(0.001, sx.invert(xpx))) * 1000) / 1000;
        return { x: sx(q), lines: [`${ctx.tr('tB.axisQ')}: ${pct(q, ctx)}`, `${ctx.tr('tB.legendImpact')}: ${pct(sqrtImpact(s.sday, q), ctx, 2)}`] };
      },
    },
  ],
  stats(d, s, ctx) {
    return [
      { label: ctx.tr('tB.statCost'), value: pct(d.annualCost, ctx), panels: ['sharpe'] },
      { label: ctx.tr('tB.statNet'), value: num(d.srNet, ctx), note: ctx.tr('tB.statGross', { g: num(d.gross, ctx) }), panels: ['sharpe'] },
      { label: ctx.tr('tB.statBe'), value: Number.isFinite(d.be) ? ctx.tr('tB.times', { n: fmtNum(d.be, 0, ctx.fmt) }) : '∞', panels: ['sharpe'] },
      { label: ctx.tr('tB.statImpact', { q: pct(s.q, ctx) }), value: pct(d.impact, ctx, 2), panels: ['impacto'] },
    ];
  },
  describe: (d, s, ctx) => ctx.tr('tB.describe', {
    t: s.turn, c: pct(s.cost, ctx, 2), a: pct(d.annualCost, ctx), g: num(d.gross, ctx), n: num(d.srNet, ctx),
    q: pct(s.q, ctx), s: pct(s.sday, ctx), i: pct(d.impact, ctx, 2),
  }),
  table(d, s, ctx) {
    const ts = [...new Set([0, 1, 2, 5, 10, 20, 30, 50].concat(s.turn))].sort((a, b) => a - b);
    return {
      caption: ctx.tr('tB.tableCaption', { c: pct(s.cost, ctx, 2) }),
      head: [ctx.tr('tB.axisTurn'), ctx.tr('tB.statCost'), ctx.tr('tB.legendNet')],
      rows: ts.map((t) => [String(t), pct(s.cost * t, ctx), num(sharpeAfterCosts(s.mu, s.vol, s.cost, t), ctx)]),
    };
  },
};
