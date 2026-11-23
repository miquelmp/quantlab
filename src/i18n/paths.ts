/**
 * Equivalencia de páginas entre idiomas (hreflang y selector de idioma): los capítulos, temas y
 * términos del glosario tienen slugs distintos en cada idioma. Los capítulos se emparejan por
 * número, los temas por letra y los términos por su posición en la tabla del glosario de libro.md
 * (las tablas de todos los idiomas siguen el mismo orden). El resto de páginas comparte ruta.
 */
import { loadBook } from '../lib/book';

export function pathIn(path: string, from: string, to: string): string {
  if (from === to) return path;
  if (path === '404/') return '';
  const a = loadBook(from);
  const b = loadBook(to);
  let m = path.match(/^capitulos\/([^/]+)\/$/);
  if (m) {
    const n = a.chapters.find((c) => c.slug === m![1])?.number;
    const c = b.chapters.find((x) => x.number === n);
    return c ? `capitulos/${c.slug}/` : 'indice/';
  }
  m = path.match(/^temas\/([^/]+)\/$/);
  if (m) {
    const letter = a.topics.find((x) => x.slug === m![1])?.letter;
    const tp = b.topics.find((x) => x.letter === letter);
    return tp ? `temas/${tp.slug}/` : 'indice/';
  }
  m = path.match(/^glosario\/([^/]+)\/$/);
  if (m) {
    const i = a.glossary.findIndex((g) => g.slug === m![1]);
    const g = i >= 0 ? b.glossary[i] : undefined;
    return g ? `glosario/${g.slug}/` : 'glosario/';
  }
  return path;
}
