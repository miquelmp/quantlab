<!-- English translation of version 4 (v4). Formulas in LaTeX ($...$). The Python code keeps its Spanish identifiers; comments are translated. -->

# Foundations of Quantitative Finance: From Probability to Risk Management

**Theory, worked examples and Python code to understand how return and risk are measured**

*All the data in the examples are invented or simulated. This text is for educational purposes only and does not constitute financial advice.*

---

## Preface

Behind every financial decision there is a quantitative question. How much is a payment that will arrive in five years worth today? How much of a fund's gain is due to the manager's skill, and how much to the risk the manager took? Why do two portfolios with the same average return end up in such different places? How much can a bank lose on a bad day? **Quantitative finance** answers questions like these with tools from probability, statistics and programming.

This book is meant for readers with a mathematical background at the level of the last years of secondary school or the first years of university who want to understand those tools from the inside, without stopping at the recipe. Each idea is first presented in words and with a numerical example that can be followed with a calculator; then it is formalized, programmed and its limits are discussed.

### Organization

The book has five parts and sixteen chapters. The order is not accidental: each part uses what the earlier ones build.

| Part | Central question | Chapters |
|---|---|---|
| **I · The price of time** | How do we measure what an investment earns, and how do we compare payments on different dates? | 1–2 |
| **II · The language of chance** | What probability tools do we need to describe uncertain prices? | 3–6 |
| **III · Risk and reward** | How do we summarize the risk of an investment, and what return compensates for it? | 7–9 |
| **IV · Portfolios** | What happens when several investments are combined? | 10–13 |
| **V · Deciding and measuring the extreme** | How much to risk, and how to measure rare but severe losses? | 14–16 |

After the chapters come five supplementary topics (backtesting, transaction costs, option pricing with binomial trees, cointegration and maximum drawdowns), a practical project in Python, the solutions to the exercises, a formula summary, a glossary and the bibliography.

### How each chapter is built

Every chapter has two levels of reading.

The **first level** is self-contained and can be read without the advanced part. It starts with *The idea*, where the concept is explained in words; it continues with *A worked example*, with concrete numbers; next, *Formalization* writes the formulas and explains each symbol in the text itself; *Interactive chart* describes a visualization designed for the web version of the book, with the controls that let the reader experiment; *In Python* translates the idea into a few lines of code; *In practice* tells where the concept is used outside the classroom, and *Exercises* proposes problems with solutions at the end of the book.

The **second level**, the **«Going further»** section, gives formal definitions, derivations, assumptions, empirical evidence and historical notes, with references to the bibliography. It is written for readers who want to study the subject with university rigor or prepare a project.

The exercises carry a difficulty label (**basic**, **intermediate** or **advanced**) and a type label: **calculation**, when a number must be reached, or **reflection**, when reasoning is required. Technical terms appear in **bold** the first time they are defined and are collected in the glossary.

### Requirements for the code

The Python snippets use only the standard library and NumPy. They can be copied into a notebook and run as they are; when a snippet needs data, it generates them itself. The variable and function names are kept in the original Spanish; the comments are translated.

### A warning about the numbers

All the assets, portfolios and funds in the examples are invented, and all the series are simulated. The figures are for practicing the calculations and do not describe any real investment. The bibliographic and regulatory references have been checked, but it is advisable to consult the original source before citing them.

---

# Part I · The price of time

Before talking about risk we need to agree on how a gain is measured and on how to compare amounts of money that do not arrive on the same date. This part settles both questions. Chapter 1 defines return in its two versions, simple and logarithmic, and explains why it pays to have both at hand. Chapter 2 introduces compound interest and discounting, the tool used to value any stream of future payments, from a loan to a bond.

---

## Chapter 1 · Measuring what an investment earns

> **In this chapter** you will learn to compute simple and logarithmic returns, to chain returns over several periods without making the most common mistake, and to understand why a loss then requires a larger gain to recover.

### The idea

Knowing that an investment has made €300 says little if we do not know how much was invested: making €300 on €1,000 is not the same as making it on €100,000. That is why gains are expressed in relative terms. The **return** over a period is the change in the value of the investment divided by the initial value. If an asset goes from €40 to €50, its return is 10/40, that is, 25%.

This measure, the **simple return**, is the one everybody understands, but it has an awkward property: the returns of consecutive periods do not add up. To chain them, the growth factors must be multiplied. There is a second measure, the **log return**, which does add up over time, and that makes it the favorite of statistical models. For small moves the two almost coincide; for large moves, they do not.

### A worked example

A share trades at €40. During the first year it rises to €50 and during the second it goes back to €40.

- First year: $50/40 - 1 = +25\%$.
- Second year: $40/50 - 1 = -20\%$.

If we added the percentages we would conclude that the investment gained 5% in two years, but the final price is exactly the initial one: the real gain is zero. The correct calculation multiplies the factors, $1.25 \times 0.80 = 1$, and subtracts one.

With log returns the problem disappears: $\ln(50/40) = +0.2231$ and $\ln(40/50) = -0.2231$, which add up to exactly zero.

The example contains another lesson: after a 20% fall, a 20% rise is not enough to recover; 25% is needed. In general, to undo a loss $L$ (as a decimal) a gain of $L/(1-L)$ is needed: 11.1% after losing 10%, 100% after losing 50% and 900% after losing 90%.

### Formalization

Let $P_0$ be the value of the investment at the start of the period and $P_1$ its value at the end. The simple return is

$$R = \frac{P_1 - P_0}{P_0} = \frac{P_1}{P_0} - 1,$$

expressed as a decimal (0.25 is equivalent to 25%). The log return, or continuously compounded return, is the natural logarithm of the ratio of values:

$$r = \ln\frac{P_1}{P_0} = \ln(1 + R).$$

If an investment goes through $T$ periods with simple returns $R_1, \dots, R_T$, its final value is $P_T = P_0 (1 + R_1)(1 + R_2)\cdots(1 + R_T)$. Taking logarithms, the product becomes a sum:

$$1 + R_{0,T} = \prod_{t=1}^{T}(1 + R_t), \qquad r_{0,T} = \sum_{t=1}^{T} r_t.$$

That is the practical advantage of logarithms: the log return over a long period is the sum of the log returns of the short periods that make it up.

### Interactive chart

> **Interactive chart · The asymmetry of losses.** Left panel: the reader picks a loss between 0% and 90% with a slider, and a curve shows the gain needed to recover it, $L/(1-L)$, with the chosen point highlighted and its numerical value. Right panel: the log return $\ln(1+R)$ against the simple return $R$ for $R$ between −60% and +100%, together with the diagonal $r = R$; hovering shows the difference between the two. What the reader should observe: near zero the two measures almost coincide, but the log return always stays below the simple one (except at $R = 0$) and moves far away from it in large moves, above all in falls.

### In Python

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
print(simples, sum(simples))   # [0.25, -0.2] and a misleading sum of 0.05
print(logs, sum(logs))         # [0.223, -0.223] and a sum of 0.0
```

### In practice

- Fund fact sheets show the return of each calendar year separately, so that investors can see the whole sequence and not just an average.
- The same stock index is usually published in two versions: the **price** index, which only captures the change in quotes, and the **total return** index, which also reinvests dividends. Over the long run the difference between the two is enormous.
- Risk and simulation models almost always work with log returns, because they aggregate over time by adding; portfolio theory, on the other hand, uses simple returns, which aggregate across assets by averaging (see Going further).

### Exercises

- **1.1** *(basic, calculation)* You buy shares of a fund at €125 and a year later they are worth €110. Compute the simple return and the log return. What return does the fund need to get back to €125?
- **1.2** *(intermediate, calculation)* An asset earns +8%, −5% and +12% in three consecutive years. Compute the cumulative return and the constant annual return that would have produced the same result. Compare it with the arithmetic mean of the three figures.
- **1.3** *(intermediate, reflection)* A portfolio invests half in an asset that gains 30% and the other half in one that loses 10%. Why is the portfolio's return obtained by averaging the simple returns and not the log returns?

### Going further · Returns more rigorously

#### General definition: total return

In practice, an investment does not only change price: it can also pay dividends or coupons. If $P_t$ is the price at the end of period $t$ and $D_t$ the cash flow received during the period, the **total simple return** is

$$R_t = \frac{P_t + D_t - P_{t-1}}{P_{t-1}} = \frac{P_t + D_t}{P_{t-1}} - 1,$$

and the **log return** (or continuously compounded return) is $r_t = \ln(1 + R_t)$. Professional databases use «adjusted» prices that already incorporate dividends, splits and other corporate actions; computing returns with unadjusted prices is a classic source of errors.

#### Relationship between simple and log returns

The Taylor expansion of $\ln(1+x)$ around $x = 0$ gives

$$r = \ln(1+R) = R - \frac{R^2}{2} + \frac{R^3}{3} - \cdots$$

Two important consequences:

1. For small moves ($|R| \lesssim 5\%$) both measures are almost equal; the difference is of second order, $\approx R^2/2$.
2. Since $\ln(1+x) \le x$ for all $x > -1$, it always holds that $r \le R$, with equality only if $R = 0$.

In addition, the simple return is bounded below ($R \ge -1$: you cannot lose more than 100% without leverage or short positions), whereas the log return takes values on the whole real line ($r \to -\infty$ as $R \to -1$). That is why it is consistent to model $r$ with distributions defined on $\mathbb{R}$, such as the normal: if $r \sim \mathcal{N}(\mu, \sigma^2)$, then the price $P_t = P_{t-1}e^{r}$ follows a **lognormal** distribution and is never negative.

#### Aggregation over time and across assets

There is a very useful duality (Campbell, Lo and MacKinlay, 1997, ch. 1):

| | Simple return $R$ | Log return $r$ |
|---|---|---|
| Over time (one asset, $T$ periods) | it **multiplies**: $1 + R_{0,T} = \prod_{t=1}^{T}(1 + R_t)$ | it **adds**: $r_{0,T} = \sum_{t=1}^{T} r_t$ |
| Across assets (one portfolio, one period) | it **averages**: $R_p = \sum_i w_i R_i$ | it does not aggregate linearly: $r_p = \ln\!\big(\sum_i w_i e^{r_i}\big)$ |

That is why time-series models (volatility, simulation) usually work in logarithms, while portfolio theory (chapters 10 to 13) works with simple returns.

#### Arithmetic versus geometric mean

Given a series $R_1, \dots, R_T$, the **arithmetic mean** is $\bar{R} = \frac{1}{T}\sum_t R_t$ and the **geometric mean** is

$$G = \left(\prod_{t=1}^{T}(1+R_t)\right)^{1/T} - 1 = \exp\!\left(\frac{1}{T}\sum_t r_t\right) - 1.$$

By the inequality of arithmetic and geometric means, $G \le \bar{R}$, with equality only if all returns are equal. The geometric mean is the constant rate that would have produced the same final wealth; the arithmetic mean is an unbiased estimator of the expected return of *one* period. The difference between the two is, approximately, the volatility drag (chapter 9), and confusing them leads to overestimating final wealth. In the chapter's worked example, +25% and −20% have an arithmetic mean of +2.5% and a geometric mean of $\sqrt{1.25 \times 0.80} - 1 = 0\%$.

#### Annualization

With monthly returns, the equivalent annual return is $(1 + R_{\text{month}})^{12} - 1$, or $12\,r_{\text{month}}$ in logarithms. Multiplying a monthly simple return by 12 is only an approximation which, by Bernoulli's inequality $(1+x)^{n} \ge 1 + nx$, always falls below the compound result: with +1% a month, $12 \times 1\% = 12\%$ against $1.01^{12} - 1 = 12.68\%$.

#### Nominal, real and excess return

- **Real return** (net of inflation $\pi$), by the Fisher (1930) equation: $1 + R_{\text{real}} = \dfrac{1 + R_{\text{nom}}}{1 + \pi}$, approximately $R_{\text{real}} \approx R_{\text{nom}} - \pi$. With 5% nominal and 3% inflation, the exact real return is $1.05/1.03 - 1 = 1.94\%$.
- **Excess return**: $R_t - r_{f,t}$, the return above the risk-free asset; it is the quantity used by the Sharpe ratio (chapter 8) and the CAPM (chapter 13).

#### Leverage

If a fraction $L > 1$ of one's own capital is invested, financing the rest at a rate $r_b$, the return on equity is $R_e = L\,R - (L-1)\,r_b$. Leverage multiplies both the expected return and the volatility, and makes $R_e < -1$ possible, that is, losing more than the capital put in.

#### Empirical warnings

- **Survivorship bias**: if only companies or funds that exist today are studied, those that went bankrupt or closed are excluded and average returns are overestimated.
- **Frequency and noise**: high-frequency returns are contaminated by market microstructure (bid-ask spread, discrete prices), which introduces artificial negative autocorrelation.

---

## Chapter 2 · The time value of money

> **In this chapter** you will learn to compound and discount amounts, to tell simple interest from compound interest and to compare payments that arrive on different dates.

### The idea

Would you rather have €1,000 today or €1,000 in a year? Almost everyone chooses today, and rightly so: money available now can be deposited or invested and turn into somewhat more than €1,000 by the end of the year. Besides, inflation usually erodes what a fixed amount can buy. This preference has a name, the **time value of money**, and a price: the **interest rate**, which says how much money grows per unit of time.

When the interest received is reinvested and in turn earns new interest, we speak of **compound interest**. Going the other way, that is, finding out what amount today is equivalent to a future payment, is called **discounting**, and the result is the **present value** of that payment. Bringing all payments to the same date is what allows us to compare them and add them up.

### A worked example

You are offered a choice between €10,000 today and €11,000 in three years. You can place the money at 4% a year with no risk.

*Looking forward.* If you accept the €10,000 and invest it at 4% with interest reinvested, in three years you will have

$$10\,000 \times 1.04^3 = 11\,248.64 \text{ €},$$

more than the €11,000 of the other option.

*Looking back.* The future €11,000 is worth today

$$\frac{11\,000}{1.04^3} = 9\,778.96 \text{ €},$$

less than the €10,000 available now. Both ways of reasoning lead to the same conclusion: with a 4% rate, the immediate offer is better. If the rate were 3%, the present value of the €11,000 would be €10,066.56 and the decision would change. The interest rate is not a detail: it decides.

Notice also the difference between simple and compound interest. With simple interest, €10,000 at 4% would generate €400 a year, €1,200 in total. With compound interest you get €1,248.64: the €48.64 difference is interest earned on earlier interest. Over short horizons the difference is small; over decades, it dominates.

### Formalization

Let $VP$ be an amount available today, $i$ the annual interest rate and $T$ the number of years. With annual compounding, the future value is

$$VF = VP\,(1 + i)^T,$$

because each year the balance is multiplied by $1 + i$. Solving for it, the present value of an amount $VF$ to be received in $T$ years is

$$VP = \frac{VF}{(1 + i)^T}.$$

(We write $VP$ and $VF$, from the Spanish *valor presente* and *valor futuro*, for the present and future values.) The ratio $1/(1+i)^T$ is called the **discount factor**: it is the value today of one euro payable in $T$ years. With positive rates it is less than one, and it shrinks both when the horizon lengthens and when the rate rises.

If instead of a single payment there are several, $C_1, C_2, \dots, C_T$, at the end of each year, the present value of the whole is the sum of the present values of each payment:

$$VP = \sum_{t=1}^{T}\frac{C_t}{(1+i)^t}.$$

### Interactive chart

> **Interactive chart · Compounding and discounting.** Two sliders control the interest rate (from −1% to 10%) and the horizon (from 1 to 40 years). Left panel: growth of €1,000 with simple interest (a straight line) and with compound interest (a curve), with the difference shaded and labeled «interest on interest». Right panel: the discount factor as a function of maturity for the chosen rate, together with two fainter reference curves (the chosen rate ±2 points). What the reader should observe: compound interest pulls away from simple interest faster and faster, and a higher rate greatly reduces the present value of distant payments. With a negative rate, the discount factor exceeds one.

### In Python

```python
def valor_futuro(vp, i, t):
    return vp * (1 + i) ** t

def valor_presente(flujos, i):
    """flujos[0] is received in one year, flujos[1] in two, etc."""
    return sum(c / (1 + i) ** t for t, c in enumerate(flujos, start=1))

print(round(valor_futuro(10_000, 0.04, 3), 2))           # 11248.64
print(round(valor_presente([0, 0, 11_000], 0.04), 2))    # 9778.96
```

### In practice

- The price of a bond is the present value of the coupons and the face value it promises to pay. When market rates rise, that present value falls: that is why bond prices fall when rates rise.
- In the European Union, advertising and contracts for consumer loans must state the **annual percentage rate** (APR), which expresses the total cost of credit, fees included, as a single compound annual rate.
- European insurers discount the future payments they expect to make to their policyholders with a risk-free yield curve published by the European insurance supervisor (EIOPA), as required by the Solvency II regime.

### Exercises

- **2.1** *(basic, calculation)* You deposit €2,500 at 3% a year with interest reinvested for five years. How much will you have at the end? What part of the interest comes from compounding?
- **2.2** *(basic, calculation)* A prize of €20,000 will be paid in four years. How much is it worth today if the interest rate is 6%? And if it is 2%?
- **2.3** *(advanced, calculation)* You take out a loan of €15,000 to be repaid in five equal annual installments, at a rate of 5%. What is the installment? (Hint: the present value of the five installments must equal the amount borrowed; Going further gives a closed formula.)

### Going further · The time value of money more rigorously

#### Compounding frequency and continuous compounding

If a nominal annual rate $i$ is compounded $m$ times a year, the future value after $T$ years is

$$VF = VP\left(1 + \frac{i}{m}\right)^{mT}.$$

When $m \to \infty$, using $\lim_{m\to\infty}(1 + x/m)^m = e^x$, we obtain **continuous compounding**:

$$VF = VP\,e^{iT}, \qquad VP = VF\,e^{-iT}.$$

The equivalent **effective annual rate** is $(1 + i/m)^m - 1$. For $i = 5\%$: with annual compounding, 5.000%; monthly, 5.116%; continuous, $e^{0.05} - 1 = 5.127\%$. Continuous compounding is the standard convention in derivative pricing because it simplifies the calculations (discount factors multiply by adding exponents).

#### Present value of a stream of cash flows

For cash flows $C_1, \dots, C_T$ with a constant discount rate $i$:

$$VP = \sum_{t=1}^{T} \frac{C_t}{(1+i)^t}.$$

Using the sum of a geometric progression we get widely used closed formulas:

- **Level annuity** of $C$ for $T$ periods: $VP = C\,\dfrac{1 - (1+i)^{-T}}{i}$ (if $i = 0$, simply $VP = C\,T$). Example: €100 a year for 10 years at 5% is worth €772.17 today.
- **Perpetuity**: $VP = C/i$ (the limit $T \to \infty$, if $i > 0$).
- **Growing perpetuity** at a rate $g < i$: $VP = \dfrac{C_1}{i - g}$, the basis of Gordon's dividend model for valuing shares.

#### NPV and IRR

The **net present value** of a project with initial investment $I_0$ is $\text{NPV} = -I_0 + \sum_t C_t/(1+i)^t$; it is accepted if $\text{NPV} > 0$. The **internal rate of return** (IRR) is the rate $i^*$ that makes $\text{NPV} = 0$. With cash flows that change sign more than once, the IRR may not be unique (Descartes' rule of signs), which is why NPV is the theoretically preferred criterion.

#### Bonds: price, yield to maturity, duration and convexity

The price of a bond with coupon $c$, face value $N$ and maturity $T$, discounted at its **yield to maturity** $y$, is

$$P = \sum_{t=1}^{T} \frac{cN}{(1+y)^t} + \frac{N}{(1+y)^T}.$$

Price and yield move in opposite directions. The sensitivity is summarized by the **Macaulay duration** (1938) and the **modified duration**:

$$D = \frac{1}{P}\sum_{t=1}^{T} t\,\frac{C_t}{(1+y)^t}, \qquad D_{\text{mod}} = \frac{D}{1+y}, \qquad \frac{\Delta P}{P} \approx -D_{\text{mod}}\,\Delta y + \tfrac{1}{2}\,\mathcal{C}\,(\Delta y)^2,$$

where $\mathcal{C} = \frac{1}{P}\frac{\partial^2 P}{\partial y^2}$ is the **convexity**.

*Example.* A 3-year bond, 5% annual coupon, face value 100, $y = 4\%$: $P = 102.78$; $D = 2.86$ years; $D_{\text{mod}} = 2.75$; $\mathcal{C} \approx 10.4$. If the yield rises to 5%, the exact price becomes 100.00 (−2.70%); the duration-and-convexity approximation gives −2.70%, practically exact.

#### Term structure of interest rates

In general, each maturity has its own spot rate $z_t$ and its **discount factor** $d(t) = (1 + z_t)^{-t}$. The arbitrage-free price of any certain cash flow is $\sum_t C_t\,d(t)$; discounting everything at a single rate is a simplification. The yield curve is estimated from quoted bonds (for example, with the Nelson and Siegel, 1987, model).

#### Real rates and the rule of 72

- **Fisher equation**: $(1 + i_{\text{nom}}) = (1 + i_{\text{real}})(1 + \pi^e)$. Discount nominal cash flows with nominal rates, or real ones with real rates, but never mix them.
- **Doubling time**: $T_2 = \ln 2 / \ln(1+i) \approx 0.693/i$. The «rule of 72» ($T_2 \approx 72/(100\,i)$) corrects for the effect of discrete compounding at usual rates: at 6% it gives 12 years against the exact value of 11.9.

#### Historical note

Between June 2014 and July 2022, the ECB's deposit facility rate was negative (it reached −0.50%), although the main refinancing rate never went below 0%, and many German bonds traded at negative yields. With $i < 0$ the formulas remain valid: the factor $(1+i)^{-T}$ is greater than 1 and a future payment is worth *more* than the same amount today, which illustrates that the time value of money is a consequence of market rates, not a law of nature.

---

# Part II · The language of chance

Future prices are uncertain, so to reason about them we need the vocabulary of probability. This part brings together the four pieces that will be used in the rest of the book: mathematical expectation and the law of large numbers (chapter 3), the random walk and the way uncertainty grows with time (chapter 4), the normal distribution and the central limit theorem (chapter 5), and Monte Carlo simulation, the laboratory in which we can check all of the above with a computer (chapter 6).

---

## Chapter 3 · Expectation and the law of large numbers

> **In this chapter** you will learn to compute the expected value of an uncertain outcome, to interpret what it means (and what it does not) and to understand why a small edge becomes an almost certain result when it is repeated many times.

### The idea

An uncertain outcome, such as the gain from a bet or the payment of a contract, can take several values, each with a certain probability. Its **expected value**, or **expectation**, is the average of those values weighted by their probabilities. It is not the outcome we are going to get, which may be any of the possible ones, but the average outcome per attempt we would observe if we could repeat the situation a great many times under the same conditions.

That interpretation rests on the **law of large numbers**: when an experiment is repeated independently, the average of the outcomes gets closer and closer to the expected value. That is why a casino, a lottery or an insurer can plan with confidence even though each individual play or policy is unpredictable: they live off the average, not off the individual case.

### A worked example

A fair offers the following game: you roll two dice; if they add up to 7, you win €4; if not, you lose €1. Should you play?

Of the 36 equally likely combinations of two dice, six add up to 7, so the probability of winning is 1/6. The expected value of one play is

$$\tfrac16 \times (+4) + \tfrac56 \times (-1) = -\tfrac16 \approx -0.167 \text{ €}.$$

Each play costs the player, on average, almost 17 cents. That does not stop someone from winning for a while. After 10 plays, about 22% of players are ahead; after 100 plays, 15%; after 1,000 plays, only 0.25%. As plays accumulate, luck weighs less and less and the average, more and more. For the fair, which plays against thousands of people, the average loss of 1/6 of a euro per play is practically a guaranteed income.

### Formalization

Let $X$ be a random variable that takes the values $x_1, x_2, \dots, x_K$ with probabilities $p_1, p_2, \dots, p_K$, which add up to one. Its expected value is

$$E[X] = \sum_{k=1}^{K} p_k\,x_k.$$

A property we will use constantly is **linearity**: for constants $a$ and $b$ and any variables $X$ and $Y$, $E[aX + bY] = a\,E[X] + b\,E[Y]$. For example, the expected gain from 100 plays is 100 times that of one play.

The law of large numbers says that if $X_1, X_2, \dots$ are independent repetitions of $X$, the average $\bar X_n = (X_1 + \cdots + X_n)/n$ converges to $E[X]$ as $n$ grows. Going further makes precise in what sense and how fast.

### Interactive chart

> **Interactive chart · The two-dice game.** A slider sets the number of plays (from 1 to 5,000) and a button runs the simulation again. Left panel: the cumulative gain of 50 simulated players, each with its own line, and in a thick stroke the line of the expected loss, $-n/6$; a counter shows what percentage of players are ahead. Right panel: the average gain per play of a single player along the sequence, which swings a lot at first and settles near −€0.167, inside a band that narrows. What the reader should observe: at first the spread between players dominates; in the long run, the average rules. A selector lets you change the prize (for example, to €5 or €6) to see how the game becomes neutral or favorable.

### In Python

```python
import numpy as np

valores = np.array([4.0, -1.0])
probs = np.array([1 / 6, 5 / 6])
esperanza = valores @ probs                      # -0.1667

rng = np.random.default_rng(3)
dados = rng.integers(1, 7, size=(100_000, 2)).sum(axis=1)
ganancias = np.where(dados == 7, 4.0, -1.0)
print(esperanza, ganancias.mean())               # the simulated mean approaches -1/6
```

### In practice

- An insurer starts from the expected loss of each policy (probability of a claim times average cost) and adds a loading to cover expenses, profit and the possibility that the year turns out worse than average.
- Commercial games of chance are designed so that the player's expected value is negative; that difference is the operator's margin, and the law of large numbers turns it into a stable income.
- In derivative pricing, the price of a contract is written as a discounted expected value of its payments, although computed with special probabilities, called risk-neutral, which Going further explains.

### Exercises

- **3.1** *(basic, calculation)* A raffle sells 2,000 tickets at €3 each and awards one prize of €1,500 and ten of €100. What is the expected value of the prize of one ticket? And the buyer's expected net gain? How much does the organizer take in?
- **3.2** *(intermediate, calculation)* The probability of your bicycle being stolen in a year is 4% and replacing it costs €900. Compute the expected loss. If an annual insurance policy costs €45, what loading does the insurer apply over the expected loss? Why might it be reasonable to buy it anyway?
- **3.3** *(advanced, reflection)* You are offered a game with a fair coin: if it comes up heads, your wealth is multiplied by 2.2; if tails, you lose everything. The expected value is positive. Would you bet all your wealth once? And ten times in a row? What does this tell you about the limits of expected value as a decision criterion?

### Going further · Expected value more rigorously

#### Formal definition

For a discrete random variable with values $x_k$ and probabilities $p_k$, $E[X] = \sum_k p_k x_k$, provided the series converges absolutely. For a continuous variable with density $f$, $E[X] = \int_{-\infty}^{\infty} x\,f(x)\,dx$. In Kolmogorov's (1933) axioms, the expectation is the Lebesgue integral of $X$ with respect to the probability measure.

#### Fundamental properties

1. **Linearity**: $E[aX + bY] = aE[X] + bE[Y]$, *without* any need for independence. It is the reason why a portfolio's expected return is the weighted average of the expected returns (chapter 12).
2. **Product**: $E[XY] = E[X]E[Y]$ only if $X$ and $Y$ are uncorrelated (in particular, if they are independent). In general $E[XY] = E[X]E[Y] + \operatorname{Cov}(X,Y)$.
3. **Jensen's inequality** (1906): if $g$ is convex, $E[g(X)] \ge g(E[X])$; if it is concave, the reverse. With $g = \ln$ (concave): $E[\ln(1+R)] \le \ln(1 + E[R])$, that is, the expected log return is less than the logarithm of the expected return. This is the mathematical foundation of the volatility drag (chapter 9) and of the Kelly criterion (chapter 14).
4. **Conditional expectation and the law of total expectation**: $E[X] = E\big[E[X \mid Y]\big]$. A process $(X_t)$ is a **martingale** if $E[X_{t+1} \mid \mathcal{F}_t] = X_t$: the best forecast of the future value is the current value. It is the mathematical model of a fair game and of an «unpredictable» price.

#### Laws of large numbers

Let $X_1, X_2, \dots$ be independent and identically distributed with mean $\mu$, and $\bar{X}_n = \frac1n \sum_{i=1}^n X_i$.

- **Weak law** (Jakob Bernoulli, 1713, for the binary case): for every $\varepsilon > 0$, $P(|\bar{X}_n - \mu| > \varepsilon) \to 0$. If in addition the variance $\sigma^2$ is finite, Chebyshev's inequality gives an explicit bound: $P(|\bar{X}_n - \mu| > \varepsilon) \le \dfrac{\sigma^2}{n\varepsilon^2}$.
- **Strong law** (Kolmogorov): $\bar{X}_n \to \mu$ almost surely, with $E|X| < \infty$ being enough.

The assumption of a finite mean is essential: for a Cauchy distribution the sample mean of $n$ observations has the *same* distribution as a single observation and never converges.

*Example: why the casino does not lose.* In European roulette there are 37 slots, 18 of them red, so a €1 bet on red has an expected value of $18/37 - 19/37 = -1/37$ € for the player. Over a million such bets, the casino's expected gain is $10^6/37 \approx 27\,027$ €. The variance of one bet is $1 - (1/37)^2 \approx 0.9993$, so the standard deviation of the total is $\sqrt{10^6 \times 0.9993} \approx 1\,000$ €. The expected profit is about 27 standard deviations away from zero: the probability that the casino loses is negligible. In American roulette, with a double zero, the house edge rises to $2/38 = 5.26\%$.

#### Limits of expected value: the St. Petersburg paradox

A coin is tossed until it comes up heads; if that happens on toss $k$, $2^k$ € are paid. The expected value is $\sum_{k\ge1} 2^{-k}\,2^k = \infty$, and yet nobody would pay a large sum to play. Daniel Bernoulli (1738) proposed evaluating bets by their **expected utility** $E[u(W)]$ with a concave utility such as $u(W) = \ln W$: with it the game has a finite value. This idea, formalized by von Neumann and Morgenstern (1944), underpins the modern theory of decision under risk and explains risk aversion: an investor with concave utility prefers a certain outcome to a lottery with the same expected value.

#### Pricing by expectation: risk-neutral probabilities

In finance, the price of a derivative is *not* the discounted expectation of its payoff under the real probabilities $P$, but under a **risk-neutral** measure $Q$:

$$V_0 = e^{-rT}\,E^{Q}[\text{payoff}_T].$$

The fundamental theorem of asset pricing (Harrison and Kreps, 1979; Harrison and Pliska, 1981) establishes that the absence of arbitrage is equivalent to the existence of such a measure $Q$, under which discounted prices are martingales. The equivalence is exact with a finite number of states and dates; in general discrete time it was proved by Dalang, Morton and Willinger (1990), and in continuous time a somewhat stronger condition is needed, «no free lunch with vanishing risk» (NFLVR; Delbaen and Schachermayer, 1994). The measure $Q$ is unique only if the market is complete. Supplementary topic C shows the simplest case, the binomial tree. When the «In practice» section says that the price of a derivative is a discounted expected value, it should be understood in this sense.

#### Insurance

An insurer sets the premium as $\text{premium} = (1 + \theta)\,E[\text{claims}]$, where $\theta > 0$ is the safety loading. With many independent policies, the law of large numbers makes the aggregate result approach the expected one; the residual risk comes mainly from **correlated** claims (catastrophes), which diversification does not remove (see chapter 11).

---

## Chapter 4 · Random walks and the square root of time

> **In this chapter** you will learn to model a price as a sum of random steps, to tell the underlying trend from the noise and to compute how uncertainty grows with the time horizon.

### The idea

Imagine a price that every day goes up or down by an amount decided by tossing a coin. That construction, a **random walk**, is the simplest model of how a price evolves, and yet it reproduces something that surprises almost everyone: charts generated by pure chance show streaks, «trends» and «support levels» that seem meaningful and are not. Each possible **path** is a different story written by the same coin.

If the coin is slightly biased, the walk has a **drift**: an average tendency per step. In the short run the drift is hidden by the noise; in the long run it ends up prevailing. Understanding why requires a second idea, perhaps the most useful in this part of the book: the spread of a random walk does not grow in proportion to time, but in proportion to its **square root**. If the horizon is quadrupled, the uncertainty only doubles. The reason is that, when the steps are **independent** of each other, ups and downs partly cancel out.

### A worked example

A price starts at €20 and each day goes up or down by €1, with equal probability. Where can it be after six days?

There are $2^6 = 64$ equally likely sequences of ups and downs. If there are $k$ ups and $6-k$ downs, the final price is $20 + k - (6-k) = 14 + 2k$. Counting how many sequences have each number of ups (they are the binomial coefficients $\binom{6}{k}$):

| Ups | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| Final price (€) | 14 | 16 | 18 | 20 | 22 | 24 | 26 |
| Sequences | 1 | 6 | 15 | 20 | 15 | 6 | 1 |
| Probability | 1.6% | 9.4% | 23.4% | 31.3% | 23.4% | 9.4% | 1.6% |

The most likely outcome is to return to €20, but it happens only 31.3% of the time. The extremes are possible, though rare.

How far does the price usually move away from its starting point? Each step has a standard deviation of €1, and the standard deviation after $n$ steps is $\sqrt{n}$ euros: €4 after 16 days, €8 after 64 days and €16 after 256 days. Multiplying the horizon by 16 only multiplies the spread by 4.

The same rule applies to returns. If a share has a daily volatility of 1.2% and its daily returns are independent, its weekly volatility (5 sessions) is $1.2\% \times \sqrt{5} = 2.68\%$; its monthly volatility (21 sessions), $1.2\% \times \sqrt{21} = 5.50\%$, and its annual volatility (252 sessions), $1.2\% \times \sqrt{252} = 19.05\%$.

### Formalization

Let $S_0$ be the initial value and $X_1, X_2, \dots$ the steps, independent and with the same distribution, with mean $\mu$ and standard deviation $\sigma$. The random walk is

$$S_n = S_0 + X_1 + X_2 + \cdots + X_n.$$

By the linearity of expectation (chapter 3), its expected value moves forward by the drift at each step:

$$E[S_n] = S_0 + n\,\mu.$$

To measure the spread we use the **variance**, the average squared distance from the mean, $\operatorname{Var}(X) = E\big[(X - E[X])^2\big]$, and its square root, the **standard deviation** $\sigma$, which has the same units as $X$. When the steps are independent, the variance of the sum is the sum of the variances:

$$\operatorname{Var}(S_n - S_0) = n\,\sigma^2 \qquad\Longrightarrow\qquad \sigma_n = \sigma\sqrt{n}.$$

This is the **square-root-of-time rule** (also called the square-root rule). Comparing the two formulas explains the tug of war between trend and noise: the accumulated drift grows like $n$ and the noise like $\sqrt{n}$, so their ratio, $\sqrt{n}\,\mu/\sigma$, grows in absolute value with the horizon. In the short run noise rules; in the long run, drift.

### Interactive chart

> **Interactive chart · The fan of chance.** Controls: probability of an up move (from 0.40 to 0.60), number of steps (up to 1,000) and number of paths (from 1 to 500). Left panel: the simulated paths, with the drift line $S_0 + n\mu$ and the ±1 and ±2 standard deviation bands, $\pm\sigma\sqrt{n}$ and $\pm2\sigma\sqrt{n}$, which open like a fan. With a single path, the reader will see streaks that look like trends. Right panel: the standard deviation observed across paths as a function of $n$, on log axes, together with a line of slope 1/2. What the reader should observe: the cloud of paths widens more and more slowly, and the points in the right panel line up with slope 1/2, the signature of the square root of time.

### In Python

```python
import numpy as np

rng = np.random.default_rng(11)
pasos = rng.choice([-1, 1], size=(2_000, 256))      # 2,000 paths of 256 steps
trayectorias = 20 + pasos.cumsum(axis=1)

for n in (16, 64, 256):
    dispersion = trayectorias[:, n - 1].std()
    print(n, round(dispersion, 2), np.sqrt(n))       # the spread resembles the square root of n
```

### In practice

- The classic option pricing models assume that the logarithm of the price follows a random walk with drift in continuous time, geometric Brownian motion.
- Risk departments turn daily volatilities into weekly, monthly or annual ones by multiplying by the square root of the number of sessions. For years banking regulation allowed going from one-day risk to ten-day risk this way, and Going further discusses when that conversion is misleading.
- Since the middle of the twentieth century, testing whether real prices behave like a random walk has been one of the central lines of research in financial economics.

### Exercises

- **4.1** *(basic, calculation)* In the walk of the worked example, suppose the probability of an up move is 0.6 and five days are observed. What is the expected price at the end? What is the probability of ending above €20?
- **4.2** *(basic, calculation)* A share has an annual volatility of 25%. Assuming independent daily returns and 252 sessions a year, what is its monthly volatility (21 sessions) and its daily volatility?
- **4.3** *(intermediate, calculation)* A strategy earns 0.05% a day on average with a daily standard deviation of 1%. How many sessions are needed for the cumulative expected gain to equal one standard deviation of the cumulative result? Assuming normality, what is the probability that, after that number of sessions, the cumulative result is negative?
- **4.4** *(advanced, reflection)* In a walk simulated with a fair coin, an analyst notices that over the last 300 days the price has spent more than 95% of the time above its initial level and concludes that «it has an upward trend». Is this as rare a result as it seems? (Hint: look up the arcsine law in Going further.)

### Going further · The random walk and the square-root rule more rigorously

#### Definition and moments

Let $X_1, X_2, \dots$ be independent variables with $P(X_i = +1) = p$ and $P(X_i = -1) = q = 1 - p$. The **simple random walk** is $S_n = S_0 + \sum_{i=1}^n X_i$. Since $E[X_i] = p - q = 2p - 1$ and $\operatorname{Var}(X_i) = 1 - (2p-1)^2 = 4pq$,

$$E[S_n] = S_0 + n(2p - 1), \qquad \operatorname{Var}(S_n) = 4npq.$$

If $k$ is the number of up steps, $k \sim \text{Binomial}(n, p)$ and $S_n = S_0 + 2k - n$, so that

$$P(S_n = S_0 + 2k - n) = \binom{n}{k} p^k q^{\,n-k}.$$

With $n = 6$ and $p = 1/2$ we get the probabilities $1, 6, 15, 20, 15, 6, 1$ out of 64 of the chapter's worked example. The walk is symmetric if $p = 1/2$; then $(S_n)$ is a martingale.

#### Classic results

- **Recurrence** (Pólya, 1921): the symmetric walk in one or two dimensions returns to its origin with probability 1; in three or more dimensions, it does not. However, in one dimension the expected return time is infinite.
- **Gambler's ruin**: starting from $i$ with absorbing barriers at 0 and $a$, the probability of reaching $a$ before 0 is
$$P_i = \begin{cases} i/a, & p = 1/2,\\[4pt] \dfrac{1 - (q/p)^i}{1 - (q/p)^a}, & p \neq 1/2. \end{cases}$$
*Example:* with 10 chips, betting on red ($p = 18/37$) until reaching 20 or going broke, the probability of success is only 36.8%, against 50% in a fair game. A small edge against you, repeated, weighs a lot.
- **Arcsine law** (Lévy; Feller, 1968, ch. III): in a long symmetric walk, the fraction of time $F$ spent above the origin has, in the limit, density $\frac{1}{\pi\sqrt{x(1-x)}}$ on $(0,1)$ and distribution function $P(F \le x) = \frac{2}{\pi}\arcsin\sqrt{x}$. Its U shape means that the *typical* case is to spend almost all the time on one side: $P(F < 0.1) + P(F > 0.9) = \frac{4}{\pi}\arcsin\sqrt{0.1} \approx 41\%$. Likewise, $P(F > 0.95) = 1 - \frac{2}{\pi}\arcsin\sqrt{0.95} \approx 14\%$, the figure used in the solution to exercise 4.4. That is why long «trends» prove nothing.

#### From the random walk to Brownian motion

If the steps are rescaled (size $\sigma\sqrt{\Delta t}$ every $\Delta t$) and $\Delta t \to 0$, the walk converges in distribution to a **Brownian motion** $W_t$ (Donsker's theorem): a continuous process with independent increments and $W_t - W_s \sim \mathcal{N}(0, t-s)$. For prices the **multiplicative** walk on logarithms is used, whose limit is **geometric Brownian motion**:

$$dS_t = \mu S_t\,dt + \sigma S_t\,dW_t \quad\Longrightarrow\quad S_t = S_0 \exp\!\Big(\big(\mu - \tfrac{1}{2}\sigma^2\big)t + \sigma W_t\Big),$$

the base model of Black and Scholes (1973). The term $-\frac12\sigma^2$ is, once again, the volatility drag (chapter 9) and arises from Itô's lemma.

#### History and the efficient market hypothesis

Louis Bachelier (1900) was the first to model prices on the Paris Bourse as a random walk, five years before Einstein's work on Brownian motion. Karl Pearson coined the term *random walk* in a letter to *Nature* (1905). Samuelson (1965) showed that «properly anticipated» prices fluctuate like a martingale, and Fama (1970) systematized the **efficient market hypothesis**: if prices incorporate all available information, their future changes are unpredictable with that information.

Campbell, Lo and MacKinlay (1997, ch. 2) distinguish three hypotheses of decreasing strength: **RW1**, i.i.d. increments (a random walk in the strict sense); **RW2**, independent but not necessarily identical increments (allowing changing volatility), and **RW3**, merely uncorrelated increments. The **martingale** hypothesis (changes unpredictable in mean) lies between RW2 and RW3: it implies uncorrelatedness, but not independence. Lo and MacKinlay (1988) proposed the **variance ratio test**,

$$VR(q) = \frac{\operatorname{Var}\big(r_t + r_{t-1} + \cdots + r_{t-q+1}\big)}{q\,\operatorname{Var}(r_t)},$$

which equals 1 under the random walk (by the square-root rule studied below). With weekly US data from 1962 to 1985 they found $VR(q) > 1$ significantly, above all in portfolios of small firms, and rejected the strict random walk. Modern evidence (Cont, 2001) indicates that returns are practically uncorrelated beyond a few minutes, but are **not** independent: their absolute values and their squares are autocorrelated (volatility clustering), a fact the i.i.d. random walk does not capture.

#### The variance of a sum (Bienaymé's formula)

For any variables with finite variance,

$$\operatorname{Var}\!\left(\sum_{i=1}^n X_i\right) = \sum_{i=1}^n \operatorname{Var}(X_i) + 2\sum_{i<j}\operatorname{Cov}(X_i, X_j).$$

If the $X_i$ are **uncorrelated** (independence is not needed) and have the same variance $\sigma^2$, the cross terms vanish and $\operatorname{Var}(S_n) = n\sigma^2$, hence $\sigma_n = \sigma\sqrt{n}$. That is exactly the assumption the square-root rule needs.

#### What happens with autocorrelation

If one-period returns have autocorrelations $\rho_k = \operatorname{Corr}(r_t, r_{t-k})$, the variance of the sum over $q$ periods is

$$\operatorname{Var}\!\left(\sum_{t=1}^{q} r_t\right) = q\,\sigma^2\left[1 + 2\sum_{k=1}^{q-1}\left(1 - \frac{k}{q}\right)\rho_k\right].$$

With positive autocorrelation (trends, «smoothed» prices like those of real estate or private equity), the square-root rule **underestimates** long-term risk; with negative autocorrelation (mean reversion) it overestimates it. *Example:* with $\rho_1 = 0.1$ and the rest zero, for $q = 10$ the bracket equals $1 + 2 \times 0.9 \times 0.1 = 1.18$ and the 10-day standard deviation is 8.6% higher than $\sigma\sqrt{10}$. This ratio is precisely Lo and MacKinlay's $VR(q)$ seen above.

#### Mean versus spread: the time horizon

The mean grows linearly with the horizon ($\mu T$) and the standard deviation with its square root ($\sigma\sqrt{T}$). Under a normal model for log returns, the probability of ending with a loss after $T$ years is

$$P(\text{loss}) = \Phi\!\left(-\frac{\mu}{\sigma}\sqrt{T}\right).$$

With $\mu = 8\%$ and $\sigma = 16\%$: 30.9% at 1 year, 5.7% at 10 years and 0.3% at 30 years. But this does **not** imply that risk disappears with time: the *size* of the possible losses keeps growing with $\sqrt{T}$. Samuelson (1963) showed that repeating a bet one would not accept once does not make it acceptable merely by repeating it (the «fallacy of large numbers»), a debate known as *time diversification*.

#### Scaling in regulation and its limits

The 1996 Basel amendment on market risk allowed the 10-day VaR to be obtained by multiplying the daily VaR by $\sqrt{10}$. This scaling is correct only for i.i.d. normal returns with zero mean. With fat tails and volatility clustering (chapters 7 and 15) the scaling of extreme *quantiles* can be quite different: Danielsson and Zigrand (2006) show that the square-root rule can underestimate risk over long horizons when there are jumps. Even so, the revised market risk framework (FRTB, chapter 16) still uses this scaling to go from the base 10-day horizon to the **liquidity horizons** (from 10 to 120 days) of each risk factor.

#### Generalization: the Hurst exponent

In general, if $\sigma_T \propto T^{H}$, the exponent $H$ summarizes the memory of the process: $H = 1/2$ for a random walk, $H > 1/2$ for persistent processes and $H < 1/2$ for anti-persistent ones. Mandelbrot and Van Ness (1968) introduced **fractional Brownian motion** to model $H \neq 1/2$. The evidence on stock returns is, in general, compatible with $H \approx 1/2$. For volatility, long memory ($H > 1/2$) was discussed for years; since Gatheral, Jaisson and Rosenbaum (2018) the dominant view is that of **rough volatility**: the logarithm of volatility behaves like a fractional Brownian motion with $H \approx 0.1$, much more irregular than a random walk, and the appearance of long memory may be an effect of that roughness. The classic estimators of $H$ (such as Hurst's R/S) are biased in finite samples and should be interpreted with caution.

#### A note on estimators

The unbiased sample variance divides by $n - 1$ (Bessel's correction), $s^2 = \frac{1}{n-1}\sum_i (x_i - \bar{x})^2$, because estimating the mean with the same data uses up one degree of freedom. Even so, $s$ (the square root) is a slightly biased estimator of $\sigma$; the difference is irrelevant with long samples.

---

## Chapter 5 · The normal distribution and the central limit theorem

> **In this chapter** you will learn why the bell curve appears in so many contexts, to compute probabilities with it and to recognize the conditions under which it stops being a good model.

### The idea

Roll a die: all the outcomes from 1 to 6 are equally likely, and the histogram is flat. Roll two and add them: 7 is the most frequent outcome and the extremes (2 and 12) are rare, so the histogram has the shape of a roof. Roll ten and add them: the histogram already has an almost perfect bell shape. It does not matter that each die has a flat distribution: the sum of many small, independent random effects tends to the same shape, the **normal distribution** or **Gaussian bell curve**. This result is the **central limit theorem**, and it explains why the normal appears in measurement errors, in people's heights and, as a first approximation, in returns accumulated over many days.

The normal is described by two numbers: its mean, which marks the center, and its standard deviation, which marks the width. Most of the probability is concentrated near the mean and drops very quickly further away: the **tails**, the regions of extreme values, are thin.

### A worked example

Suppose the monthly return of an index follows a normal with mean 0.7% and standard deviation 4.5%. How often should we expect a month worse than −5%?

The first step is to **standardize**: measure the distance from the mean in standard deviations,

$$z = \frac{-5 - 0.7}{4.5} = -1.27.$$

The standard normal table (or the computer) gives $P(Z < -1.27) \approx 10.3\%$: roughly one month in ten. And what interval contains 95% of the months? For a normal, the central 95% of the probability lies within 1.96 standard deviations of the mean, so the interval runs from $0.7 - 1.96 \times 4.5 = -8.1\%$ to $0.7 + 1.96 \times 4.5 = 9.5\%$.

Three reference points are worth memorizing: in a normal, about 68% of values lie within one standard deviation of the mean, 95% within two and 99.7% within three.

### Formalization

A variable $X$ follows a normal distribution with mean $\mu$ and standard deviation $\sigma$, written $X \sim \mathcal{N}(\mu, \sigma^2)$, if its density is

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}}\exp\!\left(-\frac{(x-\mu)^2}{2\sigma^2}\right).$$

The density does not give probabilities directly: the probability that $X$ falls in an interval is the area under the curve over that interval. If we standardize, $Z = (X - \mu)/\sigma$ follows a standard normal, with mean 0 and standard deviation 1, whose distribution function $\Phi(z) = P(Z \le z)$ is tabulated:

$$P(X \le x) = \Phi\!\left(\frac{x - \mu}{\sigma}\right).$$

The central limit theorem, in its simplest version, states that if $X_1, \dots, X_n$ are independent, with the same distribution, mean $\mu$ and finite variance $\sigma^2$, the standardized sum

$$\frac{X_1 + \cdots + X_n - n\mu}{\sigma\sqrt{n}}$$

looks more and more like a standard normal as $n$ grows, whatever the starting distribution. Notice that the scale $\sigma\sqrt{n}$ is that of the square-root-of-time rule from chapter 4.

### Interactive chart

> **Interactive chart · A bell is born.** Left panel: an animated Galton board, with a slider for the number of rows of pegs (from 4 to 20, 10 by default); the balls fall, bounce left or right with probability 1/2 and pile up in bins, while the corresponding normal curve is drawn on top. Right panel: the histogram of the sum of $k$ dice, with $k$ chosen by the reader between 1 and 30, and the normal with the same mean and variance overlaid. A third control lets you replace the dice with a very skewed distribution (for example, a rare, large prize) to check that convergence happens but is slower. What the reader should observe: with few terms the shape depends on the starting distribution; with many, they all end up looking like bells.

### In Python

```python
from statistics import NormalDist

mensual = NormalDist(mu=0.7, sigma=4.5)
print(mensual.cdf(-5))                       # probability of a month worse than -5 %: 0.103
print(mensual.inv_cdf(0.025), mensual.inv_cdf(0.975))   # central 95 % interval

z = NormalDist()
for k in (1, 2, 3):
    print(k, z.cdf(k) - z.cdf(-k))           # 0.683, 0.954, 0.997
```

### In practice

- Many first-generation risk models assume normal returns, because under that assumption the means, volatilities and correlations are enough to describe all the risk of a portfolio.
- Statistical quality control, surveys and the confidence intervals of any estimate use the normal through the central limit theorem; in finance, that includes the error of Monte Carlo simulations (chapter 6).
- Risk managers use the normal as a yardstick to judge how unusual a move is («a four-standard-deviation fall»), knowing that in real markets extremes are much more frequent than the normal predicts (chapter 15).

### Exercises

- **5.1** *(basic, calculation)* The annual return of a portfolio follows a normal with mean 6% and standard deviation 15%. What proportion of years should we expect to have a negative return?
- **5.2** *(intermediate, calculation)* With the same portfolio, compute the probability of a year worse than −15% and the interval centered on the mean that contains 95% of the years.
- **5.3** *(intermediate, calculation)* You roll 12 dice and add up the results. Use the central limit theorem to approximate the probability that the sum is 50 or more. (A die has mean 3.5 and variance 35/12.)
- **5.4** *(advanced, reflection)* A colleague says: «Since the central limit theorem guarantees normality, the normal model is adequate for measuring the risk of loss over a single day». What objections would you raise?

### Going further · The normal distribution more rigorously

#### The central limit theorem

**Theorem (Lindeberg–Lévy).** Let $X_1, X_2, \dots$ be i.i.d. with mean $\mu$ and variance $0 < \sigma^2 < \infty$. Then

$$\frac{\sqrt{n}\,(\bar{X}_n - \mu)}{\sigma} \xrightarrow{\;d\;} \mathcal{N}(0, 1).$$

Lindeberg's (1922) version allows non-identical variables provided none of them dominates the sum. The speed of convergence is bounded by the **Berry–Esseen theorem** (Berry, 1941; Esseen, 1942): if $\rho = E|X - \mu|^3 < \infty$,

$$\sup_x \big|F_n(x) - \Phi(x)\big| \le \frac{C\,\rho}{\sigma^3\sqrt{n}},$$

with a constant $C < 0.48$ (Shevtsova, 2011). Very skewed or fat-tailed distributions converge more slowly.

**History.** De Moivre (1733) obtained the normal curve as the limit of the binomial, Laplace generalized it (1812) and Gauss (1809) used it as the law of measurement errors. The pegboard in the interactive chart is the **Galton board** (1889): with 10 rows, the final bin of each ball follows a binomial $\text{Bin}(10, 1/2)$, which the De Moivre–Laplace theorem approximates by $\mathcal{N}(5;\ 2.5)$.

#### Properties of the normal distribution

- It is determined by two parameters, $\mu$ and $\sigma^2$; its skewness is 0 and its kurtosis 3 (chapter 15).
- It is **stable**: the sum of independent normals is normal, $\mathcal{N}(\mu_1, \sigma_1^2) + \mathcal{N}(\mu_2, \sigma_2^2) = \mathcal{N}(\mu_1 + \mu_2, \sigma_1^2 + \sigma_2^2)$.
- **Standardization**: if $X \sim \mathcal{N}(\mu, \sigma^2)$, $Z = (X - \mu)/\sigma \sim \mathcal{N}(0,1)$, with distribution function $\Phi$. Useful quantiles: $\Phi^{-1}(0.95) = 1.645$; $\Phi^{-1}(0.975) = 1.960$; $\Phi^{-1}(0.99) = 2.326$; $\Phi^{-1}(0.995) = 2.576$.
- In the **multivariate normal**, the covariance matrix fully describes the dependence: uncorrelatedness is equivalent to independence. Outside the normal this is no longer true (chapter 10).

#### The lognormal distribution

If log returns are normal, $\ln(S_T/S_0) \sim \mathcal{N}(m, s^2)$, the price is lognormal with

$$E[S_T] = S_0\,e^{m + s^2/2}, \qquad \text{median}(S_T) = S_0\,e^{m}.$$

The mean exceeds the median: the distribution of future wealth is skewed to the right, and a typical (median) investor gets less than the mean. This distinction reappears in chapters 6, 9 and 14.

#### When the bell fails

The CLT requires finite variance and weak dependence. If the variance is infinite, the classical CLT no longer applies. When the tails decay as a power law with index $\alpha < 2$, the sums, normalized differently, converge to a non-Gaussian **Lévy stable distribution**, but this is not a universal result: there are even infinite-variance distributions whose sums tend to the normal with a different normalization; Mandelbrot (1963) proposed this model for cotton prices. Most studies find in daily returns power-law tails with a tail index $\alpha$ between 2 and 5, with typical values close to 3 for stocks and indices (the «inverse cubic law»: Gopikrishnan *et al.*, 1999; Cont, 2001; see chapter 15), compatible with finite variance, although a finite sample cannot fully prove it, so that:

- At short horizons (daily or intraday) the normal greatly underestimates extremes: a move of more than $4\sigma$ (in either direction) should occur with probability $6.3 \times 10^{-5}$, about 1.6 times every hundred trading years, and it is observed much more often.
- At long horizons (monthly, annual) the distribution gets closer to the normal, the phenomenon called **aggregational Gaussianity** (Cont, 2001), although convergence is slow because of volatility dependence.

That is why the answers to exercises 5.1 and 5.2 (34.5% of negative years and 8.1% of years worse than −15%) are reliable only if annual returns really are normal; for probabilities of extreme events, the normal assumption usually falls short.

---


## Chapter 6 · Simulating to understand: the Monte Carlo method

> **In this chapter** you will learn to answer probability questions by generating thousands of scenarios on the computer, to measure the precision of those answers and to recognize what depends on the model's assumptions.

### The idea

Many financial questions have no simple formula: what is the probability that a savings plan reaches its goal? How much is a contract worth whose payment depends on the whole path of a price? What is the loss that is exceeded only once every hundred years? **Monte Carlo simulation** tackles them by brute force: chance is described with a model, the computer generates thousands of possible scenarios and we count what happens in them. The frequency with which something happens estimates its probability, and the average of an outcome estimates its expected value, thanks to the law of large numbers of chapter 3.

A classic example shows the logic. If points are thrown at random onto a square of side 1, the proportion that falls inside the quarter circle of radius 1 approaches its area, $\pi/4$. Multiplying that proportion by four gives an estimate of $\pi$ without doing any geometric calculation. With 10,000 points, one run gives 3.156; it is not exact, but the method lets us know how wrong it can be.

Two ideas always come with a simulation. The first, the **standard error**: every Monte Carlo estimate has a random error, which shrinks with the square root of the number of scenarios. The second, the **seed**: the computer's «random» numbers come from an algorithm, and fixing its starting point lets us repeat exactly the same experiment.

### A worked example

You invest €10,000 for 20 years. Suppose that each year's log return is independent and normal, with mean 5% and standard deviation 15%. What final wealth should you expect, and what is the probability of ending up with less than you invested?

For each of 10,000 scenarios, the simulation generates twenty annual returns, adds them up (log returns add, chapter 1) and computes final wealth. With seed 2024, the results are:

| Measure | Simulation | Theoretical value |
|---|---|---|
| Median final wealth | €27,302 | €27,183 |
| 10th percentile | €11,433 | €11,506 |
| 90th percentile | €63,755 | €64,218 |
| Probability of ending below €10,000 | 7.01% ± 0.26% | 6.80% |

Half of the scenarios end below the median, and one in ten below the 10th **percentile**. In this particular example there is an exact solution (the right-hand column, computed in Going further), and it serves to check that the simulation works: the differences are of the order of the standard error. The usefulness of the method appears when the model gets more complicated, for example with periodic contributions, fees, fat tails or withdrawal rules, and the formula ceases to exist while the simulation keeps working just the same.

### Formalization

To estimate the expected value $\theta = E[Y]$ of an outcome $Y$, $M$ independent scenarios $Y_1, \dots, Y_M$ are generated and averaged:

$$\hat\theta = \frac{1}{M}\sum_{m=1}^{M} Y_m.$$

If $s$ is the standard deviation of the $Y_m$, the standard error of the estimate is

$$\text{SE} = \frac{s}{\sqrt{M}},$$

and, by the central limit theorem (chapter 5), the interval $\hat\theta \pm 1.96\,\text{SE}$ contains the true value with a probability of about 95%. To estimate a probability $p$, $Y_m$ equals 1 if the event occurs and 0 if not, and the standard error is $\sqrt{\hat p(1-\hat p)/M}$. Halving the error requires quadrupling the number of scenarios.

### Interactive chart

> **Interactive chart · A laboratory of futures.** Top panel: estimating $\pi$ with points that keep appearing on the square (inside the circle in one color, outside in another) and, alongside, the running estimate with its ±2 standard error band, which narrows like $1/\sqrt{M}$. Bottom panel: the savings plan of the example, with sliders for the mean return, the volatility, the horizon and the number of scenarios; 200 wealth paths are drawn in gray, the median and the 10th and 90th percentiles in color, and a side histogram of final wealth with the probability of loss. A «new seed» button shows which figures change from one run to another and by how much. What the reader should observe: the estimates fluctuate less the more scenarios are used, but they never stop depending on the assumptions that were put in.

### In Python

```python
import numpy as np

rng = np.random.default_rng(2024)                 # fixed seed: reproducible results
log_r = rng.normal(0.05, 0.15, size=(10_000, 20)) # 10,000 scenarios of 20 years
final = 10_000 * np.exp(log_r.sum(axis=1))

p10, p50, p90 = np.percentile(final, [10, 50, 90])
prob_perder = np.mean(final < 10_000)
error = np.sqrt(prob_perder * (1 - prob_perder) / final.size)
print(round(p50), round(p10), round(p90))         # 27302 11433 63755
print(f"{prob_perder:.2%} ± {error:.2%}")         # 7.01% ± 0.26%
```

### In practice

- Banks use simulation to value derivatives whose payment depends on the path of one or several prices, for which no closed formula exists.
- Advisers and pension plans simulate thousands of scenarios to estimate the probability that a savings or retirement plan reaches its goal.
- The internal risk models of banks and insurers simulate the joint evolution of many risk factors to estimate extreme losses, such as the value at risk of chapter 16.

### Exercises

- **6.1** *(basic, calculation)* A Monte Carlo estimate with 2,500 scenarios has a standard error of 0.8. How many scenarios are needed to reduce it to 0.2?
- **6.2** *(intermediate, calculation)* When estimating $\pi$ with $M$ points, each point falls inside the circle with probability $p = \pi/4$. What is the standard error of the estimate with 10,000 points? How many points would be needed for a standard error of 0.001?
- **6.3** *(basic, reflection)* Why is it advisable to fix the seed of a simulation? Why is it also advisable to repeat it with other seeds?
- **6.4** *(advanced, calculation)* In the worked example, the simulation estimates a probability of loss of 7.01% with 10,000 scenarios. Build an approximate 95% confidence interval and check whether it contains the theoretical value of 6.80%.

### Going further · Monte Carlo simulation more rigorously

#### Foundation

We want to estimate $\theta = E[h(X)]$. With $M$ independent draws $X_1, \dots, X_M$, the estimator $\hat\theta_M = \frac1M\sum_m h(X_m)$ is unbiased; it converges by the law of large numbers (chapter 3) and, by the central limit theorem (chapter 5),

$$\hat\theta_M \pm 1.96\,\frac{\hat\sigma}{\sqrt{M}}$$

is an approximate 95% confidence interval, where $\hat\sigma$ is the sample standard deviation of the $h(X_m)$. The error is $O(M^{-1/2})$ **regardless of the dimension** of the problem, whereas quadrature methods in $d$ dimensions deteriorate quickly with $d$. That is why Monte Carlo dominates in problems with many variables: many assets, many dates or path-dependent payoffs.

#### History

The method was developed at Los Alamos in the late 1940s (Stanisław Ulam, John von Neumann, Nicholas Metropolis) for neutron diffusion problems; Metropolis and Ulam (1949) published the first paper with the name, inspired by the Monte Carlo casino. A famous precedent is Buffon's needle (1777), which lets one estimate $\pi$ by dropping needles on a floor made of planks. Boyle (1977) introduced it into option pricing.

#### Random numbers and seeds

Computers generate **pseudorandom** numbers with deterministic algorithms: starting from a seed they produce a sequence that passes statistical tests of randomness. Examples: the Mersenne Twister (Matsumoto and Nishimura, 1998), with period $2^{19937} - 1$, and PCG64 (O'Neill, 2014), NumPy's default generator. Fixing the seed makes results reproducible (exercise 6.3); for parallel runs one must use independent streams and not arbitrary consecutive seeds.

#### Generating distributions

- **Inverse transform**: if $U \sim \mathcal{U}(0,1)$, $X = F^{-1}(U)$ has distribution $F$.
- **Box–Muller** (1958): from two independent uniforms, $Z_1 = \sqrt{-2\ln U_1}\cos(2\pi U_2)$ and $Z_2 = \sqrt{-2\ln U_1}\sin(2\pi U_2)$ are independent standard normals.
- **Correlated normals**: if $\Sigma = LL^\top$ is the Cholesky decomposition and $\mathbf{z}$ is a vector of independent standard normals, $L\mathbf{z} \sim \mathcal{N}(\mathbf{0}, \Sigma)$. This is what the `simular_historia` function of the practical project at the end of the book does.
- **Prices**: geometric Brownian motion is simulated exactly with $S_{t+\Delta} = S_t \exp\!\big((\mu - \tfrac12\sigma^2)\Delta + \sigma\sqrt{\Delta}\,Z\big)$; discretizing the differential equation directly (Euler scheme) introduces a bias that only disappears as $\Delta \to 0$.

*Exact solution of the worked example:* if annual log returns are independent and $\mathcal{N}(0.05;\ 0.15^2)$, the 20-year sum is $\mathcal{N}(1;\ 0.15^2 \times 20)$, with standard deviation $0.15\sqrt{20} = 0.671$, and final wealth is lognormal (chapter 5). Its median is $10\,000\,e^{1} = 27\,183$ €; its 10th and 90th percentiles are $10\,000\,e^{1 \mp 1.2816 \times 0.671}$, that is, €11,506 and €64,218, and the probability of ending below €10,000 is $\Phi(-1/0.671) = \Phi(-1.49) = 6.80\%$. *Mean* wealth, $10\,000\,e^{1 + 0.15^2 \times 20/2} = 34\,042$ €, is much higher than the median: the distribution is skewed to the right. The simulated values differ from the exact ones by less than 1% in the median and by less than one standard error in the probability, as befits the Monte Carlo error.

#### Example: pricing an option

The price of a European call option is $C = e^{-rT}E^Q[(S_T - K)^+]$ (chapter 3). With $S_0 = K = 100$, $r = 3\%$, $\sigma = 20\%$ and $T = 1$, the Black and Scholes formula gives 9.41. A simulation with 100,000 paths gives 9.46 with a standard error of 0.045: the exact value lies within the confidence interval. For options without a closed formula (Asian, barrier, multi-asset) the procedure is identical. American options require deciding on early exercise; the least-squares method of Longstaff and Schwartz (2001) solves it within Monte Carlo.

#### Variance reduction

Since the error falls only with $\sqrt{M}$, it pays to reduce $\sigma$ (Glasserman, 2003):

- **Antithetic variables**: use each $Z$ together with $-Z$.
- **Control variates**: correct with a correlated variable of known expectation (for example, the geometric Asian option, which has a formula, to price the arithmetic one).
- **Importance sampling**: sample the rare regions that matter more often; it is essential for estimating probabilities of extreme losses (chapter 16).
- **Quasi-Monte Carlo**: low-discrepancy sequences (Sobol', 1967) with an error close to $O(M^{-1}(\ln M)^d)$, better than $M^{-1/2}$ in moderate dimension.

#### Model risk

A simulation is only as good as its assumptions. The chapter's example assumes independent, normal annual returns; with fat tails or changing volatility (chapters 7 and 15) the low percentiles would be worse. An alternative is **historical simulation** or the *bootstrap* (Efron, 1979), which resamples observed returns instead of assuming a distribution, although then only scenarios similar to those already seen are reproduced.

---

# Part III · Risk and reward

With the probability tools now available we can describe an investment with more than its average return. Chapter 7 introduces volatility, the most widely used risk measure. Chapter 8 combines return and volatility into a single number, the Sharpe ratio, to compare investments with different risk. Chapter 9 explains why volatility is not only unsettling but also reduces the compound growth of wealth.

---

## Chapter 7 · Volatility

> **In this chapter** you will learn to compute the volatility of a series of returns, to convert it between frequencies and to interpret what it measures and what it does not.

### The idea

Two funds may have earned the same over ten years and offered very different experiences: one advancing with small swings and the other alternating euphoric rises and painful falls. The average return does not distinguish between them; we need a measure of the size of the swings. The most widely used is **volatility**: the standard deviation of the investment's returns. Since returns are usually measured daily, weekly or monthly, volatility is almost always converted to an annual basis so it can be compared; that conversion is called **annualizing** and relies on the square-root-of-time rule of chapter 4.

In market language, «volatility» and «risk» are often used as synonyms. It is a useful simplification, but we should not forget that volatility penalizes rises and falls alike, and that it says little about rare, extreme falls (chapters 15 and 16).

### A worked example

Over six sessions, an asset records these daily log returns: +0.5%, −1.5%, +2.0%, −0.5%, +1.0% and −1.5%.

1. **Mean.** The sum is 0, so the mean is 0%.
2. **Squared deviations.** Subtracting the mean and squaring: 0.25; 2.25; 4.00; 0.25; 1.00 and 2.25, which add up to 10.
3. **Sample variance.** Divide by the number of observations minus one: $10/5 = 2$ (in %²).
4. **Daily volatility.** The square root: $\sqrt{2} = 1.41\%$.
5. **Annual volatility.** With 252 trading **sessions** a year and independent returns: $1.41\% \times \sqrt{252} = 22.4\%$.

Six observations are far too few to estimate anything precisely, but the procedure is the same with six as with six thousand.

### Formalization

Let $r_1, \dots, r_N$ be the log returns observed at a given frequency (for example, daily) and $\bar r$ their mean. The sample volatility at that frequency is

$$\hat\sigma = \sqrt{\frac{1}{N-1}\sum_{t=1}^{N}\big(r_t - \bar r\big)^2}.$$

We divide by $N - 1$ and not by $N$ because the mean has been estimated with the same data, which uses up one degree of freedom (Going further gives the details); with long samples the difference is negligible. If there are $h$ periods per year (252 sessions, 52 weeks or 12 months) and returns are independent, the annual volatility is

$$\sigma_{\text{annual}} = \hat\sigma\,\sqrt{h}.$$

### Interactive chart

> **Interactive chart · Same destination, different journey.** A slider sets the annual volatility (from 2% to 50%); the log drift stays at 6% a year. Left panel: two daily price paths over five years, one with 5% volatility as a reference and the other with the chosen volatility, generated with the same random numbers so that the comparison is fair. Right panel: the distribution of the one-year return for both, with the loss area shaded and its probability: 11.5% with 5% volatility and 40.5% with 25% volatility, if annual log returns are normal. What the reader should observe: with the same trend, more volatility means a bumpier ride and many more years in the red.

### In Python

```python
import numpy as np

r = np.array([0.5, -1.5, 2.0, -0.5, 1.0, -1.5]) / 100   # daily returns
vol_diaria = r.std(ddof=1)            # ddof=1: divide by N - 1
vol_anual = vol_diaria * np.sqrt(252)
print(f"{vol_diaria:.2%} diaria, {vol_anual:.1%} anual")  # 1.41% diaria, 22.4% anual (daily, annual)
```

### In practice

- The key information documents that retail investors receive in the European Union include a risk indicator from 1 to 7, whose market risk part is based on a measure of the size of possible losses related to volatility (Going further gives the details).
- In options markets it is common to quote in implied volatility instead of in euros: once that number is known, the price is obtained with a pricing model.
- Risk desks monitor the recent volatility of each position and reduce exposure when it rises; some strategies, called volatility targeting, do this systematically.

### Exercises

- **7.1** *(basic, calculation)* Five daily returns: +1.2%, −0.4%, +0.8%, −2.0% and +0.4%. Compute the mean, the daily volatility (dividing by $N-1$) and the annualized volatility with 252 sessions.
- **7.2** *(intermediate, calculation)* A fund reports a monthly volatility of 3%. What is its annual volatility, assuming independent months? If that figure were used as the equivalent volatility in the PRIIPs market risk classification described in Going further, which class would it fall into?
- **7.3** *(intermediate, reflection)* You estimate the volatility of a share with data from a very calm year and use it to size the risk of the following year. Why can it be a poor guide?

### Going further · Volatility more rigorously

#### Estimation and its error

The usual estimator is the sample standard deviation $\hat\sigma$ of log returns, dividing by $N - 1$. For i.i.d. normal data, its standard error is approximately $\sigma/\sqrt{2N}$: with one year of daily data ($N = 252$) and $\sigma = 20\%$ annual, the error is about 0.9 percentage points. Volatility is estimated quite well with frequent data. With fat tails, however, the error is larger: approximately $\sigma\sqrt{(\kappa - 1)/(4N)}$, where $\kappa$ is the kurtosis (chapter 15). With $\kappa = 3$ the normal formula is recovered, but with the usual daily kurtoses, from 6 to 10, the error is between 1.6 and 2.1 times larger.

The **mean**, by contrast, is estimated very poorly: its standard error is $\sigma/\sqrt{T}$ with $T$ in *years*, regardless of the sampling frequency. With $\sigma = 20\%$ and 10 years of data, the error of the average annual return is 6.3%, comparable to the risk premium itself. Merton (1980) pointed out this asymmetry, which has major consequences for portfolio optimization (chapter 12).

#### Volatility is not constant

One of the best-established empirical facts is **volatility clustering** (Mandelbrot, 1963; Cont, 2001): turbulent periods are followed by turbulent periods. Main models:

- **Exponentially weighted moving average (EWMA)**, popularized by RiskMetrics (J.P. Morgan/Reuters, 1996): $\sigma_t^2 = \lambda\,\sigma_{t-1}^2 + (1 - \lambda)\,r_{t-1}^2$, with $\lambda = 0.94$ for daily data.
- **GARCH(1,1)** (Engle, 1982; Bollerslev, 1986):
$$\sigma_t^2 = \omega + \alpha\,r_{t-1}^2 + \beta\,\sigma_{t-1}^2, \qquad \omega > 0,\ \alpha, \beta \ge 0,\ \alpha + \beta < 1.$$
The long-run variance is $\omega/(1 - \alpha - \beta)$ and the persistence $\alpha + \beta$ is usually between 0.95 and 0.99 in daily stock data. EWMA is the limiting case $\omega = 0$, $\alpha + \beta = 1$. Engle received the 2003 Nobel Prize in Economics for this work.
- **Leverage effect** (Black, 1976): price falls tend to increase volatility more than rises of the same size. Asymmetric variants such as GJR-GARCH (Glosten, Jagannathan and Runkle, 1993) capture it.

#### Other volatility measures

- **Realized volatility**: the sum of squared intraday returns, $RV_t = \sum_j r_{t,j}^2$, converges to the day's integrated variance as the frequency increases (Andersen, Bollerslev, Diebold and Labys, 2003), with the caveat of microstructure noise.
- **Range estimator** (Parkinson, 1980): uses daily highs $H$ and lows $L$, $\hat\sigma^2 = \frac{1}{4\ln 2}\big(\ln(H/L)\big)^2$; it is several times more efficient than one based only on closing prices.
- **Implied volatility**: the value of $\sigma$ that, plugged into the Black and Scholes (1973) formula, reproduces the market price of an option. That is why, as noted in «In practice», options markets usually quote in volatility instead of in euros. It is not a pure forecast: it is formed under the risk-neutral measure and includes a **variance risk premium**, so the implied volatility of indices usually exceeds the volatility realized afterwards (Carr and Wu, 2009); moreover, it changes with the strike price and the maturity (the «smile», chapter 15). Cboe's **VIX** index measures the 30-day implied volatility of the S&P 500, but not with Black and Scholes: since 2003 it has been computed model-free from a portfolio of options with many strike prices, and it is roughly equivalent to the square root of the rate of a 30-day variance *swap*.

#### Volatility and the risk of loss

Volatility treats positive and negative deviations alike. Alternative measures focused on the left tail are the **semivariance** (already proposed by Markowitz, 1959), the downside deviation relative to a target $\tau$, $\sigma_- = \sqrt{E[\min(r - \tau, 0)^2]}$, the **maximum drawdown** and the tail measures of chapter 16.

#### European regulation

The summary risk indicator (SRI) of PRIIPs key information documents combines a market risk measure with a credit risk measure. The market part classifies the product by a «VaR-equivalent volatility» (usually obtained from a 97.5% VaR with the Cornish–Fisher correction of chapter 15, not simply from the standard deviation) into seven classes (Delegated Regulation (EU) 2017/653): below 0.5%, 0.5–5%, 5–12%, 12–20%, 20–30%, 30–80% and above 80% a year. Since 2023 UCITS funds also use this document, instead of the old SRRI indicator, which was based directly on historical volatility. In exercise 7.1, dividing by $N = 5$ instead of by $N - 1 = 4$ would give $\sqrt{6.4/5} = 1.13\%$ instead of 1.26%, a notable difference with only five observations.

---


## Chapter 8 · Risk-adjusted return: the Sharpe ratio

> **In this chapter** you will learn to compare investments with different levels of risk, to understand why leverage does not change the Sharpe ratio and to distrust ratios estimated from little data.

### The idea

Is a fund that has earned 10% a year better than one that has earned 6%? It depends on the risk each one has taken. A high return may simply be the reward for bearing large swings, something anyone could achieve by concentrating their money in risky assets. To compare fairly we must measure how much return is obtained **per unit of risk**.

The starting point is the **risk-free rate**, the return obtained without taking any risk (in practice, that of a short-term Treasury bill or a guaranteed deposit). What an investment earns above that rate is its **excess return**, and the **Sharpe ratio** divides it by the volatility. A ratio of 0.5 means the investment has paid half a point of extra return for each point of volatility.

### A worked example

Three funds and a risk-free rate of 2%:

| Fund | Mean return | Volatility | Sharpe ratio |
|---|---|---|---|
| A | 7.0% | 12% | (7 − 2)/12 = 0.42 |
| B | 4.5% | 4% | (4.5 − 2)/4 = 0.625 |
| C | 10.0% | 22% | (10 − 2)/22 = 0.36 |

Fund C earns the most, but B rewards risk best. Why should we care if B earns less? Because, if we can borrow at the risk-free rate, B's return and volatility can be scaled. Investing three times our own capital in B, financing the rest at 2%, would give a return of $2 + 3 \times (4.5 - 2) = 9.5\%$ with a volatility of $3 \times 4 = 12\%$: the same volatility as A, but 2.5 points more return. With the highest Sharpe ratio one can build a better portfolio for any level of risk.

### Formalization

Let $\mu$ be the mean annual return of an investment, $\sigma$ its annual volatility and $r_f$ the risk-free rate. The Sharpe ratio is

$$\text{SR} = \frac{\mu - r_f}{\sigma}.$$

If a fraction $w > 0$ of capital is invested in it and the rest, $1 - w$, in the risk-free asset (with $w > 1$ when borrowing), the excess return and the volatility of the combination are both multiplied by $w$:

$$\mu_w - r_f = w\,(\mu - r_f), \qquad \sigma_w = w\,\sigma \qquad\Longrightarrow\qquad \text{SR}_w = \text{SR}.$$

With a short position ($w < 0$), the volatility would be $|w|\,\sigma$ and the ratio would change sign. All the combinations with $w \ge 0$ of an investment with the riskless asset form a straight line in the volatility–return plane, starting at $r_f$ and with the Sharpe ratio as its slope. Choosing the investment with the highest ratio amounts to choosing the steepest line.

When the ratio is computed from monthly or daily data, it is annualized by multiplying by the square root of the number of periods per year, because excess return grows in proportion to time and volatility in proportion to its square root (chapter 4). That rule assumes, once again, independent returns.

### Interactive chart

> **Interactive chart · The steepest line.** A plane with volatility on the horizontal axis and mean return on the vertical one. The three funds of the example appear as points the reader can drag, together with a point on the vertical axis for the risk-free rate, also adjustable. A line runs from that point to each fund, labelled with its Sharpe ratio. A «fraction invested» slider (from 0 to 300%) moves a marker along the line of the selected fund, showing the return, volatility and ratio of the combination. What the reader should observe: moving along a line changes risk and return, but not the ratio; and the steepest line dominates the others at any level of volatility.

### In Python

```python
import numpy as np

def sharpe(mu, sigma, rf):
    return (mu - rf) / sigma

fondos = {"A": (0.07, 0.12), "B": (0.045, 0.04), "C": (0.10, 0.22)}
for nombre, (mu, sigma) in fondos.items():
    print(nombre, round(sharpe(mu, sigma, rf=0.02), 2))

# With monthly data: monthly ratio times the square root of 12
exceso_mensual = np.array([0.8, -1.1, 1.9, 0.3, -0.4, 1.2]) / 100
sr_anual = exceso_mensual.mean() / exceso_mensual.std(ddof=1) * np.sqrt(12)
```

### In practice

- Fund rankings and management reports include the Sharpe ratio next to the return, so that investors can see how much risk lay behind each result.
- Managers who combine several strategies use the ratio to decide which one gets more capital and with how much leverage.
- Quantitative research teams distrust spectacular ratios obtained in historical simulations: with few years of data or after trying many variants, the estimated ratio can be heavily inflated (Going further and supplementary topic A).

### Exercises

- **8.1** *(basic, calculation)* Fund F1 returns 8% a year with a volatility of 14%, and F2 returns 5% with a volatility of 5%. The risk-free rate is 2.5%. Which one has the higher Sharpe ratio?
- **8.2** *(intermediate, calculation)* You want your investment to have the same volatility as F1, but using F2 and borrowing at the risk-free rate. What fraction of your capital should you invest in F2? What expected return do you get and how does it compare with F1's?
- **8.3** *(intermediate, calculation)* Computed from monthly data, a strategy's Sharpe ratio is 0.25. Roughly what annual value does it correspond to, if months are independent?
- **8.4** *(advanced, calculation)* A manager reports an annual Sharpe ratio of 0.6 computed from eight years of annual returns. Using the standard error formula of the Going further section, is it statistically different from zero?

### Going further · The Sharpe ratio more rigorously

#### Origin and theoretical basis

William Sharpe (1966) introduced it as the *reward-to-variability ratio* and revisited it in 1994 (Sharpe, 1994), where he defines it on the differential return against any benchmark. Its justification comes from Tobin's separation theorem (1958): if there is a risk-free asset, all combinations of that asset with a risky portfolio lie on a straight line in the (volatility, return) plane, the **capital allocation line**, whose slope is the Sharpe ratio of the risky portfolio. A mean-variance investor first chooses the risky portfolio with the **maximum** Sharpe ratio (the tangency portfolio) and then decides how much to lever or de-lever it according to their risk aversion $\gamma$:

$$w^* = \frac{\mu - r_f}{\gamma\,\sigma^2}.$$

The chapter's result ($\text{SR}_w = \text{SR}$) is precisely this invariance to leverage.

#### Estimation error

The Sharpe ratio is a statistic estimated with noise. For i.i.d. normal returns, Lo (2002) obtains the asymptotic standard error

$$\operatorname{SE}\big(\widehat{\text{SR}}\big) \approx \sqrt{\frac{1 + \tfrac12\,\text{SR}^2}{T}},$$

where $T$ is the number of observations at the same frequency at which the ratio is measured. *Example:* an annual Sharpe ratio of 0.5 estimated from 10 years of annual data has a standard error of 0.34; the $t$ statistic is only 1.5, not enough to rule out that the true Sharpe ratio is zero. With autocorrelation, the $\sqrt{q}$ annualization of exercise 8.3 is biased and Lo (2002) gives the correction.

Moreover, when many strategies are tried and the best one is chosen, the maximum Sharpe ratio is inflated by selection. Bailey and López de Prado (2014) propose the **deflated Sharpe ratio**, which adjusts for the number of trials, skewness and kurtosis.

#### Related measures

| Measure | Definition | When it is used |
|---|---|---|
| Sortino ratio (Sortino and van der Meer, 1991) | $(\mu - \tau)/\sigma_-$, with downside deviation only | when skewness matters |
| Treynor ratio (1965) | $(\mu - r_f)/\beta$ | for portfolios that are already diversified |
| Jensen's alpha (1968) | $\alpha = \mu - [r_f + \beta(\mu_m - r_f)]$ | return not explained by the CAPM |
| Information ratio | $(\mu - \mu_b)/\sigma(R - R_b)$ | active management against a benchmark $b$ |

#### Relation to long-run growth

In the continuous model with one risky and one riskless asset, the fraction that maximizes log growth (Kelly, chapter 14) is $f^* = (\mu - r_f)/\sigma^2$ and the optimal growth rate is

$$g^* = r_f + \tfrac12\,\text{SR}^2.$$

The Sharpe ratio thus determines how fast wealth can grow with optimal leverage (Merton, 1969; Thorp, 2006).

#### Limitations

1. It implicitly assumes that the mean and the variance are enough to describe risk; it ignores skewness and tails. Strategies that sell out-of-the-money options can show high Sharpe ratios for years before suffering extreme losses.
2. It can be **manipulated**: Goetzmann, Ingersoll, Spiegel and Welch (2007) show that, with derivatives, a manager can raise the measured Sharpe ratio without adding skill, and they propose manipulation-proof measures.
3. With smoothed prices (illiquid assets), measured volatility is artificially low and the Sharpe ratio artificially high.

---

## Chapter 9 · Compound growth and volatility drag

> **In this chapter** you will learn why the mean return overstates how much wealth grows, to estimate the compound growth rate approximately and to recognize the effect in leveraged products.

### The idea

If an asset rises 10% and then falls 10%, it does not return to its starting point: it ends 1% below, because the fall applies to a larger amount than the rise. Returns compound by multiplying, not adding, and that asymmetry means volatility has a cost: the more an investment swings, the further its real growth drifts from its mean return. That difference is known as **volatility drag**.

The relevant magnitude for the long-term investor is not the arithmetic mean of returns but the **compound growth rate**: the constant return that would have produced the same final wealth, that is, the geometric mean of chapter 1, $G$. It is not the same as the mean of the log returns, $g$, although they are linked by $G = e^{g} - 1$: 10% compound equals 9.53% in log terms. For moderate rates they almost coincide, which is why this chapter treats them as roughly equal.

### A worked example

An asset alternates, year after year, a 25% rise and a 20% fall. Its arithmetic mean return is $(25 - 20)/2 = 2.5\%$ a year, an apparently positive figure. But every pair of years wealth is multiplied by $1.25 \times 0.80 = 1$: after twenty years, the investor has exactly what they started with. Its compound growth rate is zero.

The approximation presented below, $g \approx \mu - \tfrac12\sigma^2$, anticipates it. The standard deviation of those two scenarios, dividing by 2 (the population one, not the sample one of chapter 7), is 22.5%, so

$$g \approx 2.5\% - \tfrac12 \times (22.5\%)^2 = 2.5\% - 2.53\% \approx 0\%.$$

The drag eats up the whole mean return.

### Formalization

If in one period the investment rises by a proportion $s$ and in the next falls by the same proportion, the total growth factor is

$$(1 + s)(1 - s) = 1 - s^2 < 1,$$

and the loss, $s^2$, grows with the square of the size of the swing. In general, if an investment has a mean annual return $\mu$ and an annual volatility $\sigma$, its log growth rate is approximately

$$g \approx \mu - \tfrac12\,\sigma^2.$$

The approximation is good when the returns of each period are moderate, and, in the continuous-time price model described in the Going further section, exact for the log growth rate. Its reading is simple: doubling volatility quadruples the drag.

### Interactive chart

> **Interactive chart · The mean is misleading.** Sliders for the mean annual return (from 0% to 15%) and the annual volatility (from 0% to 60%). Left panel: 300 wealth paths over 20 years starting from €100, on a log scale, with mean wealth and median wealth drawn in two colours. Right panel: the growth rate $\mu - \tfrac12\sigma^2$ as a function of volatility for the chosen mean, an inverted parabola that crosses zero when $\sigma = \sqrt{2\mu}$. What the reader should observe: as volatility rises, mean wealth keeps growing but the median stalls or falls; beyond a certain point, most paths lose money even though the mean is still positive.

### In Python

```python
import numpy as np

def crecimiento_aprox(mu, sigma):
    return mu - sigma ** 2 / 2

r = np.array([0.25, -0.20] * 10)              # twenty alternating years
media = r.mean()                              # 0.025
geometrica = np.prod(1 + r) ** (1 / r.size) - 1   # 0.0
print(media, geometrica, crecimiento_aprox(media, r.std()))   # the approximation gives -0.0003
```

### In practice

- When a report sums up ten years of a fund with a single compound annual figure, that figure already has the drag deducted; placing it next to an arithmetic mean of annual returns compares different magnitudes.
- Supervisors have warned that exchange-traded products that multiply the daily return of an index are not suitable for holding over the long term: in turbulent markets, the drag grows with the square of the leverage.
- Managers who periodically rebalance a diversified portfolio obtain a little extra growth precisely because they reduce the volatility of the whole (Going further).

### Exercises

- **9.1** *(basic, calculation)* An asset rises 60% one year and falls 40% the next. What is its arithmetic mean return and what is the cumulative return over the two years?
- **9.2** *(intermediate, calculation)* An investment has a mean annual return of 7%. Estimate its compound growth rate if its volatility is 15% and if it is 30%.
- **9.3** *(advanced, calculation)* An index has a mean return of 6% and a volatility of 18% a year. A product replicates three times the index's daily return every day. Ignoring financing costs, estimate the growth rate of the index and that of the product with the formula of the Going further section.

### Going further · Volatility drag more rigorously

#### Deriving $g \approx \mu - \tfrac12\sigma^2$

Wealth after $T$ periods is $W_T = W_0 \prod_t (1 + R_t)$, so the log growth rate is $g = \frac1T \ln(W_T/W_0) = \frac1T \sum_t \ln(1+R_t)$. By the law of large numbers, $g \to E[\ln(1+R)]$. A second-order Taylor expansion around $R = 0$ gives

$$E[\ln(1+R)] \approx E\Big[R - \tfrac12 R^2\Big] = \mu - \tfrac12\big(\sigma^2 + \mu^2\big) \approx \mu - \tfrac12\sigma^2,$$

where the last step neglects $\mu^2/2$, small for moderate returns. By Jensen's inequality (chapter 3) the difference $\mu - g$ is always non-negative.

**Exact version in continuous time.** In geometric Brownian motion (chapter 4), $\ln(S_t/S_0) \sim \mathcal{N}\big((\mu - \tfrac12\sigma^2)t,\ \sigma^2 t\big)$. Therefore:

- **expected** wealth grows at the rate $\mu$: $E[S_t] = S_0 e^{\mu t}$;
- **median** wealth (and that of almost every path in the long run) grows at the rate $\mu - \frac12\sigma^2$.

If $0 < \mu < \tfrac12\sigma^2$, expected wealth grows while almost every path tends to zero: the mean is propped up by an ever smaller fraction of extraordinarily lucky paths. The «median investor» of chapter 14 is the right way to think about it.

#### Leveraged products with daily rebalancing

A fund that replicates $L$ times an index's return every day has, in continuous time and without financing costs, a growth rate

$$g_L \approx L\,\mu - \tfrac12 L^2 \sigma^2,$$

that is, the drag grows with the **square** of the leverage (Cheng and Madhavan, 2009). *Example:* with $\mu = 8\%$ and $\sigma = 20\%$, the index grows at 6% and the $2\times$ fund at $16 - 8 = 8\%$. With $\sigma = 30\%$, the index grows at 3.5% and the $2\times$ fund **shrinks** by 2% a year. That is why FINRA warned in 2009 (Regulatory Notice 09-31) that these products are not suitable for long-term holding; it is the warning mentioned in the «In practice» section.

#### The positive flip side: the diversification return

For a portfolio rebalanced to fixed weights $w_i$, the growth rate is

$$g_p = \sum_i w_i\,g_i + \tfrac12\left(\sum_i w_i\,\sigma_i^2 - \sigma_p^2\right).$$

The term in brackets, Fernholz's **excess growth rate** (Fernholz and Shay, 1982; Fernholz, 2002), is positive in a portfolio without short positions (positive weights that add up to 1) whenever the assets are not perfectly correlated; with short positions or leverage it can be negative. Booth and Fama (1992) call it the *diversification return*. *Example:* two uncorrelated assets, each with $\mu = 10\%$ and $\sigma = 40\%$, grow individually at $10 - 8 = 2\%$. A rebalanced 50/50 portfolio has $\sigma_p^2 = 0.08$ and grows at $10 - 4 = 6\%$: diversification reduces the drag and triples growth without changing the mean return.

#### Measuring growth

The **compound annual growth rate** (CAGR) that funds publish is the geometric mean of chapter 1, $\big(W_T/W_0\big)^{1/T} - 1$; it already includes the drag. A useful rule of thumb is: geometric mean $\approx$ arithmetic mean $- \frac12$ variance.

---

# Part IV · Portfolios

Almost nobody invests all their money in a single asset. As soon as several are combined, a new question appears: how do they move relative to one another? Chapter 10 introduces covariance and correlation, which measure that joint movement. Chapter 11 shows how diversification reduces risk and where it stops. Chapter 12 turns the choice of a portfolio into an optimization problem, and chapter 13 draws from it a theory of which risks the market rewards.

---

## Chapter 10 · Covariance and correlation

> **In this chapter** you will learn to measure how two investments move together, to interpret the correlation coefficient and to avoid the most frequent mistakes when using it.

### The idea

For the risk of a portfolio it is not enough to know the volatility of each asset: it also matters whether their falls tend to coincide. Two assets that usually fall on the same days protect each other little; two that move independently each cushion the other's bad spells, and two that tend to move in opposite directions offset each other even more.

**Covariance** measures that joint movement: it is positive when the two assets tend to be above (or below) their mean at the same time, and negative when one tends to be above while the other is below. Its drawback is that it depends on the units and scale of each asset. Dividing it by the product of the two standard deviations gives the **correlation**, a unitless number that always lies between −1 and +1: +1 means the two assets move in perfect proportion, −1 that they move in perfect opposition and 0 that there is no *linear* relationship between them.

### A worked example

Two assets record these monthly returns over five months (in %):

| Month | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Asset X | 2 | −1 | 3 | 0 | 1 |
| Asset Y | 1 | −2 | 2 | 1 | 3 |

1. **Means.** Both equal 1%.
2. **Deviations from the mean.** X: 1, −2, 2, −1, 0. Y: 0, −3, 1, 0, 2.
3. **Products of deviations.** 0, 6, 2, 0, 0, which add up to 8. The sample covariance is $8/4 = 2$ (in %²).
4. **Standard deviations.** For X, $\sqrt{(1 + 4 + 4 + 1 + 0)/4} = \sqrt{2.5} = 1.58\%$; for Y, $\sqrt{(0 + 9 + 1 + 0 + 4)/4} = \sqrt{3.5} = 1.87\%$.
5. **Correlation.** $2/(1.58 \times 1.87) = 0.68$.

Month 2, in which both fall sharply, contributes almost all the covariance. With so little data, a single month can change the estimate a lot; the Going further section quantifies that uncertainty.

### Formalization

Let $X$ and $Y$ be two returns with means $\mu_X$, $\mu_Y$ and standard deviations $\sigma_X$, $\sigma_Y$. The covariance is the expected value of the product of their deviations from the mean,

$$\operatorname{Cov}(X, Y) = E\big[(X - \mu_X)(Y - \mu_Y)\big],$$

and the correlation is the normalized covariance,

$$\rho_{XY} = \frac{\operatorname{Cov}(X, Y)}{\sigma_X\,\sigma_Y}, \qquad -1 \le \rho_{XY} \le 1.$$

With data, expectations are replaced by sample averages, dividing by $n - 1$ as in chapter 7. The covariance of a variable with itself is its variance.

### Interactive chart

> **Interactive chart · Moving together.** Left panel: a cloud of 500 simulated pairs of daily returns, with a slider for the correlation between −1 and +1; the cloud goes from a descending line to a circle and to an ascending line. A selector also shows a non-linear case (a parabola) whose correlation is almost zero even though the relationship is perfect. Right panel: the volatility of a portfolio with 50% in each of two assets of volatility 20%, as a function of the correlation: 20% with correlation +1, 17.3% with +0.5, 14.1% with 0, 10% with −0.5 and 0% with −1. What the reader should observe: the lower the correlation, the calmer the portfolio; and a zero correlation does not guarantee there is no relationship.

### In Python

```python
import numpy as np

x = np.array([2, -1, 3, 0, 1]) / 100
y = np.array([1, -2, 2, 1, 3]) / 100
cov = np.cov(x, y, ddof=1)[0, 1]          # 0.0002, i.e. 2 in %²
rho = np.corrcoef(x, y)[0, 1]             # 0.676
print(cov, rho)
```

### In practice

- The risk models of financial institutions estimate correlation matrices among hundreds or thousands of factors to compute the aggregate risk of their portfolios.
- Multi-asset managers look for combinations with low correlation, above all in crisis periods, which is when protection is needed most.
- Numerous studies have documented that correlations between stock markets increase in sharp falls, so diversification protects less precisely when it is needed most (Going further).

### Exercises

- **10.1** *(basic, calculation)* Two stocks have annual volatilities of 15% and 25%, and their annual covariance is 0.009. What is their correlation?
- **10.2** *(intermediate, calculation)* Over four months, asset X returns 1%, 3%, −1% and 1%, and asset Y returns 2%, 0%, 4% and 2%. Before calculating, look at the data and predict the correlation. Then calculate it.
- **10.3** *(intermediate, reflection)* The prices of two stocks have risen steadily for ten years and the correlation between their *prices* is 0.95. Does that mean that combining them barely reduces risk?

### Going further · Correlation more rigorously

#### Estimators and properties

Given a sample $(x_t, y_t)$, the sample covariance and correlation (Pearson's coefficient, 1896) are

$$s_{XY} = \frac{1}{n-1}\sum_{t=1}^{n}(x_t - \bar x)(y_t - \bar y), \qquad r = \frac{s_{XY}}{s_X\,s_Y}.$$

Properties:

- $|\rho| \le 1$ by the Cauchy–Schwarz inequality, with $|\rho| = 1$ if and only if $Y = a + bX$ almost surely.
- It is invariant under increasing affine transformations ($X \mapsto a + bX$, $b > 0$), but **not** under non-linear monotonic transformations.
- Covariance is bilinear: $\operatorname{Cov}(aX + bY, Z) = a\operatorname{Cov}(X,Z) + b\operatorname{Cov}(Y,Z)$, which makes it possible to compute the variance of any portfolio (chapter 11).

**Uncertainty.** With normal data, Fisher's transformation $z = \operatorname{artanh}(r)$ is approximately normal with standard error $1/\sqrt{n-3}$. *Example:* $r = 0.5$ with 60 monthly observations (five years) gives a 95% confidence interval of $[0.28,\ 0.67]$: correlations estimated from a few years of data are very imprecise.

#### Correlation is not dependence

Pearson's correlation only measures **linear** dependence. A minimal example: if $X$ takes the values $-1$, $0$ and $1$ with probability $1/3$ each and $Y = X^2$, $Y$ is completely determined by $X$ and yet $\operatorname{Cov}(X, Y) = E[X^3] - E[X]\,E[X^2] = 0 - 0 = 0$, so $\rho = 0$. Zero correlation does not mean independence. Anscombe's quartet (1973) shows four data sets with practically identical means, variances, correlation ($r \approx 0.82$) and regression line, but completely different shapes. It always pays to plot the data.

More robust alternatives are rank correlations: **Spearman's** (1904), the Pearson correlation of the ranks, and **Kendall's tau** (1938), based on concordant and discordant pairs. Both are invariant under any increasing monotonic transformation and less sensitive to extreme values.

#### Copulas and tail dependence

Sklar's theorem (1959) makes it possible to split any joint distribution into its marginal distributions and a **copula** that describes the dependence. Two models with the same correlation can behave very differently in the extremes. The **upper tail dependence coefficient**, $\lambda_U = \lim_{u \to 1} P\big(F_Y(Y) > u \mid F_X(X) > u\big)$, is 0 for the Gaussian copula (with $\rho < 1$) and positive for the Student $t$ copula. Embrechts, McNeil and Straumann (2002) describe the usual mistakes of relying only on correlation in risk management. The use of Gaussian copulas to value CDOs (Li, 2000), which underestimate the probability of simultaneous defaults, was often cited as one of the factors in the 2008 crisis.

#### Spurious correlations

Correlating **price levels** (non-stationary series) produces high correlations with no meaning; Yule (1926) called them *nonsense correlations* and Granger and Newbold (1974) formalized the problem for regressions. That is why in finance one correlates **returns**, not prices. And, of course, correlation does not imply causation.

#### Correlations that change, above all in crises

- Longin and Solnik (2001), using extreme value theory, find that the correlation between international markets increases in bear markets but not in bull markets; Ang and Chen (2002) document the same asymmetry in US stock portfolios.
- Forbes and Rigobon (2002) warn of a bias: correlation conditional on high-volatility periods increases *mechanically* even if the underlying relationship does not change. If the variance of a market increases by a relative proportion $\delta$, the corrected correlation is $\rho^* = \rho_c \big/ \sqrt{1 + \delta(1 - \rho_c^2)}$.
- To model time-varying correlations one uses, for example, Engle's DCC model (2002).

#### Large correlation matrices

A correlation matrix must be positive semidefinite. With $N$ assets and $T$ observations, if $N/T$ is not small, much of the structure of the sample matrix is noise: Laloux, Cizeau, Bouchaud and Potters (1999), using random matrix theory, showed that most eigenvalues of the S&P 500 correlation matrix were indistinguishable from those of a purely random matrix. This motivates the shrinkage techniques of chapter 12.

---

## Chapter 11 · Diversification

> **In this chapter** you will learn to calculate the volatility of a portfolio, to quantify how much risk diversification removes and to identify the risk that cannot be removed.

### The idea

A **portfolio** is a set of investments, and the **weight** of each one is the proportion of the total money allocated to it. **Diversification** consists in spreading money among investments that do not move in perfect sync, so that the movements specific to each one are partly offset by those of the others.

Its effects have two sides. The good one: as long as correlations are less than one, the volatility of the portfolio is lower than the weighted average of the volatilities of its components, and with many assets the specific part of each one almost disappears. The bad one: the part of risk that all of them share, market risk or **systematic risk**, does not disappear however much one diversifies. There is a volatility floor that no portfolio of those assets can break through, at least as long as their correlations are positive.

### A worked example

*Two assets.* A portfolio invests 60% in stocks (volatility 18%) and 40% in bonds (volatility 6%), with a correlation of 0.1 between them. Its variance is

$$0.6^2 \times 0.18^2 + 0.4^2 \times 0.06^2 + 2 \times 0.6 \times 0.4 \times 0.1 \times 0.18 \times 0.06 = 0.012758,$$

and its volatility, $\sqrt{0.012758} = 11.3\%$. The weighted average of the volatilities would be $0.6 \times 18 + 0.4 \times 6 = 13.2\%$: diversification saves almost two points of volatility.

*Many assets.* Suppose now $N$ stocks with the same volatility, 25%, the same correlation between each pair, 0.2, and equal weights. The volatility of the portfolio is:

| Number of stocks | 1 | 5 | 20 | 50 | Infinite |
|---|---|---|---|---|---|
| Portfolio volatility | 25.0% | 15.0% | 12.2% | 11.6% | 11.2% |

The first stocks added reduce risk a lot; the following ones, less and less. The limit, $25\% \times \sqrt{0.2} = 11.2\%$, is the floor set by the common correlation.

### Formalization

For two assets with weights $w_1$ and $w_2$, volatilities $\sigma_1$ and $\sigma_2$ and correlation $\rho$, the variance of the portfolio is

$$\sigma_p^2 = w_1^2\sigma_1^2 + w_2^2\sigma_2^2 + 2\,w_1 w_2\,\rho\,\sigma_1\sigma_2.$$

The last term is what makes diversification work: the lower $\rho$, the lower the variance. With positive weights, if $\rho = 1$, the volatility of the portfolio is exactly the weighted average of the volatilities; with any $\rho < 1$, it is lower.

For $N$ assets with the same volatility $\sigma$, the same correlation $\rho$ between each pair and equal weights $1/N$,

$$\sigma_p^2 = \sigma^2\left[\frac{1}{N} + \left(1 - \frac{1}{N}\right)\rho\right] \;\xrightarrow{\;N \to \infty\;}\; \rho\,\sigma^2.$$

The first term, the specific part, fades away as $1/N$; the second, the common part, remains. With a positive common correlation, the minimum attainable volatility is $\sigma\sqrt{\rho}$. A negative common correlation cannot be sustained with many assets, because it must satisfy $\rho \ge -1/(N - 1)$.

### Interactive chart

> **Interactive chart · How far diversification goes.** Sliders for the individual volatility (from 10% to 50%), the common correlation (from 0 to 0.9) and the maximum number of assets (up to 200). The curve shows the volatility of the equal-weight portfolio against the number of assets, with a horizontal line at the floor $\sigma\sqrt{\rho}$ and the area between the curve and the floor labelled «specific risk not yet diversified». A second tab shows the two-asset case: the volatility of the portfolio against the weight of the first asset, for several correlations at once. What the reader should observe: with zero correlation risk tends to zero; with positive correlation, the curve soon flattens out on the floor.

### In Python

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

### In practice

- In the European Union, the rules for harmonized funds (UCITS) generally limit investment in securities of a single issuer to 5% of the fund's assets, with some bounded exceptions: diversification is written into the law.
- In the United States, the law that regulates company pension plans requires their managers to diversify investments so as to minimize the risk of large losses, unless it is clearly not prudent to do so.
- Index funds that track a broad index offer any investor very high diversification with a single purchase.

### Exercises

- **11.1** *(basic, calculation)* A portfolio gives the same weight to nine mutually independent assets, all with a volatility of 30%. What is the volatility of the portfolio?
- **11.2** *(intermediate, calculation)* Ten assets with volatility 20% and correlation 0.4 between each pair, with equal weights. What is the volatility of the portfolio? What is the minimum attainable with very many assets of that kind?
- **11.3** *(intermediate, calculation)* A portfolio has five assets with weights of 50%, 20%, 10%, 10% and 10%. Calculate its effective number of assets (Going further) and compare it with that of an equal-weight portfolio.

### Going further · Diversification more rigorously

#### Variance of a portfolio of $N$ assets

In matrix notation, with weight vector $\mathbf{w}$ and covariance matrix $\Sigma$ (elements $\sigma_{ij}$),

$$\sigma_p^2 = \mathbf{w}^\top \Sigma\, \mathbf{w} = \sum_{i=1}^N \sum_{j=1}^N w_i w_j\,\sigma_{ij}.$$

With equal weights $w_i = 1/N$, if $\overline{\sigma^2}$ is the average variance and $\overline{c}$ the average covariance between distinct pairs,

$$\sigma_p^2 = \frac{1}{N}\,\overline{\sigma^2} + \left(1 - \frac{1}{N}\right)\overline{c} \;\xrightarrow{N\to\infty}\; \overline{c}.$$

The idiosyncratic part disappears at rate $1/N$ and the average covariance remains: **systematic risk**. In the chapter's worked example, $\overline{c} = \rho\sigma^2$, so the volatility floor is $\sigma\sqrt{\rho} = 0.25\sqrt{0.2} = 11.18\%$.

#### The single-index model

Sharpe (1963) proposed describing each stock as $R_i = \alpha_i + \beta_i R_m + \varepsilon_i$, with disturbances $\varepsilon_i$ uncorrelated with each other and with the market. Then

$$\sigma_i^2 = \underbrace{\beta_i^2 \sigma_m^2}_{\text{systematic}} + \underbrace{\sigma_{\varepsilon_i}^2}_{\text{specific}}, \qquad \sigma_p^2 = \beta_p^2\sigma_m^2 + \sum_i w_i^2\,\sigma_{\varepsilon_i}^2,$$

and the second term tends to zero in well-diversified portfolios. The systematic fraction of the variance is $R^2 = \beta_i^2\sigma_m^2/\sigma_i^2 = \rho_{im}^2$. This model reduces the parameters to estimate from $N(N+3)/2$ (means, variances and covariances) to $3N + 2$, and it is the bridge to the CAPM (chapter 13).

#### How many assets are needed?

- Evans and Archer (1968) observed that about 10 randomly chosen securities removed much of the diversifiable risk.
- Statman (1987), comparing the benefit of risk reduction with the costs, concluded that a well-diversified portfolio needs at least 30 or 40 securities.
- Campbell, Lettau, Malkiel and Xu (2001) showed that the idiosyncratic volatility of US stocks increased between 1962 and 1997, so the number needed had grown (about 50 securities for the same level of reduction). The trend did not continue: after 2000 idiosyncratic volatility fell again, and Brandt, Brav, Graham and Kumar (2010) concluded that the increase was an episode linked to the tech bubble and retail speculation, not a permanent trend.

#### Effective number of assets

A portfolio with many assets but highly concentrated is poorly diversified. A simple measure is the inverse of the Herfindahl index of the weights, $N_{\text{eff}} = 1/\sum_i w_i^2$, which equals $N$ with equal weights and 1 if everything is in one asset. Finer measures also take correlations into account, such as the **diversification ratio** $\sum_i w_i \sigma_i / \sigma_p$ (Choueifaty and Coignard, 2008) or each asset's risk contribution, $RC_i = w_i (\Sigma\mathbf{w})_i/\sigma_p$, whose contributions add up to $\sigma_p$.

#### What diversification does not do

- It does not by itself change the expected return, which is the weighted average of those of the assets: if assets with lower expected return are added, it falls. It can, however, increase the compound growth rate of a rebalanced portfolio (the diversification return, chapter 9).
- It does not protect against common risk: if all correlations rise in a crisis (chapter 10), the floor $\overline{c}$ rises precisely when protection is needed most.
- Naive $1/N$ diversification turns out to be surprisingly hard to beat out of sample with optimized portfolios, because of estimation error (DeMiguel, Garlappi and Uppal, 2009; see chapter 12).

#### Legal framework mentioned in «In practice»

- **US.** The ERISA law of 1974, sec. 404(a)(1)(C), requires pension plan managers to diversify investments «so as to minimize the risk of large losses», unless it is clearly not prudent to do so.
- **EU.** The UCITS Directive (2009/65/EC), art. 52, generally limits investment in securities of a single issuer to 5% of assets, extendable to 10% provided the total of those positions above 5% does not exceed 40% (the «5/10/40» rule).

---

## Chapter 12 · Portfolio optimization: the efficient frontier

> **In this chapter** you will learn to represent all possible portfolios in the risk–return plane, to find the one with the lowest risk and to understand why optimization is so sensitive to its inputs.

### The idea

With two or more assets one can build infinitely many portfolios, one for each split of weights. If each portfolio is drawn as a point, with its volatility on the horizontal axis and its mean return on the vertical one, a cloud of points appears with a well-defined upper edge. The portfolios on that edge have a special property: no other offers more return with the same volatility, or less volatility with the same return. That set is the **efficient frontier**, and any portfolio below it can be improved at no cost.

At the left end of the frontier lies the **minimum variance portfolio**, the least risky combination possible. A striking result is that this portfolio need not consist only of the least volatile asset: adding a small dose of a riskier but weakly correlated asset can reduce total risk.

The theory does not say which point on the frontier each investor should choose; that depends on how much risk they are willing to bear. What it does say is that one should choose on the frontier.

### A worked example

Two assets: A, with a mean return of 4% and volatility of 6%, and B, with a mean return of 9% and volatility of 20%. Their correlation is 0.2.

| Weight of A | 100% | 80% | 60% | 40% | 20% | 0% |
|---|---|---|---|---|---|---|
| Mean return | 4.0% | 5.0% | 6.0% | 7.0% | 8.0% | 9.0% |
| Volatility | 6.0% | 6.8% | 9.4% | 12.7% | 16.3% | 20.0% |

The mean return of the portfolio is always the weighted average of those of its components; volatility is not, because of the correlation effect. With the formula of the next section, the minimum variance portfolio invests 96.9% in A and 3.1% in B: its volatility is 5.97%, slightly *lower* than that of A alone, and its return, 4.15%, slightly higher. Starting from 100% in A, adding a little B improves both things at once.

### Formalization

For a portfolio of two assets with weights $w$ and $1 - w$, the mean return is

$$\mu_p = w\,\mu_1 + (1 - w)\,\mu_2,$$

and the variance is given by the formula of chapter 11. Differentiating the variance with respect to $w$ and setting it to zero gives the weight of the minimum variance portfolio:

$$w^{*} = \frac{\sigma_2^2 - \rho\,\sigma_1\sigma_2}{\sigma_1^2 + \sigma_2^2 - 2\rho\,\sigma_1\sigma_2}.$$

If $w^*$ falls outside the interval between 0 and 1, the minimum variance portfolio requires a **short sale**: selling an asset one does not own (by borrowing it) to invest more in the other. With many assets, the frontier is obtained by solving an optimization problem that the Going further section formulates in matrix notation.

### Interactive chart

> **Interactive chart · The cloud and its edge.** Three assets with means, volatilities and correlations adjustable through a small editable table. 5,000 portfolios with random weights are drawn as grey points, the minimum variance frontier as a curve and its efficient branch highlighted; the minimum variance portfolio is marked. A switch allows or forbids short sales (with them the frontier extends beyond the cloud). Another switch adds a risk-free asset and draws the line tangent to the frontier, with the maximum Sharpe ratio portfolio marked. What the reader should observe: as correlations fall the cloud bends to the left and the frontier improves; small changes in the mean returns shift the optimal portfolio a lot.

### In Python

```python
import numpy as np

def peso_minima_varianza(s1, s2, rho):
    return (s2**2 - rho * s1 * s2) / (s1**2 + s2**2 - 2 * rho * s1 * s2)

w = peso_minima_varianza(0.06, 0.20, 0.2)                 # 0.969
vol = np.sqrt(w**2 * 0.06**2 + (1 - w)**2 * 0.20**2
              + 2 * w * (1 - w) * 0.2 * 0.06 * 0.20)      # 0.0597
print(w, vol, w * 0.04 + (1 - w) * 0.09)                  # return 0.0415
```

### In practice

- The asset allocation teams of pension funds and insurers use mean-variance models, almost always with constraints and adjustments, as a starting point for deciding the split between broad asset classes.
- There are **minimum variance** stock indices, computed with an optimizer from the constituents of a broad index, which some exchange-traded funds track.
- Professional optimizers are never fed with plain historical means: they combine them with equilibrium models or shrink them towards prudent values, for the reasons explained in the Going further section.

### Exercises

- **12.1** *(basic, calculation)* Two assets with volatilities of 12% and 18% have correlation −1. Which weights give a riskless portfolio?
- **12.2** *(intermediate, calculation)* With assets A and B of the worked example, calculate the return, the volatility and the Sharpe ratio (with a risk-free rate of 2%) of the 50/50 portfolio. Compare its ratio with that of each asset separately.
- **12.3** *(advanced, reflection)* An analyst feeds an optimizer with the mean returns of the last five years and obtains a portfolio that puts 70% in a single asset. Why should that result be distrusted?

### Going further · The efficient frontier more rigorously

#### Markowitz's problem

Markowitz (1952) framed portfolio selection as an optimization problem: for each target return $\mu_p$, minimize the variance

$$\min_{\mathbf{w}}\ \mathbf{w}^\top\Sigma\,\mathbf{w} \quad \text{subject to} \quad \mathbf{w}^\top\boldsymbol{\mu} = \mu_p, \quad \mathbf{w}^\top\mathbf{1} = 1.$$

With Lagrange multipliers (Merton, 1972) and the constants $A = \mathbf{1}^\top\Sigma^{-1}\mathbf{1}$, $B = \mathbf{1}^\top\Sigma^{-1}\boldsymbol{\mu}$, $C = \boldsymbol{\mu}^\top\Sigma^{-1}\boldsymbol{\mu}$ and $D = AC - B^2$ (positive unless all the means are equal), the solution gives a frontier that is a hyperbola in the $(\sigma, \mu)$ plane:

$$\sigma_p^2(\mu_p) = \frac{A\mu_p^2 - 2B\mu_p + C}{D}.$$

Its vertex is the **global minimum variance portfolio**,

$$\mathbf{w}_{\text{GMV}} = \frac{\Sigma^{-1}\mathbf{1}}{A}, \qquad \mu_{\text{GMV}} = \frac{B}{A}, \qquad \sigma^2_{\text{GMV}} = \frac{1}{A}.$$

The upper branch of the hyperbola is the efficient frontier. For two assets, differentiating $\sigma_p^2 = w^2\sigma_1^2 + (1-w)^2\sigma_2^2 + 2w(1-w)\rho\sigma_1\sigma_2$ with respect to $w$ and setting it to zero gives exactly the chapter's formula for $w^*$.

**Two-fund separation** (Black, 1972; Merton, 1972): every frontier portfolio is a combination, with coefficients adding up to 1, of any two distinct frontier portfolios.

#### With a risk-free asset: the tangency portfolio

If there is a riskless asset with rate $r_f$, the efficient frontier becomes a straight line (chapter 8) that, if $r_f < \mu_{\text{MVG}}$ (the usual case), touches the upper branch of the hyperbola at the **tangency portfolio**

$$\mathbf{w}_T = \frac{\Sigma^{-1}(\boldsymbol{\mu} - r_f\mathbf{1})}{\mathbf{1}^\top\Sigma^{-1}(\boldsymbol{\mu} - r_f\mathbf{1})}, \qquad \text{SR}_T^2 = (\boldsymbol{\mu} - r_f\mathbf{1})^\top\Sigma^{-1}(\boldsymbol{\mu} - r_f\mathbf{1}),$$

which is the one with the maximum Sharpe ratio. With constraints (for example, no short sales or limits per asset, as in the advanced phases of the practical project at the end of the book), there is no longer a closed-form solution and a **quadratic programming** problem is solved; Markowitz developed the critical line algorithm for this.

#### The big problem: estimation error

In practice, $\boldsymbol\mu$ and $\Sigma$ are unknown and estimated with error. The optimizer tends to overweight the assets whose return has been overestimated: Michaud (1989) described it as an «error maximizer». Best and Grauer (1991) showed that the optimal weights are extremely sensitive to small changes in the means, and Chopra and Ziemba (1993) estimated that errors in the means are of the order of ten times more harmful than errors in the variances, and these about twice as harmful as errors in the covariances. Remember (chapter 7) that means are precisely the hardest thing to estimate.

Main remedies:

1. **Shrinking the covariance matrix** towards a simple structure (Ledoit and Wolf, 2004).
2. **The Black–Litterman model** (1992): it starts from the returns implied by market equilibrium (reverse CAPM) and combines them in a Bayesian way with the investor's views.
3. **Constraints**: Jagannathan and Ma (2003) showed that imposing a no-short-sale constraint is equivalent to shrinking the covariance matrix and improves out-of-sample results.
4. **Portfolios that need no means**: global minimum variance, risk parity (equal risk contributions; Maillard, Roncalli and Teïletche, 2010) or equal weights $1/N$. DeMiguel, Garlappi and Uppal (2009) found that none of 14 optimized models consistently beat $1/N$ out of sample with the usual sample sizes. The conclusion is not universal: with more robust estimators or more stable inputs, several optimized portfolios do beat $1/N$ (Kritzman, Page and Turkington, 2010; Kirby and Ostdiek, 2012). The lesson is that optimizing only adds value if the inputs contain more information than noise.

#### Evidence on minimum variance portfolios

Minimum variance portfolios of US stocks have historically obtained returns similar to the market with clearly lower volatility (Clarke, de Silva and Thorley, 2006), an observation related to the «low-volatility anomaly» of chapter 13. This explains the existence of the minimum variance indices mentioned in «In practice».

#### Recognition

Markowitz received the Nobel Prize in Economics in 1990, together with William Sharpe and Merton Miller, for their contributions to the theory of financial economics.

---

## Chapter 13 · Beta, CAPM and risk factors

> **In this chapter** you will learn to measure an asset's sensitivity to the market, to calculate the return required by the capital asset pricing model and to interpret its successes and its limits.

### The idea

Chapter 11 showed that an asset's risk has two components: one common to the whole market and another specific to that asset, which can be removed by diversifying. This distinction has a deep consequence. If any investor can get rid of **specific risk** at no cost, by combining many assets, the market has no reason to pay a premium for bearing it. The only thing that should be rewarded is exposure to the risk that cannot be diversified away: that of the **market portfolio**, which contains all risky assets in proportion to their value.

**Beta** measures that exposure: how much an asset tends to move when the market moves. A beta of 1 means the asset follows market movements in the same proportion; a beta of 1.5, that it amplifies them by 50%; one of 0.6, that it dampens them, and a negative one, that it tends to move in the opposite direction. The **capital asset pricing model** (CAPM) concludes that the expected return of each asset is the risk-free rate plus its beta times the **market risk premium**, the expected return of the market above the risk-free rate.

### A worked example

The risk-free rate is 2.5% and the market risk premium 5.5%. The volatility of the market is 15%.

- A utility has a volatility of 15% and a correlation of 0.6 with the market. Its beta is $0.6 \times 15/15 = 0.6$, and the CAPM assigns it an expected return of $2.5 + 0.6 \times 5.5 = 5.8\%$.
- A tech company has a volatility of 30% and a correlation of 0.75. Its beta is $0.75 \times 30/15 = 1.5$, and its expected return, $2.5 + 1.5 \times 5.5 = 10.75\%$.

The tech company has twice the volatility of the utility, but what determines its premium is not total volatility but the part linked to the market. If the market fell 4% in one day, one would expect, on average and with zero alpha, a fall of 2.4% in the utility and of 6% in the tech company.

### Formalization

Let $R_i$ be the return of asset $i$, $R_m$ that of the market and $\sigma_m$ the volatility of the market. The asset's beta is

$$\beta_i = \frac{\operatorname{Cov}(R_i, R_m)}{\sigma_m^2} = \rho_{im}\,\frac{\sigma_i}{\sigma_m}.$$

It is the slope of the regression line of the asset's returns on those of the market. The CAPM states that, in equilibrium,

$$E[R_i] = r_f + \beta_i\,\big(E[R_m] - r_f\big).$$

Drawn in a plane with beta on the horizontal axis and expected return on the vertical one, this relationship is a straight line, the **security market line**, which crosses the vertical axis at $r_f$ and has a slope equal to the market risk premium. An asset whose mean return lies above the line has a positive **alpha**: it returns more than its beta justifies.

### Interactive chart

> **Interactive chart · What the market pays.** Left panel: clouds of simulated daily returns of three assets against the market, with their regression line; a slider changes the beta and the specific volatility of each one, and the reader sees that the slope (beta) and the scatter around the line (specific risk) are different things. Right panel: the security market line, with adjustable risk-free rate and premium, and ten simulated assets as points around it; hovering over a point shows its beta, its mean return and its alpha. What the reader should observe: two assets with the same volatility can have very different betas, and according to the model only beta determines expected return.

### In Python

```python
import numpy as np

def beta(r_activo, r_mercado):
    return np.cov(r_activo, r_mercado, ddof=1)[0, 1] / np.var(r_mercado, ddof=1)

def capm(beta_i, rf, prima):
    return rf + beta_i * prima

rng = np.random.default_rng(5)
mercado = rng.normal(0.0003, 0.01, 1_000)
accion = 1.5 * mercado + rng.normal(0, 0.012, 1_000)   # true beta: 1.5
print(round(beta(accion, mercado), 2), capm(1.5, 0.025, 0.055))   # ~1.5 and 0.1075
```

### In practice

- Many companies use the CAPM to estimate their cost of equity, the minimum return they must offer their shareholders, in order to evaluate investments and to value companies.
- Regulators of sectors such as electricity or gas use the CAPM within the cost of capital calculation with which they set the remuneration of networks; in Spain this is done by the National Markets and Competition Commission (CNMC).
- Fund managers are often judged by their alpha: the return obtained above what their exposure to the market would explain.

### Exercises

- **13.1** *(basic, calculation)* A stock has a volatility of 24%, the market one of 16% and their correlation is 0.7. What is its beta? If in one session the market index loses 3%, what average change can be expected in the stock?
- **13.2** *(basic, calculation)* With an expected market return of 7% and a risk-free rate of 2%, calculate the expected return that the CAPM attributes to a defensive stock with beta 0.8.
- **13.3** *(intermediate, calculation)* A fund with beta 1.2 made 9% in a year in which the market returned 8% and the risk-free rate was 2%. What was its alpha with respect to the CAPM?
- **13.4** *(advanced, reflection)* A very volatile stock that is almost uncorrelated with the market has, according to the CAPM, an expected return close to the risk-free rate. Why does it make sense, within the model, that such a risky asset offers no premium?

### Going further · Beta and the CAPM more rigorously

#### Assumptions

The CAPM (Sharpe, 1964; Lintner, 1965; Mossin, 1966) rests on strong assumptions: investors who care only about mean and variance over a single period, homogeneous expectations, unlimited lending and borrowing at the risk-free rate, perfectly divisible assets and markets without costs or taxes.

#### Derivation

If all investors have the same expectations, they all choose the same tangency portfolio (chapter 12); in equilibrium supply must equal demand, so the tangency portfolio is the **market portfolio** $M$. The first-order condition of Sharpe maximization is $\boldsymbol\mu - r_f\mathbf{1} = \lambda\,\Sigma\,\mathbf{w}_M$. The $i$-th element of $\Sigma\mathbf{w}_M$ is $\operatorname{Cov}(R_i, R_M)$; multiplying by $\mathbf{w}_M^\top$ gives $\lambda = (\mu_M - r_f)/\sigma_M^2$, and therefore

$$E[R_i] - r_f = \frac{\operatorname{Cov}(R_i, R_M)}{\sigma_M^2}\,\big(E[R_M] - r_f\big) = \beta_i\,\big(E[R_M] - r_f\big).$$

The intuition: what matters about an asset is not its total variance but how much it adds to the risk of the portfolio everyone holds, which is its covariance with the market.

#### Estimating beta

It is estimated by least squares in the **market regression**

$$R_{i,t} - r_{f,t} = \alpha_i + \beta_i\,(R_{M,t} - r_{f,t}) + \varepsilon_{i,t},$$

where $\hat\beta_i = \widehat{\operatorname{Cov}}/\widehat{\operatorname{Var}}$ and, according to the CAPM, $\alpha_i = 0$. Estimated betas tend to revert towards 1 over time (Blume, 1971), so Bayesian adjustments (Vasicek, 1973) or the rule of thumb $\beta_{\text{adj}} = \tfrac23\hat\beta + \tfrac13$ are used. The result depends on the index used as the market, on the frequency and on the estimation window.

#### Empirical evidence

- Black, Jensen and Scholes (1972) and Fama and MacBeth (1973) found a positive relationship between beta and return, but the security market line was **flatter** than predicted: low-beta stocks returned more than the model predicted and high-beta ones less.
- Fama and French (1992) concluded that, once size and the book-to-market ratio are controlled for, beta barely explained the mean returns of US stocks between 1963 and 1990. Their 2004 review sums up that the empirical problems probably invalidate the CAPM in its usual applications.
- Frazzini and Pedersen (2014) explain the flat line by leverage constraints (those who cannot borrow buy high-beta stocks) and document the profits of the *betting against beta* strategy.
- **Roll's critique** (1977): the model's market portfolio includes *all* risky assets (also real estate, human capital, etc.) and is not observable; testing the CAPM with a stock index is, strictly speaking, testing whether that index is mean-variance efficient.

#### Extensions

| Model | Idea |
|---|---|
| Zero-beta CAPM (Black, 1972) | without a risk-free asset, the role of $r_f$ is taken by a portfolio uncorrelated with the market |
| Intertemporal CAPM (Merton, 1973) | investors also hedge against changes in future investment opportunities |
| Arbitrage pricing theory, APT (Ross, 1976) | several systematic risk factors, justified by the absence of arbitrage |
| Fama and French three factors (1993) | market, size (SMB) and value (HML) |
| Carhart four factors (1997) | adds *momentum* |
| Fama and French five factors (2015) | adds operating profitability and investment |

The three-factor model is written

$$R_i - r_f = \alpha_i + \beta_{i}\,(R_M - r_f) + s_i\,\text{SMB} + h_i\,\text{HML} + \varepsilon_i.$$

This line of research is the basis of so-called «factor investing», which builds portfolios deliberately exposed to each of these factors.

#### The factor «zoo» and the replication crisis

Since the nineties hundreds of supposed factors or anomalies have been published (Harvey, Liu and Zhu, 2016, catalogued 316). Since so many have been tried, these authors propose requiring a $t$ statistic above 3, not 2, for a new factor. McLean and Pontiff (2016) found that the mean return of anomalies falls by 26% outside the original sample and by 58% after publication. Hou, Xue and Zhang (2020) failed to replicate about two thirds of 452 anomalies when reducing the weight of the smallest firms, while Jensen, Kelly and Pedersen (2023) argue, with a Bayesian approach, that most factors do replicate when grouped by themes. The $q$ model of Hou, Xue and Zhang (2015), based on investment and profitability, competes with the five-factor one. The practical moral: distrust any factor or strategy that only works in a backtest (supplementary topic A).

#### Practical use

Despite its empirical problems, the CAPM remains the most used method to estimate the cost of equity: in the survey by Graham and Harvey (2001), 73.5% of US chief financial officers said they always or almost always used it. Utility regulators use it to set the allowed return of networks; in Spain, for example, the CNMC applies a weighted average cost of capital (WACC) methodology with the CAPM for the remuneration of electricity and gas networks (Circular 2/2019 and its later revisions).

---

# Part V · Deciding and measuring the extreme

The last part deals with two practical questions. The first is how much to risk when one has an edge: the Kelly criterion (chapter 14) gives a precise answer and shows why risking too much can ruin even someone who has the odds in their favour. The second is how to measure rare but severe losses: chapter 15 shows that real markets produce many more extremes than the normal distribution predicts, and chapter 16 presents value at risk and expected shortfall, the measures used by banks, insurers and supervisors.

---

## Chapter 14 · How much to risk: the Kelly criterion

> **In this chapter** you will learn to calculate the fraction of capital that maximizes the long-run growth of a favourable bet, and why in practice almost everyone bets less.

### The idea

Having an edge is not enough: one must also decide how much to risk. Whoever bets very little wastes their edge and their capital barely grows. Whoever bets too much is exposed to a losing streak, which sooner or later comes, leaving them without capital to carry on. Since each loss reduces the base on which the following bets are calculated, losses weigh more than their probability suggests: it is the volatility drag of chapter 9 in another form.

The **Kelly criterion** answers precisely: when the probabilities are known and winnings are reinvested, there is a fraction of capital that maximizes the long-run growth rate. Betting more than that fraction increases risk and also reduces growth; with small edges, betting twice as much brings it practically to zero.

To understand the criterion it helps to look at the **median** player, the one in the middle of the distribution of outcomes, and not at the average. With aggressive bets, average wealth can be enormous thanks to a few very lucky players, while most end up ruined.

### A worked example

A player has a biased coin that comes up heads 53% of the time and always bets on heads, at even odds: if they win, they receive the amount bet; if they lose, they lose it. On each play they risk a fixed fraction $f$ of their capital. What fraction suits them?

With the formula derived below, the Kelly fraction is $f^* = 2 \times 0.53 - 1 = 6\%$. The table shows the log growth rate per play, $g(f)$, and the factor by which median wealth is multiplied after 1,000 plays, $e^{1000\,g(f)}$:

| Fraction bet | 3% | 6% (Kelly) | 12% | 15% |
|---|---|---|---|---|
| Growth per play | 0.00135 | 0.00180 | −0.00002 | −0.00231 |
| Median wealth after 1,000 plays | ×3.9 | ×6.1 | ×0.98 | ×0.10 |

Betting half Kelly keeps about three quarters of the growth with much less fluctuation. Betting twice Kelly (12%) leaves the median player practically where they started (×0.98), even though each play has a positive expected value. And above twice Kelly, in this example, the median player gets poorer.

### Formalization

Let $p$ be the probability of winning, $1 - p$ that of losing and $b$ the net gain per euro bet when winning ($b = 1$ for even odds). If the fraction $f$ of capital is bet on each play, the mean log growth rate per play is

$$g(f) = p\,\ln(1 + b f) + (1 - p)\,\ln(1 - f).$$

Differentiating and setting it to zero gives the fraction that maximizes it:

$$f^{*} = p - \frac{1 - p}{b}, \qquad \text{and with } b = 1, \quad f^{*} = 2p - 1.$$

If $f^* \le 0$, the bet is not favourable and the optimum is not to bet. For investments with mean return $\mu$, volatility $\sigma$ and risk-free rate $r$, the continuous version of the criterion is $f^* = (\mu - r)/\sigma^2$, derived in the Going further section.

### Interactive chart

> **Interactive chart · The size of the bet.** Sliders for the probability of winning (from 0.50 to 0.70), the payoff $b$ (from 0.5 to 5) and the fraction bet (from 0% to 50%). Left panel: the growth curve $g(f)$, with its maximum at the Kelly fraction marked and the negative growth zone shaded in red; the point of the chosen fraction moves along the curve. Right panel: 1,000 simulated players who start with €100 and play 1,000 times with the chosen fraction; the paths of the median, of the 10th and 90th percentiles and of mean wealth are shown on a log scale, together with the percentage of players who end below €10. What the reader should observe: beyond the Kelly fraction, the median gets worse even though the mean keeps rising; with small edges, as one approaches twice Kelly, median growth disappears.

### In Python

```python
import math

def crecimiento(f, p, b=1.0):
    return p * math.log(1 + b * f) + (1 - p) * math.log(1 - f)

def fraccion_kelly(p, b=1.0):
    return max(0.0, p - (1 - p) / b)

f = fraccion_kelly(0.53)                     # 0.06
for x in (f / 2, f, 2 * f, 2.5 * f):
    g = crecimiento(x, 0.53)
    print(f"{x:.0%}  g = {g:.5f}  median wealth x{math.exp(1000 * g):.2f}")
```

### In practice

- Many professional investors and bettors who use the criterion bet a fraction of Kelly, often half, because their probabilities are estimates and erring on the high side is much costlier than erring on the low side.
- Some quantitative managers use versions of the criterion to decide the total leverage of a strategy from its expected return and its volatility.
- The criterion also serves as a common-sense upper limit: a position larger than Kelly's, given the estimated edge, is not only risky but reduces the long-run growth rate (that of median wealth).

### Exercises

- **14.1** *(basic, calculation)* An even-odds bet wins with probability 0.58. What fraction of capital does the Kelly criterion recommend?
- **14.2** *(intermediate, calculation)* A bet pays 3 to 1 ($b = 3$) and wins with probability 0.3. Calculate the Kelly fraction and the growth rate with full Kelly and with half Kelly. What proportion of the growth does half Kelly keep?
- **14.3** *(advanced, calculation)* An asset has an expected excess return of 5% a year and a volatility of 20%. According to the continuous version of the criterion, what fraction of capital should be invested in it? What excess growth rate is obtained with full Kelly and with half Kelly?

### Going further · The Kelly criterion more rigorously

#### Derivation

With a bet that pays $b$ per unit with probability $p$ and loses the unit with probability $q = 1 - p$, betting the fraction $f$ of wealth each time, after $n$ bets with $k$ wins we have $W_n = W_0 (1 + bf)^k (1 - f)^{n-k}$. By the law of large numbers, $k/n \to p$ and the growth rate per bet converges to

$$g(f) = \lim_{n\to\infty}\frac1n \ln\frac{W_n}{W_0} = p\ln(1 + bf) + q\ln(1 - f).$$

Differentiating: $g'(f) = \dfrac{pb}{1 + bf} - \dfrac{q}{1 - f} = 0 \Rightarrow f^* = \dfrac{pb - q}{b} = p - \dfrac{q}{b}$. Since $g''(f) < 0$, it is a maximum. The formula is often read as «edge divided by odds»: $f^* = (\text{expected gain per unit})/b$. If the edge $pb - q$ is negative or zero, $f^* \le 0$: do not bet.

*Example (the chapter's):* $p = 0.53$, $b = 1$: $f^* = 0.06$ and $g^* = 0.53\ln 1.06 + 0.47\ln 0.94 = 0.0018$ per bet, that is, median wealth is multiplied by $e^{0.0018 \times 1000} \approx 6$ in 1,000 bets.

#### Origin in information theory

John L. Kelly Jr. (1956), at Bell Labs, reached this result by studying a gambler who receives information through a noisy channel: the maximum growth rate of his capital equals the channel's information transmission rate in Shannon's sense (1948). For $b = 1$, $g^* = \ln 2 + p\ln p + q\ln q$, that is, $\ln 2$ minus the entropy (in nats) of the outcome. Latané (1959) independently proposed maximizing the geometric mean, and Breiman (1961) proved its asymptotic properties: the Kelly strategy maximizes long-run wealth against any other «essentially different» strategy and minimizes the expected time to reach a distant goal. Edward Thorp applied it to *blackjack* (*Beat the Dealer*, 1962) and later to investing (Rotando and Thorp, 1992; Thorp, 2006).

#### The shape of the growth curve

For small edges, a Taylor expansion gives $g(f) \approx f\,(pb - q) - \tfrac12 f^2\,m_2$, where $m_2 = E[X^2]$ is the second moment of the outcome of a unit bet (almost equal to its variance when the edge is small): a parabola symmetric around $f^*$. Hence three rules:

- With small edges, betting **twice** Kelly gives approximately **zero** growth (in the example, $g(0.12) = -0.00002$).
- In that approximation, betting more than twice gives **negative** growth: ruin is almost certain in the long run, even though each bet has positive expected value. The chapter's example shows it: with $f = 12\%$, twice Kelly, median wealth after 1,000 bets barely moves (×0.98), and with $f = 15\%$ it is cut to a tenth. In the exact model, the point where growth vanishes depends on $p$ and $b$: with $p = 0.4$ and $b = 5$, Kelly is 28% and betting 56% still gives $g \approx +0.041$ per round.
- In the quadratic approximation, betting the same percentage too little or too much costs *the same* growth. The asymmetry lies in everything else: betting too much multiplies volatility and drawdowns (with $1.5 f^*$ volatility is three times that with $0.5 f^*$, and growth is practically the same), with even-money payoffs, the exact curve falls faster to the right of $f^*$ and, above $2 f^*$, growth becomes negative; with large payoffs and low probability, not always. Since the real edge is usually overestimated, erring on the low side is the prudent option.

#### Continuous version and several assets

For an asset that follows a geometric Brownian motion with mean $\mu$, volatility $\sigma$ and risk-free rate $r$, the fraction that maximizes growth is

$$f^* = \frac{\mu - r}{\sigma^2}, \qquad g^* = r + \frac{(\mu - r)^2}{2\sigma^2} = r + \tfrac12\,\text{SR}^2,$$

and with several assets $\mathbf{f}^* = \Sigma^{-1}(\boldsymbol\mu - r\mathbf{1})$, which is proportional to Markowitz's tangency portfolio (chapter 12). The Kelly criterion coincides with maximizing Bernoulli's logarithmic utility (chapter 3) and is myopic: the optimal decision does not depend on the horizon (Merton, 1969).

#### Fractional Kelly

Betting a fraction $c f^*$ with $0 < c \le 1$ gives, in the continuous model, a growth of $c(2 - c)\,g^*_{\text{excess}}$ and a volatility $c$ times that of full Kelly. With half Kelly ($c = 1/2$) 75% of the growth is kept with half the volatility, the result that the solution of exercise 14.2 obtains numerically for a discrete bet ($0.00486/0.00640 \approx 0.76$). Fractional Kelly is equivalent to an isoelastic utility with relative risk aversion $1/c$ (MacLean, Thorp and Ziemba, 2011).

**Drawdowns** matter even with full Kelly. In the continuous model with a zero risk-free rate (or measuring wealth discounted at the risk-free rate), the probability that wealth ever falls to a fraction $x$ of its *initial* value is $x$ with full Kelly and $x^{2/c - 1}$ with fractional Kelly (Thorp, 2006). With full Kelly there is a 50% probability of reaching half the initial capital at some point; with half Kelly, 12.5%. With a positive rate and nominal wealth, these probabilities are lower. This is not the same as a 50% fall from an earlier peak (topic E), which is more likely: a portfolio that goes from 100 to 200 and back to 100 never drops below half its initial capital, but it does fall 50% from its peak.

#### Criticisms and limitations

- Samuelson (1979), in an article deliberately written in words of one syllable, pointed out that maximizing growth is not the same as maximizing expected utility for an investor who does not have logarithmic utility, however long the horizon.
- In practice $p$, $\mu$ and $\sigma$ are estimated with error; if the edge is overestimated, one bets too much, with the consequences described above. This is the main reason for using fractions such as half Kelly.

---

## Chapter 15 · Fat tails

> **In this chapter** you will learn to measure the weight of the tails of a distribution, to recognize when the normal distribution underestimates extremes and what consequences this has for risk management.

### The idea

According to the normal distribution, moves of more than four or five standard deviations should be so rare that nobody would see one in their whole professional life. In real markets they appear with some regularity. The distributions of daily returns of stocks, currencies or commodities have **fat tails**: they concentrate more probability in the extremes (and also near the centre) than a normal with the same volatility, at the expense of the intermediate zone.

The classic measure of the weight of the tails is **kurtosis**, which averages the fourth power of the deviations from the mean. When raised to the fourth power, extreme values weigh far more than moderate ones, so kurtosis is, in practice, an indicator of the frequency and size of extremes. The normal has kurtosis 3; daily returns usually exceed that value comfortably.

### A worked example

An index with a daily volatility of 1.1% falls 6.6% in one session, a fall of six standard deviations. What frequency would a normal model assign to it?

The probability that a normal ends up more than six standard deviations below its mean is $\Phi(-6) \approx 9.9 \times 10^{-10}$. With 252 sessions a year, that amounts to one such session every $1/(252 \times 9.9 \times 10^{-10}) \approx 4$ million years. Yet falls of that size have been observed several times in recent decades in the major indices. If the same volatility is combined with a fat-tailed distribution, such as a Student $t$ with 4 degrees of freedom rescaled to have the same standard deviation, the probability rises to $5.3 \times 10^{-4}$: one such session roughly every seven and a half years. The volatility is the same; what changes is the shape of the tail.

### Formalization

Let $X$ be a return with mean $\mu$ and standard deviation $\sigma$. Its **skewness** and its kurtosis are

$$\gamma = \frac{E\big[(X - \mu)^3\big]}{\sigma^3}, \qquad \kappa = \frac{E\big[(X - \mu)^4\big]}{\sigma^4}.$$

Skewness is negative when the left tail (the losses) is longer than the right one. For the normal, $\gamma = 0$ and $\kappa = 3$; many programs report the **excess kurtosis**, $\kappa - 3$, which is 0 for the normal. A distribution with $\kappa > 3$ is called leptokurtic.

For the normal, the probability of falling more than $k$ standard deviations below the mean is $\Phi(-k)$: 2.3% for $k = 2$, 0.13% for $k = 3$, $3.2 \times 10^{-5}$ for $k = 4$ and $2.9 \times 10^{-7}$ for $k = 5$. Those figures drop very fast; in fat-tailed distributions, much more slowly.

### Interactive chart

> **Interactive chart · What the bell curve does not see.** A slider chooses the degrees of freedom of a Student $t$ (from 3 to 30) rescaled to have the same daily volatility (1%) as a reference normal. Top panel: fifty years of simulated daily returns with each model, one above the other, with horizontal lines at ±4% to count the days that exceed them; with 4 degrees of freedom one can expect about 60 such days, against fewer than one with the normal. Bottom panel: the probability of exceeding each threshold, on a log scale, for the two models: the normal curve plummets and the fat-tailed one descends like a straight line. A box shows the sample kurtosis of each simulation. What the reader should observe: as the degrees of freedom fall, extreme days appear much more often, and the sample kurtosis jumps from one simulation to another.

### In Python

```python
import numpy as np
from statistics import NormalDist

def curtosis(x):
    x = np.asarray(x)
    return np.mean((x - x.mean())**4) / x.var()**2

print(NormalDist().cdf(-6))                       # 9.9e-10

rng = np.random.default_rng(8)
nu = 4
t = rng.standard_t(nu, 12_600) * np.sqrt((nu - 2) / nu)   # unit variance
normal = rng.standard_normal(12_600)
print(curtosis(normal), curtosis(t))              # ~3 against a much larger value
print((np.abs(normal) > 4).sum(), (np.abs(t) > 4).sum())
```

### In practice

- The fat tails of daily returns are considered one of the best documented «stylized facts» of financial markets, present in almost every asset and period.
- Modern risk models replace the normal with fat-tailed distributions, historical simulation or extreme value theory, and are complemented with stress tests against severe scenarios.
- In option markets, options that protect against sharp falls trade at higher prices than a normal would imply, a sign that participants assign more probability to extremes than the bell curve does.

### Exercises

- **15.1** *(basic, calculation)* If daily returns were normal, how often could one expect a fall of more than four standard deviations, with 252 sessions a year?
- **15.2** *(intermediate, calculation)* A return takes the values ±1% with probability 0.45 each and ±4% with probability 0.05 each. Calculate its mean, its variance and its kurtosis. Does it have fatter tails than the normal?
- **15.3** *(intermediate, calculation)* With a $t$ with 4 degrees of freedom rescaled to the same volatility, the probability of a move of more than four standard deviations in either direction is 0.48% per session. How many such sessions can be expected a year? How many times more than with the normal?
- **15.4** *(advanced, reflection)* A normal model calibrated with a daily volatility of 1% observes a 7% fall in one day. What conclusion would you draw about the model?

### Going further · Fat tails more rigorously

#### Higher-order moments

**Skewness** $\gamma_1 = E[(X - \mu)^3]/\sigma^3$ measures whether one tail is longer than the other (stock index returns usually have negative skewness: large falls are more frequent than large rises). **Kurtosis** $\kappa = E[(X - \mu)^4]/\sigma^4$ measures the weight of the tails. Westfall (2014) made clear that, despite the traditional explanation, kurtosis says almost nothing about the «peakedness» of the centre: it is dominated almost entirely by the extreme observations.

**Jarque–Bera normality test** (1980): with sample skewness $S$ and sample kurtosis $K$,

$$JB = \frac{n}{6}\left(S^2 + \frac{(K - 3)^2}{4}\right) \;\sim\; \chi^2_2 \text{ under normality}.$$

With daily stock returns, normality is rejected overwhelmingly.

#### Power tails and why sample kurtosis is unstable

Empirical evidence (Gopikrishnan *et al.*, 1999; Gabaix *et al.*, 2003) indicates that the tails of returns behave like a power law,

$$P(|X| > x) \sim C\,x^{-\alpha}, \qquad \alpha \approx 3$$

(the «inverse cubic law»). A moment of order $k$ is only finite if $k < \alpha$. With $\alpha \approx 3$ the variance exists, but the **fourth moment is infinite**: theoretical kurtosis does not exist and sample kurtosis does not converge, but grows with the sample size and depends on a few extreme days. This can be checked with the chapter's interactive chart: with a $t$ with 4 degrees of freedom (whose theoretical kurtosis is infinite) and 50 years of daily data, six simulations with different seeds gave sample kurtoses between 9 and 36. Those figures should be read as «very fat tails», not as a stable parameter. If $\alpha$ is somewhat above 4, kurtosis exists, but its sample estimator remains very unstable, because its variance depends on the eighth moment.

The tail index is estimated with the **Hill estimator** (1975): ordering $|X|$ from largest to smallest, $X_{(1)} \ge X_{(2)} \ge \cdots$,

$$\hat\alpha_k = \left(\frac1k\sum_{i=1}^{k}\ln\frac{X_{(i)}}{X_{(k+1)}}\right)^{-1},$$

using only the $k$ most extreme observations.

#### Fat-tailed models

- **Student $t$** with $\nu$ degrees of freedom (Praetz, 1972; Blattberg and Gonedes, 1974): power tails with $\alpha = \nu$, variance $\nu/(\nu - 2)$ and excess kurtosis $6/(\nu - 4)$ for $\nu > 4$. To give it unit variance it is multiplied by $\sqrt{(\nu - 2)/\nu}$; with $\nu = 6$, as in the code of the practical project at the end (`GRADOS_LIBERTAD = 6`), the excess kurtosis is 3.
- **Mixtures and stochastic volatility**: a normal whose variance changes over time (for example, a GARCH with normal innovations, chapter 7) produces fat tails in the unconditional distribution. Much of the observed fat tails is explained by volatility clustering.
- **Jumps**: Merton's jump-diffusion model (1976) adds Poisson jumps to Brownian motion.
- **Stable distributions** (Mandelbrot, 1963; Fama, 1965): power tails with $\alpha < 2$ and infinite variance. Today they are considered too extreme for returns, but they were the first serious challenge to normality.

#### Extreme value theory

To study only the tail, two limit results are used (Embrechts, Klüppelberg and Mikosch, 1997):

- **Fisher–Tippett–Gnedenko**: the normalized maxima of i.i.d. samples, if they converge, do so to a generalized extreme value distribution (GEV).
- **Pickands–Balkema–de Haan**: excesses over a high threshold approximately follow a generalized Pareto distribution (GPD), $G_{\xi,\beta}(y) = 1 - (1 + \xi y/\beta)^{-1/\xi}$, with $\xi = 1/\alpha$.

McNeil and Frey (2000) combine a GARCH for volatility with a GPD for the residuals, a standard approach to estimating extreme VaR and ES.

#### A historical example

On 19 October 1987 («Black Monday») the Dow Jones index fell 22.6% in a single session. With a previous daily volatility of the order of 1%, it was a move of more than 20 standard deviations, with a normal probability below $3 \times 10^{-89}$: a model that assigns that probability to an observed event is clearly wrong. Since then, the implied volatilities of index options show a persistent «smile» or skew: deep out-of-the-money put options are more expensive than the normal would imply (Rubinstein, 1994).

#### Practical consequences

With fat tails, extreme quantiles are larger than normal ones for the same volatility. A simple correction is the **Cornish–Fisher expansion** (1938) of the normal quantile $z$:

$$z_{CF} = z + \frac{(z^2 - 1)\,S}{6} + \frac{(z^3 - 3z)(K - 3)}{24} - \frac{(2z^3 - 5z)\,S^2}{36},$$

useful when deviations from normality are moderate. With very fat tails, extreme value theory or simulation with fat-tailed models is preferable.

---

## Chapter 16 · Value at risk and expected shortfall

> **In this chapter** you will learn to calculate and interpret the value at risk and the expected shortfall of a portfolio, to check whether a risk model works and to know its limitations.

### The idea

A risk manager needs to sum up in one figure how much a portfolio can lose in a bad period. **Value at risk** (VaR) does it like this: it fixes a horizon (one day, ten days, one year) and a **confidence level** (for example, 99%), and looks for the loss that is only exceeded with the remaining probability (1%). A 99% daily VaR of €50,000 means that, under the model's normal conditions, the loss of a day should exceed €50,000, on average, only one day in a hundred.

It is important to understand what VaR does not say. It is not the maximum possible loss: it is the threshold beyond which the worst cases begin, and it says nothing about how much is lost once it is crossed. Two portfolios with the same VaR can have very different worst days. **Expected shortfall** (ES), also called conditional VaR, completes the information: it is the average loss in that worst 1% of cases (with continuous distributions, the average loss when VaR is exceeded).

### A worked example

A portfolio is worth €250,000 and its daily returns follow a normal with zero mean and volatility of 1.2%. The standard deviation of the daily loss is $0.012 \times 250{,}000 = 3{,}000$ euros.

| Measure | Multiple of the standard deviation | Amount |
|---|---|---|
| VaR at 95% | 1.645 | €4,935 |
| VaR at 99% | 2.326 | €6,979 |
| ES at 97.5% | 2.338 | €7,013 |
| ES at 99% | 2.665 | €7,996 |

If returns instead followed a $t$ with 4 degrees of freedom with the same volatility, the 99% VaR would rise to $2.65 \times 3{,}000 = 7{,}948$ euros and the 99% ES to $3.69 \times 3{,}000 = 11{,}075$ euros. VaR rises by 14%; expected shortfall, by 39%. That is precisely the information VaR hides.

### Formalization

Let $L$ be the loss of the portfolio over the chosen horizon and $c$ the confidence level. If the loss distribution is continuous, VaR is the loss that is only exceeded with probability $1 - c$:

$$P\big(L > \text{VaR}_c\big) = 1 - c,$$

that is, the $c$ quantile of the loss distribution. In that continuous case, expected shortfall is the average loss when VaR is exceeded, $\text{ES}_c = E\big[L \mid L \ge \text{VaR}_c\big]$ (the Going further section gives the general definition, which also holds for discrete losses). If returns are normal with zero mean and volatility $\sigma$ over the chosen horizon, and the portfolio is worth $V$,

$$\text{VaR}_c = z_c\,\sigma\,V, \qquad \text{ES}_c = \frac{\varphi(z_c)}{1 - c}\,\sigma\,V,$$

where $z_c = \Phi^{-1}(c)$ is the quantile of the standard normal and $\varphi$ its density. To go from one day to $h$ days one usually multiplies by $\sqrt{h}$, with the caveats of chapter 4.

### Interactive chart

> **Interactive chart · The threshold and what lies behind it.** Top panel: the distribution of daily profits and losses of the example portfolio, with controls for the confidence level (from 90% to 99.9%) and for the model (normal or Student $t$ with adjustable degrees of freedom). A vertical line marks the VaR and the tail area is shaded, with an arrow at its centre of gravity, the expected shortfall; both values are shown in euros. Bottom panel: ten years of daily losses simulated with the fat-tailed model, with the normal VaR line and the exceptions marked in red; a counter compares the observed exceptions with the expected ones and applies the Kupiec test described in the Going further section. What the reader should observe: with fat tails, the normal VaR is exceeded more often than expected, and the gap between VaR and expected shortfall widens.

### In Python

```python
from statistics import NormalDist

def var_es_normal(valor, sigma, c):
    z = NormalDist().inv_cdf(c)
    var = z * sigma * valor
    es = NormalDist().pdf(z) / (1 - c) * sigma * valor
    return var, es

for c in (0.95, 0.975, 0.99):
    var, es = var_es_normal(250_000, 0.012, c)
    print(f"{c:.1%}: VaR €{var:,.0f}   ES €{es:,.0f}")
```

### In practice

- International banking rules based market risk capital for years on a ten-day VaR at a 99% confidence level; the revised framework replaces it with an expected shortfall at 97.5%.
- In the European Union, the Solvency II regime requires insurers to hold enough capital to cover the losses of one year with a confidence level of 99.5%, that is, an annual VaR at 99.5%.
- Institutions compare each day's actual loss with the previous day's VaR to check whether the model works; too many exceptions force a review and can increase the capital required.

### Exercises

- **16.1** *(basic, calculation)* A portfolio of 2 million euros has normal daily returns with zero mean and volatility of 0.8%. Calculate its one-day 99% VaR and, with the square-root-of-time rule, its ten-day VaR.
- **16.2** *(intermediate, calculation)* Calculate the one-day 99% expected shortfall of the same portfolio.
- **16.3** *(intermediate, calculation)* A bank observes 7 exceptions of its 99% daily VaR in 250 days. Which zone of the Basel traffic light system does it fall in? If the model were correct, what probability would there be of observing 7 or more exceptions?
- **16.4** *(advanced, reflection)* Why has the banking regulator replaced the 99% VaR with the 97.5% expected shortfall in the revised market risk framework, if under normality both figures are almost equal?

### Going further · Value at risk more rigorously

#### Formal definitions

Let $L$ be the loss over the chosen horizon and $\alpha \in (0,1)$ the confidence level (the chapter's $c$).

$$\text{VaR}_\alpha(L) = \inf\{\ell \in \mathbb{R} : P(L > \ell) \le 1 - \alpha\}, \qquad \text{ES}_\alpha(L) = \frac{1}{1-\alpha}\int_\alpha^1 \text{VaR}_u(L)\,du.$$

VaR is a quantile of the loss distribution; ES (also called CVaR or *tail VaR*) is the average of the quantiles above $\alpha$ and, for continuous distributions, coincides with $E[L \mid L \ge \text{VaR}_\alpha]$. For a normal loss with mean $\mu_L$ and standard deviation $\sigma_L$,

$$\text{VaR}_\alpha = \mu_L + \sigma_L\,\Phi^{-1}(\alpha), \qquad \text{ES}_\alpha = \mu_L + \sigma_L\,\frac{\varphi\big(\Phi^{-1}(\alpha)\big)}{1 - \alpha}.$$

With $\alpha = 99\%$: $\Phi^{-1}(0.99) = 2.326$ and ES equals $2.665\,\sigma_L$, the chapter's values.

That is why it is misleading to describe VaR as «the maximum expected loss»: it is the *minimum* loss within the worst $1 - \alpha$ of scenarios, and it says nothing about how much larger it can become.

#### Calculation methods

1. **Parametric (variance-covariance)**, popularized by RiskMetrics (1996): for a portfolio, $\text{VaR} = z_\alpha\sqrt{\mathbf{w}^\top\Sigma\mathbf{w}}\,V$. Fast, but it inherits the normal assumption.
2. **Historical simulation**: the market changes observed over the last $n$ days are applied to the current portfolio and the empirical quantile is taken. It assumes no distribution, but only knows the recent past. **Filtered historical simulation** (Barone-Adesi, Giannopoulos and Vosper, 1999) rescales the scenarios with the current volatility estimated by GARCH.
3. **Monte Carlo** (chapter 6): the risk factors are simulated with a model and the whole portfolio is revalued; essential with options and other non-linear positions.

**Risk allocation.** For measures that are homogeneous of degree 1, such as parametric VaR or ES, Euler's theorem makes it possible to split total risk among positions: $\rho(\mathbf{w}) = \sum_i w_i\,\partial\rho/\partial w_i$. Each term is the **contribution** of position $i$.

#### Coherent measures: why ES is preferable

Artzner, Delbaen, Eber and Heath (1999) proposed four axioms for a risk measure $\rho$: monotonicity, translation invariance, positive homogeneity and **subadditivity**, $\rho(L_1 + L_2) \le \rho(L_1) + \rho(L_2)$ (diversifying should not increase risk). VaR is not subadditive in general.

*Counterexample.* Two independent bonds each lose 100 with probability 4%. The 95% VaR of each one is 0, because the probability of loss (4%) is less than 5%. The portfolio with both suffers some loss with probability $1 - 0.96^2 = 7.84\%$, so its 95% VaR is 100: $\text{VaR}(L_1 + L_2) = 100 > 0 = \text{VaR}(L_1) + \text{VaR}(L_2)$. Here VaR penalizes diversification.

ES is coherent (Acerbi and Tasche, 2002) and can be optimized as a linear programming problem (Rockafellar and Uryasev, 2000). Its drawback is statistical: it is not **elicitable** on its own (Gneiting, 2011), which complicates comparing forecasts, although it is jointly with VaR (Fissler and Ziegel, 2016).

#### Backtesting

If the model is correct, the number of exceptions $x$ in $T$ days follows a binomial $\text{Bin}(T, 1 - \alpha)$. **Kupiec's test** (1995) compares the observed frequency $\hat p = x/T$ with the theoretical one $p = 1 - \alpha$:

$$LR_{\text{POF}} = -2\ln\!\left[\frac{(1-p)^{T-x}\,p^{x}}{(1-\hat p)^{T-x}\,\hat p^{\,x}}\right] \;\sim\; \chi^2_1.$$

*Example:* if a 99% VaR records 41 exceptions in 2,500 days, when 25 were expected, one gets $LR \approx 8.67$, above the critical value 3.84 (5% level): the model is rejected, with a $p$-value of 0.003. Christoffersen (1998) added a test of the **independence** of exceptions, which should not cluster in time. The 1996 Basel framework classifies models by the exceptions of a 99% VaR in 250 days: green zone from 0 to 4, yellow from 5 to 9 and red with 10 or more.

#### Regulation

- **Banking**: the 1996 Basel amendment introduced the 10-day 99% VaR with a minimum multiplier of 3; Basel 2.5 (2009) added «stressed VaR» after the financial crisis; the fundamental review of the trading book (FRTB; BCBS, 2016 and 2019) replaces the 99% VaR with the **97.5% ES**, which under normality is almost equal ($2.338\sigma$ against $2.326\sigma$) but sensitive to the shape of the tail. In the EU, Regulation (EU) 2024/1623 (CRR3) incorporates the FRTB, but its application as a capital requirement has been postponed until 2027, with transitional adjustments adopted in 2026.
- **Insurance**: the Solvency II Directive (2009/138/EC, art. 101) sets the solvency capital requirement as the VaR of basic own funds over one year with a confidence level of 99.5%. The revision in Directive (EU) 2025/2, applicable from January 2027, keeps that level and recalibrates other elements, such as the risk margin.

#### Limitations

VaR and ES depend on the model, the horizon and the data; they ignore liquidity risk and can be procyclical (low in calm periods, high in crises, when everyone sells at once). Danielsson (2002) warned that risk models calibrated in quiet periods fail precisely when they are needed. That is why they are complemented with **stress tests** (extreme but plausible scenarios) and with the judgement of managers.

---

# Five supplementary topics

The sixteen chapters cover the statistical foundations of the discipline. The following five topics, shorter, complete the journey with questions that arise as soon as one moves from theory to application: how to evaluate a strategy without fooling oneself, how much trading costs, how an option is valued, how equilibrium relationships between prices are modelled and how drawdowns are measured.

## Topic A · Backtesting and overfitting

A **backtest** simulates a strategy with past data. It is the most used tool for deciding whether an idea works, and also the easiest to fool. Classic mistakes:

- **Look-ahead bias**: using information that was not available on the date of the decision, such as accounting results published weeks later or the closing price to trade at that same close.
- **Survivorship bias** (chapter 1): testing the strategy only with companies that exist today.
- **Ignoring costs** (topic B).
- **Overfitting**: trying many variants and keeping the best one.

The last one is the most treacherous. If $N$ independent strategies without any skill are tried, the maximum observed Sharpe ratio grows slowly with $N$: for large $N$, of the order of $\sqrt{2\ln N}$ times its standard error, an approximation that overstates it somewhat for moderate $N$ (with $N = 100$ it gives 3.0, and the exact expected value is 2.5). *Example:* with 5 years of data, the standard error of an annual Sharpe ratio is $\approx\sqrt{1/5} = 0.45$ (chapter 8). The best of 100 purely random strategies will have, on average, a Sharpe ratio of $0.45 \times 2.5 \approx 1.1$, a value that would look excellent. If the strategies are similar variants, what counts is the effective number of independent tests, which is smaller.

Good practices:

1. Split the data into training, validation and test sets, and touch the test sample only once.
2. Validate walk-forward: estimate with data up to $t$, test on the following period and shift the window. Random cross-validation does not work with time series; if cross-validation is used, it must be with purging and embargo of nearby observations (López de Prado, 2018).
3. Record how many trials have been made and correct for it: deflated Sharpe ratio (Bailey and López de Prado, 2014), probability of backtest overfitting (Bailey, Borwein, López de Prado and Zhu, 2017) or the $t > 3$ threshold of Harvey, Liu and Zhu (2016).
4. Demand an economic explanation of why the strategy should work, not just a good result.

## Topic B · Transaction costs, liquidity and market impact

Every trade costs money: commissions, half the bid-ask **spread** and **market impact**, that is, the adverse price movement caused by the order itself. The annual cost of a strategy is approximately its **turnover** (the value traded per year divided by that of the portfolio) times the cost of each trade.

*Example:* a strategy that trades ten times the value of its portfolio each year, with a cost of 0.20% per trade, loses 2% a year. If before costs it returned 5% above the risk-free rate with a volatility of 10% (Sharpe 0.5), after costs its Sharpe ratio falls to 0.3.

Impact grows with the size of the order in a concave way. Empirical evidence supports a **square-root law of impact**:

$$\text{impact} \approx Y\,\sigma_{\text{day}}\sqrt{\frac{Q}{V}},$$

where $Q$ is the size of the order, $V$ the daily traded volume, $\sigma_{\text{day}}$ the daily volatility and $Y$ a constant of the order of 1 (Almgren *et al.*, 2005; Bouchaud *et al.*, 2018). An order of 1% of the daily volume in a stock with a daily volatility of 2% moves the price by about 0.2%. Spreading large orders over time reduces impact but increases the risk that the price moves in the meantime; Almgren and Chriss (2001) solved this trade-off.

**Liquidity** is also a risk: in a crisis, the spread widens and impact increases precisely when everyone wants to sell. Classic VaR ignores it (chapter 16), which is why the FRTB assigns longer liquidity horizons to less liquid factors.

## Topic C · From expected value to options: the binomial tree

The binomial tree (Cox, Ross and Rubinstein, 1979) is the simplest bridge between expected value (chapter 3) and option pricing. In one period, a stock worth $S_0$ comes to be worth $uS_0$ or $dS_0$, with $d < 1 + r < u$ so that there is no arbitrage. An option that pays $V_u$ or $V_d$ can be **replicated** by buying $\Delta$ shares and borrowing the rest:

$$\Delta = \frac{V_u - V_d}{(u - d)\,S_0}, \qquad q = \frac{1 + r - d}{u - d}, \qquad V_0 = \frac{q\,V_u + (1 - q)\,V_d}{1 + r}.$$

| Symbol | Meaning |
|---|---|
| $\Delta$ | the number of shares in the portfolio that replicates the option |
| $q$ | the risk-neutral probability of an up move |
| $r$ | the risk-free rate for the period |
| $V_0$ | the price of the option today |

*Example:* $S_0 = 100$ euros, $u = 1.2$, $d = 0.8$, $r = 5\%$ and a call option with strike price €100, which pays $V_u = 20$ euros or $V_d = 0$. Then $q = 0.25/0.4 = 0.625$ and $V_0 = 0.625 \times 20/1.05 = 11.90$ euros. Check: buying $\Delta = 0.5$ shares costs €50, financed by borrowing $0.5 \times 80/1.05 = 38.10$ euros; the net cost, €11.90, is the price of the option.

The surprising thing is that the real probability of an up move does not appear: the price comes from replication, not from preferences. $q$ is the probability of an up move under the risk-neutral measure $Q$ of chapter 3. Chaining many periods with $u = e^{\sigma\sqrt{\Delta t}}$ and $d = 1/u$, the tree converges to the Black–Scholes formula (chapter 6). A useful relationship that does not depend on the price model, only on the absence of arbitrage, is **put-call parity**: for European call and put options with the same strike and maturity, on a stock that pays no dividends, $C - P = S_0 - K e^{-rT}$. With a continuous dividend yield $\delta$, $S_0$ is replaced by $S_0 e^{-\delta T}$. American options, which can be exercised early, do not satisfy this exact equality. Here, as in the Black–Scholes formula, $r$ is the continuously compounded rate; in the tree, $1 + r$ was the one-period factor.

**The Black–Scholes formula.** If the stock price follows the geometric Brownian motion of chapter 4, with constant volatility $\sigma$, and one can trade without costs and borrow at rate $r$, the limit of the tree gives the price of a European call option (Black and Scholes, 1973):

$$C = S_0\,N(d_1) - K e^{-rT}\,N(d_2), \qquad d_1 = \frac{\ln(S_0/K) + \left(r + \tfrac12\sigma^2\right)T}{\sigma\sqrt{T}}, \qquad d_2 = d_1 - \sigma\sqrt{T}.$$

| Symbol | Meaning |
|---|---|
| $C$ | the price of the call option today |
| $S_0$ | the price of the stock today |
| $K$ | the strike price |
| $T$ | the time to expiry, in years |
| $r$ | the risk-free rate, continuously compounded |
| $\sigma$ | the annual volatility of the stock |
| $N(\cdot)$ | the distribution function of the standard normal (chapter 5) |

The price of the put option follows from put-call parity: $P = K e^{-rT}\,N(-d_2) - S_0\,N(-d_1)$.

*Example:* with $S_0 = K = 100$ euros, $r = 3\%$, $\sigma = 20\%$ and $T = 1$ year, $d_1 = (0 + 0.05)/0.2 = 0.25$ and $d_2 = 0.05$. Then $N(d_1) = 0.5987$, $N(d_2) = 0.5199$ and $C = 100 \times 0.5987 - 97.04 \times 0.5199 = 59.87 - 50.46 = 9.41$ euros, the same value approximated by the simulation of chapter 6. The put is worth $P = 9.413 - 100 + 97.045 = 6.46$ euros.

The formula reads like the tree's replication: $N(d_1)$ is the **delta**, the number of shares in the portfolio that replicates the option (0.60 in the example), and $K e^{-rT} N(d_2)$ is what is borrowed. $N(d_2)$ is the probability, under the risk-neutral measure, that the option ends in the money. As in the tree, the expected return of the stock does not appear: only volatility matters.

The assumptions are strong. Volatility is not constant (chapter 7) and returns have fat tails and jumps (chapter 15), so the market uses the formula backwards: it quotes each option by the volatility that reproduces its price, the implied volatility, and the «smile» of those volatilities sums up where the model goes wrong.

## Topic D · Stationarity and cointegration

A series is **stationary** if its statistical behaviour does not change over time: in the strict sense, the joint distribution of any group of observations does not change when they are shifted in time; in the weak sense, it is enough for the mean to be constant and for the covariance between two observations to depend only on the distance between them. The prices of most assets are not (their variance grows over time, chapter 4), while their returns usually are, approximately, something worth testing in each case; that is why statistics is done with returns (chapter 10). The Dickey–Fuller test (1979) checks whether a series has a **unit root**, like the random walk, which is the best-known case.

In the classical case, two prices integrated of order one, $I(1)$ (non-stationary, but with stationary increments, like a random walk), are **cointegrated** if some non-trivial linear combination of them, $s_t = P^A_t - \beta P^B_t$ with $\beta \ne 0$, is stationary, $I(0)$ (Engle and Granger, 1987): they can drift apart, but they tend to return to their relationship. This is the basis of **pairs trading**. Cointegration and correlation are different things: two assets can have highly correlated returns and prices that separate without limit, or the other way round.

If the spread follows an autoregressive process $s_t = \phi\,s_{t-1} + \varepsilon_t$ with $0 < \phi < 1$, its reversion **half-life** is $\ln 2/(-\ln\phi)$. *Example:* with a daily $\phi = 0.95$, the half-life is about 13.5 days. Cointegration relationships often break down (mergers, business changes), so they must be re-estimated and losses limited.

## Topic E · Maximum drawdown

The **drawdown** at $t$ measures how much the portfolio has lost since its previous peak, and the **maximum drawdown** is the worst of the whole period:

$$DD_t = 1 - \frac{W_t}{\max_{s \le t} W_s}, \qquad MDD = \max_t DD_t.$$

In Python:

```python
import numpy as np

W = np.array([100, 108, 103, 115, 92, 97, 121])    # portfolio value
dd = 1 - W / np.maximum.accumulate(W)               # drawdown at each date
print(dd.max())                                     # maximum drawdown: 0.20 (from 115 to 92)
```

Recovering from a drawdown $D$ requires a rise of $D/(1 - D)$: 25% after losing 20%, and 100% after losing 50% (chapter 1). Many investors judge a strategy by its maximum drawdown more than by its volatility, and the **Calmar ratio** divides the compound annual growth rate by the maximum drawdown. They must be compared carefully: the expected maximum drawdown grows with the length of the sample (Magdon-Ismail *et al.*, 2004), so a longer series will almost always have a worse maximum drawdown. Chapter 14 gives a related but different result: in its continuous model with a zero risk-free rate, with full Kelly, the probability of ever reaching half the *initial* capital is 50%. It is not the probability of a 50% fall from a peak, which is higher.

---

# Practical project · Portfolio lab

The best way to consolidate what you have learned is to build a complete tool. This project proposes programming, in phases, a small portfolio lab: generating a history of returns from known assumptions, estimating the inputs from it, building several portfolios, projecting their future by simulation and measuring their extreme risks. Since the data are simulated from a known «truth», in each phase one can compare what was estimated with what is real, something impossible with market data.

### Phase 1 · Simulated history and first estimates

The following program implements the first phase. It generates a fifteen-year history of monthly data for five assets, with means, volatilities and correlations fixed in advance and with fatter tails than the normal (chapters 10 and 15), estimates the annual mean of each asset with its standard error (chapters 6 and 7) and measures an equal-weight portfolio (chapters 8, 11, 13 and topic E).

```python
"""Portfolio lab · phase 1: simulated history and first estimates."""
import numpy as np

# --- Assumptions of the simulated world (the «truth» we will later try to estimate) ---
ACTIVOS = ["European equities", "World equities", "Government bonds", "Corporate bonds", "Gold"]
MEDIA = np.array([0.065, 0.075, 0.020, 0.030, 0.035])   # mean annual return
VOL = np.array([0.18, 0.16, 0.06, 0.08, 0.15])          # annual volatility
CORR = np.array([
    [1.00, 0.85, -0.05, 0.40, 0.05],
    [0.85, 1.00, -0.10, 0.35, 0.10],
    [-0.05, -0.10, 1.00, 0.55, 0.25],
    [0.40, 0.35, 0.55, 1.00, 0.15],
    [0.05, 0.10, 0.25, 0.15, 1.00],
])
GRADOS_LIBERTAD = 6   # Student t: fatter tails than the normal
MESES = 180           # fifteen years of monthly data
TIPO_SIN_RIESGO = 0.02
SEMILLA = 23


def simular_historia(rng):
    """Monthly returns with given means, volatilities and correlations and fat tails."""
    cov_mensual = CORR * np.outer(VOL, VOL) / 12
    chol = np.linalg.cholesky(cov_mensual)
    normales = rng.standard_normal((MESES, len(ACTIVOS))) @ chol.T
    # Normal/chi-square mixture: multivariate t rescaled to unit variance
    nu = GRADOS_LIBERTAD
    escala = np.sqrt((nu - 2) / rng.chisquare(nu, size=(MESES, 1)))
    return MEDIA / 12 + normales * escala


def estimar(r):
    """Annual mean and volatility of each asset, with the standard error of the mean."""
    t = r.shape[0]
    media = 12 * r.mean(axis=0)
    vol = np.sqrt(12) * r.std(axis=0, ddof=1)
    error_media = 12 * r.std(axis=0, ddof=1) / np.sqrt(t)
    return media, vol, error_media, np.corrcoef(r, rowvar=False)


def medir_cartera(r, pesos, referencia):
    """Return, volatility, Sharpe, beta and maximum drawdown of a portfolio rebalanced monthly."""
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

    print("ANNUAL ESTIMATES (15 years of monthly data)")
    print(f"{'asset':<18}{'mean':>8}{'± error':>9}{'volat.':>8}{'(true)':>8}")
    for i, nombre in enumerate(ACTIVOS):
        print(f"{nombre:<18}{media[i]:8.2%}{error[i]:9.2%}{vol[i]:8.2%}{MEDIA[i]:8.2%}")
    print(f"estimated correlation Europe-world: {corr[0, 1]:.2f} (true {CORR[0, 1]:.2f})")

    pesos = np.full(len(ACTIVOS), 1 / len(ACTIVOS))
    m, v, sr, beta, dd = medir_cartera(r, pesos, referencia=1)
    print("\nEQUAL-WEIGHT PORTFOLIO (20% in each asset)")
    print(f"mean return          {m:7.2%}")
    print(f"volatility           {v:7.2%}")
    print(f"Sharpe ratio         {sr:7.3f}")
    print(f"beta (world eq.)     {beta:7.3f}")
    print(f"maximum drawdown     {dd:7.2%}")


if __name__ == "__main__":
    main()
```

With seed 23, the output is:

```text
ANNUAL ESTIMATES (15 years of monthly data)
asset                 mean  ± error  volat.  (true)
European equities    9.64%    4.23%  16.38%   6.50%
World equities       7.38%    4.40%  17.03%   7.50%
Government bonds     0.78%    1.33%   5.16%   2.00%
Corporate bonds      3.11%    1.97%   7.64%   3.00%
Gold                -1.79%    4.53%  17.54%   3.50%
estimated correlation Europe-world: 0.83 (true 0.85)

EQUAL-WEIGHT PORTFOLIO (20% in each asset)
mean return            3.82%
volatility             8.73%
Sharpe ratio           0.209
beta (world eq.)       0.436
maximum drawdown      14.12%
```

The table already contains the most important lesson of the project. Volatilities and the correlation are estimated quite precisely, but the means are not: that of European equities comes out at 9.6% when the true one is 6.5%, and that of gold negative when the true one is positive. The standard errors, between 1.3 and 4.5 points, warn that fifteen years of data are not enough to tell a mean return of 3% from one of 7% with confidence. An optimizer fed with these means would concentrate the money in European equities for a purely statistical reason (chapter 12).

### Next phases

Each phase reuses the functions of the previous ones. For each one the chapters it relies on are indicated.

1. **Uncertainty of the estimates** (chapters 6, 7 and 10). Resample the months of the history with replacement (*bootstrap*) a thousand times and obtain the distribution of the estimated means, volatilities and correlation. Compare the width of those distributions with the theoretical standard errors.
2. **Optimized portfolios** (chapters 11 and 12). Calculate the minimum variance portfolio and the maximum Sharpe ratio portfolio, fully invested, without short sales and with a maximum of 35% per asset. Then simulate a second independent history with the same base seed plus one and check how they behave out of sample against the equal-weight portfolio.
3. **Ten-year projection** (chapters 4, 6 and 9). For each portfolio, simulate 10,000 ten-year paths with fat tails and obtain the median, the 5th and 95th percentiles of final wealth, the median compound growth rate and the distribution of the maximum drawdown.
4. **Extreme risk** (chapters 15 and 16). Calculate the monthly VaR and expected shortfall at 97.5% and 99% of each portfolio in three ways: with the normal formula, with the simulated history and with the paths of the previous phase. Apply the Kupiec test to the normal VaR on the history.
5. **Report** (chapters 8, 13 and 16). Summarize in a table, for each portfolio, the mean return, the volatility, the Sharpe ratio with its standard error, the beta against world equities, the maximum drawdown, the VaR and the expected shortfall. Add a paragraph that interprets the results and points out which figures are reliable and which are not.

---

# Solutions to the exercises

Each solution starts with the result and then explains the reasoning. It is worth attempting each exercise before reading it.

## Part I

**1.1 −12% simple return and −12.78% log return; recovering requires +13.64%.**
$R = 110/125 - 1 = -0.12$ and $r = \ln 0.88 = -0.1278$. To get back to €125 from €110 one needs $125/110 - 1 = 0.1364$. As always, the rise needed is larger than the fall suffered.

**1.2 Cumulative +14.91%; equivalent constant annual rate 4.74%; arithmetic mean 5.00%.**
$1.08 \times 0.95 \times 1.12 = 1.14912$. The equivalent constant rate is the geometric mean, $1.14912^{1/3} - 1 = 0.0474$. The arithmetic mean, $(8 - 5 + 12)/3 = 5\%$, is larger, as always happens when the returns are not all equal (chapter 9).

**1.3 Because the value of the portfolio is the sum of the values of its parts, and that translates into a weighted average of simple returns.**
With €100 split 50/50, at the end one has $50 \times 1.3 + 50 \times 0.9 = 110$ euros: 10%, which is $0.5 \times 30\% + 0.5 \times (-10\%)$. If the log returns were averaged, $0.5\ln 1.3 + 0.5\ln 0.9 = 0.0785$, one would get 8.17% when undoing the logarithm, which is not what the portfolio has earned. The correct log return of the portfolio is $\ln 1.10 = 0.0953$.

**2.1 €2,898.19, of which €23.19 come from compound interest.**
$2{,}500 \times 1.03^5 = 2{,}898.19$. Total interest is €398.19; with simple interest it would be $5 \times 75 = 375$ euros.

**2.2 €15,841.87 at 6% and €18,476.91 at 2%.**
$20{,}000/1.06^4 = 15{,}841.87$ and $20{,}000/1.02^4 = 18{,}476.91$. The lower the rate, the more the same future payment is worth today.

**2.3 The annual instalment is €3,464.62.**
The five instalments form a level annuity whose present value must be €15,000: $C\,[1 - 1.05^{-5}]/0.05 = 15{,}000$, so $C = 15{,}000 \times 0.05/(1 - 1.05^{-5}) = 3{,}464.62$ euros. In total €17,323.11 are paid, of which €2,323.11 are interest.

## Part II

**3.1 The expected prize of a ticket is €1.25; the expected net gain, −€1.75. The organizer takes in €3,500.**
The prizes add up to $1{,}500 + 10 \times 100 = 2{,}500$ euros shared among 2,000 tickets: €1.25 per ticket. Subtracting the price, $1.25 - 3 = -1.75$ euros. The organizer collects €6,000 and pays out €2,500.

**3.2 The expected loss is €36, and the insurance applies a 25% loading.**
$0.04 \times 900 = 36$ euros, and $45/36 - 1 = 0.25$. Taking it out may be reasonable because a sudden loss of €900 can be much more painful than paying a certain €45: with a concave utility (Going further of chapter 3), the insured person prefers a certain cost somewhat higher than the expected loss.

**3.3 Once, perhaps; ten times in a row betting everything, almost certainly not.**
The expected value of wealth after one play is $0.5 \times 2.2 = 1.1$ times the initial wealth, +10%. But with 50% probability everything is lost. After ten plays betting everything, expected wealth is $1.1^{10} = 2.59$ times the initial wealth, and yet something is kept only with probability $0.5^{10} \approx 0.1\%$: the expected value is propped up by a single scenario in a thousand. Expected value ignores ruin and risk aversion; the Kelly criterion (chapter 14) would recommend risking only $0.5 - 0.5/1.2 = 8.3\%$ of wealth on each play.

**4.1 The expected price is €21, and the probability of ending above €20 is 68.3%.**
Each step has mean $0.6 - 0.4 = 0.2$ euros, so $E[S_5] = 20 + 5 \times 0.2 = 21$. With $k$ up moves the price is $15 + 2k$, which exceeds 20 if $k \ge 3$: $P = \binom53 0.6^3 0.4^2 + \binom54 0.6^4 0.4 + 0.6^5 = 0.3456 + 0.2592 + 0.0778 = 0.6826$.

**4.2 7.22% monthly and 1.57% daily.**
$25\% \times \sqrt{21/252} = 25\%/\sqrt{12} = 7.22\%$ and $25\%/\sqrt{252} = 1.57\%$.

**4.3 400 sessions are needed; the probability of a negative result is then 15.9%.**
The cumulative expected gain is $0.05\% \times n$ and the standard deviation $1\% \times \sqrt{n}$. Setting them equal, $\sqrt{n} = 20$ and $n = 400$. At that point the cumulative result is one standard deviation above zero, and $P(Z < -1) = 15.9\%$. Even with a real edge, more than a year and a half of sessions leaves an appreciable probability of being behind.

**4.4 It is not rare: in a long balanced walk, it happens roughly one time in seven.**
By the arcsine law, the probability that a symmetric walk spends more than 95% of the time above its origin is approximately $1 - \frac{2}{\pi}\arcsin\sqrt{0.95} \approx 14\%$, and that it spends more than 95% of the time on the same side, twice as much, about 29%. A long spell on one side of the starting point is typical in a random walk, not the exception; it proves no trend.

**5.1 About 34.5% of years.**
$P(R < 0) = \Phi\big((0 - 6)/15\big) = \Phi(-0.4) = 0.345$: roughly one year in three, despite a clearly positive mean.

**5.2 8.1% of years below −15%; 95% of years between −23.4% and +35.4%.**
$\Phi\big((-15 - 6)/15\big) = \Phi(-1.4) = 0.081$. The interval is $6 \pm 1.96 \times 15$.

**5.3 About 10%.**
The sum of 12 dice has mean $12 \times 3.5 = 42$ and variance $12 \times 35/12 = 35$, with standard deviation 5.92. With the continuity correction, $P(S \ge 50) \approx P\big(Z > (49.5 - 42)/5.92\big) = P(Z > 1.27) = 10.2\%$. The exact value, counting combinations, is 10.4%.

**5.4 There are at least three objections.**
First: the theorem is about sums of many independent terms, and a single day's return is not made up of many small independent effects; it is often dominated by a single piece of news. Second: even if a sum approaches the normal in the centre, the approximation is much worse in the tails, which are precisely what matters when measuring extreme losses (the Going further of chapter 5 quantifies the speed of convergence). Third: daily returns are not independent, because their volatility clusters in time, and they have fat tails (chapter 15).

**6.1 40,000 scenarios are needed.**
To divide the error by 4 one must multiply $\sqrt{M}$ by 4, that is, $M$ by 16: $16 \times 2{,}500 = 40{,}000$.

**6.2 A standard error of 0.016 with 10,000 points; for 0.001 about 2.7 million points would be needed.**
The estimate is $4\hat p$, with standard error $4\sqrt{p(1-p)/M}$. With $p = 0.7854$, $p(1-p) = 0.1686$ and $4\sqrt{0.1686/10{,}000} = 0.0164$. For an error of 0.001, $M = 16 \times 0.1686/0.001^2 \approx 2.7$ million.

**6.3 To be able to reproduce and verify the results; and repeat with other seeds to measure how much they depend on chance.**
Once the seed is fixed, the generator always produces the same series of numbers and anyone who runs the code gets identical figures, which makes it possible to debug errors and compare versions of the code. But a single seed is a single experiment: repeating it with several shows the variability of the estimates and avoids presenting a lucky result as definitive.

**6.4 The interval goes from 6.51% to 7.51% and contains the theoretical 6.80%.**
$\text{SE} = \sqrt{0.0701 \times 0.9299/10{,}000} = 0.0026$, and $7.01\% \pm 1.96 \times 0.26\%$ gives $[6.51\%,\ 7.51\%]$.

## Part III

**7.1 Mean 0%, daily volatility 1.26% and annual 20.1%.**
The five returns add up to 0. The squared deviations are 1.44, 0.16, 0.64, 4.00 and 0.16, which add up to 6.4. Dividing by $N - 1 = 4$ gives 1.6, whose square root is 1.26%. Annualized: $1.26\% \times \sqrt{252} = 20.1\%$.

**7.2 10.4% a year, which corresponds to market risk class 3.**
$3\% \times \sqrt{12} = 10.39\%$, which falls in the band from 5% to 12%, the third of the seven classes.

**7.3 Because volatility changes over time and tends to cluster.**
Quiet periods are often followed by turbulent ones, and vice versa (Going further of chapter 7). A volatility estimated in calm times can fall far short if a crisis arrives. That is why estimates that give more weight to recent data are used, measures implied by option prices are monitored and models are complemented with stress scenarios.

**8.1 F2, with a ratio of 0.50 against 0.39.**
$(8 - 2.5)/14 = 0.39$ and $(5 - 2.5)/5 = 0.50$.

**8.2 280% of capital must be invested in F2, and one gets 9.5% against F1's 8%.**
To match the 14% volatility with a 5% fund one needs a fraction $w = 14/5 = 2.8$: for each euro of one's own, €2.80 are invested in F2, borrowing €1.80 at 2.5%. The expected return is $2.5 + 2.8 \times (5 - 2.5) = 9.5\%$, one and a half points more than F1 with the same risk, and the Sharpe ratio is still 0.50. This is the advantage of choosing the highest ratio, as long as borrowing at the risk-free rate is realistic.

**8.3 About 0.87.**
$0.25 \times \sqrt{12} = 0.87$: excess return is multiplied by 12 and volatility by $\sqrt{12}$.

**8.4 No: the $t$ statistic is 1.56, below 1.96.**
$\text{SE} \approx \sqrt{(1 + 0.5 \times 0.6^2)/8} = \sqrt{0.1475} = 0.384$, and $0.6/0.384 = 1.56$. With eight annual data points one cannot rule out that the true ratio is zero.

**9.1 Arithmetic mean +10%; cumulative return −4%.**
$(60 - 40)/2 = 10\%$, but $1.6 \times 0.6 = 0.96$.

**9.2 About 5.9% with 15% volatility and 2.5% with 30% volatility (log rates; as compound rates, 6.05% and 2.53%).**
$7 - \tfrac12 \times 15^2/100 = 7 - 1.125 = 5.875\%$ and $7 - \tfrac12 \times 30^2/100 = 7 - 4.5 = 2.5\%$. As compound rates, $e^{0.05875} - 1 = 6.05\%$ and $e^{0.025} - 1 = 2.53\%$. Doubling volatility quadruples the drag.

**9.3 The index grows at around 4.4% a year and the tripled product at only 3.4%.**
Index: $6 - \tfrac12 \times 0.18^2 \times 100 = 4.38\%$. Product: $3 \times 6 - \tfrac12 \times 9 \times 0.18^2 \times 100 = 18 - 14.58 = 3.42\%$. Despite tripling the mean return, it grows less than the index, because the drag is multiplied by nine.

## Part IV

**10.1 The correlation is 0.24.**
$0.009/(0.15 \times 0.25) = 0.009/0.0375 = 0.24$.

**10.2 The correlation is exactly −1.**
The data satisfy $Y = 3\% - X$ in every month, so they move in perfect opposition. Check: the means are 1% and 2%; the deviations of X are 0, 2, −2 and 0, and those of Y, 0, −2, 2 and 0. The covariance is $(0 - 4 - 4 + 0)/3 = -8/3$ and both variances equal $8/3$, so $\rho = (-8/3)/(8/3) = -1$.

**10.3 Not necessarily: the correlation between prices that grow over time can be high without meaning.**
Two trending series have highly correlated levels even if their monthly movements are independent; this is the problem of spurious correlations (Going further of chapter 10). To measure the benefit of combining them one must correlate their returns, not their prices.

**11.1 The portfolio has a volatility of 10%.**
With independent assets only the specific part remains: $\sigma_p^2 = 0.30^2/9 = 0.01$, and $\sigma_p = 10\%$.

**11.2 13.6% with ten assets; the minimum attainable is 12.6%.**
$\sigma_p^2 = 0.04 \times (0.1 + 0.9 \times 0.4) = 0.0184$, and $\sigma_p = 13.6\%$. The floor is $0.20 \times \sqrt{0.4} = 12.6\%$. With correlation 0.4, the first ten assets have already removed almost all diversifiable risk.

**11.3 About 3.1 effective assets, against 5 with equal weights.**
$\sum w_i^2 = 0.25 + 0.04 + 3 \times 0.01 = 0.32$, and $1/0.32 = 3.125$. The concentration in the first asset makes the portfolio behave as if it had little more than three equally weighted assets.

**12.1 60% in the first asset and 40% in the second.**
With $\rho = -1$, the formula gives $w^* = (0.0324 + 0.0216)/(0.0144 + 0.0324 + 0.0432) = 0.054/0.09 = 0.6$, that is, $\sigma_2/(\sigma_1 + \sigma_2) = 18/30$. Check: $0.6 \times 12\% - 0.4 \times 18\% = 0$.

**12.2 Return of 6.5%, volatility of 11% and Sharpe ratio of 0.41, higher than that of A (0.33) and that of B (0.35).**
$\mu_p = 0.5 \times 4 + 0.5 \times 9 = 6.5\%$. $\sigma_p^2 = 0.25 \times 0.0036 + 0.25 \times 0.04 + 2 \times 0.25 \times 0.2 \times 0.06 \times 0.20 = 0.0121$, and $\sigma_p = 11\%$. Ratios: $(6.5 - 2)/11 = 0.41$, $(4 - 2)/6 = 0.33$ and $(9 - 2)/20 = 0.35$. The combination rewards risk better than either of its components.

**12.3 Because the optimizer amplifies the errors in the estimated means.**
With five years of data, the standard error of a mean annual return is around the volatility divided by $\sqrt5$: several percentage points (Going further of chapter 7). The optimizer interprets any overestimated mean as an opportunity and concentrates the money in it; that is why it has been described as an «error maximizer». Such a concentrated portfolio probably reflects statistical noise, not a real edge; it is advisable to shrink the means, impose limits or use portfolios that do not depend on them (Going further of chapter 12 and the practical project).

**13.1 Beta 1.05; a fall of 3.15% can be expected.**
$\beta = 0.7 \times 24/16 = 1.05$ and $1.05 \times (-3\%) = -3.15\%$, on average; the actual day may deviate because of specific risk.

**13.2 6% a year.**
$2 + 0.8 \times (7 - 2) = 6\%$.

**13.3 An alpha of −0.2 points.**
The return required by the CAPM was $2 + 1.2 \times (8 - 2) = 9.2\%$. The fund made 9%, so $\alpha = 9 - 9.2 = -0.2\%$: it earned more than the market, but less than its market risk justified.

**13.4 Because its risk disappears almost completely within a diversified portfolio.**
An investor who holds the market portfolio barely notices that stock's own volatility: it is offset by that of many others. What the stock adds to the risk of their portfolio depends on its covariance with the market, which is almost zero. If the stock offered a premium, everyone would want to buy it, its price would rise and its expected return would fall until the premium was eliminated.

## Part V

**14.1 16% of capital.**
$f^* = 2 \times 0.58 - 1 = 0.16$.

**14.2 Kelly recommends 6.67%; half Kelly keeps about 76% of the growth.**
$f^* = 0.3 - 0.7/3 = 0.0667$. With full Kelly, $g = 0.3\ln(1 + 3 \times 0.0667) + 0.7\ln(1 - 0.0667) = 0.00640$ per bet; with half Kelly ($f = 0.0333$), $g = 0.00486$. The ratio is 0.76.

**14.3 125% of capital, that is, with leverage; excess growth is 3.1% with full Kelly and 2.3% with half Kelly.**
$f^* = 0.05/0.20^2 = 1.25$. The optimal excess growth is $\tfrac12\,\text{SR}^2 = \tfrac12 \times 0.25^2 = 3.125\%$; with half Kelly ($f = 62.5\%$) 75% is kept: 2.34%.

**15.1 Roughly once every 125 years.**
$\Phi(-4) = 3.17 \times 10^{-5}$ per session; per year, $252 \times 3.17 \times 10^{-5} = 0.008$, that is, about once every 125 years.

**15.2 Mean 0, variance 2.5 (%²) and kurtosis 4.24: yes, fatter tails than the normal.**
By symmetry the mean is 0. $E[X^2] = 0.9 \times 1 + 0.1 \times 16 = 2.5$ and $E[X^4] = 0.9 \times 1 + 0.1 \times 256 = 26.5$. The kurtosis is $26.5/2.5^2 = 4.24 > 3$. The ±4% moves, although they only occur 10% of the time, dominate the fourth moment.

**15.3 About 1.2 sessions a year, about 76 times more than with the normal.**
$252 \times 0.0048 = 1.21$. With the normal, the probability of exceeding four standard deviations in either direction is $2 \times 3.17 \times 10^{-5} = 6.3 \times 10^{-5}$, that is, 0.016 sessions a year (one every 63 years). The ratio is $1.21/0.016 \approx 76$.

**15.4 That the model is misspecified.**
A fall of seven standard deviations has, under the normal, a probability of $\Phi(-7) \approx 1.3 \times 10^{-12}$: once every 3 billion years or so. It is much more reasonable to conclude that the normal does not describe the tails, that the 1% volatility was underestimated or had changed, or both, than to believe one has witnessed an event that rare.

**16.1 A one-day VaR of about €37,222 and a ten-day VaR of about €117,705.**
$2.3263 \times 0.008 \times 2{,}000{,}000 = 37{,}222$ euros. Over ten days, $37{,}222 \times \sqrt{10} = 117{,}705$ euros, assuming independent and normal daily returns.

**16.2 An expected shortfall of about €42,643.**
$\varphi(2.3263)/0.01 = 2.6652$, and $2.6652 \times 16{,}000 = 42{,}643$ euros.

**16.3 Yellow zone; the probability of 7 or more exceptions with a correct model is 1.4%.**
The yellow zone goes from 5 to 9 exceptions. With a correct model, the number of exceptions follows a binomial $\text{Bin}(250,\ 0.01)$, with mean 2.5, and $P(X \ge 7) = 1.37\%$. It is a warning sign, though not definitive proof.

**16.4 Because expected shortfall looks inside the tail and is a coherent measure.**
VaR only says where the tail begins, so two portfolios with very different tails can have the same VaR; expected shortfall averages the losses in the tail and penalizes fat tails. Moreover, it is subadditive: it never punishes diversification, something VaR can do (Going further of chapter 16). The 97.5% level was chosen so that, under normality, the requirement would be similar to that of the 99% VaR ($2.338\sigma$ against $2.326\sigma$), so the change only tightens the requirement when tails are fat.

---

# Formula summary

| Concept | Formula | Ch. |
|---|---|---|
| Simple return | $R = P_1/P_0 - 1$ | 1 |
| Log return | $r = \ln(P_1/P_0) = \ln(1 + R)$ | 1 |
| Chaining periods | $1 + R_{0,T} = \prod_t (1 + R_t)$, $\quad r_{0,T} = \sum_t r_t$ | 1 |
| Gain that recovers a loss $L$ | $L/(1 - L)$ | 1 |
| Future value | $FV = PV\,(1 + i)^T$ | 2 |
| Present value of a stream of payments | $PV = \sum_t C_t/(1 + i)^t$ | 2 |
| Level annuity | $PV = C\,[1 - (1+i)^{-T}]/i$; if $i = 0$, $PV = C\,T$ | 2 |
| Expected value | $E[X] = \sum_k p_k x_k$ | 3 |
| Random walk | $S_n = S_0 + \sum_{i=1}^{n} X_i$, $\quad E[S_n] = S_0 + n\mu$ | 4 |
| Variance | $\operatorname{Var}(X) = E[(X - \mu)^2]$ | 4 |
| Square-root-of-time rule | $\sigma_n = \sigma\sqrt{n}$ | 4 |
| Standardization | $z = (x - \mu)/\sigma$, $\quad P(X \le x) = \Phi(z)$ | 5 |
| Normal density | $f(x) = \frac{1}{\sigma\sqrt{2\pi}}\,e^{-(x-\mu)^2/(2\sigma^2)}$ | 5 |
| Monte Carlo standard error | $\text{SE} = s/\sqrt{M}$ | 6 |
| Sample volatility | $\hat\sigma = \sqrt{\frac{1}{N-1}\sum_t (r_t - \bar r)^2}$ | 7 |
| Annualizing volatility | $\sigma_{\text{annual}} = \hat\sigma\sqrt{h}$ | 7 |
| Sharpe ratio | $\text{SR} = (\mu - r_f)/\sigma$ | 8 |
| Log growth (approx.) | $g \approx \mu - \tfrac12\sigma^2$; compound rate $G = e^{g} - 1$ | 9 |
| Covariance | $\operatorname{Cov}(X, Y) = E[(X - \mu_X)(Y - \mu_Y)]$ | 10 |
| Correlation | $\rho = \operatorname{Cov}(X, Y)/(\sigma_X\sigma_Y)$ | 10 |
| Variance of two assets | $\sigma_p^2 = w_1^2\sigma_1^2 + w_2^2\sigma_2^2 + 2w_1w_2\rho\sigma_1\sigma_2$ | 11 |
| $N$ identical assets | $\sigma_p^2 = \sigma^2\,[1/N + (1 - 1/N)\rho]$ | 11 |
| Minimum variance (two assets) | $w^* = \dfrac{\sigma_2^2 - \rho\sigma_1\sigma_2}{\sigma_1^2 + \sigma_2^2 - 2\rho\sigma_1\sigma_2}$ | 12 |
| Beta | $\beta_i = \operatorname{Cov}(R_i, R_m)/\sigma_m^2 = \rho_{im}\sigma_i/\sigma_m$ | 13 |
| CAPM | $E[R_i] = r_f + \beta_i\,(E[R_m] - r_f)$ | 13 |
| Growth of a bet | $g(f) = p\ln(1 + bf) + (1 - p)\ln(1 - f)$ | 14 |
| Kelly fraction | $f^* = p - (1 - p)/b$; $\quad$ continuous: $f^* = (\mu - r)/\sigma^2$ | 14 |
| Kurtosis | $\kappa = E[(X - \mu)^4]/\sigma^4$ (normal: 3) | 15 |
| Normal VaR | $\text{VaR}_c = z_c\,\sigma\,V$ | 16 |
| Normal expected shortfall | $\text{ES}_c = \varphi(z_c)\,\sigma\,V/(1 - c)$ | 16 |

Quantiles of the standard normal worth remembering: $z_{0.95} = 1.645$; $z_{0.975} = 1.960$; $z_{0.99} = 2.326$; $z_{0.995} = 2.576$.

---

# Glossary

Terms with the chapter or topic where they are defined.

| Term | Definition | Ch. |
|---|---|---|
| **alpha** | mean return of an asset above the one that corresponds to it according to its beta | 13 |
| **annualizing** | converting a measure from another frequency (daily, monthly) to an annual basis | 7 |
| **skewness** | measure of whether one tail of the distribution is longer than the other | 15 |
| **backtest** | simulation of a strategy with historical data | A |
| **beta** | sensitivity of an asset's return to that of the market | 13 |
| **maximum drawdown** | largest loss from a previous peak over a period | E |
| **CAPM** | capital asset pricing model: expected return grows linearly with beta | 13 |
| **portfolio** | set of investments held at the same time | 11 |
| **market portfolio** | portfolio that contains all risky assets in proportion to their value | 13 |
| **minimum variance portfolio** | combination of assets with the lowest possible volatility | 12 |
| **cointegration** | relationship between non-stationary prices (in the usual case, integrated of order one) with some stationary linear combination | D |
| **tails** | regions of a distribution corresponding to extreme values | 5 |
| **fat tails** | property of a distribution with more probability in the extremes than the normal | 15 |
| **correlation** | normalized covariance, between −1 and +1, that measures the linear relationship between two variables | 10 |
| **covariance** | expected value of the product of the deviations of two variables from their means | 10 |
| **kurtosis** | standardized fourth moment; measures the weight of the tails (3 for the normal) | 15 |
| **expected shortfall** | average loss in the fraction of worst cases set by the confidence level; with continuous distributions, the average loss when value at risk is exceeded | 16 |
| **delta** | number of shares that replicates an option; in Black–Scholes, $N(d_1)$ for the call | C |
| **drift** | average trend per step of a random walk | 4 |
| **discounting** | calculating the present value of a future payment | 2 |
| **standard deviation** | square root of the variance; typical dispersion around the mean | 4 |
| **normal distribution** | bell-shaped distribution determined by its mean and its standard deviation | 5 |
| **diversification** | spreading money among investments that do not move in perfect sync | 11 |
| **standard error** | standard deviation of an estimator; measures its precision | 6 |
| **discount factor** | value today of one euro payable on a future date | 2 |
| **quantitative finance** | application of probability, statistics and programming to financial markets | Preface |
| **efficient frontier** | set of portfolios with the highest mean return for each volatility | 12 |
| **independent** | variables such that knowing one gives no information about the other | 4 |
| **compound interest** | interest calculated also on the accumulated interest | 2 |
| **law of large numbers** | result by which the average of many independent repetitions approaches the expected value, if it exists | 3 |
| **security market line** | straight line relating beta and expected return in the CAPM | 13 |
| **volatility drag** | difference between the mean return and the compound growth rate | 9 |
| **median (outcome)** | value that leaves half the outcomes below and half above | 14 |
| **confidence level** | probability with which the loss does not exceed the value at risk | 16 |
| **random walk** | process obtained by adding up independent random steps | 4 |
| **percentile** | value below which a given percentage of the outcomes lies | 6 |
| **weight** | proportion of a portfolio's value invested in an asset | 11 |
| **market risk premium** | expected return of the market above the risk-free rate | 13 |
| **Sharpe ratio** | excess return divided by volatility | 8 |
| **square-root-of-time rule** | the standard deviation of a sum of independent steps with the same variance grows with the square root of the number of steps | 4 |
| **return** | change in the value of an investment in proportion to its initial value | 1 |
| **excess return** | return above the risk-free rate | 8 |
| **log return** | natural logarithm of the ratio between the final and the initial value | 1 |
| **specific risk** | part of an asset's risk that can be removed by diversifying | 13 |
| **systematic risk** | part of risk common to all assets, which diversification does not remove | 11 |
| **seed** | initial value of the pseudorandom number generator | 6 |
| **session** | day on which the market opens; about 252 a year | 7 |
| **Monte Carlo simulation** | method that estimates probabilities and expected values by generating many random scenarios | 6 |
| **overfitting** | fitting a strategy or model to the noise in historical data | A |
| **annual percentage rate (APR)** | compound annual rate that sums up the total cost or yield of a transaction | 2 |
| **compound growth rate** | constant return that would produce the same final wealth | 9 |
| **central limit theorem** | result according to which the sum of many independent, identically distributed variables with finite variance, once centred and normalized, tends to the normal | 5 |
| **standardize** | to express a value as its distance from the mean measured in standard deviations | 5 |
| **interest rate** | return paid per unit of time for having money available | 2 |
| **risk-free rate** | return obtained without taking risk, such as that of a Treasury bill | 8 |
| **path** | one of the possible evolutions of a random process | 4 |
| **value at risk (VaR)** | loss that is only exceeded with a given probability over a given horizon | 16 |
| **expected value** | average of the possible values weighted by their probabilities | 3 |
| **present value** | current value of a future payment or stream of payments | 2 |
| **time value of money** | principle according to which, with positive interest rates, having an amount now is preferable to receiving it later | 2 |
| **variance** | average of the squared distance from the mean | 4 |
| **short sale** | sale of a borrowed asset, with the obligation to return it later | 12 |
| **volatility** | standard deviation of returns, usually annualized | 7 |

---
# Epilogue · Where to go next

This book has followed a specific path: from the return of a single asset to the extreme risk of a portfolio, by way of probability, statistics and portfolio theory. Along the way three ideas have appeared that are worth taking with you.

The first is that **chance has structure**. Prices are unpredictable in the short term, but their uncertainty grows regularly with time, is partly offset when assets are combined and can be measured with a few tools.

The second is that **averages mislead**. The mean return overstates growth, expected value ignores ruin, and volatility and VaR say little about the worst days. Almost all serious mistakes in quantitative finance consist in focusing on a single number.

The third is that **every model is a hypothesis**. The normal distribution, independence, stable correlations or the CAPM are useful approximations with known limits. The «Going further» sections try to make those limits clear, together with the empirical evidence that reveals them.

To keep moving forward, the five supplementary topics point in natural directions, and the practical project offers a first piece of work of your own. To go deeper into each area, the bibliography marks the reference textbooks with ★: probability (Feller), financial econometrics (Campbell, Lo and MacKinlay), investment and portfolios (Luenberger), derivatives (Hull; Shreve), simulation (Glasserman) and quantitative risk management (McNeil, Frey and Embrechts; Jorion; Embrechts, Klüppelberg and Mikosch).

---

*All the data in the examples are invented or simulated, and no figure in this text describes a real investment. The content is purely educational and does not constitute financial, investment or any other kind of professional advice.*

---

# Bibliography

Works cited in the «Going further» sections, in alphabetical order. The journal, volume, issue and pages are given so that each reference can be checked. References marked with ★ are textbooks recommended for further study.

### Reference textbooks and monographs

- Bouchaud, J.-P., Bonart, J., Donier, J. and Gould, M. (2018). *Trades, Quotes and Prices: Financial Markets Under the Microscope*. Cambridge University Press.
- ★ Campbell, J. Y., Lo, A. W. and MacKinlay, A. C. (1997). *The Econometrics of Financial Markets*. Princeton University Press.
- ★ Embrechts, P., Klüppelberg, C. and Mikosch, T. (1997). *Modelling Extremal Events for Insurance and Finance*. Springer.
- ★ Feller, W. (1968). *An Introduction to Probability Theory and Its Applications*, vol. 1 (3rd ed.). Wiley.
- Fernholz, E. R. (2002). *Stochastic Portfolio Theory*. Springer.
- ★ Glasserman, P. (2003). *Monte Carlo Methods in Financial Engineering*. Springer.
- ★ Hull, J. C. (2018). *Options, Futures, and Other Derivatives* (10th ed.). Pearson.
- ★ Jorion, P. (2007). *Value at Risk: The New Benchmark for Managing Financial Risk* (3rd ed.). McGraw-Hill.
- López de Prado, M. (2018). *Advances in Financial Machine Learning*. Wiley.
- ★ Luenberger, D. G. (2013). *Investment Science* (2nd ed.). Oxford University Press.
- MacLean, L. C., Thorp, E. O. and Ziemba, W. T. (eds.) (2011). *The Kelly Capital Growth Investment Criterion: Theory and Practice*. World Scientific.
- Markowitz, H. M. (1959). *Portfolio Selection: Efficient Diversification of Investments*. Wiley.
- ★ McNeil, A. J., Frey, R. and Embrechts, P. (2015). *Quantitative Risk Management: Concepts, Techniques and Tools* (revised ed.). Princeton University Press.
- ★ Shreve, S. E. (2004). *Stochastic Calculus for Finance I: The Binomial Asset Pricing Model* and *II: Continuous-Time Models*. Springer.
- Thorp, E. O. (1962). *Beat the Dealer*. Blaisdell (Random House).
- Von Neumann, J. and Morgenstern, O. (1944). *Theory of Games and Economic Behavior*. Princeton University Press.

### Historical works

- Bachelier, L. (1900). Théorie de la spéculation. *Annales scientifiques de l'École Normale Supérieure*, 3rd series, 17, 21–86.
- Bernoulli, D. (1738/1954). Specimen theoriae novae de mensura sortis. English trans.: Exposition of a new theory on the measurement of risk. *Econometrica*, 22(1), 23–36.
- Bernoulli, J. (1713). *Ars Conjectandi*. Basel: Thurneysen.
- Buffon, G.-L. Leclerc, comte de (1777). Essai d'arithmétique morale. *Supplément à l'Histoire naturelle*, vol. 4. Paris: Imprimerie Royale.
- De Moivre, A. (1738). *The Doctrine of Chances* (2nd ed., which includes the 1733 approximation of the binomial by the normal). London.
- Fisher, I. (1930). *The Theory of Interest*. Macmillan.
- Galton, F. (1889). *Natural Inheritance*. Macmillan.
- Gauss, C. F. (1809). *Theoria motus corporum coelestium in sectionibus conicis solem ambientium*. Hamburg: Perthes and Besser.
- Kolmogorov, A. N. (1933). *Grundbegriffe der Wahrscheinlichkeitsrechnung*. Springer.
- Laplace, P.-S. (1812). *Théorie analytique des probabilités*. Paris: Courcier.
- Macaulay, F. R. (1938). *Some Theoretical Problems Suggested by the Movements of Interest Rates, Bond Yields and Stock Prices in the United States since 1856*. National Bureau of Economic Research.
- Pearson, K. (1905). The problem of the random walk. *Nature*, 72, 294.

### Articles

- Acerbi, C. and Tasche, D. (2002). On the coherence of expected shortfall. *Journal of Banking & Finance*, 26(7), 1487–1503.
- Almgren, R. and Chriss, N. (2001). Optimal execution of portfolio transactions. *Journal of Risk*, 3(2), 5–39.
- Almgren, R., Thum, C., Hauptmann, E. and Li, H. (2005). Direct estimation of equity market impact. *Risk*, 18(7), 58–62.
- Andersen, T. G., Bollerslev, T., Diebold, F. X. and Labys, P. (2003). Modeling and forecasting realized volatility. *Econometrica*, 71(2), 579–625.
- Ang, A. and Chen, J. (2002). Asymmetric correlations of equity portfolios. *Journal of Financial Economics*, 63(3), 443–494.
- Anscombe, F. J. (1973). Graphs in statistical analysis. *The American Statistician*, 27(1), 17–21.
- Artzner, P., Delbaen, F., Eber, J.-M. and Heath, D. (1999). Coherent measures of risk. *Mathematical Finance*, 9(3), 203–228.
- Bailey, D. H. and López de Prado, M. (2014). The deflated Sharpe ratio: correcting for selection bias, backtest overfitting, and non-normality. *Journal of Portfolio Management*, 40(5), 94–107.
- Bailey, D. H., Borwein, J., López de Prado, M. and Zhu, Q. J. (2017). The probability of backtest overfitting. *Journal of Computational Finance*, 20(4), 39–69.
- Barone-Adesi, G., Giannopoulos, K. and Vosper, L. (1999). VaR without correlations for portfolios of derivative securities. *Journal of Futures Markets*, 19(5), 583–602.
- Berry, A. C. (1941). The accuracy of the Gaussian approximation to the sum of independent variates. *Transactions of the American Mathematical Society*, 49(1), 122–136.
- Best, M. J. and Grauer, R. R. (1991). On the sensitivity of mean-variance-efficient portfolios to changes in asset means: some analytical and computational results. *Review of Financial Studies*, 4(2), 315–342.
- Black, F. (1972). Capital market equilibrium with restricted borrowing. *Journal of Business*, 45(3), 444–455.
- Black, F. (1976). Studies of stock price volatility changes. *Proceedings of the 1976 Meetings of the American Statistical Association, Business and Economic Statistics Section*, 177–181.
- Black, F., Jensen, M. C. and Scholes, M. (1972). The capital asset pricing model: some empirical tests. In M. C. Jensen (ed.), *Studies in the Theory of Capital Markets* (pp. 79–121). Praeger.
- Black, F. and Litterman, R. (1992). Global portfolio optimization. *Financial Analysts Journal*, 48(5), 28–43.
- Black, F. and Scholes, M. (1973). The pricing of options and corporate liabilities. *Journal of Political Economy*, 81(3), 637–654.
- Blattberg, R. C. and Gonedes, N. J. (1974). A comparison of the stable and Student distributions as statistical models for stock prices. *Journal of Business*, 47(2), 244–280.
- Blume, M. E. (1971). On the assessment of risk. *Journal of Finance*, 26(1), 1–10.
- Bollerslev, T. (1986). Generalized autoregressive conditional heteroskedasticity. *Journal of Econometrics*, 31(3), 307–327.
- Booth, D. G. and Fama, E. F. (1992). Diversification returns and asset contributions. *Financial Analysts Journal*, 48(3), 26–32.
- Box, G. E. P. and Muller, M. E. (1958). A note on the generation of random normal deviates. *Annals of Mathematical Statistics*, 29(2), 610–611.
- Boyle, P. P. (1977). Options: a Monte Carlo approach. *Journal of Financial Economics*, 4(3), 323–338.
- Brandt, M. W., Brav, A., Graham, J. R. and Kumar, A. (2010). The idiosyncratic volatility puzzle: time trend or speculative episodes? *Review of Financial Studies*, 23(2), 863–899.
- Breiman, L. (1961). Optimal gambling systems for favorable games. *Proceedings of the Fourth Berkeley Symposium on Mathematical Statistics and Probability*, vol. 1, 65–78.
- Campbell, J. Y., Lettau, M., Malkiel, B. G. and Xu, Y. (2001). Have individual stocks become more volatile? An empirical exploration of idiosyncratic risk. *Journal of Finance*, 56(1), 1–43.
- Carhart, M. M. (1997). On persistence in mutual fund performance. *Journal of Finance*, 52(1), 57–82.
- Carr, P. and Wu, L. (2009). Variance risk premiums. *Review of Financial Studies*, 22(3), 1311–1341.
- Cheng, M. and Madhavan, A. (2009). The dynamics of leveraged and inverse exchange-traded funds. *Journal of Investment Management*, 7(4), 43–62.
- Chopra, V. K. and Ziemba, W. T. (1993). The effect of errors in means, variances, and covariances on optimal portfolio choice. *Journal of Portfolio Management*, 19(2), 6–11.
- Choueifaty, Y. and Coignard, Y. (2008). Toward maximum diversification. *Journal of Portfolio Management*, 35(1), 40–51.
- Christoffersen, P. F. (1998). Evaluating interval forecasts. *International Economic Review*, 39(4), 841–862.
- Clarke, R., de Silva, H. and Thorley, S. (2006). Minimum-variance portfolios in the U.S. equity market. *Journal of Portfolio Management*, 33(1), 10–24.
- Cont, R. (2001). Empirical properties of asset returns: stylized facts and statistical issues. *Quantitative Finance*, 1(2), 223–236.
- Cornish, E. A. and Fisher, R. A. (1938). Moments and cumulants in the specification of distributions. *Revue de l'Institut International de Statistique*, 5(4), 307–320.
- Cox, J. C., Ross, S. A. and Rubinstein, M. (1979). Option pricing: a simplified approach. *Journal of Financial Economics*, 7(3), 229–263.
- Dalang, R. C., Morton, A. and Willinger, W. (1990). Equivalent martingale measures and no-arbitrage in stochastic securities market models. *Stochastics and Stochastic Reports*, 29(2), 185–201.
- Danielsson, J. (2002). The emperor has no clothes: limits to risk modelling. *Journal of Banking & Finance*, 26(7), 1273–1296.
- Danielsson, J. and Zigrand, J.-P. (2006). On time-scaling of risk and the square-root-of-time rule. *Journal of Banking & Finance*, 30(10), 2701–2713.
- Delbaen, F. and Schachermayer, W. (1994). A general version of the fundamental theorem of asset pricing. *Mathematische Annalen*, 300(1), 463–520.
- DeMiguel, V., Garlappi, L. and Uppal, R. (2009). Optimal versus naive diversification: how inefficient is the 1/N portfolio strategy? *Review of Financial Studies*, 22(5), 1915–1953.
- Dickey, D. A. and Fuller, W. A. (1979). Distribution of the estimators for autoregressive time series with a unit root. *Journal of the American Statistical Association*, 74(366), 427–431.
- Efron, B. (1979). Bootstrap methods: another look at the jackknife. *Annals of Statistics*, 7(1), 1–26.
- Embrechts, P., McNeil, A. J. and Straumann, D. (2002). Correlation and dependence in risk management: properties and pitfalls. In M. A. H. Dempster (ed.), *Risk Management: Value at Risk and Beyond* (pp. 176–223). Cambridge University Press.
- Engle, R. F. (1982). Autoregressive conditional heteroscedasticity with estimates of the variance of United Kingdom inflation. *Econometrica*, 50(4), 987–1007.
- Engle, R. F. (2002). Dynamic conditional correlation: a simple class of multivariate generalized autoregressive conditional heteroskedasticity models. *Journal of Business & Economic Statistics*, 20(3), 339–350.
- Engle, R. F. and Granger, C. W. J. (1987). Co-integration and error correction: representation, estimation, and testing. *Econometrica*, 55(2), 251–276.
- Esseen, C.-G. (1942). On the Liapounoff limit of error in the theory of probability. *Arkiv för Matematik, Astronomi och Fysik*, 28A(9), 1–19.
- Evans, J. L. and Archer, S. H. (1968). Diversification and the reduction of dispersion: an empirical analysis. *Journal of Finance*, 23(5), 761–767.
- Fama, E. F. (1965). The behavior of stock-market prices. *Journal of Business*, 38(1), 34–105.
- Fama, E. F. (1970). Efficient capital markets: a review of theory and empirical work. *Journal of Finance*, 25(2), 383–417.
- Fama, E. F. and French, K. R. (1992). The cross-section of expected stock returns. *Journal of Finance*, 47(2), 427–465.
- Fama, E. F. and French, K. R. (1993). Common risk factors in the returns on stocks and bonds. *Journal of Financial Economics*, 33(1), 3–56.
- Fama, E. F. and French, K. R. (2004). The capital asset pricing model: theory and evidence. *Journal of Economic Perspectives*, 18(3), 25–46.
- Fama, E. F. and French, K. R. (2015). A five-factor asset pricing model. *Journal of Financial Economics*, 116(1), 1–22.
- Fama, E. F. and MacBeth, J. D. (1973). Risk, return, and equilibrium: empirical tests. *Journal of Political Economy*, 81(3), 607–636.
- Fernholz, R. and Shay, B. (1982). Stochastic portfolio theory and stock market equilibrium. *Journal of Finance*, 37(2), 615–624.
- Fissler, T. and Ziegel, J. F. (2016). Higher order elicitability and Osband's principle. *Annals of Statistics*, 44(4), 1680–1707.
- Forbes, K. J. and Rigobon, R. (2002). No contagion, only interdependence: measuring stock market comovements. *Journal of Finance*, 57(5), 2223–2261.
- Frazzini, A. and Pedersen, L. H. (2014). Betting against beta. *Journal of Financial Economics*, 111(1), 1–25.
- Gabaix, X., Gopikrishnan, P., Plerou, V. and Stanley, H. E. (2003). A theory of power-law distributions in financial market fluctuations. *Nature*, 423, 267–270.
- Gatheral, J., Jaisson, T. and Rosenbaum, M. (2018). Volatility is rough. *Quantitative Finance*, 18(6), 933–949.
- Glosten, L. R., Jagannathan, R. and Runkle, D. E. (1993). On the relation between the expected value and the volatility of the nominal excess return on stocks. *Journal of Finance*, 48(5), 1779–1801.
- Gneiting, T. (2011). Making and evaluating point forecasts. *Journal of the American Statistical Association*, 106(494), 746–762.
- Goetzmann, W., Ingersoll, J., Spiegel, M. and Welch, I. (2007). Portfolio performance manipulation and manipulation-proof performance measures. *Review of Financial Studies*, 20(5), 1503–1546.
- Gopikrishnan, P., Plerou, V., Amaral, L. A. N., Meyer, M. and Stanley, H. E. (1999). Scaling of the distribution of fluctuations of financial market indices. *Physical Review E*, 60(5), 5305–5316.
- Graham, J. R. and Harvey, C. R. (2001). The theory and practice of corporate finance: evidence from the field. *Journal of Financial Economics*, 60(2–3), 187–243.
- Granger, C. W. J. and Newbold, P. (1974). Spurious regressions in econometrics. *Journal of Econometrics*, 2(2), 111–120.
- Harrison, J. M. and Kreps, D. M. (1979). Martingales and arbitrage in multiperiod securities markets. *Journal of Economic Theory*, 20(3), 381–408.
- Harrison, J. M. and Pliska, S. R. (1981). Martingales and stochastic integrals in the theory of continuous trading. *Stochastic Processes and their Applications*, 11(3), 215–260.
- Harvey, C. R., Liu, Y. and Zhu, H. (2016). … and the cross-section of expected returns. *Review of Financial Studies*, 29(1), 5–68.
- Hill, B. M. (1975). A simple general approach to inference about the tail of a distribution. *Annals of Statistics*, 3(5), 1163–1174.
- Hou, K., Xue, C. and Zhang, L. (2015). Digesting anomalies: an investment approach. *Review of Financial Studies*, 28(3), 650–705.
- Hou, K., Xue, C. and Zhang, L. (2020). Replicating anomalies. *Review of Financial Studies*, 33(5), 2019–2133.
- Jagannathan, R. and Ma, T. (2003). Risk reduction in large portfolios: why imposing the wrong constraints helps. *Journal of Finance*, 58(4), 1651–1683.
- Jarque, C. M. and Bera, A. K. (1980). Efficient tests for normality, homoscedasticity and serial independence of regression residuals. *Economics Letters*, 6(3), 255–259.
- Jensen, J. L. W. V. (1906). Sur les fonctions convexes et les inégalités entre les valeurs moyennes. *Acta Mathematica*, 30, 175–193.
- Jensen, M. C. (1968). The performance of mutual funds in the period 1945–1964. *Journal of Finance*, 23(2), 389–416.
- Jensen, T. I., Kelly, B. and Pedersen, L. H. (2023). Is there a replication crisis in finance? *Journal of Finance*, 78(5), 2465–2518.
- Kelly, J. L. (1956). A new interpretation of information rate. *Bell System Technical Journal*, 35(4), 917–926.
- Kendall, M. G. (1938). A new measure of rank correlation. *Biometrika*, 30(1/2), 81–93.
- Kirby, C. and Ostdiek, B. (2012). It's all in the timing: simple active portfolio strategies that outperform naïve diversification. *Journal of Financial and Quantitative Analysis*, 47(2), 437–467.
- Kritzman, M., Page, S. and Turkington, D. (2010). In defense of optimization: the fallacy of 1/N. *Financial Analysts Journal*, 66(2), 31–39.
- Kupiec, P. H. (1995). Techniques for verifying the accuracy of risk measurement models. *Journal of Derivatives*, 3(2), 73–84.
- Laloux, L., Cizeau, P., Bouchaud, J.-P. and Potters, M. (1999). Noise dressing of financial correlation matrices. *Physical Review Letters*, 83(7), 1467–1470.
- Latané, H. A. (1959). Criteria for choice among risky ventures. *Journal of Political Economy*, 67(2), 144–155.
- Ledoit, O. and Wolf, M. (2004). Honey, I shrunk the sample covariance matrix. *Journal of Portfolio Management*, 30(4), 110–119.
- Li, D. X. (2000). On default correlation: a copula function approach. *Journal of Fixed Income*, 9(4), 43–54.
- Lindeberg, J. W. (1922). Eine neue Herleitung des Exponentialgesetzes in der Wahrscheinlichkeitsrechnung. *Mathematische Zeitschrift*, 15, 211–225.
- Lintner, J. (1965). The valuation of risk assets and the selection of risky investments in stock portfolios and capital budgets. *Review of Economics and Statistics*, 47(1), 13–37.
- Lo, A. W. (2002). The statistics of Sharpe ratios. *Financial Analysts Journal*, 58(4), 36–52.
- Lo, A. W. and MacKinlay, A. C. (1988). Stock market prices do not follow random walks: evidence from a simple specification test. *Review of Financial Studies*, 1(1), 41–66.
- Longin, F. and Solnik, B. (2001). Extreme correlation of international equity markets. *Journal of Finance*, 56(2), 649–676.
- Longstaff, F. A. and Schwartz, E. S. (2001). Valuing American options by simulation: a simple least-squares approach. *Review of Financial Studies*, 14(1), 113–147.
- Magdon-Ismail, M., Atiya, A. F., Pratap, A. and Abu-Mostafa, Y. S. (2004). On the maximum drawdown of a Brownian motion. *Journal of Applied Probability*, 41(1), 147–161.
- Maillard, S., Roncalli, T. and Teïletche, J. (2010). The properties of equally weighted risk contribution portfolios. *Journal of Portfolio Management*, 36(4), 60–70.
- Mandelbrot, B. (1963). The variation of certain speculative prices. *Journal of Business*, 36(4), 394–419.
- Mandelbrot, B. B. and Van Ness, J. W. (1968). Fractional Brownian motions, fractional noises and applications. *SIAM Review*, 10(4), 422–437.
- Markowitz, H. (1952). Portfolio selection. *Journal of Finance*, 7(1), 77–91.
- Matsumoto, M. and Nishimura, T. (1998). Mersenne Twister: a 623-dimensionally equidistributed uniform pseudo-random number generator. *ACM Transactions on Modeling and Computer Simulation*, 8(1), 3–30.
- McLean, R. D. and Pontiff, J. (2016). Does academic research destroy stock return predictability? *Journal of Finance*, 71(1), 5–32.
- McNeil, A. J. and Frey, R. (2000). Estimation of tail-related risk measures for heteroscedastic financial time series: an extreme value approach. *Journal of Empirical Finance*, 7(3–4), 271–300.
- Merton, R. C. (1969). Lifetime portfolio selection under uncertainty: the continuous-time case. *Review of Economics and Statistics*, 51(3), 247–257.
- Merton, R. C. (1972). An analytic derivation of the efficient portfolio frontier. *Journal of Financial and Quantitative Analysis*, 7(4), 1851–1872.
- Merton, R. C. (1973). An intertemporal capital asset pricing model. *Econometrica*, 41(5), 867–887.
- Merton, R. C. (1976). Option pricing when underlying stock returns are discontinuous. *Journal of Financial Economics*, 3(1–2), 125–144.
- Merton, R. C. (1980). On estimating the expected return on the market: an exploratory investigation. *Journal of Financial Economics*, 8(4), 323–361.
- Metropolis, N. and Ulam, S. (1949). The Monte Carlo method. *Journal of the American Statistical Association*, 44(247), 335–341.
- Michaud, R. O. (1989). The Markowitz optimization enigma: is 'optimized' optimal? *Financial Analysts Journal*, 45(1), 31–42.
- Mossin, J. (1966). Equilibrium in a capital asset market. *Econometrica*, 34(4), 768–783.
- Nelson, C. R. and Siegel, A. F. (1987). Parsimonious modeling of yield curves. *Journal of Business*, 60(4), 473–489.
- O'Neill, M. E. (2014). *PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation*. Technical report HMC-CS-2014-0905, Harvey Mudd College.
- Parkinson, M. (1980). The extreme value method for estimating the variance of the rate of return. *Journal of Business*, 53(1), 61–65.
- Pearson, K. (1896). Mathematical contributions to the theory of evolution. III. Regression, heredity, and panmixia. *Philosophical Transactions of the Royal Society of London, Series A*, 187, 253–318.
- Pólya, G. (1921). Über eine Aufgabe der Wahrscheinlichkeitsrechnung betreffend die Irrfahrt im Straßennetz. *Mathematische Annalen*, 84, 149–160.
- Praetz, P. D. (1972). The distribution of share price changes. *Journal of Business*, 45(1), 49–55.
- Rockafellar, R. T. and Uryasev, S. (2000). Optimization of conditional value-at-risk. *Journal of Risk*, 2(3), 21–41.
- Roll, R. (1977). A critique of the asset pricing theory's tests. Part I: On past and potential testability of the theory. *Journal of Financial Economics*, 4(2), 129–176.
- Ross, S. A. (1976). The arbitrage theory of capital asset pricing. *Journal of Economic Theory*, 13(3), 341–360.
- Rotando, L. M. and Thorp, E. O. (1992). The Kelly criterion and the stock market. *American Mathematical Monthly*, 99(10), 922–931.
- Rubinstein, M. (1994). Implied binomial trees. *Journal of Finance*, 49(3), 771–818.
- Samuelson, P. A. (1963). Risk and uncertainty: a fallacy of large numbers. *Scientia*, 98, 108–113.
- Samuelson, P. A. (1965). Proof that properly anticipated prices fluctuate randomly. *Industrial Management Review*, 6(2), 41–49.
- Samuelson, P. A. (1979). Why we should not make mean log of wealth big though years to act are long. *Journal of Banking & Finance*, 3(4), 305–307.
- Shannon, C. E. (1948). A mathematical theory of communication. *Bell System Technical Journal*, 27(3), 379–423, and 27(4), 623–656.
- Sharpe, W. F. (1963). A simplified model for portfolio analysis. *Management Science*, 9(2), 277–293.
- Sharpe, W. F. (1964). Capital asset prices: a theory of market equilibrium under conditions of risk. *Journal of Finance*, 19(3), 425–442.
- Sharpe, W. F. (1966). Mutual fund performance. *Journal of Business*, 39(1), 119–138.
- Sharpe, W. F. (1994). The Sharpe ratio. *Journal of Portfolio Management*, 21(1), 49–58.
- Shevtsova, I. (2011). On the absolute constants in the Berry–Esseen type inequalities for identically distributed summands. Preprint, arXiv:1111.6554.
- Sklar, A. (1959). Fonctions de répartition à *n* dimensions et leurs marges. *Publications de l'Institut de Statistique de l'Université de Paris*, 8, 229–231.
- Sobol', I. M. (1967). On the distribution of points in a cube and the approximate evaluation of integrals. *USSR Computational Mathematics and Mathematical Physics*, 7(4), 86–112.
- Sortino, F. A. and van der Meer, R. (1991). Downside risk. *Journal of Portfolio Management*, 17(4), 27–31.
- Spearman, C. (1904). The proof and measurement of association between two things. *American Journal of Psychology*, 15(1), 72–101.
- Statman, M. (1987). How many stocks make a diversified portfolio? *Journal of Financial and Quantitative Analysis*, 22(3), 353–363.
- Thorp, E. O. (2006). The Kelly criterion in blackjack, sports betting, and the stock market. In S. A. Zenios and W. T. Ziemba (eds.), *Handbook of Asset and Liability Management*, vol. 1 (pp. 385–428). Elsevier.
- Tobin, J. (1958). Liquidity preference as behavior towards risk. *Review of Economic Studies*, 25(2), 65–86.
- Treynor, J. L. (1965). How to rate management of investment funds. *Harvard Business Review*, 43(1), 63–75.
- Vasicek, O. A. (1973). A note on using cross-sectional information in Bayesian estimation of security betas. *Journal of Finance*, 28(5), 1233–1239.
- Westfall, P. H. (2014). Kurtosis as peakedness, 1905–2014. R.I.P. *The American Statistician*, 68(3), 191–195.
- Yule, G. U. (1926). Why do we sometimes get nonsense-correlations between time-series? A study in sampling and the nature of time-series. *Journal of the Royal Statistical Society*, 89(1), 1–63.

### Technical documents, rules and regulation

- Basel Committee on Banking Supervision (1996a). *Amendment to the Capital Accord to Incorporate Market Risks*. Basel: Bank for International Settlements.
- Basel Committee on Banking Supervision (1996b). *Supervisory Framework for the Use of «Backtesting» in Conjunction with the Internal Models Approach to Market Risk Capital Requirements*. Basel: Bank for International Settlements.
- Basel Committee on Banking Supervision (2009). *Revisions to the Basel II Market Risk Framework*. Basel: Bank for International Settlements.
- Basel Committee on Banking Supervision (2019). *Minimum Capital Requirements for Market Risk* (revision of the January 2016 standard, known as FRTB). Basel: Bank for International Settlements.
- CNMC (2019). Circular 2/2019, of 12 November, of the National Markets and Competition Commission, establishing the methodology for calculating the rate of financial remuneration of electricity transmission and distribution, and natural gas regasification, transmission and distribution. *BOE* of 20 November 2019 (BOE-A-2019-16639).
- Directive (EU) 2025/2 of the European Parliament and of the Council of 27 November 2024 amending Directive 2009/138/EC (Solvency II review). *OJ* L, 8 January 2025.
- Directive 2009/65/EC of the European Parliament and of the Council of 13 July 2009 (UCITS Directive). *OJ* L 302, 17 November 2009.
- Directive 2009/138/EC of the European Parliament and of the Council of 25 November 2009 (Solvency II). *OJ* L 335, 17 December 2009.
- Employee Retirement Income Security Act of 1974 (ERISA), Pub. L. 93-406, §404(a)(1)(C), 29 U.S.C. §1104(a)(1)(C).
- FINRA (2009). *Regulatory Notice 09-31: Non-Traditional ETFs*. Financial Industry Regulatory Authority.
- J.P. Morgan/Reuters (1996). *RiskMetrics — Technical Document* (4th ed.). New York: Morgan Guaranty Trust Company.
- Regulation (EU) 2024/1623 of the European Parliament and of the Council of 31 May 2024 amending Regulation (EU) No 575/2013 (CRR3). *OJ* L, 19 June 2024.
- Commission Delegated Regulation (EU) 2017/653 of 8 March 2017 supplementing Regulation (EU) No 1286/2014 (PRIIPs key information documents). *OJ* L 100, 12 April 2017.
