/** /<idioma>/codigo/<página>.py y .ipynb: el código de cada capítulo, del tema E y del proyecto. */
import type { APIRoute } from 'astro';
import type { Code } from 'mdast';
import { visit } from 'unist-util-visit';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGS } from '../../../i18n/config';
import { t } from '../../../i18n';
import { loadBook, publishedChapters, type Node } from '../../../lib/book';
import { toPy, toIpynb, type CodeBundle } from '../../../lib/download';
import { SITE } from '../../../config';

function pyBlocks(nodes: Node[]): string[] {
  const out: string[] = [];
  for (const n of nodes) visit(n as any, 'code', (c: Code) => { if (c.lang === 'python') out.push(c.value); });
  return out;
}

const LICENSE = readFileSync(join(process.cwd(), 'LICENSE'), 'utf8');

export function codeBundles(lang: string): (CodeBundle & { name: string })[] {
  const book = loadBook(lang);
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
  const abs = (p: string) => new URL(base + p, SITE.url).toString();
  const list: (CodeBundle & { name: string })[] = [];
  for (const c of publishedChapters(book)) {
    if (c.python.length) list.push({ name: c.slug, title: `${t(lang, 'nav.chapter')} ${c.number} · ${c.title}`, url: abs(`${lang}/capitulos/${c.slug}/`), blocks: c.python, license: LICENSE, lang });
  }
  for (const tp of book.topics.filter((x) => x.published)) {
    const blocks = pyBlocks(tp.nodes);
    if (blocks.length) list.push({ name: tp.slug, title: `${t(lang, 'nav.topic')} ${tp.letter} · ${tp.title}`, url: abs(`${lang}/temas/${tp.slug}/`), blocks, license: LICENSE, lang });
  }
  const proj = book.extras.find((e) => e.key === 'proyecto');
  if (proj?.nodes) {
    const blocks = pyBlocks(proj.nodes);
    if (blocks.length) list.push({ name: 'proyecto', title: proj.title, url: abs(`${lang}/proyecto/`), blocks, license: LICENSE, lang });
  }
  return list;
}

export function getStaticPaths() {
  return LANGS.flatMap((l) => codeBundles(l.code).flatMap((b) => [
    { params: { lang: l.code, file: `${b.name}.py` }, props: { body: toPy(b), type: 'text/x-python; charset=utf-8' } },
    { params: { lang: l.code, file: `${b.name}.ipynb` }, props: { body: toIpynb(b), type: 'application/x-ipynb+json' } },
  ]));
}

export const GET: APIRoute = ({ props }) => new Response(props.body as string, { headers: { 'Content-Type': props.type as string } });
