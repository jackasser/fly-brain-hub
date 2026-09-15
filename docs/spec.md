# Fly Brain Hub 仕様書

作成: 2026-09-12 / 状態: 初期公開版（R-01〜R-10 の全 AC にテストあり・Green）

> **この文書が正。** 仕様に無いものは作らない。仕様を変えるときは先にここを直し、次にテスト、最後に実装。
> 各受け入れ条件（AC）は必ずテスト ID を持つ。`todo` はまだテストが無い条件。

## 0. 編集方針（誠実さの契約）

1. **一次ソースを取得して確認した項目だけ掲載する。** 各エントリは `sourceRefs`（確認した URL）を 1 件以上持つ。
2. **説明文は自分の言葉で書く。** README・ツイート本文・記事の転載をしない。画像は R-11 の 3 種（プラットフォームが埋め込み用に配信するプレビュー画像、YouTube の公式埋め込み、自作の生成カバー）だけを使い、記事や README のスクリーンショットを複製・ホットリンクしない。
3. **データは再配布しない。** リンクと説明だけ。データのライセンス（例: FlyWire 由来は CC BY-NC 4.0、MaleCNS / BANC は CC BY 4.0）を `license` 欄に明記する。
4. **暗号資産（memecoin）系は「情報のみ・推奨なし・紹介リンクなし」の注記を常に表示する。**
5. 初期公開は 30〜40 エントリ。2026-09 の MaleCNS 公開以降は事例が急増しているため件数の上限は設けず、
   一次ソースを確認できたものだけを足す。同一実装のミラー・フォークは載せない（本家だけ）。

## 1. 用語

| 用語 | 意味 |
|---|---|
| エントリ / プロジェクト | `src/data/projects.json` の 1 要素 |
| カテゴリ | 7 種の固定分類（R-02） |
| データセット ID | `category = connectome` のエントリの `id`。他エントリの `datasets` から参照される |
| ロケール | `en`（既定・URL 接頭なし）と `ja`（`/ja/` 接頭） |
| 広告有効 | 環境変数 `PUBLIC_ADSENSE_CLIENT` が空でない状態 |

## R-01 データ

エントリはひとつの JSON 配列で管理し、Astro content collection の `file()` ローダーと zod スキーマで検証する。

| 項目 | 型 | 必須 | 制約 |
|---|---|---|---|
| id | string | ✔ | `^[a-z0-9-]+$`、全体で一意 |
| name | string | ✔ | 2 文字以上 |
| url | URL | ✔ | 公式ページ。**http(s) のみ**（`javascript:` `data:` は拒否） |
| repoUrl | URL | | GitHub 等 |
| category | enum | ✔ | R-02 の slug |
| tags | string[] | | 既定 `[]` |
| datasets | enum[] | | データセット ID のみ。既定 `[]` |
| org | string | ✔ | 機関・作者 |
| region | string | | 主導機関の所在。`US` `JP` `UK` `CH` `PE` など。**不明なら省略する**（`Intl` のような代用値を入れない） |
| license | string | | SPDX 風。不明は `unknown` |
| language | string | | プログラミング言語 |
| date | string | ✔ | `YYYY` / `YYYY-MM` / `YYYY-MM-DD` |
| addedAt | string | ✔ | `YYYY-MM-DD`。新着・RSS の基準 |
| stars | int ≥ 0 | | |
| starsUpdatedAt | `YYYY-MM-DD` | | `refresh-stars` が書く |
| status | `active` \| `archived` | | 既定 `active` |
| description_en | string | ✔ | 60〜600 文字 |
| description_ja | string | ✔ | 40〜600 文字 |
| thumbnail | string | | `/thumbs/` で始まる。`imageCredit` 必須 |
| video | URL | | YouTube の URL（R-11） |
| image | URL | | 外部のプレビュー画像。`imageCredit` 必須（R-11） |
| imageCredit | string | | 画像の出どころ・権利表示 |
| imageKind | `photo` \| `video-poster` | | `image` が動画のポスターなら `video-poster`（カードに再生バッジ） |
| featured | boolean | | 既定 `false` |
| sourceRefs | URL[] | ✔ | 1 件以上 |

未知のキーはエラー（`.strict()`）。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-01-1 | 妥当なエントリを与えると、スキーマが既定値を補って通す | `schema.test.ts` |
| AC-01-2 | `description_en` が 60 文字未満だと失敗する | `schema.test.ts` |
| AC-01-3 | 未知キーを含むと失敗する | `schema.test.ts` |
| AC-01-4 | `datasets` にデータセット ID 以外があると失敗する | `schema.test.ts` |
| AC-01-5 | `sourceRefs` が空だと失敗する | `schema.test.ts` |
| AC-01-8 | `url` `repoUrl` `sourceRefs` `image` `video` に `javascript:` / `data:` / `http:` 以外の非 https スキームを与えると失敗する（`http:` は `url`/`sourceRefs` のみ許容） | `schema.test.ts` |
| AC-01-6 | `projects.json` の全件がスキーマを通り、`id` が一意で、`datasets` の参照先が `connectome` エントリとして存在する | `data.test.ts` |
| AC-01-6d | `DATASET_IDS` の全てに対応する `connectome` エントリが存在する | `data.test.ts` |
| AC-01-7 | `category = crypto` の全エントリの `url`・`repoUrl`・`sourceRefs` に紹介コード風のクエリ（`ref=` `aff=` `invite=`）が無い | `data.test.ts` |

## R-02 分類

| slug | EN | JA | JSON-LD type |
|---|---|---|---|
| connectome | Datasets & Connectomes | データセット・コネクトーム | Dataset |
| simulation | Simulation & Emulation | シミュレーション | SoftwareSourceCode |
| body | Body Models & Physics | 身体モデル・物理 | SoftwareSourceCode |
| demo | Demos & Games | デモ・ゲーム | SoftwareSourceCode |
| tool | Tools & Libraries | ツール・ライブラリ | SoftwareSourceCode |
| media | Media & Explainers | 解説・報道 | Article |
| crypto | Crypto (informational) | 暗号資産（情報のみ） | WebPage |

`crypto` には両言語の注記文（EN: "Listed for information only. No endorsement, no referral links." / JA: 「情報提供のみ。推奨・紹介リンクはありません。」）を持つ。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-02-1 | `CATEGORIES` が上記 7 slug をこの順で持つ | `taxonomy.test.ts` |
| AC-02-2 | 全カテゴリに EN/JA ラベルと JSON-LD type がある | `taxonomy.test.ts` |
| AC-02-3 | `crypto` だけが `notice` を両言語で持ち、他は持たない | `taxonomy.test.ts` |
| AC-02-4 | `DATASET_IDS` が `malecns flywire-fafb hemibrain manc banc fanc optic-lobe larval` を含む | `taxonomy.test.ts` |

## R-03 ルーティングと i18n

- EN は接頭なし（`/projects/flybody`）、JA は `/ja/` 接頭（`/ja/projects/flybody`）。
- UI 文言は `src/i18n/{en,ja}.ts` に同じキー集合で持つ。
- 全ページに `<link rel="alternate" hreflang>` を `en` `ja` `x-default`（= en）で出す。
- 言語切替リンクは同じページの相手言語版へ飛ぶ。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-03-1 | `en` と `ja` の文言キー集合が完全に一致する | `i18n.test.ts` |
| AC-03-2 | `localePath('ja','/projects/x')` → `/ja/projects/x`、`localePath('en','/projects/x')` → `/projects/x` | `i18n.test.ts` |
| AC-03-3 | `otherLocalePath` が `/ja/projects/x` ↔ `/projects/x` を往復し、`/ja/` ↔ `/` も往復する | `i18n.test.ts` |
| AC-03-4 | ビルド後、EN の各 HTML に JA 版への hreflang が、JA の各 HTML に EN 版への hreflang があり、`x-default` は EN を指す | `dist.test.ts` |
| AC-03-5 | ブラウザで `/projects/flybody` の言語切替を押すと `/ja/projects/flybody` に着き、再度押すと戻る | `e2e/lang.spec.ts` |

## R-04 一覧・詳細ページ

| ページ | 内容 |
|---|---|
| `/` | hero、`featured` エントリ（**全件**、`sortProjects` 順）、`addedAt` 降順の新着 6 件、カテゴリ格子（件数付き） |
| `/projects` | 全エントリのカード一覧（SSR 済み）。上に検索 UI（R-05） |
| `/category/<slug>` | そのカテゴリのカード一覧。`crypto` は注記を先頭に出す |
| `/projects/<id>` | 順に: 名前・作者 → 説明（ロケール別）と公式・リポジトリリンク（**外部リンクは新しいタブで開く**: `target="_blank" rel="noopener noreferrer"`。出典リンクも同様） → 画像または動画（R-11） → タグ → 出典（sourceRefs）一覧。右カラムに org / region / license / language / date / stars / status とデータセットへのリンク |
| `/datasets` | `connectome` エントリの一覧と「使っているプロジェクト数」 |

カードは name、カテゴリバッジ、データセットバッジ、説明（ロケール別）、license、stars（あれば）を出し、`crypto` は注記を出す。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-04-1 | `ProjectCard` を `crypto` エントリで描画すると注記文が含まれ、他カテゴリでは含まれない | `components.test.ts` |
| AC-04-2 | `ProjectCard` にデータセット・ライセンス・stars を渡すとそれぞれ描画される | `components.test.ts` |
| AC-04-3 | `ProjectGrid` に 13 件渡すと、6 件目と 12 件目の直後に in-feed 広告枠が入る（広告有効時） | `components.test.ts` |
| AC-04-4 | ビルド後、全エントリ × 両ロケールの `projects/<id>/index.html`、全カテゴリの `category/<slug>/index.html`、`datasets/index.html`、`projects/index.html` が存在する | `dist.test.ts` |
| AC-04-5 | 詳細ページに `sourceRefs` の各 URL がリンクとして含まれる | `dist.test.ts` |
| AC-04-7 | 詳細ページの公式サイト・リポジトリ・出典のリンクは `target="_blank"` と `rel` に `noopener` を持つ（2026-09-12 ユーザー指示） | `dist.test.ts` |
| AC-04-6 | `/datasets` の各データセット行に、それを `datasets` で参照するエントリ数が表示される | `dist.test.ts` |

## R-05 検索

- ビルド時に `/search-index.json` を出す。要素: `id name category datasets tags description_en description_ja url license stars`。
- クライアントで Fuse.js を使い `name`（重み 3）`tags`（2）`description_<locale>`（1）を検索する。
- ファセット（category / dataset / tag）は完全一致で絞る。
- 状態は `?q=&category=&dataset=&tag=` に同期し、URL から復元する（`?sort=` は R-16）。
- JS 無効時も `/projects` の SSR 一覧が読める。
- `search-index.json` の取得に失敗したら、検索フォームを無効化して失敗メッセージを出し、SSR 全件一覧はそのまま残す。
- 検索で絞り込んでも in-feed 広告枠は隠さない（要求済み広告を隠さない。R-07）。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-05-1 | `search-index.json` が全エントリを含み、各要素が上記キーだけを持つ | `search-index.test.ts` / `dist.test.ts` |
| AC-05-2 | `/projects?q=doom` を開くと結果が絞られ、入力欄に `doom` が入っている | `e2e/search.spec.ts` |
| AC-05-3 | category ファセットを選ぶと URL に `category=` が付き、件数が減る | `e2e/search.spec.ts` |
| AC-05-4 | 検索語を消すと全件に戻る | `e2e/search.spec.ts` |
| AC-05-5 | `search-index.json` が 404 のとき、入力欄が disabled になり `data-status` に失敗文言が出て、カードは全件表示のまま | `e2e/search.spec.ts` |

## R-06 SEO

- `astro.config.mjs` の `site` は `PUBLIC_SITE_URL`（未設定時は `https://example.com` のプレースホルダ）。
- 各ページに `canonical`、OG（title / description / url / type）。
- 詳細ページに JSON-LD（カテゴリ別 type、`name` `url` `description` `license` `codeRepository`（あれば））。シリアライズ時に `<` を `<` にエスケープし、`</script>` を含むデータでもスクリプトを閉じない。
- 全ページに `og:image`（`/og.png`、1200×630、ハエの顔＋脳とサイト名）と `twitter:card=summary_large_image`。
- canonical と sitemap の URL は末尾スラッシュ無しで統一する。404 ページは hreflang を出さない。
- sitemap（`@astrojs/sitemap`、i18n alternates 付き）、RSS を `/rss.xml` と `/ja/rss.xml`、`robots.txt`、`404` ページ。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-06-1 | `jsonLd(entry)` が category ごとに正しい `@type` を返し、`repoUrl` があれば `codeRepository` を含む | `seo.test.ts` |
| AC-06-2 | ビルド後、詳細ページに `application/ld+json` と `canonical` がある | `dist.test.ts` |
| AC-06-4 | `serializeJsonLd()` が `</script>` を含む値を `</script>` に変換し、`JSON.parse` で元に戻る | `seo.test.ts` |
| AC-06-5 | 全 HTML（404 除く）の canonical が末尾スラッシュ無しで、`sitemap-0.xml` の全 URL も末尾スラッシュ無し。`og:image` が全ページにあり `dist/og.png` が存在する | `dist.test.ts` |
| AC-06-3 | `sitemap-index.xml`、`rss.xml`、`ja/rss.xml`、`robots.txt`、`404.html` が存在し、RSS に全エントリが含まれる | `dist.test.ts` |

## R-07 広告枠

| 枠 | 場所 | env |
|---|---|---|
| leaderboard | ヘッダー直下（404 を除く全ページ） | `PUBLIC_ADSENSE_SLOT_LEADERBOARD` |
| infeed | 一覧グリッドの 6 件ごと | `PUBLIC_ADSENSE_SLOT_INFEED`（+ `PUBLIC_ADSENSE_INFEED_LAYOUT_KEY`） |
| sidebar | 詳細ページ末尾 | `PUBLIC_ADSENSE_SLOT_SIDEBAR` |

- 広告有効（`PUBLIC_ADSENSE_CLIENT` 設定済み）: `<ins class="adsbygoogle" data-ad-client data-ad-slot ...>` と push スクリプト。BaseLayout が `adsbygoogle.js` を 1 回だけ読み込む。
- 広告無効かつ dev: 高さを確保した破線ボックス（枠名入り、`data-ad-placeholder` 属性）。
- 広告無効かつ本番ビルド: 何も出さない（ただし `PUBLIC_AD_INQUIRY_URL` があれば R-15 のハウス広告を出す）。
- 404 ページでは広告ローダーも枠も出さない（Google の配置ポリシー）。`BaseLayout` の `ads={false}` で制御する。
- 枠の slot ID（infeed は layout key も）が未設定なら、その枠は有効時でも描画しない（空の `data-ad-slot` を送らない）。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-07-1 | `isAdsEnabled({PUBLIC_ADSENSE_CLIENT:''})` は false、`'ca-pub-1'` なら true | `ads.test.ts` |
| AC-07-2 | `resolveSlot('infeed', env)` が client / slot / layoutKey を返す | `ads.test.ts` |
| AC-07-3 | `AdSlot` は有効時に `ins.adsbygoogle` を、無効かつ dev で `data-ad-placeholder` を、無効かつ prod で空文字を描画する | `components.test.ts` |
| AC-07-4 | env 未設定でビルドした `dist/` に `adsbygoogle` の文字列が無い | `dist.test.ts` |
| AC-07-5 | `resolveSlot` は slot 未設定で `null`、infeed は layout key 未設定で `null` を返し、`AdSlot` は `null` のとき何も描画しない | `ads.test.ts` / `components.test.ts` |
| AC-07-6 | `BaseLayout` に `ads={false}` を渡すと広告有効時でも `adsbygoogle` を含まない | `components.test.ts` |

## R-08 法務・投稿ページ

- `/about`：サイトの目的、編集方針（第 0 章）、運営者。
- `/privacy`：X（Twitter）の投稿を公式ウィジェットで埋め込むページがあり、その際 X のスクリプトと Cookie が読み込まれること。Google AdSense の利用、Cookie（DoubleClick）、パーソナライズ広告のオプトアウト（`https://www.google.com/settings/ads`）、EU/UK/CH では Google 認定の同意管理（CMP）による同意メッセージが出ること（同意の選択に応じて広告が制限または非表示になる、と**断定せずに**書く）、アクセス解析の有無、問い合わせ先。
- `/contact`：連絡手段（GitHub Issues とメール）。
- `/submit`：投稿手順と、`submit-project.yml` テンプレートを指す prefilled issue URL。
- 4 ページとも両ロケール。フッターから常にリンク。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-08-1 | ビルド後、`about privacy contact submit` × 両ロケールの HTML が存在する | `dist.test.ts` |
| AC-08-2 | `privacy/index.html` に `AdSense` `Cookie` `google.com/settings/ads` と X の埋め込みについての記述（EN: `embedded posts from X` / JA: `X の投稿`）が含まれる | `dist.test.ts` |
| AC-08-3 | `submit/index.html` に `issues/new?template=submit-project.yml` を含むリンクがある | `dist.test.ts` |
| AC-08-4 | 全 HTML のフッターに `/privacy` へのリンクがある | `dist.test.ts` |

## R-09 編集ワークフロー

- `npm run check` = `astro sync && astro check && vitest run`。不正データはここで落ちる。
- `scripts/refresh-stars.mjs`：`repoUrl` が GitHub のエントリについて `GET https://api.github.com/repos/<o>/<r>` を呼び、`stars` と `starsUpdatedAt` だけを更新して JSON を 2 スペース整形で書き戻す。`GITHUB_TOKEN` があれば使う。失敗したエントリはスキップして続行。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-09-2 | `stargazers_count` が number 以外（null / 文字列 / 負数）の応答は失敗扱いにして元のエントリを保持する | `refresh-stars.test.ts` |
| AC-09-1 | `updateStars(entries, fetchFn, today)` は GitHub 以外・fetch 失敗のエントリを変更せず、成功したものだけ `stars` `starsUpdatedAt` を書き換え、他のキーと順序を保つ | `refresh-stars.test.ts` |

## R-10 表示

- 幅 390px で横スクロールが出ない。カードは 1 列。ヘッダーは 2 段（ブランド＋言語切替 / ナビ 4 つ均等）、モバイルでは sticky にしない。hero はイラストを小さく（約 11rem）し、主ボタンが早く見える。
- 日本語ページの見出しは単語の途中で改行しない（`overflow-wrap: normal; line-break: strict`）。`ch` 単位の幅指定を日本語に適用しない。
- `prefers-color-scheme` でライト／ダークが切り替わる。
- 外部 CSS フレームワークを使わない。
- `--fg-faint` を含む本文色は、実際に載る背景（`--bg` と `--bg-elev`）に対して両テーマで 4.5:1 以上。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-10-1 | 390×844 で `/` `/projects` `/projects/flybody` を開くと `scrollWidth <= clientWidth` | `e2e/mobile.spec.ts` |
| AC-10-2 | `colorScheme: dark` と `light` で `body` の背景色が異なる | `e2e/mobile.spec.ts` |
| AC-10-3 | tokens.css の `--fg` `--fg-muted` `--fg-faint` × `--bg` `--bg-elev` の全組み合わせが両テーマで 4.5:1 以上 | `contrast.test.ts` |

## R-11 カードと詳細ページの視覚要素（2026-09-12 ユーザー指示「カードに画像か動画を」）

全カードに 2:1 のカバーを出す。優先順位:

| 順 | 条件 | カバー | 出どころ |
|---|---|---|---|
| 1 | `thumbnail` あり | その画像（`/thumbs/` のローカルファイル、`imageCredit` 必須） | 自前 |
| 2 | `video` あり（YouTube URL） | `https://i.ytimg.com/vi/<id>/hqdefault.jpg`。詳細ページでは YouTube の公式埋め込み（`youtube-nocookie.com`）を表示 | YouTube が埋め込み用に配信 |
| 3 | `image` あり（https の外部 URL、`imageCredit` 必須） | その画像 | 提供元が公開しているプレビュー画像、または**寛容なライセンス（MIT / Apache-2.0 / BSD / CC-BY / GPL）のリポジトリ README に置かれたデモ画像・GIF**。`imageCredit` にリポジトリとライセンスを書く |
| 3b | `url` が X（Twitter）の投稿で、投稿に写真か動画がある | X の配信 CDN（`pbs.twimg.com`）から取った写真、または動画のポスター画像。`scripts/fetch-x-media.mjs` が `image` `imageKind`（`photo` / `video-poster`）`imageCredit`（`@handle on X`）を書き込む。カードは `video-poster` のとき再生バッジを重ねる。詳細ページは X 公式の埋め込み（`platform.twitter.com/widgets.js`）で投稿そのものを表示する | X が埋め込み用に配信 |
| 4 | `repoUrl` が GitHub | `https://opengraph.githubassets.com/<id>/<owner>/<repo>`（GitHub のソーシャルプレビュー） | GitHub が埋め込み用に生成 |
| 5 | それ以外 | 生成カバー: `id` から決定的に作るニューロン網の SVG。カテゴリ色、プロジェクト名入り。**ビルド時に `/covers/<id>.svg` として出力し `<img>` で参照する**（inline にしない） | 自作 |

- 外部画像は `loading="lazy"`、`referrerpolicy="no-referrer"`、読み込み失敗時は `onerror` で `src` を `/covers/<id>.svg` に差し替える（隠し SVG を同梱しない）。
- `video` はスキーマの時点で `youtubeId()` が ID を返す URL だけを通す。
- 生成カバーは同じ `id` なら常に同じ図（ビルドの再現性）。
- 追加フィールド: `video`（YouTube の URL）、`image`（URL）、`imageCredit`（string）。`image` または `thumbnail` があるとき `imageCredit` 必須。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-11-1 | `coverFor()` が上の優先順位どおりに `kind` と `src` を返す | `media.test.ts` |
| AC-11-2 | `youtubeId()` が watch / youtu.be / shorts / embed の各 URL から ID を取り、それ以外は null | `media.test.ts` |
| AC-11-3 | `generatedCover(id, category, name)` が同じ入力で同じ SVG を返し、`<svg` で始まりカテゴリ色を含む | `media.test.ts` |
| AC-11-4 | `image` があって `imageCredit` が無いエントリはスキーマで失敗する | `schema.test.ts` |
| AC-11-5 | `ProjectCard` は GitHub リポジトリで `opengraph.githubassets.com` の `<img>` を、リポジトリ無しで `/covers/<id>.svg` の `<img>` を、`video` ありで `i.ytimg.com` の `<img>` を描画する。inline `<svg` は含まない | `components.test.ts` |
| AC-11-9 | ビルド後、生成カバー対象の各エントリに `covers/<id>.svg` が存在し `<svg` で始まる | `dist.test.ts` |
| AC-11-10 | `xStatusId()` が x.com / twitter.com の status URL から ID を取り、それ以外は null | `x-media.test.ts` |
| AC-11-11 | `pickXMedia()` は動画ならポスター、写真なら 1 枚目を `pbs.twimg.com` に限って選ぶ | `x-media.test.ts` |
| AC-11-12 | `updateXMedia()` は X 投稿のエントリだけに `image` `imageKind` `imageCredit` を書き、既に `image` があるものと X 以外は変えない | `x-media.test.ts` |
| AC-11-13 | `ProjectCard` は `imageKind: video-poster` のとき再生バッジ（`data-play`）を出し、`CoverMedia` は `url` が X の投稿なら公式埋め込み（`twitter-tweet` と widgets.js）を出す | `components.test.ts` |
| AC-11-6 | 詳細ページは `video` があるとき `youtube-nocookie.com/embed/<id>` の iframe を出す | `components.test.ts` |
| AC-11-7 | ビルド後、`projects/index.html` の全カードに `.card__cover` がある | `dist.test.ts` |
| AC-11-8 | 390px 幅でカバー画像がカード幅を超えない | `e2e/mobile.spec.ts` |

## R-12 ハエの顔と脳のビジュアル（2026-09-12 ユーザー指示「ファビコンはハエの顔、トップにハエの顔と脳」）

- `public/favicon.svg` はハエの顔（複眼 2 つ・単眼・触角）を単純化した自作 SVG。`<title>` に "fly" を含む。
- トップページの hero に、正面から見たハエの顔と、その中で光る脳（中枢脳＋左右の視葉のニューロン網）を描いた自作 inline SVG（`FlyHero.astro`）を置く。`role="img"` と両言語の `aria-label`。
- 脳のノードは CSS で弱く明滅する。`prefers-reduced-motion: reduce` では止める。
- 画風は「簡略化した科学図解」寄り: 光彩のぼかしは弱く（stdDeviation 4 程度）、脳の面は薄く（不透明度 0.12 程度）、複眼の網目は控えめ、口器は短め。ヘッダーのブランドマークはファビコンと同じハエの顔を使う。
- 390px 幅では hero の絵が本文の上に 1 列で収まり、横スクロールを出さない（AC-10-1 で担保）。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-12-1 | `favicon.svg` が存在し、`<title>` に fly を含み、複眼を表す要素（`data-part="eye"`）が 2 つある | `dist.test.ts` |
| AC-12-2 | `FlyHero` が `role="img"`、`data-hero="fly"`、脳の要素（`data-part="brain"`）と目（`data-part="eye"` × 2）を含む inline SVG を描画し、`aria-label` がロケールで変わる | `components.test.ts` |
| AC-12-3 | ビルド後の `index.html` と `ja/index.html` に `data-hero="fly"` がある | `dist.test.ts` |

## R-13 アクセス解析（2026-09-12 ユーザー指示）

- 既定は **Vercel Web Analytics**（Cookie を使わず、個人を特定しないページビュー集計）。環境変数 `PUBLIC_VERCEL_ANALYTICS=1` のときだけ、全ページの `<head>` に `window.va` の初期化と `<script defer src="/_vercel/insights/script.js">` を出す。Vercel 側でプロジェクトの Web Analytics を有効にしておく。
- **Google Analytics 4 は任意**。`PUBLIC_GA_MEASUREMENT_ID`（`G-` で始まる ID）が設定されたときだけ gtag を出す。GA は Cookie を使うため、EU/UK/CH 向けは AdSense と同じ CMP の同意信号に従わせる（Consent Mode の既定は `analytics_storage: denied`）。
- どちらも 404 ページには出さない（R-07 と同じ `ads={false}` 相当の扱い）。
- Privacy ページは有効な解析手段に応じて文言が変わる（未設定なら「使用していません」、Vercel なら Cookie なしの集計である旨、GA なら Cookie と Google のポリシーへのリンク）。
- 集計の閲覧は Vercel ダッシュボード（Analytics タブ）か、Claude の Vercel 連携 `get_web_analytics` で行う。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-13-1 | `analyticsConfig(env)` は `PUBLIC_VERCEL_ANALYTICS` が真値のときだけ `vercel: true`、`PUBLIC_GA_MEASUREMENT_ID` が `G-…` 形式のときだけ `gaId` を返す | `analytics.test.ts` |
| AC-13-2 | `BaseLayout` は Vercel 有効時に `/_vercel/insights/script.js` を、GA 有効時に `googletagmanager.com/gtag/js?id=` と Consent Mode の既定 denied を出し、無効時はどちらも出さない。`ads={false}`（404）では出さない | `components.test.ts` |
| AC-13-3 | ビルド後、`PUBLIC_VERCEL_ANALYTICS` 設定時は 404 以外の全 HTML に insights スクリプトがあり Privacy に「Vercel Web Analytics」がある。未設定時はどの HTML にも無く、Privacy は「使用していません」 | `dist.test.ts` |

## R-14 WebMCP（エージェント向けのツール公開）（2026-09-13 ユーザー指示）

AI エージェントを積んだブラウザに対して、ページ自身が呼び出せるツールを宣言する。
仕様は W3C Web Machine Learning Community Group の
[WebMCP draft](https://webmachinelearning.github.io/webmcp/)（CG Draft、2026-04 版）と
[explainer](https://github.com/webmachinelearning/webmcp/blob/main/README.md)。標準化トラックには乗っていない。
記事によると Chrome 146 Canary（2026-02-10）と Edge 147 が実装済み、Chrome 149 が Origin Trial 中で、
安定版は 2026 Q4 見込み。**未対応ブラウザでは何も起きない**（機能検出して no-op）。

- 入口は **`document.modelContext`**（`[SecureContext]` なので https か localhost のみ）。
  `navigator.modelContext` ではない（複数の解説記事がそう書いているが、ドラフト本体の IDL は `partial interface Document`）。
  フォールバックとして `navigator` を見に行くことはしない。
- 登録は `await document.modelContext.registerTool({ name, description, inputSchema, execute })`。
  `execute` は `Promise<any>` を返し、ブラウザが JSON にシリアライズする。
- 純クライアント側で完結する。サーバー関数もアダプタも増やさない（静的出力のまま）。
- データは R-05 の `/search-index.json` を最初のツール呼び出し時に 1 回だけ取得して使い回す。
  `search-index.json` のキーは AC-05-1 で固定されているので**変更しない**。
  取得に失敗したら投げずに `{ ok: false, reason: 'index-unavailable' }` を返す（AC-05-5 と同じ方針）。
- 登録が例外を投げてもページの描画に影響させない（try/catch）。

### 公開するツール

| name | 入力 | 返すもの |
|---|---|---|
| `search-projects` | `q` `category` `dataset` `tag` `limit`（すべて任意） | `{ ok, total, results[] }`。`results` は `limit` 件（既定 20・上限 50） |
| `get-project` | `id`（必須） | `{ ok, found, project }`。`project` に `page` `page_en` `page_ja` を足す |
| `list-categories` | なし | 7 カテゴリの `slug` `label` `blurb` `count` `page` |
| `list-datasets` | なし | データセット ID の `id` `label` `usedBy` `page` |

- `inputSchema` は `type` / `properties` / `required` / `enum` / `description` / `additionalProperties: false` だけを使う。
  ドラフトは JSON Schema の方言を固定していないので `$schema` は書かない。
  `category` は `CATEGORIES`、`dataset` は `DATASET_IDS` を `enum` で出す（分類は閉じているのでエージェントに見せる）。
- **ツール名と `description` は英語で固定する。** これはエージェントがツールを選ぶための識別子であって画面の文言ではないため、
  ロケールで変えない。一方、**返すデータはページのロケールに従う**（`description` は `description_<locale>`、
  `page` は JA ページなら `/ja/...`）。
- `search-index.json` に無い項目（`org` `date` `repoUrl` `sourceRefs` など）は返さない。
  `get-project` の description に「詳細は `page` を取得せよ」と書く。

### 置き場所

- `src/lib/webmcp.ts`: 純関数（`buildTools` `searchItems` `getItem` `projectPages`）。ユニットテストはここを叩く。
- `src/components/WebMcpTools.astro`: 機能検出して登録するだけ。目印として `data-webmcp` を持つ要素を 1 つ出す。
  スクリプトは Astro にバンドルさせる（`is:inline` にしない）ので `src/lib/webmcp.ts` を import できる。
- `BaseLayout` から**全ページに出す。404 ページにも出す**（R-07 / R-13 の `ads={false}` ゲートには従わない）。
  URL を間違えて 404 に着いたエージェントこそ `search-projects` を必要とするため、意図的に例外にする。
- Privacy ページに「エージェント対応ブラウザ向けにローカルのツールを登録すること、データはブラウザの外に出ないこと」を両言語で書く。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-14-1 | `buildTools(items, locale)` が 4 つの記述子を `search-projects get-project list-categories list-datasets` の名前で返し、各 `inputSchema` が `additionalProperties: false` を持ち `$schema` を持たない | `webmcp.test.ts` |
| AC-14-2 | `searchItems` が `q`（name / tags / description を大文字小文字を無視して部分一致）・`category`・`dataset`・`tag` で絞り、`limit` は既定 20・上限 50 に丸められる | `webmcp.test.ts` |
| AC-14-3 | `getItem` は未知の `id` に `null` を返し、`projectPages('x')` は `{ page_en: '/projects/x', page_ja: '/ja/projects/x' }` を返す。`locale='ja'` のとき `page` は `/ja/` 始まり | `webmcp.test.ts` |
| AC-14-4 | `BaseLayout` は `data-webmcp` を持つ要素を描画し、`ads={false}`（404 相当）でも描画する | `components.test.ts` |
| AC-14-5 | ビルド後、`404.html` を含む全 HTML に `data-webmcp` がある | `dist.test.ts` |
| AC-14-6 | `document.modelContext` をスタブしたブラウザで `/` を開くと 4 つのツールが登録され、`search-projects({category:'connectome'})` の結果が全件 `connectome` で `total` が `search-index.json` の該当件数と一致する。`/ja/` で `get-project({id:'flybody'})` を呼ぶと `page` が `/ja/` 始まり | `e2e/webmcp.spec.ts` |
| AC-14-7 | Privacy ページ（両言語）に WebMCP の説明がある（EN: `WebMCP` / JA: `WebMCP`） | `dist.test.ts` |

## R-15 ハウス広告「広告募集中」（2026-09-13 ユーザー指示）

AdSense の審査が通るまで（R-07 の「広告無効かつ本番ビルドでは何も出さない」状態）、空いている広告枠に
**自前の「広告募集中」を出し、Google フォームへのリンクで問い合わせを受ける**。

- 新しい環境変数 `PUBLIC_AD_INQUIRY_URL`（https の URL）。**未設定なら従来どおり何も変わらない。**
- **問い合わせ先はロケールごとに分ける。** `PUBLIC_AD_INQUIRY_URL_JA` があれば JA ページはそちらを使い、
  無ければ `PUBLIC_AD_INQUIRY_URL` にフォールバックする。EN ページは常に `PUBLIC_AD_INQUIRY_URL` だけを見る
  （`_JA` しか無いときに英語話者へ日本語フォームを出さないため）。
- 出す条件は「**AdSense が無効（`PUBLIC_ADSENSE_CLIENT` 未設定）かつ `PUBLIC_AD_INQUIRY_URL` が https の URL**」のときだけ。
  AdSense が有効になったら枠は実広告が使うので、ハウス広告は自動的に消える。
- 枠ごとの扱い:

  | 枠 | ハウス広告 |
  |---|---|
  | leaderboard | 毎ページ出す |
  | sidebar | 詳細ページで出す |
  | infeed | **そのページの最初の 1 回だけ**。一覧 77 件で同じ文言が 12 回並ぶのを避ける |

- ハウス広告は実際の中身なので `SLOT_MIN_HEIGHT` の高さ確保を使わず、内容なりの高さにする
  （高さ確保は実広告の到着による層ずれを防ぐためのもので、ハウス広告には当てはまらない）。
- リンクは外部リンクなので `target="_blank"` と `rel="noopener noreferrer"`（AC-04-7 と同じ扱い）。
  Google フォームは**リンクするだけで埋め込まない**。ページ側で Google のスクリプトや Cookie を読み込まない。
- 404 ページには出さない（R-07 の `ads={false}` に従う）。
- ハウス広告を出す枠では dev の破線プレースホルダ（AC-07-3b）より優先し、dev でも実物が見える。
  出さない枠（`house={false}` の in-feed 2 回目以降）と未設定時は、従来どおり dev で破線のまま。
- 文言は `src/i18n/{en,ja}.ts` に両言語で持つ（AC-03-1 のキー一致が効く）。
- Privacy ページに、問い合わせフォームが Google フォームであり送信内容が Google に渡ることを両言語で書く
  （R-13 の解析文言と同じく、`PUBLIC_AD_INQUIRY_URL` が設定されているときだけ出す）。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-15-1 | `houseAd(env)` は AdSense 有効時に `null`、`PUBLIC_AD_INQUIRY_URL` 未設定・空・非 https のとき `null`、無効かつ https の URL のときだけその URL を返す | `ads.test.ts` |
| AC-15-2 | `AdSlot` はハウス広告設定時に `data-house-ad="<name>"` と、`target="_blank"` かつ `rel` に `noopener` を持つ問い合わせリンクを描画する。AdSense 有効時は `adsbygoogle` を出し `data-house-ad` を出さない | `components.test.ts` |
| AC-15-3 | `AdSlot` に `house={false}` を渡すと、設定済みでもハウス広告を描画しない。本番では空、dev の破線プレースホルダ（AC-07-3b）の挙動は変えない | `components.test.ts` |
| AC-15-4 | `ProjectGrid` に 13 件渡すと、ハウス広告設定時に `data-house-ad="infeed"` がちょうど 1 つだけ入る（in-feed 枠自体は 2 つある） | `components.test.ts` |
| AC-15-5 | `BaseLayout` に `ads={false}`（404）を渡すと、ハウス広告設定時でも `data-house-ad` を含まない | `components.test.ts` |
| AC-15-6 | env 未設定でビルドした `dist/` のどの HTML にも `data-house-ad` が無く、Privacy に広告問い合わせの記述が無い（既定で何も増えない） | `dist.test.ts` |
| AC-15-7 | `houseAd(env,'ja')` は `PUBLIC_AD_INQUIRY_URL_JA` を優先し、無ければ `PUBLIC_AD_INQUIRY_URL` を使う。`houseAd(env,'en')` は `_JA` を無視し、`PUBLIC_AD_INQUIRY_URL` だけを見る | `ads.test.ts` |
| AC-15-8 | `AdSlot` に `locale='ja'` を渡すと JA 用の URL を、`locale='en'` では EN 用の URL をリンク先にする | `components.test.ts` |

## R-16 一覧の並べ替え（2026-09-13 ユーザー指示「人気順や最新順でソートできるように」）

`/projects` のカード一覧を、検索 UI（R-05）と同じ列に置いた並べ替えで切り替える。
並べ替えは検索フォームの一部なので、検索 UI を持たない `/category/<slug>` は SSR の既定順のままにする
（`/projects` 側で category ファセットを使えば同じ絞り込みを並べ替え付きで行える）。

| 値 | UI（EN / JA） | 並び |
|---|---|---|
| `featured`（既定） | Recommended / おすすめ順 | SSR と同じ `sortProjects` 順（featured 優先 → `addedAt` 降順 → id） |
| `stars` | Most stars / 人気順 | `stars` 降順。**`stars` を持たないエントリは最後**（0 として扱わない） |
| `newest` | Newest / 新着順 | `addedAt` 降順（このサイトに載った日） |

- `stars` と `newest` の同点は既定順（SSR の並び）で崩さない。安定ソートにする。
- 状態は `?sort=` に同期し、URL から復元する（R-05 の `q` `category` `dataset` `tag` と同じ扱い）。
  既定の `featured` のときは `sort=` を URL に付けない。
- **並べ替えはカード（`[data-id]`）どうしだけを入れ替える。** グリッド内のカード以外の子要素
  （in-feed の広告枠・ハウス広告）は DOM 上の位置を動かさない。R-07 の「要求済み広告を隠さない」に反しないため。
- 並べ替えの鍵はカードの `data-stars` / `data-added` 属性から読む。
  **`/search-index.json` のキーは AC-05-1 が固定しているので変更しない。**
- JS 無効時は SSR の既定順がそのまま読める（並べ替え UI は JS が有効なときだけ意味を持つ）。
- 検索・ファセットとの併用ができる（絞り込んだ結果の中で並べ替わる）。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-16-1 | `SORT_MODES` が `featured stars newest` をこの順で持ち、`isSortMode` が未知の値を弾く | `sort.test.ts` |
| AC-16-2 | `sortRows(rows,'stars')` は stars 降順で並べ、`stars` が無い行を最後に置く。`sortRows(rows,'newest')` は `addedAt` 降順。どちらも同点は入力順（＝SSR 順）を保つ。`'featured'` は入力順のまま返す | `sort.test.ts` |
| AC-16-3 | `ProjectCard` が `data-stars`（あれば）と `data-added` を描画する | `components.test.ts` |
| AC-16-4 | `SearchProjects` が `name="sort"` の select を 3 つの選択肢付きで描画する | `components.test.ts` |
| AC-16-5 | `/projects?sort=stars` を開くと 1 枚目が最大 stars のカードになり、select が `stars` を指す | `e2e/sort.spec.ts` |
| AC-16-6 | 並べ替えを選ぶと URL に `sort=` が付き、`おすすめ順` に戻すと `sort=` が消える | `e2e/sort.spec.ts` |
| AC-16-7 | グリッドにカード以外の要素を差し込んでから並べ替えても、その要素の子インデックスが変わらない（広告枠が動かない） | `e2e/sort.spec.ts` |
| AC-16-8 | 検索語で絞った状態で `sort=newest` にすると、表示中のカードだけが `addedAt` 降順になる | `e2e/sort.spec.ts` |

## R-17 グローバル UI/UX 刷新（2026-09-13）

- インディゴを基調とした科学図鑑のデザインに統一する。ライト／ダーク、EN／JA、既存の全ページ・検索・広告・出典を維持する。
- トップにロケール別 `/projects` へ `q` を GET 送信する検索フォームを置く。JS 無効でも送信できる。掲載件数・カテゴリ数・データセット数は掲載データから計算する。
- hero、カテゴリ、注目全件、新着6件という構成を維持し、投稿ページへの案内を追加する。既存の自作ハエ図解を使用する。
- 全ページ先頭に、フォーカス時に見えるローカライズした本文スキップリンクを置く。主要な操作部品は高さ44px以上、キーボードフォーカスを明示する。
- 検索・ファセット・並べ替えには常時見えるラベルを置く。ゼロ件時は条件を変更する案内と既存のクリア操作で復帰できる。
- 320 / 390 / 768 / 1440px の両言語でページが横にはみ出さない。動きを抑える設定を尊重する。新しい外部フォント・CSS依存は追加しない。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-17-1 | 両言語のトップ検索から doom を送信すると同じ言語の一覧に q=doom が渡り、結果が絞られる。JS無効でも遷移する | `e2e/redesign.spec.ts` |
| AC-17-2 | 最初の Tab でスキップリンクが表示され、Enter で本文にフォーカスする | `e2e/redesign.spec.ts` |
| AC-17-3 | 検索ラベルが表示され、ゼロ件からクリアで全件に戻る | `e2e/redesign.spec.ts` |
| AC-17-4 | 両言語、4幅でトップ・一覧・詳細・データセットが横にはみ出さない | `e2e/redesign.spec.ts` |

## R-18 解説ページ「ハエ脳とは何か」（2026-09-14 ユーザー指示）

`/what-is-a-fly-brain`（JA は `/ja/what-is-a-fly-brain`）に、この分野の前提を初めて来た人向けに説明する
静的ページを 1 枚置く。ヘッダーとフッターの両方からリンクする。

**概要から詳細へ段階的に読める用途別ガイドにする。**（2026-09-16 ユーザー指示）
短い概要、用途別の入口、仕組みの図、機能の詳細、限界・編集方針の順に、両ロケールで同じ構成にする。
旧版の本文全体の文字数上限は廃止する。長文の羅列を避け、概要カードと標準 HTML の `details` / `summary` で詳しさを選べるようにする。

- 「見る・調べる」「活動を計算する」「身体を動かす」「ゲームで試す」の用途から詳細セクションへ移動できる。
- 掲載済みの代表リポジトリ（FlyWire Codex、neuprint-python、Shiu モデル、flyvis、flybody、FlyGym、Fly Chess Lab）を一次ソースで再確認し、機能・入力と出力・必要環境・最初の操作・限界を両言語で説明する。
- 確認日と確認 URL を解説データに持ち、URL は該当エントリの `sourceRefs` にも残す。本文からは詳細ページ経由で出典とリポジトリに進む。
- 「学習しない」を全実装に一般化しない。固定配線のデモと学習を含む flyvis・flybody を区別する。FlyGym の旧版と現行版の機能を混同しない。
- 数字の大きさではなく、ユーザーができる操作と得られる結果を中心に説明する。

従来の以下の要点も、上記構成の中で短く説明する。

1. **「測った部分」と「決めた部分」の区別。** 配線図は解剖であって生理ではない。この関係
   （測った配線図 ＋ 人が決めたダイナミクスのモデル ＝ 動く「ハエの脳」）を**インライン SVG の図 1 枚**で示す。
   代表的なデータセットへのリンクと、信号の強さ・発火条件・入出力の対応を人が設定する説明を添える。
2. **できること / できないこと。** 段落ではなく**左右 2 列の対比**にする。各項目は見出し 1 行と補足 1 行。
   できる側は回路の応答比較と動作・学習の実験。結果だけでは言えない側は、全モデルが自ら学習することと、生きたハエ全体を再現したこと。
3. **掲載の基準。** 編集方針（§0）への橋渡し。
4. **数値の注意。** 同じデータセットでも出典ごとに数字が食い違うこと。

誠実さの制約（§0 を本文にも適用する）:

- 本文で挙げる数値は `src/data/projects.json` の掲載済みエントリに書かれた値だけを使う。
  出典ごとに食い違う数値（MaleCNS のシナプス数など）は、単一の値として断定せず食い違い自体を書く。
- 本文で言及するプロジェクトは、**必ずそのエントリの詳細ページへリンクする**。外部サイトへ直接リンクしない。
- 本文は自分の言葉で書く。README・記事・投稿の引用をしない。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-18-1 | `explainer.*` の文言キーが en と ja で一致する | `i18n.test.ts` |
| AC-18-2 | ビルド後、`what-is-a-fly-brain/index.html` と `ja/what-is-a-fly-brain/index.html` が存在し、互いに hreflang を持つ | `dist.test.ts` |
| AC-18-3 | 本文中の `/projects/<id>` リンクが 1 件以上あり、その全てが実在するエントリ id を指す | `dist.test.ts` |
| AC-18-4 | 両ロケールのヘッダーとフッターに解説ページへのリンクがある | `dist.test.ts` |
| AC-18-5 | 本文に外部サイトへの `href="http` リンクが無い | `dist.test.ts` |
| AC-18-6 | 両言語、4幅で解説ページが横にはみ出さない | `e2e/redesign.spec.ts` |
| AC-18-7 | 本文に仕組みの図（`<svg>`）、能力と限界の対比（`.compare`）、用途の概要（`data-guide-overview`）がある | `dist.test.ts` |
| AC-18-8 | 用途別の入口が本文中の実在する詳細セクションを指し、代表 7 リポジトリの機能・入出力・環境・最初の操作・限界を両言語で持つ。確認 URL は該当 `sourceRefs` に存在する | `explainer.test.ts` / `dist.test.ts` |
| AC-18-9 | JS 無効でも詳細をキーボードで開閉でき、同じ言語のプロジェクト詳細へ進める | `e2e/explainer.spec.ts` |

## R-19 掲載件数の常時表示（2026-09-14 ユーザー指示「現在登録されているプロジェクト数もどこかに」）

トップの統計（R-17）に加えて、**全ページのフッター**に現在の掲載プロジェクト数を出す。
どのページに着地しても規模が分かるようにする。

- 値は `projects` コレクションの件数から求める。**数値をハードコードしない。**
- 両ロケールに文言を持つ。JA は「掲載プロジェクト 92 件」、EN は "92 projects listed" の形。
- 件数はプロジェクト一覧へのリンクにする。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-19-1 | ビルド後、全 HTML のフッターに掲載件数が出ており、その数が `projects.json` の件数と一致する | `dist.test.ts` |
| AC-19-2 | `footer.count` の文言キーが en と ja の双方にある | `i18n.test.ts`（AC-03-1） |
| AC-19-3 | フッターの件数がロケール別の `/projects` へリンクする | `dist.test.ts` |

## 非スコープ（初期公開では作らない）

サムネイル画像、アクセス解析、OG 画像の自動生成、投稿フォームのバックエンド、ユーザー登録、コメント。
