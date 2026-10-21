#!/usr/bin/env python3
"""tech-network の自動チェック（依存なし）。失敗があれば終了コード 1
1. 存在しない番号：前提・理解・前提になる・説明する・部品・線が、無いノードを指していないか
2. 前提の輪：前提をたどって自分に戻る輪が無いか
3. 年の逆転：ノードの年が、必ず要る前提の年より古くないか（data/meta.json の explained_inversions に説明ずみの物は除く。報告だけで失敗にはしない）
4. 出典の印：本当の話（history.real）があるのに出典（sources・refs）が1つも無く、⚠️ も無いノード
Automatic checks: unknown IDs, prerequisite cycles, year inversions (report only), and nodes with neither a source nor a ⚠️ mark.
"""
import json, sys
from pathlib import Path
D = Path(__file__).resolve().parent.parent / "data"
nodes = {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in (D / "nodes").glob("*.json")}
edges = json.loads((D / "edges.json").read_text(encoding="utf-8"))
meta = json.loads((D / "meta.json").read_text(encoding="utf-8"))
bad = []
for e in edges:
    for k in ("from", "to"):
        if e[k] not in nodes:
            bad.append(f"unknown id [{e[k]}] in edge {e['from']} -> {e['to']} ({e['kind']})")
pre = {i: [e["from"] for e in edges if e["to"] == i and e["kind"] == "requires"] for i in nodes}
state = {}
def dfs(u, stack):
    state[u] = 1; stack.append(u)
    for p in pre.get(u, []):
        if state.get(p) == 1:
            bad.append("cycle: " + " -> ".join(stack[stack.index(p):] + [p]))
        elif not state.get(p):
            dfs(p, stack)
    stack.pop(); state[u] = 2
sys.setrecursionlimit(10000)
for u in nodes:
    if not state.get(u):
        dfs(u, [])
explained = {(x["node"], x["requires"]) for x in meta.get("explained_inversions", [])}
inv = []
for i, n in nodes.items():
    y = n["history"].get("year")
    for alts in n["history"].get("requires") or []:
        ys = [max([nodes[a]["history"]["year"] for a in alt if a in nodes and nodes[a]["history"].get("year") is not None] or [None], key=lambda v: -10**9 if v is None else v) for alt in alts]
        ys = [v for v in ys if v is not None]
        if y is not None and ys and min(ys) > y:
            late = [a for alt in alts for a in alt if a in nodes and nodes[a]["history"].get("year") == min(ys)]
            if not any((i, a) in explained for a in late):
                inv.append(f"[{i}] {y} < prerequisite {late} {min(ys)}")
nosrc = []
for i, n in nodes.items():
    h = n["history"]
    if h.get("real") and not h.get("sources") and not h.get("refs") and "⚠️" not in json.dumps(h, ensure_ascii=False) and "出典" not in (h.get("hee1") or "") + (h.get("real") or ""):
        nosrc.append(i)
print(f"nodes={len(nodes)} edges={len(edges)} errors={len(bad)} year_inversions={len(inv)} (report only) no_source_mark={len(nosrc)} (report only)")
for b in bad: print("ERROR", b)
for b in inv[:300]: print("inversion", b)
if nosrc: print("no source or warning mark:", " ".join(sorted(nosrc)))
sys.exit(1 if bad else 0)
