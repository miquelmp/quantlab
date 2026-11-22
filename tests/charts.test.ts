/**
 * RF-SIM-06 / RNF-MAN-02: los gráficos reproducen las cifras del libro en la configuración
 * del ejemplo resuelto (dentro del error de Monte Carlo cuando hay simulación).
 */
import { describe, it, expect } from 'vitest';
import { recoveryGain, logReturn } from '../src/charts/ch01-perdidas';
import { computeMC } from '../src/charts/ch06-montecarlo';
import { computeKelly, growth, kellyFraction } from '../src/charts/ch14-kelly';
import { chart01 } from '../src/charts/ch01-perdidas';
import { chart03, computeDice, expectedGain, probAhead, PLAYERS } from '../src/charts/ch03-dados';
import { chart04, computeWalk, probAbove, stepMean } from '../src/charts/ch04-paseo';
import { chart05, computeBell, sumPmf, DISTS } from '../src/charts/ch05-campana';
import { normCdf } from '../src/charts/rng';
import { chart02, futureValue, presentValue, simpleValue, annuityPayment, discountFactor } from '../src/charts/ch02-capitalizar';
import { chart06 } from '../src/charts/ch06-montecarlo';
import { chart14 } from '../src/charts/ch14-kelly';
import { chart07, computeVol, probLoss, sampleVol } from '../src/charts/ch07-volatilidad';
import { chart08, computeSharpe, sharpe, combo } from '../src/charts/ch08-sharpe';
import { chart09, computeDrag, growthRate, zeroGrowthVol } from '../src/charts/ch09-lastre';
import { chart10, computeCorr, portVol, correlation } from '../src/charts/ch10-correlacion';
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

describe('cap. 3 · el juego de los dos dados', () => {
  it('cifras del ejemplo resuelto', () => {
    expect(expectedGain(4)).toBeCloseTo(-1 / 6, 10);
    expect(expectedGain(5)).toBeCloseTo(0, 10);
    expect(probAhead(10, 4)).toBeCloseTo(0.22, 2);
    expect(probAhead(100, 4)).toBeCloseTo(0.15, 2);
    expect(probAhead(1000, 4)).toBeCloseTo(0.0025, 3);
  });
  it('la media simulada se acerca al valor esperado', () => {
    const d = computeDice({ n: 5000, prize: 4, seed: 3 });
    expect(Math.abs(d.mean0 - d.E)).toBeLessThan(3 * d.sd / Math.sqrt(5000));
    expect(d.ahead).toBeLessThanOrEqual(3 / PLAYERS);
  });
});

describe('cap. 4 · el abanico del azar', () => {
  it('cifras del ejemplo resuelto y del ejercicio 4.1', () => {
    expect(probAbove(5, 0.6)).toBeCloseTo(0.6826, 4);
    expect(20 + 5 * stepMean(0.6)).toBeCloseTo(21, 10);
    expect(0.012 * Math.sqrt(252)).toBeCloseTo(0.1905, 4);
  });
  it('la dispersión simulada sigue la raíz del tiempo', () => {
    const d = computeWalk({ p: 0.5, n: 256, m: 500, seed: 11 });
    expect(Math.abs(d.finalSd / 16 - 1)).toBeLessThan(0.1);
    const i16 = d.sdN.indexOf(16);
    if (i16 >= 0) expect(Math.abs(d.sdObs[i16] / 4 - 1)).toBeLessThan(0.15);
  });
});

describe('cap. 5 · nace una campana', () => {
  it('cifras del ejemplo resuelto y de los ejercicios', () => {
    expect(normCdf((-5 - 0.7) / 4.5)).toBeCloseTo(0.103, 3);
    expect(normCdf(-0.4)).toBeCloseTo(0.345, 3);
    const pmf = sumPmf(12, DISTS[0]);
    let p50 = 0;
    for (const [v, p] of pmf) if (v >= 50) p50 += p;
    expect(p50).toBeCloseTo(0.104, 3);
    expect(1 - normCdf((49.5 - 42) / Math.sqrt(35))).toBeCloseTo(0.102, 3);
  });
  it('el tablero de Galton reparte las bolas como una binomial', () => {
    const d = computeBell({ rows: 10, k: 2, dist: 0, seed: 5 });
    const mean = d.bin.reduce((a, b) => a + b, 0) / d.bin.length;
    expect(Math.abs(mean - 5)).toBeLessThan(3 * Math.sqrt(2.5 / d.bin.length));
    expect(d.mu).toBe(7);
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

describe('cap. 7 · mismo destino, distinto viaje', () => {
  it('cifras del libro', () => {
    expect(probLoss(0.05)).toBeCloseTo(0.115, 3);
    expect(probLoss(0.25)).toBeCloseTo(0.405, 3);
    expect(sampleVol([0.005, -0.015, 0.02, -0.005, 0.01, -0.015])).toBeCloseTo(0.01414, 4);
    expect(sampleVol([0.012, -0.004, 0.008, -0.02, 0.004]) * Math.sqrt(252)).toBeCloseTo(0.201, 3);
  });
  it('la volatilidad observada se acerca a la elegida', () => {
    const d = computeVol({ sigma: 0.25, seed: 7 });
    expect(Math.abs(d.realized / 0.25 - 1)).toBeLessThan(0.08);
  });
});

describe('cap. 8 · la recta más empinada', () => {
  it('cifras del ejemplo resuelto', () => {
    const d = computeSharpe(chart08.defaults);
    expect(d.funds.map((f) => +f.sr.toFixed(3))).toEqual([0.417, 0.625, 0.364]);
    expect(d.best).toBe(1);
    expect(d.pt.mu).toBeCloseTo(0.095, 10);
    expect(d.pt.sigma).toBeCloseTo(0.12, 10);
    expect(sharpe(0.05, 0.05, 0.025)).toBeCloseTo(0.5, 10);
    const c = combo(0.05, 0.05, 0.025, 2.8);
    expect(c.mu).toBeCloseTo(0.095, 10);
    expect(sharpe(c.mu, c.sigma, 0.025)).toBeCloseTo(0.5, 10);
  });
});

describe('cap. 9 · la media engaña', () => {
  it('cifras del libro', () => {
    expect(growthRate(0.025, 0.225)).toBeCloseTo(0, 3);
    expect(growthRate(0.07, 0.15)).toBeCloseTo(0.05875, 6);
    expect(growthRate(0.07, 0.3)).toBeCloseTo(0.025, 6);
    expect(growthRate(0.06, 0.18)).toBeCloseTo(0.0438, 4);
    expect(growthRate(0.18, 0.54)).toBeCloseTo(0.0342, 4);
    expect(zeroGrowthVol(0.08)).toBeCloseTo(0.4, 6);
  });
  it('la mediana simulada sigue a g y la media a μ', () => {
    const d = computeDrag({ mu: 0.08, sigma: 0.3, seed: 9 });
    const med = d.median[d.median.length - 1];
    expect(Math.abs(Math.log(med / (100 * Math.exp(growthRate(0.08, 0.3) * 20))))).toBeLessThan(0.3);
    expect(d.median[d.median.length - 1]).toBeLessThan(d.mean[d.mean.length - 1]);
  });
});

describe('cap. 10 · moverse juntos', () => {
  it('cifras del libro', () => {
    expect(portVol(1)).toBeCloseTo(0.2, 6);
    expect(portVol(0.5)).toBeCloseTo(0.1732, 4);
    expect(portVol(0)).toBeCloseTo(0.1414, 4);
    expect(portVol(-0.5)).toBeCloseTo(0.1, 6);
    expect(portVol(-1)).toBeCloseTo(0, 6);
    expect(correlation([2, -1, 3, 0, 1], [1, -2, 2, 1, 3])).toBeCloseTo(0.676, 3);
    expect(correlation([1, 3, -1, 1], [2, 0, 4, 2])).toBeCloseTo(-1, 10);
  });
  it('la nube simulada respeta la correlación y la parábola da casi cero', () => {
    expect(Math.abs(computeCorr({ rho: 0.5, mode: 0, seed: 10 }).r - 0.5)).toBeLessThan(0.1);
    expect(Math.abs(computeCorr({ rho: 0.5, mode: 1, seed: 10 }).r)).toBeLessThan(0.15);
  });
});

describe('los gráficos se dibujan sin errores con cualquier configuración extrema', () => {
  const ctx = { tr: (k: string) => k, fmt: ES };
  for (const def of [chart01, chart02, chart03, chart04, chart05, chart06, chart14, chart07, chart08, chart09, chart10] as any[]) {
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
