import { t } from '../i18n';
import type { Book } from './book';
import { chapterUrl, url, type RenderCtx } from './render';

/** Primera letra para agrupar (sin tildes; la ñ va aparte). */
export function letterOf(term: string): string {
  const c = term.trim().charAt(0).toUpperCase();
  if (c === 'Ñ') return 'Ñ';
  return c.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** «Capítulo 13 · Beta, CAPM…», «Tema A · …» o «Prefacio». */
export function refLabel(lang: string, ref: string, book?: Book): string {
  if (/^\d+$/.test(ref)) {
    const c = book?.chapters.find((x) => x.number === Number(ref));
    return `${t(lang, 'nav.chapter')} ${ref}${c ? ` · ${c.title}` : ''}`;
  }
  if (/^[A-Z]$/.test(ref)) {
    const tp = book?.topics.find((x) => x.letter === ref);
    return `${t(lang, 'nav.topic')} ${ref}${tp ? ` · ${tp.title}` : ''}`;
  }
  return ref === 'Prefacio' ? t(lang, 'glossary.preface') : ref;
}

export function refHref(ctx: RenderCtx, ref: string): string | null {
  if (/^\d+$/.test(ref)) return chapterUrl(ctx, Number(ref));
  if (ref === 'Prefacio') return url(ctx, `${ctx.lang}/sobre-el-libro/#prefacio`);
  return null;
}
