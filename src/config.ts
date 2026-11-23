/** Ajustes generales de la web. */
export const SITE = {
  /** Dirección pública (sin barra final). Cambiar aquí si se usa un dominio propio. */
  url: 'https://miquelmp.github.io',
  /** Ruta base dentro del dominio (GitHub Pages de proyecto: /quantlab). */
  base: '/quantlab',
  repo: 'https://github.com/miquelmp/quantlab',
  author: 'Miquel',
  /** Versión del libro publicada (se muestra en el pie). */
  bookVersion: 'v4',
};

/**
 * Entorno de Python en el navegador (Pyodide). Se descarga solo cuando el lector pulsa
 * «Ejecutar» por primera vez. Versión fijada para que los resultados no cambien solos.
 */
export const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/';

/**
 * Analítica anónima y sin cookies (GoatCounter). Vacío = desactivada.
 * Panel de estadísticas: https://miquelmp.goatcounter.com/ (cuenta del autor).
 */
export const ANALYTICS_GOATCOUNTER = 'https://miquelmp.goatcounter.com/count';
