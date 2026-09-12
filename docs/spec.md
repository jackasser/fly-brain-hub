# Fly Brain Hub 仕様書

作成: 2026-09-12 / 状態: 初期公開版（R-01〜R-10 の全 AC にテストあり・Green）

> **この文書が正。** 仕様に無いものは作らない。仕様を変えるときは先にここを直し、次にテスト、最後に実装。
> 各受け入れ条件（AC）は必ずテスト ID を持つ。`todo` はまだテストが無い条件。

## 0. 編集方針（誠実さの契約）

1. **一次ソースを取得して確認した項目だけ掲載する。** 各エントリは `sourceRefs`（確認した URL）を 1 件以上持つ。
2. **説明文は自分の言葉で書く。** README・ツイート本文・記事の転載をしない。画像は R-11 の 3 種（プラットフォームが埋め込み用に配信するプレビュー画像、YouTube の公式埋め込み、自作の生成カバー）だけを使い、記事や README のスクリーンショットを複製・ホットリンクしない。
3. **データは再配布しない。** リンクと説明だけ。データのライセンス（例: FlyWire 由来は CC BY-NC 4.0、MaleCNS / BANC は CC BY 4.0）を `license` 欄に明記する。
4. **暗号資産（memecoin）系は「情報のみ・推奨なし・紹介リンクなし」の注記を常に表示する。**
5. 初期公開は 30〜40 エントリ。

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
| `/projects/<id>` | 順に: 名前・作者 → 説明（ロケール別）と公式・リポジトリリンク → 画像または動画（R-11） → タグ → 出典（sourceRefs）一覧。右カラムに org / region / license / language / date / stars / status とデータセットへのリンク |
| `/datasets` | `connectome` エントリの一覧と「使っているプロジェクト数」 |

カードは name、カテゴリバッジ、データセットバッジ、説明（ロケール別）、license、stars（あれば）を出し、`crypto` は注記を出す。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-04-1 | `ProjectCard` を `crypto` エントリで描画すると注記文が含まれ、他カテゴリでは含まれない | `components.test.ts` |
| AC-04-2 | `ProjectCard` にデータセット・ライセンス・stars を渡すとそれぞれ描画される | `components.test.ts` |
| AC-04-3 | `ProjectGrid` に 13 件渡すと、6 件目と 12 件目の直後に in-feed 広告枠が入る（広告有効時） | `components.test.ts` |
| AC-04-4 | ビルド後、全エントリ × 両ロケールの `projects/<id>/index.html`、全カテゴリの `category/<slug>/index.html`、`datasets/index.html`、`projects/index.html` が存在する | `dist.test.ts` |
| AC-04-5 | 詳細ページに `sourceRefs` の各 URL がリンクとして含まれる | `dist.test.ts` |
| AC-04-6 | `/datasets` の各データセット行に、それを `datasets` で参照するエントリ数が表示される | `dist.test.ts` |

## R-05 検索

- ビルド時に `/search-index.json` を出す。要素: `id name category datasets tags description_en description_ja url license stars`。
- クライアントで Fuse.js を使い `name`（重み 3）`tags`（2）`description_<locale>`（1）を検索する。
- ファセット（category / dataset / tag）は完全一致で絞る。
- 状態は `?q=&category=&dataset=&tag=` に同期し、URL から復元する。
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
- 広告無効かつ本番ビルド: 何も出さない。
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
- `/privacy`：Google AdSense の利用、Cookie（DoubleClick）、パーソナライズ広告のオプトアウト（`https://www.google.com/settings/ads`）、EU/UK/CH では Google 認定の同意管理（CMP）による同意メッセージが出ること（同意の選択に応じて広告が制限または非表示になる、と**断定せずに**書く）、アクセス解析の有無、問い合わせ先。
- `/contact`：連絡手段（GitHub Issues とメール）。
- `/submit`：投稿手順と、`submit-project.yml` テンプレートを指す prefilled issue URL。
- 4 ページとも両ロケール。フッターから常にリンク。

| AC | Given / When / Then | テスト |
|---|---|---|
| AC-08-1 | ビルド後、`about privacy contact submit` × 両ロケールの HTML が存在する | `dist.test.ts` |
| AC-08-2 | `privacy/index.html` に `AdSense` `Cookie` `google.com/settings/ads` が含まれる | `dist.test.ts` |
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

## 非スコープ（初期公開では作らない）

サムネイル画像、アクセス解析、OG 画像の自動生成、投稿フォームのバックエンド、ユーザー登録、コメント。
