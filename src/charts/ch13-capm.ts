/**
 * Capítulo 13 · Lo que paga el mercado.
 * Izquierda: rentabilidades diarias simuladas de tres activos frente al mercado, con su recta de
 * regresión: la pendiente es la beta y la dispersión alrededor de la recta, el riesgo específico.
 * Derecha: la línea del mercado de valores con diez activos simulados alrededor (alfa al pasar el
 * cursor) y los tres activos del panel izquierdo sobre la recta.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng } from './rng';
import { linear, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S13 extends Record<string, number> {
  b1: number; b2: number; b3: number; e1: number; e2: number; e3: number; rf: number; prem: number; seed: number;
}

export const MKT_VOL = 0.15;
export const DAYS = 250;
const SD = Math.sqrt(252);
export const SML_ASSETS = 10;

export const betaFrom = (rho: number, si: number, sm = MKT_VOL) => (rho * si) / sm;
export const capm = (beta: number, rf: number, prem: number) => rf + beta * prem;
export const totalVol = (beta: number, spec: number, sm = MKT_VOL) => Math.sqrt(beta * beta * sm * sm + spec * spec);

let cache: { seed: number; m: Float64Array; e: Float64Array; betas: number[]; alphas: number[] } | null = null;
function base(seed: number) {
  if (cache && cache.seed === seed) return cache;
  const rng = new Rng(seed);
  const m = new Float64Array(DAYS);
  const e = new Float64Array(3 * DAYS);
  for (let i = 0; i < DAYS; i++) m[i] = rng.normal();
  for (let i = 0; i < 3 * DAYS; i++) e[i] = rng.normal();
  const betas: number[] = [];
  const alphas: number[] = [];
  for (let k = 0; k < SML_ASSETS; k++) { betas.push(0.3 + (1.5 * (k + rng.uniform())) / SML_ASSETS); alphas.push(0.012 * rng.normal()); }
  cache = { seed, m, e, betas, alphas };
  return cache;
}

export interface D13 {
  m: Float64Array;                 // rentabilidades diarias del mercado
  r: Float64Array[];               // de los tres activos
  est: number[];                   // betas estimadas por regresión
  sml: { beta: number; mean: number; alpha: number }[];
}

export function computeCapm(s: S13): D13 {
  const b = base(s.seed);
  const betas = [s.b1, s.b2, s.b3];
  const specs = [s.e1, s.e2, s.e3];
  const m = new Float64Array(DAYS);
  for (let i = 0; i < DAYS; i++) m[i] = (MKT_VOL / SD) * b.m[i];
  const r = [0, 1, 2].map((k) => {
    const x = new Float64Array(DAYS);
    for (let i = 0; i < DAYS; i++) x[i] = betas[k] * m[i] + (specs[k] / SD) * b.e[k * DAYS + i];
    return x;
  });
  let mm = 0;
  for (let i = 0; i < DAYS; i++) mm += m[i];
  mm /= DAYS;
  let vm = 0;
  for (let i = 0; i < DAYS; i++) vm += (m[i] - mm) ** 2;
  const est = r.map((x) => {
    let mx = 0;
    for (let i = 0; i < DAYS; i++) mx += x[i];
    mx /= DAYS;
    let c = 0;
    for (let i = 0; i < DAYS; i++) c += (x[i] - mx) * (m[i] - mm);
    return c / vm;
  });
  const sml = b.betas.map((beta, k) => ({ beta, alpha: b.alphas[k], mean: capm(beta, s.rf, s.prem) + b.alphas[k] }));
  return { m, r, est, sml };
}

const M = { top: 12, right: 16, bottom: 44, left: 52 };
const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const num = (v: number, ctx: ChartCtx, d = 2) => fmtNum(v, d, ctx.fmt);
const CLS = ['s1', 's2', 's3'];
const NAMES = (ctx: ChartCtx) => [ctx.tr('c13.a1'), ctx.tr('c13.a2'), ctx.tr('c13.a3')];

export const chart13: ChartDef<S13, D13> = {
  id: 'capm',
  simulated: true,
  defaults: { b1: 0.6, b2: 1.5, b3: 0.2, e1: 0.12, e2: 0.2, e3: 0.147, rf: 0.025, prem: 0.055, seed: 13 },
  sliders: [
    { key: 'b1', label: 'c13.b1', min: 0, max: 2, step: 0.05, format: (v, c) => num(v, c) },
    { key: 'b2', label: 'c13.b2', min: 0, max: 2, step: 0.05, format: (v, c) => num(v, c) },
    { key: 'b3', label: 'c13.b3', min: 0, max: 2, step: 0.05, format: (v, c) => num(v, c) },
    { key: 'e1', more: true, label: 'c13.e1', min: 0, max: 0.4, step: 0.005, format: (v, c) => pct(v, c, 1) },
    { key: 'e2', more: true, label: 'c13.e2', min: 0, max: 0.4, step: 0.005, format: (v, c) => pct(v, c, 1) },
    { key: 'e3', more: true, label: 'c13.e3', min: 0, max: 0.4, step: 0.005, format: (v, c) => pct(v, c, 1) },
    { key: 'rf', more: true, label: 'c13.rf', min: 0, max: 0.06, step: 0.0025, format: (v, c) => pct(v, c, 2) },
    { key: 'prem', more: true, label: 'c13.prem', min: 0, max: 0.1, step: 0.0025, format: (v, c) => pct(v, c, 2) },
  ],
  compute: computeCapm,
  panels: [
    {
      id: 'regresion',
      title: (c) => c.tr('c13.panelLeft'),
      height: () => 340,
      render(d, s, w, ctx) {
        const names = NAMES(ctx);
        const items = names.map((n, k) => ({ cls: CLS[k], label: `${n} (β ${num(d.est[k], ctx)})` }));
        const h = panelH(w, 340);
        const lh = legendHeight(items, w - M.left - M.right);
        const lim = 0.04;
        const sx = linear([-0.03, 0.03], [M.left, w - M.right]);
        const sy = linear([-lim, lim], [h - M.bottom, M.top + lh + 8]);
        let body = '';
        for (let k = 0; k < 3; k++) {
          let p = '';
          for (let i = 0; i < DAYS; i++) {
            const x = d.m[i];
            const y = d.r[k][i];
            if (Math.abs(x) > 0.03 || Math.abs(y) > lim) continue;
            p += `M${r1(sx(x))},${r1(sy(y))}h0`;
          }
          body += `<path class="dots ${CLS[k]}" d="${p}"/>`;
        }
        for (let k = 0; k < 3; k++) {
          const b = d.est[k];
          const x0 = Math.max(-0.03, -lim / Math.max(Math.abs(b), 1e-9));
          const x1 = -x0;
          body += `<path class="${CLS[k]} line thick" d="M${r1(sx(x0))},${r1(sy(b * x0))}L${r1(sx(x1))},${r1(sy(b * x1))}"/>`;
        }
        return svgOpen(w, h, ctx.tr('c13.panelLeft'), ctx.tr('c13.descLeft', { b: d.est.map((b, k) => `${names[k]} ${num(b, ctx)}`).join(', ') }), 'c13a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('c13.axisMkt') }) +
          `<line class="zero" x1="${r1(sx(0))}" x2="${r1(sx(0))}" y1="${r1(sy(-lim))}" y2="${r1(sy(lim))}"/>` +
          `<line class="zero" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(0))}" y2="${r1(sy(0))}"/>` +
          body + '</svg>';
      },
    },
    {
      id: 'lmv',
      title: (c) => c.tr('c13.panelRight'),
      height: () => 340,
      render(d, s, w, ctx) {
        const names = NAMES(ctx);
        const items = [
          { cls: 'muted', label: ctx.tr('c13.legendSml') },
          { cls: 'hist', label: ctx.tr('c13.legendAssets'), box: true },
        ];
        const h = panelH(w, 340);
        const lh = legendHeight(items, w - M.left - M.right);
        const sx = linear([0, 2], [M.left, w - M.right]);
        const ys = [...d.sml.map((a) => a.mean), s.rf, capm(2, s.rf, s.prem)];
        const sy = linear([Math.min(0, ...ys) - 0.01, Math.max(...ys) + 0.015], [h - M.bottom, M.top + lh + 8]);
        let pts = '';
        for (const a of d.sml) {
          pts += `<line class="guide" x1="${r1(sx(a.beta))}" x2="${r1(sx(a.beta))}" y1="${r1(sy(capm(a.beta, s.rf, s.prem)))}" y2="${r1(sy(a.mean))}"/>` +
            `<circle class="pt-in" cx="${r1(sx(a.beta))}" cy="${r1(sy(a.mean))}" r="4.5" opacity="0.8"/>`;
        }
        const bs = [s.b1, s.b2, s.b3];
        bs.forEach((b, k) => {
          const y = capm(b, s.rf, s.prem);
          pts += `<rect class="mark ${CLS[k]}" x="${r1(sx(b) - 5)}" y="${r1(sy(y) - 5)}" width="10" height="10"/>` +
            `<text class="value-label small" x="${r1(sx(b))}" y="${r1(sy(y) + (k === 1 ? -10 : 20))}" text-anchor="middle">${esc(names[k])}</text>`;
        });
        return svgOpen(w, h, ctx.tr('c13.panelRight'), ctx.tr('c13.descRight', { rf: pct(s.rf, ctx, 2), p: pct(s.prem, ctx, 2) }), 'c13b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, ticks: [0, 0.5, 1, 1.5, 2], format: (v) => num(v, ctx, 1), label: ctx.tr('c13.axisBeta') }) +
          `<path class="muted line thick" d="M${r1(sx(0))},${r1(sy(s.rf))}L${r1(sx(2))},${r1(sy(capm(2, s.rf, s.prem)))}"/>` +
          pts + '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, 2], [M.left, w - M.right]);
        const x = sx.invert(xpx);
        let best = d.sml[0];
        for (const a of d.sml) if (Math.abs(a.beta - x) < Math.abs(best.beta - x)) best = a;
        return { x: sx(best.beta), lines: [`β = ${num(best.beta, ctx)}`, `${ctx.tr('c13.mean')}: ${pct(best.mean, ctx, 2)}`, `${ctx.tr('c13.capmReturn')}: ${pct(capm(best.beta, s.rf, s.prem), ctx, 2)}`, `α = ${pct(best.alpha, ctx, 2)}`] };
      },
    },
  ],
  stats: (d, s, ctx) => {
    const names = NAMES(ctx);
    const bs = [s.b1, s.b2, s.b3];
    const es = [s.e1, s.e2, s.e3];
    return bs.map((b, k) => ({
      label: ctx.tr('c13.statAsset', { a: names[k], b: num(b, ctx), v: pct(totalVol(b, es[k]), ctx) }),
      value: pct(capm(b, s.rf, s.prem), ctx, 2),
      note: ctx.tr('c13.statNote'),
    }));
  },
  describe: (d, s, ctx) => {
    const names = NAMES(ctx);
    const bs = [s.b1, s.b2, s.b3];
    const es = [s.e1, s.e2, s.e3];
    return ctx.tr('c13.describe', {
      rf: pct(s.rf, ctx, 2), p: pct(s.prem, ctx, 2),
      list: bs.map((b, k) => ctx.tr('c13.describeItem', { a: names[k], b: num(b, ctx), v: pct(totalVol(b, es[k]), ctx), r: pct(capm(b, s.rf, s.prem), ctx, 2) })).join('; '),
    });
  },
  table: (d, s, ctx) => ({
    caption: ctx.tr('c13.tableCaption'),
    head: ['β', ctx.tr('c13.mean'), ctx.tr('c13.capmReturn'), 'α'],
    rows: d.sml.map((a) => [num(a.beta, ctx), pct(a.mean, ctx, 2), pct(capm(a.beta, s.rf, s.prem), ctx, 2), pct(a.alpha, ctx, 2)]),
  }),
};
