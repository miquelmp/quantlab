/**
 * RF-SIM-06 / RNF-MAN-02: los gráficos reproducen las cifras del libro en la configuración
 * del ejemplo resuelto (dentro del error de Monte Carlo cuando hay simulación).
 */
import { describe, it, expect } from 'vitest';
import { recoveryGain, logReturn } from '../src/charts/ch01-perdidas';
import { computeMC } from '../src/charts/ch06-montecarlo';
import { computeKelly, growth, kellyFraction } from '../src/charts/ch14-kelly';
import { chart01 } from '../src/charts/ch01-perdidas';
import { chart02, futureValue, presentValue, simpleValue, annuityPayment, discountFactor } from '../src/charts/ch02-capitalizar';
import { chart06 } from '../src/charts/ch06-montecarlo';
import { chart14 } from '../src/charts/ch14-kelly';
import { ES } from '../src/lib/format';

describe('cap. 1 · asimetría de las pérdidas', () => {
  it('cifras del ejemplo resuelto', () => {
    expect(recoveryGain(0.1)).toBeCloseTo(0.1111, 4);
    expect(recoveryGain(0.5)).toBeCloseTo(1, 10);
    expect(recoveryGain(0.9)).toBeCloseTo(9, 10);
    expect(recoveryGain(0.2)).toBeCloseTo(0.25, 10);
    expect(logReturn(50 / 40 - 1)).toBeCloseTo(0.2231, 4);
  });
});

describe('cap. 2 · capitalizar y descontar', () => {
  it('cifras del ejemplo resuelto y de los ejercicios', () => {
    expect(futureValue(10000, 0.04, 3)).toBeCloseTo(11248.64, 2);
    expect(presentValue([0, 0, 11000], 0.04)).toBeCloseTo(9778.96, 2);
    expect(presentValue([0, 0, 11000], 0.03)).toBeCloseTo(10066.56, 2);
    expect(futureValue(10000, 0.04, 3) - simpleValue(10000, 0.04, 3)).toBeCloseTo(48.64, 2);
    expect(futureValue(2500, 0.03, 5)).toBeCloseTo(2898.19, 2);
    expect(20000 * discountFactor(0.06, 4)).toBeCloseTo(15841.87, 2);
    expect(20000 * discountFactor(0.02, 4)).toBeCloseTo(18476.91, 2);
    expect(annuityPayment(15000, 0.05, 5)).toBeCloseTo(3464.62, 2);
  });
  it('con tipo negativo el factor de descuento supera la unidad', () => {
    expect(discountFactor(-0.01, 10)).toBeGreaterThan(1);
  });
});

describe('cap. 6 · Monte Carlo', () => {
  const d = computeMC({ mu: 0.05, sigma: 0.15, years: 20, M: 10000, seed: 2024 });
  it('valores teóricos del libro', () => {
    expect(Math.round(d.theory.median)).toBe(27183);
    expect(Math.round(d.theory.p10)).toBe(11506);
    expect(Math.round(d.theory.p90)).toBe(64218);
    expect(d.theory.probLoss).toBeCloseTo(0.068, 3);
    expect(Math.round(d.theory.mean)).toBe(34042);
  });
  it('la simulación coincide con la teoría dentro del error de Monte Carlo', () => {
    expect(Math.abs(d.q50[20] / d.theory.median - 1)).toBeLessThan(0.03);
    expect(Math.abs(d.probLoss - d.theory.probLoss)).toBeLessThan(3 * d.seLoss);
    expect(Math.abs(d.piHat - Math.PI)).toBeLessThan(3 * d.piSe);
  });
  it('misma semilla, mismo resultado (RF-SIM-02)', () => {
    const a = computeMC({ mu: 0.05, sigma: 0.15, years: 20, M: 2000, seed: 7 });
    const qa = a.q50.slice();
    computeMC({ mu: 0.05, sigma: 0.15, years: 20, M: 2000, seed: 8 });
    const b = computeMC({ mu: 0.05, sigma: 0.15, years: 20, M: 2000, seed: 7 });
    expect(b.q50).toEqual(qa);
  });
});

describe('cap. 14 · Kelly', () => {
  it('tabla del ejemplo resuelto (p = 0,53, b = 1)', () => {
    expect(kellyFraction(0.53)).toBeCloseTo(0.06, 10);
    expect(growth(0.03, 0.53)).toBeCloseTo(0.00135, 5);
    expect(growth(0.06, 0.53)).toBeCloseTo(0.0018, 5);
    expect(growth(0.12, 0.53)).toBeCloseTo(-0.00002, 5);
    expect(growth(0.15, 0.53)).toBeCloseTo(-0.00231, 5);
    expect(Math.exp(1000 * growth(0.06, 0.53))).toBeCloseTo(6.06, 1);
  });
  it('ejercicios 14.1 y 14.2', () => {
    expect(kellyFraction(0.58)).toBeCloseTo(0.16, 10);
    expect(kellyFraction(0.3, 3)).toBeCloseTo(0.0667, 4);
    expect(growth(0.0667, 0.3, 3)).toBeCloseTo(0.0064, 4);
  });
  it('la mediana simulada se acerca a la teórica y pasada Kelly empeora', () => {
    const k = computeKelly({ p: 0.53, b: 1, f: 0.06, seed: 2024 });
    const med = 10 ** k.l50[1000];
    expect(med / k.theoryMedian).toBeGreaterThan(0.6);
    expect(med / k.theoryMedian).toBeLessThan(1.6);
    const k2 = computeKelly({ p: 0.53, b: 1, f: 0.15, seed: 2024 });
    expect(k2.l50[1000]).toBeLessThan(k.l50[1000]);
    expect(k2.belowTen).toBeGreaterThan(k.belowTen);
  });
});

describe('los gráficos se dibujan sin errores con cualquier configuración extrema', () => {
  const ctx = { tr: (k: string) => k, fmt: ES };
  for (const def of [chart01, chart02, chart06, chart14] as any[]) {
    it(def.id, () => {
      const corners = [Object.fromEntries(def.sliders.map((s: any) => [s.key, s.min])), Object.fromEntries(def.sliders.map((s: any) => [s.key, s.max]))];
      for (const c of corners) {
        const st = { ...def.defaults, ...c, ...(def.id === 'montecarlo' ? { M: 500 } : {}) };
        const d = def.compute(st);
        for (const p of def.panels) {
          const svg = p.render(d, st, 400, ctx);
          expect(svg).toContain('</svg>');
          expect(svg).not.toMatch(/NaN|Infinity|undefined/);
        }
        expect(def.describe(d, st, ctx)).toBeTruthy();
      }
    });
  }
});
