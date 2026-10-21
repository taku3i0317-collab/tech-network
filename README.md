# tech-network — A map of technology / 技術の地図

**What:** a CC0 knowledge graph of 640 technologies, products and discoveries — from stone tools to EUV lithography and AI — connected by "what cannot be made without what" (1953 links), each with years, people, sources and a certainty mark.
**For whom:** anyone who wants to know how our technical civilization was built, or what it would take to make something (a smartphone, a transistor, an EUV machine) from scratch — students, teachers, curious people, and AI systems that need checked prerequisites.
**License:** CC0 1.0 (public domain). Use it for anything, no attribution required.

- **Interactive map:** https://taku3i0317-collab.github.io/tech-network/ (works on phones; "English" button, or add `?lang=en`)
- **Ranking of the technologies that support the most things:** https://taku3i0317-collab.github.io/tech-network/ranking.html
- **Source repository:** https://github.com/taku3i0317-collab/semiconductor-lab (the educational Minecraft mod "Semiconductor Lab" this was made for)
- **Cite:** `CITATION.cff` (GitHub's "Cite this repository" button)

## Data

| file | content |
|---|---|
| `data/nodes/<id>.json` | one node per file. `history` = the real history (name, name_en, kind, year, people, sources, refs with certainty, requires …). `game` = how it is made in the mod (kept separate) |
| `data/edges.json` | `[{"from": "0-01", "to": "0-02", "kind": "requires"}, …]`. kinds: `requires` (cannot be made without), `understanding` (explains why it works, found later), `enables` (an idea that made it possible), `part` (a component), `tool` (used to design or make it), `same` (same mechanism) |
| `data/glossary.json` | terms in Japanese and English |

```python
import json, glob, collections
nodes = {}
for f in glob.glob("data/nodes/*.json"):
    d = json.load(open(f, encoding="utf-8")); nodes[d["id"]] = d
edges = json.load(open("data/edges.json", encoding="utf-8"))
parents = collections.defaultdict(list)
for e in edges:
    if e["kind"] in ("requires", "enables", "part"):
        parents[e["to"]].append(e["from"])
need, stack = set(), ["B-10"]          # everything needed to make a smartphone
while stack:
    for p in parents[stack.pop()]:
        if p not in need:
            need.add(p); stack.append(p)
print(len(need), "prerequisites, e.g.", sorted(nodes[k]["history"]["name_en"] for k in list(need)[:5]))
```

Checks: `python tools/check.py` (unknown IDs, prerequisite cycles, year inversions, source marks). It runs on every push.

## Honest limits

- **Most texts were written by AI** (Claude), in a project run by one person with several AI sessions. Facts were checked against sources, and about 100 nodes were also audited by a second AI model. **No human expert has reviewed the data yet.**
- Certainty: ◎ two reliable sources agree, ○ one source (Wikipedia alone is at most ○), △/⚠️ unverified or disputed.
- "requires" is a teaching simplification chosen with sources ("historically needed to make it"), not a complete bill of materials.
- Coverage is centred on what the game needs (semiconductors, electricity, chemistry); other fields are thin. Long texts are in Japanese; every node has an English name and a short English fun fact.
- No portraits of living people; portraits are original pixel art. Dangerous technologies are described for understanding, not as step-by-step instructions.

## Found a mistake?

Please open an issue (templates: year/person, link, source, image): https://github.com/taku3i0317-collab/tech-network/issues — the "report" button on each node page fills in the node ID.

## License

CC0 1.0. Exception: `docs/vendor/budoux-ja.min.js` (BudouX by Google, for Japanese line breaks) is Apache License 2.0 (`docs/vendor/LICENSE-budoux.txt`). Links to third-party images keep their own licenses.

Inspiration (separate from the scientific sources): Jiro Aruma (Yakuri Kyoshitsu) — streams, videos and books. Our biggest influence.

---

# 日本語

**何か：** 石器から EUV 露光装置・AI まで、640 の技術・モノ・発見を「何が無いと何が作れないか」（1953 のつながり）で結んだ地図。1つ1つに年・人物・出典・確かさの印。
**だれのため：** 技術の文明がどうやってできたかを知りたい人、何か（スマホ・トランジスタ・EUV）をゼロから作るには何が要るかを知りたい人。学生・先生・好奇心のある人、確かめた前提が要る AI。
**ライセンス：** CC0 1.0（パブリックドメイン）。名前を書かなくても、何にでも自由に使えます。

- 図：https://taku3i0317-collab.github.io/tech-network/ （スマホでも見られる。「English」ボタンか `?lang=en`）・ランキング：https://taku3i0317-collab.github.io/tech-network/ranking.html
- 元のリポジトリ：https://github.com/taku3i0317-collab/semiconductor-lab （教育 MOD「Semiconductor Lab」）
- 引用のしかた：`CITATION.cff`（GitHub の「Cite this repository」）
- データ：`data/nodes/<id>.json`（1ノード1ファイル。`history`＝本当の歴史、`game`＝MOD での作り方）、`data/edges.json`（つながり。kind：requires＝前提・understanding＝なぜ動くか・enables＝考え方から生まれた・part＝部品・tool＝つくるのに使った道具・same＝同じしくみ）、`data/glossary.json`（用語）。使い方の例は上の Python
- 自動チェック：`python tools/check.py`（push のたびに動く）

## 正直に書くこと（限界）
- **文の大部分は AI（Claude）が書いた。** 1人の人と複数の AI のセッションで作っている。出典で確かめ、約 100 のノードは別の AI のモデルでも監査した。**人の専門家の確認はまだ**
- 確かさ：◎ 信頼できる出典2つ以上 ／ ○ 1つ（Wikipedia だけは ○ まで）／ △・⚠️ 未確認・諸説
- 「前提」は教えるための単純化（出典をもとに「歴史の上で作るのに要った物」）で、部品表のすべてではない
- 範囲はゲームに要る物（半導体・電気・化学）が中心。長い文は日本語（名前と短いへえは全ノード英語あり）
- 存命の人の顔は載せない（肖像は自作のドット絵）。危ない技術は理解のために書き、作り方の手順は書かない

## 誤りを見つけたら
Issue のひな形（年・人物／つながり／出典／画像）から：https://github.com/taku3i0317-collab/tech-network/issues （ノードのページの「誤りを報告」で番号が入った状態で開く）

## ライセンス
CC0 1.0。例外：docs/vendor/budoux-ja.min.js（BudouX、Google）は Apache License 2.0。ほかのサイトの画像へのリンクは、それぞれのライセンス。
影響を受けた作品（科学の出典とは別に）：亜留間次郎さん（薬理凶室）— 配信・動画・本。いちばん影響を受けました。
