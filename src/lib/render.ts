/**
 * Convierte fragmentos del libro (árbol Markdown) en HTML:
 * fórmulas con KaTeX (HTML + MathML accesible), código Python ejecutable con resaltado,
 * títulos con enlace permanente, tablas desplazables y enlaces al glosario y a otros capítulos.
 */
import { unified } from 'unified';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { visit, SKIP } from 'unist-util-visit';
import { createHighlighter, type Highlighter } from 'shiki';
import type { Root, Node as MdNode, PhrasingContent, Code, Heading, Strong, Text, Link } from 'mdast';
import type { Root as HRoot, Element } from 'hast';
import { slugify, type Book, type Node } from './book';
import { t } from '../i18n';

export interface RenderCtx {
  lang: string;
  base: string;                    // p. ej. «/quantlab/»
  book: Book;
  chapter?: number;                // capítulo actual (para no enlazarse a sí mismo)
  topic?: string;                  // letra del tema actual
  headingShift?: number;           // h3 del libro → h2 de la página: shift = -1
  usedTerms?: Set<string>;         // términos del glosario ya enlazados en esta página
  usedIds?: Set<string>;
  pyCounter?: { n: number };
  linkTerms?: boolean;
}

let highlighter: Highlighter | null = null;

export async function initRenderer(): Promise<void> {
  if (!highlighter) {
    highlighter = await createHighlighter({ themes: ['github-light-high-contrast', 'github-dark-high-contrast'], langs: ['python'] });
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function url(ctx: { base: string }, p: string): string {
  const b = ctx.base.endsWith('/') ? ctx.base : ctx.base + '/';
  return b + p.replace(/^\//, '');
}

export function chapterUrl(ctx: RenderCtx, n: number): string | null {
  const ch = ctx.book.chapters.find((c) => c.number === n);
  if (!ch || !ch.published) return null;
  return url(ctx, `${ctx.lang}/capitulos/${ch.slug}/`);
}

export function topicUrl(ctx: RenderCtx, letter: string): string | null {
  const tp = ctx.book.topics.find((x) => x.letter === letter.toUpperCase());
  if (!tp || !tp.published) return null;
  return url(ctx, `${ctx.lang}/temas/${tp.slug}/`);
}

export function glossaryUrl(ctx: { base: string; lang: string }, slug: string): string {
  return url(ctx, `${ctx.lang}/glosario/${slug}/`);
}

/** Bloque de código Python ejecutable (mejora progresiva: sin JavaScript se ve el código). */
export function pythonBlock(code: string, ctx: RenderCtx): string {
  if (!highlighter) throw new Error('initRenderer() no se ha llamado');
  const counter = ctx.pyCounter ?? (ctx.pyCounter = { n: 0 });
  counter.n += 1;
  const id = `py-${ctx.chapter ?? 0}-${counter.n}`;
  const html = highlighter.codeToHtml(code, {
    lang: 'python',
    themes: { light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' },
    defaultColor: false,
  });
  const L = (k: string) => escapeHtml(t(ctx.lang, k));
  return `<div class="py" data-py id="${id}">
<div class="py-bar js-only" role="toolbar" aria-label="Python">
<span class="py-tag" aria-hidden="true">Python</span>
<button type="button" class="btn btn-primary" data-act="run">${L('py.run')}</button>
<button type="button" class="btn" data-act="stop" hidden>${L('py.stop')}</button>
<button type="button" class="btn" data-act="edit">${L('py.edit')}</button>
<button type="button" class="btn" data-act="restore" hidden>${L('py.restore')}</button>
<button type="button" class="btn" data-act="copy">${L('py.copy')}</button>
</div>
<div class="py-code">${html}</div>
<div class="py-status" role="status" aria-live="polite"></div>
<pre class="py-out" hidden tabindex="0" aria-label="${L('py.output')}"></pre>
</div>`;
}

const termIndex = new WeakMap<Book, Map<string, string>>();

function termsOf(book: Book): Map<string, string> {
  let m = termIndex.get(book);
  if (!m) {
    m = new Map();
    for (const g of book.glossary) {
      const key = g.term.toLowerCase();
      m.set(key, g.slug);
      const short = key.replace(/\s*\(.*\)\s*$/, '');
      if (short !== key && !m.has(short)) m.set(short, g.slug);
      const abbr = key.match(/\(([^)]+)\)/)?.[1];
      if (abbr && abbr.length <= 6 && !m.has(abbr)) m.set(abbr, g.slug);
    }
    termIndex.set(book, m);
  }
  return m;
}

/** Transformaciones sobre el árbol Markdown antes de pasarlo a HTML. */
function transformMd(root: Root, ctx: RenderCtx): void {
  const terms = termsOf(ctx.book);
  visit(root, (node: MdNode, index, parent: any) => {
    if (node.type === 'code' && (node as Code).lang === 'python' && parent && index !== undefined) {
      parent.children[index] = { type: 'html', value: pythonBlock((node as Code).value, ctx) };
      return SKIP;
    }
    // «$$…$$» en una sola línea lo lee remark-math como fórmula en línea: si ocupa todo el
    // párrafo, es una fórmula destacada (centrada, con desplazamiento horizontal si no cabe).
    if (node.type === 'paragraph' && parent && index !== undefined) {
      const kids = (node as any).children.filter((c: any) => !(c.type === 'text' && !c.value.trim()));
      if (kids.length === 1 && kids[0].type === 'inlineMath') {
        parent.children[index] = { type: 'math', value: kids[0].value, data: { hName: 'div', hProperties: { className: ['math', 'math-display'] }, hChildren: [{ type: 'text', value: kids[0].value }] } };
        return SKIP;
      }
    }
    if (node.type === 'heading') {
      const h = node as Heading;
      h.depth = Math.min(6, Math.max(2, h.depth + (ctx.headingShift ?? 0))) as Heading['depth'];
      return;
    }
    if (node.type === 'link') return SKIP;
    if (ctx.linkTerms !== false && node.type === 'strong' && parent && index !== undefined && parent.type !== 'link') {
      const key = (node as Strong).children.map((c: any) => c.value ?? '').join('').trim().toLowerCase();
      const slug = terms.get(key);
      if (slug && ctx.usedTerms && !ctx.usedTerms.has(slug)) {
        ctx.usedTerms.add(slug);
        const link: Link = {
          type: 'link', url: glossaryUrl(ctx, slug), title: null, children: [node as Strong],
          data: { hProperties: { className: ['term'] } },
        };
        parent.children[index] = link;
        return SKIP;
      }
    }
    if (node.type === 'text' && parent && index !== undefined && parent.type !== 'link' && parent.type !== 'heading') {
      // Referencias cruzadas «capítulo 9» / «tema B» → enlace, solo a páginas publicadas.
      const value = (node as Text).value;
      const re = /\b(?:[Cc]ap[ií]tulo\s+(\d{1,2})|[Tt]ema\s+([A-E]))\b/g;
      const pieces: PhrasingContent[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(value))) {
        const href = m[1]
          ? (Number(m[1]) !== ctx.chapter ? chapterUrl(ctx, Number(m[1])) : null)
          : (m[2] !== ctx.topic ? topicUrl(ctx, m[2]) : null);
        if (!href) continue;
        if (m.index > last) pieces.push({ type: 'text', value: value.slice(last, m.index) });
        pieces.push({ type: 'link', url: href, title: null, children: [{ type: 'text', value: m[0] }] });
        last = m.index + m[0].length;
      }
      if (pieces.length) {
        if (last < value.length) pieces.push({ type: 'text', value: value.slice(last) });
        parent.children.splice(index, 1, ...pieces);
        return index + pieces.length;
      }
    }
  });
}

/** Ajustes sobre el HTML: ids y enlace permanente en títulos, tablas desplazables. */
function rehypeSite(ctx: RenderCtx) {
  return (tree: HRoot) => {
    visit(tree, 'element', (el: Element, index, parent: any) => {
      if (/^h[2-6]$/.test(el.tagName)) {
        const txt = hastText(el);
        let id = slugify(txt) || 'seccion';
        const used = ctx.usedIds ?? (ctx.usedIds = new Set());
        let k = 2;
        const baseId = id;
        while (used.has(id)) id = `${baseId}-${k++}`;
        used.add(id);
        el.properties = { ...el.properties, id };
        el.children.push({
          type: 'element', tagName: 'a',
          properties: { className: ['anchor'], href: `#${id}`, ariaLabel: t(ctx.lang, 'nav.permalink') },
          children: [{ type: 'text', value: '#' }],
        });
        return SKIP;
      }
      if (el.tagName === 'table' && parent && index !== undefined && !(parent.properties?.className ?? []).includes('table-wrap')) {
        parent.children[index] = {
          type: 'element', tagName: 'div', properties: { className: ['table-wrap'], tabIndex: 0, role: 'region', ariaLabel: 'Tabla' },
          children: [el],
        };
        return SKIP;
      }
    });
  };
}

function hastText(n: any): string {
  if (n.type === 'text') return n.value;
  if (n.properties?.className?.includes?.('katex-html')) return '';
  return (n.children ?? []).map(hastText).join('');
}

function makeProcessor(ctx: RenderCtx) {
  return unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex, { output: 'htmlAndMathml', throwOnError: true, strict: 'ignore' } as any)
    .use(rehypeSite, ctx)
    .use(rehypeStringify, { allowDangerousHtml: true });
}

export function renderBlocks(nodes: Node[], ctx: RenderCtx): string {
  const root: Root = { type: 'root', children: structuredClone(nodes) as any };
  transformMd(root, ctx);
  const proc = makeProcessor(ctx);
  const hast = proc.runSync(root as any);
  return proc.stringify(hast as any);
}

export function renderInline(nodes: PhrasingContent[], ctx: RenderCtx): string {
  const html = renderBlocks([{ type: 'paragraph', children: nodes } as any], { ...ctx, linkTerms: ctx.linkTerms ?? false });
  return html.replace(/^<p>/, '').replace(/<\/p>\s*$/, '');
}

/** Texto plano (para títulos, metadatos y descripciones accesibles). */
export function plain(nodes: PhrasingContent[]): string {
  const walk = (n: any): string => (n.value !== undefined ? n.value : (n.children ?? []).map(walk).join(''));
  return nodes.map(walk).join('').replace(/\s+/g, ' ').trim();
}

/** Renderiza LaTeX suelto (para etiquetas de gráficos generadas en la compilación). */
export function texToHtml(tex: string, ctx: RenderCtx): string {
  return renderInline([{ type: 'inlineMath', value: tex } as any], ctx);
}
