/**
 * Manifiesto de la app instalable (PWA): nombre, icono y apertura a pantalla completa
 * sin la barra del navegador. El trabajador de servicio (sw.js) lo genera scripts/pwa.mjs.
 */
import type { APIRoute } from 'astro';
import { t } from '../i18n';
import { LANGS } from '../i18n/config';

export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';
  const lang = LANGS[0].code;
  const manifest = {
    name: `${t(lang, 'site.name')} · ${t(lang, 'site.bookTitle')}`,
    short_name: t(lang, 'site.name'),
    description: t(lang, 'site.tagline'),
    lang: LANGS[0].htmlLang,
    start_url: `${base}${lang}/`,
    scope: base,
    id: base,
    display: 'standalone',
    orientation: 'any',
    background_color: '#fcfcfb',
    theme_color: '#1c5cab',
    categories: ['education', 'finance', 'books'],
    icons: [
      { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${base}icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/manifest+json' } });
};
