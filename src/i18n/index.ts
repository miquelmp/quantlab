import es from './es.json';
import { getLang } from './config';

const DICTS: Record<string, Record<string, string>> = { es };

/** Devuelve el texto de interfaz `key` en el idioma `lang`, sustituyendo {variables}. */
export function t(lang: string, key: string, vars: Record<string, string | number> = {}): string {
  const dict = DICTS[lang] ?? DICTS.es;
  let s = dict[key] ?? DICTS.es[key];
  if (s === undefined) throw new Error(`Falta el texto de interfaz «${key}» (${lang})`);
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Subconjunto de textos con un prefijo, para pasarlos al JavaScript del navegador. */
export function tPrefix(lang: string, ...prefixes: string[]): Record<string, string> {
  const dict = DICTS[lang] ?? DICTS.es;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(dict)) if (prefixes.some((p) => k.startsWith(p))) out[k] = v;
  return out;
}

export function numberFormat(lang: string) {
  const l = getLang(lang);
  return { decimal: l.decimal, group: l.group };
}
