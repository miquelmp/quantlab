# quantlab

**Fundamentos de finanzas cuantitativas**: libro web abierto con gráficos interactivos, simulaciones y Python en el navegador.

Web: <https://miquelmp.github.io/quantlab/>

## Qué es

La versión web, gratuita y abierta, del libro *Fundamentos de finanzas cuantitativas: de la probabilidad a la gestión del riesgo*. Cada capítulo incluye:

- el texto del libro, con fórmulas y una «Ampliación» plegable para quien quiera más rigor;
- un gráfico interactivo con deslizadores (y semilla, cuando hay simulación);
- el código Python del libro, que se ejecuta en el navegador sin instalar nada;
- ejercicios con comprobación automática de la respuesta y solución desplegable.

Esta es la **versión piloto**: capítulos 1, 6 y 14, glosario y resumen de fórmulas.

## Cómo se actualiza

El texto sale siempre de un único fichero: [`content/es/libro.md`](content/es/libro.md). Para publicar una corrección basta con cambiar ese fichero en la rama `main`: GitHub comprueba el contenido (fórmulas, código Python, enlaces, pruebas de los gráficos) y, si todo está bien, publica la web en unos minutos. Si algo falla, no se publica nada y la web sigue como estaba.

| Fichero | Para qué sirve |
|---|---|
| `content/es/libro.md` | El libro completo (fuente única del texto). |
| `content/es/capitulos.yaml` | Qué capítulos están publicados, su dirección y su descripción para buscadores. |
| `content/es/respuestas.yaml` | Respuestas numéricas de los ejercicios de cálculo. |
| `content/es/paginas/` | Licencia, privacidad y aviso legal. |
| `src/` | Código de la web (gráficos, Python, páginas). |

Los detalles técnicos para mantener la web están en [`CLAUDE.md`](CLAUDE.md).

## Licencia

- Texto del libro: [CC BY-SA 4.0](LICENSE-CONTENT.txt).
- Código: [MIT](LICENSE).

*Todos los datos de los ejemplos son inventados o simulados. El contenido es exclusivamente educativo y no constituye asesoramiento financiero.*
