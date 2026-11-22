#!/usr/bin/env python3
"""
RF-PY-10: ejecuta todos los fragmentos de Python del libro y comprueba que su salida
coincide con los números que el libro indica en los comentarios de las líneas `print`.

Ejemplo: `print(round(p50))  # 27302` exige que la salida contenga 27302.
Las cifras se comparan redondeando la salida a los decimales que usa el comentario.
Se ignoran las aclaraciones entre paréntesis, el texto antes de «:», las fracciones y las
cifras escritas con espacio antes de «%» (texto descriptivo, no salida del programa).
Sale con código 1 (y la publicación se detiene) si algún fragmento falla o no coincide.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NUM = re.compile(r"[-−]?\d+(?:[.,]\d+)?(?:e[-+]?\d+)?%?")


def blocks(md: str):
    """Devuelve (capítulo, número de línea, código) de cada bloque ```python."""
    chapter = "?"
    out = []
    lines = md.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r"^## (Capítulo \d+|Tema [A-E])", line)
        if m:
            chapter = m.group(1)
        elif re.match(r"^# Proyecto", line):
            chapter = "Proyecto"
        if line.strip() == "```python":
            start = i + 1
            j = start
            while lines[j].strip() != "```":
                j += 1
            out.append((chapter, start + 1, "\n".join(lines[start:j])))
            i = j
        i += 1
    return out


def expected_numbers(code: str):
    """Números de los comentarios en líneas print(...)."""
    exp = []
    for line in code.split("\n"):
        if "print(" in line and "#" in line:
            comment = line.split("#", 1)[1]
            comment = re.sub(r"\([^)]*\)", " ", comment)       # quita aclaraciones entre paréntesis
            if ":" in comment:
                comment = comment.rsplit(":", 1)[1]              # «texto: 0.103» → «0.103»
            comment = re.sub(r"[-−]?\d+/\d+", " ", comment)     # fracciones descriptivas (-1/6)
            comment = re.sub(r"[-−]?\d+(?:[.,]\d+)?\s+%", " ", comment)  # «95 %» con espacio: texto
            exp += [n for n in NUM.findall(comment)]
    return exp


def parse(n: str):
    pct = n.endswith("%")
    n = n.rstrip("%").replace("−", "-").replace(",", ".")
    return float(n), pct


def decimals(n: str) -> int:
    n = n.rstrip("%")
    m = re.search(r"[.,](\d+)", n)
    return len(m.group(1)) if m else 0


def matches(expected: str, output: str) -> bool:
    ev, epct = parse(expected)
    d = decimals(expected)
    for tok in NUM.findall(output):
        try:
            v, pct = parse(tok)
        except ValueError:
            continue
        if pct != epct:
            continue
        if round(v, d) == round(ev, d) or abs(v - ev) <= 0.5 * 10 ** (-d) + 1e-12:
            return True
    return False


def main() -> int:
    failures = 0
    total = 0
    for book in sorted(ROOT.glob("content/*/libro.md")):
        for chapter, line, code in blocks(book.read_text(encoding="utf-8")):
            total += 1
            where = f"{book.relative_to(ROOT)}:{line} ({chapter})"
            try:
                res = subprocess.run([sys.executable, "-I", "-c", code], capture_output=True, text=True, timeout=120)
            except subprocess.TimeoutExpired:
                print(f"✗ {where}: tarda más de 120 s")
                failures += 1
                continue
            if res.returncode != 0:
                print(f"✗ {where}: error al ejecutar\n{res.stderr.strip()}")
                failures += 1
                continue
            missing = [n for n in expected_numbers(code) if not matches(n, res.stdout)]
            if missing:
                print(f"✗ {where}: la salida no contiene {missing}\n  salida: {res.stdout.strip()}")
                failures += 1
            else:
                print(f"✓ {where}")
    print(f"\n{total - failures} de {total} fragmentos correctos.")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
