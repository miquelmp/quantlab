<!-- Versión 4 (v4). Texto original. Fórmulas en LaTeX ($...$). -->

# Fundamentos de finanzas cuantitativas: de la probabilidad a la gestión del riesgo

**Teoría, ejemplos resueltos y código en Python para entender cómo se miden la rentabilidad y el riesgo**

*Todos los datos de los ejemplos son inventados o simulados. Este texto tiene una finalidad exclusivamente educativa y no constituye asesoramiento financiero.*

---

## Prefacio

Detrás de cada decisión financiera hay una pregunta cuantitativa. ¿Cuánto vale hoy un pago que llegará dentro de cinco años? ¿Qué parte de la ganancia de un fondo se debe a la habilidad del gestor y qué parte al riesgo que asumió? ¿Por qué dos carteras con la misma rentabilidad media acaban en sitios tan distintos? ¿Cuánto puede perder un banco en un mal día? Las **finanzas cuantitativas** responden a preguntas como estas con herramientas de probabilidad, estadística y programación.

Este libro está pensado para quien tiene una base matemática de bachillerato o de primeros cursos universitarios y quiere entender esas herramientas desde dentro, sin quedarse en la receta. Cada idea se presenta primero con palabras y con un ejemplo numérico que se puede seguir con calculadora; después se formaliza, se programa y se discuten sus límites.

### Organización

El libro tiene cinco partes y dieciséis capítulos. El orden no es casual: cada parte usa lo que construyen las anteriores.

| Parte | Pregunta central | Capítulos |
|---|---|---|
| **I · El precio del tiempo** | ¿Cómo se mide lo que gana una inversión y cómo se comparan pagos en fechas distintas? | 1–2 |
| **II · El lenguaje del azar** | ¿Qué herramientas de probabilidad necesitamos para describir precios inciertos? | 3–6 |
| **III · Riesgo y recompensa** | ¿Cómo se resume el riesgo de una inversión y qué rentabilidad lo compensa? | 7–9 |
| **IV · Carteras** | ¿Qué ocurre cuando se combinan varias inversiones? | 10–13 |
| **V · Decidir y medir lo extremo** | ¿Cuánto arriesgar y cómo medir las pérdidas raras pero graves? | 14–16 |

Tras los capítulos vienen cinco temas complementarios (backtesting, costes de transacción, valoración de opciones con árboles binomiales, cointegración y caídas máximas), un proyecto práctico en Python, las soluciones de los ejercicios, un resumen de fórmulas, un glosario y la bibliografía.

### Cómo está construido cada capítulo

Todos los capítulos tienen dos niveles de lectura.

El **primer nivel** es autocontenido y se puede leer sin la parte avanzada. Empieza con *La idea*, donde se explica el concepto con palabras; sigue con *Un ejemplo resuelto*, con números concretos; después, *Formalización* escribe las fórmulas y explica cada símbolo en el propio texto; *Gráfico interactivo* describe una visualización pensada para la versión web del libro, con los controles que permitirán al lector experimentar; *En Python* traduce la idea a unas pocas líneas de código; *En la práctica* cuenta dónde se usa el concepto fuera del aula, y *Ejercicios* propone problemas con soluciones al final del libro.

El **segundo nivel**, la sección **«Ampliación»**, da definiciones formales, derivaciones, supuestos, evidencia empírica y notas históricas, con referencias a la bibliografía. Está escrita para quien quiera estudiar el tema con rigor universitario o preparar un trabajo.

Los ejercicios llevan una etiqueta de dificultad (**básico**, **intermedio** o **avanzado**) y otra de tipo: **cálculo**, cuando hay que llegar a un número, o **reflexión**, cuando hay que razonar. Los términos técnicos aparecen en **negrita** la primera vez que se definen y se recogen en el glosario.

### Requisitos para el código

Los fragmentos de Python usan solo la biblioteca estándar y NumPy. Se pueden copiar en un cuaderno y ejecutar tal cual; cuando un fragmento necesita datos, los genera él mismo.

### Una advertencia sobre los números

Todos los activos, carteras y fondos de los ejemplos son inventados, y todas las series son simuladas. Las cifras sirven para practicar los cálculos y no describen ninguna inversión real. Las referencias bibliográficas y normativas se han revisado, pero conviene consultar la fuente original antes de citarlas.

---

# Parte I · El precio del tiempo

Antes de hablar de riesgo hay que ponerse de acuerdo en cómo se mide una ganancia y en cómo se comparan cantidades de dinero que no llegan en la misma fecha. Esta parte resuelve las dos cuestiones. El capítulo 1 define la rentabilidad en sus dos versiones, simple y logarítmica, y explica por qué conviene tener ambas a mano. El capítulo 2 introduce el interés compuesto y el descuento, la herramienta con la que se valora cualquier flujo de pagos futuro, desde un préstamo hasta un bono.

---

## Capítulo 1 · Medir lo que gana una inversión

> **En este capítulo** aprenderás a calcular la rentabilidad simple y la logarítmica, a encadenar rentabilidades de varios periodos sin cometer el error más común, y a entender por qué una pérdida exige después una ganancia mayor para recuperarse.

### La idea

Saber que una inversión ha ganado 300 € dice poco si no sabemos cuánto se invirtió: no es lo mismo ganar 300 € con 1.000 € que con 100.000 €. Por eso las ganancias se expresan en términos relativos. La **rentabilidad** de un periodo es la variación del valor de la inversión dividida por el valor inicial. Si un activo pasa de valer 40 € a valer 50 €, su rentabilidad es de 10/40, es decir, un 25 %.

Esta medida, la **rentabilidad simple**, es la que entiende todo el mundo, pero tiene una propiedad incómoda: las rentabilidades de periodos consecutivos no se suman. Para encadenarlas hay que multiplicar los factores de crecimiento. Existe una segunda medida, la **rentabilidad logarítmica**, que sí se suma a lo largo del tiempo, y eso la convierte en la favorita de los modelos estadísticos. Para movimientos pequeños las dos casi coinciden; para movimientos grandes, no.

### Un ejemplo resuelto

Una acción cotiza a 40 €. Durante el primer año sube a 50 € y durante el segundo vuelve a 40 €.

- Primer año: $50/40 - 1 = +25\,\%$.
- Segundo año: $40/50 - 1 = -20\,\%$.

Si sumáramos los porcentajes concluiríamos que la inversión ha ganado un 5 % en dos años, pero el precio final es exactamente el inicial: la ganancia real es cero. El cálculo correcto multiplica los factores, $1{,}25 \times 0{,}80 = 1$, y le resta uno.

Con rentabilidades logarítmicas el problema desaparece: $\ln(50/40) = +0{,}2231$ y $\ln(40/50) = -0{,}2231$, que suman exactamente cero.

El ejemplo contiene otra lección: tras una caída del 20 % no basta una subida del 20 % para recuperarse, hace falta un 25 %. En general, para deshacer una pérdida $L$ (en tanto por uno) se necesita una ganancia $L/(1-L)$: un 11,1 % tras perder un 10 %, un 100 % tras perder un 50 % y un 900 % tras perder un 90 %.

### Formalización

Sea $P_0$ el valor de la inversión al principio del periodo y $P_1$ su valor al final. La rentabilidad simple es

$$R = \frac{P_1 - P_0}{P_0} = \frac{P_1}{P_0} - 1,$$

expresada en tanto por uno (0,25 equivale a un 25 %). La rentabilidad logarítmica, o de composición continua, es el logaritmo natural del cociente de valores:

$$r = \ln\frac{P_1}{P_0} = \ln(1 + R).$$

Si una inversión atraviesa $T$ periodos con rentabilidades simples $R_1, \dots, R_T$, su valor final es $P_T = P_0 (1 + R_1)(1 + R_2)\cdots(1 + R_T)$. Tomando logaritmos, el producto se convierte en suma:

$$1 + R_{0,T} = \prod_{t=1}^{T}(1 + R_t), \qquad r_{0,T} = \sum_{t=1}^{T} r_t.$$

Esa es la ventaja práctica de los logaritmos: la rentabilidad logarítmica de un periodo largo es la suma de las rentabilidades logarítmicas de los periodos cortos que lo componen.

### Gráfico interactivo

> **Gráfico interactivo · La asimetría de las pérdidas.** Panel izquierdo: el lector elige con un deslizador una pérdida entre el 0 % y el 90 %, y una curva muestra la ganancia necesaria para recuperarla, $L/(1-L)$, con el punto elegido resaltado y su valor numérico. Panel derecho: la rentabilidad logarítmica $\ln(1+R)$ frente a la simple $R$ para $R$ entre −60 % y +100 %, junto a la diagonal $r = R$; al pasar el cursor se muestra la diferencia entre ambas. Lo que el lector debe observar: cerca de cero las dos medidas casi coinciden, pero la logarítmica queda siempre por debajo de la simple y se separa mucho en movimientos grandes, sobre todo en las caídas.

### En Python

```python
import math

def rentabilidad_simple(p0, p1):
    return p1 / p0 - 1

def rentabilidad_log(p0, p1):
    return math.log(p1 / p0)

precios = [40, 50, 40]
simples = [rentabilidad_simple(a, b) for a, b in zip(precios, precios[1:])]
logs = [rentabilidad_log(a, b) for a, b in zip(precios, precios[1:])]

acumulada = math.prod(1 + r for r in simples) - 1   # 0.0
print(simples, sum(simples))   # [0.25, -0.2] y una suma engañosa de 0.05
print(logs, sum(logs))         # [0.223, -0.223] y una suma de 0.0
```

### En la práctica

- Los documentos informativos de los fondos muestran la rentabilidad de cada año natural por separado, de modo que el inversor pueda ver la secuencia completa y no solo una media.
- Un mismo índice bursátil suele publicarse en dos versiones: la de **precio**, que solo recoge la variación de las cotizaciones, y la de **rentabilidad total**, que además reinvierte los dividendos. A largo plazo la diferencia entre ambas es enorme.
- Los modelos de riesgo y de simulación trabajan casi siempre con rentabilidades logarítmicas, porque se agregan en el tiempo sumando; la teoría de carteras, en cambio, usa rentabilidades simples, que se agregan entre activos promediando (véase la Ampliación).

### Ejercicios

- **1.1** *(básico, cálculo)* Compras participaciones de un fondo a 125 € y un año después valen 110 €. Calcula la rentabilidad simple y la logarítmica. ¿Qué rentabilidad necesita el fondo para volver a 125 €?
- **1.2** *(intermedio, cálculo)* Un activo obtiene +8 %, −5 % y +12 % en tres años consecutivos. Calcula la rentabilidad acumulada y la rentabilidad anual constante que habría producido el mismo resultado. Compárala con la media aritmética de las tres cifras.
- **1.3** *(intermedio, reflexión)* Una cartera invierte la mitad en un activo que gana un 30 % y la otra mitad en uno que pierde un 10 %. ¿Por qué la rentabilidad de la cartera se obtiene promediando las rentabilidades simples y no las logarítmicas?

### Ampliación · Rentabilidades con más rigor

#### Definición general: rentabilidad total

En la práctica, una inversión no solo cambia de precio: también puede pagar dividendos o cupones. Si $P_t$ es el precio al final del periodo $t$ y $D_t$ el flujo de caja cobrado durante el periodo, la **rentabilidad simple total** es

$$R_t = \frac{P_t + D_t - P_{t-1}}{P_{t-1}} = \frac{P_t + D_t}{P_{t-1}} - 1,$$

y la **rentabilidad logarítmica** (o de composición continua) es $r_t = \ln(1 + R_t)$. Las bases de datos profesionales usan precios «ajustados» que ya incorporan dividendos, desdoblamientos (*splits*) y otras operaciones corporativas; calcular rentabilidades con precios sin ajustar es una fuente clásica de errores.

#### Relación entre rentabilidad simple y logarítmica

El desarrollo de Taylor de $\ln(1+x)$ alrededor de $x = 0$ da

$$r = \ln(1+R) = R - \frac{R^2}{2} + \frac{R^3}{3} - \cdots$$

Dos consecuencias importantes:

1. Para movimientos pequeños ($|R| \lesssim 5\,\%$) ambas medidas son casi iguales; la diferencia es de segundo orden, $\approx R^2/2$.
2. Como $\ln(1+x) \le x$ para todo $x > -1$, siempre se cumple $r \le R$, con igualdad solo si $R = 0$.

Además, la rentabilidad simple está acotada inferiormente ($R \ge -1$: no se puede perder más del 100 % sin apalancamiento), mientras que la logarítmica toma valores en toda la recta real ($r \to -\infty$ cuando $R \to -1$). Por eso es coherente modelar $r$ con distribuciones definidas en $\mathbb{R}$, como la normal: si $r \sim \mathcal{N}(\mu, \sigma^2)$, entonces el precio $P_t = P_{t-1}e^{r}$ sigue una distribución **lognormal** y nunca es negativo.

#### Agregación temporal y agregación entre activos

Existe una dualidad muy útil (Campbell, Lo y MacKinlay, 1997, cap. 1):

| | Rentabilidad simple $R$ | Rentabilidad logarítmica $r$ |
|---|---|---|
| A lo largo del tiempo (un activo, $T$ periodos) | se **multiplica**: $1 + R_{0,T} = \prod_{t=1}^{T}(1 + R_t)$ | se **suma**: $r_{0,T} = \sum_{t=1}^{T} r_t$ |
| Entre activos (una cartera, un periodo) | se **promedia**: $R_p = \sum_i w_i R_i$ | no se agrega linealmente: $r_p = \ln\!\big(\sum_i w_i e^{r_i}\big)$ |

Por eso los modelos de series temporales (volatilidad, simulación) suelen trabajar en logaritmos, mientras que la teoría de carteras (capítulos 10 a 13) trabaja con rentabilidades simples.

#### Media aritmética frente a media geométrica

Dada una serie $R_1, \dots, R_T$, la **media aritmética** es $\bar{R} = \frac{1}{T}\sum_t R_t$ y la **media geométrica** es

$$G = \left(\prod_{t=1}^{T}(1+R_t)\right)^{1/T} - 1 = \exp\!\left(\frac{1}{T}\sum_t r_t\right) - 1.$$

Por la desigualdad entre medias aritmética y geométrica, $G \le \bar{R}$, con igualdad solo si todas las rentabilidades son iguales. La media geométrica es la tasa constante que habría producido la misma riqueza final; la aritmética es el mejor estimador de la rentabilidad esperada de *un* periodo. La diferencia entre ambas es precisamente el lastre de la volatilidad (capítulo 9), y confundirlas lleva a sobrestimar la riqueza final. En el ejemplo resuelto del capítulo, +25 % y −20 % tienen media aritmética +2,5 % y media geométrica $\sqrt{1{,}25 \times 0{,}80} - 1 = 0\,\%$.

#### Anualización

Con rentabilidades mensuales, la rentabilidad anual equivalente es $(1 + R_{\text{mes}})^{12} - 1$, o bien $12\,r_{\text{mes}}$ en logaritmos. Multiplicar una rentabilidad simple mensual por 12 es solo una aproximación que, por la desigualdad de Bernoulli $(1+x)^{n} \ge 1 + nx$, siempre queda por debajo del resultado compuesto: con +1 % mensual, $12 \times 1\,\% = 12\,\%$ frente a $1{,}01^{12} - 1 = 12{,}68\,\%$.

#### Rentabilidad nominal, real y en exceso

- **Rentabilidad real** (descontada la inflación $\pi$), por la ecuación de Fisher (1930): $1 + R_{\text{real}} = \dfrac{1 + R_{\text{nom}}}{1 + \pi}$, aproximadamente $R_{\text{real}} \approx R_{\text{nom}} - \pi$. Con un 5 % nominal y un 3 % de inflación, la rentabilidad real exacta es $1{,}05/1{,}03 - 1 = 1{,}94\,\%$.
- **Rentabilidad en exceso**: $R_t - r_{f,t}$, la rentabilidad por encima del activo libre de riesgo; es la magnitud que usan el ratio de Sharpe (capítulo 8) y el CAPM (capítulo 13).

#### Apalancamiento

Si se invierte una fracción $L > 1$ del capital propio financiando el resto a un tipo $r_b$, la rentabilidad sobre el capital es $R_e = L\,R - (L-1)\,r_b$. El apalancamiento multiplica tanto la rentabilidad esperada como la volatilidad, y hace posible $R_e < -1$, es decir, perder más que el capital aportado.

#### Advertencias empíricas

- **Sesgo de supervivencia**: si solo se estudian empresas o fondos que existen hoy, se excluyen los que quebraron o cerraron y las rentabilidades medias quedan sobrestimadas.
- **Frecuencia y ruido**: las rentabilidades de alta frecuencia están contaminadas por la microestructura del mercado (horquilla compra-venta, precios discretos), lo que introduce autocorrelación negativa artificial.

---

## Capítulo 2 · El valor temporal del dinero

> **En este capítulo** aprenderás a capitalizar y descontar cantidades, a distinguir el interés simple del compuesto y a comparar pagos que llegan en fechas diferentes.

### La idea

¿Prefieres 1.000 € hoy o 1.000 € dentro de un año? Casi todo el mundo elige hoy, y con razón: el dinero disponible ahora puede depositarse o invertirse y convertirse en algo más de 1.000 € al cabo del año. Además, la inflación suele erosionar lo que se puede comprar con una cantidad fija. Esta preferencia tiene nombre, **valor temporal del dinero**, y precio: el **tipo de interés**, que indica cuánto crece el dinero por unidad de tiempo.

Cuando los intereses que se cobran se reinvierten y generan a su vez nuevos intereses, se habla de **interés compuesto**. Recorrer el camino al revés, es decir, averiguar qué cantidad de hoy equivale a un pago futuro, se llama **descontar**, y el resultado es el **valor presente** de ese pago. Llevar todos los pagos a la misma fecha es lo que permite compararlos y sumarlos.

### Un ejemplo resuelto

Te ofrecen elegir entre 10.000 € hoy y 11.000 € dentro de tres años. Puedes colocar el dinero a un 4 % anual sin riesgo.

*Mirando hacia delante.* Si aceptas los 10.000 € y los inviertes al 4 % con intereses reinvertidos, dentro de tres años tendrás

$$10\,000 \times 1{,}04^3 = 11\,248{,}64 \text{ €},$$

más que los 11.000 € de la otra opción.

*Mirando hacia atrás.* Los 11.000 € futuros valen hoy

$$\frac{11\,000}{1{,}04^3} = 9\,778{,}96 \text{ €},$$

menos que los 10.000 € disponibles ahora. Las dos maneras de razonar llevan a la misma conclusión: con un tipo del 4 %, la oferta inmediata es mejor. Si el tipo fuera del 3 %, el valor presente de los 11.000 € sería 10.066,56 € y la decisión cambiaría. El tipo de interés no es un detalle: decide.

Fíjate también en la diferencia entre interés simple y compuesto. Con interés simple, 10.000 € al 4 % generarían 400 € anuales, 1.200 € en total. Con interés compuesto se obtienen 1.248,64 €: los 48,64 € de diferencia son intereses cobrados sobre intereses anteriores. En plazos cortos la diferencia es pequeña; en plazos de décadas, domina.

### Formalización

Sea $VP$ una cantidad disponible hoy, $i$ el tipo de interés anual y $T$ el número de años. Con capitalización anual, el valor futuro es

$$VF = VP\,(1 + i)^T,$$

porque cada año el saldo se multiplica por $1 + i$. Despejando, el valor presente de una cantidad $VF$ que se cobrará dentro de $T$ años es

$$VP = \frac{VF}{(1 + i)^T}.$$

El cociente $1/(1+i)^T$ se llama **factor de descuento**: es el valor hoy de un euro pagadero dentro de $T$ años. Con tipos positivos es menor que uno, y se reduce tanto al alargar el plazo como al subir el tipo.

Si en lugar de un solo pago hay varios, $C_1, C_2, \dots, C_T$, al final de cada año, el valor presente del conjunto es la suma de los valores presentes de cada pago:

$$VP = \sum_{t=1}^{T}\frac{C_t}{(1+i)^t}.$$

### Gráfico interactivo

> **Gráfico interactivo · Capitalizar y descontar.** Dos deslizadores controlan el tipo de interés (de −1 % a 10 %) y el horizonte (de 1 a 40 años). Panel izquierdo: evolución de 1.000 € con interés simple (recta) y con interés compuesto (curva), con la diferencia sombreada y etiquetada como «intereses sobre intereses». Panel derecho: el factor de descuento en función del plazo para el tipo elegido, junto a dos curvas de referencia más tenues (el tipo elegido ±2 puntos). Lo que el lector debe observar: el interés compuesto se separa del simple de forma cada vez más rápida, y un tipo más alto reduce mucho el valor actual de los pagos lejanos. Con un tipo negativo, el factor de descuento supera la unidad.

### En Python

```python
def valor_futuro(vp, i, t):
    return vp * (1 + i) ** t

def valor_presente(flujos, i):
    """flujos[0] se cobra dentro de un año, flujos[1] dentro de dos, etc."""
    return sum(c / (1 + i) ** t for t, c in enumerate(flujos, start=1))

print(round(valor_futuro(10_000, 0.04, 3), 2))           # 11248.64
print(round(valor_presente([0, 0, 11_000], 0.04), 2))    # 9778.96
```

### En la práctica

- El precio de un bono es el valor presente de los cupones y del nominal que promete pagar. Cuando los tipos de mercado suben, ese valor presente baja: por eso los precios de los bonos caen cuando suben los tipos.
- En la Unión Europea, la publicidad y los contratos de préstamos a consumidores deben indicar la **tasa anual equivalente** (TAE), que expresa en un único tipo anual compuesto el coste total del crédito, incluidas las comisiones.
- Las aseguradoras europeas descuentan los pagos futuros que esperan hacer a sus asegurados con una curva de tipos sin riesgo que publica la autoridad supervisora europea de seguros (EIOPA), como exige el régimen de Solvencia II.

### Ejercicios

- **2.1** *(básico, cálculo)* Depositas 2.500 € a un 3 % anual con intereses reinvertidos durante cinco años. ¿Cuánto tendrás al final? ¿Qué parte de los intereses procede del interés compuesto?
- **2.2** *(básico, cálculo)* Un premio de 20.000 € se cobrará dentro de cuatro años. ¿Cuánto vale hoy si el tipo de interés es del 6 %? ¿Y si es del 2 %?
- **2.3** *(avanzado, cálculo)* Pides un préstamo de 15.000 € a devolver en cinco cuotas anuales iguales, con un tipo del 5 %. ¿Cuál es la cuota? (Pista: el valor presente de las cinco cuotas debe ser igual al importe prestado; la Ampliación da una fórmula cerrada.)

### Ampliación · El valor temporal del dinero con más rigor

#### Frecuencia de capitalización y composición continua

Si un tipo nominal anual $i$ se capitaliza $m$ veces al año, el valor futuro tras $T$ años es

$$VF = VP\left(1 + \frac{i}{m}\right)^{mT}.$$

Cuando $m \to \infty$, usando $\lim_{m\to\infty}(1 + x/m)^m = e^x$, se obtiene la **composición continua**:

$$VF = VP\,e^{iT}, \qquad VP = VF\,e^{-iT}.$$

El **tipo anual efectivo** (TAE) equivalente es $(1 + i/m)^m - 1$. Para $i = 5\,\%$: con capitalización anual, 5,000 %; mensual, 5,116 %; continua, $e^{0{,}05} - 1 = 5{,}127\,\%$. La composición continua es la convención estándar en la valoración de derivados porque simplifica el cálculo (los factores de descuento se multiplican sumando exponentes).

#### Valor presente de una corriente de flujos

Para flujos $CF_1, \dots, CF_T$ con un tipo de descuento constante $i$:

$$VP = \sum_{t=1}^{T} \frac{C_t}{(1+i)^t}.$$

Usando la suma de una progresión geométrica se obtienen fórmulas cerradas muy usadas:

- **Renta constante (anualidad)** de $C$ durante $T$ periodos: $VP = C\,\dfrac{1 - (1+i)^{-T}}{i}$. Ejemplo: 100 € anuales durante 10 años al 5 % valen hoy 772,17 €.
- **Renta perpetua**: $VP = C/i$ (límite $T \to \infty$).
- **Renta perpetua creciente** a una tasa $g < i$: $VP = \dfrac{C_1}{i - g}$, base del modelo de dividendos de Gordon para valorar acciones.

#### VAN y TIR

El **valor actual neto** de un proyecto con inversión inicial $I_0$ es $\text{VAN} = -I_0 + \sum_t C_t/(1+i)^t$; se acepta si $\text{VAN} > 0$. La **tasa interna de rentabilidad** (TIR) es el tipo $i^*$ que hace $\text{VAN} = 0$. Con flujos que cambian de signo más de una vez, la TIR puede no ser única (regla de los signos de Descartes), por lo que el VAN es el criterio teóricamente preferido.

#### Bonos: precio, rentabilidad a vencimiento, duración y convexidad

El precio de un bono con cupón $c$, nominal $N$ y vencimiento $T$ descontado a su **rentabilidad a vencimiento** (TIR) $y$ es

$$P = \sum_{t=1}^{T} \frac{cN}{(1+y)^t} + \frac{N}{(1+y)^T}.$$

Precio y tipo se mueven en sentido contrario. La sensibilidad se resume con la **duración de Macaulay** (1938) y la **duración modificada**:

$$D = \frac{1}{P}\sum_{t=1}^{T} t\,\frac{C_t}{(1+y)^t}, \qquad D_{\text{mod}} = \frac{D}{1+y}, \qquad \frac{\Delta P}{P} \approx -D_{\text{mod}}\,\Delta y + \tfrac{1}{2}\,\mathcal{C}\,(\Delta y)^2,$$

donde $\mathcal{C} = \frac{1}{P}\frac{\partial^2 P}{\partial y^2}$ es la **convexidad**.

*Ejemplo.* Bono a 3 años, cupón anual del 5 %, nominal 100, $y = 4\,\%$: $P = 102{,}78$; $D = 2{,}86$ años; $D_{\text{mod}} = 2{,}75$; $\mathcal{C} \approx 10{,}4$. Si el tipo sube al 5 %, el precio exacto pasa a 100,00 (−2,70 %); la aproximación con duración y convexidad da −2,70 %, prácticamente exacta.

#### Estructura temporal de tipos

En general, cada plazo tiene su propio tipo de contado $z_t$ y su **factor de descuento** $d(t) = (1 + z_t)^{-t}$. El precio libre de arbitraje de cualquier flujo cierto es $\sum_t C_t\,d(t)$; descontar todo a un único tipo es una simplificación. La curva de tipos se estima a partir de bonos cotizados (por ejemplo, con el modelo de Nelson y Siegel, 1987).

#### Tipos reales y regla del 72

- **Ecuación de Fisher**: $(1 + i_{\text{nom}}) = (1 + i_{\text{real}})(1 + \pi^e)$. Descontar flujos nominales con tipos nominales, o reales con reales, pero nunca mezclar.
- **Tiempo de duplicación**: $T_2 = \ln 2 / \ln(1+i) \approx 0{,}693/i$. La «regla del 72» ($T_2 \approx 72/(100\,i)$) corrige el efecto de la capitalización discreta para tipos habituales: al 6 % da 12 años frente al valor exacto de 11,9.

#### Observación histórica

Entre junio de 2014 y julio de 2022, el tipo de la facilidad de depósito del BCE fue negativo (llegó al −0,50 %), aunque el tipo principal de financiación se quedó en el 0 %, y muchos bonos alemanes cotizaron con rentabilidades negativas. Con $i < 0$ las fórmulas siguen siendo válidas: el factor $(1+i)^{-T}$ es mayor que 1 y un pago futuro vale *más* que el mismo importe hoy, lo que ilustra que el valor temporal del dinero es una consecuencia de los tipos de mercado, no una ley natural.

---

# Parte II · El lenguaje del azar

Los precios futuros son inciertos, así que para razonar sobre ellos necesitamos el vocabulario de la probabilidad. Esta parte reúne las cuatro piezas que se usarán en el resto del libro: la esperanza matemática y la ley de los grandes números (capítulo 3), el paseo aleatorio y la forma en que la incertidumbre crece con el tiempo (capítulo 4), la distribución normal y el teorema central del límite (capítulo 5), y la simulación de Monte Carlo, el laboratorio en el que podremos comprobar todo lo anterior con el ordenador (capítulo 6).

---

## Capítulo 3 · Esperanza y ley de los grandes números

> **En este capítulo** aprenderás a calcular el valor esperado de un resultado incierto, a interpretar qué significa (y qué no) y a entender por qué una ventaja pequeña se convierte en un resultado casi seguro cuando se repite muchas veces.

### La idea

Un resultado incierto, como la ganancia de una apuesta o el pago de un contrato, puede tomar varios valores, cada uno con cierta probabilidad. Su **valor esperado**, o **esperanza**, es la media de esos valores ponderada por sus probabilidades. No es el resultado que vamos a obtener, que puede ser cualquiera de los posibles, sino el resultado medio por intento que observaríamos si pudiéramos repetir la situación muchísimas veces en las mismas condiciones.

Esa interpretación se apoya en la **ley de los grandes números**: al repetir de forma independiente un experimento, la media de los resultados se acerca cada vez más al valor esperado. Por eso un casino, una lotería o una aseguradora pueden planificar con confianza aunque cada jugada o cada póliza individual sea imprevisible: viven de la media, no del caso concreto.

### Un ejemplo resuelto

Una feria propone el siguiente juego: lanzas dos dados; si suman 7, ganas 4 €; si no, pierdes 1 €. ¿Te conviene jugar?

De las 36 combinaciones igualmente probables de dos dados, seis suman 7, así que la probabilidad de ganar es 1/6. El valor esperado de una jugada es

$$\tfrac16 \times (+4) + \tfrac56 \times (-1) = -\tfrac16 \approx -0{,}167 \text{ €}.$$

Cada jugada cuesta, de media, casi 17 céntimos al jugador. Eso no impide que alguien gane durante un rato. Con 10 jugadas, alrededor del 22 % de los jugadores van ganando; con 100 jugadas, el 15 %; con 1.000 jugadas, solo el 0,25 %. A medida que se acumulan las jugadas, la suerte pesa cada vez menos y la media, cada vez más. Para la feria, que juega contra miles de personas, la pérdida media de 1/6 de euro por jugada es prácticamente un ingreso garantizado.

### Formalización

Sea $X$ una variable aleatoria que toma los valores $x_1, x_2, \dots, x_K$ con probabilidades $p_1, p_2, \dots, p_K$, que suman uno. Su valor esperado es

$$E[X] = \sum_{k=1}^{K} p_k\,x_k.$$

Una propiedad que usaremos constantemente es la **linealidad**: para constantes $a$ y $b$ y variables cualesquiera $X$ e $Y$, se cumple $E[aX + bY] = a\,E[X] + b\,E[Y]$. Por ejemplo, la ganancia esperada de 100 jugadas es 100 veces la de una jugada.

La ley de los grandes números dice que si $X_1, X_2, \dots$ son repeticiones independientes de $X$, la media $\bar X_n = (X_1 + \cdots + X_n)/n$ converge a $E[X]$ cuando $n$ crece. La Ampliación precisa en qué sentido y con qué velocidad.

### Gráfico interactivo

> **Gráfico interactivo · El juego de los dos dados.** Un deslizador fija el número de jugadas (de 1 a 5.000) y un botón vuelve a simular. Panel izquierdo: la ganancia acumulada de 50 jugadores simulados, cada uno con su línea, y en trazo grueso la recta de la pérdida esperada, $-n/6$; un contador indica qué porcentaje de jugadores va ganando. Panel derecho: la ganancia media por jugada de un único jugador a lo largo de la secuencia, que oscila mucho al principio y se estabiliza cerca de −0,167 €, dentro de una banda que se estrecha. Lo que el lector debe observar: al principio la dispersión entre jugadores domina; a la larga, la media manda. Un selector permite cambiar el premio (por ejemplo, a 5 € o 6 €) para ver cómo el juego pasa a ser neutro o favorable.

### En Python

```python
import numpy as np

valores = np.array([4.0, -1.0])
probs = np.array([1 / 6, 5 / 6])
esperanza = valores @ probs                      # -0.1667

rng = np.random.default_rng(3)
dados = rng.integers(1, 7, size=(100_000, 2)).sum(axis=1)
ganancias = np.where(dados == 7, 4.0, -1.0)
print(esperanza, ganancias.mean())               # la media simulada se acerca a -1/6
```

### En la práctica

- Una aseguradora parte de la pérdida esperada de cada póliza (probabilidad de siniestro por coste medio) y le añade un recargo para cubrir gastos, beneficio y la posibilidad de que el año salga peor que la media.
- Los juegos de azar comerciales están diseñados para que el valor esperado del jugador sea negativo; esa diferencia es el margen del operador, y la ley de los grandes números lo convierte en un ingreso estable.
- En la valoración de derivados, el precio de un contrato se escribe como un valor esperado descontado de sus pagos, aunque calculado con unas probabilidades especiales, llamadas neutrales al riesgo, que la Ampliación explica.

### Ejercicios

- **3.1** *(básico, cálculo)* Una rifa vende 2.000 papeletas a 3 € cada una y reparte un premio de 1.500 € y diez de 100 €. ¿Cuál es el valor esperado del premio de una papeleta? ¿Y la ganancia neta esperada del comprador? ¿Cuánto ingresa el organizador?
- **3.2** *(intermedio, cálculo)* La probabilidad de que te roben la bicicleta en un año es del 4 % y reponerla cuesta 900 €. Calcula la pérdida esperada. Si un seguro anual cuesta 45 €, ¿qué recargo aplica la aseguradora sobre la pérdida esperada? ¿Por qué puede ser razonable contratarlo de todos modos?
- **3.3** *(avanzado, reflexión)* Te ofrecen un juego con una moneda equilibrada: si sale cara, tu patrimonio se multiplica por 2,2; si sale cruz, lo pierdes todo. El valor esperado es positivo. ¿Apostarías todo tu patrimonio una vez? ¿Y diez veces seguidas? ¿Qué te dice esto sobre los límites del valor esperado como criterio de decisión?

### Ampliación · Valor esperado con más rigor

#### Definición formal

Para una variable aleatoria discreta con valores $x_k$ y probabilidades $p_k$, $E[X] = \sum_k p_k x_k$, siempre que la serie converja absolutamente. Para una variable continua con densidad $f$, $E[X] = \int_{-\infty}^{\infty} x\,f(x)\,dx$. En la axiomática de Kolmogórov (1933), la esperanza es la integral de Lebesgue de $X$ respecto a la medida de probabilidad.

#### Propiedades fundamentales

1. **Linealidad**: $E[aX + bY] = aE[X] + bE[Y]$, *sin* necesidad de independencia. Es la razón de que la rentabilidad esperada de una cartera sea la media ponderada de las rentabilidades esperadas (capítulo 12).
2. **Producto**: $E[XY] = E[X]E[Y]$ solo si $X$ e $Y$ son incorreladas (en particular, si son independientes). En general $E[XY] = E[X]E[Y] + \operatorname{Cov}(X,Y)$.
3. **Desigualdad de Jensen** (1906): si $g$ es convexa, $E[g(X)] \ge g(E[X])$; si es cóncava, al revés. Con $g = \ln$ (cóncava): $E[\ln(1+R)] \le \ln(1 + E[R])$, es decir, la rentabilidad logarítmica esperada es menor que el logaritmo de la rentabilidad esperada. Este es el fundamento matemático del lastre de la volatilidad (capítulo 9) y del criterio de Kelly (capítulo 14).
4. **Esperanza condicionada y ley de la esperanza total**: $E[X] = E\big[E[X \mid Y]\big]$. Un proceso $(X_t)$ es una **martingala** si $E[X_{t+1} \mid \mathcal{F}_t] = X_t$: la mejor predicción del valor futuro es el valor actual. Es el modelo matemático de un juego justo y de un precio «impredecible».

#### Leyes de los grandes números

Sean $X_1, X_2, \dots$ independientes e idénticamente distribuidas con media $\mu$ y $\bar{X}_n = \frac1n \sum_{i=1}^n X_i$.

- **Ley débil** (Jakob Bernoulli, 1713, para el caso binario): para todo $\varepsilon > 0$, $P(|\bar{X}_n - \mu| > \varepsilon) \to 0$. Si además la varianza $\sigma^2$ es finita, la desigualdad de Chebyshov da una cota explícita: $P(|\bar{X}_n - \mu| > \varepsilon) \le \dfrac{\sigma^2}{n\varepsilon^2}$.
- **Ley fuerte** (Kolmogórov): $\bar{X}_n \to \mu$ casi seguramente, bastando $E|X| < \infty$.

La hipótesis de media finita es esencial: para una distribución de Cauchy la media muestral de $n$ observaciones tiene la *misma* distribución que una sola observación y nunca converge.

*Ejemplo: por qué el casino no pierde.* En la ruleta europea hay 37 casillas, 18 de ellas rojas, así que una apuesta de 1 € al rojo tiene un valor esperado de $18/37 - 19/37 = -1/37$ € para el jugador. En un millón de apuestas así, la ganancia esperada del casino es $10^6/37 \approx 27\,027$ €. La varianza de una apuesta es $1 - (1/37)^2 \approx 0{,}9993$, así que la desviación típica del total es $\sqrt{10^6 \times 0{,}9993} \approx 1\,000$ €. El beneficio esperado está a unas 27 desviaciones típicas de cero: la probabilidad de que el casino pierda es despreciable. En la ruleta americana, con doble cero, la ventaja de la casa sube a $2/38 = 5{,}26\,\%$.

#### Límites del valor esperado: la paradoja de San Petersburgo

Se lanza una moneda hasta que sale cara; si ocurre en el lanzamiento $k$, se cobran $2^k$ €. El valor esperado es $\sum_{k\ge1} 2^{-k}\,2^k = \infty$, y sin embargo nadie pagaría una gran suma por jugar. Daniel Bernoulli (1738) propuso evaluar las apuestas por su **utilidad esperada** $E[u(W)]$ con una utilidad cóncava como $u(W) = \ln W$: con ella el juego tiene un valor finito. Esta idea, formalizada por von Neumann y Morgenstern (1944), sustenta la teoría moderna de la decisión con riesgo y explica la aversión al riesgo: un inversor con utilidad cóncava prefiere un resultado seguro a una lotería con el mismo valor esperado.

#### Valoración por esperanza: probabilidades neutrales al riesgo

En finanzas, el precio de un derivado *no* es la esperanza descontada de su pago bajo las probabilidades reales $P$, sino bajo una medida **neutral al riesgo** $Q$:

$$V_0 = e^{-rT}\,E^{Q}[\text{pago}_T].$$

El teorema fundamental de valoración de activos (Harrison y Kreps, 1979; Harrison y Pliska, 1981) establece que la ausencia de arbitraje equivale a la existencia de tal medida $Q$, bajo la cual los precios descontados son martingalas. La equivalencia es exacta con un número finito de estados y fechas; en tiempo discreto general la demostraron Dalang, Morton y Willinger (1990), y en tiempo continuo hace falta una condición algo más fuerte, la de «ningún almuerzo gratis con riesgo evanescente» (NFLVR; Delbaen y Schachermayer, 1994). La medida $Q$ es única solo si el mercado es completo. El tema complementario C muestra el caso más sencillo, el árbol binomial. Cuando el apartado «En la práctica» dice que el precio de un derivado es un valor esperado descontado, debe entenderse en este sentido.

#### Seguros

Una aseguradora fija la prima como $\text{prima} = (1 + \theta)\,E[\text{siniestros}]$, donde $\theta > 0$ es el recargo de seguridad. Con muchas pólizas independientes, la ley de los grandes números hace que el resultado agregado se acerque al esperado; el riesgo residual proviene sobre todo de los siniestros **correlacionados** (catástrofes), que la diversificación no elimina (véase el capítulo 11).

---

## Capítulo 4 · Paseos aleatorios y la raíz del tiempo

> **En este capítulo** aprenderás a modelar un precio como una suma de pasos aleatorios, a distinguir la tendencia de fondo del ruido y a calcular cómo crece la incertidumbre con el horizonte temporal.

### La idea

Imagina un precio que cada día sube o baja una cantidad que se decide lanzando una moneda. Esa construcción, un **paseo aleatorio**, es el modelo más sencillo de la evolución de un precio, y aun así reproduce algo que sorprende a casi todo el mundo: las gráficas generadas por puro azar muestran rachas, «tendencias» y «soportes» que parecen tener significado y no lo tienen. Cada **trayectoria** posible es una historia distinta escrita por la misma moneda.

Si la moneda está ligeramente sesgada, el paseo tiene una **deriva**: una tendencia media por paso. A corto plazo la deriva queda oculta por el ruido; a largo plazo acaba imponiéndose. Entender por qué exige una segunda idea, quizá la más útil de esta parte del libro: la dispersión de un paseo aleatorio no crece en proporción al tiempo, sino en proporción a su **raíz cuadrada**. Si se cuadruplica el horizonte, la incertidumbre solo se duplica. La razón es que, cuando los pasos son **independientes** entre sí, las subidas y las bajadas se compensan en parte.

### Un ejemplo resuelto

Un precio empieza en 20 € y cada día sube o baja 1 €, con la misma probabilidad. ¿Dónde puede estar al cabo de seis días?

Hay $2^6 = 64$ secuencias de subidas y bajadas igualmente probables. Si hay $k$ subidas y $6-k$ bajadas, el precio final es $20 + k - (6-k) = 14 + 2k$. Contando cuántas secuencias tienen cada número de subidas (son los números combinatorios $\binom{6}{k}$):

| Subidas | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| Precio final (€) | 14 | 16 | 18 | 20 | 22 | 24 | 26 |
| Secuencias | 1 | 6 | 15 | 20 | 15 | 6 | 1 |
| Probabilidad | 1,6 % | 9,4 % | 23,4 % | 31,3 % | 23,4 % | 9,4 % | 1,6 % |

El resultado más probable es volver a 20 €, pero solo ocurre en el 31,3 % de los casos. Los extremos son posibles, aunque raros.

¿Cómo de lejos suele alejarse el precio de su punto de partida? Cada paso tiene una desviación típica de 1 €, y la desviación típica tras $n$ pasos es $\sqrt{n}$ euros: 4 € tras 16 días, 8 € tras 64 días y 16 € tras 256 días. Multiplicar por 16 el horizonte solo multiplica por 4 la dispersión.

La misma regla sirve para rentabilidades. Si una acción tiene una volatilidad diaria del 1,2 % y sus rentabilidades diarias son independientes, su volatilidad semanal (5 sesiones) es $1{,}2\,\% \times \sqrt{5} = 2{,}68\,\%$; la mensual (21 sesiones), $1{,}2\,\% \times \sqrt{21} = 5{,}50\,\%$, y la anual (252 sesiones), $1{,}2\,\% \times \sqrt{252} = 19{,}05\,\%$.

### Formalización

Sea $S_0$ el valor inicial y $X_1, X_2, \dots$ los pasos, independientes y con la misma distribución, de media $\mu$ y desviación típica $\sigma$. El paseo aleatorio es

$$S_n = S_0 + X_1 + X_2 + \cdots + X_n.$$

Por la linealidad de la esperanza (capítulo 3), su valor esperado avanza la deriva en cada paso:

$$E[S_n] = S_0 + n\,\mu.$$

Para medir la dispersión usamos la **varianza**, la media del cuadrado de la distancia a la media, $\operatorname{Var}(X) = E\big[(X - E[X])^2\big]$, y su raíz cuadrada, la **desviación típica** $\sigma$, que tiene las mismas unidades que $X$. Cuando los pasos son independientes, la varianza de la suma es la suma de las varianzas:

$$\operatorname{Var}(S_n - S_0) = n\,\sigma^2 \qquad\Longrightarrow\qquad \sigma_n = \sigma\sqrt{n}.$$

Esta es la **regla de la raíz del tiempo** (también llamada regla de la raíz cuadrada). Comparando las dos fórmulas se entiende la pugna entre tendencia y ruido: la deriva acumulada crece como $n$ y el ruido como $\sqrt{n}$, de modo que su cociente, $\sqrt{n}\,\mu/\sigma$, crece con el horizonte. A corto plazo manda el ruido; a largo plazo, la deriva.

### Gráfico interactivo

> **Gráfico interactivo · El abanico del azar.** Controles: probabilidad de subida (de 0,40 a 0,60), número de pasos (hasta 1.000) y número de trayectorias (de 1 a 500). Panel izquierdo: las trayectorias simuladas, con la recta de la deriva $S_0 + n\mu$ y las bandas de ±1 y ±2 desviaciones típicas, $\pm\sigma\sqrt{n}$ y $\pm2\sigma\sqrt{n}$, que se abren como un abanico. Con una sola trayectoria, el lector verá rachas que parecen tendencias. Panel derecho: la desviación típica observada entre trayectorias en función de $n$, en ejes logarítmicos, junto a una recta de pendiente 1/2. Lo que el lector debe observar: la nube de trayectorias se ensancha cada vez más despacio, y los puntos del panel derecho se alinean con la pendiente 1/2, la firma de la raíz del tiempo.

### En Python

```python
import numpy as np

rng = np.random.default_rng(11)
pasos = rng.choice([-1, 1], size=(2_000, 256))      # 2.000 trayectorias de 256 pasos
trayectorias = 20 + pasos.cumsum(axis=1)

for n in (16, 64, 256):
    dispersion = trayectorias[:, n - 1].std()
    print(n, round(dispersion, 2), np.sqrt(n))       # la dispersión se parece a la raíz de n
```

### En la práctica

- Los modelos clásicos de valoración de opciones suponen que el logaritmo del precio sigue un paseo aleatorio con deriva en tiempo continuo, el movimiento browniano geométrico.
- Los departamentos de riesgos convierten volatilidades diarias en semanales, mensuales o anuales multiplicando por la raíz del número de sesiones. La normativa bancaria ha permitido durante años pasar así de un riesgo a un día a un riesgo a diez días, y la Ampliación discute cuándo esa conversión es engañosa.
- Desde mediados del siglo XX, contrastar si los precios reales se comportan como un paseo aleatorio es una de las líneas de investigación centrales de la economía financiera.

### Ejercicios

- **4.1** *(básico, cálculo)* En el paseo del ejemplo resuelto, supón que la probabilidad de subida es 0,6 y que se observan cinco días. ¿Cuál es el precio esperado al final? ¿Cuál es la probabilidad de terminar por encima de 20 €?
- **4.2** *(básico, cálculo)* Una acción tiene una volatilidad anual del 25 %. Suponiendo rentabilidades diarias independientes y 252 sesiones al año, ¿cuál es su volatilidad mensual (21 sesiones) y su volatilidad diaria?
- **4.3** *(intermedio, cálculo)* Una estrategia gana de media un 0,05 % diario con una desviación típica diaria del 1 %. ¿Cuántas sesiones hacen falta para que la ganancia esperada acumulada iguale a una desviación típica del resultado acumulado? Suponiendo normalidad, ¿qué probabilidad hay de que, tras ese número de sesiones, el resultado acumulado sea negativo?
- **4.4** *(avanzado, reflexión)* En un paseo simulado con una moneda equilibrada, un analista observa que durante los últimos 300 días el precio ha pasado más del 95 % del tiempo por encima de su nivel inicial y concluye que «tiene una tendencia alcista». ¿Es un resultado tan raro como parece? (Pista: consulta la ley del arcoseno en la Ampliación.)

### Ampliación · El paseo aleatorio y la regla de la raíz cuadrada con más rigor

#### Definición y momentos

Sean $X_1, X_2, \dots$ variables independientes con $P(X_i = +1) = p$ y $P(X_i = -1) = q = 1 - p$. El **paseo aleatorio simple** es $S_n = S_0 + \sum_{i=1}^n X_i$. Como $E[X_i] = p - q = 2p - 1$ y $\operatorname{Var}(X_i) = 1 - (2p-1)^2 = 4pq$,

$$E[S_n] = S_0 + n(2p - 1), \qquad \operatorname{Var}(S_n) = 4npq.$$

Si $k$ es el número de pasos hacia arriba, $k \sim \text{Binomial}(n, p)$ y $S_n = S_0 + 2k - n$, de modo que

$$P(S_n = S_0 + 2k - n) = \binom{n}{k} p^k q^{\,n-k}.$$

Con $n = 6$ y $p = 1/2$ se obtienen las probabilidades $1, 6, 15, 20, 15, 6, 1$ sobre 64 del ejemplo resuelto del capítulo. El paseo es simétrico si $p = 1/2$; entonces $(S_n)$ es una martingala.

#### Resultados clásicos

- **Recurrencia** (Pólya, 1921): el paseo simétrico en una o dos dimensiones vuelve a su origen con probabilidad 1; en tres o más dimensiones, no. Sin embargo, en una dimensión el tiempo esperado de retorno es infinito.
- **Ruina del jugador**: partiendo de $i$ con barreras absorbentes en 0 y $a$, la probabilidad de alcanzar $a$ antes que 0 es
$$P_i = \begin{cases} i/a, & p = 1/2,\\[4pt] \dfrac{1 - (q/p)^i}{1 - (q/p)^a}, & p \neq 1/2. \end{cases}$$
*Ejemplo:* con 10 fichas, apostando al rojo ($p = 18/37$) hasta llegar a 20 o arruinarse, la probabilidad de éxito es solo del 36,8 %, frente al 50 % de un juego justo. Una pequeña ventaja en contra, repetida, pesa mucho.
- **Ley del arcoseno** (Lévy; Feller, 1968, cap. III): en un paseo simétrico largo, la fracción de tiempo $F$ que pasa por encima del origen tiene, en el límite, densidad $\frac{1}{\pi\sqrt{x(1-x)}}$ en $(0,1)$ y función de distribución $P(F \le x) = \frac{2}{\pi}\arcsin\sqrt{x}$. Su forma de U significa que lo *típico* es pasar casi todo el tiempo de un lado: $P(F < 0{,}1) + P(F > 0{,}9) = \frac{4}{\pi}\arcsin\sqrt{0{,}1} \approx 41\,\%$. Del mismo modo, $P(F > 0{,}95) = 1 - \frac{2}{\pi}\arcsin\sqrt{0{,}95} \approx 14\,\%$, la cifra que usa la solución del ejercicio 4.4. Por eso las «tendencias» largas no son prueba de nada.

#### Del paseo aleatorio al movimiento browniano

Si se reescalan los pasos (tamaño $\sigma\sqrt{\Delta t}$ cada $\Delta t$) y se hace $\Delta t \to 0$, el paseo converge en distribución a un **movimiento browniano** $W_t$ (teorema de Donsker): un proceso continuo con incrementos independientes y $W_t - W_s \sim \mathcal{N}(0, t-s)$. Para precios se usa el paseo **multiplicativo** sobre logaritmos, cuyo límite es el **movimiento browniano geométrico**:

$$dS_t = \mu S_t\,dt + \sigma S_t\,dW_t \quad\Longrightarrow\quad S_t = S_0 \exp\!\Big(\big(\mu - \tfrac{1}{2}\sigma^2\big)t + \sigma W_t\Big),$$

modelo base de Black y Scholes (1973). El término $-\frac12\sigma^2$ es, de nuevo, el lastre de la volatilidad (capítulo 9) y surge del lema de Itô.

#### Historia e hipótesis de mercado eficiente

Louis Bachelier (1900) modeló por primera vez los precios de la Bolsa de París como un paseo aleatorio, cinco años antes del trabajo de Einstein sobre el movimiento browniano. Karl Pearson acuñó el término *random walk* en una carta a *Nature* (1905). Samuelson (1965) demostró que los precios «correctamente anticipados» fluctúan como una martingala, y Fama (1970) sistematizó la **hipótesis de los mercados eficientes**: si los precios incorporan toda la información disponible, sus cambios futuros son impredecibles con esa información.

Campbell, Lo y MacKinlay (1997, cap. 2) distinguen tres hipótesis de fuerza decreciente: **RW1**, incrementos i.i.d. (paseo aleatorio en sentido estricto); **RW2**, incrementos independientes pero no necesariamente idénticos (admite volatilidad cambiante), y **RW3**, incrementos solo incorrelados. La hipótesis de **martingala** (cambios impredecibles en media) queda entre RW2 y RW3: implica incorrelación, pero no independencia. Lo y MacKinlay (1988) propusieron el **test del cociente de varianzas**,

$$VR(q) = \frac{\operatorname{Var}\big(r_t + r_{t-1} + \cdots + r_{t-q+1}\big)}{q\,\operatorname{Var}(r_t)},$$

que vale 1 bajo el paseo aleatorio (por la regla de la raíz cuadrada que se estudia a continuación). Con datos semanales de EE. UU. de 1962 a 1985 encontraron $VR(q) > 1$ de forma significativa, sobre todo en carteras de empresas pequeñas, y rechazaron el paseo aleatorio estricto. La evidencia moderna (Cont, 2001) indica que las rentabilidades están prácticamente incorreladas a partir de unos minutos, pero **no** son independientes: sus valores absolutos y sus cuadrados sí están autocorrelados (agrupamiento de volatilidad), un hecho que el paseo aleatorio i.i.d. no recoge.

#### La varianza de una suma (fórmula de Bienaymé)

Para variables cualesquiera con varianza finita,

$$\operatorname{Var}\!\left(\sum_{i=1}^n X_i\right) = \sum_{i=1}^n \operatorname{Var}(X_i) + 2\sum_{i<j}\operatorname{Cov}(X_i, X_j).$$

Si las $X_i$ están **incorreladas** (no hace falta independencia) y tienen la misma varianza $\sigma^2$, los términos cruzados desaparecen y $\operatorname{Var}(S_n) = n\sigma^2$, de donde $\sigma_n = \sigma\sqrt{n}$. Esa es exactamente la hipótesis que necesita la regla de la raíz cuadrada.

#### Qué ocurre con autocorrelación

Si las rentabilidades de un periodo tienen autocorrelaciones $\rho_k = \operatorname{Corr}(r_t, r_{t-k})$, la varianza de la suma de $q$ periodos es

$$\operatorname{Var}\!\left(\sum_{t=1}^{q} r_t\right) = q\,\sigma^2\left[1 + 2\sum_{k=1}^{q-1}\left(1 - \frac{k}{q}\right)\rho_k\right].$$

Con autocorrelación positiva (tendencias, precios «suavizados» como los de activos inmobiliarios o capital riesgo), la regla de la raíz cuadrada **subestima** el riesgo a largo plazo; con autocorrelación negativa (reversión a la media) lo sobrestima. *Ejemplo:* con $\rho_1 = 0{,}1$ y el resto nulas, para $q = 10$ el corchete vale $1 + 2 \times 0{,}9 \times 0{,}1 = 1{,}18$ y la desviación típica a 10 días es un 8,6 % mayor que $\sigma\sqrt{10}$. Este cociente es precisamente el $VR(q)$ de Lo y MacKinlay visto más arriba.

#### Media frente a dispersión: el horizonte temporal

La media crece linealmente con el horizonte ($\mu T$) y la desviación típica con su raíz ($\sigma\sqrt{T}$). Bajo un modelo normal para las rentabilidades logarítmicas, la probabilidad de terminar con pérdidas tras $T$ años es

$$P(\text{pérdida}) = \Phi\!\left(-\frac{\mu}{\sigma}\sqrt{T}\right).$$

Con $\mu = 8\,\%$ y $\sigma = 16\,\%$: 30,9 % a 1 año, 5,7 % a 10 años y 0,3 % a 30 años. Pero esto **no** implica que el riesgo desaparezca con el tiempo: la *magnitud* de las posibles pérdidas sigue creciendo con $\sqrt{T}$. Samuelson (1963) mostró que repetir una apuesta que no se aceptaría una vez no la vuelve aceptable por el mero hecho de repetirla (la «falacia de los grandes números»), un debate conocido como la *diversificación temporal*.

#### Escalado en la regulación y sus límites

La enmienda de Basilea de 1996 sobre riesgo de mercado permitía obtener el VaR a 10 días multiplicando el VaR diario por $\sqrt{10}$. Este escalado es correcto solo para rentabilidades i.i.d. normales con media cero. Con colas gruesas y agrupamiento de volatilidad (capítulos 7 y 15) el escalado de los *cuantiles* extremos puede ser bastante distinto: Danielsson y Zigrand (2006) muestran que la regla de la raíz cuadrada puede infravalorar el riesgo en horizontes largos cuando hay saltos. Aun así, el marco revisado de riesgo de mercado (FRTB, capítulo 16) sigue usando este escalado para pasar del horizonte base de 10 días a los **horizontes de liquidez** (de 10 a 120 días) de cada factor de riesgo.

#### Generalización: el exponente de Hurst

De forma general, si $\sigma_T \propto T^{H}$, el exponente $H$ resume la memoria del proceso: $H = 1/2$ para un paseo aleatorio, $H > 1/2$ para procesos persistentes y $H < 1/2$ para antipersistentes. Mandelbrot y Van Ness (1968) introdujeron el **movimiento browniano fraccionario** para modelar $H \neq 1/2$. La evidencia sobre las rentabilidades bursátiles es, en general, compatible con $H \approx 1/2$. Para la volatilidad se habló durante años de memoria larga ($H > 1/2$); desde Gatheral, Jaisson y Rosenbaum (2018) la visión dominante es la de la **volatilidad rugosa**: el logaritmo de la volatilidad se comporta como un movimiento browniano fraccionario con $H \approx 0{,}1$, mucho más irregular que un paseo aleatorio, y la apariencia de memoria larga puede ser un efecto de esa rugosidad. Los estimadores clásicos de $H$ (como el R/S de Hurst) están sesgados en muestras finitas y conviene interpretarlos con cautela.

#### Nota sobre estimadores

La varianza muestral insesgada divide por $n - 1$ (corrección de Bessel), $s^2 = \frac{1}{n-1}\sum_i (x_i - \bar{x})^2$, porque al estimar la media con los mismos datos se pierde un grado de libertad. Aun así, $s$ (la raíz) es un estimador ligeramente sesgado de $\sigma$; la diferencia es irrelevante con muestras largas.

---

## Capítulo 5 · La distribución normal y el teorema central del límite

> **En este capítulo** aprenderás por qué la campana de Gauss aparece en tantos contextos, a calcular probabilidades con ella y a reconocer las condiciones en que deja de ser un buen modelo.

### La idea

Lanza un dado: todos los resultados del 1 al 6 son igual de probables, y el histograma es plano. Lanza dos y suma: el 7 es el resultado más frecuente y los extremos (2 y 12) son raros, así que el histograma tiene forma de tejado. Lanza diez y suma: el histograma ya tiene una forma de campana casi perfecta. No importa que cada dado tenga una distribución plana: la suma de muchos efectos aleatorios pequeños e independientes tiende siempre a la misma forma, la **distribución normal** o **campana de Gauss**. Este resultado es el **teorema central del límite**, y explica por qué la normal aparece en errores de medida, en alturas de personas y, como primera aproximación, en rentabilidades acumuladas a lo largo de muchos días.

La normal queda descrita por dos números: su media, que marca el centro, y su desviación típica, que marca la anchura. La mayor parte de la probabilidad se concentra cerca de la media y cae muy deprisa al alejarse: las **colas**, las zonas de valores extremos, son finas.

### Un ejemplo resuelto

Supón que la rentabilidad mensual de un índice sigue una normal con media 0,7 % y desviación típica 4,5 %. ¿Con qué frecuencia cabe esperar un mes peor que −5 %?

El primer paso es **tipificar**: medir la distancia a la media en desviaciones típicas,

$$z = \frac{-5 - 0{,}7}{4{,}5} = -1{,}27.$$

La tabla de la normal estándar (o el ordenador) da $P(Z < -1{,}27) \approx 10{,}3\,\%$: aproximadamente uno de cada diez meses. ¿Y qué intervalo contiene el 95 % de los meses? Para una normal, el 95 % central de la probabilidad queda a menos de 1,96 desviaciones típicas de la media, así que el intervalo va de $0{,}7 - 1{,}96 \times 4{,}5 = -8{,}1\,\%$ a $0{,}7 + 1{,}96 \times 4{,}5 = 9{,}5\,\%$.

Conviene memorizar tres referencias: en una normal, alrededor del 68 % de los valores quedan a menos de una desviación típica de la media, el 95 % a menos de dos y el 99,7 % a menos de tres.

### Formalización

Una variable $X$ sigue una distribución normal de media $\mu$ y desviación típica $\sigma$, lo que se escribe $X \sim \mathcal{N}(\mu, \sigma^2)$, si su densidad es

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right).$$

La densidad no da probabilidades directamente: la probabilidad de que $X$ caiga en un intervalo es el área bajo la curva en ese intervalo. Si se tipifica, $Z = (X - \mu)/\sigma$ sigue una normal estándar, con media 0 y desviación típica 1, cuya función de distribución $\Phi(z) = P(Z \le z)$ está tabulada:

$$P(X \le x) = \Phi\!\left(\frac{x - \mu}{\sigma}\right).$$

El teorema central del límite, en su versión más sencilla, afirma que si $X_1, \dots, X_n$ son independientes, con la misma distribución, media $\mu$ y varianza finita $\sigma^2$, la suma tipificada

$$\frac{X_1 + \cdots + X_n - n\mu}{\sigma\sqrt{n}}$$

se parece cada vez más a una normal estándar cuando $n$ crece, sea cual sea la distribución de partida. Observa que la escala $\sigma\sqrt{n}$ es la de la regla de la raíz del tiempo del capítulo 4.

### Gráfico interactivo

> **Gráfico interactivo · Nace una campana.** Panel izquierdo: un tablero de Galton animado, con un deslizador para el número de filas de clavos (de 4 a 20, 10 por defecto); las bolas caen, rebotan a izquierda o derecha con probabilidad 1/2 y se acumulan en casillas, mientras se dibuja encima la curva normal correspondiente. Panel derecho: el histograma de la suma de $k$ dados, con $k$ elegido por el lector entre 1 y 30, y la normal de igual media y varianza superpuesta. Un tercer control permite sustituir los dados por una distribución muy asimétrica (por ejemplo, un premio raro y grande) para comprobar que la convergencia existe pero es más lenta. Lo que el lector debe observar: con pocos sumandos la forma depende de la distribución de partida; con muchos, todas acaban pareciendo campanas.

### En Python

```python
from statistics import NormalDist

mensual = NormalDist(mu=0.7, sigma=4.5)
print(mensual.cdf(-5))                       # probabilidad de un mes peor que -5 %: 0.103
print(mensual.inv_cdf(0.025), mensual.inv_cdf(0.975))   # intervalo central del 95 %

z = NormalDist()
for k in (1, 2, 3):
    print(k, z.cdf(k) - z.cdf(-k))           # 0.683, 0.954, 0.997
```

### En la práctica

- Muchos modelos de riesgo de primera generación suponen rentabilidades normales, porque con esa hipótesis bastan la media, las volatilidades y las correlaciones para describir todo el riesgo de una cartera.
- Los controles estadísticos de calidad, las encuestas y los intervalos de confianza de cualquier estimación usan la normal a través del teorema central del límite; en finanzas, eso incluye el error de las simulaciones de Monte Carlo (capítulo 6).
- Los gestores de riesgos usan la normal como vara de medir para juzgar lo inusual que es un movimiento («una caída de cuatro desviaciones típicas»), sabiendo que en los mercados reales los extremos son bastante más frecuentes de lo que la normal predice (capítulo 15).

### Ejercicios

- **5.1** *(básico, cálculo)* La rentabilidad anual de una cartera sigue una normal con media 6 % y desviación típica 15 %. ¿Qué proporción de años cabe esperar con rentabilidad negativa?
- **5.2** *(intermedio, cálculo)* Con la misma cartera, calcula la probabilidad de un año peor que −15 % y el intervalo centrado en la media que contiene el 95 % de los años.
- **5.3** *(intermedio, cálculo)* Lanzas 12 dados y sumas los resultados. Usa el teorema central del límite para aproximar la probabilidad de que la suma sea 50 o más. (Un dado tiene media 3,5 y varianza 35/12.)
- **5.4** *(avanzado, reflexión)* Un compañero afirma: «Como el teorema central del límite garantiza la normalidad, el modelo normal es adecuado para medir el riesgo de pérdida de un solo día». ¿Qué objeciones le harías?

### Ampliación · La distribución normal con más rigor

#### El teorema central del límite

**Teorema (Lindeberg–Lévy).** Sean $X_1, X_2, \dots$ i.i.d. con media $\mu$ y varianza $0 < \sigma^2 < \infty$. Entonces

$$\frac{\sqrt{n}\,(\bar{X}_n - \mu)}{\sigma} \xrightarrow{\;d\;} \mathcal{N}(0, 1).$$

La versión de Lindeberg (1922) permite variables no idénticas siempre que ninguna domine la suma. La velocidad de convergencia la acota el **teorema de Berry–Esseen** (Berry, 1941; Esseen, 1942): si $\rho = E|X - \mu|^3 < \infty$,

$$\sup_x \big|F_n(x) - \Phi(x)\big| \le \frac{C\,\rho}{\sigma^3\sqrt{n}},$$

con una constante $C < 0{,}48$ (Shevtsova, 2011). Las distribuciones muy asimétricas o con colas gruesas convergen más despacio.

**Historia.** De Moivre (1733) obtuvo la curva normal como límite de la binomial, Laplace la generalizó (1812) y Gauss (1809) la usó como ley de los errores de medida. El tablero de clavos del gráfico interactivo es la **máquina de Galton** (1889): con 10 filas, la casilla final de cada bola sigue una binomial $\text{Bin}(10, 1/2)$, que el teorema de De Moivre–Laplace aproxima por $\mathcal{N}(5;\ 2{,}5)$.

#### Propiedades de la distribución normal

- Queda determinada por dos parámetros, $\mu$ y $\sigma^2$; su asimetría es 0 y su curtosis 3 (capítulo 15).
- Es **estable**: la suma de normales independientes es normal, $\mathcal{N}(\mu_1, \sigma_1^2) + \mathcal{N}(\mu_2, \sigma_2^2) = \mathcal{N}(\mu_1 + \mu_2, \sigma_1^2 + \sigma_2^2)$.
- **Tipificación**: si $X \sim \mathcal{N}(\mu, \sigma^2)$, $Z = (X - \mu)/\sigma \sim \mathcal{N}(0,1)$, con función de distribución $\Phi$. Cuantiles útiles: $\Phi^{-1}(0{,}95) = 1{,}645$; $\Phi^{-1}(0{,}975) = 1{,}960$; $\Phi^{-1}(0{,}99) = 2{,}326$; $\Phi^{-1}(0{,}995) = 2{,}576$.
- En la **normal multivariante**, la matriz de covarianzas describe por completo la dependencia: incorrelación equivale a independencia. Fuera de la normal esto deja de ser cierto (capítulo 10).

#### La distribución lognormal

Si las rentabilidades logarítmicas son normales, $\ln(S_T/S_0) \sim \mathcal{N}(m, s^2)$, el precio es lognormal con

$$E[S_T] = S_0\,e^{m + s^2/2}, \qquad \text{mediana}(S_T) = S_0\,e^{m}.$$

La media supera a la mediana: la distribución de la riqueza futura es asimétrica a la derecha, y un inversor típico (el mediano) obtiene menos que la media. Esta distinción reaparece en los capítulos 6, 9 y 14.

#### Cuándo falla la campana

El TCL requiere varianza finita y una dependencia débil. Si la varianza es infinita, las sumas normalizadas convergen a una **distribución estable de Lévy** no gaussiana; Mandelbrot (1963) propuso este modelo para los precios del algodón. Hoy se sabe que las rentabilidades diarias tienen varianza finita pero colas de tipo potencia con un índice de cola $\alpha$ que la mayoría de estudios sitúa entre 2 y 5, con valores típicos cercanos a 3 para acciones e índices (la «ley cúbica inversa»: Gopikrishnan *et al.*, 1999; Cont, 2001; véase el capítulo 15), de modo que:

- A horizontes cortos (diarios o intradía) la normal infravalora mucho los extremos: un movimiento de más de $4\sigma$ (en cualquier sentido) debería ocurrir con probabilidad $6{,}3 \times 10^{-5}$, unas 1,6 veces cada cien años bursátiles, y se observa con mucha mayor frecuencia.
- A horizontes largos (mensuales, anuales) la distribución se acerca a la normal, el fenómeno llamado **gaussianidad agregacional** (Cont, 2001), aunque la convergencia es lenta por la dependencia de la volatilidad.

Por eso las respuestas de los ejercicios 5.1 y 5.2 (un 34,5 % de años negativos y un 8,1 % de años peores que −15 %) solo son fiables si las rentabilidades anuales son realmente normales; para probabilidades de sucesos extremos, la hipótesis normal suele quedarse corta.

---

## Capítulo 6 · Simular para entender: el método de Monte Carlo

> **En este capítulo** aprenderás a responder preguntas de probabilidad generando miles de escenarios con el ordenador, a medir la precisión de esas respuestas y a reconocer qué depende de los supuestos del modelo.

### La idea

Muchas preguntas financieras no tienen una fórmula sencilla: ¿qué probabilidad tiene un plan de ahorro de alcanzar su objetivo?, ¿cuánto vale un contrato cuyo pago depende de toda la trayectoria de un precio?, ¿cuál es la pérdida que solo se supera uno de cada cien años? La **simulación de Monte Carlo** las aborda por fuerza bruta: se describe el azar con un modelo, se generan con el ordenador miles de escenarios posibles y se cuenta lo que ocurre en ellos. La frecuencia con que se cumple algo estima su probabilidad, y la media de un resultado estima su valor esperado, gracias a la ley de los grandes números del capítulo 3.

Un ejemplo clásico muestra la lógica. Si se lanzan puntos al azar sobre un cuadrado de lado 1, la proporción que cae dentro del cuarto de círculo de radio 1 se acerca a su área, $\pi/4$. Multiplicando esa proporción por cuatro se obtiene una estimación de $\pi$ sin haber hecho ningún cálculo geométrico. Con 10.000 puntos, una ejecución da 3,156; no es exacto, pero el método permite saber cuánto puede equivocarse.

Dos ideas acompañan siempre a una simulación. La primera, el **error estándar**: toda estimación de Monte Carlo tiene un error aleatorio, que disminuye con la raíz cuadrada del número de escenarios. La segunda, la **semilla**: los números «aleatorios» del ordenador salen de un algoritmo, y fijar su punto de partida permite repetir exactamente el mismo experimento.

### Un ejemplo resuelto

Inviertes 10.000 € durante 20 años. Supón que la rentabilidad logarítmica de cada año es independiente y normal, con media 5 % y desviación típica 15 %. ¿Qué riqueza final cabe esperar y qué probabilidad hay de acabar con menos de lo invertido?

La simulación genera, para cada uno de 10.000 escenarios, veinte rentabilidades anuales, las suma (las rentabilidades logarítmicas se suman, capítulo 1) y calcula la riqueza final. Con la semilla 2024, los resultados son:

| Medida | Simulación | Valor teórico |
|---|---|---|
| Mediana de la riqueza final | 27.302 € | 27.183 € |
| Percentil 10 | 11.433 € | 11.506 € |
| Percentil 90 | 63.755 € | 64.218 € |
| Probabilidad de acabar por debajo de 10.000 € | 7,01 % ± 0,26 % | 6,80 % |

La mitad de los escenarios terminan por debajo de la mediana, y uno de cada diez por debajo del **percentil** 10. En este ejemplo concreto existe una solución exacta (la columna de la derecha, calculada en la Ampliación), y sirve para comprobar que la simulación funciona: las diferencias son del orden del error estándar. La utilidad del método aparece cuando el modelo se complica, por ejemplo con aportaciones periódicas, comisiones, colas gruesas o reglas de retirada, y la fórmula deja de existir mientras que la simulación sigue funcionando igual.

### Formalización

Para estimar el valor esperado $\theta = E[Y]$ de un resultado $Y$, se generan $M$ escenarios independientes, $Y_1, \dots, Y_M$, y se promedian:

$$\hat\theta = \frac{1}{M}\sum_{m=1}^{M} Y_m.$$

Si $s$ es la desviación típica de los $Y_m$, el error estándar de la estimación es

$$\text{EE} = \frac{s}{\sqrt{M}},$$

y, por el teorema central del límite (capítulo 5), el intervalo $\hat\theta \pm 1{,}96\,\text{EE}$ contiene el valor verdadero con una probabilidad aproximada del 95 %. Para estimar una probabilidad $p$, $Y_m$ vale 1 si el suceso ocurre y 0 si no, y el error estándar es $\sqrt{\hat p(1-\hat p)/M}$. Reducir el error a la mitad exige cuadruplicar el número de escenarios.

### Gráfico interactivo

> **Gráfico interactivo · Un laboratorio de futuros.** Panel superior: estimación de $\pi$ con puntos que van apareciendo sobre el cuadrado (dentro del círculo en un color, fuera en otro) y, al lado, la estimación acumulada con su banda de ±2 errores estándar, que se estrecha como $1/\sqrt{M}$. Panel inferior: el plan de ahorro del ejemplo, con deslizadores para la rentabilidad media, la volatilidad, el horizonte y el número de escenarios; se dibujan 200 trayectorias de riqueza en gris, la mediana y los percentiles 10 y 90 en color, y un histograma lateral de la riqueza final con la probabilidad de pérdida. Un botón «nueva semilla» permite ver qué cifras cambian de una ejecución a otra y cuánto. Lo que el lector debe observar: las estimaciones fluctúan menos cuantos más escenarios se usan, pero nunca dejan de depender de los supuestos introducidos.

### En Python

```python
import numpy as np

rng = np.random.default_rng(2024)                 # semilla fija: resultados reproducibles
log_r = rng.normal(0.05, 0.15, size=(10_000, 20)) # 10.000 escenarios de 20 años
final = 10_000 * np.exp(log_r.sum(axis=1))

p10, p50, p90 = np.percentile(final, [10, 50, 90])
prob_perder = np.mean(final < 10_000)
error = np.sqrt(prob_perder * (1 - prob_perder) / final.size)
print(round(p50), round(p10), round(p90))         # 27302 11433 63755
print(f"{prob_perder:.2%} ± {error:.2%}")         # 7.01% ± 0.26%
```

### En la práctica

- Los bancos valoran por simulación los derivados cuyo pago depende de la trayectoria de uno o varios precios, para los que no existe una fórmula cerrada.
- Los asesores y los planes de pensiones simulan miles de escenarios para estimar la probabilidad de que un plan de ahorro o de jubilación alcance su objetivo.
- Los modelos internos de riesgo de bancos y aseguradoras simulan la evolución conjunta de muchos factores de riesgo para estimar pérdidas extremas, como el valor en riesgo del capítulo 16.

### Ejercicios

- **6.1** *(básico, cálculo)* Una estimación de Monte Carlo con 2.500 escenarios tiene un error estándar de 0,8. ¿Cuántos escenarios hacen falta para reducirlo a 0,2?
- **6.2** *(intermedio, cálculo)* Al estimar $\pi$ con $M$ puntos, cada punto cae dentro del círculo con probabilidad $p = \pi/4$. ¿Cuál es el error estándar de la estimación con 10.000 puntos? ¿Cuántos puntos harían falta para un error estándar de 0,001?
- **6.3** *(básico, reflexión)* ¿Por qué conviene fijar la semilla de una simulación? ¿Por qué conviene también repetirla con otras semillas?
- **6.4** *(avanzado, cálculo)* En el ejemplo resuelto, la simulación estima una probabilidad de pérdida del 7,01 % con 10.000 escenarios. Construye un intervalo de confianza aproximado del 95 % y comprueba si contiene el valor teórico del 6,80 %.

### Ampliación · Simulación de Monte Carlo con más rigor

#### Fundamento

Se quiere estimar $\theta = E[h(X)]$. Con $M$ realizaciones independientes $X_1, \dots, X_M$, el estimador $\hat\theta_M = \frac1M\sum_m h(X_m)$ es insesgado; converge por la ley de los grandes números (capítulo 3) y, por el teorema central del límite (capítulo 5),

$$\hat\theta_M \pm 1{,}96\,\frac{\hat\sigma}{\sqrt{M}}$$

es un intervalo de confianza aproximado del 95 %, donde $\hat\sigma$ es la desviación típica muestral de los $h(X_m)$. El error es $O(M^{-1/2})$ **con independencia de la dimensión** del problema, mientras que los métodos de cuadratura en $d$ dimensiones empeoran rápidamente con $d$. Por eso Monte Carlo domina en problemas con muchas variables: muchos activos, muchas fechas o trayectorias dependientes.

#### Historia

El método se desarrolló en Los Álamos a finales de los años cuarenta (Stanisław Ulam, John von Neumann, Nicholas Metropolis) para problemas de difusión de neutrones; Metropolis y Ulam (1949) publicaron el primer artículo con el nombre, inspirado en el casino de Montecarlo. Un antecedente célebre es la aguja de Buffon (1777), que permite estimar $\pi$ lanzando agujas sobre un suelo de tablas. Boyle (1977) lo introdujo en la valoración de opciones.

#### Números aleatorios y semillas

Los ordenadores generan números **pseudoaleatorios** con algoritmos deterministas: a partir de una semilla producen una secuencia que supera las pruebas estadísticas de aleatoriedad. Ejemplos: Mersenne Twister (Matsumoto y Nishimura, 1998), con periodo $2^{19937} - 1$, y PCG64 (O'Neill, 2014), el generador por defecto de NumPy. Fijar la semilla hace que los resultados sean reproducibles (ejercicio 6.3); para ejecuciones en paralelo hay que usar flujos independientes y no semillas consecutivas arbitrarias.

#### Generar distribuciones

- **Transformación inversa**: si $U \sim \mathcal{U}(0,1)$, $X = F^{-1}(U)$ tiene distribución $F$.
- **Box–Muller** (1958): a partir de dos uniformes independientes, $Z_1 = \sqrt{-2\ln U_1}\cos(2\pi U_2)$ y $Z_2 = \sqrt{-2\ln U_1}\sin(2\pi U_2)$ son normales estándar independientes.
- **Normales correlacionadas**: si $\Sigma = LL^\top$ es la descomposición de Cholesky y $\mathbf{z}$ es un vector de normales estándar independientes, $L\mathbf{z} \sim \mathcal{N}(\mathbf{0}, \Sigma)$. Es lo que hace la función `simular_historia` del proyecto práctico del final del libro.
- **Precios**: el movimiento browniano geométrico se simula de forma exacta con $S_{t+\Delta} = S_t \exp\!\big((\mu - \tfrac12\sigma^2)\Delta + \sigma\sqrt{\Delta}\,Z\big)$; discretizar directamente la ecuación diferencial (esquema de Euler) introduce un sesgo que solo desaparece cuando $\Delta \to 0$.

*Solución exacta del ejemplo resuelto:* si las rentabilidades logarítmicas anuales son independientes y $\mathcal{N}(0{,}05;\ 0{,}15^2)$, la suma de 20 años es $\mathcal{N}(1;\ 0{,}15^2 \times 20)$, con desviación típica $0{,}15\sqrt{20} = 0{,}671$, y la riqueza final es lognormal (capítulo 5). Su mediana es $10\,000\,e^{1} = 27\,183$ €; sus percentiles 10 y 90 son $10\,000\,e^{1 \mp 1{,}2816 \times 0{,}671}$, es decir, 11.506 € y 64.218 €, y la probabilidad de acabar por debajo de 10.000 € es $\Phi(-1/0{,}671) = \Phi(-1{,}49) = 6{,}80\,\%$. La riqueza *media*, $10\,000\,e^{1 + 0{,}15^2 \times 20/2} = 34\,042$ €, es bastante mayor que la mediana: la distribución es asimétrica a la derecha. Los valores simulados difieren de los exactos en menos de un 1 % en la mediana y en menos de una vez el error estándar en la probabilidad, como corresponde al error de Monte Carlo.

#### Ejemplo: valorar una opción

El precio de una opción de compra europea es $C = e^{-rT}E^Q[(S_T - K)^+]$ (capítulo 3). Con $S_0 = K = 100$, $r = 3\,\%$, $\sigma = 20\,\%$ y $T = 1$, la fórmula de Black y Scholes da 9,41. Una simulación con 100.000 trayectorias da 9,46 con un error estándar de 0,045: el valor exacto queda dentro del intervalo de confianza. Para opciones sin fórmula cerrada (asiáticas, con barreras, sobre varios activos) el procedimiento es idéntico. Las opciones americanas requieren decidir el ejercicio anticipado; el método de mínimos cuadrados de Longstaff y Schwartz (2001) lo resuelve dentro de Monte Carlo.

#### Reducción de varianza

Como el error baja solo con $\sqrt{M}$, conviene reducir $\sigma$ (Glasserman, 2003):

- **Variables antitéticas**: usar cada $Z$ junto con $-Z$.
- **Variables de control**: corregir con una variable correlacionada de esperanza conocida (por ejemplo, la opción asiática geométrica, que tiene fórmula, para valorar la aritmética).
- **Muestreo por importancia**: muestrear más a menudo las regiones raras que importan; es esencial para estimar probabilidades de pérdidas extremas (capítulo 16).
- **Cuasi-Monte Carlo**: secuencias de baja discrepancia (Sobol', 1967) con error cercano a $O(M^{-1}(\ln M)^d)$, mejor que $M^{-1/2}$ en dimensión moderada.

#### Riesgo de modelo

Una simulación es tan buena como sus supuestos. El ejemplo del capítulo supone rentabilidades anuales independientes y normales; con colas gruesas o volatilidad cambiante (capítulos 7 y 15) los percentiles bajos serían peores. Una alternativa es la **simulación histórica** o el *bootstrap* (Efron, 1979), que remuestrea rentabilidades observadas en lugar de suponer una distribución, aunque entonces solo se reproducen escenarios parecidos a los ya vistos.

---

# Parte III · Riesgo y recompensa

Con las herramientas de probabilidad ya disponibles podemos describir una inversión con algo más que su rentabilidad media. El capítulo 7 introduce la volatilidad, la medida de riesgo más usada. El capítulo 8 combina rentabilidad y volatilidad en un solo número, el ratio de Sharpe, para comparar inversiones de riesgo distinto. El capítulo 9 explica por qué la volatilidad no solo inquieta, sino que además reduce el crecimiento compuesto de la riqueza.

---

## Capítulo 7 · Volatilidad

> **En este capítulo** aprenderás a calcular la volatilidad de una serie de rentabilidades, a convertirla entre frecuencias y a interpretar lo que mide y lo que no.

### La idea

Dos fondos pueden haber ganado lo mismo en diez años y haber ofrecido experiencias muy distintas: uno avanzando con pequeñas oscilaciones y otro alternando subidas eufóricas y caídas dolorosas. La rentabilidad media no distingue entre ambos; hace falta una medida de la amplitud de las oscilaciones. La más usada es la **volatilidad**: la desviación típica de las rentabilidades de la inversión. Como las rentabilidades suelen medirse a diario, semanal o mensualmente, la volatilidad se convierte casi siempre a una base anual para poder comparar; esa conversión se llama **anualizar** y se apoya en la regla de la raíz del tiempo del capítulo 4.

En el lenguaje de los mercados, «volatilidad» y «riesgo» se usan a menudo como sinónimos. Es una simplificación útil, pero conviene no olvidar que la volatilidad castiga por igual las subidas y las bajadas, y que dice poco sobre las caídas raras y extremas (capítulos 15 y 16).

### Un ejemplo resuelto

Durante seis sesiones, un activo registra estas rentabilidades logarítmicas diarias: +0,5 %, −1,5 %, +2,0 %, −0,5 %, +1,0 % y −1,5 %.

1. **Media.** La suma es 0, así que la media es 0 %.
2. **Desviaciones al cuadrado.** Restando la media y elevando al cuadrado: 0,25; 2,25; 4,00; 0,25; 1,00 y 2,25, que suman 10.
3. **Varianza muestral.** Se divide por el número de datos menos uno: $10/5 = 2$ (en %²).
4. **Volatilidad diaria.** La raíz cuadrada: $\sqrt{2} = 1{,}41\,\%$.
5. **Volatilidad anual.** Con 252 **sesiones** de negociación al año y rentabilidades independientes: $1{,}41\,\% \times \sqrt{252} = 22{,}4\,\%$.

Seis datos son muy pocos para estimar nada con precisión, pero el procedimiento es el mismo con seis que con seis mil.

### Formalización

Sean $r_1, \dots, r_N$ las rentabilidades logarítmicas observadas en una frecuencia dada (por ejemplo, diaria) y $\bar r$ su media. La volatilidad muestral en esa frecuencia es

$$\hat\sigma = \sqrt{\frac{1}{N-1}\sum_{t=1}^{N}\big(r_t - \bar r\big)^2}.$$

Se divide por $N - 1$ y no por $N$ porque la media se ha estimado con los mismos datos, lo que consume un grado de libertad (la Ampliación lo detalla); con muestras largas la diferencia es despreciable. Si hay $h$ periodos por año (252 sesiones, 52 semanas o 12 meses) y las rentabilidades son independientes, la volatilidad anual es

$$\sigma_{\text{anual}} = \hat\sigma\,\sqrt{h}.$$

### Gráfico interactivo

> **Gráfico interactivo · Mismo destino, distinto viaje.** Un deslizador fija la volatilidad anual (del 2 % al 50 %); la deriva logarítmica se mantiene en un 6 % anual. Panel izquierdo: dos trayectorias de precio diarias durante cinco años, una con volatilidad del 5 % como referencia y otra con la volatilidad elegida, generadas con los mismos números aleatorios para que la comparación sea justa. Panel derecho: la distribución de la rentabilidad de un año para ambas, con el área de pérdidas sombreada y su probabilidad: un 11,5 % con volatilidad del 5 % y un 40,5 % con volatilidad del 25 %, si las rentabilidades logarítmicas anuales son normales. Lo que el lector debe observar: con la misma tendencia, más volatilidad significa un trayecto más accidentado y muchos más años en negativo.

### En Python

```python
import numpy as np

r = np.array([0.5, -1.5, 2.0, -0.5, 1.0, -1.5]) / 100   # rentabilidades diarias
vol_diaria = r.std(ddof=1)            # ddof=1: dividir por N - 1
vol_anual = vol_diaria * np.sqrt(252)
print(f"{vol_diaria:.2%} diaria, {vol_anual:.1%} anual")  # 1.41% diaria, 22.4% anual
```

### En la práctica

- Los documentos de datos fundamentales que reciben los inversores minoristas en la Unión Europea incluyen un indicador de riesgo del 1 al 7, cuya parte de riesgo de mercado se basa en una medida de la amplitud de las pérdidas posibles relacionada con la volatilidad (la Ampliación da los detalles).
- En los mercados de opciones es habitual cotizar en volatilidad implícita en lugar de en euros: conocido ese número, el precio se obtiene con un modelo de valoración.
- Las mesas de riesgos vigilan la volatilidad reciente de cada posición y reducen la exposición cuando aumenta; algunas estrategias, llamadas de volatilidad objetivo, lo hacen de forma sistemática.

### Ejercicios

- **7.1** *(básico, cálculo)* Cinco rentabilidades diarias: +1,2 %, −0,4 %, +0,8 %, −2,0 % y +0,4 %. Calcula la media, la volatilidad diaria (dividiendo por $N-1$) y la volatilidad anualizada con 252 sesiones.
- **7.2** *(intermedio, cálculo)* Un fondo informa de una volatilidad mensual del 3 %. ¿Cuál es su volatilidad anual, suponiendo meses independientes? Si esa cifra se usara como volatilidad equivalente en la clasificación de riesgo de mercado de los PRIIP descrita en la Ampliación, ¿en qué clase quedaría?
- **7.3** *(intermedio, reflexión)* Estimas la volatilidad de una acción con los datos de un año muy tranquilo y la usas para dimensionar el riesgo del año siguiente. ¿Por qué puede ser una mala guía?

### Ampliación · Volatilidad con más rigor

#### Estimación y su error

El estimador habitual es la desviación típica muestral $\hat\sigma$ de las rentabilidades logarítmicas, dividiendo por $N - 1$. Para datos normales i.i.d., su error estándar es aproximadamente $\sigma/\sqrt{2N}$: con un año de datos diarios ($N = 252$) y $\sigma = 20\,\%$ anual, el error es de unos 0,9 puntos porcentuales. La volatilidad se estima bastante bien con datos frecuentes. Con colas gruesas, sin embargo, el error es mayor: aproximadamente $\sigma\sqrt{(\kappa - 1)/(4N)}$, donde $\kappa$ es la curtosis (capítulo 15). Con $\kappa = 3$ se recupera la fórmula normal, pero con las curtosis diarias habituales, de 6 a 10, el error es entre 1,6 y 2,1 veces mayor.

La **media**, en cambio, se estima muy mal: su error estándar es $\sigma/\sqrt{T}$ con $T$ en *años*, independientemente de la frecuencia de muestreo. Con $\sigma = 20\,\%$ y 10 años de datos, el error de la rentabilidad media anual es del 6,3 %, comparable a la propia prima de riesgo. Merton (1980) señaló esta asimetría, que tiene grandes consecuencias para la optimización de carteras (capítulo 12).

#### La volatilidad no es constante

Uno de los hechos empíricos mejor establecidos es el **agrupamiento de volatilidad** (Mandelbrot, 1963; Cont, 2001): a periodos agitados les siguen periodos agitados. Modelos principales:

- **Media móvil exponencial (EWMA)**, popularizada por RiskMetrics (J.P. Morgan/Reuters, 1996): $\sigma_t^2 = \lambda\,\sigma_{t-1}^2 + (1 - \lambda)\,r_{t-1}^2$, con $\lambda = 0{,}94$ para datos diarios.
- **GARCH(1,1)** (Engle, 1982; Bollerslev, 1986):
$$\sigma_t^2 = \omega + \alpha\,r_{t-1}^2 + \beta\,\sigma_{t-1}^2, \qquad \omega > 0,\ \alpha, \beta \ge 0,\ \alpha + \beta < 1.$$
La varianza a largo plazo es $\omega/(1 - \alpha - \beta)$ y la persistencia $\alpha + \beta$ suele estar entre 0,95 y 0,99 en datos diarios de acciones. EWMA es el caso límite $\omega = 0$, $\alpha + \beta = 1$. Engle recibió el Nobel de Economía de 2003 por este trabajo.
- **Efecto apalancamiento** (Black, 1976): las caídas de precio tienden a aumentar la volatilidad más que las subidas del mismo tamaño. Variantes asimétricas como GJR-GARCH (Glosten, Jagannathan y Runkle, 1993) lo recogen.

#### Otras medidas de volatilidad

- **Volatilidad realizada**: la suma de rentabilidades intradía al cuadrado, $RV_t = \sum_j r_{t,j}^2$, converge a la varianza integrada del día cuando la frecuencia aumenta (Andersen, Bollerslev, Diebold y Labys, 2003), con la salvedad del ruido de microestructura.
- **Estimador de rango** (Parkinson, 1980): usa máximos $H$ y mínimos $L$ diarios, $\hat\sigma^2 = \frac{1}{4\ln 2}\big(\ln(H/L)\big)^2$; es varias veces más eficiente que el basado solo en cierres.
- **Volatilidad implícita**: el valor de $\sigma$ que, introducido en la fórmula de Black y Scholes (1973), reproduce el precio de mercado de una opción. Por eso, como se indica en «En la práctica», en los mercados de opciones es habitual cotizar en volatilidad en lugar de en euros. No es una previsión pura: se forma bajo la medida neutral al riesgo e incluye una **prima de riesgo de varianza**, por lo que la volatilidad implícita de los índices suele superar a la que se realiza después (Carr y Wu, 2009); además, cambia con el precio de ejercicio y el vencimiento (la «sonrisa», capítulo 15). El índice **VIX** de Cboe mide la volatilidad implícita a 30 días del S&P 500, pero no con Black y Scholes: desde 2003 se calcula sin modelo a partir de una cartera de opciones con muchos precios de ejercicio, y equivale aproximadamente a la raíz del tipo de un *swap* de varianza a 30 días.

#### Volatilidad y riesgo de pérdida

La volatilidad trata igual las desviaciones positivas y negativas. Medidas alternativas centradas en la cola izquierda son la **semivarianza** (propuesta ya por Markowitz, 1959), la desviación a la baja respecto a un objetivo $\tau$, $\sigma_- = \sqrt{E[\min(r - \tau, 0)^2]}$, la **máxima caída** (*maximum drawdown*) y las medidas de cola del capítulo 16.

#### Regulación europea

El indicador resumido de riesgo (SRI) de los documentos de datos fundamentales de los PRIIP combina una medida de riesgo de mercado con una de riesgo de crédito. La parte de mercado clasifica el producto según una «volatilidad equivalente al VaR» (habitualmente obtenida de un VaR al 97,5 % con la corrección de Cornish–Fisher del capítulo 15, no de la desviación típica sin más) en siete clases (Reglamento Delegado (UE) 2017/653): por debajo del 0,5 %, 0,5–5 %, 5–12 %, 12–20 %, 20–30 %, 30–80 % y más del 80 % anual. Desde 2023 los fondos UCITS también usan este documento, en lugar del antiguo indicador SRRI, que sí se basaba directamente en la volatilidad histórica. En el ejercicio 7.1, dividir por $N = 5$ en lugar de por $N - 1 = 4$ daría $\sqrt{6{,}4/5} = 1{,}13\,\%$ en lugar de 1,26 %, una diferencia notable con solo cinco datos.

---

## Capítulo 8 · Rentabilidad ajustada al riesgo: el ratio de Sharpe

> **En este capítulo** aprenderás a comparar inversiones con niveles de riesgo distintos, a entender por qué el apalancamiento no cambia el ratio de Sharpe y a desconfiar de los ratios estimados con pocos datos.

### La idea

Un fondo que ha ganado un 10 % anual, ¿es mejor que otro que ha ganado un 6 %? Depende del riesgo que haya asumido cada uno. Una rentabilidad alta puede ser simplemente la recompensa por soportar oscilaciones grandes, algo que cualquiera podría conseguir concentrando su dinero en activos arriesgados. Para comparar con justicia hay que medir cuánta rentabilidad se obtiene **por unidad de riesgo**.

El punto de partida es el **tipo libre de riesgo**, la rentabilidad que se obtiene sin asumir riesgo (en la práctica, la de una letra del Tesoro a corto plazo o un depósito garantizado). Lo que una inversión gana por encima de ese tipo es su **rentabilidad en exceso**, y el **ratio de Sharpe** la divide por la volatilidad. Un ratio de 0,5 significa que la inversión ha pagado medio punto de rentabilidad extra por cada punto de volatilidad.

### Un ejemplo resuelto

Tres fondos y un tipo libre de riesgo del 2 %:

| Fondo | Rentabilidad media | Volatilidad | Ratio de Sharpe |
|---|---|---|---|
| A | 7,0 % | 12 % | (7 − 2)/12 = 0,42 |
| B | 4,5 % | 4 % | (4,5 − 2)/4 = 0,625 |
| C | 10,0 % | 22 % | (10 − 2)/22 = 0,36 |

El fondo C es el que más gana, pero el B es el que mejor remunera el riesgo. ¿Por qué debería importarnos si B gana menos? Porque, si se puede pedir prestado al tipo libre de riesgo, la rentabilidad y la volatilidad de B se pueden escalar. Invertir el triple del capital propio en B, financiando el resto al 2 %, daría una rentabilidad de $2 + 3 \times (4{,}5 - 2) = 9{,}5\,\%$ con una volatilidad de $3 \times 4 = 12\,\%$: la misma volatilidad que A, pero 2,5 puntos más de rentabilidad. Con el ratio de Sharpe más alto se puede construir, para cualquier nivel de riesgo, una cartera mejor.

### Formalización

Sea $\mu$ la rentabilidad media anual de una inversión, $\sigma$ su volatilidad anual y $r_f$ el tipo libre de riesgo. El ratio de Sharpe es

$$\text{SR} = \frac{\mu - r_f}{\sigma}.$$

Si se invierte una fracción $w$ del capital en la inversión y el resto, $1 - w$, en el activo libre de riesgo (con $w > 1$ si se pide prestado), la rentabilidad en exceso y la volatilidad de la combinación se multiplican ambas por $w$:

$$\mu_w - r_f = w\,(\mu - r_f), \qquad \sigma_w = w\,\sigma \qquad\Longrightarrow\qquad \text{SR}_w = \text{SR}.$$

Todas las combinaciones de una inversión con el activo sin riesgo forman una recta en el plano volatilidad–rentabilidad, que parte de $r_f$ y cuya pendiente es el ratio de Sharpe. Elegir la inversión con mayor ratio equivale a elegir la recta más empinada.

Cuando el ratio se calcula con datos mensuales o diarios, se anualiza multiplicando por la raíz del número de periodos por año, porque la rentabilidad en exceso crece en proporción al tiempo y la volatilidad en proporción a su raíz (capítulo 4). Esa regla supone, de nuevo, rentabilidades independientes.

### Gráfico interactivo

> **Gráfico interactivo · La recta más empinada.** Plano con la volatilidad en el eje horizontal y la rentabilidad media en el vertical. Aparecen los tres fondos del ejemplo como puntos que el lector puede arrastrar, y un punto sobre el eje vertical para el tipo libre de riesgo, también ajustable. Desde ese punto parte una recta hacia cada fondo, rotulada con su ratio de Sharpe. Un deslizador «fracción invertida» (de 0 a 300 %) desplaza un marcador a lo largo de la recta del fondo seleccionado, mostrando rentabilidad, volatilidad y ratio de la combinación. Lo que el lector debe observar: al moverse sobre una recta cambian el riesgo y la rentabilidad, pero no el ratio; y la recta más empinada domina a las demás en cualquier nivel de volatilidad.

### En Python

```python
import numpy as np

def sharpe(mu, sigma, rf):
    return (mu - rf) / sigma

fondos = {"A": (0.07, 0.12), "B": (0.045, 0.04), "C": (0.10, 0.22)}
for nombre, (mu, sigma) in fondos.items():
    print(nombre, round(sharpe(mu, sigma, rf=0.02), 2))

# Con datos mensuales: ratio mensual por la raíz de 12
exceso_mensual = np.array([0.8, -1.1, 1.9, 0.3, -0.4, 1.2]) / 100
sr_anual = exceso_mensual.mean() / exceso_mensual.std(ddof=1) * np.sqrt(12)
```

### En la práctica

- Las clasificaciones de fondos y los informes de gestión incluyen el ratio de Sharpe junto a la rentabilidad, para que el inversor vea cuánto riesgo hubo detrás de cada resultado.
- Los gestores que combinan varias estrategias usan el ratio para decidir a cuál asignar más capital y con qué apalancamiento.
- Los equipos de análisis cuantitativo desconfían de los ratios espectaculares obtenidos en simulaciones históricas: con pocos años de datos o tras probar muchas variantes, el ratio estimado puede estar muy inflado (Ampliación y tema complementario A).

### Ejercicios

- **8.1** *(básico, cálculo)* El fondo F1 rinde un 8 % anual con una volatilidad del 14 %, y el F2 un 5 % con una volatilidad del 5 %. El tipo libre de riesgo es del 2,5 %. ¿Cuál tiene mayor ratio de Sharpe?
- **8.2** *(intermedio, cálculo)* Quieres que tu inversión tenga la misma volatilidad que F1, pero usando F2 y endeudándote al tipo libre de riesgo. ¿Qué fracción de tu capital debes invertir en F2? ¿Qué rentabilidad esperada obtienes y cómo se compara con la de F1?
- **8.3** *(intermedio, cálculo)* Calculado con datos mensuales, el ratio de Sharpe de una estrategia es 0,25. ¿Qué valor anual le corresponde aproximadamente, si los meses son independientes?
- **8.4** *(avanzado, cálculo)* Un gestor presenta un ratio de Sharpe anual de 0,6 calculado con ocho años de rentabilidades anuales. Usando la fórmula del error estándar de la Ampliación, ¿es estadísticamente distinto de cero?

### Ampliación · El ratio de Sharpe con más rigor

#### Origen y fundamento teórico

William Sharpe (1966) lo introdujo como *reward-to-variability ratio* y lo revisó en 1994 (Sharpe, 1994), donde lo define sobre la rentabilidad diferencial frente a cualquier referencia. Su justificación procede del teorema de separación de Tobin (1958): si existe un activo libre de riesgo, todas las combinaciones de ese activo con una cartera arriesgada se sitúan en una recta en el plano (volatilidad, rentabilidad), la **línea de asignación de capital**, cuya pendiente es el ratio de Sharpe de la cartera arriesgada. Un inversor media-varianza elige primero la cartera arriesgada con **máximo** Sharpe (la cartera tangente) y después decide cuánto apalancarla o desapalancarla según su aversión al riesgo $\gamma$:

$$w^* = \frac{\mu - r_f}{\gamma\,\sigma^2}.$$

El resultado del capítulo ($\text{SR}_w = \text{SR}$) es precisamente esta invariancia ante el apalancamiento.

#### Error de estimación

El ratio de Sharpe es un estadístico estimado con ruido. Para rentabilidades i.i.d. normales, Lo (2002) obtiene el error estándar asintótico

$$\operatorname{SE}\big(\widehat{\text{SR}}\big) \approx \sqrt{\frac{1 + \tfrac12\,\text{SR}^2}{T}},$$

donde $T$ es el número de observaciones en la misma frecuencia en que se mide el ratio. *Ejemplo:* un Sharpe anual de 0,5 estimado con 10 años de datos anuales tiene un error estándar de 0,34; el estadístico $t$ es solo 1,5, insuficiente para descartar que el Sharpe verdadero sea cero. Con autocorrelación, la anualización por $\sqrt{q}$ de la ejercicio 8.3 está sesgada y Lo (2002) da la corrección.

Además, cuando se prueban muchas estrategias y se elige la mejor, el Sharpe máximo está inflado por la selección. Bailey y López de Prado (2014) proponen el **ratio de Sharpe deflactado**, que ajusta por el número de pruebas, la asimetría y la curtosis.

#### Medidas emparentadas

| Medida | Definición | Cuándo se usa |
|---|---|---|
| Ratio de Sortino (Sortino y van der Meer, 1991) | $(\mu - \tau)/\sigma_-$, con desviación solo a la baja | cuando la asimetría importa |
| Ratio de Treynor (1965) | $(\mu - r_f)/\beta$ | para carteras que ya están diversificadas |
| Alfa de Jensen (1968) | $\alpha = \mu - [r_f + \beta(\mu_m - r_f)]$ | rentabilidad no explicada por el CAPM |
| Ratio de información | $(\mu - \mu_b)/\sigma(R - R_b)$ | gestión activa frente a un índice de referencia $b$ |

#### Relación con el crecimiento a largo plazo

En el modelo continuo de un activo con riesgo y otro sin riesgo, la fracción que maximiza el crecimiento logarítmico (Kelly, capítulo 14) es $f^* = (\mu - r_f)/\sigma^2$ y la tasa de crecimiento óptima es

$$g^* = r_f + \tfrac12\,\text{SR}^2.$$

El ratio de Sharpe determina así cuánto puede crecer la riqueza con un apalancamiento óptimo (Merton, 1969; Thorp, 2006).

#### Limitaciones

1. Supone implícitamente que la media y la varianza bastan para describir el riesgo; ignora la asimetría y las colas. Estrategias que venden opciones fuera de dinero pueden mostrar Sharpe altos durante años antes de sufrir pérdidas extremas.
2. Puede **manipularse**: Goetzmann, Ingersoll, Spiegel y Welch (2007) demuestran que, con derivados, un gestor puede elevar el Sharpe medido sin añadir habilidad, y proponen medidas resistentes a la manipulación.
3. Con precios suavizados (activos ilíquidos), la volatilidad medida es artificialmente baja y el Sharpe artificialmente alto.

---

## Capítulo 9 · Crecimiento compuesto y lastre de la volatilidad

> **En este capítulo** aprenderás por qué la rentabilidad media sobrestima lo que crece la riqueza, a calcular de forma aproximada la tasa de crecimiento compuesto y a reconocer el efecto en productos apalancados.

### La idea

Si un activo sube un 10 % y después baja un 10 %, no vuelve al punto de partida: termina un 1 % por debajo, porque la bajada se aplica sobre una cantidad mayor que la subida. Las rentabilidades se componen multiplicando, no sumando, y esa asimetría hace que la volatilidad tenga un coste: cuanto más oscila una inversión, más se aleja su crecimiento real de su rentabilidad media. Esa diferencia se conoce como **lastre de la volatilidad**.

La magnitud relevante para el inversor a largo plazo no es la media aritmética de las rentabilidades, sino la **tasa de crecimiento compuesto**: la rentabilidad constante que habría producido la misma riqueza final, es decir, la media geométrica del capítulo 1 o, equivalentemente, la media de las rentabilidades logarítmicas.

### Un ejemplo resuelto

Un activo alterna, año tras año, una subida del 25 % y una caída del 20 %. Su rentabilidad media aritmética es $(25 - 20)/2 = 2{,}5\,\%$ anual, una cifra aparentemente positiva. Pero cada par de años la riqueza se multiplica por $1{,}25 \times 0{,}80 = 1$: al cabo de veinte años, el inversor tiene exactamente lo mismo que al principio. Su tasa de crecimiento compuesto es cero.

La aproximación que se presenta a continuación, $g \approx \mu - \tfrac12\sigma^2$, lo anticipa. La desviación típica de esas dos rentabilidades es del 22,5 %, así que

$$g \approx 2{,}5\,\% - \tfrac12 \times (22{,}5\,\%)^2 = 2{,}5\,\% - 2{,}53\,\% \approx 0\,\%.$$

Toda la rentabilidad media se la come el lastre.

### Formalización

Si en un periodo la inversión sube una proporción $s$ y en el siguiente baja la misma proporción, el factor de crecimiento total es

$$(1 + s)(1 - s) = 1 - s^2 < 1,$$

y la pérdida, $s^2$, crece con el cuadrado del tamaño de la oscilación. De forma general, si una inversión tiene una rentabilidad media anual $\mu$ y una volatilidad anual $\sigma$, su tasa de crecimiento compuesto es aproximadamente

$$g \approx \mu - \tfrac12\,\sigma^2.$$

La aproximación es buena cuando las rentabilidades de cada periodo son moderadas, y exacta para el modelo de precios en tiempo continuo que describe la Ampliación. Su lectura es sencilla: duplicar la volatilidad cuadruplica el lastre.

### Gráfico interactivo

> **Gráfico interactivo · La media engaña.** Deslizadores para la rentabilidad media anual (de 0 % a 15 %) y la volatilidad anual (de 0 % a 60 %). Panel izquierdo: 300 trayectorias de riqueza a 20 años partiendo de 100 €, en escala logarítmica, con la riqueza media y la riqueza mediana dibujadas en dos colores. Panel derecho: la tasa de crecimiento $\mu - \tfrac12\sigma^2$ en función de la volatilidad para la media elegida, una parábola invertida que corta el cero cuando $\sigma = \sqrt{2\mu}$. Lo que el lector debe observar: al subir la volatilidad, la riqueza media sigue creciendo pero la mediana se estanca o cae; a partir de cierto punto, la mayoría de las trayectorias pierde dinero aunque la media siga siendo positiva.

### En Python

```python
import numpy as np

def crecimiento_aprox(mu, sigma):
    return mu - sigma ** 2 / 2

r = np.array([0.25, -0.20] * 10)              # veinte años alternos
media = r.mean()                              # 0.025
geometrica = np.prod(1 + r) ** (1 / r.size) - 1   # 0.0
print(media, geometrica, crecimiento_aprox(media, r.std()))   # la aproximación da -0.0003
```

### En la práctica

- Cuando un informe resume diez años de un fondo con una única cifra anual compuesta, esa cifra ya lleva descontado el lastre; ponerla al lado de una media aritmética de rentabilidades anuales es comparar magnitudes distintas.
- Los supervisores han advertido de que los productos cotizados que multiplican cada día la rentabilidad de un índice no son adecuados para mantenerlos a largo plazo: en mercados agitados, el lastre crece con el cuadrado del apalancamiento.
- Los gestores que reequilibran periódicamente una cartera diversificada obtienen un pequeño crecimiento extra precisamente porque reducen la volatilidad del conjunto (Ampliación).

### Ejercicios

- **9.1** *(básico, cálculo)* Un activo sube un 60 % un año y cae un 40 % el siguiente. ¿Cuál es su rentabilidad media aritmética y cuál la rentabilidad acumulada de los dos años?
- **9.2** *(intermedio, cálculo)* Una inversión tiene una rentabilidad media anual del 7 %. Estima su tasa de crecimiento compuesto si su volatilidad es del 15 % y si es del 30 %.
- **9.3** *(avanzado, cálculo)* Un índice tiene una rentabilidad media del 6 % y una volatilidad del 18 % anuales. Un producto replica cada día tres veces la rentabilidad diaria del índice. Ignorando costes de financiación, estima la tasa de crecimiento del índice y la del producto con la fórmula de la Ampliación.

### Ampliación · El lastre de la volatilidad con más rigor

#### Derivación de $g \approx \mu - \tfrac12\sigma^2$

La riqueza tras $T$ periodos es $W_T = W_0 \prod_t (1 + R_t)$, de modo que la tasa de crecimiento logarítmica es $g = \frac1T \ln(W_T/W_0) = \frac1T \sum_t \ln(1+R_t)$. Por la ley de los grandes números, $g \to E[\ln(1+R)]$. Un desarrollo de Taylor de segundo orden alrededor de $R = 0$ da

$$E[\ln(1+R)] \approx E\Big[R - \tfrac12 R^2\Big] = \mu - \tfrac12\big(\sigma^2 + \mu^2\big) \approx \mu - \tfrac12\sigma^2,$$

donde el último paso desprecia $\mu^2/2$, pequeño para rentabilidades moderadas. Por la desigualdad de Jensen (capítulo 3) la diferencia $\mu - g$ es siempre no negativa.

**Versión exacta en tiempo continuo.** En el movimiento browniano geométrico (capítulo 4), $\ln(S_t/S_0) \sim \mathcal{N}\big((\mu - \tfrac12\sigma^2)t,\ \sigma^2 t\big)$. Por tanto:

- la riqueza **esperada** crece a la tasa $\mu$: $E[S_t] = S_0 e^{\mu t}$;
- la riqueza **mediana** (y la de casi todas las trayectorias a largo plazo) crece a la tasa $\mu - \frac12\sigma^2$.

Si $\sigma^2 > 2\mu$, la riqueza esperada crece mientras que casi todas las trayectorias tienden a cero: la media está sostenida por una fracción cada vez más pequeña de trayectorias extraordinariamente afortunadas. El «inversor mediano» del capítulo 14 es la forma correcta de pensar en ello.

#### Productos apalancados con reequilibrio diario

Un fondo que replica cada día $L$ veces la rentabilidad de un índice tiene, en tiempo continuo y sin costes de financiación, una tasa de crecimiento

$$g_L \approx L\,\mu - \tfrac12 L^2 \sigma^2,$$

es decir, el lastre crece con el **cuadrado** del apalancamiento (Cheng y Madhavan, 2009). *Ejemplo:* con $\mu = 8\,\%$ y $\sigma = 20\,\%$, el índice crece al 6 % y el fondo $2\times$ al $16 - 8 = 8\,\%$. Con $\sigma = 30\,\%$, el índice crece al 3,5 % y el fondo $2\times$ **decrece** un 2 % anual. Por eso FINRA advirtió en 2009 (Regulatory Notice 09-31) que estos productos no son adecuados para mantenerlos a largo plazo; es la advertencia que recoge el apartado «En la práctica».

#### El reverso positivo: la rentabilidad de la diversificación

Para una cartera reequilibrada con pesos fijos $w_i$, la tasa de crecimiento es

$$g_p = \sum_i w_i\,g_i + \tfrac12\left(\sum_i w_i\,\sigma_i^2 - \sigma_p^2\right).$$

El término entre paréntesis, la **tasa de crecimiento excedente** de Fernholz (Fernholz y Shay, 1982; Fernholz, 2002), es positivo siempre que los activos no estén perfectamente correlacionados. Booth y Fama (1992) lo llaman *diversification return*. *Ejemplo:* dos activos incorrelados, cada uno con $\mu = 10\,\%$ y $\sigma = 40\,\%$, crecen individualmente al $10 - 8 = 2\,\%$. Una cartera 50/50 reequilibrada tiene $\sigma_p^2 = 0{,}08$ y crece al $10 - 4 = 6\,\%$: la diversificación reduce el lastre y triplica el crecimiento sin cambiar la rentabilidad media.

#### Medir el crecimiento

La **tasa de crecimiento anual compuesta** (TCAC, en inglés CAGR) que publican los fondos es la media geométrica del capítulo 1, $\big(W_T/W_0\big)^{1/T} - 1$; ya incorpora el lastre. Una regla práctica útil es: media geométrica $\approx$ media aritmética $- \frac12$ varianza.

---

# Parte IV · Carteras

Casi nadie invierte todo su dinero en un único activo. En cuanto se combinan varios, aparece una pregunta nueva: ¿cómo se mueven unos respecto a otros? El capítulo 10 introduce la covarianza y la correlación, que miden ese movimiento conjunto. El capítulo 11 muestra cómo la diversificación reduce el riesgo y dónde se detiene. El capítulo 12 convierte la elección de una cartera en un problema de optimización, y el capítulo 13 extrae de él una teoría sobre qué riesgos se remuneran en el mercado.

---

## Capítulo 10 · Covarianza y correlación

> **En este capítulo** aprenderás a medir cómo se mueven juntas dos inversiones, a interpretar el coeficiente de correlación y a evitar los errores más frecuentes al usarlo.

### La idea

Para el riesgo de una cartera no basta con conocer la volatilidad de cada activo: importa también si sus caídas tienden a coincidir. Dos activos que suelen caer los mismos días se protegen poco entre sí; dos que se mueven con independencia amortiguan cada uno las malas rachas del otro, y dos que tienden a moverse en sentido contrario se compensan aún más.

La **covarianza** mide ese movimiento conjunto: es positiva cuando los dos activos tienden a estar por encima (o por debajo) de su media a la vez, y negativa cuando uno tiende a estar por encima mientras el otro está por debajo. Su inconveniente es que depende de las unidades y de la escala de cada activo. Dividiéndola por el producto de las dos desviaciones típicas se obtiene la **correlación**, un número sin unidades que siempre está entre −1 y +1: +1 indica que los dos activos se mueven en perfecta proporción, −1 que se mueven en perfecta oposición y 0 que no hay relación *lineal* entre ellos.

### Un ejemplo resuelto

Dos activos registran estas rentabilidades mensuales durante cinco meses (en %):

| Mes | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Activo X | 2 | −1 | 3 | 0 | 1 |
| Activo Y | 1 | −2 | 2 | 1 | 3 |

1. **Medias.** Las dos valen 1 %.
2. **Desviaciones respecto a la media.** X: 1, −2, 2, −1, 0. Y: 0, −3, 1, 0, 2.
3. **Productos de desviaciones.** 0, 6, 2, 0, 0, que suman 8. La covarianza muestral es $8/4 = 2$ (en %²).
4. **Desviaciones típicas.** Para X, $\sqrt{(1 + 4 + 4 + 1 + 0)/4} = \sqrt{2{,}5} = 1{,}58\,\%$; para Y, $\sqrt{(0 + 9 + 1 + 0 + 4)/4} = \sqrt{3{,}5} = 1{,}87\,\%$.
5. **Correlación.** $2/(1{,}58 \times 1{,}87) = 0{,}68$.

El mes 2, en el que ambos caen con fuerza, aporta casi toda la covarianza. Con tan pocos datos, un solo mes puede cambiar mucho la estimación; la Ampliación cuantifica esa incertidumbre.

### Formalización

Sean $X$ e $Y$ dos rentabilidades con medias $\mu_X$, $\mu_Y$ y desviaciones típicas $\sigma_X$, $\sigma_Y$. La covarianza es el valor esperado del producto de sus desviaciones respecto a la media,

$$\operatorname{Cov}(X, Y) = E\big[(X - \mu_X)(Y - \mu_Y)\big],$$

y la correlación es la covarianza normalizada,

$$\rho_{XY} = \frac{\operatorname{Cov}(X, Y)}{\sigma_X\,\sigma_Y}, \qquad -1 \le \rho_{XY} \le 1.$$

Con datos, se sustituyen las esperanzas por promedios muestrales, dividiendo por $n - 1$ como en el capítulo 7. La covarianza de una variable consigo misma es su varianza.

### Gráfico interactivo

> **Gráfico interactivo · Moverse juntos.** Panel izquierdo: nube de 500 pares de rentabilidades diarias simuladas, con un deslizador para la correlación entre −1 y +1; la nube pasa de una línea descendente a un círculo y a una línea ascendente. Un selector muestra además un caso no lineal (una parábola) cuya correlación es casi cero aunque la relación sea perfecta. Panel derecho: volatilidad de una cartera con un 50 % en cada uno de dos activos de volatilidad 20 %, en función de la correlación: 20 % con correlación +1, 17,3 % con +0,5, 14,1 % con 0, 10 % con −0,5 y 0 % con −1. Lo que el lector debe observar: cuanto menor es la correlación, más se calma la cartera; y una correlación nula no garantiza que no haya relación.

### En Python

```python
import numpy as np

x = np.array([2, -1, 3, 0, 1]) / 100
y = np.array([1, -2, 2, 1, 3]) / 100
cov = np.cov(x, y, ddof=1)[0, 1]          # 0.0002, es decir, 2 en %²
rho = np.corrcoef(x, y)[0, 1]             # 0.676
print(cov, rho)
```

### En la práctica

- Los modelos de riesgo de las entidades financieras estiman matrices de correlación entre cientos o miles de factores para calcular el riesgo agregado de sus carteras.
- Los gestores multiactivo buscan combinaciones cuya correlación sea baja, sobre todo en los periodos de crisis, que es cuando más se necesita la protección.
- Numerosos estudios han documentado que las correlaciones entre mercados de acciones aumentan en las caídas fuertes, de modo que la diversificación protege menos justo cuando más falta hace (Ampliación).

### Ejercicios

- **10.1** *(básico, cálculo)* Dos acciones tienen volatilidades anuales del 15 % y del 25 %, y su covarianza anual es 0,009. ¿Cuál es su correlación?
- **10.2** *(intermedio, cálculo)* Durante cuatro meses, el activo X rinde 1 %, 3 %, −1 % y 1 %, y el activo Y rinde 2 %, 0 %, 4 % y 2 %. Antes de calcular, observa los datos y predice la correlación. Después, calcúlala.
- **10.3** *(intermedio, reflexión)* Los precios de dos acciones han subido de forma sostenida durante diez años y la correlación entre sus *precios* es 0,95. ¿Significa eso que combinarlas apenas reduce el riesgo?

### Ampliación · Correlación con más rigor

#### Estimadores y propiedades

Dada una muestra $(x_t, y_t)$, la covarianza y la correlación muestrales (coeficiente de Pearson, 1896) son

$$s_{XY} = \frac{1}{n-1}\sum_{t=1}^{n}(x_t - \bar x)(y_t - \bar y), \qquad r = \frac{s_{XY}}{s_X\,s_Y}.$$

Propiedades:

- $|\rho| \le 1$ por la desigualdad de Cauchy–Schwarz, con $|\rho| = 1$ si y solo si $Y = a + bX$ casi seguramente.
- Es invariante ante transformaciones afines crecientes ($X \mapsto a + bX$, $b > 0$), pero **no** ante transformaciones no lineales monótonas.
- La covarianza es bilineal: $\operatorname{Cov}(aX + bY, Z) = a\operatorname{Cov}(X,Z) + b\operatorname{Cov}(Y,Z)$, lo que permite calcular la varianza de cualquier cartera (capítulo 11).

**Incertidumbre.** Con datos normales, la transformación de Fisher $z = \operatorname{artanh}(r)$ es aproximadamente normal con error estándar $1/\sqrt{n-3}$. *Ejemplo:* $r = 0{,}5$ con 60 observaciones mensuales (cinco años) da un intervalo de confianza del 95 % de $[0{,}28;\ 0{,}67]$: las correlaciones estimadas con pocos años de datos son muy imprecisas.

#### Correlación no es dependencia

La correlación de Pearson solo mide dependencia **lineal**. Un ejemplo mínimo: si $X$ toma los valores $-1$, $0$ y $1$ con probabilidad $1/3$ cada uno e $Y = X^2$, $Y$ queda completamente determinada por $X$ y, sin embargo, $\operatorname{Cov}(X, Y) = E[X^3] - E[X]\,E[X^2] = 0 - 0 = 0$, de modo que $\rho = 0$. Correlación nula no significa independencia. El cuarteto de Anscombe (1973) muestra cuatro conjuntos de datos con medias, varianzas, correlación ($r \approx 0{,}82$) y recta de regresión prácticamente idénticas, pero con formas completamente distintas. Siempre conviene representar los datos.

Alternativas más robustas son las correlaciones de rangos: **Spearman** (1904), la correlación de Pearson de los rangos, y la **tau de Kendall** (1938), basada en pares concordantes y discordantes. Ambas son invariantes ante cualquier transformación monótona creciente y menos sensibles a valores extremos.

#### Cópulas y dependencia en las colas

El teorema de Sklar (1959) permite separar cualquier distribución conjunta en sus distribuciones marginales y una **cópula** que describe la dependencia. Dos modelos con la misma correlación pueden comportarse de forma muy distinta en los extremos. El **coeficiente de dependencia en la cola superior**, $\lambda_U = \lim_{u \to 1} P\big(F_Y(Y) > u \mid F_X(X) > u\big)$, vale 0 para la cópula gaussiana (con $\rho < 1$) y es positivo para la cópula $t$ de Student. Embrechts, McNeil y Straumann (2002) describen los errores habituales de usar solo la correlación en gestión de riesgos. El uso de cópulas gaussianas para valorar CDO (Li, 2000), que infravaloran la probabilidad de impagos simultáneos, se citó a menudo como uno de los factores de la crisis de 2008.

#### Correlaciones espurias

Correlacionar **niveles de precios** (series no estacionarias) produce correlaciones altas sin significado; Yule (1926) lo llamó *nonsense correlations* y Granger y Newbold (1974) lo formalizaron para regresiones. Por eso en finanzas se correlacionan **rentabilidades**, no precios. Y, por supuesto, correlación no implica causalidad.

#### Correlaciones que cambian, sobre todo en las crisis

- Longin y Solnik (2001), con teoría de valores extremos, encuentran que la correlación entre mercados internacionales aumenta en los mercados bajistas pero no en los alcistas; Ang y Chen (2002) documentan la misma asimetría en carteras de acciones de EE. UU.
- Forbes y Rigobon (2002) advierten de un sesgo: la correlación condicionada a periodos de alta volatilidad aumenta *mecánicamente* aunque la relación subyacente no cambie. Si la varianza de un mercado aumenta en una proporción relativa $\delta$, la correlación corregida es $\rho^* = \rho_c \big/ \sqrt{1 + \delta(1 - \rho_c^2)}$.
- Para modelar correlaciones variables se usa, por ejemplo, el modelo DCC de Engle (2002).

#### Matrices de correlación grandes

Una matriz de correlación debe ser semidefinida positiva. Con $N$ activos y $T$ observaciones, si $N/T$ no es pequeño, gran parte de la estructura de la matriz muestral es ruido: Laloux, Cizeau, Bouchaud y Potters (1999), usando teoría de matrices aleatorias, mostraron que la mayoría de los autovalores de la matriz de correlaciones del S&P 500 eran indistinguibles de los de una matriz puramente aleatoria. Esto motiva las técnicas de contracción del capítulo 12.

---

## Capítulo 11 · Diversificación

> **En este capítulo** aprenderás a calcular la volatilidad de una cartera, a cuantificar cuánto riesgo elimina la diversificación y a identificar el riesgo que no se puede eliminar.

### La idea

Una **cartera** es un conjunto de inversiones, y el **peso** de cada una es la proporción del dinero total que se le asigna. La **diversificación** consiste en repartir el dinero entre inversiones que no se mueven en perfecta sincronía, de modo que los movimientos propios de cada una se compensen en parte con los de las demás.

Sus efectos tienen dos caras. La buena: mientras las correlaciones sean menores que uno, la volatilidad de la cartera es menor que la media ponderada de las volatilidades de sus componentes, y con muchos activos la parte específica de cada uno casi desaparece. La mala: la parte del riesgo que todos comparten, el riesgo de mercado o **riesgo sistemático**, no desaparece por mucho que se diversifique. Hay un suelo de volatilidad que ninguna cartera de esos activos puede perforar.

### Un ejemplo resuelto

*Dos activos.* Una cartera invierte un 60 % en acciones (volatilidad 18 %) y un 40 % en bonos (volatilidad 6 %), con una correlación de 0,1 entre ambos. Su varianza es

$$0{,}6^2 \times 0{,}18^2 + 0{,}4^2 \times 0{,}06^2 + 2 \times 0{,}6 \times 0{,}4 \times 0{,}1 \times 0{,}18 \times 0{,}06 = 0{,}012758,$$

y su volatilidad, $\sqrt{0{,}012758} = 11{,}3\,\%$. La media ponderada de las volatilidades sería $0{,}6 \times 18 + 0{,}4 \times 6 = 13{,}2\,\%$: la diversificación ahorra casi dos puntos de volatilidad.

*Muchos activos.* Supón ahora $N$ acciones con la misma volatilidad, 25 %, la misma correlación entre cada par, 0,2, y pesos iguales. La volatilidad de la cartera es:

| Número de acciones | 1 | 5 | 20 | 50 | Infinitas |
|---|---|---|---|---|---|
| Volatilidad de la cartera | 25,0 % | 15,0 % | 12,2 % | 11,6 % | 11,2 % |

Las primeras acciones añadidas reducen mucho el riesgo; las siguientes, cada vez menos. El límite, $25\,\% \times \sqrt{0{,}2} = 11{,}2\,\%$, es el suelo que fija la correlación común.

### Formalización

Para dos activos con pesos $w_1$ y $w_2$, volatilidades $\sigma_1$ y $\sigma_2$ y correlación $\rho$, la varianza de la cartera es

$$\sigma_p^2 = w_1^2\sigma_1^2 + w_2^2\sigma_2^2 + 2\,w_1 w_2\,\rho\,\sigma_1\sigma_2.$$

El último término es el que hace funcionar la diversificación: cuanto menor es $\rho$, menor es la varianza. Si $\rho = 1$, la volatilidad de la cartera es exactamente la media ponderada de las volatilidades; con cualquier $\rho < 1$, es menor.

Para $N$ activos con la misma volatilidad $\sigma$, la misma correlación $\rho$ entre cada par y pesos iguales $1/N$,

$$\sigma_p^2 = \sigma^2\left[\frac{1}{N} + \left(1 - \frac{1}{N}\right)\rho\right] \;\xrightarrow{\;N \to \infty\;}\; \rho\,\sigma^2.$$

El primer sumando, la parte específica, se desvanece como $1/N$; el segundo, la parte común, permanece. La volatilidad mínima alcanzable es $\sigma\sqrt{\rho}$.

### Gráfico interactivo

> **Gráfico interactivo · Hasta dónde llega la diversificación.** Deslizadores para la volatilidad individual (de 10 % a 50 %), la correlación común (de 0 a 0,9) y el número máximo de activos (hasta 200). La curva muestra la volatilidad de la cartera de pesos iguales frente al número de activos, con una línea horizontal en el suelo $\sigma\sqrt{\rho}$ y el área entre la curva y el suelo etiquetada como «riesgo específico aún no diversificado». Una segunda pestaña muestra el caso de dos activos: la volatilidad de la cartera frente al peso del primero, para varias correlaciones a la vez. Lo que el lector debe observar: con correlación cero el riesgo tiende a cero; con correlación positiva, la curva se aplana pronto sobre el suelo.

### En Python

```python
import numpy as np

def vol_cartera(pesos, vols, corr):
    cov = corr * np.outer(vols, vols)
    return np.sqrt(pesos @ cov @ pesos)

pesos, vols = np.array([0.6, 0.4]), np.array([0.18, 0.06])
corr = np.array([[1.0, 0.1], [0.1, 1.0]])
print(vol_cartera(pesos, vols, corr))                     # 0.113

for n in (1, 5, 20, 50):
    print(n, 0.25 * np.sqrt(1 / n + (1 - 1 / n) * 0.2))   # 0.25, 0.15, 0.122, 0.116
```

### En la práctica

- En la Unión Europea, la normativa de los fondos armonizados (UCITS) limita en general al 5 % del patrimonio la inversión en valores de un mismo emisor, con algunas excepciones acotadas: la diversificación está escrita en la ley.
- En Estados Unidos, la ley que regula los planes de pensiones de empresa obliga a sus gestores a diversificar las inversiones para minimizar el riesgo de grandes pérdidas, salvo que claramente no sea prudente hacerlo.
- Los fondos indexados que replican un índice amplio ofrecen a cualquier inversor una diversificación muy alta con una sola compra.

### Ejercicios

- **11.1** *(básico, cálculo)* Una cartera asigna el mismo peso a nueve activos independientes entre sí, todos con una volatilidad del 30 %. ¿Qué volatilidad tiene la cartera?
- **11.2** *(intermedio, cálculo)* Diez activos con volatilidad del 20 % y correlación 0,4 entre cada par, con pesos iguales. ¿Cuál es la volatilidad de la cartera? ¿Cuál es el mínimo alcanzable con muchísimos activos de ese tipo?
- **11.3** *(intermedio, cálculo)* Una cartera tiene cinco activos con pesos del 50 %, 20 %, 10 %, 10 % y 10 %. Calcula su número efectivo de activos (Ampliación) y compáralo con el de una cartera de pesos iguales.

### Ampliación · Diversificación con más rigor

#### Varianza de una cartera de $N$ activos

En notación matricial, con vector de pesos $\mathbf{w}$ y matriz de covarianzas $\Sigma$ (elementos $\sigma_{ij}$),

$$\sigma_p^2 = \mathbf{w}^\top \Sigma\, \mathbf{w} = \sum_{i=1}^N \sum_{j=1}^N w_i w_j\,\sigma_{ij}.$$

Con pesos iguales $w_i = 1/N$, si $\overline{\sigma^2}$ es la varianza media y $\overline{c}$ la covarianza media entre pares distintos,

$$\sigma_p^2 = \frac{1}{N}\,\overline{\sigma^2} + \left(1 - \frac{1}{N}\right)\overline{c} \;\xrightarrow{N\to\infty}\; \overline{c}.$$

La parte propia (idiosincrática) desaparece a la velocidad $1/N$ y queda la covarianza media: el **riesgo sistemático**. En el ejemplo resuelto del capítulo, $\overline{c} = \rho\sigma^2$, así que el suelo de volatilidad es $\sigma\sqrt{\rho} = 0{,}25\sqrt{0{,}2} = 11{,}18\,\%$.

#### El modelo de un índice

Sharpe (1963) propuso describir cada acción como $R_i = \alpha_i + \beta_i R_m + \varepsilon_i$, con perturbaciones $\varepsilon_i$ incorreladas entre sí y con el mercado. Entonces

$$\sigma_i^2 = \underbrace{\beta_i^2 \sigma_m^2}_{\text{sistemático}} + \underbrace{\sigma_{\varepsilon_i}^2}_{\text{específico}}, \qquad \sigma_p^2 = \beta_p^2\sigma_m^2 + \sum_i w_i^2\,\sigma_{\varepsilon_i}^2,$$

y el segundo término tiende a cero en carteras bien diversificadas. La fracción sistemática de la varianza es $R^2 = \beta_i^2\sigma_m^2/\sigma_i^2 = \rho_{im}^2$. Este modelo reduce los parámetros a estimar de $N(N+1)/2$ covarianzas a $3N + 2$, y es el puente con el CAPM (capítulo 13).

#### ¿Cuántos activos hacen falta?

- Evans y Archer (1968) observaron que con unos 10 valores elegidos al azar se eliminaba gran parte del riesgo diversificable.
- Statman (1987), comparando el beneficio de la reducción de riesgo con los costes, concluyó que una cartera bien diversificada necesita al menos 30 o 40 valores.
- Campbell, Lettau, Malkiel y Xu (2001) mostraron que la volatilidad idiosincrática de las acciones de EE. UU. aumentó entre 1962 y 1997, por lo que el número necesario había crecido (unos 50 valores para el mismo nivel de reducción). La tendencia no continuó: después de 2000 la volatilidad idiosincrática volvió a bajar, y Brandt, Brav, Graham y Kumar (2010) concluyeron que el aumento fue un episodio ligado a la burbuja tecnológica y a la especulación minorista, no una tendencia permanente.

#### Número efectivo de activos

Una cartera con muchos activos pero muy concentrada está poco diversificada. Una medida sencilla es el inverso del índice de Herfindahl de los pesos, $N_{\text{ef}} = 1/\sum_i w_i^2$, que vale $N$ con pesos iguales y 1 si todo está en un activo. Medidas más finas consideran también las correlaciones, como el **ratio de diversificación** $\sum_i w_i \sigma_i / \sigma_p$ (Choueifaty y Coignard, 2008) o la contribución de cada activo al riesgo, $RC_i = w_i (\Sigma\mathbf{w})_i/\sigma_p$, cuyas contribuciones suman $\sigma_p$.

#### Lo que la diversificación no hace

- No cambia por sí misma la rentabilidad esperada, que es la media ponderada de las de los activos: si se añaden activos con menor rentabilidad esperada, esta baja. Sí puede aumentar la tasa de crecimiento compuesta de una cartera reequilibrada (la rentabilidad de la diversificación, capítulo 9).
- No protege del riesgo común: si todas las correlaciones suben en una crisis (capítulo 10), el suelo $\overline{c}$ sube justo cuando más se necesita la protección.
- Una diversificación ingenua $1/N$ resulta sorprendentemente difícil de batir fuera de muestra con carteras optimizadas, por el error de estimación (DeMiguel, Garlappi y Uppal, 2009; véase el capítulo 12).

#### Marco legal mencionado en «En la práctica»

- **EE. UU.** La ley ERISA de 1974, art. 404(a)(1)(C), obliga a los gestores de planes de pensiones a diversificar las inversiones «para minimizar el riesgo de grandes pérdidas», salvo que claramente no sea prudente hacerlo.
- **UE.** La Directiva UCITS (2009/65/CE), art. 52, limita en general la inversión en valores de un mismo emisor al 5 % del patrimonio, ampliable al 10 % siempre que el total de esas posiciones superiores al 5 % no supere el 40 % (la regla «5/10/40»).

---

## Capítulo 12 · Optimización de carteras: la frontera eficiente

> **En este capítulo** aprenderás a representar todas las carteras posibles en el plano riesgo–rentabilidad, a encontrar la de menor riesgo y a entender por qué la optimización es tan sensible a los datos de entrada.

### La idea

Con dos o más activos se pueden construir infinitas carteras, una por cada reparto de pesos. Si se dibuja cada cartera como un punto, con su volatilidad en el eje horizontal y su rentabilidad media en el vertical, aparece una nube de puntos con un borde superior bien definido. Las carteras de ese borde tienen una propiedad especial: ninguna otra ofrece más rentabilidad con la misma volatilidad, ni menos volatilidad con la misma rentabilidad. Ese conjunto es la **frontera eficiente**, y cualquier cartera que quede por debajo es mejorable sin coste.

En el extremo izquierdo de la frontera está la **cartera de mínima varianza**, la combinación menos arriesgada posible. Un resultado llamativo es que esa cartera no tiene por qué estar formada solo por el activo menos volátil: añadirle una pequeña dosis de un activo más arriesgado, pero poco correlacionado, puede reducir el riesgo total.

La teoría no dice qué punto de la frontera debe elegir cada inversor; eso depende de cuánto riesgo esté dispuesto a soportar. Lo que sí dice es que conviene elegir sobre la frontera.

### Un ejemplo resuelto

Dos activos: A, con rentabilidad media del 4 % y volatilidad del 6 %, y B, con rentabilidad media del 9 % y volatilidad del 20 %. Su correlación es 0,2.

| Peso de A | 100 % | 80 % | 60 % | 40 % | 20 % | 0 % |
|---|---|---|---|---|---|---|
| Rentabilidad media | 4,0 % | 5,0 % | 6,0 % | 7,0 % | 8,0 % | 9,0 % |
| Volatilidad | 6,0 % | 6,8 % | 9,4 % | 12,7 % | 16,3 % | 20,0 % |

La rentabilidad media de la cartera es siempre la media ponderada de las de sus componentes; la volatilidad no, por el efecto de la correlación. Con la fórmula de la sección siguiente, la cartera de mínima varianza invierte un 96,9 % en A y un 3,1 % en B: su volatilidad es del 5,97 %, ligeramente *menor* que la de A sola, y su rentabilidad, del 4,15 %, ligeramente mayor. Partiendo del 100 % en A, añadir un poco de B mejora las dos cosas a la vez.

### Formalización

Para una cartera de dos activos con pesos $w$ y $1 - w$, la rentabilidad media es

$$\mu_p = w\,\mu_1 + (1 - w)\,\mu_2,$$

y la varianza viene dada por la fórmula del capítulo 11. Derivando la varianza respecto a $w$ e igualando a cero se obtiene el peso de la cartera de mínima varianza:

$$w^{*} = \frac{\sigma_2^2 - \rho\,\sigma_1\sigma_2}{\sigma_1^2 + \sigma_2^2 - 2\rho\,\sigma_1\sigma_2}.$$

Si $w^*$ queda fuera del intervalo entre 0 y 1, la cartera de mínima varianza exige una **venta en corto**: vender un activo que no se tiene (tomándolo prestado) para invertir más en el otro. Con muchos activos, la frontera se obtiene resolviendo un problema de optimización que la Ampliación formula en notación matricial.

### Gráfico interactivo

> **Gráfico interactivo · La nube y su borde.** Tres activos con medias, volatilidades y correlaciones ajustables mediante una pequeña tabla editable. Se dibujan 5.000 carteras con pesos aleatorios como puntos grises, la frontera de mínima varianza como una curva y su tramo eficiente resaltado; la cartera de mínima varianza aparece marcada. Un interruptor permite o prohíbe las ventas en corto (con ellas la frontera se extiende más allá de la nube). Otro interruptor añade un activo libre de riesgo y dibuja la recta tangente a la frontera, con la cartera de máximo ratio de Sharpe señalada. Lo que el lector debe observar: al bajar las correlaciones la nube se curva hacia la izquierda y la frontera mejora; pequeños cambios en las rentabilidades medias desplazan mucho la cartera óptima.

### En Python

```python
import numpy as np

def peso_minima_varianza(s1, s2, rho):
    return (s2**2 - rho * s1 * s2) / (s1**2 + s2**2 - 2 * rho * s1 * s2)

w = peso_minima_varianza(0.06, 0.20, 0.2)                 # 0.969
vol = np.sqrt(w**2 * 0.06**2 + (1 - w)**2 * 0.20**2
              + 2 * w * (1 - w) * 0.2 * 0.06 * 0.20)      # 0.0597
print(w, vol, w * 0.04 + (1 - w) * 0.09)                  # rentabilidad 0.0415
```

### En la práctica

- Los equipos de asignación de activos de fondos de pensiones y aseguradoras usan modelos de media-varianza, casi siempre con restricciones y ajustes, como punto de partida para decidir el reparto entre grandes clases de activos.
- Existen índices bursátiles de **mínima varianza**, calculados con un optimizador a partir de los componentes de un índice amplio, que algunos fondos cotizados toman como referencia.
- Los optimizadores profesionales nunca se alimentan con medias históricas sin más: las combinan con modelos de equilibrio o las contraen hacia valores prudentes, por los motivos que explica la Ampliación.

### Ejercicios

- **12.1** *(básico, cálculo)* Dos activos con volatilidades del 12 % y del 18 % tienen correlación −1. ¿Qué pesos dan una cartera sin riesgo?
- **12.2** *(intermedio, cálculo)* Con los activos A y B del ejemplo resuelto, calcula la rentabilidad, la volatilidad y el ratio de Sharpe (con un tipo libre de riesgo del 2 %) de la cartera 50/50. Compara su ratio con el de cada activo por separado.
- **12.3** *(avanzado, reflexión)* Un analista alimenta un optimizador con las rentabilidades medias de los últimos cinco años y obtiene una cartera que concentra el 70 % en un solo activo. ¿Por qué conviene desconfiar de ese resultado?

### Ampliación · La frontera eficiente con más rigor

#### El problema de Markowitz

Markowitz (1952) planteó la selección de carteras como un problema de optimización: para cada rentabilidad objetivo $\mu_p$, minimizar la varianza

$$\min_{\mathbf{w}}\ \mathbf{w}^\top\Sigma\,\mathbf{w} \quad \text{sujeto a} \quad \mathbf{w}^\top\boldsymbol{\mu} = \mu_p, \quad \mathbf{w}^\top\mathbf{1} = 1.$$

Con multiplicadores de Lagrange (Merton, 1972) y las constantes $A = \mathbf{1}^\top\Sigma^{-1}\mathbf{1}$, $B = \mathbf{1}^\top\Sigma^{-1}\boldsymbol{\mu}$, $C = \boldsymbol{\mu}^\top\Sigma^{-1}\boldsymbol{\mu}$ y $D = AC - B^2 > 0$, la solución da una frontera que es una hipérbola en el plano $(\sigma, \mu)$:

$$\sigma_p^2(\mu_p) = \frac{A\mu_p^2 - 2B\mu_p + C}{D}.$$

Su vértice es la **cartera de mínima varianza global**,

$$\mathbf{w}_{\text{MVG}} = \frac{\Sigma^{-1}\mathbf{1}}{A}, \qquad \mu_{\text{MVG}} = \frac{B}{A}, \qquad \sigma^2_{\text{MVG}} = \frac{1}{A}.$$

La rama superior de la hipérbola es la frontera eficiente. Para dos activos, derivar $\sigma_p^2 = w^2\sigma_1^2 + (1-w)^2\sigma_2^2 + 2w(1-w)\rho\sigma_1\sigma_2$ respecto a $w$ e igualar a cero da exactamente la fórmula de $w_1^*$ del capítulo.

**Separación en dos fondos** (Black, 1972; Merton, 1972): toda cartera de la frontera es combinación lineal de dos carteras cualesquiera de la frontera.

#### Con activo libre de riesgo: la cartera tangente

Si existe un activo sin riesgo con tipo $r_f$, la frontera eficiente pasa a ser una recta (capítulo 8) que toca la hipérbola en la **cartera tangente**

$$\mathbf{w}_T = \frac{\Sigma^{-1}(\boldsymbol{\mu} - r_f\mathbf{1})}{\mathbf{1}^\top\Sigma^{-1}(\boldsymbol{\mu} - r_f\mathbf{1})}, \qquad \text{SR}_T^2 = (\boldsymbol{\mu} - r_f\mathbf{1})^\top\Sigma^{-1}(\boldsymbol{\mu} - r_f\mathbf{1}),$$

que es la de máximo ratio de Sharpe. Con restricciones (por ejemplo, sin ventas en corto o con límites por activo, como en las fases avanzadas del proyecto práctico del final del libro), ya no hay solución cerrada y se resuelve un problema de **programación cuadrática**; Markowitz desarrolló para ello el algoritmo de la línea crítica.

#### El gran problema: el error de estimación

En la práctica, $\boldsymbol\mu$ y $\Sigma$ son desconocidos y se estiman con error. El optimizador tiende a sobreponderar los activos cuya rentabilidad se ha sobrestimado: Michaud (1989) lo describió como un «maximizador de errores». Best y Grauer (1991) mostraron que los pesos óptimos son extremadamente sensibles a pequeños cambios en las medias, y Chopra y Ziemba (1993) estimaron que los errores en las medias son del orden de diez veces más dañinos que los errores en las varianzas, y estos unas dos veces más que los errores en las covarianzas. Recuérdese (capítulo 7) que las medias son, precisamente, lo más difícil de estimar.

Remedios principales:

1. **Contracción de la matriz de covarianzas** hacia una estructura simple (Ledoit y Wolf, 2004).
2. **Modelo de Black y Litterman** (1992): parte de las rentabilidades implícitas en el equilibrio del mercado (CAPM inverso) y las combina bayesianamente con las opiniones del inversor.
3. **Restricciones**: Jagannathan y Ma (2003) mostraron que imponer la restricción de no vender en corto equivale a contraer la matriz de covarianzas y mejora los resultados fuera de muestra.
4. **Carteras que no necesitan medias**: mínima varianza global, paridad de riesgo (contribuciones iguales al riesgo; Maillard, Roncalli y Teïletche, 2010) o pesos iguales $1/N$. DeMiguel, Garlappi y Uppal (2009) encontraron que ninguno de 14 modelos optimizados batía de forma consistente a $1/N$ fuera de muestra con los tamaños de muestra habituales. La conclusión no es universal: con estimadores más robustos o con entradas más estables, varias carteras optimizadas sí baten a $1/N$ (Kritzman, Page y Turkington, 2010; Kirby y Ostdiek, 2012). La lección es que optimizar solo añade valor si los datos de entrada contienen más información que ruido.

#### Evidencia sobre las carteras de mínima varianza

Las carteras de mínima varianza de acciones de EE. UU. han obtenido históricamente rentabilidades similares al mercado con volatilidad claramente menor (Clarke, de Silva y Thorley, 2006), una observación relacionada con la «anomalía de baja volatilidad» del capítulo 13. Es lo que explica la existencia de los índices de mínima varianza mencionados en «En la práctica».

#### Reconocimiento

Markowitz recibió el Premio Nobel de Economía en 1990, junto con William Sharpe y Merton Miller, por sus contribuciones a la teoría de la economía financiera.

---

## Capítulo 13 · Beta, CAPM y factores de riesgo

> **En este capítulo** aprenderás a medir la sensibilidad de un activo al mercado, a calcular la rentabilidad que exige el modelo de valoración de activos financieros y a interpretar sus aciertos y sus límites.

### La idea

El capítulo 11 mostró que el riesgo de un activo tiene dos componentes: uno común a todo el mercado y otro específico de ese activo, que se puede eliminar diversificando. Esta distinción tiene una consecuencia profunda. Si cualquier inversor puede librarse del **riesgo específico** sin coste, combinando muchos activos, el mercado no tiene por qué pagar una prima por soportarlo. Lo único que debería remunerarse es la exposición al riesgo que no se puede diversificar: el de la **cartera de mercado**, que contiene todos los activos con riesgo en proporción a su valor.

La **beta** mide esa exposición: cuánto tiende a moverse un activo cuando se mueve el mercado. Una beta de 1 indica que el activo amplifica los movimientos del mercado en la misma proporción; una beta de 1,5, que los amplifica un 50 %; una de 0,6, que los amortigua, y una negativa, que tiende a moverse en sentido contrario. El **modelo de valoración de activos financieros** (CAPM, por sus siglas en inglés) concluye que la rentabilidad esperada de cada activo es el tipo libre de riesgo más su beta multiplicada por la **prima de riesgo del mercado**, la rentabilidad esperada del mercado por encima del tipo libre de riesgo.

### Un ejemplo resuelto

El tipo libre de riesgo es del 2,5 % y la prima de riesgo del mercado, del 5,5 %. La volatilidad del mercado es del 15 %.

- Una eléctrica tiene una volatilidad del 15 % y una correlación de 0,6 con el mercado. Su beta es $0{,}6 \times 15/15 = 0{,}6$, y el CAPM le asigna una rentabilidad esperada de $2{,}5 + 0{,}6 \times 5{,}5 = 5{,}8\,\%$.
- Una tecnológica tiene una volatilidad del 30 % y una correlación de 0,75. Su beta es $0{,}75 \times 30/15 = 1{,}5$, y su rentabilidad esperada, $2{,}5 + 1{,}5 \times 5{,}5 = 10{,}75\,\%$.

La tecnológica tiene el doble de volatilidad que la eléctrica, pero lo que determina su prima no es la volatilidad total, sino la parte ligada al mercado. Si el mercado cayera un 4 % en un día, cabría esperar, de media, una caída del 2,4 % en la eléctrica y del 6 % en la tecnológica.

### Formalización

Sea $R_i$ la rentabilidad del activo $i$, $R_m$ la del mercado y $\sigma_m$ la volatilidad del mercado. La beta del activo es

$$\beta_i = \frac{\operatorname{Cov}(R_i, R_m)}{\sigma_m^2} = \rho_{im}\,\frac{\sigma_i}{\sigma_m}.$$

Es la pendiente de la recta de regresión de las rentabilidades del activo sobre las del mercado. El CAPM afirma que, en equilibrio,

$$E[R_i] = r_f + \beta_i\,\big(E[R_m] - r_f\big).$$

Representada en un plano con la beta en el eje horizontal y la rentabilidad esperada en el vertical, esta relación es una recta, la **línea del mercado de valores**, que corta el eje vertical en $r_f$ y tiene pendiente igual a la prima de riesgo del mercado. Un activo cuya rentabilidad media quede por encima de la recta tiene un **alfa** positivo: rinde más de lo que su beta justifica.

### Gráfico interactivo

> **Gráfico interactivo · Lo que paga el mercado.** Panel izquierdo: nubes de rentabilidades diarias simuladas de tres activos frente al mercado, con su recta de regresión; un deslizador cambia la beta y la volatilidad específica de cada uno, y el lector ve que la pendiente (beta) y la dispersión alrededor de la recta (riesgo específico) son cosas distintas. Panel derecho: la línea del mercado de valores, con el tipo libre de riesgo y la prima ajustables, y diez activos simulados como puntos alrededor de ella; al pasar el cursor sobre un punto se muestran su beta, su rentabilidad media y su alfa. Lo que el lector debe observar: dos activos con la misma volatilidad pueden tener betas muy distintas, y según el modelo solo la beta determina la rentabilidad esperada.

### En Python

```python
import numpy as np

def beta(r_activo, r_mercado):
    return np.cov(r_activo, r_mercado, ddof=1)[0, 1] / np.var(r_mercado, ddof=1)

def capm(beta_i, rf, prima):
    return rf + beta_i * prima

rng = np.random.default_rng(5)
mercado = rng.normal(0.0003, 0.01, 1_000)
accion = 1.5 * mercado + rng.normal(0, 0.012, 1_000)   # beta verdadera: 1,5
print(round(beta(accion, mercado), 2), capm(1.5, 0.025, 0.055))   # ~1.5 y 0.1075
```

### En la práctica

- Muchas empresas estiman con el CAPM el coste de sus recursos propios, la rentabilidad mínima que deben ofrecer a sus accionistas, para evaluar inversiones y para valorar compañías.
- Los reguladores de sectores como la electricidad o el gas usan el CAPM dentro del cálculo del coste del capital con el que fijan la retribución de las redes; en España lo hace la Comisión Nacional de los Mercados y la Competencia.
- Los gestores de fondos se evalúan a menudo por su alfa: la rentabilidad obtenida por encima de lo que explicaría su exposición al mercado.

### Ejercicios

- **13.1** *(básico, cálculo)* Una acción tiene una volatilidad del 24 %, el mercado del 16 % y su correlación es 0,7. ¿Cuál es su beta? Si en una sesión el índice de mercado pierde un 3 %, ¿qué variación media cabe esperar en la acción?
- **13.2** *(básico, cálculo)* Con una rentabilidad esperada del mercado del 7 % y un tipo libre de riesgo del 2 %, calcula la rentabilidad esperada que el CAPM atribuye a una acción defensiva de beta 0,8.
- **13.3** *(intermedio, cálculo)* Un fondo con beta 1,2 obtuvo un 9 % en un año en el que el mercado rindió un 8 % y el tipo libre de riesgo fue del 2 %. ¿Cuál fue su alfa respecto al CAPM?
- **13.4** *(avanzado, reflexión)* Una acción muy volátil pero casi incorrelada con el mercado tiene, según el CAPM, una rentabilidad esperada cercana al tipo libre de riesgo. ¿Por qué tiene sentido, dentro del modelo, que un activo tan arriesgado no ofrezca prima?

### Ampliación · La beta y el CAPM con más rigor

#### Supuestos

El CAPM (Sharpe, 1964; Lintner, 1965; Mossin, 1966) se apoya en supuestos fuertes: inversores que solo se preocupan por media y varianza en un único periodo, expectativas homogéneas, préstamo y endeudamiento ilimitados al tipo libre de riesgo, activos perfectamente divisibles y mercados sin costes ni impuestos.

#### Derivación

Si todos los inversores tienen las mismas expectativas, todos eligen la misma cartera tangente (capítulo 12); en equilibrio la oferta debe igualar la demanda, así que la cartera tangente es la **cartera de mercado** $M$. La condición de primer orden de la maximización del Sharpe es $\boldsymbol\mu - r_f\mathbf{1} = \lambda\,\Sigma\,\mathbf{w}_M$. El elemento $i$-ésimo de $\Sigma\mathbf{w}_M$ es $\operatorname{Cov}(R_i, R_M)$; multiplicando por $\mathbf{w}_M^\top$ se obtiene $\lambda = (\mu_M - r_f)/\sigma_M^2$, y por tanto

$$E[R_i] - r_f = \frac{\operatorname{Cov}(R_i, R_M)}{\sigma_M^2}\,\big(E[R_M] - r_f\big) = \beta_i\,\big(E[R_M] - r_f\big).$$

La intuición: lo que importa de un activo no es su varianza total, sino cuánto aporta al riesgo de la cartera que todos tienen, que es su covarianza con el mercado.

#### Estimación de la beta

Se estima por mínimos cuadrados en la **regresión de mercado**

$$R_{i,t} - r_{f,t} = \alpha_i + \beta_i\,(R_{M,t} - r_{f,t}) + \varepsilon_{i,t},$$

donde $\hat\beta_i = \widehat{\operatorname{Cov}}/\widehat{\operatorname{Var}}$ y, según el CAPM, $\alpha_i = 0$. Las betas estimadas tienden a revertir hacia 1 con el tiempo (Blume, 1971), por lo que se usan ajustes bayesianos (Vasicek, 1973) o la regla práctica $\beta_{\text{ajust}} = \tfrac23\hat\beta + \tfrac13$. El resultado depende del índice usado como mercado, de la frecuencia y de la ventana de estimación.

#### Evidencia empírica

- Black, Jensen y Scholes (1972) y Fama y MacBeth (1973) encontraron una relación positiva entre beta y rentabilidad, pero la línea del mercado de valores era **más plana** de lo previsto: las acciones de beta baja rendían más de lo que predecía el modelo y las de beta alta, menos.
- Fama y French (1992) concluyeron que, una vez controlados el tamaño y el ratio valor contable/valor de mercado, la beta apenas explicaba las rentabilidades medias de las acciones de EE. UU. entre 1963 y 1990. Su revisión de 2004 resume que los problemas empíricos invalidan el CAPM en sus aplicaciones habituales.
- Frazzini y Pedersen (2014) explican la línea plana por las restricciones al apalancamiento (quien no puede endeudarse compra acciones de beta alta) y documentan los beneficios de la estrategia *betting against beta*.
- **Crítica de Roll** (1977): la cartera de mercado del modelo incluye *todos* los activos con riesgo (también inmuebles, capital humano, etc.) y no es observable; contrastar el CAPM con un índice bursátil es, en rigor, contrastar si ese índice es eficiente en media-varianza.

#### Extensiones

| Modelo | Idea |
|---|---|
| CAPM de beta cero (Black, 1972) | sin activo libre de riesgo, el papel de $r_f$ lo ocupa una cartera incorrelada con el mercado |
| CAPM intertemporal (Merton, 1973) | los inversores también se cubren frente a cambios en las oportunidades de inversión futuras |
| Teoría de valoración por arbitraje, APT (Ross, 1976) | varios factores de riesgo sistemático, justificados por ausencia de arbitraje |
| Tres factores de Fama y French (1993) | mercado, tamaño (SMB) y valor (HML) |
| Cuatro factores de Carhart (1997) | añade el *momentum* |
| Cinco factores de Fama y French (2015) | añade rentabilidad operativa e inversión |

El modelo de tres factores se escribe

$$R_i - r_f = \alpha_i + \beta_{i}\,(R_M - r_f) + s_i\,\text{SMB} + h_i\,\text{HML} + \varepsilon_i.$$

Esta línea de investigación es la base de la llamada «inversión por factores», que construye carteras expuestas de forma deliberada a cada uno de estos factores.

#### El «zoo» de factores y la crisis de replicación

Desde los años noventa se han publicado cientos de supuestos factores o anomalías (Harvey, Liu y Zhu, 2016, catalogaron 316). Como se han probado tantos, estos autores proponen exigir a un factor nuevo un estadístico $t$ superior a 3, no a 2. McLean y Pontiff (2016) encontraron que la rentabilidad media de las anomalías cae un 26 % fuera de la muestra original y un 58 % tras su publicación. Hou, Xue y Zhang (2020) no lograron replicar alrededor de dos tercios de 452 anomalías al reducir el peso de las empresas más pequeñas, mientras que Jensen, Kelly y Pedersen (2023) sostienen, con un enfoque bayesiano, que la mayoría de factores sí se replican cuando se agrupan por temas. El modelo $q$ de Hou, Xue y Zhang (2015), basado en inversión y rentabilidad, compite con el de cinco factores. La moraleja práctica: desconfiar de cualquier factor o estrategia que solo funcione en un backtest (tema complementario A).

#### Uso práctico

Pese a sus problemas empíricos, el CAPM sigue siendo el método más usado para estimar el coste de los recursos propios: en la encuesta de Graham y Harvey (2001), el 73,5 % de los directores financieros de EE. UU. declaró utilizarlo siempre o casi siempre. Los reguladores de servicios públicos lo usan para fijar la rentabilidad permitida de las redes; en España, por ejemplo, la CNMC aplica una metodología de coste medio ponderado del capital (WACC) con CAPM para la retribución de las redes eléctricas y de gas (Circular 2/2019 y sus revisiones posteriores).

---

# Parte V · Decidir y medir lo extremo

La última parte trata dos preguntas prácticas. La primera es cuánto arriesgar cuando se tiene una ventaja: el criterio de Kelly (capítulo 14) da una respuesta precisa y muestra por qué arriesgar demasiado puede arruinar incluso a quien tiene las probabilidades a favor. La segunda es cómo medir las pérdidas raras pero graves: el capítulo 15 muestra que los mercados reales producen muchos más extremos de los que predice la normal, y el capítulo 16 presenta el valor en riesgo y el déficit esperado, las medidas que usan bancos, aseguradoras y supervisores.

---

## Capítulo 14 · Cuánto arriesgar: el criterio de Kelly

> **En este capítulo** aprenderás a calcular la fracción del capital que maximiza el crecimiento a largo plazo de una apuesta favorable, y por qué en la práctica casi todo el mundo apuesta menos.

### La idea

Tener una ventaja no basta: también hay que decidir cuánto arriesgar. Quien apuesta muy poco desaprovecha su ventaja y su capital apenas crece. Quien apuesta demasiado se expone a que una racha de pérdidas, que tarde o temprano llega, lo deje sin capital para seguir. Como cada pérdida reduce la base sobre la que se calculan las apuestas siguientes, las pérdidas pesan más de lo que su probabilidad sugiere: es el lastre de la volatilidad del capítulo 9 en otra forma.

El **criterio de Kelly** responde con precisión: cuando se conocen las probabilidades y se reinvierten las ganancias, existe una fracción del capital que maximiza la tasa de crecimiento a largo plazo. Apostar más que esa fracción aumenta el riesgo y además reduce el crecimiento; apostar el doble lo anula.

Para entender el criterio conviene fijarse en el jugador **mediano**, el que queda en el centro de la distribución de resultados, y no en el promedio. Con apuestas agresivas, el promedio de la riqueza puede ser enorme gracias a unos pocos jugadores muy afortunados, mientras que la mayoría termina arruinada.

### Un ejemplo resuelto

Un jugador dispone de una moneda trucada que sale cara el 53 % de las veces y apuesta siempre a cara, con pago a la par: si gana, recibe lo apostado; si pierde, lo pierde. En cada jugada arriesga una fracción fija $f$ de su capital. ¿Qué fracción le conviene?

Con la fórmula que se deduce más abajo, la fracción de Kelly es $f^* = 2 \times 0{,}53 - 1 = 6\,\%$. La tabla muestra la tasa de crecimiento logarítmica por jugada, $g(f)$, y el factor por el que se multiplica la riqueza mediana tras 1.000 jugadas, $e^{1000\,g(f)}$:

| Fracción apostada | 3 % | 6 % (Kelly) | 12 % | 15 % |
|---|---|---|---|---|
| Crecimiento por jugada | 0,00135 | 0,00180 | −0,00002 | −0,00231 |
| Riqueza mediana tras 1.000 jugadas | ×3,9 | ×6,1 | ×0,98 | ×0,10 |

Apostar la mitad de Kelly conserva unas tres cuartas partes del crecimiento con mucha menos oscilación. Apostar el doble de Kelly (12 %) deja al jugador mediano donde empezó, a pesar de que cada jugada tiene valor esperado positivo. Y por encima del doble, el jugador mediano se empobrece.

### Formalización

Sea $p$ la probabilidad de ganar, $1 - p$ la de perder y $b$ la ganancia neta por euro apostado cuando se gana ($b = 1$ para un pago a la par). Si se apuesta en cada jugada la fracción $f$ del capital, la tasa de crecimiento logarítmica media por jugada es

$$g(f) = p\,\ln(1 + b f) + (1 - p)\,\ln(1 - f).$$

Derivando e igualando a cero se obtiene la fracción que la maximiza:

$$f^{*} = p - \frac{1 - p}{b}, \qquad \text{y con } b = 1, \quad f^{*} = 2p - 1.$$

Si $f^* \le 0$, la apuesta no es favorable y lo óptimo es no apostar. Para inversiones con rentabilidad media $\mu$, volatilidad $\sigma$ y tipo libre de riesgo $r$, la versión continua del criterio es $f^* = (\mu - r)/\sigma^2$, que la Ampliación deduce.

### Gráfico interactivo

> **Gráfico interactivo · El tamaño de la apuesta.** Deslizadores para la probabilidad de ganar (de 0,50 a 0,70), el pago $b$ (de 0,5 a 5) y la fracción apostada (de 0 % a 50 %). Panel izquierdo: la curva de crecimiento $g(f)$, con su máximo en la fracción de Kelly marcado y la zona de crecimiento negativo sombreada en rojo; el punto de la fracción elegida se desplaza sobre la curva. Panel derecho: 1.000 jugadores simulados que empiezan con 100 € y juegan 1.000 veces con la fracción elegida; se muestran en escala logarítmica las trayectorias de la mediana, de los percentiles 10 y 90 y de la riqueza media, junto con el porcentaje de jugadores que terminan por debajo de 10 €. Lo que el lector debe observar: al pasar de la fracción de Kelly, la mediana empeora aunque la media siga subiendo; al acercarse al doble de Kelly, el crecimiento mediano desaparece.

### En Python

```python
import math

def crecimiento(f, p, b=1.0):
    return p * math.log(1 + b * f) + (1 - p) * math.log(1 - f)

def fraccion_kelly(p, b=1.0):
    return max(0.0, p - (1 - p) / b)

f = fraccion_kelly(0.53)                     # 0.06
for x in (f / 2, f, 2 * f, 2.5 * f):
    g = crecimiento(x, 0.53)
    print(f"{x:.0%}  g = {g:.5f}  riqueza mediana x{math.exp(1000 * g):.2f}")
```

### En la práctica

- Muchos inversores y apostadores profesionales que usan el criterio apuestan una fracción de Kelly, a menudo la mitad, porque sus probabilidades son estimaciones y equivocarse por exceso es mucho más costoso que equivocarse por defecto.
- Algunos gestores cuantitativos usan versiones del criterio para decidir el apalancamiento total de una estrategia a partir de su rentabilidad esperada y su volatilidad.
- El criterio sirve también como límite superior de sentido común: una posición mayor que la de Kelly, con la ventaja estimada, no solo es arriesgada sino que reduce el crecimiento esperado a largo plazo.

### Ejercicios

- **14.1** *(básico, cálculo)* Una apuesta a la par gana con probabilidad 0,58. ¿Qué fracción del capital recomienda el criterio de Kelly?
- **14.2** *(intermedio, cálculo)* Una apuesta paga 3 a 1 ($b = 3$) y gana con probabilidad 0,3. Calcula la fracción de Kelly y la tasa de crecimiento con Kelly completo y con medio Kelly. ¿Qué proporción del crecimiento conserva medio Kelly?
- **14.3** *(avanzado, cálculo)* Un activo tiene una rentabilidad en exceso esperada del 5 % anual y una volatilidad del 20 %. Según la versión continua del criterio, ¿qué fracción del capital debería invertirse en él? ¿Qué tasa de crecimiento en exceso se obtiene con Kelly completo y con medio Kelly?

### Ampliación · El criterio de Kelly con más rigor

#### Derivación

Con una apuesta que paga $b$ por unidad con probabilidad $p$ y pierde la unidad con probabilidad $q = 1 - p$, apostando cada vez la fracción $f$ de la riqueza, tras $n$ apuestas con $k$ aciertos se tiene $W_n = W_0 (1 + bf)^k (1 - f)^{n-k}$. Por la ley de los grandes números, $k/n \to p$ y la tasa de crecimiento por apuesta converge a

$$g(f) = \lim_{n\to\infty}\frac1n \ln\frac{W_n}{W_0} = p\ln(1 + bf) + q\ln(1 - f).$$

Derivando: $g'(f) = \dfrac{pb}{1 + bf} - \dfrac{q}{1 - f} = 0 \Rightarrow f^* = \dfrac{pb - q}{b} = p - \dfrac{q}{b}$. Como $g''(f) < 0$, es un máximo. La fórmula suele leerse como «ventaja dividida por cuota»: $f^* = (\text{ganancia esperada por unidad})/b$. Si la ventaja $pb - q$ es negativa o nula, $f^* \le 0$: no se apuesta.

*Ejemplo (el del capítulo):* $p = 0{,}53$, $b = 1$: $f^* = 0{,}06$ y $g^* = 0{,}53\ln 1{,}06 + 0{,}47\ln 0{,}94 = 0{,}0018$ por apuesta, es decir, la riqueza mediana se multiplica por $e^{0{,}0018 \times 1000} \approx 6$ en 1.000 apuestas.

#### Origen en la teoría de la información

John L. Kelly Jr. (1956), en los Bell Labs, llegó a este resultado estudiando a un jugador que recibe información a través de un canal con ruido: la tasa de crecimiento máxima de su capital es igual a la tasa de transmisión de información del canal en el sentido de Shannon (1948). Para $b = 1$, $g^* = \ln 2 + p\ln p + q\ln q$, es decir, $\ln 2$ menos la entropía (en nats) del resultado. Latané (1959) propuso de forma independiente maximizar la media geométrica, y Breiman (1961) demostró sus propiedades asintóticas: la estrategia de Kelly maximiza la riqueza a largo plazo frente a cualquier otra estrategia «esencialmente distinta» y minimiza el tiempo esperado para alcanzar un objetivo lejano. Edward Thorp la aplicó al *blackjack* (*Beat the Dealer*, 1962) y después a la inversión (Rotando y Thorp, 1992; Thorp, 2006).

#### La forma de la curva de crecimiento

Para ventajas pequeñas, un desarrollo de Taylor da $g(f) \approx f\,(pb - q) - \tfrac12 f^2\,m_2$, donde $m_2 = E[X^2]$ es el segundo momento del resultado de una apuesta unitaria (casi igual a su varianza cuando la ventaja es pequeña): una parábola simétrica alrededor de $f^*$. De ahí tres reglas:

- Apostar el **doble** de Kelly da un crecimiento aproximadamente **nulo** (en el ejemplo, $g(0{,}12) = -0{,}00002$).
- Apostar más del doble da crecimiento **negativo**: la ruina es casi segura a largo plazo, aunque cada apuesta tenga valor esperado positivo. El ejemplo del capítulo lo muestra: con $f = 12\,\%$, el doble de Kelly, la riqueza mediana tras 1.000 apuestas apenas se mueve (×0,98), y con $f = 15\,\%$ queda reducida a una décima parte.
- En la aproximación cuadrática, apostar un mismo porcentaje de menos o de más cuesta *el mismo* crecimiento. La asimetría está en todo lo demás: apostar de más multiplica la volatilidad y las caídas (con $1{,}5 f^*$ la volatilidad es el triple que con $0{,}5 f^*$, y el crecimiento es prácticamente el mismo), la curva exacta cae más deprisa a la derecha de $f^*$ y, por encima de $2 f^*$, el crecimiento pasa a ser negativo. Como la ventaja real suele sobrestimarse, equivocarse por defecto es la opción prudente.

#### Versión continua y con varios activos

Para un activo que sigue un movimiento browniano geométrico con media $\mu$, volatilidad $\sigma$ y tipo libre de riesgo $r$, la fracción que maximiza el crecimiento es

$$f^* = \frac{\mu - r}{\sigma^2}, \qquad g^* = r + \frac{(\mu - r)^2}{2\sigma^2} = r + \tfrac12\,\text{SR}^2,$$

y con varios activos $\mathbf{f}^* = \Sigma^{-1}(\boldsymbol\mu - r\mathbf{1})$, que es proporcional a la cartera tangente de Markowitz (capítulo 12). El criterio de Kelly coincide con maximizar la utilidad logarítmica de Bernoulli (capítulo 3) y es miope: la decisión óptima no depende del horizonte (Merton, 1969).

#### Kelly fraccionario

Apostar una fracción $c f^*$ con $0 < c \le 1$ da, en el modelo continuo, un crecimiento $c(2 - c)\,g^*_{\text{exceso}}$ y una volatilidad $c$ veces la de Kelly completo. Con medio Kelly ($c = 1/2$) se conserva el 75 % del crecimiento con la mitad de volatilidad, el resultado que la solución del ejercicio 14.2 obtiene numéricamente para una apuesta discreta ($0{,}00486/0{,}00640 \approx 0{,}76$). Kelly fraccionario equivale a una utilidad isoelástica con aversión relativa al riesgo $1/c$ (MacLean, Thorp y Ziemba, 2011).

Las **caídas** son importantes incluso con Kelly completo: en el modelo continuo, la probabilidad de que la riqueza llegue a caer alguna vez hasta una fracción $x$ de su valor inicial es $x$ con Kelly completo y $x^{2/c - 1}$ con Kelly fraccionario (Thorp, 2006). Con Kelly completo hay un 50 % de probabilidad de perder alguna vez la mitad del capital; con medio Kelly, un 12,5 %.

#### Críticas y limitaciones

- Samuelson (1979), en un artículo escrito deliberadamente con palabras de una sola sílaba, recordó que maximizar el crecimiento no es lo mismo que maximizar la utilidad esperada para un inversor que no tenga utilidad logarítmica, por largo que sea el horizonte.
- En la práctica $p$, $\mu$ y $\sigma$ se estiman con error; si la ventaja se sobrestima, se apuesta de más, con las consecuencias descritas arriba. Es la razón principal del uso de fracciones como medio Kelly.

---

## Capítulo 15 · Colas gruesas

> **En este capítulo** aprenderás a medir el peso de las colas de una distribución, a reconocer cuándo la normal infravalora los extremos y qué consecuencias tiene para la gestión del riesgo.

### La idea

Según la distribución normal, los movimientos de más de cuatro o cinco desviaciones típicas deberían ser tan raros que nadie los vería en toda su vida profesional. En los mercados reales aparecen con cierta regularidad. Las distribuciones de rentabilidades diarias de acciones, divisas o materias primas tienen **colas gruesas**: concentran más probabilidad en los extremos (y también cerca del centro) que una normal con la misma volatilidad, a costa de la zona intermedia.

La medida clásica del peso de las colas es la **curtosis**, que promedia la cuarta potencia de las desviaciones respecto a la media. Al elevar a la cuarta, los valores extremos pesan muchísimo más que los moderados, así que la curtosis es, en la práctica, un indicador de la frecuencia y el tamaño de los extremos. La normal tiene curtosis 3; las rentabilidades diarias suelen superar con holgura ese valor.

### Un ejemplo resuelto

Un índice con una volatilidad diaria del 1,1 % cae un 6,6 % en una sesión, una caída de seis desviaciones típicas. ¿Qué frecuencia le asignaría un modelo normal?

La probabilidad de que una normal quede más de seis desviaciones típicas por debajo de su media es $\Phi(-6) \approx 9{,}9 \times 10^{-10}$. Con 252 sesiones al año, eso equivale a una sesión así cada $1/(252 \times 9{,}9 \times 10^{-10}) \approx 4$ millones de años. Sin embargo, caídas de esa magnitud se han observado varias veces en las últimas décadas en los grandes índices. Si la misma volatilidad se combina con una distribución de colas gruesas, como una $t$ de Student de 4 grados de libertad reescalada para que tenga la misma desviación típica, la probabilidad sube a $5{,}3 \times 10^{-4}$: una sesión así cada siete años y medio, aproximadamente. La volatilidad es la misma; lo que cambia es la forma de la cola.

### Formalización

Sea $X$ una rentabilidad con media $\mu$ y desviación típica $\sigma$. Su **asimetría** y su curtosis son

$$\gamma = \frac{E\big[(X - \mu)^3\big]}{\sigma^3}, \qquad \kappa = \frac{E\big[(X - \mu)^4\big]}{\sigma^4}.$$

La asimetría es negativa cuando la cola izquierda (las pérdidas) es más larga que la derecha. Para la normal, $\gamma = 0$ y $\kappa = 3$; muchos programas informan de la **curtosis en exceso**, $\kappa - 3$, que vale 0 para la normal. Una distribución con $\kappa > 3$ se llama leptocúrtica.

Para la normal, la probabilidad de alejarse más de $k$ desviaciones típicas por debajo de la media es $\Phi(-k)$: un 2,3 % para $k = 2$, un 0,13 % para $k = 3$, $3{,}2 \times 10^{-5}$ para $k = 4$ y $2{,}9 \times 10^{-7}$ para $k = 5$. Esas cifras caen muy deprisa; en las distribuciones de colas gruesas, mucho más despacio.

### Gráfico interactivo

> **Gráfico interactivo · Lo que la campana no ve.** Un deslizador elige los grados de libertad de una $t$ de Student (de 3 a 30) reescalada para tener la misma volatilidad diaria (1 %) que una normal de referencia. Panel superior: cincuenta años de rentabilidades diarias simuladas con cada modelo, una encima de otra, con líneas horizontales en ±4 % para contar los días que las superan; con 4 grados de libertad cabe esperar unos 60 días así, frente a menos de uno con la normal. Panel inferior: la probabilidad de superar cada umbral, en escala logarítmica, para los dos modelos: la curva normal se desploma y la de colas gruesas desciende como una recta. Un recuadro muestra la curtosis muestral de cada simulación. Lo que el lector debe observar: al bajar los grados de libertad aparecen días extremos mucho más a menudo, y la curtosis muestral salta de una simulación a otra.

### En Python

```python
import numpy as np
from statistics import NormalDist

def curtosis(x):
    x = np.asarray(x)
    return np.mean((x - x.mean())**4) / x.var()**2

print(NormalDist().cdf(-6))                       # 9.9e-10

rng = np.random.default_rng(8)
nu = 4
t = rng.standard_t(nu, 12_600) * np.sqrt((nu - 2) / nu)   # varianza unitaria
normal = rng.standard_normal(12_600)
print(curtosis(normal), curtosis(t))              # ~3 frente a un valor mucho mayor
print((np.abs(normal) > 4).sum(), (np.abs(t) > 4).sum())
```

### En la práctica

- Las colas gruesas de las rentabilidades diarias se consideran uno de los «hechos estilizados» mejor documentados de los mercados financieros, presentes en casi todos los activos y periodos.
- Los modelos de riesgo modernos sustituyen la normal por distribuciones de colas gruesas, por simulación histórica o por teoría de valores extremos, y se complementan con pruebas de resistencia ante escenarios graves.
- En los mercados de opciones, las opciones que protegen contra caídas fuertes cotizan más caras de lo que implicaría una normal, una señal de que los participantes asignan a los extremos más probabilidad que la campana.

### Ejercicios

- **15.1** *(básico, cálculo)* Si las rentabilidades diarias fueran normales, ¿con qué frecuencia cabría esperar una caída de más de cuatro desviaciones típicas, con 252 sesiones al año?
- **15.2** *(intermedio, cálculo)* Una rentabilidad toma los valores ±1 % con probabilidad 0,45 cada uno y ±4 % con probabilidad 0,05 cada uno. Calcula su media, su varianza y su curtosis. ¿Tiene colas más gruesas que la normal?
- **15.3** *(intermedio, cálculo)* Con una $t$ de 4 grados de libertad reescalada a la misma volatilidad, la probabilidad de un movimiento de más de cuatro desviaciones típicas en cualquier sentido es de un 0,48 % por sesión. ¿Cuántas sesiones así cabe esperar al año? ¿Cuántas veces más que con la normal?
- **15.4** *(avanzado, reflexión)* Un modelo normal calibrado con una volatilidad diaria del 1 % observa una caída del 7 % en un día. ¿Qué conclusión sacarías sobre el modelo?

### Ampliación · Colas gruesas con más rigor

#### Momentos de orden superior

La **asimetría** $\gamma_1 = E[(X - \mu)^3]/\sigma^3$ mide si una cola es más larga que la otra (las rentabilidades de índices bursátiles suelen tener asimetría negativa: caídas grandes más frecuentes que subidas grandes). La **curtosis** $\kappa = E[(X - \mu)^4]/\sigma^4$ mide el peso de las colas. Westfall (2014) aclaró que, pese a la explicación tradicional, la curtosis apenas informa sobre el «apuntamiento» del centro: está dominada casi por completo por las observaciones extremas.

**Contraste de normalidad de Jarque y Bera** (1980): con asimetría muestral $S$ y curtosis muestral $K$,

$$JB = \frac{n}{6}\left(S^2 + \frac{(K - 3)^2}{4}\right) \;\sim\; \chi^2_2 \text{ bajo normalidad}.$$

Con rentabilidades diarias de acciones, la normalidad se rechaza de forma abrumadora.

#### Colas potenciales y por qué la curtosis muestral es inestable

La evidencia empírica (Gopikrishnan *et al.*, 1999; Gabaix *et al.*, 2003) indica que las colas de las rentabilidades se comportan como una ley de potencia,

$$P(|X| > x) \sim C\,x^{-\alpha}, \qquad \alpha \approx 3$$

(la «ley cúbica inversa»). Un momento de orden $k$ solo es finito si $k < \alpha$. Con $\alpha \approx 3$ la varianza existe, pero el **cuarto momento es infinito**: la curtosis teórica no existe y la curtosis muestral no converge, sino que crece con el tamaño de muestra y depende de unos pocos días extremos. Puede comprobarse con el gráfico interactivo del capítulo: con una $t$ de 4 grados de libertad (cuya curtosis teórica es infinita) y 50 años de datos diarios, seis simulaciones con semillas distintas dieron curtosis muestrales entre 9 y 36. Esas cifras deben interpretarse como «colas muy gruesas», no como un parámetro estable. Si $\alpha$ está algo por encima de 4, la curtosis existe, pero su estimador muestral sigue siendo muy inestable, porque su varianza depende del octavo momento.

El índice de cola se estima con el **estimador de Hill** (1975): ordenando $|X|$ de mayor a menor, $X_{(1)} \ge X_{(2)} \ge \cdots$,

$$\hat\alpha_k = \left(\frac1k\sum_{i=1}^{k}\ln\frac{X_{(i)}}{X_{(k+1)}}\right)^{-1},$$

usando solo las $k$ observaciones más extremas.

#### Modelos con colas gruesas

- **$t$ de Student** con $\nu$ grados de libertad (Praetz, 1972; Blattberg y Gonedes, 1974): colas potenciales con $\alpha = \nu$, varianza $\nu/(\nu - 2)$ y curtosis en exceso $6/(\nu - 4)$ para $\nu > 4$. Para que tenga varianza unitaria se multiplica por $\sqrt{(\nu - 2)/\nu}$; con $\nu = 6$, como en el código del proyecto práctico del final (`GRADOS_LIBERTAD = 6`), la curtosis en exceso es 3.
- **Mezclas y volatilidad estocástica**: una normal cuya varianza cambia en el tiempo (por ejemplo, un GARCH con innovaciones normales, capítulo 7) produce colas gruesas en la distribución incondicional. Gran parte de las colas gruesas observadas se explica por el agrupamiento de volatilidad.
- **Saltos**: el modelo de difusión con saltos de Merton (1976) añade al movimiento browniano saltos de Poisson.
- **Distribuciones estables** (Mandelbrot, 1963; Fama, 1965): colas potenciales con $\alpha < 2$ y varianza infinita. Hoy se consideran demasiado extremas para las rentabilidades, pero fueron el primer desafío serio a la normalidad.

#### Teoría de valores extremos

Para estudiar solo la cola se usan dos resultados límite (Embrechts, Klüppelberg y Mikosch, 1997):

- **Fisher–Tippett–Gnedenko**: los máximos normalizados de muestras i.i.d., si convergen, lo hacen a una distribución generalizada de valores extremos (GEV).
- **Pickands–Balkema–de Haan**: los excesos sobre un umbral alto siguen aproximadamente una distribución generalizada de Pareto (GPD), $G_{\xi,\beta}(y) = 1 - (1 + \xi y/\beta)^{-1/\xi}$, con $\xi = 1/\alpha$.

McNeil y Frey (2000) combinan un GARCH para la volatilidad con una GPD para los residuos, un enfoque estándar para estimar VaR y ES extremos.

#### Un ejemplo histórico

El 19 de octubre de 1987 («lunes negro») el índice Dow Jones cayó un 22,6 % en una sola sesión. Con una volatilidad diaria previa del orden del 1 %, fue un movimiento de más de 20 desviaciones típicas, con una probabilidad normal de alrededor de $3 \times 10^{-89}$: un modelo que asigna esa probabilidad a un suceso observado está claramente equivocado. Desde entonces, las volatilidades implícitas de las opciones sobre índices muestran una «sonrisa» o asimetría persistente: las opciones de venta muy fuera de dinero son más caras de lo que implicaría la normal (Rubinstein, 1994).

#### Consecuencias prácticas

Con colas gruesas, los cuantiles extremos son mayores que los normales para la misma volatilidad. Una corrección sencilla es la **expansión de Cornish–Fisher** (1938) del cuantil normal $z$:

$$z_{CF} = z + \frac{(z^2 - 1)\,S}{6} + \frac{(z^3 - 3z)(K - 3)}{24} - \frac{(2z^3 - 5z)\,S^2}{36},$$

útil cuando las desviaciones de la normalidad son moderadas. En colas muy gruesas es preferible la teoría de valores extremos o la simulación con modelos de colas gruesas.

---

## Capítulo 16 · Valor en riesgo y déficit esperado

> **En este capítulo** aprenderás a calcular e interpretar el valor en riesgo y el déficit esperado de una cartera, a comprobar si un modelo de riesgo funciona y a conocer sus limitaciones.

### La idea

Un gestor de riesgos necesita resumir en una cifra cuánto puede perder una cartera en un mal periodo. El **valor en riesgo** (VaR) lo hace así: fija un horizonte (un día, diez días, un año) y un **nivel de confianza** (por ejemplo, el 99 %), y busca la pérdida que solo se supera con la probabilidad restante (el 1 %). Un VaR diario al 99 % de 50.000 € significa que, en condiciones normales del modelo, la pérdida de un día solo debería superar los 50.000 € uno de cada cien días.

Es importante entender lo que el VaR no dice. No es la pérdida máxima posible: es el umbral a partir del cual empiezan los peores casos, y no informa de cuánto se pierde cuando se cruza. Dos carteras con el mismo VaR pueden tener peores días muy distintos. El **déficit esperado** (ES, por sus siglas en inglés), también llamado VaR condicional, completa la información: es la pérdida media en los casos que superan el VaR.

### Un ejemplo resuelto

Una cartera vale 250.000 € y sus rentabilidades diarias siguen una normal de media cero y volatilidad del 1,2 %. La desviación típica de la pérdida diaria es $0{,}012 \times 250\,000 = 3\,000$ €.

| Medida | Múltiplo de la desviación típica | Importe |
|---|---|---|
| VaR al 95 % | 1,645 | 4.935 € |
| VaR al 99 % | 2,326 | 6.979 € |
| ES al 97,5 % | 2,338 | 7.013 € |
| ES al 99 % | 2,665 | 7.996 € |

Si las rentabilidades siguieran en cambio una $t$ de 4 grados de libertad con la misma volatilidad, el VaR al 99 % subiría a $2{,}65 \times 3\,000 = 7\,948$ € y el ES al 99 % a $3{,}69 \times 3\,000 = 11\,075$ €. El VaR apenas cambia; el déficit esperado, mucho. Esa es precisamente la información que el VaR oculta.

### Formalización

Sea $L$ la pérdida de la cartera en el horizonte elegido y $c$ el nivel de confianza. El VaR es la pérdida que solo se supera con probabilidad $1 - c$:

$$P\big(L > \text{VaR}_c\big) = 1 - c,$$

es decir, el cuantil $c$ de la distribución de pérdidas. El déficit esperado es la pérdida media cuando se supera el VaR, $\text{ES}_c = E\big[L \mid L \ge \text{VaR}_c\big]$. Si las rentabilidades son normales con media cero y volatilidad $\sigma$ en el horizonte elegido, y la cartera vale $V$,

$$\text{VaR}_c = z_c\,\sigma\,V, \qquad \text{ES}_c = \frac{\varphi(z_c)}{1 - c}\,\sigma\,V,$$

donde $z_c = \Phi^{-1}(c)$ es el cuantil de la normal estándar y $\varphi$ su densidad. Para pasar de un día a $h$ días se suele multiplicar por $\sqrt{h}$, con las salvedades del capítulo 4.

### Gráfico interactivo

> **Gráfico interactivo · El umbral y lo que hay detrás.** Panel superior: la distribución de pérdidas y ganancias diarias de la cartera del ejemplo, con controles para el nivel de confianza (del 90 % al 99,9 %) y para el modelo (normal o $t$ de Student con grados de libertad ajustables). Una línea vertical marca el VaR y el área de la cola queda sombreada, con una flecha en su centro de gravedad, el déficit esperado; ambos valores se muestran en euros. Panel inferior: diez años de pérdidas diarias simuladas con el modelo de colas gruesas, con la línea del VaR normal y las excepciones marcadas en rojo; un contador compara las excepciones observadas con las esperadas y aplica el contraste de Kupiec descrito en la Ampliación. Lo que el lector debe observar: con colas gruesas, el VaR normal se supera más a menudo de lo previsto, y la distancia entre VaR y déficit esperado se agranda.

### En Python

```python
from statistics import NormalDist

def var_es_normal(valor, sigma, c):
    z = NormalDist().inv_cdf(c)
    var = z * sigma * valor
    es = NormalDist().pdf(z) / (1 - c) * sigma * valor
    return var, es

for c in (0.95, 0.975, 0.99):
    var, es = var_es_normal(250_000, 0.012, c)
    print(f"{c:.1%}: VaR {var:,.0f} €   ES {es:,.0f} €")
```

### En la práctica

- La normativa bancaria internacional basó durante años el capital por riesgo de mercado en un VaR a diez días con un nivel de confianza del 99 %; el marco revisado lo sustituye por un déficit esperado al 97,5 %.
- En la Unión Europea, el régimen de Solvencia II exige a las aseguradoras un capital suficiente para cubrir las pérdidas de un año con un nivel de confianza del 99,5 %, es decir, un VaR anual al 99,5 %.
- Las entidades comparan cada día la pérdida real con el VaR del día anterior para comprobar si el modelo funciona; demasiadas excepciones obligan a revisarlo y pueden aumentar el capital exigido.

### Ejercicios

- **16.1** *(básico, cálculo)* Una cartera de 2 millones de euros tiene rentabilidades diarias normales de media cero y volatilidad del 0,8 %. Calcula su VaR a un día al 99 % y, con la regla de la raíz del tiempo, su VaR a diez días.
- **16.2** *(intermedio, cálculo)* Calcula el déficit esperado a un día al 99 % de la misma cartera.
- **16.3** *(intermedio, cálculo)* Un banco observa 7 excepciones de su VaR diario al 99 % en 250 días. ¿En qué zona del sistema de semáforos de Basilea queda? Si el modelo fuera correcto, ¿qué probabilidad habría de observar 7 o más excepciones?
- **16.4** *(avanzado, reflexión)* ¿Por qué el regulador bancario ha sustituido el VaR al 99 % por el déficit esperado al 97,5 % en el marco revisado de riesgo de mercado, si bajo normalidad ambas cifras son casi iguales?

### Ampliación · Valor en riesgo con más rigor

#### Definiciones formales

Sea $L$ la pérdida en el horizonte elegido y $\alpha \in (0,1)$ el nivel de confianza (la $c$ del capítulo).

$$\text{VaR}_\alpha(L) = \inf\{\ell \in \mathbb{R} : P(L > \ell) \le 1 - \alpha\}, \qquad \text{ES}_\alpha(L) = \frac{1}{1-\alpha}\int_\alpha^1 \text{VaR}_u(L)\,du.$$

El VaR es un cuantil de la distribución de pérdidas; el ES (también llamado CVaR o *tail VaR*) es la media de los cuantiles por encima de $\alpha$ y, para distribuciones continuas, coincide con $E[L \mid L \ge \text{VaR}_\alpha]$. Para una pérdida normal con media $\mu_L$ y desviación $\sigma_L$,

$$\text{VaR}_\alpha = \mu_L + \sigma_L\,\Phi^{-1}(\alpha), \qquad \text{ES}_\alpha = \mu_L + \sigma_L\,\frac{\varphi\big(\Phi^{-1}(\alpha)\big)}{1 - \alpha}.$$

Con $\alpha = 99\,\%$: $\Phi^{-1}(0{,}99) = 2{,}326$ y el ES vale $2{,}665\,\sigma_L$, los valores del capítulo.

Por eso es engañoso describir el VaR como «la pérdida máxima esperada»: es la pérdida *mínima* dentro del peor $1 - \alpha$ de los escenarios, y no dice nada de cuánto mayor puede llegar a ser.

#### Métodos de cálculo

1. **Paramétrico (varianza-covarianza)**, popularizado por RiskMetrics (1996): para una cartera, $\text{VaR} = z_\alpha\sqrt{\mathbf{w}^\top\Sigma\mathbf{w}}\,V$. Rápido, pero hereda la hipótesis normal.
2. **Simulación histórica**: se aplican a la cartera actual las variaciones de mercado observadas en los últimos $n$ días y se toma el cuantil empírico. No supone ninguna distribución, pero solo conoce el pasado reciente. La **simulación histórica filtrada** (Barone-Adesi, Giannopoulos y Vosper, 1999) reescala los escenarios con la volatilidad actual estimada por GARCH.
3. **Monte Carlo** (capítulo 6): se simulan los factores de riesgo con un modelo y se revalúa la cartera completa; imprescindible con opciones y otras posiciones no lineales.

**Asignación del riesgo.** Para medidas homogéneas de grado 1 como el VaR paramétrico o el ES, el teorema de Euler permite repartir el riesgo total entre posiciones: $\rho(\mathbf{w}) = \sum_i w_i\,\partial\rho/\partial w_i$. Cada término es la **contribución** de la posición $i$.

#### Medidas coherentes: por qué el ES es preferible

Artzner, Delbaen, Eber y Heath (1999) propusieron cuatro axiomas para una medida de riesgo $\rho$: monotonía, invariancia por traslación, homogeneidad positiva y **subaditividad**, $\rho(L_1 + L_2) \le \rho(L_1) + \rho(L_2)$ (diversificar no debe aumentar el riesgo). El VaR no es subaditivo en general.

*Contraejemplo.* Dos bonos independientes pierden cada uno 100 con probabilidad del 4 %. El VaR al 95 % de cada uno es 0, porque la probabilidad de pérdida (4 %) es menor que el 5 %. La cartera con los dos sufre alguna pérdida con probabilidad $1 - 0{,}96^2 = 7{,}84\,\%$, así que su VaR al 95 % es 100: $\text{VaR}(L_1 + L_2) = 100 > 0 = \text{VaR}(L_1) + \text{VaR}(L_2)$. El VaR penaliza aquí la diversificación.

El ES sí es coherente (Acerbi y Tasche, 2002) y puede optimizarse como un problema de programación lineal (Rockafellar y Uryasev, 2000). Su desventaja es estadística: no es **elicitable** por sí solo (Gneiting, 2011), lo que complica comparar previsiones, aunque sí lo es conjuntamente con el VaR (Fissler y Ziegel, 2016).

#### Contraste (*backtesting*)

Si el modelo es correcto, el número de excepciones $x$ en $T$ días sigue una binomial $\text{Bin}(T, 1 - \alpha)$. El **test de Kupiec** (1995) compara la frecuencia observada $\hat p = x/T$ con la teórica $p = 1 - \alpha$:

$$LR_{\text{POF}} = -2\ln\!\left[\frac{(1-p)^{T-x}\,p^{x}}{(1-\hat p)^{T-x}\,\hat p^{\,x}}\right] \;\sim\; \chi^2_1.$$

*Ejemplo:* si un VaR al 99 % registra 41 excepciones en 2.500 días, cuando se esperaban 25, se obtiene $LR \approx 8{,}67$, por encima del valor crítico 3,84 (nivel del 5 %): el modelo se rechaza, con un valor $p$ de 0,003. Christoffersen (1998) añadió un contraste de **independencia** de las excepciones, que no deben agruparse en el tiempo. El marco de Basilea de 1996 clasifica los modelos por las excepciones de un VaR al 99 % en 250 días: zona verde de 0 a 4, amarilla de 5 a 9 y roja con 10 o más.

#### Regulación

- **Banca**: la enmienda de Basilea de 1996 introdujo el VaR a 10 días al 99 % con un multiplicador mínimo de 3; Basilea 2.5 (2009) añadió el «VaR estresado» tras la crisis financiera; la revisión fundamental de la cartera de negociación (FRTB; BCBS, 2016 y 2019) sustituye el VaR al 99 % por el **ES al 97,5 %**, que bajo normalidad es casi igual ($2{,}338\sigma$ frente a $2{,}326\sigma$) pero sensible a la forma de la cola. En la UE, el Reglamento (UE) 2024/1623 (CRR3) incorpora el FRTB, pero su aplicación como requisito de capital se ha aplazado hasta 2027, con ajustes transitorios adoptados en 2026.
- **Seguros**: la Directiva Solvencia II (2009/138/CE, art. 101) fija el capital de solvencia obligatorio como el VaR de los fondos propios básicos a un año con un nivel de confianza del 99,5 %. La revisión de la Directiva (UE) 2025/2, aplicable desde enero de 2027, mantiene ese nivel y recalibra otros elementos, como el margen de riesgo.

#### Limitaciones

El VaR y el ES dependen del modelo, del horizonte y de los datos; ignoran el riesgo de liquidez y pueden ser procíclicos (bajos en calma, altos en crisis, cuando todos venden a la vez). Danielsson (2002) advirtió de que los modelos de riesgo calibrados en periodos tranquilos fallan precisamente cuando se necesitan. Por eso se complementan con **pruebas de resistencia** (escenarios extremos pero plausibles) y con el juicio de los gestores.

---

# Cinco temas complementarios

Los dieciséis capítulos cubren los cimientos estadísticos de la disciplina. Los cinco temas siguientes, más breves, completan el recorrido con cuestiones que aparecen en cuanto se pasa de la teoría a la aplicación: cómo evaluar una estrategia sin engañarse, cuánto cuesta operar, cómo se valora una opción, cómo se modelan relaciones de equilibrio entre precios y cómo se miden las caídas.

## Tema A · Backtesting y sobreajuste

Un **backtest** simula una estrategia con datos pasados. Es la herramienta más usada para decidir si una idea funciona, y también la más fácil de engañar. Errores clásicos:

- **Sesgo de anticipación** (*look-ahead*): usar información que no estaba disponible en la fecha de la decisión, como resultados contables publicados semanas después o el precio de cierre para operar a ese mismo cierre.
- **Sesgo de supervivencia** (capítulo 1): probar la estrategia solo con empresas que existen hoy.
- **Ignorar los costes** (tema B).
- **Sobreajuste**: probar muchas variantes y quedarse con la mejor.

El último es el más traicionero. Si se prueban $N$ estrategias sin ninguna habilidad, el ratio de Sharpe máximo observado crece aproximadamente como $\sqrt{2\ln N}$ veces su error estándar. *Ejemplo:* con 5 años de datos, el error estándar de un Sharpe anual es $\approx\sqrt{1/5} = 0{,}45$ (capítulo 8). La mejor de 100 estrategias puramente aleatorias tendrá, de media, un Sharpe de $0{,}45 \times 2{,}5 \approx 1{,}1$, un valor que parecería excelente.

Buenas prácticas:

1. Separar los datos en entrenamiento, validación y prueba, y tocar la muestra de prueba una sola vez.
2. Validar en avance (*walk-forward*): estimar con datos hasta $t$, probar en el periodo siguiente y desplazar la ventana. La validación cruzada aleatoria no sirve con series temporales; si se usa validación cruzada, debe ser con purga y embargo de las observaciones cercanas (López de Prado, 2018).
3. Registrar cuántas pruebas se han hecho y corregir por ello: ratio de Sharpe deflactado (Bailey y López de Prado, 2014), probabilidad de sobreajuste del backtest (Bailey, Borwein, López de Prado y Zhu, 2017) o el umbral $t > 3$ de Harvey, Liu y Zhu (2016).
4. Exigir una explicación económica de por qué la estrategia debería funcionar, no solo un buen resultado.

## Tema B · Costes de transacción, liquidez e impacto de mercado

Toda operación cuesta dinero: comisiones, la mitad de la **horquilla** compra-venta y el **impacto de mercado**, es decir, el movimiento adverso del precio que provoca la propia orden. El coste anual de una estrategia es aproximadamente su **rotación** (el valor negociado al año dividido por el de la cartera) por el coste de cada operación.

*Ejemplo:* una estrategia que negocia cada año diez veces el valor de su cartera, con un coste del 0,20 % por operación, pierde un 2 % anual. Si antes de costes rendía un 5 % por encima del tipo libre de riesgo con una volatilidad del 10 % (Sharpe 0,5), después de costes su Sharpe baja a 0,3.

El impacto crece con el tamaño de la orden de forma cóncava. La evidencia empírica apoya una **ley de la raíz cuadrada del impacto**:

$$\text{impacto} \approx Y\,\sigma_{\text{día}}\sqrt{\frac{Q}{V}},$$

donde $Q$ es el tamaño de la orden, $V$ el volumen diario negociado, $\sigma_{\text{día}}$ la volatilidad diaria e $Y$ una constante del orden de 1 (Almgren *et al.*, 2005; Bouchaud *et al.*, 2018). Una orden del 1 % del volumen diario en una acción con una volatilidad diaria del 2 % mueve el precio alrededor de un 0,2 %. Repartir las órdenes grandes en el tiempo reduce el impacto pero aumenta el riesgo de que el precio se mueva mientras tanto; Almgren y Chriss (2001) resolvieron este equilibrio.

La **liquidez** también es un riesgo: en una crisis, la horquilla se ensancha y el impacto aumenta justo cuando todos quieren vender. El VaR clásico lo ignora (capítulo 16), y por eso el FRTB asigna horizontes de liquidez más largos a los factores menos líquidos.

## Tema C · Del valor esperado a las opciones: el árbol binomial

El árbol binomial (Cox, Ross y Rubinstein, 1979) es el puente más sencillo entre el valor esperado (capítulo 3) y la valoración de opciones. En un periodo, una acción que vale $S_0$ pasa a valer $uS_0$ o $dS_0$, con $d < 1 + r < u$ para que no haya arbitraje. Una opción que paga $V_u$ o $V_d$ se puede **replicar** comprando $\Delta$ acciones y pidiendo prestado el resto:

$$\Delta = \frac{V_u - V_d}{(u - d)\,S_0}, \qquad q = \frac{1 + r - d}{u - d}, \qquad V_0 = \frac{q\,V_u + (1 - q)\,V_d}{1 + r}.$$

| Símbolo | Significado |
|---|---|
| $\Delta$ | el número de acciones de la cartera que replica la opción |
| $q$ | la probabilidad neutral al riesgo de subida |
| $r$ | el tipo libre de riesgo del periodo |
| $V_0$ | el precio de la opción hoy |

*Ejemplo:* $S_0 = 100$ €, $u = 1{,}2$, $d = 0{,}8$, $r = 5\,\%$ y una opción de compra con precio de ejercicio 100 €, que paga $V_u = 20$ € o $V_d = 0$. Entonces $q = 0{,}25/0{,}4 = 0{,}625$ y $V_0 = 0{,}625 \times 20/1{,}05 = 11{,}90$ €. Comprobación: comprar $\Delta = 0{,}5$ acciones cuesta 50 € y se financian pidiendo prestados $0{,}5 \times 80/1{,}05 = 38{,}10$ €; el coste neto, 11,90 €, es el precio de la opción.

Lo sorprendente es que la probabilidad real de subida no aparece: el precio sale de la réplica, no de las preferencias. $q$ es la medida neutral al riesgo $Q$ del capítulo 3. Encadenando muchos periodos con $u = e^{\sigma\sqrt{\Delta t}}$ y $d = 1/u$, el árbol converge a la fórmula de Black y Scholes (capítulo 6). Una relación útil que no depende de ningún modelo es la **paridad put-call**: $C - P = S_0 - K e^{-rT}$.

**La fórmula de Black y Scholes.** Si el precio de la acción sigue el movimiento browniano geométrico del capítulo 4, con volatilidad constante $\sigma$, y se puede negociar sin costes y pedir prestado al tipo $r$, el límite del árbol da el precio de una opción europea de compra (Black y Scholes, 1973):

$$C = S_0\,N(d_1) - K e^{-rT}\,N(d_2), \qquad d_1 = \frac{\ln(S_0/K) + \left(r + \tfrac12\sigma^2\right)T}{\sigma\sqrt{T}}, \qquad d_2 = d_1 - \sigma\sqrt{T}.$$

| Símbolo | Significado |
|---|---|
| $C$ | el precio de la opción de compra hoy |
| $S_0$ | el precio de la acción hoy |
| $K$ | el precio de ejercicio |
| $T$ | el plazo hasta el vencimiento, en años |
| $r$ | el tipo libre de riesgo, en capitalización continua |
| $\sigma$ | la volatilidad anual de la acción |
| $N(\cdot)$ | la función de distribución de la normal estándar (capítulo 5) |

El precio de la opción de venta sale de la paridad put-call: $P = K e^{-rT}\,N(-d_2) - S_0\,N(-d_1)$.

*Ejemplo:* con $S_0 = K = 100$ €, $r = 3\,\%$, $\sigma = 20\,\%$ y $T = 1$ año, $d_1 = (0 + 0{,}05)/0{,}2 = 0{,}25$ y $d_2 = 0{,}05$. Entonces $N(d_1) = 0{,}5987$, $N(d_2) = 0{,}5199$ y $C = 100 \times 0{,}5987 - 97{,}04 \times 0{,}5199 = 59{,}87 - 50{,}46 = 9{,}41$ €, el mismo valor que aproximaba la simulación del capítulo 6. La venta vale $P = 9{,}413 - 100 + 97{,}045 = 6{,}46$ €.

La fórmula se lee como la réplica del árbol: $N(d_1)$ es la **delta**, el número de acciones de la cartera que replica la opción (0,60 en el ejemplo), y $K e^{-rT} N(d_2)$ es lo que se pide prestado. $N(d_2)$ es la probabilidad, bajo la medida neutral al riesgo, de que la opción acabe dentro del dinero. Como en el árbol, la rentabilidad esperada de la acción no aparece: solo importa la volatilidad.

Las hipótesis son fuertes. La volatilidad no es constante (capítulo 7) y los rendimientos tienen colas gruesas y saltos (capítulo 15), así que el mercado usa la fórmula al revés: cotiza cada opción por la volatilidad que reproduce su precio, la volatilidad implícita, y la «sonrisa» de esas volatilidades resume en qué se equivoca el modelo.

## Tema D · Estacionariedad y cointegración

Una serie es **estacionaria** si su distribución no cambia con el tiempo. Los precios no lo son (su varianza crece con el tiempo, capítulo 4), pero las rentabilidades lo son aproximadamente; por eso la estadística se hace con rentabilidades (capítulo 10). El contraste de Dickey y Fuller (1979) comprueba si una serie tiene una **raíz unitaria**, es decir, si se comporta como un paseo aleatorio.

Dos precios no estacionarios están **cointegrados** si alguna combinación lineal de ellos, $s_t = P^A_t - \beta P^B_t$, sí es estacionaria (Engle y Granger, 1987): pueden alejarse, pero tienden a volver a su relación. Es la base de la **negociación por pares** (*pairs trading*). Cointegración y correlación son cosas distintas: dos activos pueden tener rentabilidades muy correlacionadas y precios que se separan sin límite, o al revés.

Si el diferencial sigue un proceso autorregresivo $s_t = \phi\,s_{t-1} + \varepsilon_t$ con $0 < \phi < 1$, su **semivida** de reversión es $\ln 2/(-\ln\phi)$. *Ejemplo:* con $\phi = 0{,}95$ diario, la semivida es de unos 13,5 días. Las relaciones de cointegración se rompen a menudo (fusiones, cambios de negocio), así que hay que reestimarlas y limitar las pérdidas.

## Tema E · Caídas máximas (*drawdown*)

La **caída** en $t$ mide cuánto ha perdido la cartera desde su máximo anterior, y la **caída máxima** es la peor de todo el periodo:

$$DD_t = 1 - \frac{W_t}{\max_{s \le t} W_s}, \qquad MDD = \max_t DD_t.$$

En Python:

```python
import numpy as np

W = np.array([100, 108, 103, 115, 92, 97, 121])    # valor de la cartera
dd = 1 - W / np.maximum.accumulate(W)               # caída en cada fecha
print(dd.max())                                     # caída máxima: 0.20 (de 115 a 92)
```

Recuperar una caída $D$ exige una subida de $D/(1 - D)$: un 25 % tras perder un 20 %, y un 100 % tras perder un 50 % (capítulo 1). Muchos inversores juzgan una estrategia por su caída máxima más que por su volatilidad, y el **ratio de Calmar** divide la tasa de crecimiento anual compuesta por la caída máxima. Hay que compararlas con cuidado: la caída máxima esperada crece con la duración de la muestra (Magdon-Ismail *et al.*, 2004), así que una serie más larga tendrá, casi siempre, una caída máxima peor. El capítulo 14 da un resultado relacionado: con Kelly completo, la probabilidad de caer alguna vez a la mitad es del 50 %.

---

# Proyecto práctico · Laboratorio de carteras

El mejor modo de consolidar lo aprendido es construir una herramienta completa. Este proyecto propone programar, por fases, un pequeño laboratorio de carteras: generar una historia de rentabilidades a partir de unos supuestos conocidos, estimar con ella los datos de entrada, construir varias carteras, proyectar su futuro por simulación y medir sus riesgos extremos. Como los datos se simulan a partir de una «verdad» conocida, en cada fase se puede comparar lo estimado con lo real, algo imposible con datos de mercado.

### Fase 1 · Historia simulada y primeras estimaciones

El programa siguiente implementa la primera fase. Genera una historia de quince años de datos mensuales para cinco activos, con medias, volatilidades y correlaciones fijadas de antemano y con colas más gruesas que la normal (capítulos 10 y 15), estima la media anual de cada activo con su error estándar (capítulos 6 y 7) y mide una cartera de pesos iguales (capítulos 8, 11, 13 y tema E).

```python
"""Laboratorio de carteras · fase 1: historia simulada y primeras estimaciones."""
import numpy as np

# --- Supuestos del mundo simulado (la «verdad» que luego intentaremos estimar) ---
ACTIVOS = ["Acciones Europa", "Acciones mundo", "Deuda pública", "Deuda corporativa", "Oro"]
MEDIA = np.array([0.065, 0.075, 0.020, 0.030, 0.035])   # rentabilidad media anual
VOL = np.array([0.18, 0.16, 0.06, 0.08, 0.15])          # volatilidad anual
CORR = np.array([
    [1.00, 0.85, -0.05, 0.40, 0.05],
    [0.85, 1.00, -0.10, 0.35, 0.10],
    [-0.05, -0.10, 1.00, 0.55, 0.25],
    [0.40, 0.35, 0.55, 1.00, 0.15],
    [0.05, 0.10, 0.25, 0.15, 1.00],
])
GRADOS_LIBERTAD = 6   # t de Student: colas más gruesas que la normal
MESES = 180           # quince años de datos mensuales
TIPO_SIN_RIESGO = 0.02
SEMILLA = 23


def simular_historia(rng):
    """Rentabilidades mensuales con medias, volatilidades y correlaciones dadas y colas gruesas."""
    cov_mensual = CORR * np.outer(VOL, VOL) / 12
    chol = np.linalg.cholesky(cov_mensual)
    normales = rng.standard_normal((MESES, len(ACTIVOS))) @ chol.T
    # Mezcla normal/chi-cuadrado: t multivariante reescalada a varianza unitaria
    nu = GRADOS_LIBERTAD
    escala = np.sqrt((nu - 2) / rng.chisquare(nu, size=(MESES, 1)))
    return MEDIA / 12 + normales * escala


def estimar(r):
    """Media y volatilidad anuales de cada activo, con el error estándar de la media."""
    t = r.shape[0]
    media = 12 * r.mean(axis=0)
    vol = np.sqrt(12) * r.std(axis=0, ddof=1)
    error_media = 12 * r.std(axis=0, ddof=1) / np.sqrt(t)
    return media, vol, error_media, np.corrcoef(r, rowvar=False)


def medir_cartera(r, pesos, referencia):
    """Rentabilidad, volatilidad, Sharpe, beta y caída máxima de una cartera reequilibrada cada mes."""
    rc = r @ pesos
    media, vol = 12 * rc.mean(), np.sqrt(12) * rc.std(ddof=1)
    beta = np.cov(rc, r[:, referencia], ddof=1)[0, 1] / r[:, referencia].var(ddof=1)
    riqueza = np.cumprod(1 + rc)
    caida_max = np.max(1 - riqueza / np.maximum.accumulate(riqueza))
    return media, vol, (media - TIPO_SIN_RIESGO) / vol, beta, caida_max


def main():
    rng = np.random.default_rng(SEMILLA)
    r = simular_historia(rng)
    media, vol, error, corr = estimar(r)

    print("ESTIMACIONES ANUALES (15 años de datos mensuales)")
    print(f"{'activo':<18}{'media':>8}{'± error':>9}{'volat.':>8}{'(real)':>8}")
    for i, nombre in enumerate(ACTIVOS):
        print(f"{nombre:<18}{media[i]:8.2%}{error[i]:9.2%}{vol[i]:8.2%}{MEDIA[i]:8.2%}")
    print(f"correlación estimada Europa-mundo: {corr[0, 1]:.2f} (real {CORR[0, 1]:.2f})")

    pesos = np.full(len(ACTIVOS), 1 / len(ACTIVOS))
    m, v, sr, beta, dd = medir_cartera(r, pesos, referencia=1)
    print("\nCARTERA DE PESOS IGUALES (20 % en cada activo)")
    print(f"rentabilidad media   {m:7.2%}")
    print(f"volatilidad          {v:7.2%}")
    print(f"ratio de Sharpe      {sr:7.3f}")
    print(f"beta (acc. mundo)    {beta:7.3f}")
    print(f"caída máxima         {dd:7.2%}")


if __name__ == "__main__":
    main()
```

Con la semilla 23, la salida es:

```text
ESTIMACIONES ANUALES (15 años de datos mensuales)
activo               media  ± error  volat.  (real)
Acciones Europa      9.64%    4.23%  16.38%   6.50%
Acciones mundo       7.38%    4.40%  17.03%   7.50%
Deuda pública        0.78%    1.33%   5.16%   2.00%
Deuda corporativa    3.11%    1.97%   7.64%   3.00%
Oro                 -1.79%    4.53%  17.54%   3.50%
correlación estimada Europa-mundo: 0.83 (real 0.85)

CARTERA DE PESOS IGUALES (20 % en cada activo)
rentabilidad media     3.82%
volatilidad            8.73%
ratio de Sharpe        0.209
beta (acc. mundo)      0.436
caída máxima          14.12%
```

La tabla ya contiene la lección más importante del proyecto. Las volatilidades y la correlación se estiman con bastante precisión, pero las medias no: la de las acciones europeas sale un 9,6 % cuando la verdadera es un 6,5 %, y la del oro, negativa cuando la verdadera es positiva. Los errores estándar, de entre 1,3 y 4,5 puntos, avisan de que quince años de datos no bastan para distinguir con seguridad una rentabilidad media del 3 % de una del 7 %. Un optimizador alimentado con estas medias concentraría el dinero en las acciones europeas por un motivo puramente estadístico (capítulo 12).

### Fases siguientes

Cada fase reutiliza las funciones de las anteriores. Para cada una se indican los capítulos en los que se apoya.

1. **Incertidumbre de las estimaciones** (capítulos 6, 7 y 10). Remuestrea con reemplazo los meses de la historia (*bootstrap*) mil veces y obtén la distribución de las medias, las volatilidades y la correlación estimadas. Compara la anchura de esas distribuciones con los errores estándar teóricos.
2. **Carteras optimizadas** (capítulos 11 y 12). Calcula la cartera de mínima varianza y la de máximo ratio de Sharpe, totalmente invertidas, sin ventas en corto y con un máximo del 35 % por activo. Después, simula una segunda historia independiente con la misma semilla base más uno y comprueba cómo se comportan fuera de muestra frente a la cartera de pesos iguales.
3. **Proyección a diez años** (capítulos 4, 6 y 9). Para cada cartera, simula 10.000 trayectorias de diez años con colas gruesas y obtén la mediana, los percentiles 5 y 95 de la riqueza final, la tasa de crecimiento compuesto mediana y la distribución de la caída máxima.
4. **Riesgo extremo** (capítulos 15 y 16). Calcula el VaR y el déficit esperado mensuales al 97,5 % y al 99 % de cada cartera de tres formas: con la fórmula normal, con la historia simulada y con las trayectorias de la fase anterior. Aplica el contraste de Kupiec al VaR normal sobre la historia.
5. **Informe** (capítulos 8, 13 y 16). Resume en una tabla, para cada cartera, la rentabilidad media, la volatilidad, el ratio de Sharpe con su error estándar, la beta respecto a las acciones mundiales, la caída máxima, el VaR y el déficit esperado. Añade un párrafo que interprete los resultados y señale qué cifras son fiables y cuáles no.

---

# Soluciones de los ejercicios

Cada solución empieza con el resultado y explica después el razonamiento. Conviene intentar cada ejercicio antes de leerla.

## Parte I

**1.1 −12 % de rentabilidad simple y −12,78 % logarítmica; para recuperarse hace falta un +13,64 %.**
$R = 110/125 - 1 = -0{,}12$ y $r = \ln 0{,}88 = -0{,}1278$. Para volver a 125 € desde 110 € se necesita $125/110 - 1 = 0{,}1364$. Como siempre, la subida necesaria es mayor que la caída sufrida.

**1.2 Acumulada +14,91 %; anual constante equivalente 4,74 %; media aritmética 5,00 %.**
$1{,}08 \times 0{,}95 \times 1{,}12 = 1{,}14912$. La tasa constante equivalente es la media geométrica, $1{,}14912^{1/3} - 1 = 0{,}0474$. La media aritmética, $(8 - 5 + 12)/3 = 5\,\%$, es mayor, como ocurre siempre que las rentabilidades no son todas iguales (capítulo 9).

**1.3 Porque el valor de la cartera es la suma de los valores de sus partes, y eso se traduce en una media ponderada de rentabilidades simples.**
Con 100 € repartidos al 50 %, al final se tienen $50 \times 1{,}3 + 50 \times 0{,}9 = 110$ €: un 10 %, que es $0{,}5 \times 30\,\% + 0{,}5 \times (-10\,\%)$. Si se promediaran las rentabilidades logarítmicas, $0{,}5\ln 1{,}3 + 0{,}5\ln 0{,}9 = 0{,}0785$, se obtendría un 8,17 % al deshacer el logaritmo, que no es lo que ha ganado la cartera. La rentabilidad logarítmica correcta de la cartera es $\ln 1{,}10 = 0{,}0953$.

**2.1 2.898,19 €, de los que 23,19 € proceden del interés compuesto.**
$2\,500 \times 1{,}03^5 = 2\,898{,}19$. Los intereses totales son 398,19 €; con interés simple serían $5 \times 75 = 375$ €.

**2.2 15.841,87 € al 6 % y 18.476,91 € al 2 %.**
$20\,000/1{,}06^4 = 15\,841{,}87$ y $20\,000/1{,}02^4 = 18\,476{,}91$. Cuanto más bajo es el tipo, más vale hoy el mismo pago futuro.

**2.3 La cuota anual es de 3.464,62 €.**
Las cinco cuotas forman una renta constante cuyo valor presente debe ser 15.000 €: $C\,[1 - 1{,}05^{-5}]/0{,}05 = 15\,000$, de donde $C = 15\,000 \times 0{,}05/(1 - 1{,}05^{-5}) = 3\,464{,}62$ €. En total se pagan 17.323,11 €, de los que 2.323,11 € son intereses.

## Parte II

**3.1 El premio esperado de una papeleta es 1,25 €; la ganancia neta esperada, −1,75 €. El organizador ingresa 3.500 €.**
Los premios suman $1\,500 + 10 \times 100 = 2\,500$ € repartidos entre 2.000 papeletas: 1,25 € por papeleta. Restando el precio, $1{,}25 - 3 = -1{,}75$ €. El organizador recauda 6.000 € y reparte 2.500 €.

**3.2 La pérdida esperada es de 36 €, y el seguro aplica un recargo del 25 %.**
$0{,}04 \times 900 = 36$ €, y $45/36 - 1 = 0{,}25$. Contratarlo puede ser razonable porque una pérdida de 900 € de golpe puede ser mucho más dolorosa que pagar 45 € seguros: con una utilidad cóncava (Ampliación del capítulo 3), el asegurado prefiere un coste cierto algo mayor que la pérdida esperada.

**3.3 Una vez, quizá; diez veces seguidas apostándolo todo, casi seguro que no.**
El valor esperado de la riqueza tras una jugada es $0{,}5 \times 2{,}2 = 1{,}1$ veces la inicial, un +10 %. Pero con un 50 % de probabilidad se pierde todo. Tras diez jugadas apostándolo todo, la riqueza esperada es $1{,}1^{10} = 2{,}59$ veces la inicial, y sin embargo solo se conserva algo con probabilidad $0{,}5^{10} \approx 0{,}1\,\%$: el valor esperado lo sostiene un único escenario entre mil. El valor esperado ignora la ruina y la aversión al riesgo; el criterio de Kelly (capítulo 14) recomendaría arriesgar solo un $0{,}5 - 0{,}5/1{,}2 = 8{,}3\,\%$ del patrimonio en cada jugada.

**4.1 El precio esperado es 21 €, y la probabilidad de acabar por encima de 20 € es del 68,3 %.**
Cada paso tiene media $0{,}6 - 0{,}4 = 0{,}2$ €, así que $E[S_5] = 20 + 5 \times 0{,}2 = 21$. Con $k$ subidas el precio es $15 + 2k$, que supera 20 si $k \ge 3$: $P = \binom53 0{,}6^3 0{,}4^2 + \binom54 0{,}6^4 0{,}4 + 0{,}6^5 = 0{,}3456 + 0{,}2592 + 0{,}0778 = 0{,}6826$.

**4.2 Un 7,22 % mensual y un 1,57 % diario.**
$25\,\% \times \sqrt{21/252} = 25\,\%/\sqrt{12} = 7{,}22\,\%$ y $25\,\%/\sqrt{252} = 1{,}57\,\%$.

**4.3 Hacen falta 400 sesiones; la probabilidad de un resultado negativo es entonces del 15,9 %.**
La ganancia esperada acumulada es $0{,}05\,\% \times n$ y la desviación típica $1\,\% \times \sqrt{n}$. Igualándolas, $\sqrt{n} = 20$ y $n = 400$. En ese momento el resultado acumulado está una desviación típica por encima de cero, y $P(Z < -1) = 15{,}9\,\%$. Incluso con una ventaja real, casi un año y medio de sesiones deja una probabilidad apreciable de ir perdiendo.

**4.4 No es raro: en un paseo equilibrado largo, ocurre aproximadamente una de cada siete veces.**
Por la ley del arcoseno, la probabilidad de que un paseo simétrico pase más del 95 % del tiempo por encima de su origen es aproximadamente $1 - \frac{2}{\pi}\arcsin\sqrt{0{,}95} \approx 14\,\%$, y la de que pase más del 95 % del tiempo de un mismo lado, el doble, alrededor del 29 %. Una racha larga a un lado del punto de partida es lo típico en un paseo aleatorio, no la excepción; no prueba ninguna tendencia.

**5.1 Alrededor del 34,5 % de los años.**
$P(R < 0) = \Phi\big((0 - 6)/15\big) = \Phi(-0{,}4) = 0{,}345$: aproximadamente uno de cada tres años, a pesar de una media claramente positiva.

**5.2 Un 8,1 % de los años por debajo de −15 %; el 95 % de los años entre −23,4 % y +35,4 %.**
$\Phi\big((-15 - 6)/15\big) = \Phi(-1{,}4) = 0{,}081$. El intervalo es $6 \pm 1{,}96 \times 15$.

**5.3 Alrededor del 10 %.**
La suma de 12 dados tiene media $12 \times 3{,}5 = 42$ y varianza $12 \times 35/12 = 35$, con desviación típica 5,92. Con la corrección por continuidad, $P(S \ge 50) \approx P\big(Z > (49{,}5 - 42)/5{,}92\big) = P(Z > 1{,}27) = 10{,}2\,\%$. El valor exacto, contando combinaciones, es 10,4 %.

**5.4 Hay al menos tres objeciones.**
Primera: el teorema habla de sumas de muchos términos independientes, y la rentabilidad de un solo día no está formada por muchos efectos pequeños e independientes; a menudo la domina una única noticia. Segunda: aunque una suma se aproxime a la normal en el centro, la aproximación es mucho peor en las colas, que son justamente lo que interesa al medir pérdidas extremas (la Ampliación del capítulo 5 cuantifica la velocidad de convergencia). Tercera: las rentabilidades diarias no son independientes, porque su volatilidad se agrupa en el tiempo, y presentan colas gruesas (capítulo 15).

**6.1 Hacen falta 40.000 escenarios.**
Para dividir el error entre 4 hay que multiplicar $\sqrt{M}$ por 4, es decir, $M$ por 16: $16 \times 2\,500 = 40\,000$.

**6.2 Un error estándar de 0,016 con 10.000 puntos; para 0,001 harían falta unos 2,7 millones de puntos.**
La estimación es $4\hat p$, con error estándar $4\sqrt{p(1-p)/M}$. Con $p = 0{,}7854$, $p(1-p) = 0{,}1686$ y $4\sqrt{0{,}1686/10\,000} = 0{,}0164$. Para un error de 0,001, $M = 16 \times 0{,}1686/0{,}001^2 \approx 2{,}7$ millones.

**6.3 Para poder reproducir y verificar los resultados; y repetir con otras semillas para medir cuánto dependen del azar.**
Fijada la semilla, el generador produce siempre la misma serie de números y cualquier persona que ejecute el código obtiene idénticas cifras, lo que permite depurar errores y comparar versiones del código. Pero una sola semilla es un solo experimento: repetirlo con varias muestra la variabilidad de las estimaciones y evita presentar como definitivo un resultado afortunado.

**6.4 El intervalo va del 6,51 % al 7,51 % y contiene el 6,80 % teórico.**
$\text{EE} = \sqrt{0{,}0701 \times 0{,}9299/10\,000} = 0{,}0026$, y $7{,}01\,\% \pm 1{,}96 \times 0{,}26\,\%$ da $[6{,}51\,\%;\ 7{,}51\,\%]$.

## Parte III

**7.1 Media 0 %, volatilidad diaria 1,26 % y anual 20,1 %.**
Las cinco rentabilidades suman 0. Las desviaciones al cuadrado son 1,44; 0,16; 0,64; 4,00 y 0,16, que suman 6,4. Dividiendo por $N - 1 = 4$ se obtiene 1,6, cuya raíz es 1,26 %. Anualizada: $1{,}26\,\% \times \sqrt{252} = 20{,}1\,\%$.

**7.2 Un 10,4 % anual, que corresponde a la clase 3 de riesgo de mercado.**
$3\,\% \times \sqrt{12} = 10{,}39\,\%$, que cae en el tramo del 5 % al 12 %, la tercera de las siete clases.

**7.3 Porque la volatilidad cambia con el tiempo y tiende a agruparse.**
A los periodos tranquilos les siguen a menudo periodos agitados, y viceversa (Ampliación del capítulo 7). Una volatilidad estimada en calma puede quedarse muy corta si llega una crisis. Por eso se usan estimaciones que dan más peso a los datos recientes, se vigilan medidas implícitas en los precios de las opciones y se complementan los modelos con escenarios de tensión.

**8.1 F2, con un ratio de 0,50 frente a 0,39.**
$(8 - 2{,}5)/14 = 0{,}39$ y $(5 - 2{,}5)/5 = 0{,}50$.

**8.2 Hay que invertir el 280 % del capital en F2, y se obtiene un 9,5 % frente al 8 % de F1.**
Para igualar la volatilidad del 14 % con un fondo del 5 % hace falta una fracción $w = 14/5 = 2{,}8$: por cada euro propio se invierten 2,80 € en F2, pidiendo prestados 1,80 € al 2,5 %. La rentabilidad esperada es $2{,}5 + 2{,}8 \times (5 - 2{,}5) = 9{,}5\,\%$, un punto y medio más que F1 con el mismo riesgo, y el ratio de Sharpe sigue siendo 0,50. Es la ventaja de elegir el ratio más alto, siempre que endeudarse al tipo libre de riesgo sea realista.

**8.3 Alrededor de 0,87.**
$0{,}25 \times \sqrt{12} = 0{,}87$: la rentabilidad en exceso se multiplica por 12 y la volatilidad por $\sqrt{12}$.

**8.4 No: el estadístico $t$ es 1,56, por debajo de 1,96.**
$\text{EE} \approx \sqrt{(1 + 0{,}5 \times 0{,}6^2)/8} = \sqrt{0{,}1475} = 0{,}384$, y $0{,}6/0{,}384 = 1{,}56$. Con ocho datos anuales no se puede descartar que el ratio verdadero sea cero.

**9.1 Media aritmética +10 %; rentabilidad acumulada −4 %.**
$(60 - 40)/2 = 10\,\%$, pero $1{,}6 \times 0{,}6 = 0{,}96$.

**9.2 Alrededor del 5,9 % con volatilidad del 15 % y del 2,5 % con volatilidad del 30 %.**
$7 - \tfrac12 \times 15^2/100 = 7 - 1{,}125 = 5{,}875\,\%$ y $7 - \tfrac12 \times 30^2/100 = 7 - 4{,}5 = 2{,}5\,\%$. Al duplicar la volatilidad, el lastre se cuadruplica.

**9.3 El índice crece en torno al 4,4 % anual y el producto triplicado, solo un 3,4 %.**
Índice: $6 - \tfrac12 \times 0{,}18^2 \times 100 = 4{,}38\,\%$. Producto: $3 \times 6 - \tfrac12 \times 9 \times 0{,}18^2 \times 100 = 18 - 14{,}58 = 3{,}42\,\%$. A pesar de triplicar la rentabilidad media, crece menos que el índice, porque el lastre se multiplica por nueve.

## Parte IV

**10.1 La correlación es 0,24.**
$0{,}009/(0{,}15 \times 0{,}25) = 0{,}009/0{,}0375 = 0{,}24$.

**10.2 La correlación es exactamente −1.**
Los datos cumplen $Y = 3\,\% - X$ en todos los meses, así que se mueven en perfecta oposición. Comprobación: las medias son 1 % y 2 %; las desviaciones de X son 0, 2, −2 y 0, y las de Y, 0, −2, 2 y 0. La covarianza es $(0 - 4 - 4 + 0)/3 = -8/3$ y las dos varianzas valen $8/3$, de modo que $\rho = (-8/3)/(8/3) = -1$.

**10.3 No necesariamente: la correlación entre precios que crecen con el tiempo puede ser alta sin significado.**
Dos series con tendencia tienen niveles muy correlacionados aunque sus movimientos mensuales sean independientes; es el problema de las correlaciones espurias (Ampliación del capítulo 10). Para medir el beneficio de combinarlas hay que correlacionar sus rentabilidades, no sus precios.

**11.1 La cartera tiene una volatilidad del 10 %.**
Con activos independientes solo queda la parte específica: $\sigma_p^2 = 0{,}30^2/9 = 0{,}01$, y $\sigma_p = 10\,\%$.

**11.2 Un 13,6 % con diez activos; el mínimo alcanzable es del 12,6 %.**
$\sigma_p^2 = 0{,}04 \times (0{,}1 + 0{,}9 \times 0{,}4) = 0{,}0184$, y $\sigma_p = 13{,}6\,\%$. El suelo es $0{,}20 \times \sqrt{0{,}4} = 12{,}6\,\%$. Con correlación 0,4, los diez primeros activos ya han eliminado casi todo el riesgo diversificable.

**11.3 Unos 3,1 activos efectivos, frente a 5 con pesos iguales.**
$\sum w_i^2 = 0{,}25 + 0{,}04 + 3 \times 0{,}01 = 0{,}32$, y $1/0{,}32 = 3{,}125$. La concentración en el primer activo hace que la cartera se comporte como si tuviera poco más de tres activos de igual peso.

**12.1 Un 60 % en el primer activo y un 40 % en el segundo.**
Con $\rho = -1$, la fórmula da $w^* = (0{,}0324 + 0{,}0216)/(0{,}0144 + 0{,}0324 + 0{,}0432) = 0{,}054/0{,}09 = 0{,}6$, es decir, $\sigma_2/(\sigma_1 + \sigma_2) = 18/30$. Comprobación: $0{,}6 \times 12\,\% - 0{,}4 \times 18\,\% = 0$.

**12.2 Rentabilidad del 6,5 %, volatilidad del 11 % y ratio de Sharpe de 0,41, mayor que el de A (0,33) y el de B (0,35).**
$\mu_p = 0{,}5 \times 4 + 0{,}5 \times 9 = 6{,}5\,\%$. $\sigma_p^2 = 0{,}25 \times 0{,}0036 + 0{,}25 \times 0{,}04 + 2 \times 0{,}25 \times 0{,}2 \times 0{,}06 \times 0{,}20 = 0{,}0121$, y $\sigma_p = 11\,\%$. Ratios: $(6{,}5 - 2)/11 = 0{,}41$, $(4 - 2)/6 = 0{,}33$ y $(9 - 2)/20 = 0{,}35$. La combinación remunera mejor el riesgo que cualquiera de sus componentes.

**12.3 Porque el optimizador amplifica los errores de las medias estimadas.**
Con cinco años de datos, el error estándar de una rentabilidad media anual ronda la volatilidad dividida por $\sqrt5$: varios puntos porcentuales (Ampliación del capítulo 7). El optimizador interpreta como oportunidad cualquier media sobrestimada y concentra el dinero en ella; por eso se ha descrito como un «maximizador de errores». Una cartera tan concentrada probablemente refleja ruido estadístico, no una ventaja real; conviene contraer las medias, imponer límites o usar carteras que no dependan de ellas (Ampliación del capítulo 12 y proyecto práctico).

**13.1 Beta 1,05; cabe esperar una caída del 3,15 %.**
$\beta = 0{,}7 \times 24/16 = 1{,}05$ y $1{,}05 \times (-3\,\%) = -3{,}15\,\%$, en promedio; el día concreto puede desviarse por el riesgo específico.

**13.2 Un 6 % anual.**
$2 + 0{,}8 \times (7 - 2) = 6\,\%$.

**13.3 Un alfa de −0,2 puntos.**
La rentabilidad exigida por el CAPM era $2 + 1{,}2 \times (8 - 2) = 9{,}2\,\%$. El fondo obtuvo un 9 %, así que $\alpha = 9 - 9{,}2 = -0{,}2\,\%$: ganó más que el mercado, pero menos de lo que justificaba su riesgo de mercado.

**13.4 Porque su riesgo desaparece casi por completo dentro de una cartera diversificada.**
Un inversor que tiene la cartera de mercado no nota apenas la volatilidad propia de esa acción: se compensa con la de muchas otras. Lo que la acción añade al riesgo de su cartera depende de su covarianza con el mercado, que es casi nula. Si la acción ofreciera una prima, todos querrían comprarla, su precio subiría y su rentabilidad esperada bajaría hasta eliminar la prima.

## Parte V

**14.1 El 16 % del capital.**
$f^* = 2 \times 0{,}58 - 1 = 0{,}16$.

**14.2 Kelly recomienda un 6,67 %; medio Kelly conserva alrededor del 76 % del crecimiento.**
$f^* = 0{,}3 - 0{,}7/3 = 0{,}0667$. Con Kelly completo, $g = 0{,}3\ln(1 + 3 \times 0{,}0667) + 0{,}7\ln(1 - 0{,}0667) = 0{,}00640$ por apuesta; con medio Kelly ($f = 0{,}0333$), $g = 0{,}00486$. El cociente es 0,76.

**14.3 Un 125 % del capital, es decir, con apalancamiento; el crecimiento en exceso es del 3,1 % con Kelly completo y del 2,3 % con medio Kelly.**
$f^* = 0{,}05/0{,}20^2 = 1{,}25$. El crecimiento en exceso óptimo es $\tfrac12\,\text{SR}^2 = \tfrac12 \times 0{,}25^2 = 3{,}125\,\%$; con medio Kelly ($f = 62{,}5\,\%$) se conserva el 75 %: 2,34 %.

**15.1 Una vez cada 125 años, aproximadamente.**
$\Phi(-4) = 3{,}17 \times 10^{-5}$ por sesión; por año, $252 \times 3{,}17 \times 10^{-5} = 0{,}008$, es decir, una vez cada unos 125 años.

**15.2 Media 0, varianza 2,5 (%²) y curtosis 4,24: sí, colas más gruesas que la normal.**
Por simetría la media es 0. $E[X^2] = 0{,}9 \times 1 + 0{,}1 \times 16 = 2{,}5$ y $E[X^4] = 0{,}9 \times 1 + 0{,}1 \times 256 = 26{,}5$. La curtosis es $26{,}5/2{,}5^2 = 4{,}24 > 3$. Los movimientos de ±4 %, aunque solo ocurren el 10 % de las veces, dominan el cuarto momento.

**15.3 Unas 1,2 sesiones al año, unas 76 veces más que con la normal.**
$252 \times 0{,}0048 = 1{,}21$. Con la normal, la probabilidad de superar cuatro desviaciones típicas en cualquier sentido es $2 \times 3{,}17 \times 10^{-5} = 6{,}3 \times 10^{-5}$, es decir, 0,016 sesiones al año (una cada 63 años). El cociente es $1{,}21/0{,}016 \approx 76$.

**15.4 Que el modelo está mal especificado.**
Una caída de siete desviaciones típicas tiene, bajo la normal, una probabilidad de $\Phi(-7) \approx 1{,}3 \times 10^{-12}$: una vez cada unos 3.000 millones de años. Es mucho más razonable concluir que la normal no describe las colas, que la volatilidad del 1 % estaba subestimada o había cambiado, o ambas cosas, que creer que se ha presenciado un suceso de esa rareza.

**16.1 Un VaR a un día de unos 37.222 € y a diez días de unos 117.705 €.**
$2{,}3263 \times 0{,}008 \times 2\,000\,000 = 37\,222$ €. A diez días, $37\,222 \times \sqrt{10} = 117\,705$ €, suponiendo rentabilidades diarias independientes y normales.

**16.2 Un déficit esperado de unos 42.643 €.**
$\varphi(2{,}3263)/0{,}01 = 2{,}6652$, y $2{,}6652 \times 16\,000 = 42\,643$ €.

**16.3 Zona amarilla; la probabilidad de 7 o más excepciones con un modelo correcto es del 1,4 %.**
La zona amarilla va de 5 a 9 excepciones. Con un modelo correcto, el número de excepciones sigue una binomial $\text{Bin}(250;\ 0{,}01)$, de media 2,5, y $P(X \ge 7) = 1{,}37\,\%$. Es una señal de alarma, aunque no una prueba definitiva.

**16.4 Porque el déficit esperado mira dentro de la cola y es una medida coherente.**
El VaR solo dice dónde empieza la cola, así que dos carteras con colas muy distintas pueden tener el mismo VaR; el déficit esperado promedia las pérdidas de la cola y penaliza las colas gruesas. Además es subaditivo: nunca castiga la diversificación, algo que el VaR sí puede hacer (Ampliación del capítulo 16). El nivel del 97,5 % se eligió para que, bajo normalidad, la exigencia fuera parecida a la del VaR al 99 % ($2{,}338\sigma$ frente a $2{,}326\sigma$), de modo que el cambio solo endurece el requisito cuando las colas son gruesas.

---

# Resumen de fórmulas

| Concepto | Fórmula | Cap. |
|---|---|---|
| Rentabilidad simple | $R = P_1/P_0 - 1$ | 1 |
| Rentabilidad logarítmica | $r = \ln(P_1/P_0) = \ln(1 + R)$ | 1 |
| Encadenar periodos | $1 + R_{0,T} = \prod_t (1 + R_t)$, $\quad r_{0,T} = \sum_t r_t$ | 1 |
| Ganancia que recupera una pérdida $L$ | $L/(1 - L)$ | 1 |
| Valor futuro | $VF = VP\,(1 + i)^T$ | 2 |
| Valor presente de un flujo de pagos | $VP = \sum_t C_t/(1 + i)^t$ | 2 |
| Renta constante | $VP = C\,[1 - (1+i)^{-T}]/i$ | 2 |
| Valor esperado | $E[X] = \sum_k p_k x_k$ | 3 |
| Paseo aleatorio | $S_n = S_0 + \sum_{i=1}^{n} X_i$, $\quad E[S_n] = S_0 + n\mu$ | 4 |
| Varianza | $\operatorname{Var}(X) = E[(X - \mu)^2]$ | 4 |
| Regla de la raíz del tiempo | $\sigma_n = \sigma\sqrt{n}$ | 4 |
| Tipificación | $z = (x - \mu)/\sigma$, $\quad P(X \le x) = \Phi(z)$ | 5 |
| Densidad normal | $f(x) = \frac{1}{\sigma\sqrt{2\pi}}\,e^{-(x-\mu)^2/(2\sigma^2)}$ | 5 |
| Error estándar de Monte Carlo | $\text{EE} = s/\sqrt{M}$ | 6 |
| Volatilidad muestral | $\hat\sigma = \sqrt{\frac{1}{N-1}\sum_t (r_t - \bar r)^2}$ | 7 |
| Anualizar la volatilidad | $\sigma_{\text{anual}} = \hat\sigma\sqrt{h}$ | 7 |
| Ratio de Sharpe | $\text{SR} = (\mu - r_f)/\sigma$ | 8 |
| Crecimiento compuesto | $g \approx \mu - \tfrac12\sigma^2$ | 9 |
| Covarianza | $\operatorname{Cov}(X, Y) = E[(X - \mu_X)(Y - \mu_Y)]$ | 10 |
| Correlación | $\rho = \operatorname{Cov}(X, Y)/(\sigma_X\sigma_Y)$ | 10 |
| Varianza de dos activos | $\sigma_p^2 = w_1^2\sigma_1^2 + w_2^2\sigma_2^2 + 2w_1w_2\rho\sigma_1\sigma_2$ | 11 |
| $N$ activos iguales | $\sigma_p^2 = \sigma^2\,[1/N + (1 - 1/N)\rho]$ | 11 |
| Mínima varianza (dos activos) | $w^* = \dfrac{\sigma_2^2 - \rho\sigma_1\sigma_2}{\sigma_1^2 + \sigma_2^2 - 2\rho\sigma_1\sigma_2}$ | 12 |
| Beta | $\beta_i = \operatorname{Cov}(R_i, R_m)/\sigma_m^2 = \rho_{im}\sigma_i/\sigma_m$ | 13 |
| CAPM | $E[R_i] = r_f + \beta_i\,(E[R_m] - r_f)$ | 13 |
| Crecimiento de una apuesta | $g(f) = p\ln(1 + bf) + (1 - p)\ln(1 - f)$ | 14 |
| Fracción de Kelly | $f^* = p - (1 - p)/b$; $\quad$ continua: $f^* = (\mu - r)/\sigma^2$ | 14 |
| Curtosis | $\kappa = E[(X - \mu)^4]/\sigma^4$ (normal: 3) | 15 |
| VaR normal | $\text{VaR}_c = z_c\,\sigma\,V$ | 16 |
| Déficit esperado normal | $\text{ES}_c = \varphi(z_c)\,\sigma\,V/(1 - c)$ | 16 |

Cuantiles de la normal estándar que conviene recordar: $z_{0{,}95} = 1{,}645$; $z_{0{,}975} = 1{,}960$; $z_{0{,}99} = 2{,}326$; $z_{0{,}995} = 2{,}576$.

---

# Glosario

Términos ordenados alfabéticamente, con el capítulo o tema donde se definen.

| Término | Definición | Cap. |
|---|---|---|
| **alfa** | rentabilidad media de un activo por encima de la que le corresponde según su beta | 13 |
| **anualizar** | convertir una medida de otra frecuencia (diaria, mensual) a base anual | 7 |
| **asimetría** | medida de si una cola de la distribución es más larga que la otra | 15 |
| **backtest** | simulación de una estrategia con datos históricos | A |
| **beta** | sensibilidad de la rentabilidad de un activo a la del mercado | 13 |
| **caída máxima** | mayor pérdida desde un máximo anterior a lo largo de un periodo | E |
| **CAPM** | modelo de valoración de activos financieros: la rentabilidad esperada crece linealmente con la beta | 13 |
| **cartera** | conjunto de inversiones mantenidas a la vez | 11 |
| **cartera de mercado** | cartera que contiene todos los activos con riesgo en proporción a su valor | 13 |
| **cartera de mínima varianza** | combinación de activos con la menor volatilidad posible | 12 |
| **cointegración** | relación entre precios no estacionarios cuya combinación lineal sí es estacionaria | D |
| **colas** | zonas de una distribución correspondientes a valores extremos | 5 |
| **colas gruesas** | propiedad de una distribución con más probabilidad en los extremos que la normal | 15 |
| **correlación** | covarianza normalizada, entre −1 y +1, que mide la relación lineal entre dos variables | 10 |
| **covarianza** | valor esperado del producto de las desviaciones de dos variables respecto a sus medias | 10 |
| **curtosis** | cuarto momento tipificado; mide el peso de las colas (3 en la normal) | 15 |
| **déficit esperado** | pérdida media en los casos que superan el valor en riesgo | 16 |
| **delta** | número de acciones que replica una opción; en Black-Scholes, $N(d_1)$ para la compra | C |
| **deriva** | tendencia media por paso de un paseo aleatorio | 4 |
| **descontar** | calcular el valor actual de un pago futuro | 2 |
| **desviación típica** | raíz cuadrada de la varianza; dispersión típica alrededor de la media | 4 |
| **distribución normal** | distribución en forma de campana determinada por su media y su desviación típica | 5 |
| **diversificación** | reparto del dinero entre inversiones que no se mueven en perfecta sincronía | 11 |
| **error estándar** | desviación típica de un estimador; mide su precisión | 6 |
| **factor de descuento** | valor hoy de un euro pagadero en una fecha futura | 2 |
| **finanzas cuantitativas** | aplicación de la probabilidad, la estadística y la programación a los mercados financieros | Prefacio |
| **frontera eficiente** | conjunto de carteras con la máxima rentabilidad media para cada volatilidad | 12 |
| **independientes** | variables tales que conocer una no da información sobre la otra | 4 |
| **interés compuesto** | interés que se calcula también sobre los intereses acumulados | 2 |
| **ley de los grandes números** | resultado que garantiza que la media de muchas repeticiones se acerca al valor esperado | 3 |
| **línea del mercado de valores** | recta que relaciona beta y rentabilidad esperada en el CAPM | 13 |
| **lastre de la volatilidad** | diferencia entre la rentabilidad media y la tasa de crecimiento compuesto | 9 |
| **mediano (resultado)** | valor que deja la mitad de los resultados por debajo y la mitad por encima | 14 |
| **nivel de confianza** | probabilidad con la que la pérdida no supera el valor en riesgo | 16 |
| **paseo aleatorio** | proceso que se obtiene sumando pasos aleatorios independientes | 4 |
| **percentil** | valor por debajo del cual queda un porcentaje dado de los resultados | 6 |
| **peso** | proporción del valor de una cartera invertida en un activo | 11 |
| **prima de riesgo del mercado** | rentabilidad esperada del mercado por encima del tipo libre de riesgo | 13 |
| **ratio de Sharpe** | rentabilidad en exceso dividida por la volatilidad | 8 |
| **regla de la raíz del tiempo** | la desviación típica de una suma de pasos independientes crece con la raíz del número de pasos | 4 |
| **rentabilidad** | variación del valor de una inversión en proporción a su valor inicial | 1 |
| **rentabilidad en exceso** | rentabilidad por encima del tipo libre de riesgo | 8 |
| **rentabilidad logarítmica** | logaritmo natural del cociente entre el valor final y el inicial | 1 |
| **riesgo específico** | parte del riesgo de un activo que se puede eliminar diversificando | 13 |
| **riesgo sistemático** | parte del riesgo común a todos los activos, que la diversificación no elimina | 11 |
| **semilla** | valor inicial del generador de números pseudoaleatorios | 6 |
| **sesión** | día en que el mercado abre; unas 252 al año | 7 |
| **simulación de Monte Carlo** | método que estima probabilidades y valores esperados generando muchos escenarios aleatorios | 6 |
| **sobreajuste** | ajuste de una estrategia o modelo al ruido de los datos históricos | A |
| **tasa anual equivalente (TAE)** | tipo anual compuesto que resume el coste o el rendimiento total de una operación | 2 |
| **tasa de crecimiento compuesto** | rentabilidad constante que produciría la misma riqueza final | 9 |
| **teorema central del límite** | resultado según el cual la suma de muchas variables independientes tiende a la normal | 5 |
| **tipificar** | expresar un valor como distancia a la media medida en desviaciones típicas | 5 |
| **tipo de interés** | rentabilidad que se paga por unidad de tiempo por disponer de dinero | 2 |
| **tipo libre de riesgo** | rentabilidad que se obtiene sin asumir riesgo, como la de una letra del Tesoro | 8 |
| **trayectoria** | una de las evoluciones posibles de un proceso aleatorio | 4 |
| **valor en riesgo (VaR)** | pérdida que solo se supera con una probabilidad dada en un horizonte dado | 16 |
| **valor esperado** | media de los valores posibles ponderada por sus probabilidades | 3 |
| **valor presente** | valor actual de un pago o de un flujo de pagos futuros | 2 |
| **valor temporal del dinero** | principio según el cual disponer de una cantidad ahora es preferible a recibirla más tarde | 2 |
| **varianza** | media del cuadrado de la distancia a la media | 4 |
| **venta en corto** | venta de un activo prestado, con la obligación de devolverlo más tarde | 12 |
| **volatilidad** | desviación típica de las rentabilidades, normalmente anualizada | 7 |

---

# Epílogo · Por dónde seguir

Este libro ha recorrido un camino concreto: de la rentabilidad de un solo activo al riesgo extremo de una cartera, pasando por la probabilidad, la estadística y la teoría de carteras. Por el camino han aparecido tres ideas que conviene llevarse.

La primera es que **el azar tiene estructura**. Los precios son imprevisibles a corto plazo, pero su incertidumbre crece de forma regular con el tiempo, se compensa en parte al combinar activos y se puede medir con unas pocas herramientas.

La segunda es que **las medias engañan**. La rentabilidad media sobrestima el crecimiento, el valor esperado ignora la ruina, y la volatilidad y el VaR dicen poco de los peores días. Casi todos los errores graves en finanzas cuantitativas consisten en fijarse en un único número.

La tercera es que **todo modelo es una hipótesis**. La normal, la independencia, las correlaciones estables o el CAPM son aproximaciones útiles con límites conocidos. Las secciones «Ampliación» intentan dejar claros esos límites y la evidencia empírica que los revela.

Para seguir avanzando, los cinco temas complementarios señalan direcciones naturales, y el proyecto práctico ofrece un primer trabajo propio. Para profundizar en cada área, la bibliografía marca con ★ los manuales de referencia: probabilidad (Feller), econometría financiera (Campbell, Lo y MacKinlay), inversión y carteras (Luenberger), derivados (Hull; Shreve), simulación (Glasserman) y gestión cuantitativa del riesgo (McNeil, Frey y Embrechts; Jorion; Embrechts, Klüppelberg y Mikosch).

---

*Todos los datos de los ejemplos son inventados o simulados, y ninguna cifra de este texto describe una inversión real. El contenido es exclusivamente educativo y no constituye asesoramiento financiero, de inversión ni de ningún otro tipo profesional.*

---

# Bibliografía

Obras citadas en las ampliaciones, ordenadas alfabéticamente. Se indican la revista, el volumen, el número y las páginas para que cada referencia pueda comprobarse. Las referencias marcadas con ★ son manuales recomendados para profundizar.

### Manuales y monografías de referencia

- Bouchaud, J.-P., Bonart, J., Donier, J. y Gould, M. (2018). *Trades, Quotes and Prices: Financial Markets Under the Microscope*. Cambridge University Press.
- ★ Campbell, J. Y., Lo, A. W. y MacKinlay, A. C. (1997). *The Econometrics of Financial Markets*. Princeton University Press.
- ★ Embrechts, P., Klüppelberg, C. y Mikosch, T. (1997). *Modelling Extremal Events for Insurance and Finance*. Springer.
- ★ Feller, W. (1968). *An Introduction to Probability Theory and Its Applications*, vol. 1 (3.ª ed.). Wiley.
- Fernholz, E. R. (2002). *Stochastic Portfolio Theory*. Springer.
- ★ Glasserman, P. (2003). *Monte Carlo Methods in Financial Engineering*. Springer.
- ★ Hull, J. C. (2018). *Options, Futures, and Other Derivatives* (10.ª ed.). Pearson.
- ★ Jorion, P. (2007). *Value at Risk: The New Benchmark for Managing Financial Risk* (3.ª ed.). McGraw-Hill.
- López de Prado, M. (2018). *Advances in Financial Machine Learning*. Wiley.
- ★ Luenberger, D. G. (2013). *Investment Science* (2.ª ed.). Oxford University Press.
- MacLean, L. C., Thorp, E. O. y Ziemba, W. T. (eds.) (2011). *The Kelly Capital Growth Investment Criterion: Theory and Practice*. World Scientific.
- Markowitz, H. M. (1959). *Portfolio Selection: Efficient Diversification of Investments*. Wiley.
- ★ McNeil, A. J., Frey, R. y Embrechts, P. (2015). *Quantitative Risk Management: Concepts, Techniques and Tools* (ed. revisada). Princeton University Press.
- ★ Shreve, S. E. (2004). *Stochastic Calculus for Finance I: The Binomial Asset Pricing Model* y *II: Continuous-Time Models*. Springer.
- Thorp, E. O. (1962). *Beat the Dealer*. Blaisdell (Random House).
- Von Neumann, J. y Morgenstern, O. (1944). *Theory of Games and Economic Behavior*. Princeton University Press.

### Obras históricas

- Bachelier, L. (1900). Théorie de la spéculation. *Annales scientifiques de l'École Normale Supérieure*, 3.ª serie, 17, 21–86.
- Bernoulli, D. (1738/1954). Specimen theoriae novae de mensura sortis. Trad. inglesa: Exposition of a new theory on the measurement of risk. *Econometrica*, 22(1), 23–36.
- Bernoulli, J. (1713). *Ars Conjectandi*. Basilea: Thurneysen.
- Buffon, G.-L. Leclerc, conde de (1777). Essai d'arithmétique morale. *Supplément à l'Histoire naturelle*, vol. 4. París: Imprimerie Royale.
- De Moivre, A. (1738). *The Doctrine of Chances* (2.ª ed., que incluye la aproximación de 1733 de la binomial por la normal). Londres.
- Fisher, I. (1930). *The Theory of Interest*. Macmillan.
- Galton, F. (1889). *Natural Inheritance*. Macmillan.
- Gauss, C. F. (1809). *Theoria motus corporum coelestium in sectionibus conicis solem ambientium*. Hamburgo: Perthes y Besser.
- Kolmogórov, A. N. (1933). *Grundbegriffe der Wahrscheinlichkeitsrechnung*. Springer.
- Laplace, P.-S. (1812). *Théorie analytique des probabilités*. París: Courcier.
- Macaulay, F. R. (1938). *Some Theoretical Problems Suggested by the Movements of Interest Rates, Bond Yields and Stock Prices in the United States since 1856*. National Bureau of Economic Research.
- Pearson, K. (1905). The problem of the random walk. *Nature*, 72, 294.

### Artículos

- Acerbi, C. y Tasche, D. (2002). On the coherence of expected shortfall. *Journal of Banking & Finance*, 26(7), 1487–1503.
- Almgren, R. y Chriss, N. (2001). Optimal execution of portfolio transactions. *Journal of Risk*, 3(2), 5–39.
- Almgren, R., Thum, C., Hauptmann, E. y Li, H. (2005). Direct estimation of equity market impact. *Risk*, 18(7), 58–62.
- Andersen, T. G., Bollerslev, T., Diebold, F. X. y Labys, P. (2003). Modeling and forecasting realized volatility. *Econometrica*, 71(2), 579–625.
- Ang, A. y Chen, J. (2002). Asymmetric correlations of equity portfolios. *Journal of Financial Economics*, 63(3), 443–494.
- Anscombe, F. J. (1973). Graphs in statistical analysis. *The American Statistician*, 27(1), 17–21.
- Artzner, P., Delbaen, F., Eber, J.-M. y Heath, D. (1999). Coherent measures of risk. *Mathematical Finance*, 9(3), 203–228.
- Bailey, D. H. y López de Prado, M. (2014). The deflated Sharpe ratio: correcting for selection bias, backtest overfitting, and non-normality. *Journal of Portfolio Management*, 40(5), 94–107.
- Bailey, D. H., Borwein, J., López de Prado, M. y Zhu, Q. J. (2017). The probability of backtest overfitting. *Journal of Computational Finance*, 20(4), 39–69.
- Barone-Adesi, G., Giannopoulos, K. y Vosper, L. (1999). VaR without correlations for portfolios of derivative securities. *Journal of Futures Markets*, 19(5), 583–602.
- Berry, A. C. (1941). The accuracy of the Gaussian approximation to the sum of independent variates. *Transactions of the American Mathematical Society*, 49(1), 122–136.
- Best, M. J. y Grauer, R. R. (1991). On the sensitivity of mean-variance-efficient portfolios to changes in asset means: some analytical and computational results. *Review of Financial Studies*, 4(2), 315–342.
- Black, F. (1972). Capital market equilibrium with restricted borrowing. *Journal of Business*, 45(3), 444–455.
- Black, F. (1976). Studies of stock price volatility changes. *Proceedings of the 1976 Meetings of the American Statistical Association, Business and Economic Statistics Section*, 177–181.
- Black, F., Jensen, M. C. y Scholes, M. (1972). The capital asset pricing model: some empirical tests. En M. C. Jensen (ed.), *Studies in the Theory of Capital Markets* (pp. 79–121). Praeger.
- Black, F. y Litterman, R. (1992). Global portfolio optimization. *Financial Analysts Journal*, 48(5), 28–43.
- Black, F. y Scholes, M. (1973). The pricing of options and corporate liabilities. *Journal of Political Economy*, 81(3), 637–654.
- Blattberg, R. C. y Gonedes, N. J. (1974). A comparison of the stable and Student distributions as statistical models for stock prices. *Journal of Business*, 47(2), 244–280.
- Blume, M. E. (1971). On the assessment of risk. *Journal of Finance*, 26(1), 1–10.
- Bollerslev, T. (1986). Generalized autoregressive conditional heteroskedasticity. *Journal of Econometrics*, 31(3), 307–327.
- Booth, D. G. y Fama, E. F. (1992). Diversification returns and asset contributions. *Financial Analysts Journal*, 48(3), 26–32.
- Box, G. E. P. y Muller, M. E. (1958). A note on the generation of random normal deviates. *Annals of Mathematical Statistics*, 29(2), 610–611.
- Boyle, P. P. (1977). Options: a Monte Carlo approach. *Journal of Financial Economics*, 4(3), 323–338.
- Brandt, M. W., Brav, A., Graham, J. R. y Kumar, A. (2010). The idiosyncratic volatility puzzle: time trend or speculative episodes? *Review of Financial Studies*, 23(2), 863–899.
- Breiman, L. (1961). Optimal gambling systems for favorable games. *Proceedings of the Fourth Berkeley Symposium on Mathematical Statistics and Probability*, vol. 1, 65–78.
- Campbell, J. Y., Lettau, M., Malkiel, B. G. y Xu, Y. (2001). Have individual stocks become more volatile? An empirical exploration of idiosyncratic risk. *Journal of Finance*, 56(1), 1–43.
- Carhart, M. M. (1997). On persistence in mutual fund performance. *Journal of Finance*, 52(1), 57–82.
- Carr, P. y Wu, L. (2009). Variance risk premiums. *Review of Financial Studies*, 22(3), 1311–1341.
- Cheng, M. y Madhavan, A. (2009). The dynamics of leveraged and inverse exchange-traded funds. *Journal of Investment Management*, 7(4), 43–62.
- Chopra, V. K. y Ziemba, W. T. (1993). The effect of errors in means, variances, and covariances on optimal portfolio choice. *Journal of Portfolio Management*, 19(2), 6–11.
- Choueifaty, Y. y Coignard, Y. (2008). Toward maximum diversification. *Journal of Portfolio Management*, 35(1), 40–51.
- Christoffersen, P. F. (1998). Evaluating interval forecasts. *International Economic Review*, 39(4), 841–862.
- Clarke, R., de Silva, H. y Thorley, S. (2006). Minimum-variance portfolios in the U.S. equity market. *Journal of Portfolio Management*, 33(1), 10–24.
- Cont, R. (2001). Empirical properties of asset returns: stylized facts and statistical issues. *Quantitative Finance*, 1(2), 223–236.
- Cornish, E. A. y Fisher, R. A. (1938). Moments and cumulants in the specification of distributions. *Revue de l'Institut International de Statistique*, 5(4), 307–320.
- Cox, J. C., Ross, S. A. y Rubinstein, M. (1979). Option pricing: a simplified approach. *Journal of Financial Economics*, 7(3), 229–263.
- Dalang, R. C., Morton, A. y Willinger, W. (1990). Equivalent martingale measures and no-arbitrage in stochastic securities market models. *Stochastics and Stochastic Reports*, 29(2), 185–201.
- Danielsson, J. (2002). The emperor has no clothes: limits to risk modelling. *Journal of Banking & Finance*, 26(7), 1273–1296.
- Danielsson, J. y Zigrand, J.-P. (2006). On time-scaling of risk and the square-root-of-time rule. *Journal of Banking & Finance*, 30(10), 2701–2713.
- Delbaen, F. y Schachermayer, W. (1994). A general version of the fundamental theorem of asset pricing. *Mathematische Annalen*, 300(1), 463–520.
- DeMiguel, V., Garlappi, L. y Uppal, R. (2009). Optimal versus naive diversification: how inefficient is the 1/N portfolio strategy? *Review of Financial Studies*, 22(5), 1915–1953.
- Dickey, D. A. y Fuller, W. A. (1979). Distribution of the estimators for autoregressive time series with a unit root. *Journal of the American Statistical Association*, 74(366), 427–431.
- Efron, B. (1979). Bootstrap methods: another look at the jackknife. *Annals of Statistics*, 7(1), 1–26.
- Embrechts, P., McNeil, A. J. y Straumann, D. (2002). Correlation and dependence in risk management: properties and pitfalls. En M. A. H. Dempster (ed.), *Risk Management: Value at Risk and Beyond* (pp. 176–223). Cambridge University Press.
- Engle, R. F. (1982). Autoregressive conditional heteroscedasticity with estimates of the variance of United Kingdom inflation. *Econometrica*, 50(4), 987–1007.
- Engle, R. F. (2002). Dynamic conditional correlation: a simple class of multivariate generalized autoregressive conditional heteroskedasticity models. *Journal of Business & Economic Statistics*, 20(3), 339–350.
- Engle, R. F. y Granger, C. W. J. (1987). Co-integration and error correction: representation, estimation, and testing. *Econometrica*, 55(2), 251–276.
- Esseen, C.-G. (1942). On the Liapounoff limit of error in the theory of probability. *Arkiv för Matematik, Astronomi och Fysik*, 28A(9), 1–19.
- Evans, J. L. y Archer, S. H. (1968). Diversification and the reduction of dispersion: an empirical analysis. *Journal of Finance*, 23(5), 761–767.
- Fama, E. F. (1965). The behavior of stock-market prices. *Journal of Business*, 38(1), 34–105.
- Fama, E. F. (1970). Efficient capital markets: a review of theory and empirical work. *Journal of Finance*, 25(2), 383–417.
- Fama, E. F. y French, K. R. (1992). The cross-section of expected stock returns. *Journal of Finance*, 47(2), 427–465.
- Fama, E. F. y French, K. R. (1993). Common risk factors in the returns on stocks and bonds. *Journal of Financial Economics*, 33(1), 3–56.
- Fama, E. F. y French, K. R. (2004). The capital asset pricing model: theory and evidence. *Journal of Economic Perspectives*, 18(3), 25–46.
- Fama, E. F. y French, K. R. (2015). A five-factor asset pricing model. *Journal of Financial Economics*, 116(1), 1–22.
- Fama, E. F. y MacBeth, J. D. (1973). Risk, return, and equilibrium: empirical tests. *Journal of Political Economy*, 81(3), 607–636.
- Fernholz, R. y Shay, B. (1982). Stochastic portfolio theory and stock market equilibrium. *Journal of Finance*, 37(2), 615–624.
- Fissler, T. y Ziegel, J. F. (2016). Higher order elicitability and Osband's principle. *Annals of Statistics*, 44(4), 1680–1707.
- Forbes, K. J. y Rigobon, R. (2002). No contagion, only interdependence: measuring stock market comovements. *Journal of Finance*, 57(5), 2223–2261.
- Frazzini, A. y Pedersen, L. H. (2014). Betting against beta. *Journal of Financial Economics*, 111(1), 1–25.
- Gabaix, X., Gopikrishnan, P., Plerou, V. y Stanley, H. E. (2003). A theory of power-law distributions in financial market fluctuations. *Nature*, 423, 267–270.
- Gatheral, J., Jaisson, T. y Rosenbaum, M. (2018). Volatility is rough. *Quantitative Finance*, 18(6), 933–949.
- Glosten, L. R., Jagannathan, R. y Runkle, D. E. (1993). On the relation between the expected value and the volatility of the nominal excess return on stocks. *Journal of Finance*, 48(5), 1779–1801.
- Gneiting, T. (2011). Making and evaluating point forecasts. *Journal of the American Statistical Association*, 106(494), 746–762.
- Goetzmann, W., Ingersoll, J., Spiegel, M. y Welch, I. (2007). Portfolio performance manipulation and manipulation-proof performance measures. *Review of Financial Studies*, 20(5), 1503–1546.
- Gopikrishnan, P., Plerou, V., Amaral, L. A. N., Meyer, M. y Stanley, H. E. (1999). Scaling of the distribution of fluctuations of financial market indices. *Physical Review E*, 60(5), 5305–5316.
- Graham, J. R. y Harvey, C. R. (2001). The theory and practice of corporate finance: evidence from the field. *Journal of Financial Economics*, 60(2–3), 187–243.
- Granger, C. W. J. y Newbold, P. (1974). Spurious regressions in econometrics. *Journal of Econometrics*, 2(2), 111–120.
- Harrison, J. M. y Kreps, D. M. (1979). Martingales and arbitrage in multiperiod securities markets. *Journal of Economic Theory*, 20(3), 381–408.
- Harrison, J. M. y Pliska, S. R. (1981). Martingales and stochastic integrals in the theory of continuous trading. *Stochastic Processes and their Applications*, 11(3), 215–260.
- Harvey, C. R., Liu, Y. y Zhu, H. (2016). … and the cross-section of expected returns. *Review of Financial Studies*, 29(1), 5–68.
- Hill, B. M. (1975). A simple general approach to inference about the tail of a distribution. *Annals of Statistics*, 3(5), 1163–1174.
- Hou, K., Xue, C. y Zhang, L. (2015). Digesting anomalies: an investment approach. *Review of Financial Studies*, 28(3), 650–705.
- Hou, K., Xue, C. y Zhang, L. (2020). Replicating anomalies. *Review of Financial Studies*, 33(5), 2019–2133.
- Jagannathan, R. y Ma, T. (2003). Risk reduction in large portfolios: why imposing the wrong constraints helps. *Journal of Finance*, 58(4), 1651–1683.
- Jarque, C. M. y Bera, A. K. (1980). Efficient tests for normality, homoscedasticity and serial independence of regression residuals. *Economics Letters*, 6(3), 255–259.
- Jensen, J. L. W. V. (1906). Sur les fonctions convexes et les inégalités entre les valeurs moyennes. *Acta Mathematica*, 30, 175–193.
- Jensen, M. C. (1968). The performance of mutual funds in the period 1945–1964. *Journal of Finance*, 23(2), 389–416.
- Jensen, T. I., Kelly, B. y Pedersen, L. H. (2023). Is there a replication crisis in finance? *Journal of Finance*, 78(5), 2465–2518.
- Kelly, J. L. (1956). A new interpretation of information rate. *Bell System Technical Journal*, 35(4), 917–926.
- Kendall, M. G. (1938). A new measure of rank correlation. *Biometrika*, 30(1/2), 81–93.
- Kirby, C. y Ostdiek, B. (2012). It's all in the timing: simple active portfolio strategies that outperform naïve diversification. *Journal of Financial and Quantitative Analysis*, 47(2), 437–467.
- Kritzman, M., Page, S. y Turkington, D. (2010). In defense of optimization: the fallacy of 1/N. *Financial Analysts Journal*, 66(2), 31–39.
- Kupiec, P. H. (1995). Techniques for verifying the accuracy of risk measurement models. *Journal of Derivatives*, 3(2), 73–84.
- Laloux, L., Cizeau, P., Bouchaud, J.-P. y Potters, M. (1999). Noise dressing of financial correlation matrices. *Physical Review Letters*, 83(7), 1467–1470.
- Latané, H. A. (1959). Criteria for choice among risky ventures. *Journal of Political Economy*, 67(2), 144–155.
- Ledoit, O. y Wolf, M. (2004). Honey, I shrunk the sample covariance matrix. *Journal of Portfolio Management*, 30(4), 110–119.
- Li, D. X. (2000). On default correlation: a copula function approach. *Journal of Fixed Income*, 9(4), 43–54.
- Lindeberg, J. W. (1922). Eine neue Herleitung des Exponentialgesetzes in der Wahrscheinlichkeitsrechnung. *Mathematische Zeitschrift*, 15, 211–225.
- Lintner, J. (1965). The valuation of risk assets and the selection of risky investments in stock portfolios and capital budgets. *Review of Economics and Statistics*, 47(1), 13–37.
- Lo, A. W. (2002). The statistics of Sharpe ratios. *Financial Analysts Journal*, 58(4), 36–52.
- Lo, A. W. y MacKinlay, A. C. (1988). Stock market prices do not follow random walks: evidence from a simple specification test. *Review of Financial Studies*, 1(1), 41–66.
- Longin, F. y Solnik, B. (2001). Extreme correlation of international equity markets. *Journal of Finance*, 56(2), 649–676.
- Longstaff, F. A. y Schwartz, E. S. (2001). Valuing American options by simulation: a simple least-squares approach. *Review of Financial Studies*, 14(1), 113–147.
- Magdon-Ismail, M., Atiya, A. F., Pratap, A. y Abu-Mostafa, Y. S. (2004). On the maximum drawdown of a Brownian motion. *Journal of Applied Probability*, 41(1), 147–161.
- Maillard, S., Roncalli, T. y Teïletche, J. (2010). The properties of equally weighted risk contribution portfolios. *Journal of Portfolio Management*, 36(4), 60–70.
- Mandelbrot, B. (1963). The variation of certain speculative prices. *Journal of Business*, 36(4), 394–419.
- Mandelbrot, B. B. y Van Ness, J. W. (1968). Fractional Brownian motions, fractional noises and applications. *SIAM Review*, 10(4), 422–437.
- Markowitz, H. (1952). Portfolio selection. *Journal of Finance*, 7(1), 77–91.
- Matsumoto, M. y Nishimura, T. (1998). Mersenne Twister: a 623-dimensionally equidistributed uniform pseudo-random number generator. *ACM Transactions on Modeling and Computer Simulation*, 8(1), 3–30.
- McLean, R. D. y Pontiff, J. (2016). Does academic research destroy stock return predictability? *Journal of Finance*, 71(1), 5–32.
- McNeil, A. J. y Frey, R. (2000). Estimation of tail-related risk measures for heteroscedastic financial time series: an extreme value approach. *Journal of Empirical Finance*, 7(3–4), 271–300.
- Merton, R. C. (1969). Lifetime portfolio selection under uncertainty: the continuous-time case. *Review of Economics and Statistics*, 51(3), 247–257.
- Merton, R. C. (1972). An analytic derivation of the efficient portfolio frontier. *Journal of Financial and Quantitative Analysis*, 7(4), 1851–1872.
- Merton, R. C. (1973). An intertemporal capital asset pricing model. *Econometrica*, 41(5), 867–887.
- Merton, R. C. (1976). Option pricing when underlying stock returns are discontinuous. *Journal of Financial Economics*, 3(1–2), 125–144.
- Merton, R. C. (1980). On estimating the expected return on the market: an exploratory investigation. *Journal of Financial Economics*, 8(4), 323–361.
- Metropolis, N. y Ulam, S. (1949). The Monte Carlo method. *Journal of the American Statistical Association*, 44(247), 335–341.
- Michaud, R. O. (1989). The Markowitz optimization enigma: is 'optimized' optimal? *Financial Analysts Journal*, 45(1), 31–42.
- Mossin, J. (1966). Equilibrium in a capital asset market. *Econometrica*, 34(4), 768–783.
- Nelson, C. R. y Siegel, A. F. (1987). Parsimonious modeling of yield curves. *Journal of Business*, 60(4), 473–489.
- O'Neill, M. E. (2014). *PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation*. Informe técnico HMC-CS-2014-0905, Harvey Mudd College.
- Parkinson, M. (1980). The extreme value method for estimating the variance of the rate of return. *Journal of Business*, 53(1), 61–65.
- Pearson, K. (1896). Mathematical contributions to the theory of evolution. III. Regression, heredity, and panmixia. *Philosophical Transactions of the Royal Society of London, Series A*, 187, 253–318.
- Pólya, G. (1921). Über eine Aufgabe der Wahrscheinlichkeitsrechnung betreffend die Irrfahrt im Straßennetz. *Mathematische Annalen*, 84, 149–160.
- Praetz, P. D. (1972). The distribution of share price changes. *Journal of Business*, 45(1), 49–55.
- Rockafellar, R. T. y Uryasev, S. (2000). Optimization of conditional value-at-risk. *Journal of Risk*, 2(3), 21–41.
- Roll, R. (1977). A critique of the asset pricing theory's tests. Part I: On past and potential testability of the theory. *Journal of Financial Economics*, 4(2), 129–176.
- Ross, S. A. (1976). The arbitrage theory of capital asset pricing. *Journal of Economic Theory*, 13(3), 341–360.
- Rotando, L. M. y Thorp, E. O. (1992). The Kelly criterion and the stock market. *American Mathematical Monthly*, 99(10), 922–931.
- Rubinstein, M. (1994). Implied binomial trees. *Journal of Finance*, 49(3), 771–818.
- Samuelson, P. A. (1963). Risk and uncertainty: a fallacy of large numbers. *Scientia*, 98, 108–113.
- Samuelson, P. A. (1965). Proof that properly anticipated prices fluctuate randomly. *Industrial Management Review*, 6(2), 41–49.
- Samuelson, P. A. (1979). Why we should not make mean log of wealth big though years to act are long. *Journal of Banking & Finance*, 3(4), 305–307.
- Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379–423, y 27(4), 623–656.
- Sharpe, W. F. (1963). A simplified model for portfolio analysis. *Management Science*, 9(2), 277–293.
- Sharpe, W. F. (1964). Capital asset prices: a theory of market equilibrium under conditions of risk. *Journal of Finance*, 19(3), 425–442.
- Sharpe, W. F. (1966). Mutual fund performance. *Journal of Business*, 39(1), 119–138.
- Sharpe, W. F. (1994). The Sharpe ratio. *Journal of Portfolio Management*, 21(1), 49–58.
- Shevtsova, I. (2011). On the absolute constants in the Berry–Esseen type inequalities for identically distributed summands. Preimpresión, arXiv:1111.6554.
- Sklar, A. (1959). Fonctions de répartition à *n* dimensions et leurs marges. *Publications de l'Institut de Statistique de l'Université de Paris*, 8, 229–231.
- Sobol', I. M. (1967). On the distribution of points in a cube and the approximate evaluation of integrals. *USSR Computational Mathematics and Mathematical Physics*, 7(4), 86–112.
- Sortino, F. A. y van der Meer, R. (1991). Downside risk. *Journal of Portfolio Management*, 17(4), 27–31.
- Spearman, C. (1904). The proof and measurement of association between two things. *American Journal of Psychology*, 15(1), 72–101.
- Statman, M. (1987). How many stocks make a diversified portfolio? *Journal of Financial and Quantitative Analysis*, 22(3), 353–363.
- Thorp, E. O. (2006). The Kelly criterion in blackjack, sports betting, and the stock market. En S. A. Zenios y W. T. Ziemba (eds.), *Handbook of Asset and Liability Management*, vol. 1 (pp. 385–428). Elsevier.
- Tobin, J. (1958). Liquidity preference as behavior towards risk. *Review of Economic Studies*, 25(2), 65–86.
- Treynor, J. L. (1965). How to rate management of investment funds. *Harvard Business Review*, 43(1), 63–75.
- Vasicek, O. A. (1973). A note on using cross-sectional information in Bayesian estimation of security betas. *Journal of Finance*, 28(5), 1233–1239.
- Westfall, P. H. (2014). Kurtosis as peakedness, 1905–2014. R.I.P. *The American Statistician*, 68(3), 191–195.
- Yule, G. U. (1926). Why do we sometimes get nonsense-correlations between time-series? A study in sampling and the nature of time-series. *Journal of the Royal Statistical Society*, 89(1), 1–63.

### Documentos técnicos, normativa y regulación

- Basel Committee on Banking Supervision (1996a). *Amendment to the Capital Accord to Incorporate Market Risks*. Basilea: Banco de Pagos Internacionales.
- Basel Committee on Banking Supervision (1996b). *Supervisory Framework for the Use of «Backtesting» in Conjunction with the Internal Models Approach to Market Risk Capital Requirements*. Basilea: Banco de Pagos Internacionales.
- Basel Committee on Banking Supervision (2009). *Revisions to the Basel II Market Risk Framework*. Basilea: Banco de Pagos Internacionales.
- Basel Committee on Banking Supervision (2019). *Minimum Capital Requirements for Market Risk* (revisión de la norma de enero de 2016, conocida como FRTB). Basilea: Banco de Pagos Internacionales.
- CNMC (2019). Circular 2/2019, de 12 de noviembre, de la Comisión Nacional de los Mercados y la Competencia, por la que se establece la metodología de cálculo de la tasa de retribución financiera de las actividades de transporte y distribución de energía eléctrica, y regasificación, transporte y distribución de gas natural. *BOE* de 20 de noviembre de 2019 (BOE-A-2019-16639).
- Directiva (UE) 2025/2 del Parlamento Europeo y del Consejo, de 27 de noviembre de 2024, por la que se modifica la Directiva 2009/138/CE (revisión de Solvencia II). *DOUE* L, 8 de enero de 2025.
- Directiva 2009/65/CE del Parlamento Europeo y del Consejo, de 13 de julio de 2009 (Directiva UCITS). *DOUE* L 302, de 17 de noviembre de 2009.
- Directiva 2009/138/CE del Parlamento Europeo y del Consejo, de 25 de noviembre de 2009 (Solvencia II). *DOUE* L 335, de 17 de diciembre de 2009.
- Employee Retirement Income Security Act of 1974 (ERISA), Pub. L. 93-406, §404(a)(1)(C), 29 U.S.C. §1104(a)(1)(C).
- FINRA (2009). *Regulatory Notice 09-31: Non-Traditional ETFs*. Financial Industry Regulatory Authority.
- J.P. Morgan/Reuters (1996). *RiskMetrics — Technical Document* (4.ª ed.). Nueva York: Morgan Guaranty Trust Company.
- Reglamento (UE) 2024/1623 del Parlamento Europeo y del Consejo, de 31 de mayo de 2024, por el que se modifica el Reglamento (UE) n.º 575/2013 (CRR3). *DOUE* L, 19 de junio de 2024.
- Reglamento Delegado (UE) 2017/653 de la Comisión, de 8 de marzo de 2017, que completa el Reglamento (UE) n.º 1286/2014 (documentos de datos fundamentales de los PRIIP). *DOUE* L 100, de 12 de abril de 2017.
