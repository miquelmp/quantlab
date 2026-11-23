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
