/**
 * Tema C · Del árbol binomial a Black-Scholes (RF-TEM-02, fase 5: gráfico de Black-Scholes).
 * Izquierda: precio de la opción de compra y de venta europeas según el precio de la acción,
 * frente a lo que pagan al vencimiento (la diferencia es el valor temporal).
 * Derecha: precio de la compra con un árbol binomial de 1 a N pasos (Cox, Ross y Rubinstein),
 * que oscila y se acerca a la fórmula de Black y Scholes.
 */
import type { ChartDef, ChartCtx } from './types';
import { linear, pathFrom, axisX, axisY, legend, legendHeight, svgOpen, r1, esc, panelH } from './svg';
import { normCdf } from './rng';
import { fmtNum, fmtPct, fmtEur } from '../lib/format';

export interface SC extends Record<string, number> { S: number; K: number; sigma: number; T: number; r: number; N: number }
export interface DC {
  call: number; put: number; d1: number; d2: number;
  xs: number[]; calls: number[]; puts: number[]; payCall: number[]; payPut: number[];
  steps: number[]; tree: number[];
}

/** Black y Scholes (1973): precio de la compra y de la venta europeas. */
export function blackScholes(S: number, K: number, sigma: number, T: number, r: number) {
  const sq = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / sq;
  const d2 = d1 - sq;
  const disc = K * Math.exp(-r * T);
  // max(0, …): evita valores negativos minúsculos por redondeo muy fuera del dinero.
  return { call: Math.max(0, S * normCdf(d1) - disc * normCdf(d2)), put: Math.max(0, disc * normCdf(-d2) - S * normCdf(-d1)), d1, d2 };
}

/**
 * Árbol binomial de Cox, Ross y Rubinstein (1979) con n pasos: u = e^{σ√Δt}, d = 1/u y
 * probabilidad neutral al riesgo q = (e^{rΔt} − d)/(u − d). Devuelve NaN si q no está entre 0 y 1
 * (con muy pocos pasos el árbol permitiría un arbitraje).
 */
export function binomialCall(S: number, K: number, sigma: number, T: number, r: number, n: number): number {
  const dt = T / n;
  const u = Math.exp(sigma * Math.sqrt(dt));
  const d = 1 / u;
  const g = Math.exp(r * dt);
  const q = (g - d) / (u - d);
  if (!(q > 0 && q < 1)) return NaN;
  const v = new Float64Array(n + 1);
  for (let j = 0; j <= n; j++) v[j] = Math.max(0, S * u ** (2 * j - n) - K);
  for (let k = n - 1; k >= 0; k--) for (let j = 0; j <= k; j++) v[j] = (q * v[j + 1] + (1 - q) * v[j]) / g;
  return v[0];
}

const M = { top: 12, right: 16, bottom: 44, left: 56 };
const eur = (v: number, ctx: ChartCtx, d = 2) => fmtEur(v, d, ctx.fmt);
const pct = (v: number, ctx: ChartCtx) => fmtPct(v, 0, ctx.fmt);
const SAMPLES = 160;

function compute(s: SC): DC {
  const { call, put, d1, d2 } = blackScholes(s.S, s.K, s.sigma, s.T, s.r);
  // Ventana centrada en el precio de ejercicio, para que se vea el valor temporal.
  const xMin = Math.min(0.5 * s.K, 0.8 * s.S);
  const xMax = Math.max(1.5 * s.K, 1.2 * s.S);
  const xs: number[] = [], calls: number[] = [], puts: number[] = [], payCall: number[] = [], payPut: number[] = [];
  for (let k = 0; k <= SAMPLES; k++) {
    const x = xMin + ((xMax - xMin) * k) / SAMPLES;
    const bs = blackScholes(x, s.K, s.sigma, s.T, s.r);
    xs.push(x); calls.push(bs.call); puts.push(bs.put);
    payCall.push(Math.max(0, x - s.K)); payPut.push(Math.max(0, s.K - x));
  }
  const steps: number[] = [], tree: number[] = [];
  for (let n = 1; n <= s.N; n++) { steps.push(n); tree.push(binomialCall(s.S, s.K, s.sigma, s.T, s.r, n)); }
  return { call, put, d1, d2, xs, calls, puts, payCall, payPut, steps, tree };
}

const last = (a: number[]) => a[a.length - 1];

export const chartC: ChartDef<SC, DC> = {
  id: 'blackscholes',
  simulated: false,
  defaults: { S: 100, K: 100, sigma: 0.2, T: 1, r: 0.03, N: 10 },
  sliders: [
    { key: 'S', label: 'tC.spot', min: 50, max: 150, step: 1, format: (v, c) => eur(v, c, 0) },
    { key: 'K', label: 'tC.strike', min: 50, max: 150, step: 1, format: (v, c) => eur(v, c, 0) },
    { key: 'sigma', label: 'tC.sigma', min: 0.05, max: 0.6, step: 0.01, format: (v, c) => pct(v, c) },
    { key: 'N', label: 'tC.steps', min: 1, max: 200, step: 1, format: (v) => String(v) },
    { key: 'T', label: 'tC.maturity', min: 0.1, max: 3, step: 0.1, format: (v, c) => c.tr('tC.years', { n: fmtNum(v, 1, c.fmt) }), more: true },
    { key: 'r', label: 'tC.rate', min: 0, max: 0.1, step: 0.005, format: (v, c) => fmtPct(v, 1, c.fmt), more: true },
  ],
  compute,
  panels: [
    {
      id: 'precio',
      title: (c) => c.tr('tC.panelLeft'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('tC.legendCall') },
          { cls: 's2', label: ctx.tr('tC.legendPut') },
          { cls: 'muted', label: ctx.tr('tC.legendPayoff'), dash: true },
        ];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const hi = Math.max(...d.calls, ...d.puts, ...d.payCall, ...d.payPut) * 1.05;
        const sx = linear([d.xs[0], last(d.xs)], [M.left, w - M.right]);
        const sy = linear([0, hi], [h - M.bottom, M.top + lh + 8]);
        const px = sx(s.S);
        return svgOpen(w, h, ctx.tr('tC.panelLeft'), ctx.tr('tC.descLeft', { S: eur(s.S, ctx, 0), K: eur(s.K, ctx, 0), c: eur(d.call, ctx), p: eur(d.put, ctx) }), 'tCa') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => fmtEur(v, 0, ctx.fmt) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('tC.axisSpot'), format: (v) => fmtNum(v, 0, ctx.fmt) }) +
          `<line class="ref" x1="${r1(sx(s.K))}" x2="${r1(sx(s.K))}" y1="${M.top + lh + 8}" y2="${h - M.bottom}"/>` +
          `<text class="value-label small" x="${r1(sx(s.K) + 4)}" y="${M.top + lh + 20}">K</text>` +
          `<path class="muted line dash" d="${pathFrom(d.xs, d.payCall, sx, sy)}"/>` +
          `<path class="muted line dash" d="${pathFrom(d.xs, d.payPut, sx, sy)}"/>` +
          `<path class="s2 line thick" d="${pathFrom(d.xs, d.puts, sx, sy)}"/>` +
          `<path class="s1 line thick" d="${pathFrom(d.xs, d.calls, sx, sy)}"/>` +
          `<line class="guide" x1="${r1(px)}" x2="${r1(px)}" y1="${M.top + lh + 8}" y2="${h - M.bottom}"/>` +
          `<circle class="s2 dot" cx="${r1(px)}" cy="${r1(sy(d.put))}" r="5"/>` +
          `<circle class="s1 dot" cx="${r1(px)}" cy="${r1(sy(d.call))}" r="5"/>` +
          `<text class="value-label" x="${r1(px + 8)}" y="${r1(sy(d.call) - 8)}">${esc(eur(d.call, ctx))}</text>` +
          `<text class="value-label" x="${r1(px + 8)}" y="${r1(sy(d.put) + (d.put < d.call ? 18 : -8))}">${esc(eur(d.put, ctx))}</text>` +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([d.xs[0], last(d.xs)], [M.left, w - M.right]);
        const x = Math.round(Math.min(last(d.xs), Math.max(d.xs[0], sx.invert(xpx))));
        const bs = blackScholes(x, s.K, s.sigma, s.T, s.r);
        return { x: sx(x), lines: [`${ctx.tr('tC.axisSpot')}: ${eur(x, ctx, 0)}`, `${ctx.tr('tC.legendCall')}: ${eur(bs.call, ctx)}`, `${ctx.tr('tC.legendPut')}: ${eur(bs.put, ctx)}`] };
      },
    },
    {
      id: 'arbol',
      title: (c) => c.tr('tC.panelRight'),
      height: () => 300,
      render(d, s, w, ctx) {
        const items = [
          { cls: 's1', label: ctx.tr('tC.legendTree') },
          { cls: 's3', label: ctx.tr('tC.legendBs'), dash: true },
        ];
        const h = panelH(w, 300);
        const lh = legendHeight(items, w - M.left - M.right);
        const ok = d.tree.filter(Number.isFinite);
        const spread = Math.max(0.5, ...ok.map((v) => Math.abs(v - d.call)));
        const sx = linear([1, Math.max(10, s.N)], [M.left, w - M.right]);
        const sy = linear([Math.max(0, d.call - spread * 1.1), d.call + spread * 1.1], [h - M.bottom, M.top + lh + 8]);
        const lastV = last(d.tree);
        const showDots = s.N <= 40;
        return svgOpen(w, h, ctx.tr('tC.panelRight'), ctx.tr('tC.descRight', { n: s.N, t: Number.isFinite(lastV) ? eur(lastV, ctx) : '—', c: eur(d.call, ctx) }), 'tCb') +
          legend(items, M.left, M.top + 10, w - M.left - M.right) +
          axisY(sy, M.left, w - M.right, { fmt: ctx.fmt, format: (v) => fmtEur(v, 1, ctx.fmt) }) +
          axisX(sx, h - M.bottom, M.top, { fmt: ctx.fmt, label: ctx.tr('tC.axisSteps'), format: (v) => fmtNum(v, 0, ctx.fmt) }) +
          `<line class="s3 line dash" x1="${M.left}" x2="${w - M.right}" y1="${r1(sy(d.call))}" y2="${r1(sy(d.call))}"/>` +
          `<path class="s1 line" d="${pathFrom(d.steps, d.tree, sx, sy)}"/>` +
          (showDots ? d.steps.map((n, i) => (Number.isFinite(d.tree[i]) ? `<circle class="s1 dot" cx="${r1(sx(n))}" cy="${r1(sy(d.tree[i]))}" r="3"/>` : '')).join('') : '') +
          (Number.isFinite(lastV) ? `<circle class="s1 dot" cx="${r1(sx(s.N))}" cy="${r1(sy(lastV))}" r="5"/>` : '') +
          '</svg>';
      },
      hover(d, s, w, xpx, ctx) {
        const sx = linear([1, Math.max(10, s.N)], [M.left, w - M.right]);
        const n = Math.round(Math.min(s.N, Math.max(1, sx.invert(xpx))));
        const v = d.tree[n - 1];
        return { x: sx(n), lines: [ctx.tr('tC.nSteps', { n }), `${ctx.tr('tC.legendTree')}: ${Number.isFinite(v) ? eur(v, ctx) : ctx.tr('tC.noTree')}`, `${ctx.tr('tC.legendBs')}: ${eur(d.call, ctx)}`] };
      },
    },
  ],
  stats(d, s, ctx) {
    const t = last(d.tree);
    return [
      { label: ctx.tr('tC.statCall'), value: eur(d.call, ctx), panels: ['precio', 'arbol'] },
      { label: ctx.tr('tC.statPut'), value: eur(d.put, ctx), panels: ['precio'] },
      {
        label: ctx.tr('tC.statTree', { n: s.N }),
        value: Number.isFinite(t) ? eur(t, ctx) : '—',
        note: Number.isFinite(t) ? ctx.tr('tC.statDiff', { e: fmtNum(t - d.call, 3, ctx.fmt) }) : ctx.tr('tC.noTree'),
        panels: ['arbol'],
      },
      { label: ctx.tr('tC.statDelta'), value: fmtNum(normCdf(d.d1), 2, ctx.fmt), panels: ['precio'] },
    ];
  },
  describe: (d, s, ctx) => {
    const t = last(d.tree);
    return ctx.tr('tC.describe', {
      S: eur(s.S, ctx, 0), K: eur(s.K, ctx, 0), sig: pct(s.sigma, ctx), T: fmtNum(s.T, 1, ctx.fmt), r: fmtPct(s.r, 1, ctx.fmt),
      c: eur(d.call, ctx), p: eur(d.put, ctx), n: s.N, t: Number.isFinite(t) ? eur(t, ctx) : '—',
      tv: eur(d.call - Math.max(0, s.S - s.K), ctx),
    });
  },
  table(d, s, ctx) {
    const ns = [...new Set([1, 2, 3, 4, 5, 10, 20, 50, 100, 200].filter((n) => n <= s.N).concat(s.N))].sort((a, b) => a - b);
    return {
      caption: ctx.tr('tC.tableCaption', { c: eur(d.call, ctx) }),
      head: [ctx.tr('tC.axisSteps'), ctx.tr('tC.legendTree'), ctx.tr('tC.colDiff')],
      rows: ns.map((n) => {
        const v = d.tree[n - 1];
        return [String(n), Number.isFinite(v) ? eur(v, ctx) : '—', Number.isFinite(v) ? fmtEur(v - d.call, 3, ctx.fmt) : '—'];
      }),
    };
  },
};
