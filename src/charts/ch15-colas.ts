/**
 * Capítulo 15 · Lo que la campana no ve.
 * Arriba: 50 años de rentabilidades diarias simuladas con una normal y con una t de Student
 * reescalada a la misma volatilidad (1 %), con los umbrales ±4 % y el recuento de días que los
 * superan. Abajo: probabilidad de superar cada umbral (escala logarítmica) para los dos modelos,
 * con las frecuencias observadas en la simulación.
 *
 * Truco de rendimiento: por cada día se guardan 31 normales fijas (según la semilla). La t con ν
 * grados de libertad usa la primera como numerador y las ν siguientes para el denominador.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng, normCdf } from './rng';
import { linear, pathFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S15 extends Record<string, number> { nu: number; seed: number }

export const DAYS = 252 * 50;
export const VOL = 0.01;
export const THRESH = 0.04;
const MAX_NU = 30;

/* ---------- t de Student: función de distribución (beta incompleta regularizada) ---------- */
function lnGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const t = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let s = 1.000000000190015;
  for (const k of c) s += k / ++y;
  return -t + Math.log((2.5066282746310005 * s) / x);
}
function betacf(a: number, b: number, x: number): number {
  const EPS = 1e-14;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < 1e-300) d = 1e-300;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
function betaInc(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
/** P(T > t) para una t de Student con ν grados de libertad (t ≥ 0). */
export function tTail(t: number, nu: number): number {
  return 0.5 * betaInc(nu / 2, 0.5, nu / (nu + t * t));
}
/** Escala que da a la t de ν grados de libertad una desviación típica `vol`. */
export const tScale = (nu: number, vol = VOL) => vol / Math.sqrt(nu / (nu - 2));
/** Probabilidad de que la rentabilidad supere ±k (dos colas). */
export const tailNormal = (k: number, vol = VOL) => 2 * normCdf(-k / vol);
export const tailT = (k: number, nu: number, vol = VOL) => 2 * tTail(k / tScale(nu, vol), nu);

export function kurtosis(x: ArrayLike<number>): number {
  const n = x.length;
  let m = 0;
  for (let i = 0; i < n; i++) m += x[i];
  m /= n;
  let m2 = 0; let m4 = 0;
  for (let i = 0; i < n; i++) { const d = (x[i] - m) ** 2; m2 += d; m4 += d * d; }
  m2 /= n; m4 /= n;
  return m4 / (m2 * m2);
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

export interface D15 {
  normal: Float64Array; student: Float64Array;
  countN: number; countT: number;
  kurtN: number; kurtT: number;
}

export function computeTails(s: S15): D15 {
  const nu = Math.round(s.nu);
  const z = normals(s.seed);
  const sc = tScale(nu);
  const normal = new Float64Array(DAYS);
  const student = new Float64Array(DAYS);
  let countN = 0;
  let countT = 0;
  for (let i = 0; i < DAYS; i++) {
    const o = i * (MAX_NU + 1);
    normal[i] = VOL * z[o];
    let chi = 0;
    for (let k = 1; k <= nu; k++) chi += z[o + k] * z[o + k];
    student[i] = sc * (z[o] / Math.sqrt(chi / nu));
    if (Math.abs(normal[i]) > THRESH) countN++;
    if (Math.abs(student[i]) > THRESH) countT++;
  }
  return { normal, student, countN, countT, kurtN: kurtosis(normal), kurtT: kurtosis(student) };
}

const M = { top: 12, right: 16, bottom: 40, left: 52 };
const pct = (v: number, ctx: ChartCtx, d = 0) => fmtPct(v, d, ctx.fmt);
const num = (v: number, ctx: ChartCtx, d = 1) => fmtNum(v, d, ctx.fmt);
const sci = (p: number, ctx: ChartCtx) => {
  if (p >= 0.001) return fmtPct(p, p >= 0.01 ? 1 : 2, ctx.fmt);
  const e = Math.floor(Math.log10(p));
  return `${fmtNum(p / 10 ** e, 1, ctx.fmt)}·10${String(e).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d])}`;
};

/** Mínimo y máximo por grupos de días: conserva los extremos con pocos trazos. */
function spikes(x: Float64Array, sx: (i: number) => number, sy: (v: number) => number, buckets: number): string {
  const per = Math.ceil(x.length / buckets);
  let d = '';
  for (let b = 0; b * per < x.length; b++) {
    let lo = Infinity; let hi = -Infinity;
    for (let i = b * per; i < Math.min(x.length, (b + 1) * per); i++) { if (x[i] < lo) lo = x[i]; if (x[i] > hi) hi = x[i]; }
    d += `M${r1(sx(b * per))},${r1(sy(hi))}V${r1(sy(lo))}`;
  }
  return d;
}

export const chart15: ChartDef<S15, D15> = {
  id: 'colas',
  simulated: true,
  defaults: { nu: 4, seed: 15 },
  sliders: [
    { key: 'nu', label: 'c15.nu', min: 3, max: MAX_NU, step: 1, format: (v, c) => fmtNum(v, 0, c.fmt) },
  ],
  compute: computeTails,
  panels: [
    {
      id: 'serie',
      wide: true,
      title: (c) => c.tr('c15.panelTop'),
      height: () => 360,
      render(d, s, w, ctx) {
        const h = panelH(w, 360);
        const items = [
          { cls: 's1', label: ctx.tr('c15.legendNormal') },
          { cls: 's2', label: ctx.tr('c15.legendT', { nu: Math.round(s.nu) }) },
          { cls: 'neg', label: ctx.tr('c15.legendThresh'), dash: true },
        ];
        const lh = legendHeight(items, w - M.left - M.right);
        const top = M.top + lh + 8;
        const stripH = (h - M.bottom - top - 16) / 2;
        const lim = 0.1;
        const sx = linear([0, DAYS], [M.left, w - M.right]);
        const syA = linear([-lim, lim], [top + stripH, top]);
        const syB = linear([-lim, lim], [top + 2 * stripH + 16, top + stripH + 16]);
        const clampA = (v: number) => syA(Math.max(-lim, Math.min(lim, v)));
        const clampB = (v: number) => syB(Math.max(-lim, Math.min(lim, v)));
        const buckets = Math.min(1600, Math.floor(w - M.left - M.right));
        const th = (sy: (v: number) => number) => [THRESH, -THRESH].map((v) => `<line class="neg dash" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(v))}" y2="${r1(sy(v))}"/>`).join('');
        const yt = [-0.08, -0.04, 0, 0.04, 0.08];
        return svgOpen(w, h, ctx.tr('c15.panelTop'), ctx.tr('c15.descTop', { n: d.countN, t: d.countT, nu: Math.round(s.nu) }), 'c15a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(syA, M.left, w - M.right, { fmt: ctx.fmt, ticks: yt, format: (v) => pct(v, ctx) }) +
          axisY(syB, M.left, w - M.right, { fmt: ctx.fmt, ticks: yt, format: (v) => pct(v, ctx) }) +
          axisX(sx, h - M.bottom, top, { fmt: ctx.fmt, ticks: [0, 10, 20, 30, 40, 50].map((y) => y * 252), format: (v) => fmtNum(v / 252, 0, ctx.fmt), label: ctx.tr('c15.axisYears') }) +
          `<path class="s1 spike" d="${spikes(d.normal, sx, clampA, buckets)}"/>` +
          `<path class="s2 spike" d="${spikes(d.student, sx, clampB, buckets)}"/>` +
          th(syA) + th(syB) +
          `<text class="value-label" x="${M.left + 8}" y="${r1(top + 14)}">${esc(ctx.tr('c15.countN', { n: d.countN }))}</text>` +
          `<text class="value-label" x="${M.left + 8}" y="${r1(top + stripH + 30)}">${esc(ctx.tr('c15.countT', { n: d.countT, nu: Math.round(s.nu) }))}</text>` +
          '</svg>';
      },
    },
    {
      id: 'cola',
      wide: true,
      title: (c) => c.tr('c15.panelBottom'),
      height: () => 320,
      render(d, s, w, ctx) {
        const h = panelH(w, 320);
        const nu = Math.round(s.nu);
        const items = [
          { cls: 's1', label: ctx.tr('c15.legendNormal') },
          { cls: 's2', label: ctx.tr('c15.legendT', { nu }) },
          { cls: 'hist', label: ctx.tr('c15.legendObs'), box: true },
        ];
        const lh = legendHeight(items, w - M.left - M.right);
        const ks: number[] = [];
        for (let i = 0; i <= 160; i++) ks.push((0.08 * i) / 160);
        const L = Math.log10;
        const lo = -8;
        const sx = linear([0, 0.08], [M.left, w - M.right]);
        const sy = linear([lo, 0], [h - M.bottom, M.top + lh + 8]);
        const yN = ks.map((k) => { const v = L(tailNormal(k)); return v < lo ? NaN : v; });
        const yT = ks.map((k) => { const v = L(tailT(k, nu)); return v < lo ? NaN : v; });
        let obs = '';
        for (const k of [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07]) {
          for (const [arr, cls] of [[d.normal, 's1'], [d.student, 's2']] as const) {
            let c = 0;
            for (let i = 0; i < DAYS; i++) if (Math.abs(arr[i]) > k) c++;
            if (c > 0) obs += `<rect class="mark ${cls}" x="${r1(sx(k) - 4)}" y="${r1(sy(L(c / DAYS)) - 4)}" width="8" height="8"/>`;
          }
        }
        const yticks = [0, -2, -4, -6, -8];
        return svgOpen(w, h, ctx.tr('c15.panelBottom'), ctx.tr('c15.descBottom', { pn: sci(tailNormal(THRESH), ctx), pt: sci(tailT(THRESH, nu), ctx), nu }), 'c15b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, ticks: yticks, format: (v) => (v === 0 ? '1' : `10${String(v).replace('-', '⁻').replace(/\d/g, (x) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+x])}`) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx), label: ctx.tr('c15.axisThresh') }) +
          `<path class="s1 line thick" d="${pathFrom(ks, yN, sx, sy)}"/>` +
          `<path class="s2 line thick" d="${pathFrom(ks, yT, sx, sy)}"/>` +
          obs + '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([0, 0.08], [M.left, w - M.right]);
        const k = Math.min(0.08, Math.max(0, sx.invert(xpx)));
        const nu = Math.round(s.nu);
        return { x: sx(k), lines: [ctx.tr('c15.beyond', { k: fmtPct(k, 1, ctx.fmt) }), `${ctx.tr('c15.legendNormal')}: ${sci(tailNormal(k), ctx)}`, `${ctx.tr('c15.legendT', { nu })}: ${sci(tailT(k, nu), ctx)}`] };
      },
    },
  ],
  stats: (d, s, ctx) => {
    const nu = Math.round(s.nu);
    return [
      { label: ctx.tr('c15.statDaysN'), value: String(d.countN), note: ctx.tr('c15.expected', { e: num(DAYS * tailNormal(THRESH), ctx, 1) }) },
      { label: ctx.tr('c15.statDaysT', { nu }), value: String(d.countT), note: ctx.tr('c15.expected', { e: num(DAYS * tailT(THRESH, nu), ctx, 0) }) },
      { label: ctx.tr('c15.statKurtN'), value: num(d.kurtN, ctx, 2) },
      { label: ctx.tr('c15.statKurtT', { nu }), value: num(d.kurtT, ctx, 2), note: nu > 4 ? ctx.tr('c15.kurtTheory', { k: num(3 + 6 / (nu - 4), ctx, 2) }) : ctx.tr('c15.kurtInf') },
    ];
  },
  describe: (d, s, ctx) => ctx.tr('c15.describe', {
    nu: Math.round(s.nu), n: d.countN, t: d.countT, en: num(DAYS * tailNormal(THRESH), ctx, 1), et: num(DAYS * tailT(THRESH, Math.round(s.nu)), ctx, 0),
    kn: num(d.kurtN, ctx, 2), kt: num(d.kurtT, ctx, 2),
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c15.tableCaption', { nu: Math.round(s.nu) }),
    head: [ctx.tr('c15.axisThresh'), ctx.tr('c15.legendNormal'), ctx.tr('c15.legendT', { nu: Math.round(s.nu) })],
    rows: [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08].map((k) => [pct(k, ctx), sci(tailNormal(k), ctx), sci(tailT(k, Math.round(s.nu)), ctx)]),
  }),
};
