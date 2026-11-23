# Guía de mantenimiento (para Claude)

El autor (Miquel) no programa: Claude construye y mantiene la web. Responder siempre en español sencillo.
Especificación funcional: `ES_Analisis_Funcional_Web_v2.md` (en los ficheros del proyecto). Los ids RF-*/RNF-* de los comentarios remiten a ella.

## Arquitectura

- **Astro** genera un sitio estático en `dist/`, desplegado en GitHub Pages (`/quantlab/`) por `.github/workflows/publicar.yml` al cambiar `main`. Las PR solo se comprueban.
- **Fuente única** (RF-ED-01): `content/<idioma>/libro.md`. `src/lib/book.ts` lo analiza (remark) y depende de su estructura fija: `# Parte X · …`, `## Capítulo N · …`, secciones `### La idea`, `### Un ejemplo resuelto`, `### Formalización`, `### Gráfico interactivo` (recuadro `> **Gráfico interactivo · Título.** … Lo que el lector debe observar: …`), `### En Python`, `### En la práctica`, `### Ejercicios` (lista `- **N.M** *(nivel, tipo)* …`), `### Ampliación · …`; soluciones en `# Soluciones de los ejercicios` (`**N.M respuesta.**` + desarrollo); `# Resumen de fórmulas` y `# Glosario` como tablas. Si falta algo, la compilación falla con un mensaje claro.
- `src/lib/render.ts`: Markdown → HTML (KaTeX con MathML, Shiki, enlaces al glosario y a capítulos publicados, bloques de Python ejecutables).
- **Gráficos** (`src/charts/`): cada uno es un `ChartDef` (tipos en `types.ts`) con funciones puras que devuelven SVG como texto. Se usan en la compilación (imagen sin JavaScript) y en el navegador (`client/mount.ts`). Simulaciones con generador con semilla propio (`rng.ts`). Truco de rendimiento: los aleatorios dependen solo de semilla/tamaño; los parámetros solo los transforman. **Móvil** (< 760 px): todo el gráfico debe caber en una pantalla (petición del autor): alto de panel con `panelH(w, base)` de `svg.ts` (modo compacto que activa `mount.ts`), mandos en dos columnas, pestañas si hay varios paneles (`Stat.panels` liga resultados a un panel) y `more: true` en los mandos secundarios («Más ajustes»). `check:a11y` también revisa los capítulos a 390 px.
- **Python**: Pyodide 0.29.5 desde jsDelivr en un Web Worker (`src/python/`), cargado al pulsar «Ejecutar». Los bloques de una página comparten intérprete.
- **Idiomas**: `src/i18n/config.ts` + `src/i18n/<idioma>.json` (textos de interfaz, también los de los gráficos) + `content/<idioma>/`. URLs `/<idioma>/…`; hreflang automático con más de un idioma.
- **App instalable (PWA)**: `src/pages/manifest.webmanifest.ts` + `scripts/pwa.mjs` (integración que escribe `dist/sw.js` con todas las páginas para leer sin conexión; Pyodide se guarda al usarse). Iconos en `public/icons/` (`node scripts/make-icons.cjs` si cambia el logo).
- **Búsqueda**: `scripts/search.mjs` (integración que crea el índice Pagefind en `dist/pagefind/` antes de la PWA) + página `src/pages/[lang]/buscar.astro` + `src/lib/client/search.ts` (interfaz propia, sinónimos, agrupación por tipo). Se indexa el `<main data-pagefind-body>` de `Base.astro`; `searchable={false}` lo excluye. Atajo «/».
- Progreso y preferencias del lector: solo `localStorage` (clave `quantlab:v1`), siempre con try/catch. Página «Mi progreso» en `src/pages/[lang]/progreso.astro` + `src/lib/client/progress.ts` (resumen, exportar/importar fichero, borrar).

- **Retos** de los gráficos: `content/es/retos.yaml` (1–3 por capítulo, lo exige `check:content`); `tests/retos.test.ts` guarda una solución de cada uno y comprueba con el gráfico que se puede conseguir. Se marcan en el gráfico y cuentan en «Mi progreso» (`ch` en el almacenamiento).
- **Imágenes para compartir** (`src/pages/[lang]/vista-previa/[name].png.ts` + `src/lib/og.ts`, con sharp): 1200×630 por capítulo, tema, Laboratorio y portada; `Base.astro` elige la de la página. No se guardan para uso sin conexión.
- **Modo presentación** de los gráficos (botón «Presentación», oculto en el móvil): pantalla completa, `setPresent()` de `svg.ts` (paneles ×1,35) y estilos `.chart.presenting`.
- **Descargas del código** (`src/pages/[lang]/codigo/[file].ts` + `src/lib/download.ts`): `.py` y `.ipynb` de cada capítulo, del tema E y del proyecto.
- **Laboratorio** (`src/pages/[lang]/laboratorio.astro`): galería con la miniatura del primer panel de cada gráfico publicado.
- **Temas A–E y proyecto**: páginas `src/pages/[lang]/temas/[slug].astro` (slug y descripción en `temas:` de `capitulos.yaml`) y `src/pages/[lang]/proyecto.astro`. «capítulo N» y «tema X» en el texto se enlazan solos si están publicados; los años de las citas «Autor (año)» enlazan a su obra en la bibliografía (`citationId` en `src/lib/biblio.ts`).
- **Gráficos de los temas**: `CHART_BY_TOPIC` en `src/charts/registry.ts` (`temaA-sobreajuste.ts`, `temaB-costes.ts`, `temaC-blackscholes.ts`, `temaD-cointegracion.ts`, `temaE-caidas.ts`); textos `tX.*` en `es.json` (título, `chartDesc`, `observe`, `heading`). Salen al final de la página del tema y en el Laboratorio.
- **Exportar gráficos** (RF-GRA-09): menú «Descargar» de cada gráfico → `src/charts/client/export.ts` (PNG/SVG con todos los paneles y estilos del tema copiados en línea; CSV de la tabla con «;»).
- **Mapa de aprendizaje** (RF-NAV-09): `src/components/LearningMap.astro` en el índice, a partir de `requisitos` de `capitulos.yaml`.
- **Analítica**: GoatCounter (anónima, sin cookies), `ANALYTICS_GOATCOUNTER` en `src/config.ts`; panel del autor en https://miquelmp.goatcounter.com/. Explicada en `content/es/paginas/privacidad.md`.

## Tareas habituales

- **Publicar un capítulo nuevo**: `publicado: true` y `descripcion` en `content/es/capitulos.yaml`; respuestas de sus ejercicios de cálculo en `respuestas.yaml`; programar su gráfico en `src/charts/chNN-*.ts` (según la sección 9 del análisis funcional), registrarlo en `src/charts/registry.ts`, añadir sus textos `cNN.*` a `src/i18n/es.json` y sus pruebas con las cifras del libro en `tests/charts.test.ts`. `check:content` falla si falta algo de esto.
- **Nueva versión del libro**: sustituir `content/es/libro.md` y ejecutar `npm run check`.
- **Añadir un idioma**: ver el comentario de `src/i18n/config.ts`.

## Comprobaciones (todas se ejecutan en GitHub antes de publicar)

```
npm ci                    # .npmrc usa legacy-peer-deps
npm run check:content     # estructura, fórmulas KaTeX, glosario, respuestas, gráficos
npm run check:python      # ejecuta los 18 fragmentos y compara con los comentarios (necesita numpy)
npm test                  # vitest: cifras del libro en los gráficos, lectura de respuestas
npm run build && npm run check:links
npm run preview & npm run check:a11y   # axe-core, temas claro y oscuro (no está en CI)
```

## Pendiente

Hecho todo lo imprescindible (M) y recomendable (S). Quedan funciones opcionales (C) y de la fase 5, a decidir por el autor: pistas y preguntas rápidas (RF-EJ-05/07), símbolos interactivos (RF-FOR-04), términos en inglés (RF-GLO-05), versión en inglés y PDF.
