# Fly Brain Hub — 作業メモ（Claude / エージェント向け）

- **仕様が正。** `docs/spec.md` の要件 R-xx と受け入れ条件 AC-xx-n を先に読む。仕様に無いものは作らない。
  変更するときは spec → テスト → 実装の順。
- **TDD。** 新機能は失敗するテストから。ユニット `tests/unit`（Vitest + Astro Container API）、
  ビルド成果物 `tests/dist`（`npm run build` 後）、E2E `tests/e2e`（Playwright、`astro preview` 相手）。
- **データの誠実さ。** `src/data/projects.json` の各エントリは一次ソースを読んで確認し、URL を `sourceRefs` に残す。
  説明文は自分の言葉。README・記事・ツイートを貼らない。データは再配布しない。
- 開発サーバーはバックグラウンドで: `npx astro dev --background`（`astro dev stop` / `status` / `logs`）。
- 踏んだ罠:
  - `<form>` 内の `name="dataset"` コントロールが `form.dataset` を隠す → data 属性は `getAttribute` で読む
  - `.card { display: flex }` が `hidden` 属性を無効化 → `[hidden] { display: none !important }` を global.css に置いた
  - `grep 'id="project-grid"'` は `data-grid="project-grid"` にもマッチする

Astro のドキュメント: https://docs.astro.build （content collections / i18n / Container API）
