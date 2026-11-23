/**
 * Utilidades de la bibliografía: da a cada referencia un ancla estable (primer apellido + año,
 * con a/b si se repite) y marca la ★ de los manuales recomendados con un texto accesible.
 */
import type { Node, List, ListItem, Paragraph, Text } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { slugify } from './book';

export function refId(textContent: string): string {
  const t = textContent.replace(/^★\s*/, '');
  const inst = t.match(/^([^,(]+?)\s*\((\d{4}[a-z]?)\)/);           // «FINRA (2009)», «Basel Committee… (1996a)»
  if (inst) return `${slugify(inst[1]).split('-').slice(0, 3).join('-')}-${inst[2]}`;
  const person = t.match(/^([^,(]+?),.*?\((\d{4})/);                 // «Bailey, D. H. y … (2014)»
  if (person) return `${slugify(person[1])}-${person[2]}`;
  return slugify(t.split(/[,(]/)[0]).split('-').slice(0, 5).join('-'); // normas: «Directiva 2009/65/CE…»
}

export function annotateReferences(nodes: Node[], recommendedLabel: string): { nodes: Node[]; count: number; starred: number } {
  const used = new Map<string, number>();
  let count = 0;
  let starred = 0;
  const out = structuredClone(nodes) as Node[];
  for (const n of out) {
    if (n.type !== 'list') continue;
    for (const li of (n as List).children as ListItem[]) {
      const txt = toString(li).trim();
      count++;
      let id = refId(txt);
      const k = (used.get(id) ?? 0) + 1;
      used.set(id, k);
      if (k > 1) id = `${id}-${k}`;
      li.data = { ...(li.data ?? {}), hProperties: { id } };
      const p = li.children[0] as Paragraph | undefined;
      const first = p?.children[0] as Text | undefined;
      if (first?.type === 'text' && first.value.startsWith('★')) {
        starred++;
        first.value = first.value.replace(/^★\s*/, '');
        p!.children.unshift({ type: 'html', value: `<span class="star" role="img" aria-label="${recommendedLabel}">★</span> ` } as any);
      }
    }
  }
  return { nodes: out, count, starred };
}

/**
 * Citas del texto → referencia de la bibliografía (RF-BIB-02). Se busca por primer apellido y año;
 * si hay varias obras así («Black, 1972» y «Black, Jensen y Scholes, 1972»), decide el resto de
 * autores. Si aun así no hay una sola candidata, la cita se queda sin enlace.
 */
interface Entry { id: string; year: string; authors: string[] }
const INITIALS = /^(?:[A-ZÁÉÍÓÚ][a-z]?\.[\s-]*)+$/;
const entriesOf = new WeakMap<object, Entry[]>();

export function bibEntries(book: { extras: { key: string; nodes?: Node[] }[] }): Entry[] {
  let list = entriesOf.get(book);
  if (list) return list;
  list = [];
  const used = new Map<string, number>();
  const extra = book.extras.find((e) => e.key === 'bibliografia');
  for (const n of extra?.nodes ?? []) {
    if (n.type !== 'list') continue;
    for (const li of (n as List).children as ListItem[]) {
      const txt = toString(li).trim().replace(/^★\s*/, '');
      let id = refId(txt);                       // mismas anclas que annotateReferences
      const k = (used.get(id) ?? 0) + 1;
      used.set(id, k);
      if (k > 1) id = `${id}-${k}`;
      const m = txt.match(/^(.*?)\s*\((\d{4}[a-z]?)\)/);
      if (!m) continue;
      const authors = m[1].replace(/\(eds?\.\)/g, '').split(/,\s*|\s+y\s+|\s*&\s*/)
        .map((a) => a.trim()).filter((a) => a && !INITIALS.test(a)).map(slugify);
      list.push({ id, year: m[2], authors });
    }
  }
  entriesOf.set(book, list);
  return list;
}

const UP = 'A-ZÁÉÍÓÚÑ';
const NAME_FIRST = String.raw`[${UP}][\p{L}'’-]+(?:\s+(?:de|del|van|von|der|la|du)\s+[${UP}][\p{L}'’-]+)*`;
const NAME_ANY = String.raw`(?:(?:de|del|van|von|der|du)\s+)*${NAME_FIRST}`;
const SEP = String.raw`\s*(?:,|\by\b|&)\s*`;
const CHAIN_AT_END = new RegExp(String.raw`(${NAME_FIRST}(?:${SEP}${NAME_ANY})*)(\s+et\s+al\.)?\s*,?\s*\(?\s*$`, 'u');

/** Autores de la cita que termina justo antes del año: «… de Harvey, Liu y Zhu (» → Harvey, Liu, Zhu. */
export function citedAuthors(before: string): { authors: string[]; etAl: boolean } | null {
  const m = before.slice(-160).match(CHAIN_AT_END);
  if (!m) return null;
  return { authors: m[1].split(new RegExp(SEP, 'u')).map((a) => a.trim()).filter(Boolean), etAl: !!m[2] };
}

/** Ancla de la bibliografía para el año citado, o null si no se reconoce la cita sin ambigüedad. */
export function citationId(book: Parameters<typeof bibEntries>[0], before: string, year: string): string | null {
  const c = citedAuthors(before);
  if (!c) return null;
  const names = c.authors.map(slugify);
  let cands = bibEntries(book).filter((e) => e.year === year && e.authors[0] === names[0]);
  if (cands.length > 1) {
    cands = c.etAl
      ? cands.filter((e) => e.authors.length >= 3)
      : cands.filter((e) => e.authors.length === names.length && names.every((n, i) => e.authors[i] === n));
  }
  return cands.length === 1 ? cands[0].id : null;
}
