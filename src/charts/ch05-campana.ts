/**
 * Capítulo 5 · Nace una campana.
 * Izquierda: tablero de Galton con 1.000 bolas (en el navegador caen animadas, ver
 * client/ext-galton.ts) y la normal de igual media y varianza.
 * Derecha: distribución exacta de la suma de k dados (o de una variable muy asimétrica:
 * un premio de 10 € con probabilidad 1/10) con la normal superpuesta.
 *
 * Truco de rendimiento: los rebotes de cada bola solo dependen de la semilla; el número de filas
 * solo decide cuántos rebotes cuentan.
 */
import type { ChartDef, ChartCtx } from './types';
import { Rng, normCdf } from './rng';
import { linear, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, pathFrom, panelH } from './svg';
import { fmtPct, fmtNum } from '../lib/format';

export interface S5 extends Record<string, number> { rows: number; k: number; dist: number; seed: number }

export const BALLS = 1000;
export const MAX_ROWS = 20;

/** Distribuciones de partida: valores y probabilidades. */
export const DISTS: { values: number[]; probs: number[] }[] = [
  { values: [1, 2, 3, 4, 5, 6], probs: [1, 1, 1, 1, 1, 1].map((x) => x / 6) },   // un dado
  { values: [0, 10], probs: [0.9, 0.1] },                                        // premio raro y grande
];

/** Distribución exacta de la suma de k copias independientes (por convolución). */
export function sumPmf(k: number, d: { values: number[]; probs: number[] }): Map<number, number> {
  let cur = new Map<number, number>([[0, 1]]);
  for (let i = 0; i < k; i++) {
    const next = new Map<number, number>();
    for (const [s, p] of cur) for (let j = 0; j < d.values.length; j++) {
      const v = s + d.values[j];
      next.set(v, (next.get(v) ?? 0) + p * d.probs[j]);
    }
    cur = next;
  }
  return cur;
}

export function moments(d: { values: number[]; probs: number[] }) {
  const mu = d.values.reduce((a, v, i) => a + v * d.probs[i], 0);
  const v2 = d.values.reduce((a, v, i) => a + (v - mu) ** 2 * d.probs[i], 0);
  return { mu, var: v2 };
}

export function binomPmf(n: number, j: number): number {
  let lc = 0;
  for (let i = 1; i <= j; i++) lc += Math.log(n - j + i) - Math.log(i);
  return Math.exp(lc - n * Math.LN2);
}

interface Base { seed: number; u: Float32Array }   // BALLS × MAX_ROWS
let cache: Base | null = null;
function buildBase(seed: number): Base {
  if (cache && cache.seed === seed) return cache;
  const rng = new Rng(seed);
  const u = new Float32Array(BALLS * MAX_ROWS);
  for (let i = 0; i < u.length; i++) u[i] = rng.uniform();
  cache = { seed, u };
  return cache;
}

export interface D5 {
  base: Base;
  rows: number;
  bin: Uint8Array;          // casilla final de cada bola
  shown: number;            // bolas visibles (la animación lo va subiendo)
  pmf: [number, number][];  // suma de k: [valor, probabilidad], ordenado
  mu: number; sd: number; step: number;
  pTail: number;            // P(suma ≥ media + 2σ) exacta
  pTailN: number;           // la misma con la normal
}

export function computeBell(s: S5): D5 {
  const base = buildBase(s.seed);
  const rows = Math.round(s.rows);
  const bin = new Uint8Array(BALLS);
  for (let b = 0; b < BALLS; b++) {
    let r = 0;
    for (let j = 0; j < rows; j++) if (base.u[b * MAX_ROWS + j] < 0.5) r++;
    bin[b] = r;
  }
  const dist = DISTS[Math.round(s.dist)] ?? DISTS[0];
  const k = Math.round(s.k);
  const pmf = [...sumPmf(k, dist).entries()].sort((a, b) => a[0] - b[0]);
  const m = moments(dist);
  const mu = k * m.mu;
  const sd = Math.sqrt(k * m.var);
  const step = dist.values.length > 1 ? Math.abs(dist.values[1] - dist.values[0]) : 1;
  const cut = mu + 2 * sd;
  const pTail = pmf.filter(([v]) => v >= cut - 1e-9).reduce((a, [, p]) => a + p, 0);
  return { base, rows, bin, shown: BALLS, pmf, mu, sd, step, pTail, pTailN: 1 - normCdf(2) };
}

/** Bola en vuelo: posición horizontal (en casillas) tras cada fila, para la animación. */
export function ballPath(d: D5, b: number): number[] {
  const xs = [d.rows / 2];
  let r = 0;
  for (let j = 0; j < d.rows; j++) {
    if (d.base.u[b * MAX_ROWS + j] < 0.5) r++;
    xs.push(r + (d.rows - j - 1) / 2);
  }
  return xs;
}

const M = { top: 12, right: 16, bottom: 44, left: 48 };
const pct = (v: number, ctx: ChartCtx, d = 1) => fmtPct(v, d, ctx.fmt);
const distName = (v: number, ctx: ChartCtx) => ctx.tr(Math.round(v) === 1 ? 'c5.distSkew' : 'c5.distDie');

export const chart05: ChartDef<S5, D5> = {
  id: 'campana',
  simulated: true,
  defaults: { rows: 10, k: 2, dist: 0, seed: 5 },
  sliders: [
    { key: 'rows', label: 'c5.rows', min: 4, max: MAX_ROWS, step: 1, format: (v, c) => fmtNum(v, 0, c.fmt) },
    { key: 'k', label: 'c5.k', min: 1, max: 30, step: 1, format: (v, c) => fmtNum(v, 0, c.fmt) },
    { key: 'dist', label: 'c5.dist', min: 0, max: 1, step: 1, format: distName },
  ],
  compute: computeBell,
  panels: [
    {
      id: 'galton',
      title: (c) => c.tr('c5.panelLeft'),
      height: () => 340,
      render(d, s, w, ctx) {
        const items = [
          { cls: 'hist', label: ctx.tr('c5.legendBalls'), box: true },
          { cls: 's2', label: ctx.tr('c5.legendNormal') },
        ];
        const h = panelH(w, 340);
        const lh = legendHeight(items, w - M.left - M.right);
        const n = d.rows;
        const counts = new Array(n + 1).fill(0);
        for (let b = 0; b < d.shown; b++) counts[d.bin[b]]++;
        const top = M.top + lh + 8;
        const boardH = Math.min(120, (h - M.bottom - top) * 0.42);
        const histTop = top + boardH + 10;
        const sx = linear([-0.5, n + 0.5], [M.left, w - M.right]);
        const expMax = BALLS * binomPmf(n, Math.floor(n / 2));
        const ymax = Math.max(expMax, ...counts) * 1.1;
        const sy = linear([0, ymax], [h - M.bottom, histTop]);
        const bw = Math.max(1, sx(1) - sx(0) - 2);
        // clavos
        let pegs = '';
        const dy = boardH / (n + 1);
        for (let j = 0; j < n; j++) for (let i = 0; i <= j; i++) {
          const x = sx(n / 2 + i - j / 2);
          pegs += `<circle class="peg" cx="${r1(x)}" cy="${r1(top + dy * (j + 1))}" r="${n > 14 ? 1.4 : 2}"/>`;
        }
        // última bola en vuelo
        let flight = '';
        if (d.shown > 0 && d.shown < BALLS) {
          const xs = ballPath(d, d.shown - 1);
          const ys = xs.map((_, j) => top + dy * j + dy * 0.5);
          let pd = '';
          xs.forEach((x, j) => { pd += (j ? 'L' : 'M') + r1(sx(x)) + ',' + r1(ys[j]); });
          flight = `<path class="s2 line" d="${pd}"/><circle class="s2 dot" cx="${r1(sx(xs[xs.length - 1]))}" cy="${r1(ys[ys.length - 1])}" r="4"/>`;
        }
        let bars = '';
        counts.forEach((c, i) => { if (c > 0) bars += `<rect class="hist" x="${r1(sx(i) - bw / 2)}" y="${r1(sy(c))}" width="${r1(bw)}" height="${r1(sy(0) - sy(c))}"/>`; });
        const nx: number[] = [];
        const ny: number[] = [];
        const mu = n / 2;
        const sd = Math.sqrt(n) / 2;
        for (let q = 0; q <= 120; q++) {
          const x = -0.5 + ((n + 1) * q) / 120;
          nx.push(x);
          ny.push((d.shown * Math.exp(-((x - mu) ** 2) / (2 * sd * sd))) / (sd * Math.sqrt(2 * Math.PI)));
        }
        const tk = n <= 10 ? Array.from({ length: n + 1 }, (_, i) => i) : Array.from({ length: Math.floor(n / 2) + 1 }, (_, i) => 2 * i);
        return svgOpen(w, h, ctx.tr('c5.panelLeft'), ctx.tr('c5.descLeft', { n, b: fmtNum(d.shown, 0, ctx.fmt) }), 'c5a') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          pegs + flight +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt }) +
          axisX(sx, h - M.bottom, histTop, { fmt: ctx.fmt, ticks: tk, label: ctx.tr('c5.axisBin') }) +
          bars +
          `<path class="s2 line" d="${pathFrom(nx, ny, sx, sy)}"/>` +
          `<text class="value-label small" x="${w - M.right}" y="${r1(histTop + 10)}" text-anchor="end">${esc(ctx.tr('c5.ballCount', { b: fmtNum(d.shown, 0, ctx.fmt) }))}</text>` +
          '</svg>';
      },
    },
    {
      id: 'suma',
      title: (c) => c.tr('c5.panelRight'),
      height: () => 340,
      render(d, s, w, ctx) {
        const items = [
          { cls: 'hist', label: ctx.tr(Math.round(s.dist) === 1 ? 'c5.legendSumSkew' : 'c5.legendSum', { k: Math.round(s.k) }), box: true },
          { cls: 's2', label: ctx.tr('c5.legendNormal') },
        ];
        const h = panelH(w, 340);
        const lh = legendHeight(items, w - M.left - M.right);
        // Se muestran los valores con probabilidad apreciable.
        const vis = d.pmf.filter(([, p]) => p > 1e-5);
        const x0 = Math.min(vis[0][0], d.mu - 3.5 * d.sd) - d.step / 2;
        const x1 = Math.max(vis[vis.length - 1][0], d.mu + 3.5 * d.sd) + d.step / 2;
        const sx = linear([x0, x1], [M.left, w - M.right]);
        const dens = (x: number) => (d.sd > 0 ? (d.step * Math.exp(-((x - d.mu) ** 2) / (2 * d.sd * d.sd))) / (d.sd * Math.sqrt(2 * Math.PI)) : 0);
        const pmax = Math.max(...vis.map(([, p]) => p), dens(d.mu));
        const sy = linear([0, pmax * 1.12], [h - M.bottom, M.top + lh + 8]);
        const bw = Math.max(1, Math.abs(sx(d.step) - sx(0)) - (vis.length > 60 ? 0.5 : 2));
        let bars = '';
        for (const [v, p] of vis) bars += `<rect class="hist" x="${r1(sx(v) - bw / 2)}" y="${r1(sy(p))}" width="${r1(bw)}" height="${r1(sy(0) - sy(p))}"/>`;
        const nx: number[] = [];
        const ny: number[] = [];
        for (let q = 0; q <= 160; q++) { const x = x0 + ((x1 - x0) * q) / 160; nx.push(x); ny.push(dens(x)); }
        return svgOpen(w, h, ctx.tr('c5.panelRight'), ctx.tr('c5.descRight', { k: Math.round(s.k), d: distName(s.dist, ctx), mu: fmtNum(d.mu, 1, ctx.fmt), sd: fmtNum(d.sd, 2, ctx.fmt) }), 'c5b') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => pct(v, ctx, 0) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('c5.axisSum') }) +
          bars +
          `<path class="s2 line" d="${pathFrom(nx, ny, sx, sy)}"/>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const vis = d.pmf.filter(([, p]) => p > 1e-5);
        const x0 = Math.min(vis[0][0], d.mu - 3.5 * d.sd) - d.step / 2;
        const x1 = Math.max(vis[vis.length - 1][0], d.mu + 3.5 * d.sd) + d.step / 2;
        const sx = linear([x0, x1], [M.left, w - M.right]);
        const x = sx.invert(xpx);
        let best = vis[0];
        for (const e of vis) if (Math.abs(e[0] - x) < Math.abs(best[0] - x)) best = e;
        const nd = d.sd > 0 ? (d.step * Math.exp(-((best[0] - d.mu) ** 2) / (2 * d.sd * d.sd))) / (d.sd * Math.sqrt(2 * Math.PI)) : 0;
        return { x: sx(best[0]), lines: [`${ctx.tr('c5.axisSum')}: ${fmtNum(best[0], 0, ctx.fmt)}`, `${ctx.tr('c5.exact')}: ${pct(best[1], ctx, 2)}`, `${ctx.tr('c5.legendNormal')}: ${pct(nd, ctx, 2)}`] };
      },
    },
  ],
  stats: (d, s, ctx) => [
    { label: ctx.tr('c5.statMean'), value: fmtNum(d.mu, 1, ctx.fmt) },
    { label: ctx.tr('c5.statSd'), value: fmtNum(d.sd, 2, ctx.fmt) },
    { label: ctx.tr('c5.statTail'), value: pct(d.pTail, ctx, 1), note: ctx.tr('c5.tailNote', { p: pct(d.pTailN, ctx, 1) }) },
  ],
  describe: (d, s, ctx) => ctx.tr('c5.describe', {
    n: d.rows, k: Math.round(s.k), d: distName(s.dist, ctx), mu: fmtNum(d.mu, 1, ctx.fmt), sd: fmtNum(d.sd, 2, ctx.fmt),
    t: pct(d.pTail, ctx, 1), tn: pct(d.pTailN, ctx, 1),
  }),
  table: (d, s, ctx) => ({
    caption: ctx.tr('c5.tableCaption', { k: Math.round(s.k), d: distName(s.dist, ctx) }),
    head: [ctx.tr('c5.axisSum'), ctx.tr('c5.exact'), ctx.tr('c5.legendNormal')],
    rows: d.pmf.filter(([, p]) => p > 0.001).map(([v, p]) => {
      const nd = d.sd > 0 ? normCdf((v + d.step / 2 - d.mu) / d.sd) - normCdf((v - d.step / 2 - d.mu) / d.sd) : 0;
      return [fmtNum(v, 0, ctx.fmt), pct(p, ctx, 2), pct(nd, ctx, 2)];
    }),
  }),
};
