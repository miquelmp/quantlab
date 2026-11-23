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
import { chart11, equalWeightVol, floorVol, twoAssetVol, effectiveN } from '../src/charts/ch11-diversificacion';
import { chart12, computeFrontier, minVarWeight2, portStats, covMatrix } from '../src/charts/ch12-frontera';
import { chart13, computeCapm, betaFrom, capm, totalVol } from '../src/charts/ch13-capm';
import { chart15, computeTails, tTail, tailNormal, tailT } from '../src/charts/ch15-colas';
import { chartC, blackScholes, binomialCall } from '../src/charts/temaC-blackscholes';
import { chart16, computeVar, normalVaR, normalES, tVaR, tES, binomTail, kupiec } from '../src/charts/ch16-var';
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

describe('cap. 11 · hasta dónde llega la diversificación', () => {
  it('cifras del libro', () => {
    expect(twoAssetVol(0.6, 0.18, 0.06, 0.1) ** 2).toBeCloseTo(0.012758, 6);
    expect(twoAssetVol(0.6, 0.18, 0.06, 0.1)).toBeCloseTo(0.113, 3);
    expect([1, 5, 20, 50].map((n) => +equalWeightVol(n, 0.25, 0.2).toFixed(3))).toEqual([0.25, 0.15, 0.122, 0.116]);
    expect(floorVol(0.25, 0.2)).toBeCloseTo(0.112, 3);
    expect(equalWeightVol(9, 0.3, 0)).toBeCloseTo(0.1, 10);
    expect(equalWeightVol(10, 0.2, 0.4)).toBeCloseTo(0.136, 3);
    expect(effectiveN([0.5, 0.2, 0.1, 0.1, 0.1])).toBeCloseTo(3.125, 10);
  });
});

describe('cap. 12 · la nube y su borde', () => {
  it('cifras del ejemplo resuelto y de los ejercicios', () => {
    const w = minVarWeight2(0.06, 0.2, 0.2);
    expect(w).toBeCloseTo(0.969, 3);
    const s2 = { ...chart12.defaults, r13: 0, r23: 0 };
    const p = portStats([w, 1 - w, 0], [0.04, 0.09, 0], covMatrix(s2));
    expect(p.sigma).toBeCloseTo(0.0597, 4);
    expect(p.mu).toBeCloseTo(0.0415, 4);
    expect(minVarWeight2(0.12, 0.18, -1)).toBeCloseTo(0.6, 10);
    const h = portStats([0.5, 0.5, 0], [0.04, 0.09, 0], covMatrix(s2));
    expect(h.sigma).toBeCloseTo(0.11, 10);
    expect((h.mu - 0.02) / h.sigma).toBeCloseTo(0.409, 3);
  });
  it('la cartera de mínima varianza no tiene más riesgo que ninguna cartera aleatoria', () => {
    for (const shorts of [0, 1]) {
      const d = computeFrontier({ ...chart12.defaults, shorts });
      let min = Infinity;
      for (let i = 0; i < d.cloud.length; i += 2) min = Math.min(min, d.cloud[i]);
      expect(d.gmv.sigma).toBeLessThanOrEqual(min + 1e-4);
      expect(d.tangent).not.toBeNull();
    }
  });
});

describe('cap. 13 · lo que paga el mercado', () => {
  it('cifras del libro', () => {
    expect(betaFrom(0.6, 0.15)).toBeCloseTo(0.6, 10);
    expect(betaFrom(0.75, 0.3)).toBeCloseTo(1.5, 10);
    expect(capm(0.6, 0.025, 0.055)).toBeCloseTo(0.058, 10);
    expect(capm(1.5, 0.025, 0.055)).toBeCloseTo(0.1075, 10);
    expect(betaFrom(0.7, 0.24, 0.16)).toBeCloseTo(1.05, 10);
    expect(capm(0.8, 0.02, 0.05)).toBeCloseTo(0.06, 10);
    expect(0.09 - capm(1.2, 0.02, 0.06)).toBeCloseTo(-0.002, 10);
    expect(totalVol(0.6, 0.12)).toBeCloseTo(0.15, 10);
  });
  it('la regresión recupera la beta', () => {
    const d = computeCapm(chart13.defaults);
    expect(Math.abs(d.est[1] - 1.5)).toBeLessThan(0.25);
  });
});

describe('cap. 15 · lo que la campana no ve', () => {
  it('cifras del libro', () => {
    expect(tailNormal(0.06) / 2).toBeCloseTo(9.9e-10, 11);
    expect(tTail(6 * Math.SQRT2, 4)).toBeCloseTo(5.3e-4, 5);
    expect(tailT(0.04, 4)).toBeCloseTo(0.0048, 4);
    expect(252 / (tailNormal(0.04) / 2) / 252 / 252).toBeGreaterThan(0);
    expect(1 / (252 * tailNormal(0.04) / 2)).toBeCloseTo(125, -1);
    expect(tTail(0, 7)).toBeCloseTo(0.5, 10);
  });
  it('con 4 grados de libertad salen unos 60 días más allá de ±4 % en 50 años', () => {
    const d = computeTails({ nu: 4, seed: 15 });
    expect(d.countT).toBeGreaterThan(35);
    expect(d.countT).toBeLessThan(90);
    expect(d.countN).toBeLessThan(4);
    expect(d.kurtT).toBeGreaterThan(d.kurtN);
  });
});

describe('cap. 16 · el umbral y lo que hay detrás', () => {
  it('cifras del libro', () => {
    expect(normalVaR(0.95) * 3000).toBeCloseTo(4935, -1);
    expect(normalVaR(0.99) * 3000).toBeCloseTo(6979, -1);
    expect(normalES(0.975) * 3000).toBeCloseTo(7013, -1);
    expect(normalES(0.99) * 3000).toBeCloseTo(7996, -1);
    expect(tVaR(0.99, 4)).toBeCloseTo(2.65, 2);
    expect(tES(0.99, 4)).toBeCloseTo(3.69, 2);
    expect(normalVaR(0.99) * 0.008 * 2e6).toBeCloseTo(37222, -1);
    expect(normalVaR(0.99) * 0.008 * 2e6 * Math.sqrt(10)).toBeCloseTo(117705, -2);
    expect(normalES(0.99) * 0.008 * 2e6).toBeCloseTo(42643, -1);
    expect(binomTail(7, 250, 0.01)).toBeCloseTo(0.0137, 3);
  });
  it('las colas gruesas dan más excepciones de las esperadas con el VaR normal al 99 %', () => {
    const d = computeVar({ conf: 0.99, model: 0, nu: 4, seed: 16 });
    expect(d.expected).toBeCloseTo(25.2, 5);
    expect(d.exc).toBeGreaterThan(15);
    expect(Number.isFinite(d.kup.pValue)).toBe(true);
    expect(kupiec(25, 2520, 0.01).pValue).toBeGreaterThan(0.9);
  });
});

describe('los gráficos se dibujan sin errores con cualquier configuración extrema', () => {
  const ctx = { tr: (k: string) => k, fmt: ES };
  for (const def of [chart01, chart02, chart03, chart04, chart05, chart06, chart14, chart07, chart08, chart09, chart10, chart11, chart12, chart13, chart15, chart16] as any[]) {
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

describe('casos límite señalados en revisión', () => {
  it('cap. 12: con rentabilidades iguales y cortos, la frontera es horizontal y sin volatilidad cero falsa', () => {
    const d = computeFrontier({ ...chart12.defaults, shorts: 1, m1: 0.04, m2: 0.04, m3: 0.04 });
    expect(d.frontier.length).toBeGreaterThan(1);
    for (const p of d.frontier) { expect(p.mu).toBeCloseTo(0.04, 10); expect(p.sigma).toBeGreaterThanOrEqual(d.gmv.sigma - 1e-12); }
  });
});

describe('cap. 16 · ejes', () => {
  it('con t de 3 g. l. al 99,9 % el ES sigue dentro del gráfico', () => {
    const st = { conf: 0.999, model: 1, nu: 3, seed: 16 };
    const d = computeVar(st);
    const svg = chart16.panels[0].render(d, st, 400, { tr: (k: string) => k, fmt: { decimal: ',', group: '.' } } as never);
    const xs = [...svg.matchAll(/<line class="neg" x1="([-\d.]+)"/g)].map((m) => Number(m[1]));
    expect(xs.length).toBe(2);
    for (const x of xs) { expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(400); }
    expect(svg).toContain('neg-zone');
  });
});


describe('tema C · Black-Scholes y árbol binomial', () => {
  it('reproduce el precio del capítulo 6 (S₀ = K = 100, r = 3 %, σ = 20 %, T = 1: 9,41)', () => {
    const { call, put } = blackScholes(100, 100, 0.2, 1, 0.03);
    expect(call).toBeCloseTo(9.41, 2);
    // Paridad put-call del tema C: C − P = S₀ − K·e^{−rT}
    expect(call - put).toBeCloseTo(100 - 100 * Math.exp(-0.03), 8);
  });
  it('el árbol binomial converge a Black-Scholes', () => {
    const { call } = blackScholes(100, 100, 0.2, 1, 0.03);
    expect(Math.abs(binomialCall(100, 100, 0.2, 1, 0.03, 200) - call)).toBeLessThan(0.02);
    expect(Math.abs(binomialCall(100, 100, 0.2, 1, 0.03, 10) - call)).toBeLessThan(0.25);
    expect(binomialCall(100, 100, 0.05, 3, 0.1, 1)).toBeNaN();   // q > 1: árbol no válido
  });
  it('dibuja los dos paneles en todo el rango de los mandos', () => {
    const ctx = { tr: (k: string) => k, fmt: { decimal: ',', group: '.' } } as never;
    for (const st of [chartC.defaults, { S: 50, K: 150, sigma: 0.05, T: 0.1, r: 0, N: 1 }, { S: 150, K: 50, sigma: 0.6, T: 3, r: 0.1, N: 200 }]) {
      const d = chartC.compute(st);
      for (const p of chartC.panels) {
        const svg = p.render(d, st, 400, ctx);
        expect(svg).not.toMatch(/NaN|Infinity/);
      }
      expect(chartC.table(d, st, ctx).rows.length).toBeGreaterThan(0);
    }
  });
});

describe('tema C · lo que dice «Lo que debes observar»', () => {
  it('la compra vale más que su pago inmediato y crece con el plazo; la venta muy dentro del dinero puede valer menos', () => {
    for (const S of [80, 100, 120, 150]) for (const T of [0.1, 1, 3]) {
      const c = blackScholes(S, 100, 0.2, T, 0.03).call;
      expect(c).toBeGreaterThan(Math.max(0, S - 100));
      expect(blackScholes(S, 100, 0.2, T + 0.5, 0.03).call).toBeGreaterThan(c);
    }
    expect(blackScholes(50, 100, 0.2, 1, 0.03).put).toBeLessThan(50);
  });
});
