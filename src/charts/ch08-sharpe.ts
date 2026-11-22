/**
 * Capítulo 8 · La recta más empinada.
 * Plano volatilidad–rentabilidad con tres fondos (arrastrables con el ratón, el dedo o las flechas
 * del teclado, ver client/ext-sharpe.ts), el tipo libre de riesgo y una recta desde r_f hacia cada
 * fondo rotulada con su ratio de Sharpe. Un marcador recorre la recta del fondo seleccionado según
 * la fracción invertida.
 */
import type { ChartDef, ChartCtx } from './types';
import { linear, axisX, axisY, legend, legendHeight, svgOpen, r1, esc } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S8 extends Record<string, number> {
  rf: number; sel: number; w: number;
  muA: number; sA: number; muB: number; sB: number; muC: number; sC: number;
}

export const FUNDS = ['A', 'B', 'C'] as const;
export const sharpe = (mu: number, sigma: number, rf: number) => (mu - rf) / sigma;
/** Combinación de una fracción w en el fondo y 1 − w en el activo sin riesgo. */
export const combo = (mu: number, sigma: number, rf: number, w: number) => ({ mu: rf + w * (mu - rf), sigma: w * sigma });

export const X_MAX = 0.3;
export const Y_MIN = -0.02;
export const Y_MAX = 0.18;
export const MARGIN = { top: 12, right: 24, bottom: 44, left: 56 };

/** Escalas del plano (las usa también la extensión de arrastre). */
export function planeScales(w: number, h: number, lh: number) {
  return {
    sx: linear([0, X_MAX], [MARGIN.left, w - MARGIN.right]),
    sy: linear([Y_MIN, Y_MAX], [h - MARGIN.bottom, MARGIN.top + lh + 8]),
  };
}

export interface Fund { name: string; mu: number; sigma: number; sr: number }
export interface D8 { funds: Fund[]; best: number; pt: { mu: number; sigma: number } }

export function computeSharpe(s: S8): D8 {
  const funds = FUNDS.map((n) => {
    const mu = s[`mu${n}`];
    const sigma = Math.max(0.005, s[`s${n}`]);
    return { name: n, mu, sigma, sr: sharpe(mu, sigma, s.rf) };
  });
  let best = 0;
  funds.forEach((f, i) => { if (f.sr > funds[best].sr) best = i; });
  const f = funds[Math.round(s.sel)] ?? funds[0];
  return { funds, best, pt: combo(f.mu, f.sigma, s.rf, s.w) };
}

export function legendItems(ctx: ChartCtx) {
  return [
    { cls: 's1', label: ctx.tr('c8.legendBest') },
    { cls: 'muted', label: ctx.tr('c8.legendOther') },
    { cls: 's2', label: ctx.tr('c8.legendCombo') },
  ];
}

const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const num = (v: number, ctx: ChartCtx, d = 2) => fmtNum(v, d, ctx.fmt);
export const H = 400;

export const chart08: ChartDef<S8, D8> = {
  id: 'sharpe',
  simulated: false,
  defaults: { rf: 0.02, sel: 1, w: 3, muA: 0.07, sA: 0.12, muB: 0.045, sB: 0.04, muC: 0.1, sC: 0.22 },
  sliders: [
    { key: 'rf', label: 'c8.rf', min: 0, max: 0.06, step: 0.0025, format: (v, c) => pct(v, c, 2) },
    { key: 'sel', label: 'c8.sel', min: 0, max: 2, step: 1, format: (v, c) => c.tr('c8.fund', { f: FUNDS[Math.round(v)] }) },
    { key: 'w', label: 'c8.w', min: 0, max: 3, step: 0.05, format: (v, c) => pct(v, c, 0) },
  ],
  extraKeys: ['muA', 'sA', 'muB', 'sB', 'muC', 'sC'],
  compute: computeSharpe,
  panels: [
    {
      id: 'plano',
      wide: true,
      title: (c) => c.tr('c8.panel'),
      height: () => H,
      render(d, s, w, ctx) {
        const items = legendItems(ctx);
        const lh = legendHeight(items, w - MARGIN.left - MARGIN.right);
        const { sx, sy } = planeScales(w, H, lh);
        const sel = Math.round(s.sel);
        let lines = '';
        let pts = '';
        // Rectas desde r_f hasta el borde del gráfico.
        d.funds.forEach((f, i) => {
          const slope = f.sr;
          let xe = X_MAX;
          let ye = s.rf + slope * xe;
          if (ye > Y_MAX) { ye = Y_MAX; xe = (Y_MAX - s.rf) / slope; }
          if (ye < Y_MIN) { ye = Y_MIN; xe = (Y_MIN - s.rf) / slope; }
          const cls = i === d.best ? 's1 line thick' : 'muted line';
          lines += `<path class="${cls}${i === sel ? '' : ' dash'}" d="M${r1(sx(0))},${r1(sy(s.rf))}L${r1(sx(xe))},${r1(sy(ye))}"/>`;
          // rótulo con el ratio, cerca del extremo de la recta
          const lx = sx(xe) - 6;
          const ly = sy(ye) + (slope >= 0 ? -6 : 14);
          lines += `<text class="value-label small" x="${r1(lx)}" y="${r1(ly)}" text-anchor="end">${esc(`${f.name} · SR ${num(f.sr, ctx)}`)}</text>`;
          pts += `<g class="fund" data-fund="${f.name}">` +
            `<circle class="${i === d.best ? 's1' : 'muted'} dot handle" cx="${r1(sx(f.sigma))}" cy="${r1(sy(f.mu))}" r="9"/>` +
            `<text class="value-label" x="${r1(sx(f.sigma) + 13)}" y="${r1(sy(f.mu) + 5)}">${f.name}</text></g>`;
        });
        const p = d.pt;
        const px = sx(Math.min(X_MAX, p.sigma));
        const py = sy(Math.max(Y_MIN, Math.min(Y_MAX, p.mu)));
        const inside = p.sigma <= X_MAX && p.mu <= Y_MAX && p.mu >= Y_MIN;
        const lab = ctx.tr('c8.comboLabel', { w: pct(s.w, ctx, 0), mu: pct(p.mu, ctx), s: pct(p.sigma, ctx) });
        return svgOpen(w, H, ctx.tr('c8.panel'), ctx.tr('c8.desc', { b: d.funds[d.best].name, sr: num(d.funds[d.best].sr, ctx), rf: pct(s.rf, ctx, 2) }), 'c8a') +
          legend(items, MARGIN.left, MARGIN.top + 10, w - MARGIN.left - MARGIN.right) +
          axisY(sy, MARGIN.left, w - MARGIN.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, H - MARGIN.bottom, MARGIN.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('c8.axisSigma') }) +
          `<line class="zero" x1="${MARGIN.left}" x2="${w - MARGIN.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
          lines +
          `<circle class="muted dot" cx="${r1(sx(0))}" cy="${r1(sy(s.rf))}" r="6"/>` +
          `<text class="value-label small" x="${r1(sx(0) + 10)}" y="${r1(sy(s.rf) + 18)}">${esc(`rf ${pct(s.rf, ctx, 2)}`)}</text>` +
          pts +
          (inside ? `<rect class="combo" x="${r1(px - 6)}" y="${r1(py - 6)}" width="12" height="12" transform="rotate(45 ${r1(px)} ${r1(py)})"/>` +
            `<text class="value-label" x="${r1(px + (px > w * 0.6 ? -12 : 12))}" y="${r1(py + 22)}" text-anchor="${px > w * 0.6 ? 'end' : 'start'}">${esc(lab)}</text>` : '') +
          '</svg>';
      },
    },
  ],
  stats: (d, s, ctx) => {
    const f = d.funds[Math.round(s.sel)];
    return [
      ...d.funds.map((x) => ({ label: ctx.tr('c8.statFund', { f: x.name, mu: pct(x.mu, ctx), s: pct(x.sigma, ctx) }), value: `SR ${num(x.sr, ctx)}` })),
      { label: ctx.tr('c8.statCombo', { w: pct(s.w, ctx, 0), f: f.name }), value: `${pct(d.pt.mu, ctx)} · ${pct(d.pt.sigma, ctx)}`, note: ctx.tr('c8.comboNote', { sr: num(f.sr, ctx) }) },
    ];
  },
  describe: (d, s, ctx) => {
    const f = d.funds[Math.round(s.sel)];
    return ctx.tr('c8.describe', {
      list: d.funds.map((x) => `${x.name} ${num(x.sr, ctx)}`).join(', '), rf: pct(s.rf, ctx, 2), b: d.funds[d.best].name,
      w: pct(s.w, ctx, 0), f: f.name, mu: pct(d.pt.mu, ctx), s: pct(d.pt.sigma, ctx), sr: num(f.sr, ctx),
    });
  },
  table: (d, s, ctx) => ({
    caption: ctx.tr('c8.tableCaption', { rf: pct(s.rf, ctx, 2) }),
    head: [ctx.tr('c8.colFund'), ctx.tr('c8.axisMu'), ctx.tr('c8.axisSigma'), ctx.tr('c8.colSr')],
    rows: d.funds.map((f) => [f.name, pct(f.mu, ctx), pct(f.sigma, ctx), num(f.sr, ctx)]),
  }),
};
