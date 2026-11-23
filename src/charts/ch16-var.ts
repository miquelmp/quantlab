/**
 * Capítulo 16 · El umbral y lo que hay detrás.
 * Arriba: distribución de pérdidas y ganancias diarias de una cartera de 250.000 € (volatilidad
 * 1,2 %), normal o t de Student, con el VaR, la cola sombreada y el déficit esperado (ES).
 * Abajo: diez años de resultados diarios simulados con colas gruesas (t), la línea del VaR normal,
 * las excepciones en rojo y el contraste de Kupiec.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng, normCdf, normInv } from './rng';
import { linear, pathFrom, areaFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtPct, fmtNum, fmtEur } from '../lib/format';
import { tTail } from './ch15-colas';

export interface S16 extends Record<string, number> { conf: number; model: number; nu: number; seed: number }

export const VALUE = 250000;
export const VOL = 0.012;
export const DAYS = 2520;
const MAX_NU = 30;

const phi = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

/** VaR y ES (en múltiplos de la desviación típica) con la normal. */
export const normalVaR = (c: number) => normInv(c);
export const normalES = (c: number) => phi(normInv(c)) / (1 - c);

function lnGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const t = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let s = 1.000000000190015;
  for (const k of c) s += k / ++y;
  return -t + Math.log((2.5066282746310005 * s) / x);
}
export const tPdf = (t: number, nu: number) => Math.exp(lnGamma((nu + 1) / 2) - lnGamma(nu / 2) - 0.5 * Math.log(nu * Math.PI) - ((nu + 1) / 2) * Math.log(1 + (t * t) / nu));
/** Cuantil de la t de Student (bisección sobre la cola). */
export function tInv(c: number, nu: number): number {
  let lo = 0;
  let hi = 1000;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (tTail(m, nu) > 1 - c) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
const tStd = (nu: number) => Math.sqrt((nu - 2) / nu);   // pasa la t a desviación típica 1
/** VaR y ES de la t reescalada a desviación típica 1. */
export const tVaR = (c: number, nu: number) => tInv(c, nu) * tStd(nu);
export const tES = (c: number, nu: number) => { const q = tInv(c, nu); return ((tPdf(q, nu) / (1 - c)) * ((nu + q * q) / (nu - 1))) * tStd(nu); };

/** Contraste de Kupiec: estadístico LR y su p-valor (χ² con 1 grado de libertad). */
export function kupiec(x: number, n: number, p: number): { lr: number; pValue: number } {
  const ll = (q: number) => (x === 0 ? n * Math.log(1 - q) : x === n ? n * Math.log(q) : (n - x) * Math.log(1 - q) + x * Math.log(q));
  const lr = Math.max(0, -2 * (ll(p) - ll(x / n)));
  return { lr, pValue: 2 * (1 - normCdf(Math.sqrt(lr))) };
}
/** P(X ≥ k) para X ~ Bin(n, p). */
export function binomTail(k: number, n: number, p: number): number {
  let lc = 0;
  let s = 0;
  for (let j = 0; j <= n; j++) {
    if (j > 0) lc += Math.log(n - j + 1) - Math.log(j);
    if (j >= k) s += Math.exp(lc + j * Math.log(p) + (n - j) * Math.log(1 - p));
  }
  return s;
}

let cache: { seed: number; z: Float64Array } | null = null;
function normals(seed: number): Float64Array {
  if (cache && cache.seed === seed) return cache.z;
  const rng = new Rng(seed);
  const z = new Float64Array(DAYS * (MAX_NU + 1));
  for (let i = 0; i < z.length; i++) z[i] = rng.normal();
  cache = { seed, z };
  return z;
}

export interface D16 {
  var: number; es: number;            // en euros, del modelo elegido
  varN: number; esN: number;          // en euros, normal
  pnl: Float64Array;                  // 10 años de resultados diarios (€), con colas gruesas
  exc: number; expected: number; kup: { lr: number; pValue: number };
}

export function computeVar(s: S16): D16 {
  const nu = Math.round(s.nu);
  const sd = VOL * VALUE;
  const isT = Math.round(s.model) === 1;
  const varN = normalVaR(s.conf) * sd;
  const esN = normalES(s.conf) * sd;
  const v = isT ? tVaR(s.conf, nu) * sd : varN;
  const e = isT ? tES(s.conf, nu) * sd : esN;
  const z = normals(s.seed);
  const pnl = new Float64Array(DAYS);
  let exc = 0;
  for (let i = 0; i < DAYS; i++) {
    const o = i * (MAX_NU + 1);
    let chi = 0;
    for (let k = 1; k <= nu; k++) chi += z[o + k] * z[o + k];
    pnl[i] = sd * tStd(nu) * (z[o] / Math.sqrt(chi / nu));
    if (-pnl[i] > varN) exc++;
  }
  return { var: v, es: e, varN, esN, pnl, exc, expected: DAYS * (1 - s.conf), kup: kupiec(exc, DAYS, 1 - s.conf) };
}

const M = { top: 12, right: 16, bottom: 44, left: 60 };
const eur = (v: number, ctx: ChartCtx) => fmtEur(v, 0, ctx.fmt);
const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const modelName = (s: S16, ctx: ChartCtx) => (Math.round(s.model) === 1 ? ctx.tr('c16.modelT', { nu: Math.round(s.nu) }) : ctx.tr('c16.modelN'));

export const chart16: ChartDef<S16, D16> = {
  id: 'var',
  simulated: true,
  defaults: { conf: 0.99, model: 0, nu: 4, seed: 16 },
  sliders: [
    { key: 'conf', label: 'c16.conf', min: 0.9, max: 0.999, step: 0.001, format: (v, c) => pct(v, c, 1) },
    { key: 'model', label: 'c16.model', min: 0, max: 1, step: 1, format: (v, c) => c.tr(Math.round(v) === 1 ? 'c16.modelTshort' : 'c16.modelN') },
    { key: 'nu', label: 'c16.nu', min: 3, max: MAX_NU, step: 1, format: (v, c) => fmtNum(v, 0, c.fmt) },
  ],
  compute: computeVar,
  panels: [
    {
      id: 'distribucion',
      wide: true,
      title: (c) => c.tr('c16.panelTop'),
      height: () => 320,
      render(d, s, w, ctx) {
        const h = panelH(w, 320);
        const nu = Math.round(s.nu);
        const isT = Math.round(s.model) === 1;
        const items = [
          { cls: 's1', label: modelName(s, ctx) },
          ...(isT ? [{ cls: 'muted', label: ctx.tr('c16.modelN'), dash: true }] : []),
          { cls: 'neg', label: ctx.tr('c16.legendTail'), box: true },
        ];
        const lh = legendHeight(items, w - M.left - M.right);
        const sd = VOL * VALUE;
        const lim = Math.max(5.5 * sd, d.es * 1.3);   // que el VaR y el ES siempre quepan
        const xs: number[] = [];
        for (let i = 0; i <= 300; i++) xs.push(-lim + (2 * lim * i) / 300);
        const dens = (x: number) => (isT ? tPdf(x / (sd * tStd(nu)), nu) / (sd * tStd(nu)) : phi(x / sd) / sd);
        const ys = xs.map(dens);
        const yn = xs.map((x) => phi(x / sd) / sd);
        const ymax = Math.max(...ys, ...yn) * 1.1;
        const sx = linear([-lim, lim], [M.left, w - M.right]);
        const sy = linear([0, ymax], [h - M.bottom, M.top + lh + 8]);
        const tailX = xs.filter((x) => x <= -d.var);
        const tailY = tailX.map(dens);
        const vx = sx(-d.var);
        const ex = sx(-d.es);
        const ay = sy(ymax * 0.35);
        return svgOpen(w, h, ctx.tr('c16.panelTop'), ctx.tr('c16.descTop', { m: modelName(s, ctx), c: pct(s.conf, ctx), v: eur(d.var, ctx), e: eur(d.es, ctx) }), 'c16a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, grid: true, format: () => '' }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => eur(v, ctx), label: ctx.tr('c16.axisPnl') }) +
          (tailX.length > 1 ? `<path class="neg-zone" d="${areaFrom(tailX, tailX.map(() => 0), tailY, sx, sy)}"/>` : '') +
          (isT ? `<path class="muted line dash" d="${pathFrom(xs, yn, sx, sy)}"/>` : '') +
          `<path class="s1 line thick" d="${pathFrom(xs, ys, sx, sy)}"/>` +
          `<line class="neg" x1="${r1(vx)}" x2="${r1(vx)}" y1="${r1(sy(0))}" y2="${r1(sy(ymax * 0.8))}"/>` +
          `<text class="value-label" x="${r1(vx + 6)}" y="${r1(sy(ymax * 0.8) + 4)}">${esc(`VaR ${eur(d.var, ctx)}`)}</text>` +
          `<line class="neg" x1="${r1(ex)}" x2="${r1(ex)}" y1="${r1(sy(0))}" y2="${r1(ay)}"/>` +
          `<path class="neg line" d="M${r1(ex - 5)},${r1(ay + 8)}L${r1(ex)},${r1(ay)}L${r1(ex + 5)},${r1(ay + 8)}"/>` +
          `<text class="value-label" x="${r1(ex - M.left < 90 ? ex + 6 : ex - 6)}" y="${r1(ay - 6)}" text-anchor="${ex - M.left < 90 ? 'start' : 'end'}">${esc(`ES ${eur(d.es, ctx)}`)}</text>` +
          '</svg>';
      },
    },
    {
      id: 'excepciones',
      wide: true,
      title: (c) => c.tr('c16.panelBottom'),
      height: () => 300,
      render(d, s, w, ctx) {
        const h = panelH(w, 300);
        const items = [
          { cls: 'path', label: ctx.tr('c16.legendPnl', { nu: Math.round(s.nu) }) },
          { cls: 's1', label: ctx.tr('c16.legendVarN', { c: pct(s.conf, ctx) }), dash: true },
          { cls: 'neg', label: ctx.tr('c16.legendExc'), box: true },
        ];
        const lh = legendHeight(items, w - M.left - M.right);
        const sd = VOL * VALUE;
        const lim = 8 * sd;
        const sx = linear([0, DAYS], [M.left, w - M.right]);
        const sy = linear([-lim, lim], [h - M.bottom, M.top + lh + 8]);
        const cl = (v: number) => Math.max(-lim, Math.min(lim, v));
        let bars = '';
        let exc = '';
        const per = Math.max(1, Math.ceil(DAYS / Math.max(200, w - M.left - M.right)));
        for (let b = 0; b * per < DAYS; b++) {
          let lo = Infinity; let hi = -Infinity;
          for (let i = b * per; i < Math.min(DAYS, (b + 1) * per); i++) { lo = Math.min(lo, d.pnl[i]); hi = Math.max(hi, d.pnl[i]); }
          bars += `M${r1(sx(b * per))},${r1(sy(cl(hi)))}V${r1(sy(cl(lo)))}`;
        }
        for (let i = 0; i < DAYS; i++) if (-d.pnl[i] > d.varN) exc += `<circle class="exc" cx="${r1(sx(i))}" cy="${r1(sy(cl(d.pnl[i])))}" r="3"/>`;
        return svgOpen(w, h, ctx.tr('c16.panelBottom'), ctx.tr('c16.descBottom', { x: d.exc, e: fmtNum(d.expected, 1, ctx.fmt) }), 'c16b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => eur(v, ctx) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, ticks: [0, 2, 4, 6, 8, 10].map((y) => y * 252), format: (v) => fmtNum(v / 252, 0, ctx.fmt), label: ctx.tr('c16.axisYears') }) +
          `<path class="path spike" d="${bars}"/>` +
          `<line class="s1 dash" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(-d.varN))}" y2="${r1(sy(-d.varN))}"/>` +
          exc +
          `<text class="value-label" x="${M.left + 8}" y="${r1(M.top + lh + 26)}">${esc(ctx.tr('c16.excLabel', { x: d.exc, e: fmtNum(d.expected, 1, ctx.fmt) }))}</text>` +
          '</svg>';
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c16.statVar', { c: pct(s.conf, ctx) }), value: eur(d.var, ctx), note: Math.round(s.model) === 1 ? ctx.tr('c16.normalNote', { v: eur(d.varN, ctx) }) : undefined },
    { label: ctx.tr('c16.statEs', { c: pct(s.conf, ctx) }), value: eur(d.es, ctx), note: Math.round(s.model) === 1 ? ctx.tr('c16.normalNote', { v: eur(d.esN, ctx) }) : undefined },
    { label: ctx.tr('c16.statExc'), value: `${d.exc}`, note: ctx.tr('c16.expectedNote', { e: fmtNum(d.expected, 1, ctx.fmt) }) },
    { label: ctx.tr('c16.statKupiec'), value: fmtNum(d.kup.pValue, 3, ctx.fmt), note: ctx.tr(d.kup.pValue < 0.05 ? 'c16.reject' : 'c16.accept') },
  ],
  describe: (d, s, ctx) => ctx.tr('c16.describe', {
    m: modelName(s, ctx), c: pct(s.conf, ctx), v: eur(d.var, ctx), e: eur(d.es, ctx), x: d.exc, ex: fmtNum(d.expected, 1, ctx.fmt),
    p: fmtNum(d.kup.pValue, 3, ctx.fmt), nu: Math.round(s.nu), r: ctx.tr(d.kup.pValue < 0.05 ? 'c16.reject' : 'c16.accept').trim(),
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c16.tableCaption', { nu: Math.round(s.nu) }),
    head: [ctx.tr('c16.conf'), ctx.tr('c16.colVarN'), ctx.tr('c16.colEsN'), ctx.tr('c16.colVarT'), ctx.tr('c16.colEsT')],
    rows: [0.9, 0.95, 0.975, 0.99, 0.995, 0.999].map((c) => {
      const sd = VOL * VALUE;
      const nu = Math.round(s.nu);
      return [pct(c, ctx), eur(normalVaR(c) * sd, ctx), eur(normalES(c) * sd, ctx), eur(tVaR(c, nu) * sd, ctx), eur(tES(c, nu) * sd, ctx)];
    }),
  }),
};
