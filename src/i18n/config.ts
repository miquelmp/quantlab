/**
 * Idiomas de la web. Para añadir uno nuevo:
 *  1. Añadir su entrada aquí.
 *  2. Crear src/i18n/<código>.json con los textos de la interfaz (copiar es.json).
 *  3. Crear content/<código>/ con libro.md, capitulos.yaml y respuestas.yaml.
 * Las páginas, el sitemap y las etiquetas hreflang se generan solos.
 */
export interface LangConfig {
  code: string;          // prefijo de la URL: /es/...
  htmlLang: string;      // atributo lang de <html>
  locale: string;        // para Intl (fechas)
  decimal: string;       // separador decimal
  group: string;         // separador de miles
  name: string;          // nombre del idioma en su propio idioma
}

export const LANGS: LangConfig[] = [
  { code: 'es', htmlLang: 'es', locale: 'es-ES', decimal: ',', group: '.', name: 'Español' },
];

export const DEFAULT_LANG = 'es';

export function getLang(code: string): LangConfig {
  const l = LANGS.find((x) => x.code === code);
  if (!l) throw new Error(`Idioma no configurado: ${code}`);
  return l;
}
