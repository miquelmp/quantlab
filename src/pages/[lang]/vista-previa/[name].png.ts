/** /<idioma>/vista-previa/<nombre>.png: imagen para compartir de la portada y de cada capítulo, tema y página principal. */
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { LANGS } from '../../../i18n/config';
import { t } from '../../../i18n';
import { loadBook, publishedChapters } from '../../../lib/book';
import { ogSvg, type OgCard } from '../../../lib/og';

export function ogCards(lang: string): { name: string; card: OgCard }[] {
  const book = loadBook(lang);
  const site = t(lang, 'site.name');
  const footer = book.title.split(':')[0];
  const list = [{ name: 'portada', card: { site, kicker: t(lang, 'site.pilot'), title: book.title.split(':')[0], footer: t(lang, 'site.tagline') } }];
  for (const c of publishedChapters(book)) {
    const part = book.parts.find((p) => p.number === c.part)!;
    list.push({ name: c.slug, card: { site, kicker: `${t(lang, 'nav.chapter')} ${c.number} · ${t(lang, 'nav.part')} ${part.roman}`, title: c.title, footer } });
  }
  for (const tp of book.topics.filter((x) => x.published)) {
    list.push({ name: tp.slug, card: { site, kicker: `${t(lang, 'nav.topic')} ${tp.letter}`, title: tp.title.replace(/\*/g, ''), footer } });
  }
  list.push({ name: 'laboratorio', card: { site, kicker: t(lang, 'lab.title'), title: t(lang, 'lab.description').replace(/\.$/, ''), footer } });
  return list;
}

export function getStaticPaths() {
  return LANGS.flatMap((l) => ogCards(l.code).map(({ name, card }) => ({ params: { lang: l.code, name }, props: { card } })));
}

export const GET: APIRoute = async ({ props }) => {
  const png = await sharp(Buffer.from(ogSvg(props.card as OgCard))).png({ compressionLevel: 9, palette: true }).toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
