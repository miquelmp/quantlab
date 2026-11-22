/**
 * Generador pseudoaleatorio con semilla (xoshiro128**), idéntico en el navegador y en la
 * compilación: con la misma semilla y los mismos parámetros, el gráfico es idéntico (RF-SIM-02).
 */
export class Rng {
  private s0: number; private s1: number; private s2: number; private s3: number;
  private spare: number | null = null;

  constructor(seed: number) {
    // splitmix32 para repartir la semilla en los cuatro registros de estado.
    let x = (seed >>> 0) || 0x9e3779b9;
    const next = () => {
      x = (x + 0x9e3779b9) >>> 0;
      let z = x;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
      return (z ^ (z >>> 16)) >>> 0;
    };
    this.s0 = next(); this.s1 = next(); this.s2 = next(); this.s3 = next();
  }

  /** Entero sin signo de 32 bits. */
  nextU32(): number {
    const r = Math.imul(rotl(Math.imul(this.s1, 5) >>> 0, 7), 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;
    this.s2 ^= this.s0; this.s3 ^= this.s1; this.s1 ^= this.s2; this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = rotl(this.s3, 11);
    this.s0 >>>= 0; this.s1 >>>= 0; this.s2 >>>= 0; this.s3 >>>= 0;
    return r;
  }

  /** Uniforme en [0, 1). */
  uniform(): number {
    return this.nextU32() / 4294967296;
  }

  /** Normal estándar (Box–Muller). */
  normal(): number {
    if (this.spare !== null) { const s = this.spare; this.spare = null; return s; }
    let u = 0;
    while (u === 0) u = this.uniform();
    const v = this.uniform();
    const r = Math.sqrt(-2 * Math.log(u));
    this.spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  }
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/** Función de distribución de la normal estándar (aproximación de Abramowitz-Stegun 7.1.26 mejorada). */
export function normCdf(x: number): number {
  // erf con precisión ~1e-7 (W. J. Cody, aproximación racional simplificada)
  const t = 1 / (1 + 0.5 * Math.abs(x) / Math.SQRT2);
  const y = t * Math.exp(-((x / Math.SQRT2) ** 2) - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  const erf = 1 - y;
  return x >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/** Cuantil de la normal estándar (algoritmo de Acklam). */
export function normInv(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) return -normInv(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Percentil q (0–1) de un vector ya ordenado, con interpolación lineal (como NumPy). */
export function quantileSorted(sorted: ArrayLike<number>, q: number): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  const pos = q * (n - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(n - 1, lo + 1);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Semilla nueva «aleatoria» de 4 cifras, fácil de leer y de copiar. */
export function randomSeed(): number {
  return 1000 + Math.floor(Math.random() * 9000);
}
