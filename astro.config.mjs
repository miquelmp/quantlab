// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { SITE, PYODIDE_INDEX_URL } from './src/config.ts';
import pwa from './scripts/pwa.mjs';
import search from './scripts/search.mjs';

export default defineConfig({
  site: SITE.url,
  base: SITE.base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap(), search(), pwa({ base: SITE.base, pyodide: PYODIDE_INDEX_URL })],
  vite: {
    worker: { format: 'es' },
  },
});
