/**
 * Integración de Astro que, al terminar la compilación, crea el índice de búsqueda con Pagefind
 * (RF-BUS-01) en dist/pagefind/. Funciona sin servidor: el navegador descarga solo los trozos del
 * índice que necesita. Va antes de la integración de la app (pwa.mjs) para que el índice también
 * se guarde para leer sin conexión.
 *
 * Qué se indexa: solo el contenido marcado con data-pagefind-body (el <main> de cada página, salvo
 * la del buscador y la 404). Los gráficos (SVG) y los resultados de Python se ignoran.
 */
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { readdirSync, rmSync } from 'node:fs';

export default function search() {
  return {
    name: 'quantlab-search',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const pagefind = await import('pagefind');
        const root = fileURLToPath(dir);
        const { index, errors } = await pagefind.createIndex({ excludeSelectors: ['svg', '.py-out', '.chart-controls', '.katex', '.anchor'] });
        if (!index) throw new Error('Pagefind: ' + errors.join('; '));
        const r = await index.addDirectory({ path: root });
        if (r.errors.length) throw new Error('Pagefind: ' + r.errors.join('; '));
        await index.writeFiles({ outputPath: join(root, 'pagefind') });
        await pagefind.close();
        // La interfaz es propia (src/lib/client/search.ts): fuera las interfaces que trae Pagefind.
        const out = join(root, 'pagefind');
        for (const f of readdirSync(out)) if (/-ui\.(js|css)$|^pagefind-highlight\.js$/.test(f)) rmSync(join(out, f));
        logger.info(`índice de búsqueda: ${r.page_count} páginas.`);
      },
    },
  };
}
