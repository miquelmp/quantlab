/**
 * Auditoría automática de accesibilidad (WCAG 2.2 AA) con axe-core sobre el sitio generado.
 * Uso: npm run preview (en otra terminal) y después node scripts/check-a11y.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.SITE_URL || 'http://localhost:4321/quantlab/';
const PAGES = ['es/', 'es/indice/', 'es/capitulos/1-medir-lo-que-gana-una-inversion/', 'es/capitulos/2-valor-temporal-del-dinero/', 'es/capitulos/3-esperanza-ley-grandes-numeros/', 'es/capitulos/4-paseos-aleatorios-raiz-del-tiempo/', 'es/capitulos/5-distribucion-normal-teorema-central-limite/', 'es/capitulos/6-monte-carlo/', 'es/capitulos/14-criterio-de-kelly/', 'es/capitulos/7-volatilidad/', 'es/capitulos/8-ratio-de-sharpe/', 'es/capitulos/9-crecimiento-compuesto-lastre-volatilidad/', 'es/capitulos/10-covarianza-correlacion/', 'es/capitulos/11-diversificacion/', 'es/capitulos/12-frontera-eficiente/', 'es/capitulos/13-beta-capm-factores/', 'es/capitulos/15-colas-gruesas/', 'es/capitulos/16-valor-en-riesgo-deficit-esperado/', 'es/glosario/', 'es/glosario/volatilidad/', 'es/formulas/', 'es/sobre-el-libro/', 'es/licencia/', 'es/buscar/', 'es/buscar/?q=volatilidad', 'es/progreso/', 'es/bibliografia/', 'es/epilogo/', 'es/temas/tema-a-backtesting-sobreajuste/', 'es/temas/tema-c-arbol-binomial/', 'es/temas/tema-e-caidas-maximas/', 'es/proyecto/'];
(async () => {
  const browser = await chromium.launch();
  let total = 0;
  // Claro y oscuro en escritorio; además, los capítulos en un móvil (mandos compactos, pestañas).
  const RUNS = [['light', 1280], ['dark', 1280], ['light', 390]];
  for (const [scheme, width] of RUNS) {
    const page = await browser.newPage({ colorScheme: scheme, viewport: { width, height: 900 } });
    for (const p of PAGES.filter((x) => width > 500 || /capitulos\/|temas\/|proyecto/.test(x))) {
      await page.goto(BASE + p, { waitUntil: 'networkidle' });
      // Montar todos los gráficos y abrir la Ampliación y las tablas para auditarlo todo
      await page.evaluate(async () => { for (const el of document.querySelectorAll('[data-chart]')) el.scrollIntoView(); document.querySelectorAll('details').forEach((d) => (d.open = true)); });
      await page.waitForTimeout(800);
      await page.addScriptTag({ content: axe });
      const res = await page.evaluate(() => axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }));
      for (const v of res.violations) {
        total++;
        console.log(`✗ [${scheme} ${width}px] ${p} · ${v.id} (${v.impact}): ${v.help}`);
        v.nodes.slice(0, 3).forEach((n) => console.log('    ', n.target.join(' '), n.failureSummary?.split('\n')[1] ?? ''));
      }
    }
    await page.close();
  }
  await browser.close();
  console.log(total ? `\n${total} problema(s) de accesibilidad.` : '✓ Sin problemas de accesibilidad detectados automáticamente.');
  process.exit(total ? 1 : 0);
})();
