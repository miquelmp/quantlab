/**
 * Cada reto de content/es/retos.yaml debe poder conseguirse con los mandos del gráfico.
 * Para cada uno se guarda aquí una «solución» (valores de los mandos) y la condición que deben
 * cumplir los resultados del gráfico con ella.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import YAML from 'yaml';
import { CHART_BY_CHAPTER, loadChart } from '../src/charts/registry';

const ctx: any = { fmt: { decimal: ',', group: '.' }, tr: (k: string) => k };
/** Primer número de un texto con formato español («1.989,79 €», «−0,40 %»). */
const num = (s: string, k = 0) => (s.replace(/\./g, '').replace(/,/g, '.').replace(/−/g, '-').match(/-?\d+(\.\d+)?/g) ?? []).map(Number)[k];

type Sol = { state: Record<string, number>; ok: (v: string[]) => boolean };
const SOL: Record<number, Sol[]> = {
  1: [{ state: { L: 0.5 }, ok: (v) => num(v[1]) === 100 }, { state: { R: 0.6 }, ok: (v) => num(v[3]) > 10 }],
  2: [{ state: { i: 0.036 }, ok: (v) => num(v[0]) > 2000 }, { state: { i: -0.01, T: 40 }, ok: (v) => num(v[3]) > 1000 }],
  3: [{ state: { prize: 5 }, ok: (v) => num(v[0]) === 0 }, { state: { n: 10 }, ok: (v) => num(v[1]) >= 25 }],
  4: [{ state: { n: 900 }, ok: (v) => num(v[1]) === 30 }, { state: { p: 0.55, n: 300 }, ok: (v) => num(v[3]) >= 95 }],
  5: [{ state: { k: 30 }, ok: (v) => num(v[2]) >= 2 && num(v[2]) <= 3 }, { state: { dist: 1, k: 30 }, ok: (v) => num(v[2]) < 3 }],
  6: [{ state: { mu: 0.08 }, ok: (v) => num(v[4]) < 1 }, { state: { sigma: 0.3 }, ok: (v) => num(v[4]) > 20 }],
  7: [{ state: { sigma: 0.24 }, ok: (v) => num(v[0]) >= 40 }, { state: { sigma: 0.05 }, ok: (v) => num(v[0]) === num(v[1]) }],
  8: [{ state: { rf: 0.04 }, ok: (v) => num(v[1]) < Math.max(num(v[0]), num(v[2])) }, { state: { w: 1.5 }, ok: (v) => num(v[3], 1) === 6 }],
  9: [{ state: { mu: 0.045 }, ok: (v) => num(v[0]) === 0 }, { state: { sigma: 0.41 }, ok: (v) => num(v[3]) > 50 }],
  10: [{ state: { rho: -1 }, ok: (v) => num(v[1]) === 0 }, { state: { rho: -0.5 }, ok: (v) => num(v[2]) === 50 }],
  11: [{ state: { nmax: 40 }, ok: (v) => num(v[1]) - num(v[2]) <= 0.5 + 1e-9 }, { state: { rho: 0.05, sigma: 0.2 }, ok: (v) => num(v[2]) < 5 }],
  12: [{ state: { rf: 0.04 }, ok: (v) => num(v[1], 1) > 10 }, { state: { riskfree: 0 }, ok: (v) => v.length === 1 }],
  13: [{ state: { b1: 1 }, ok: (v) => num(v[0]) === 8 }, { state: { b3: 0 }, ok: (v) => num(v[2]) === 2.5 }],
  14: [{ state: { f: 0.12 }, ok: (v) => num(v[2]) < 100 }, { state: { p: 0.6, b: 1, f: 0.2 }, ok: (v) => num(v[0]) === 20 }],
  15: [{ state: { nu: 15 }, ok: (v) => num(v[3]) < 4 }, { state: { nu: 3 }, ok: (v) => num(v[1]) > 90 }],
  16: [{ state: { conf: 0.975 }, ok: (v) => num(v[3]) > 0.05 }, { state: { model: 1 }, ok: (v) => num(v[1]) > 10000 }],
};

const retos: Record<string, string[]> = YAML.parse(fs.readFileSync('content/es/retos.yaml', 'utf8'));

describe('retos de los gráficos', () => {
  it('cada capítulo con retos tiene una solución para cada uno', () => {
    for (const [ch, list] of Object.entries(retos)) expect(SOL[Number(ch)]?.length, `capítulo ${ch}`).toBe(list.length);
  });
  for (const [ch, sols] of Object.entries(SOL)) {
    it(`capítulo ${ch}: los retos se pueden conseguir`, async () => {
      const def = await loadChart(CHART_BY_CHAPTER[Number(ch)]);
      sols.forEach((sol, i) => {
        const s = { ...def.defaults, ...sol.state };
        for (const sl of def.sliders) if (sl.key in sol.state) expect(s[sl.key] >= sl.min && s[sl.key] <= sl.max, `${ch}.${i + 1}: ${sl.key} fuera de rango`).toBe(true);
        const values = def.stats(def.compute(s), s, ctx).map((x: any) => x.value as string);
        expect(sol.ok(values), `reto ${ch}.${i + 1}: ${values.join(' | ')}`).toBe(true);
      });
    });
  }
});
