/**
 * Formato numérico según el idioma (RNF-I18N-03): en español, coma decimal y punto de
 * miles también en números de cuatro cifras (1.000 €), como en el libro.
 * No depende de Intl para que el resultado sea idéntico en todos los navegadores.
 */
export interface NumFmt { decimal: string; group: string }

export const ES: NumFmt = { decimal: ',', group: '.' };

export function fmtNum(x: number, decimals = 0, f: NumFmt = ES): string {
  if (!Number.isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : '—';
  const neg = x < 0 || Object.is(x, -0);
  let s = Math.abs(x).toFixed(decimals);
  if (/^0(\.0+)?$/.test(s)) return s.replace('.', f.decimal); // sin «−0»
  let [int, frac] = s.split('.');
  int = int.replace(/\B(?=(\d{3})+(?!\d))/g, f.group);
  return (neg ? '−' : '') + int + (frac ? f.decimal + frac : '');
}

/** Tanto por uno → «12,5 %» (espacio fino inseparable, como en el libro). */
export function fmtPct(x: number, decimals = 1, f: NumFmt = ES): string {
  return fmtNum(x * 100, decimals, f) + (f.decimal === '.' ? '%' : ' %');   // en inglés, «12.5%»
}

/** Añade el símbolo del euro a un número ya formateado; unit: «k» o «M». */
export function withEur(num: string, f: NumFmt = ES, unit = ''): string {
  if (f.decimal !== '.') return `${num} ${unit}€`;
  return (num.startsWith('−') ? '−€' + num.slice(1) : '€' + num) + unit;
}

/** «1.000 €» en español; «€1,000» en inglés. */
export function fmtEur(x: number, decimals = 0, f: NumFmt = ES): string {
  return withEur(fmtNum(x, decimals, f), f);
}

/**
 * Lee un número escrito por el lector: admite coma o punto decimal, separador de miles,
 * signo menos tipográfico, «%» y palabras como «millones».
 * Devuelve { value, percent } o null si no se reconoce.
 */
/** decimal: separador decimal del idioma de la página (en inglés, «40,000» son miles y «0.12», decimal). */
export function parseUserNumber(raw: string, decimal = ','): { value: number; percent: boolean } | null {
  let s = raw.trim().toLowerCase().replace(/[−–—]/g, '-').replace(/\s+/g, ' ');
  if (!s) return null;
  let mult = 1;
  const percent = s.includes('%');
  s = s.replace(/%/g, '').replace(/[€$]/g, '');
  const words: [RegExp, number][] = [
    [/\b(millones|millón|millon|millions?|mill\.?|m)$/, 1e6],
    [/\b(mil|thousands?|k)$/, 1e3],
  ];
  s = s.trim();
  for (const [re, m] of words) {
    if (re.test(s)) { mult = m; s = s.replace(re, '').trim(); break; }
  }
  s = s.replace(/\s/g, '');
  if (!/^[-+]?[\d.,]+(e[-+]?\d+)?$/.test(s)) return null;
  let exp = '';
  const em = s.match(/e[-+]?\d+$/);
  if (em) { exp = em[0]; s = s.slice(0, -exp.length); }
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // El separador que aparece el último es el decimal.
    const dec = lastComma > lastDot ? ',' : '.';
    const grp = dec === ',' ? '.' : ',';
    s = s.split(grp).join('').replace(dec, '.');
  } else if (lastComma >= 0 && decimal === '.') {
    s = s.split(',').join('');                          // 40,000
  } else if (lastComma >= 0) {
    const parts = s.split(',');
    if (parts.length > 2) s = parts.join('');           // 1,000,000
    else s = s.replace(',', '.');                       // 0,12
  } else if (lastDot >= 0 && decimal !== '.') {
    const parts = s.split('.');
    // «40.000» o «2.700.000» = miles; «0.12» o «2.7» = decimal.
    const thousands = parts.length > 2 || (/^[-+]?\d{1,3}$/.test(parts[0]) && parts[1].length === 3 && !/^[-+]?0$/.test(parts[0]));
    if (thousands && parts.slice(1).every((p) => p.length === 3)) s = parts.join('');
  }
  const v = Number(s + exp) * mult;
  if (!Number.isFinite(v)) return null;
  return { value: v, percent };
}

/**
 * Comprueba una respuesta. Para tipo «porcentaje» acepta 12 %, 0,12 y 12 (si 12 no
 * encaja como tanto por uno, se prueba como porcentaje).
 */
export function checkAnswer(raw: string, expected: number, tipo: 'porcentaje' | 'numero', tol?: number, decimal = ','): boolean | null {
  const p = parseUserNumber(raw, decimal);
  if (!p) return null;
  const t = tol ?? (tipo === 'porcentaje' ? 0.0005 : Math.abs(expected) * 0.005);
  const ok = (v: number) => Math.abs(v - expected) <= t + 1e-12;
  if (p.percent) return ok(p.value / 100);
  if (ok(p.value)) return true;
  if (tipo === 'porcentaje') return ok(p.value / 100);
  return false;
}
