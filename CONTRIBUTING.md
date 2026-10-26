# 手伝ってくれる人へ / Contributing

tech-network は、石器から AI チップまでの「物と、それを作るのに要る物」の地図です。**全部 CC0**（だれでも自由に使える）。手伝ってくれた物も CC0 になります。

## できること
| したいこと | どうやって |
|---|---|
| まちがいを知らせる | 物のページの「誤りを知らせる」か Issue。**どの物か（ノード番号、例 `9-23`）と、出典**（本・論文・博物館・特許などの URL）を書く |
| 訳を直す・足す | 物のページの「訳を直す」か、`docs/i18n/<言語コード>.json` を直す Pull Request。決まりは [docs/i18n/README.md](docs/i18n/README.md) |
| 足りない物・つながりを知らせる | Issue に「何が」「何を作るのに要るか」「年」「出典」 |

## 決まり
1. **事実には出典**。出典が弱い（Wikipedia だけ・年が割れる）ときは ⚠️ を付ける
2. **存命の人の名前を書かない**（会社・研究所の名前か「研究者たち」に）。亡くなった人は書いてよい
3. **危ない物（武器・爆発物・毒など）の作り方・量・条件を書かない**。「何に使われ、なぜ危ないか」までにする
4. 会社のふりをしない（ロゴ・商標をまねない）
5. 子どもが読む一言（へえ①）は、短く、やさしいことばで

## データはどこから
地図とページは、ゲーム「Semiconductor Lab」の技術ツリーから自動で作っています。直した内容は、作者が元の文に取りこんでから、ページを作り直します（すぐには変わりません）。

---

## English
tech-network is a map of things, from stone tools to AI chips, and what each one needs. **Everything is CC0**, and so are contributions.

- **Report a mistake**: use "Report a mistake" on a page, or open an Issue. Include the node ID (e.g. `9-23`) and a source (book, paper, museum, patent URL).
- **Fix or add a translation**: use "Fix this translation" on a page, or send a Pull Request to `docs/i18n/<lang>.json`. Rules: [docs/i18n/README.md](docs/i18n/README.md).
- **Suggest a missing thing or link**: open an Issue with what it is, what it is needed for, the year and a source.

Rules: every fact needs a source (mark weak ones with ⚠️); no names of living people; never describe how to make weapons, explosives or poisons (no steps, amounts or conditions); do not imitate companies; keep the children's one-liners short and simple.

Pages are generated from the technology tree of the game "Semiconductor Lab". Accepted fixes go into the source text first, then the pages are rebuilt, so changes are not instant.
