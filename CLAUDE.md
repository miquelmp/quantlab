# Guía de mantenimiento (para Claude)

El autor (Miquel) no programa: Claude construye y mantiene la web. Responder siempre en español sencillo.
Especificación funcional: `ES_Analisis_Funcional_Web_v2.md` (en los ficheros del proyecto). Los ids RF-*/RNF-* de los comentarios remiten a ella.

## Arquitectura

- **Astro** genera un sitio estático en `dist/`, desplegado en GitHub Pages (`/quantlab/`) por `.github/workflows/publicar.yml` al cambiar `main`. Las PR solo se comprueban.
- **Fuente única** (RF-ED-01): `content/<idioma>/libro.md`. `src/lib/book.ts` lo analiza (remark) y depende de su estructura fija: `# Parte X · …`, `## Capítulo N · …`, secciones `### La idea`, `### Un ejemplo resuelto`, `### Formalización`, `### Gráfico interactivo` (recuadro `> **Gráfico interactivo · Título.** … Lo que el lector debe observar: …`), `### En Python`, `### En la práctica`, `### Ejercicios` (lista `- **N.M** *(nivel, tipo)* …`), `### Ampliación · …`; soluciones en `# Soluciones de los ejercicios` (`**N.M respuesta.**` + desarrollo); `# Resumen de fórmulas` y `# Glosario` como tablas. Si falta algo, la compilación falla con un mensaje claro.
- `src/lib/render.ts`: Markdown → HTML (KaTeX con MathML, Shiki, enlaces al glosario y a capítulos publicados, bloques de Python ejecutables).
- **Gráficos** (`src/charts/`): cada uno es un `ChartDef` (tipos en `types.ts`) con funciones puras que devuelven SVG como texto. Se usan en la compilación (imagen sin JavaScript) y en el navegador (`client/mount.ts`). Simulaciones con generador con semilla propio (`rng.ts`). Truco de rendimiento: los aleatorios dependen solo de semilla/tamaño; los parámetros solo los transforman.
- **Python**: Pyodide 0.29.5 desde jsDelivr en un Web Worker (`src/python/`), cargado al pulsar «Ejecutar». Los bloques de una página comparten intérprete.
- **Idiomas**: `src/i18n/config.ts` + `src/i18n/<idioma>.json` (textos de interfaz, también los de los gráficos) + `content/<idioma>/`. URLs `/<idioma>/…`; hreflang automático con más de un idioma.
- Progreso y preferencias del lector: solo `localStorage` (clave `quantlab:v1`), siempre con try/catch.

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

## Pendiente (fases siguientes del análisis funcional)

Búsqueda (Pagefind), «Mi progreso», galería Laboratorio, modo presentación, retos, descargas .py/.ipynb, imágenes de vista previa por capítulo, analítica (GoatCounter: poner la URL en `src/config.ts` cuando el autor cree la cuenta).
