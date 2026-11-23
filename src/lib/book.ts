/**
 * Lee el libro (content/<idioma>/libro.md) y lo convierte en una estructura de datos:
 * partes, capítulos con sus secciones, ejercicios con su solución, glosario y fórmulas.
 *
 * El libro es la fuente única (RF-ED-01): la web no guarda una segunda copia del texto.
 * El analizador se apoya en la estructura fija del libro (títulos «Capítulo N · …»,
 * secciones «La idea», «Un ejemplo resuelto», …), y falla con un mensaje claro si no la
 * encuentra, para que la publicación se detenga en lugar de publicar algo roto.
 */
import fs from 'node:fs';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { toString as mdToString } from 'mdast-util-to-string';
import YAML from 'yaml';
import type { Root, RootContent, Heading, Paragraph, PhrasingContent, Strong, Table, Blockquote, List, ListItem, Text, Code } from 'mdast';

export type Node = RootContent;

export type SectionType =
  | 'idea' | 'ejemplo' | 'formalizacion' | 'grafico' | 'python' | 'practica' | 'ejercicios' | 'ampliacion' | 'otra';

export interface Section {
  type: SectionType;
  title: string;
  id: string;
  nodes: Node[];
}

export interface ChartSpec {
  title: string;            // «La asimetría de las pérdidas»
  description: PhrasingContent[];
  observe: PhrasingContent[];
  plainText: string;        // texto completo, para validaciones
}

export interface AnswerPart {
  etiqueta: string;
  valor: number;
  tipo: 'porcentaje' | 'numero';
  tolerancia?: number;
}

export interface Exercise {
  id: string;               // «1.1»
  level: string;            // básico | intermedio | avanzado
  kind: string;             // cálculo | reflexión
  statement: PhrasingContent[];
  answer: PhrasingContent[];   // respuesta destacada (negrita de la solución)
  solution: Node[];            // desarrollo
  checks?: AnswerPart[];       // comprobación automática (respuestas.yaml)
}

export interface Chapter {
  number: number;
  title: string;
  slug: string;
  published: boolean;
  description: string;
  prerequisites: number[];
  part: number;
  intro: Node[];               // recuadro «En este capítulo…»
  sections: Section[];
  exercises: Exercise[];
  chart?: ChartSpec;
  python: string[];
  minutesLevel1: number;
  minutesAdvanced: number;
}

export interface Part {
  number: number;
  roman: string;
  title: string;
  question: string;
  intro: Node[];
  chapters: number[];
}

export interface Topic { letter: string; title: string; slug: string; published: boolean; description: string; nodes: Node[] }

export interface GlossaryTerm {
  term: string;
  slug: string;
  definition: PhrasingContent[];
  definitionText: string;
  ref: string;                 // «13», «A» o «Prefacio»
}

export interface FormulaRow { concept: PhrasingContent[]; conceptText: string; formula: PhrasingContent[]; chapter: number }

export interface Book {
  lang: string;
  title: string;
  subtitle: string;
  disclaimer: PhrasingContent[];
  disclaimerText: string;
  preface: Section[];
  prefaceIntro: Node[];
  parts: Part[];
  chapters: Chapter[];
  topics: Topic[];
  topicsIntro: Node[];
  extras: { title: string; key: string; nodes?: Node[] }[];
  glossary: GlossaryTerm[];
  glossaryIntro: string;
  formulas: FormulaRow[];
  formulasNote: Node[];
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const SECTION_TYPES: [RegExp, SectionType][] = [
  [/^La idea$/i, 'idea'],
  [/^Un ejemplo resuelto$/i, 'ejemplo'],
  [/^Formalización$/i, 'formalizacion'],
  [/^Gráfico interactivo$/i, 'grafico'],
  [/^En Python$/i, 'python'],
  [/^En la práctica$/i, 'practica'],
  [/^Ejercicios$/i, 'ejercicios'],
  [/^Ampliación\b/i, 'ampliacion'],
];

const SECTION_IDS: Record<SectionType, string> = {
  idea: 'la-idea', ejemplo: 'ejemplo-resuelto', formalizacion: 'formalizacion', grafico: 'grafico-interactivo',
  python: 'en-python', practica: 'en-la-practica', ejercicios: 'ejercicios', ampliacion: 'ampliacion', otra: 'seccion',
};

export function slugify(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function text(n: Node | PhrasingContent): string {
  return mdToString(n as any).trim();
}

function fail(msg: string): never {
  throw new Error(`[libro] ${msg}`);
}

function isHeading(n: Node, depth?: number): n is Heading {
  return n.type === 'heading' && (depth === undefined || (n as Heading).depth === depth);
}

/** Divide una lista de nodos por títulos de una profundidad dada. */
function splitBy(nodes: Node[], depth: number): { heading: Heading | null; nodes: Node[] }[] {
  const out: { heading: Heading | null; nodes: Node[] }[] = [{ heading: null, nodes: [] }];
  for (const n of nodes) {
    if (isHeading(n, depth)) out.push({ heading: n, nodes: [] });
    else out[out.length - 1].nodes.push(n);
  }
  return out;
}

function words(nodes: Node[]): number {
  return nodes.map((n) => text(n)).join(' ').split(/\s+/).filter(Boolean).length;
}

/** Quita el prefijo literal `prefix` del primer nodo de texto de una lista de nodos en línea. */
function stripLeading(nodes: PhrasingContent[], re: RegExp): PhrasingContent[] {
  const out = structuredClone(nodes);
  while (out.length && out[0].type === 'text') {
    const t = out[0] as Text;
    t.value = t.value.replace(re, '');
    re = /^\s+/;
    if (t.value === '') out.shift();
    else break;
  }
  return out;
}

function trimTrailing(nodes: PhrasingContent[]): PhrasingContent[] {
  const out = structuredClone(nodes);
  const last = out[out.length - 1];
  if (last && last.type === 'text') {
    (last as Text).value = (last as Text).value.replace(/\s+$/, '');
    if (!(last as Text).value) out.pop();
  }
  return out;
}

function parseChart(bq: Blockquote): ChartSpec {
  const p = bq.children[0] as Paragraph;
  if (!p || p.type !== 'paragraph') fail('Recuadro de gráfico sin párrafo');
  const first = p.children[0];
  if (!first || first.type !== 'strong') fail('Recuadro de gráfico sin título en negrita');
  const title = text(first).replace(/^Gráfico interactivo\s*·\s*/i, '').replace(/\.$/, '');
  const rest = stripLeading(p.children.slice(1), /^\s+/);
  const marker = /Lo que el lector debe observar:\s*/;
  const description: PhrasingContent[] = [];
  const observe: PhrasingContent[] = [];
  let found = false;
  for (const n of rest) {
    if (!found && n.type === 'text' && marker.test(n.value)) {
      const [before, after] = n.value.split(marker);
      if (before.trim()) description.push({ type: 'text', value: before });
      if (after) observe.push({ type: 'text', value: after });
      found = true;
    } else (found ? observe : description).push(n);
  }
  if (!found) fail(`El gráfico «${title}» no tiene «Lo que el lector debe observar:»`);
  const obs = observe.length && observe[0].type === 'text'
    ? [{ ...observe[0], value: (observe[0] as Text).value.replace(/^./, (c) => c.toUpperCase()) } as Text, ...observe.slice(1)]
    : observe;
  return { title, description: trimTrailing(description), observe: obs, plainText: text(p) };
}

function parseExercises(list: List, chapter: number): Exercise[] {
  return list.children.map((li: ListItem) => {
    const p = li.children[0] as Paragraph;
    const strong = p.children[0];
    if (!strong || strong.type !== 'strong') fail(`Ejercicio sin número en el capítulo ${chapter}`);
    const id = text(strong);
    if (!/^\d+\.\d+$/.test(id)) fail(`Número de ejercicio extraño: ${id}`);
    const em = p.children.find((c) => c.type === 'emphasis');
    const tags = em ? text(em).replace(/[()]/g, '').split(',').map((s) => s.trim()) : [];
    const [level = '', kind = ''] = tags;
    const idx = em ? p.children.indexOf(em) + 1 : 1;
    const statement = stripLeading(p.children.slice(idx), /^\s+/);
    return { id, level, kind, statement, answer: [], solution: [] };
  });
}

function parseChapterNodes(num: number, title: string, nodes: Node[], meta: any, part: number): Chapter {
  const groups = splitBy(nodes, 3);
  const intro = groups[0].nodes.filter((n) => n.type !== 'thematicBreak');
  const sections: Section[] = [];
  let chart: ChartSpec | undefined;
  let exercises: Exercise[] = [];
  const python: string[] = [];
  let wl1 = 0;
  let wadv = 0;
  for (const g of groups.slice(1)) {
    const st = text(g.heading!);
    const type = SECTION_TYPES.find(([re]) => re.test(st))?.[1] ?? 'otra';
    const body = g.nodes.filter((n) => n.type !== 'thematicBreak');
    if (type === 'grafico') {
      const bq = body.find((n) => n.type === 'blockquote') as Blockquote | undefined;
      if (!bq) fail(`Capítulo ${num}: la sección «Gráfico interactivo» no tiene recuadro`);
      chart = parseChart(bq);
    }
    if (type === 'ejercicios') {
      const list = body.find((n) => n.type === 'list') as List | undefined;
      if (!list) fail(`Capítulo ${num}: la sección «Ejercicios» no tiene lista`);
      exercises = parseExercises(list, num);
    }
    for (const n of body) if (n.type === 'code' && (n as Code).lang === 'python') python.push((n as Code).value);
    if (type === 'ampliacion') wadv += words(body); else wl1 += words(body);
    sections.push({ type, title: st, id: SECTION_IDS[type] === 'seccion' ? slugify(st) : SECTION_IDS[type], nodes: body });
  }
  const required: SectionType[] = ['idea', 'ejemplo', 'formalizacion', 'grafico', 'python', 'practica', 'ejercicios', 'ampliacion'];
  for (const r of required) if (!sections.some((s) => s.type === r)) fail(`Capítulo ${num}: falta la sección «${r}»`);
  return {
    number: num,
    title,
    slug: meta?.slug ?? `${num}-${slugify(title)}`,
    published: !!meta?.publicado,
    description: meta?.descripcion ?? '',
    prerequisites: meta?.requisitos ?? [],
    part,
    intro,
    sections,
    exercises,
    chart,
    python,
    minutesLevel1: Math.max(1, Math.round(wl1 / 200)),
    minutesAdvanced: Math.max(1, Math.round(wadv / 200)),
  };
}

function tableRows(t: Table): PhrasingContent[][][] {
  return t.children.slice(1).map((row) => row.children.map((cell) => cell.children));
}

function parseSolutions(nodes: Node[]): Map<string, { answer: PhrasingContent[]; solution: Node[] }> {
  const map = new Map<string, { answer: PhrasingContent[]; solution: Node[] }>();
  let current: { answer: PhrasingContent[]; solution: Node[] } | null = null;
  for (const n of nodes) {
    if (n.type === 'heading') { current = null; continue; }
    if (n.type === 'paragraph') {
      const first = (n as Paragraph).children[0];
      if (first && first.type === 'strong') {
        const m = text(first).match(/^(\d+\.\d+)\s/);
        if (m) {
          const answer = trimTrailing(stripLeading((first as Strong).children, /^\s*\d+\.\d+\s+/));
          const rest = stripLeading((n as Paragraph).children.slice(1).filter((c, i) => !(i === 0 && c.type === 'break')), /^\s+/);
          current = { answer, solution: rest.length ? [{ type: 'paragraph', children: rest } as Paragraph] : [] };
          map.set(m[1], current);
          continue;
        }
      }
    }
    if (current && n.type !== 'thematicBreak') current.solution.push(n);
  }
  return map;
}

const cache = new Map<string, Book>();

export function contentDir(lang: string): string {
  return path.resolve(process.cwd(), 'content', lang);
}

export function loadBook(lang: string): Book {
  const hit = cache.get(lang);
  if (hit) return hit;
  const dir = contentDir(lang);
  const src = fs.readFileSync(path.join(dir, 'libro.md'), 'utf8');
  const meta = YAML.parse(fs.readFileSync(path.join(dir, 'capitulos.yaml'), 'utf8'));
  const answers: Record<string, AnswerPart[]> = YAML.parse(fs.readFileSync(path.join(dir, 'respuestas.yaml'), 'utf8')) ?? {};
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(src) as Root;

  const top = splitBy(tree.children, 1);
  // Encabezado del libro: título (h1) y lo que hay hasta el prefacio.
  const head = top[1];
  if (!head?.heading) fail('No se encuentra el título del libro');
  const title = text(head.heading);
  const headNodes = splitBy(head.nodes, 2);
  const subtitleP = headNodes[0].nodes.find((n) => n.type === 'paragraph') as Paragraph;
  const subtitle = subtitleP ? text(subtitleP) : '';
  const prefaceGroup = headNodes.find((g) => g.heading && /^Prefacio$/i.test(text(g.heading)));
  if (!prefaceGroup) fail('No se encuentra el prefacio');
  const prefSplit = splitBy(prefaceGroup.nodes, 3);
  const preface: Section[] = prefSplit.slice(1).map((g) => ({
    type: 'otra', title: text(g.heading!), id: slugify(text(g.heading!)), nodes: g.nodes.filter((n) => n.type !== 'thematicBreak'),
  }));

  // Preguntas centrales de cada parte: tabla del prefacio.
  const orgTable = prefaceGroup.nodes.find((n) => n.type === 'table') as Table | undefined;
  if (!orgTable) fail('No se encuentra la tabla de partes del prefacio');
  const questions = new Map<string, string>();
  for (const row of tableRows(orgTable)) {
    const roman = text({ type: 'paragraph', children: row[0] } as Paragraph).split('·')[0].trim();
    questions.set(roman, text({ type: 'paragraph', children: row[1] } as Paragraph));
  }

  const chMeta = new Map<number, any>((meta?.capitulos ?? []).map((c: any) => [c.numero, c]));
  const parts: Part[] = [];
  const chapters: Chapter[] = [];
  const topics: Topic[] = [];
  let topicsIntro: Node[] = [];
  const extras: { title: string; key: string; nodes?: Node[] }[] = [];
  let glossary: GlossaryTerm[] = [];
  let glossaryIntro = '';
  let formulas: FormulaRow[] = [];
  let formulasNote: Node[] = [];
  let solutions = new Map<string, { answer: PhrasingContent[]; solution: Node[] }>();
  let disclaimer: PhrasingContent[] = [];

  for (const g of top.slice(2)) {
    const ht = text(g.heading!);
    const partMatch = ht.match(/^Parte\s+([IVX]+)\s*·\s*(.+)$/);
    if (partMatch) {
      const roman = partMatch[1];
      const number = ROMAN.indexOf(roman) + 1;
      const sub = splitBy(g.nodes, 2);
      const part: Part = {
        number, roman, title: partMatch[2], question: questions.get(roman) ?? '',
        intro: sub[0].nodes.filter((n) => n.type !== 'thematicBreak'), chapters: [],
      };
      for (const c of sub.slice(1)) {
        const m = text(c.heading!).match(/^Capítulo\s+(\d+)\s*·\s*(.+)$/);
        if (!m) fail(`Título de capítulo inesperado: «${text(c.heading!)}»`);
        const num = Number(m[1]);
        chapters.push(parseChapterNodes(num, m[2], c.nodes, chMeta.get(num), number));
        part.chapters.push(num);
      }
      parts.push(part);
      continue;
    }
    if (/temas complementarios/i.test(ht)) {
      const tMeta = new Map<string, any>((meta?.temas ?? []).map((t: any) => [t.letra, t]));
      const tsub = splitBy(g.nodes, 2);
      topicsIntro = tsub[0].nodes.filter((n) => n.type !== 'thematicBreak');
      for (const s of tsub.slice(1)) {
        const m = text(s.heading!).match(/^Tema\s+([A-Z])\s*·\s*(.+)$/);
        if (!m) continue;
        const tm = tMeta.get(m[1]);
        topics.push({ letter: m[1], title: m[2], slug: tm?.slug ?? `tema-${m[1].toLowerCase()}-${slugify(m[2])}`, published: !!tm?.publicado, description: tm?.descripcion ?? '', nodes: s.nodes.filter((n) => n.type !== 'thematicBreak') });
      }
      continue;
    }
    if (/^Soluciones/i.test(ht)) { solutions = parseSolutions(g.nodes); continue; }
    if (/^Resumen de fórmulas/i.test(ht)) {
      const t = g.nodes.find((n) => n.type === 'table') as Table;
      formulas = tableRows(t).map((r) => ({
        concept: r[0], conceptText: text({ type: 'paragraph', children: r[0] } as Paragraph),
        formula: r[1], chapter: Number(text({ type: 'paragraph', children: r[2] } as Paragraph)),
      }));
      formulasNote = g.nodes.filter((n) => n.type === 'paragraph');
      extras.push({ title: ht, key: 'formulas' });
      continue;
    }
    if (/^Glosario/i.test(ht)) {
      const t = g.nodes.find((n) => n.type === 'table') as Table;
      const intro = g.nodes.find((n) => n.type === 'paragraph');
      glossaryIntro = intro ? text(intro) : '';
      glossary = tableRows(t).map((r) => {
        const term = text({ type: 'paragraph', children: r[0] } as Paragraph);
        return {
          term, slug: slugify(term), definition: r[1],
          definitionText: text({ type: 'paragraph', children: r[1] } as Paragraph),
          ref: text({ type: 'paragraph', children: r[2] } as Paragraph),
        };
      });
      extras.push({ title: ht, key: 'glossary' });
      continue;
    }
    if (/^Epílogo/i.test(ht)) {
      // Último párrafo en cursiva = aviso legal del libro.
      const last = [...g.nodes].reverse().find((n) => n.type === 'paragraph' && (n as Paragraph).children[0]?.type === 'emphasis') as Paragraph | undefined;
      if (last) disclaimer = (last.children[0] as any).children;
      extras.push({ title: ht, key: 'epilogo', nodes: g.nodes.filter((n) => n !== last) });
      continue;
    }
    if (/^Proyecto práctico/i.test(ht)) { extras.push({ title: ht, key: 'proyecto', nodes: g.nodes.filter((n) => n.type !== 'thematicBreak') }); continue; }
    extras.push({ title: ht, key: slugify(ht), nodes: g.nodes });
  }

  // Une ejercicios, soluciones y respuestas numéricas.
  for (const ch of chapters) {
    for (const ex of ch.exercises) {
      const s = solutions.get(ex.id);
      if (!s) fail(`El ejercicio ${ex.id} no tiene solución`);
      ex.answer = s.answer;
      ex.solution = s.solution;
      if (answers[ex.id]) ex.checks = answers[ex.id];
    }
  }
  if (!disclaimer.length) {
    const p = head.nodes.find((n) => n.type === 'paragraph' && (n as Paragraph).children[0]?.type === 'emphasis') as Paragraph | undefined;
    if (p) disclaimer = (p.children[0] as any).children;
  }

  const book: Book = {
    lang, title, subtitle, disclaimer,
    disclaimerText: text({ type: 'paragraph', children: disclaimer } as Paragraph),
    preface, prefaceIntro: prefSplit[0].nodes,
    parts, chapters, topics, topicsIntro, extras, glossary, glossaryIntro, formulas, formulasNote,
  };
  cache.set(lang, book);
  return book;
}

export function publishedChapters(book: Book): Chapter[] {
  return book.chapters.filter((c) => c.published);
}

export function chapterByNumber(book: Book, n: number): Chapter | undefined {
  return book.chapters.find((c) => c.number === n);
}
