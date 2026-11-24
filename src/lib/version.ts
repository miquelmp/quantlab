/**
 * Versión de la publicación, calculada en cada compilación (se muestra en el pie de todas las
 * páginas y en la portada del libro completo y del PDF). Así el autor puede comprobar si un cambio
 * ya está publicado: la fecha y la hora (hora de Madrid) y el código del cambio (las 7 primeras
 * cifras del commit de GitHub) cambian en cada publicación.
 */
import { execSync } from 'node:child_process';

function commit(): string {
  const env = process.env.GITHUB_SHA;
  if (env) return env.slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'local';
  }
}

function madridStamp(d: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(d).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

const built = new Date();
export const BUILD = {
  /** Fecha y hora de la compilación en hora de Madrid, p. ej. «2026-11-24 09:15». */
  stamp: madridStamp(built),
  /** Código corto del commit publicado, p. ej. «84bd9eb». */
  commit: commit(),
};
/** Texto completo de la versión, p. ej. «2026-11-24 09:15 · 84bd9eb». */
export const VERSION_LABEL = `${BUILD.stamp} · ${BUILD.commit}`;
