/** Datos estructurados (schema.org) comunes: el autor y sus otras obras. */
import { SITE } from '../config';

/** Identificador estable del autor, para que todas las páginas hablen de la misma persona. */
export const AUTHOR_ID = `${SITE.url}${SITE.base}/#autor`;

/** Su otro libro en este idioma (es el mismo libro traducido: cada versión de la web enlaza el suyo). */
export function authorBook(lang: string) {
  return SITE.authorBooks.find((b) => b.lang === lang) ?? SITE.authorBooks[0];
}

/** El autor como `Person`, con sus perfiles y su otro libro (en el idioma de la página). */
export function authorLd(lang: string): Record<string, unknown> {
  const b = authorBook(lang);
  return {
    '@type': 'Person',
    '@id': AUTHOR_ID,
    name: SITE.author,
    url: SITE.authorProfiles[0],
    sameAs: SITE.authorProfiles,
    workExample: { '@type': 'Book', name: b.name, inLanguage: b.lang, url: b.url },
  };
}

/** Referencia corta al autor (cuando la ficha completa ya está en la portada). */
export const authorRef = { '@type': 'Person', '@id': AUTHOR_ID, name: SITE.author };
