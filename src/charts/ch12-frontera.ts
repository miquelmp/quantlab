/**
 * Capítulo 12 · La nube y su borde.
 * Tres activos con medias, volatilidades y correlaciones editables (tabla en client/ext-frontera.ts).
 * Se dibujan 5.000 carteras con pesos aleatorios, la frontera de mínima varianza con su tramo
 * eficiente, la cartera de mínima varianza y, si se activa el activo libre de riesgo, la recta
 * tangente con la cartera de máximo ratio de Sharpe. Las ventas en corto se pueden permitir o no.
 *
 * Truco de rendimiento: los pesos aleatorios solo dependen de la semilla; los parámetros solo
 * cambian el riesgo y la rentabilidad de cada cartera.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng } from './rng';
import { linear, pathFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S12 extends Record<string, number> {
  shorts: number; riskfree: number; rf: number; seed: number;
  m1: number; m2: number; m3: number; s1: number; s2: number; s3: number; r12: number; r13: number; r23: number;
}

export const NAMES = ['A', 'B', 'C'];
export const RANDOM = 5000;
const GRID = 0.01;   // paso de la rejilla para la frontera sin ventas en corto

/** Peso del primer activo en la cartera de mínima varianza de dos activos. */
export const minVarWeight2 = (s1: number, s2: number, rho: number) => (s2 * s2 - rho * s1 * s2) / (s1 * s1 + s2 * s2 - 2 * rho * s1 * s2);

type V3 = [number, number, number];
type M3 = [V3, V3, V3];

export function covMatrix(s: S12): M3 {
  const sd: V3 = [s.s1, s.s2, s.s3];
  const r: M3 = [[1, s.r12, s.r13], [s.r12, 1, s.r23], [s.r13, s.r23, 1]];
  return r.map((row, i) => row.map((x, j) => x * sd[i] * sd[j])) as M3;
}

function det3(a: M3): number {
  return a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
}

function inv3(a: M3): M3 {
  const d = det3(a);
  const c = (i: number, j: number) => {
    const r = [0, 1, 2].filter((x) => x !== i);
    const k = [0, 1, 2].filter((x) => x !== j);
    return ((i + j) % 2 ? -1 : 1) * (a[r[0]][k[0]] * a[r[1]][k[1]] - a[r[0]][k[1]] * a[r[1]][k[0]]);
  };
  return [0, 1, 2].map((i) => [0, 1, 2].map((j) => c(j, i) / d)) as M3;
}

const mv = (a: M3, v: number[]) => a.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const portStats = (w: number[], mu: number[], cov: M3) => ({ mu: dot(w, mu), sigma: Math.sqrt(Math.max(0, dot(w, mv(cov, w)))) });

let cache: { seed: number; w: Float64Array } | null = null;
function randomWeights(seed: number): Float64Array {
  if (cache && cache.seed === seed) return cache.w;
  const rng = new Rng(seed);
  const w = new Float64Array(RANDOM * 3);
  for (let i = 0; i < RANDOM; i++) {
    // Uniforme sobre el símplex: exponenciales normalizadas.
    const e = [0, 1, 2].map(() => -Math.log(1 - rng.uniform()));
    const t = e[0] + e[1] + e[2];
    for (let k = 0; k < 3; k++) w[i * 3 + k] = e[k] / t;
  }
  cache = { seed, w };
  return w;
}

export interface Port { w: number[]; mu: number; sigma: number }
export interface D12 {
  valid: boolean;
  cloud: Float64Array;           // σ, μ alternados
  frontier: { mu: number; sigma: number }[];
  gmv: Port;
  tangent: Port | null;
  assets: { mu: number; sigma: number }[];
}

export function computeFrontier(s: S12): D12 {
  const mu = [s.m1, s.m2, s.m3];
  const cov = covMatrix(s);
  const assets = [0, 1, 2].map((i) => ({ mu: mu[i], sigma: Math.sqrt(cov[i][i]) }));
  // La matriz de correlaciones debe ser definida positiva (si no, los datos son incoherentes).
  const corr: M3 = [[1, s.r12, s.r13], [s.r12, 1, s.r23], [s.r13, s.r23, 1]];
  const valid = det3(corr) > 1e-6 && 1 - s.r12 * s.r12 > 0;
  const rw = randomWeights(s.seed);
  const cloud = new Float64Array(RANDOM * 2);
  for (let i = 0; i < RANDOM; i++) {
    const p = portStats([rw[i * 3], rw[i * 3 + 1], rw[i * 3 + 2]], mu, cov);
    cloud[2 * i] = p.sigma;
    cloud[2 * i + 1] = p.mu;
  }
  const empty = { valid: false, cloud, frontier: [], gmv: { w: [1, 0, 0], ...assets[0] }, tangent: null, assets };
  if (!valid) return empty;
  let frontier: { mu: number; sigma: number }[] = [];
  let gmv: Port;
  let tangent: Port | null = null;
  if (Math.round(s.shorts) === 1) {
    const ic = inv3(cov);
    const one = [1, 1, 1];
    const icOne = mv(ic, one);
    const icMu = mv(ic, mu);
    const A = dot(one, icMu);
    const B = dot(mu, icMu);
    const C = dot(one, icOne);
    const D = B * C - A * A;
    const wg = icOne.map((x) => x / C);
    gmv = { w: wg, ...portStats(wg, mu, cov) };
    const lo = Math.min(...mu) - 0.06;
    const hi = Math.max(...mu) + 0.06;
    if (Math.abs(D) <= 1e-9 * Math.abs(B * C)) {
      // Todas las rentabilidades esperadas iguales: cualquier cartera rinde lo mismo, así que la
      // «frontera» es una semirrecta horizontal que empieza en la de mínima varianza.
      for (let k = 0; k <= 50; k++) frontier.push({ mu: gmv.mu, sigma: gmv.sigma + k * 0.02 });
    } else {
      for (let k = 0; k <= 200; k++) {
        const m = lo + ((hi - lo) * k) / 200;
        frontier.push({ mu: m, sigma: Math.sqrt(Math.max(0, (C * m * m - 2 * A * m + B) / D)) });
      }
    }
    if (Math.round(s.riskfree) === 1) {
      const ex = mu.map((x) => x - s.rf);
      const z = mv(ic, ex);
      const t = z[0] + z[1] + z[2];
      if (t > 0) { const wt = z.map((x) => x / t); tangent = { w: wt, ...portStats(wt, mu, cov) }; }
    }
  } else {
    // Sin ventas en corto: rejilla sobre el símplex y envolvente inferior por tramos de rentabilidad.
    const pts: Port[] = [];
    const n = Math.round(1 / GRID);
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) {
      const w = [i / n, j / n, (n - i - j) / n];
      pts.push({ w, ...portStats(w, mu, cov) });
    }
    gmv = pts.reduce((a, b) => (b.sigma < a.sigma ? b : a));
    const lo = Math.min(...mu);
    const hi = Math.max(...mu);
    const bins = 120;
    const best: (Port | null)[] = new Array(bins + 1).fill(null);
    for (const p of pts) {
      const b = Math.round(((p.mu - lo) / (hi - lo || 1)) * bins);
      if (!best[b] || p.sigma < best[b]!.sigma) best[b] = p;
    }
    frontier = best.filter((p): p is Port => !!p).map((p) => ({ mu: p.mu, sigma: p.sigma }));
    if (Math.round(s.riskfree) === 1) {
      tangent = pts.reduce((a, b) => ((b.mu - s.rf) / b.sigma > (a.mu - s.rf) / a.sigma ? b : a));
    }
  }
  return { valid, cloud, frontier, gmv, tangent, assets };
}

const M = { top: 12, right: 24, bottom: 44, left: 56 };
const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const H = 420;
const onOff = (v: number, ctx: ChartCtx) => ctx.tr(Math.round(v) === 1 ? 'c12.yes' : 'c12.no');
const weights = (p: Port, ctx: ChartCtx) => p.w.map((x, i) => `${NAMES[i]} ${pct(x, ctx, 0)}`).join(' · ');

export const chart12: ChartDef<S12, D12> = {
  id: 'frontera',
  simulated: true,
  defaults: { shorts: 0, riskfree: 1, rf: 0.02, seed: 12, m1: 0.04, m2: 0.09, m3: 0.07, s1: 0.06, s2: 0.2, s3: 0.14, r12: 0.2, r13: 0.1, r23: 0.5 },
  sliders: [
    { key: 'shorts', label: 'c12.shorts', min: 0, max: 1, step: 1, format: onOff },
    { key: 'riskfree', label: 'c12.riskfree', min: 0, max: 1, step: 1, format: onOff },
    { key: 'rf', label: 'c12.rf', min: 0, max: 0.05, step: 0.0025, format: (v, c) => pct(v, c, 2) },
  ],
  extraKeys: ['m1', 'm2', 'm3', 's1', 's2', 's3', 'r12', 'r13', 'r23'],
  compute: computeFrontier,
  panels: [
    {
      id: 'nube',
      wide: true,
      title: (c) => c.tr('c12.panel'),
      height: () => H,
      render(d, s, w, ctx) {
        const items = [
          { cls: 'path', label: ctx.tr('c12.legendCloud') },
          { cls: 's1', label: ctx.tr('c12.legendEff') },
          { cls: 's1', label: ctx.tr('c12.legendIneff'), dash: true },
          ...(d.tangent ? [{ cls: 's2', label: ctx.tr('c12.legendTangent') }] : []),
        ];
        const lh = legendHeight(items, w - M.left - M.right);
        const xmax = Math.max(0.25, ...d.assets.map((a) => a.sigma * 1.2));
        const ymin = Math.min(0, ...d.assets.map((a) => a.mu)) - 0.01;
        const ymax = Math.max(...d.assets.map((a) => a.mu)) + 0.04;
        const sx = linear([0, xmax], [M.left, w - M.right]);
        const sy = linear([ymin, ymax], [H - M.bottom, M.top + lh + 8]);
        let cloud = '';
        for (let i = 0; i < RANDOM; i++) cloud += `M${r1(sx(d.cloud[2 * i]))},${r1(sy(d.cloud[2 * i + 1]))}h0`;
        let body = `<path class="cloud" d="${cloud}"/>`;
        if (d.valid) {
          const fr = d.frontier.filter((p) => p.sigma <= xmax && p.mu >= ymin && p.mu <= ymax);
          const eff = fr.filter((p) => p.mu >= d.gmv.mu);
          const ineff = fr.filter((p) => p.mu <= d.gmv.mu);
          body += `<path class="s1 line dash" d="${pathFrom(ineff.map((p) => p.sigma), ineff.map((p) => p.mu), sx, sy)}"/>` +
            `<path class="s1 line thick" d="${pathFrom(eff.map((p) => p.sigma), eff.map((p) => p.mu), sx, sy)}"/>`;
          if (d.tangent) {
            const slope = (d.tangent.mu - s.rf) / d.tangent.sigma;
            let xe = xmax;
            let ye = s.rf + slope * xe;
            if (ye > ymax) { ye = ymax; xe = (ymax - s.rf) / slope; }
            body += `<path class="s2 line" d="M${r1(sx(0))},${r1(sy(s.rf))}L${r1(sx(xe))},${r1(sy(ye))}"/>` +
              `<circle class="muted dot" cx="${r1(sx(0))}" cy="${r1(sy(s.rf))}" r="5"/>`;
            if (d.tangent.sigma <= xmax && d.tangent.mu <= ymax) {
              body += `<circle class="s2 dot" cx="${r1(sx(d.tangent.sigma))}" cy="${r1(sy(d.tangent.mu))}" r="7"/>` +
                `<text class="value-label" x="${r1(sx(d.tangent.sigma) + 12)}" y="${r1(sy(d.tangent.mu) - 8)}">${esc(ctx.tr('c12.tangentLabel'))}</text>`;
            }
          }
          body += `<circle class="s1 dot" cx="${r1(sx(d.gmv.sigma))}" cy="${r1(sy(d.gmv.mu))}" r="7"/>` +
            `<text class="value-label" x="${r1(sx(d.gmv.sigma) - 12)}" y="${r1(sy(d.gmv.mu) - 10)}" text-anchor="end">${esc(ctx.tr('c12.gmvLabel'))}</text>`;
        } else {
          body += `<text class="value-label" x="${r1(w / 2)}" y="${r1(H / 2)}" text-anchor="middle">${esc(ctx.tr('c12.invalid'))}</text>`;
        }
        d.assets.forEach((a, i) => {
          body += `<circle class="muted dot" cx="${r1(sx(a.sigma))}" cy="${r1(sy(a.mu))}" r="5"/>` +
            `<text class="value-label" x="${r1(sx(a.sigma) + 9)}" y="${r1(sy(a.mu) + 4)}">${NAMES[i]}</text>`;
        });
        return svgOpen(w, H, ctx.tr('c12.panel'), ctx.tr('c12.desc', { g: d.valid ? `${pct(d.gmv.mu, ctx)} / ${pct(d.gmv.sigma, ctx)}` : '—' }), 'c12a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, H - M.bottom, M.top, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0), label: ctx.tr('c12.axisSigma') }) +
          body + '</svg>';
      },
    },
  ],
  stats: (d, s, ctx) => d.valid ? [
    { label: ctx.tr('c12.statGmv'), value: `${pct(d.gmv.mu, ctx)} · ${pct(d.gmv.sigma, ctx)}`, note: ` (${weights(d.gmv, ctx)})` },
    ...(d.tangent ? [{ label: ctx.tr('c12.statTangent'), value: `${pct(d.tangent.mu, ctx)} · ${pct(d.tangent.sigma, ctx)}`, note: ` (${weights(d.tangent, ctx)}; Sharpe ${fmtNum((d.tangent.mu - s.rf) / d.tangent.sigma, 2, ctx.fmt)})` }] : []),
  ] : [{ label: ctx.tr('c12.statGmv'), value: '—', note: ctx.tr('c12.invalid') }],
  describe: (d, s, ctx) => d.valid
    ? ctx.tr('c12.describe', { sh: onOff(s.shorts, ctx).toLowerCase(), g: `${pct(d.gmv.mu, ctx)}`, gs: pct(d.gmv.sigma, ctx), gw: weights(d.gmv, ctx) }) +
      (d.tangent ? ' ' + ctx.tr('c12.describeT', { t: pct(d.tangent.mu, ctx), ts: pct(d.tangent.sigma, ctx), tw: weights(d.tangent, ctx), rf: pct(s.rf, ctx, 2) }) : '')
    : ctx.tr('c12.invalid'),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c12.tableCaption'),
    head: [ctx.tr('c12.colAsset'), ctx.tr('c12.colMu'), ctx.tr('c12.axisSigma')],
    rows: d.assets.map((a, i) => [NAMES[i], pct(a.mu, ctx), pct(a.sigma, ctx)]),
  }),
};
