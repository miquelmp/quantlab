/** Páginas de texto fijo (licencia, privacidad, aviso legal): content/<idioma>/paginas/*.md */
import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { toString as mdToString } from 'mdast-util-to-string';
import type { Root } from 'mdast';
import { contentDir, type Node } from './book';

export const STATIC_PAGES = ['licencia', 'privacidad', 'aviso-legal'];

export function loadPage(lang: string, name: string): { title: string; nodes: Node[]; summary: string } {
  const src = fs.readFileSync(path.join(contentDir(lang), 'paginas', `${name}.md`), 'utf8');
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(src) as Root;
  const h1 = tree.children.find((n) => n.type === 'heading' && n.depth === 1);
  const rest = tree.children.filter((n) => n !== h1);
  const firstP = rest.find((n) => n.type === 'paragraph');
  return { title: h1 ? mdToString(h1) : name, nodes: rest, summary: firstP ? mdToString(firstP).slice(0, 160) : '' };
}
