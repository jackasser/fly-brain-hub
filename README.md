# Fly Brain Hub

世界中のハエ脳（Drosophila コネクトーム・シミュレーション・身体モデル・ツール・バイラルデモ）を
ジャンル別に一覧・検索できる、広告枠付きの静的サイト。英語（既定）と日本語（`/ja/`）の 2 言語。

- 仕様: [`docs/spec.md`](docs/spec.md)（要件 R-01〜R-10 と受け入れ条件。**この文書が正**）
- スタック: Astro 7（静的出力）・Fuse.js（クライアント検索）・Vitest・Playwright
- 公開先: Vercel（純静的、アダプタ不要）

## 開発

```powershell
npm install
npm run dev          # http://localhost:4321
npm test             # ユニット + コンポーネント + データ検証
npm run check        # astro sync && astro check && vitest
npm run build
npm run test:dist    # dist/ の検証（build 後）
npm run test:e2e     # Playwright（初回は npx playwright install chromium）
npm run verify       # check → build → test:dist → test:e2e
npm run linkcheck    # dist/ の内部リンク
```

開発は **仕様 → 失敗するテスト → 実装** の順（TDD）。仕様を変えるときは `docs/spec.md` を先に直す。

## エントリを追加する

1. `src/data/projects.json` に 1 要素を足す。キーとルールは `docs/spec.md` の R-01。
   - **一次ソースを読んで確認した項目だけ**書く。読んだ URL を `sourceRefs` に入れる
   - `description_en`（60〜600 文字）と `description_ja`（40〜600 文字）は**自分の言葉**で。README や記事の転載はしない
   - `datasets` には `category: "connectome"` のエントリの `id` だけを入れる
   - `category: "crypto"` は URL に紹介コード風のクエリを含めない
2. `npm run check` を通す（不正なデータはここで落ちる）
3. `npm run build && npm run test:dist`

### X 投稿のサムネイル

```powershell
node scripts/fetch-x-media.mjs        # url が X の投稿のエントリに image / imageKind / imageCredit を書く（既に image があれば触らない）
node scripts/fetch-x-media.mjs --force
```

取得元は X の配信 CDN（公式埋め込みウィジェットが読む JSON）。保存するのは `pbs.twimg.com` の画像 URL だけで、詳細ページでは投稿を X 公式ウィジェットで埋め込む。

### スター数の更新

```powershell
npm run refresh-stars        # GITHUB_TOKEN があれば使う
```

GitHub の `repoUrl` を持つエントリの `stars` / `starsUpdatedAt` だけを書き換える。結果をコミットする。

## 環境変数

`.env.example` を `.env` にコピーして設定する（Vercel では Project Settings → Environment Variables）。

| 変数 | 用途 |
|---|---|
| `PUBLIC_SITE_URL` | canonical / sitemap / RSS の起点。独自ドメイン取得後に設定 |
| `PUBLIC_ADSENSE_CLIENT` | `ca-pub-…`。**未設定なら本番では広告関連のマークアップを一切出さない**（dev では破線の枠を表示） |
| `PUBLIC_ADSENSE_SLOT_LEADERBOARD` / `_INFEED` / `_SIDEBAR` | 各広告ユニットの slot ID |
| `PUBLIC_ADSENSE_INFEED_LAYOUT_KEY` | in-feed ユニットの layout key |
| `PUBLIC_GITHUB_REPO` | `owner/repo`。投稿ページの Issue リンク先。未設定だと `OWNER/fly-brain-hub` というプレースホルダになる |
| `PUBLIC_CONTACT_EMAIL` | 任意。設定すると Contact ページにメールアドレスを出す |
| `PUBLIC_VERCEL_ANALYTICS` | `1` で Vercel Web Analytics のスクリプトを全ページ（404 除く）に出す。Vercel 側で `vercel project web-analytics` を実行して有効化しておく。Cookie なし |
| `PUBLIC_GA_MEASUREMENT_ID` | 任意。`G-…` を入れると GA4 も有効。EU/UK/CH は Consent Mode の既定 denied |

## アクセス解析を見る

Vercel ダッシュボード → プロジェクト `fly-brain-hub` → **Analytics** タブ。ページ別・参照元別・国別・端末別が見られる。
Claude Code からは Vercel 連携の `get_web_analytics`（count / aggregate）で同じデータを取得できる。

## 広告（AdSense）を有効にするまで

1. vercel.app で公開して内容を整える（`*.vercel.app` のままでは AdSense 審査に通らない）
2. 独自ドメインを取得して Vercel に接続する（HTTPS は自動）
3. `PUBLIC_SITE_URL` と `PUBLIC_GITHUB_REPO` を設定して再デプロイ。`public/robots.txt` の Sitemap 行もドメインに合わせる
4. AdSense に申請（About / Privacy / Contact / Submit は用意済み）
5. 承認後、`PUBLIC_ADSENSE_*` を設定して再デプロイ。EU 向けの同意メッセージは AdSense 側の CMP を有効化する

## 構成

```
src/data/projects.json        唯一の編集ファイル
src/content.config.ts         file() ローダー + zod スキーマ（src/lib/schema.ts）
src/lib/taxonomy.ts           カテゴリ・データセット ID と EN/JA ラベル
src/lib/{projects,ads,seo}.ts 純粋関数（ユニットテスト対象）
src/i18n/                     UI 文言と localePath / otherLocalePath
src/layouts/BaseLayout.astro  hreflang / canonical / OG / JSON-LD / AdSense ローダー
src/components/               AdSlot, ProjectCard, ProjectGrid, SearchProjects, …
src/components/pages/         ページ本体（lang prop を受ける）
src/pages/                    EN ルート。src/pages/ja/ は同じ構成の薄いシェル
tests/unit  tests/dist  tests/e2e
scripts/refresh-stars.mjs
.github/ISSUE_TEMPLATE/submit-project.yml   投稿用テンプレート
```
