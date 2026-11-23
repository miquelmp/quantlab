/**
 * RF-ED-03: validaciones del contenido antes de publicar.
 * - El libro tiene la estructura esperada (lo comprueba el propio analizador).
 * - Todas las fórmulas LaTeX del libro compilan con KaTeX.
 * - Los términos del glosario remiten a un capítulo, tema o al prefacio que existen.
 * - Las respuestas numéricas (respuestas.yaml) corresponden a ejercicios de cálculo del libro.
 * - Cada capítulo publicado tiene gráfico registrado, con «Lo que debes observar» y descripción.
 * - Los slugs de capitulos.yaml son únicos.
 */
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import YAML from 'yaml';
import { LANGS } from '../src/i18n/config';
import { loadBook, contentDir } from '../src/lib/book';
import { CHART_BY_CHAPTER } from '../src/charts/registry';

const errors: string[] = [];
const err = (m: string) => errors.push(m);

for (const { code: lang } of LANGS) {
  let book;
  try { book = loadBook(lang); } catch (e: any) { err(`[${lang}] ${e.message}`); continue; }

  // Fórmulas
  const src = fs.readFileSync(path.join(contentDir(lang), 'libro.md'), 'utf8');
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(src);
  let formulas = 0;
  visit(tree, (n: any) => {
    if (n.type === 'math' || n.type === 'inlineMath') {
      formulas++;
      try { katex.renderToString(n.value, { displayMode: n.type === 'math', throwOnError: true, strict: 'ignore' }); }
      catch (e: any) { err(`[${lang}] Fórmula que no compila (línea ${n.position?.start.line}): ${e.message}`); }
    }
  });

  // Glosario
  for (const g of book.glossary) {
    const ok = /^\d+$/.test(g.ref) ? book.chapters.some((c) => c.number === Number(g.ref))
      : /^[A-Z]$/.test(g.ref) ? book.topics.some((t) => t.letter === g.ref) : g.ref === 'Prefacio';
    if (!ok) err(`[${lang}] El término «${g.term}» remite a «${g.ref}», que no existe`);
  }
  const slugs = new Set<string>();
  for (const g of book.glossary) { if (slugs.has(g.slug)) err(`[${lang}] Término repetido: ${g.slug}`); slugs.add(g.slug); }

  // Respuestas
  const answers = YAML.parse(fs.readFileSync(path.join(contentDir(lang), 'respuestas.yaml'), 'utf8')) ?? {};
  const all = new Map(book.chapters.flatMap((c) => c.exercises.map((e) => [e.id, e] as const)));
  for (const [id, parts] of Object.entries<any[]>(answers)) {
    const ex = all.get(id);
    if (!ex) { err(`[${lang}] respuestas.yaml: el ejercicio ${id} no existe`); continue; }
    if (ex.kind !== 'cálculo') err(`[${lang}] respuestas.yaml: el ejercicio ${id} no es de cálculo`);
    for (const p of parts) {
      if (typeof p.valor !== 'number' || !['porcentaje', 'numero'].includes(p.tipo) || !p.etiqueta) err(`[${lang}] respuestas.yaml: parte mal definida en ${id}`);
    }
  }

  // Capítulos publicados
  for (const c of book.chapters.filter((x) => x.published)) {
    for (const ex of c.exercises) if (ex.kind === 'cálculo' && !answers[ex.id]) err(`[${lang}] Ejercicio de cálculo ${ex.id} (publicado) sin respuesta en respuestas.yaml`);
    if (!c.chart) err(`[${lang}] Capítulo ${c.number}: sin gráfico`);
    else {
      if (!c.chart.observe.length) err(`[${lang}] Capítulo ${c.number}: el gráfico no tiene «Lo que debes observar»`);
      if (!c.chart.description.length) err(`[${lang}] Capítulo ${c.number}: el gráfico no tiene descripción`);
      if (c.challenges.length < 1 || c.challenges.length > 3) err(`[${lang}] Capítulo ${c.number}: el gráfico debe tener de 1 a 3 retos en retos.yaml (tiene ${c.challenges.length})`);
      if (!CHART_BY_CHAPTER[c.number]) err(`[${lang}] Capítulo ${c.number}: publicado pero su gráfico no está programado (src/charts/registry.ts)`);
    }
    if (!c.description) err(`[${lang}] Capítulo ${c.number}: falta la descripción en capitulos.yaml`);
  }
  const chSlugs = book.chapters.map((c) => c.slug);
  if (new Set(chSlugs).size !== chSlugs.length) err(`[${lang}] capitulos.yaml: slugs repetidos`);

  console.log(`[${lang}] ${book.chapters.length} capítulos (${book.chapters.filter((c) => c.published).length} publicados), ${formulas} fórmulas, ${book.glossary.length} términos, ${Object.keys(answers).length} ejercicios con respuesta.`);
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} problema(s):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log('✓ Contenido correcto.');
