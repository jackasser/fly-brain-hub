# X 投稿の下書き

投稿は手動で行う（このリポジトリからは自動投稿しない）。リンクプレビューは `public/og.png`（1200×630）が
`og:image` / `twitter:card=summary_large_image` で出る。投稿前に https://cards-dev.twitter.com/validator か、
自分宛 DM にリンクを貼ってプレビューを確認する。

数字（掲載件数・カテゴリ数）は投稿時に `src/data/projects.json` の件数と合わせる。2026-09-13 時点: 77 件・7 カテゴリ。

## 日本語版（メイン）

```
ハエの脳のプロジェクト、世界中から集めてまとめました。

2026年9月にオスのショウジョウバエの全中枢神経系コネクトーム（16万ニューロン）が公開されてから、
Doom・Minecraft・Beat Saber・トレードボット・物理シミュレーションの身体…と「ハエ脳が X をやる」が続出。

でも、どこに何があるか一覧できる場所がなかった。

🧠 Fly Brain Hub
・7カテゴリ（データセット / シミュレーション / 身体モデル / デモ・ゲーム / ツール / 解説 / 暗号資産）
・42プロジェクト、名前・タグ・説明で検索
・全エントリに「確認した出典」を明記
・英語 / 日本語

https://fly-brain-hub.vercel.app/ja/
```

## 英語版

```
Someone mapped an entire fly brain. Then everyone started plugging it into things.

Doom. Minecraft. Beat Saber. A bitcoin trader. A physics-simulated body that walks.
Since the male Drosophila connectome dropped in Sept 2026, the demos haven't stopped.

There was no single place to see all of it. Now there is.

🧠 Fly Brain Hub
- 77 projects across 7 categories: datasets, simulations, bodies, tools, demos, explainers
- Search by name, tag or description
- Every entry lists the sources we actually checked
- EN / 日本語

https://fly-brain-hub.vercel.app
```

## スレッド用の続き（任意）

1. **データの話**: MaleCNS（脳＋神経索、CC BY）、FlyWire（メス全脳、Nature 2024）、BANC（メス脳＋神経索、Nature 2026）——
   どれを使っているかを各プロジェクトに表示している。 → `/datasets`
2. **身体の話**: flybody（DeepMind × Janelia、MuJoCo、Apache-2.0）と NeuroMechFly v2（EPFL）。脳モデルを載せる「体」。
3. **誠実さの話**: 説明文は全部自分の言葉。README や記事の転載なし。データの再配布なし。暗号資産系は「情報のみ」扱い。
4. **お願い**: 載っていないプロジェクトがあれば GitHub の Issue テンプレートから → `/submit`

## 投稿前チェック

- [ ] 件数が `projects.json` と一致している
- [ ] OG 画像がプレビューに出る（キャッシュが古い場合は URL に `?v=2` を付けて再取得）
- [ ] 日本語版は `/ja/` を、英語版はルートをリンクする
- [ ] ハッシュタグ候補: `#connectome` `#Drosophila` `#neuroscience` `#コネクトーム`（付けすぎない、2 つまで）
