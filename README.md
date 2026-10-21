# tech-network — 技術の地図 / A map of technology

石器から AI まで、630 の技術・モノ・発見が「何が無いと何が作れないか」でつながる地図です。
教育 MOD「Semiconductor Lab」（Minecraft）のために作り、世界中の人に確かめてもらうために公開しています。
From stone tools to AI: 630 technologies, products and discoveries, connected by "what cannot be made without what".
Made for the educational Minecraft mod "Semiconductor Lab", and published so that people everywhere can check it.

- 図 / Map: https://taku3i0317-collab.github.io/tech-network/ （GitHub Pages、docs/）。「English」ボタンで英語に / English button available
- データ / Data: `data/nodes/<id>.json`（1ノード1ファイル）。`history` が本当の技術の歴史、`game` が MOD での作り方 / `history` is the real history, `game` is how it is made in the mod
- つながり / Edges: `data/edges.json`（kind：requires＝前提・understanding＝なぜ動くかの説明・enables＝考え方から生まれた・part＝部品・tool＝つくるのに使った道具・same＝同じしくみ）
- 自動チェック / Checks: `python tools/check.py`（存在しない番号・前提の輪・年の逆転・出典の印 / unknown IDs, cycles, year inversions, source marks）

## 誤りを見つけたら / Found a mistake?
Issue のひな形（年・人物／つながり／出典／画像）から知らせてください。ノードのページの「誤りを報告」ボタンで、番号が入った状態で開きます。
Please use the issue templates (year/person, link, source, image). The "report" buttons on each node page open them with the node ID filled in.
https://github.com/taku3i0317-collab/tech-network/issues

## 決まり / Rules
- 確かさ：◎ 信頼できる出典2つ以上 ／ ○ 1つ ／ △ 未確認（⚠️）。Wikipedia だけの物は ○ まで / ◎ two reliable sources, ○ one, △ unverified (⚠️); Wikipedia alone is at most ○
- 存命の人の顔（肖像）は載せません。肖像は自作のドット絵です / No portraits of living people; portraits are original pixel art
- 文は自分の言葉で書いています（Wikipedia などの丸写しはしない）/ Texts are written in our own words (no copying)

## ライセンス / License
CC0 1.0（パブリックドメイン）。名前を書かなくても、何にでも自由に使えます。/ CC0 1.0 (public domain dedication). Use it for anything, no attribution required.
例外：docs/vendor/budoux-ja.min.js（日本語の折り返しの道具 BudouX、Google）は Apache License 2.0（docs/vendor/LICENSE-budoux.txt）。/ Exception: docs/vendor/budoux-ja.min.js (BudouX by Google, for Japanese line breaks) is under the Apache License 2.0 (docs/vendor/LICENSE-budoux.txt).
元のリポジトリ / Source: https://github.com/taku3i0317-collab/semiconductor-lab
