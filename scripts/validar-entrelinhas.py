"""Validação exaustiva da matriz de Nas entrelinhas (4^10 = 1.048.576 combinações).

Uso: python3 scripts/validar-entrelinhas.py  (requer numpy)
Lê src/data/nas-entrelinhas-v2.json, a matriz efetivamente usada pelo app.
"""
import json, itertools, os, sys
from collections import Counter
import numpy as np

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = json.load(open(os.path.join(raiz, "src/data/nas-entrelinhas-v2.json")))
ids = list(d["arquetipos"])
Q = d["perguntas"]

# estrutura
assert len(Q) == 10, "precisa de 10 perguntas"
falhas = []
for q in Q:
    assert len(q["alternativas"]) == 4, q["id"]
    vistos = Counter()
    for a in q["alternativas"]:
        assert len(a["pontos"]) == 2 and all(v == 1 for v in a["pontos"].values()), a["id"]
        vistos.update(a["pontos"])
        if q["formato"] == "ilustrada":
            if not a.get("imagem") or not os.path.exists(os.path.join(raiz, "public/nas-entrelinhas", a["imagem"])):
                falhas.append(f"imagem ausente: {a.get('imagem')}")
    assert sorted(vistos) == sorted(ids) and set(vistos.values()) == {1}, f"{q['id']}: cada carta uma vez"
ids_alt = [a["id"] for q in Q for a in q["alternativas"]]
assert len(ids_alt) == len(set(ids_alt)), "ids de alternativas repetidos"

P = np.zeros((10, 4, 8), dtype=np.int16)
for qi, q in enumerate(Q):
    for ai, a in enumerate(q["alternativas"]):
        for k in a["pontos"]:
            P[qi, ai, ids.index(k)] = 1

comb = np.array(list(itertools.product(range(4), repeat=10)), dtype=np.int8)
S = np.zeros((len(comb), 8), dtype=np.int16)
for qi in range(10):
    S += P[qi][comb[:, qi]]
assert (S.sum(1) == 20).all(), "a soma precisa ser 20"
mx = S.max(1, keepdims=True)
win = S == mx
n = win.sum(1)
uni = n == 1
print(f"combinações: {len(comb):,}")
print(f"resultado único: {uni.sum():,} ({uni.mean()*100:.2f}%)  ·  empate: {(~uni).sum():,} ({(~uni).mean()*100:.2f}%)")
print("tamanho dos empates:", dict(sorted(Counter(n[~uni].tolist()).items())))
final = (win / n[:, None]).mean(0) * 100
print("\ncarta  únicos   presenças em empate  % teórico (desempate uniforme)  pontuação máx.")
for i, k in enumerate(ids):
    print(f"  {k}   {int(win[uni][:, i].sum()):>7,}   {int(win[~uni][:, i].sum()):>9,}            {final[i]:.3f}%          {int(S[:, i].max())}")
duplas = Counter("".join(sorted(a["pontos"])) for q in Q for a in q["alternativas"])
print(f"\nduplas usadas: {len(duplas)} de 28 · máximo de repetições por dupla: {max(duplas.values())}")
print("correlação entre cartas (min/max fora da diagonal):", end=" ")
c = np.corrcoef(S.T.astype(float)); off = c[~np.eye(8, dtype=bool)]
print(f"{off.min():.3f} / {off.max():.3f}")
# posição: quem escolhe sempre a mesma posição (na ordem do JSON) — o app embaralha, então posição não decide carta
for pos in range(4):
    s = P[:, pos, :].sum(0)
    print(f"sempre a posição {pos+1} no JSON → pontos {dict(zip(ids, s.tolist()))}")
if falhas:
    print("\nFALHAS:", *falhas, sep="\n  ")
    sys.exit(1)
print("\nok: estrutura, imagens e soma conferidas")
