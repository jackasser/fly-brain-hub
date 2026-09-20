# ハエ脳関連・拡張調査 — 2026-09-20

## 範囲と読み方

前回の6候補に加えて、研究論文、感覚回路、学習モデル、計算基盤、データ横断解析、ロボット、OCR、音楽・文字・服飾まで調査した。今回の追加は26候補。ローカルの146エントリに独立した項目として存在しないものを抽出した。新規公開26件という意味ではない。関連論文が既存項目の出典に含まれる可能性はあり、掲載時には統合も検討する。

確認日は全件2026-09-20。日付欄の「未確定」は公開・更新日を一次資料で確定していないことを示す。クロール日を公開日として扱わない。論文は抄録・研究機関の紹介を中心に、ソフトウェアはREADMEと必要な補足資料を読んだ。実行・独立再現・網羅的なコード監査は行っていない。

「優先」は編集上の候補順位であり、科学的品質の認定ではない。調査時点ではprojects.jsonを変更していなかったが、同日の反映依頼により下記の採否を確定した。

## 2026-09-20 反映結果

- 2件の調査メモの32候補から26件を日英で追加。既存146件と合わせて172件。
- 保留6件：fly-blackjack（由来・重複の追加確認）、FLYT3 / FLYC4（説明の不整合）、自発活動モデルのbioRxiv論文（本文・版の確認）、Fly Brain snnTorch（移植元との独自性確認）、Music in the Body（リポジトリ本文の取得未完了）、Ommatid（反映時のGitHub APIも404）。
- ソフト20件はGitHub公式APIでリポジトリ作成時期・fork=false・ライセンス識別子を照合し、各エントリのsourceRefsにAPI URLも残した。公開日が確定しないものは作成年までの精度でdateを記載する。リポジトリ作成日と初回公開日は同一とは限らない。Music on the Flyは作者による紹介日を用いる。
- 以前からの基盤も含む：neuVid（2020）、EOScircuits（2021）、Connecto（2022）、cocoa / DROCAT（2023）、神経伝達物質資料・雄視覚系解析コード（2024）、train-your-fly（2025）。その他の追加ソフトは2026年作成。全件のaddedAtは調査・掲載日の2026-09-20。
- ライセンスを識別できないコードはunknownとし、確認済みのデータライセンスを併記。GitHubのNOASSERTIONを特定のライセンスと読み替えない。
- MaleCNS v1.0のdateを2026-06-08へ修正し、日英説明に論文公開2026-09-03との違いを明記。既存のaddedAtは維持。

## A. 研究・感覚回路：6候補

| No. | 候補・一次ソース | 確認できた日付 | 要点と限界 | 扱い |
|---|---|---|---|---|
| 1 | [味覚の全配線と摂食・探索・社会行動](https://www.janelia.org/publication/the-complete-gustatory-connectome-of-adult-drosophila-reveals-how-taste-guides-feeding) | Cell 2026-09-03 | オス成体の味覚受容ニューロンを脳から腹側神経索まで再構成した研究。研究機関の抄録を確認。全脳データセットの発表とは別の、感覚から行動への回路研究として扱える。 | 優先。MaleCNSへの関連付け |
| 2 | [Connectome-Based Modelling Reveals Orientation Maps in the Drosophila Optic Lobe](https://arxiv.org/abs/2609.01330) | 投稿2026-09-01 | 配線とスパイキングモデルを組み合わせ、視覚の輪郭方向表現を調べる。プレプリント抄録を確認。計算上の結果と生体での測定を区別する。 | 優先・プレプリント |
| 3 | [Connectome-constrained modeling identifies neurons and synapses that sustain spontaneous activity in Drosophila](https://www.biorxiv.org/content/10.64898/2026.08.21.745055v1) | 正確な投稿日未確定 | FlyWire制約の全脳モデルを自発活動のカルシウム記録に合わせる研究。bioRxivの検索インデックスから抄録・図説明を確認したが、本文の直接取得は失敗。DOI内の日付を掲載日と断定しない。 | 保留・本文と版を再取得 |
| 4 | [The Connectome and the Quest for the Functional Logic of the Drosophila Early Olfactory System](https://arxiv.org/abs/2608.19290) | 投稿2026-08-19 | 初期嗅覚系の配線・シナプス資料を整理し、フィードバックを含む機能モデルを論じる。配線だけでは回路の計算を説明しきれないという視点。 | 総説的な読み物候補 |
| 5 | [FLYNN](https://arxiv.org/abs/2607.00025) | ページ表示：初稿2026-06-21、v2 2026-07-13 | ハエ由来の配線構造を持つRNNをMuJoCoでの視覚ナビゲーションに学習させる。作者は分布外条件や感覚欠損への耐性を報告。抄録確認の段階であり、実機での成功とは記載しない。 | 過去の未掲載研究 |
| 6 | [Fly-connectomic Graph Model（FlyGM）](https://arxiv.org/abs/2602.17997) | 初稿2026-02-20、v3 2026-06-14 | 全脳配線をグラフ型制御器の構造として用い、深層強化学習で物理身体を制御する。作者は複数運動課題と比較結果を報告。生物の神経活動をそのまま再現したものとは区別する。 | 過去の未掲載研究 |

## B. 学習・計算基盤：5候補

| No. | 候補・一次ソース | できること | 掲載前に守る区別 |
|---|---|---|---|
| 7 | [train-your-fly](https://github.com/eudald-seeslab/train-your-fly) | FlyWire v783と複眼モデルをPyTorch Geometricの画像分類モデルとして訓練する。配線の有無を固定し、シナプスごとの係数、任意の閾値、読み出しを学習する。 | 「学習するのは読み出しだけ」ではない。伴走研究コードとの分離は進行中。公開日未確定。 |
| 8 | [AxonWeave](https://github.com/dhakalnirajan/axonweave) | MaleCNSをNumPy/SciPy、PyTorch、TensorFlow/Kerasで利用する疎な学習可能ネットワーク基盤。符号や受容体の扱いを設定として明示する。 | 計測配線と計算モデルを区別。接続構造を維持しても重みは学習可能。公開日未確定。 |
| 9 | [Fly Brain snnTorch](https://github.com/Neuromorphicism/fly-brain-snntorch) | Brian2実装のハエ脳モデルをsnnTorchへ移植し、感覚実験を追加するプロジェクト。 | 元モデルとの一致・速度・追加実験の再現は今回未検証。本家への帰属と移植としての独自性を追加確認。公開日未確定。 |
| 10 | [MaleCNS on Apple MPS](https://github.com/seohyunjun/mps-malecns-model) | Mac上のMaleCNSシミュレーション、指定細胞への刺激、3D活動レポート、固定神経エンコーダと学習する出力層による格子移動課題。 | READMEの実機確認日は9月12日。基本刺激では刺激した2細胞だけが発火したと記載。小さな固定目標課題の成功を一般的移動能力へ拡張しない。 |
| 11 | [Connectome OS](https://github.com/ruvnet/Connectome-OS) | FlyWire由来のグラフに刺激・切断を加えて挙動を調べるRust系の実験・デバッグ環境。 | alpha。READMEはMuJoCo身体結合や大規模な構成要素を未実装として区別している。公開日未確定。 |

## C. データ横断解析・可視化・基礎資料：7候補

これらは今回見つけた未掲載基盤であり、9月の新製品として扱わない。公開日はいずれも未確定（No.17の対応論文は2025年）。

| No. | 候補・一次ソース | 用途・制約 |
|---|---|---|
| 12 | [cocoa](https://github.com/flyconnectome/cocoa) | FlyWire・hemibrain・MANC・MaleCNS間で細胞型の照合や共同クラスタリングを行うPythonライブラリ。READMEではFANC/BANCはTODOなので対応済みと書かない。 |
| 13 | [Connecto](https://github.com/schlegelp/connecto) | CAVEとneuPrintをまたぐ問い合わせ窓口。データセットごとに接続・形態・注釈などの利用可能機能を明示する。すべてのデータセットで同じ情報が取得できるわけではない。 |
| 14 | [DROCAT](https://github.com/Swida-Alba/Drosophila-cross-dataset-connectome-analysis) | 調査時READMEはv4.5.0。Web UIとPythonで経路探索、3D表示、比較、NeuronBridgeの実験用系統探しを行う。BANCの形態類似性解析には未対応の部分がある。 |
| 15 | [neuVid](https://github.com/connectome-neuprint/neuVid) | neuPrintやNeuroglancerの神経形態からBlender等で説明用動画を作る。神経活動シミュレータではなく可視化制作ツール。 |
| 16 | [Drosophila Neurotransmitters](https://github.com/flyconnectome/drosophila_neurotransmitters) | 文献に基づく細胞型ごとの神経伝達物質情報を管理する資料。電子顕微鏡からの予測と文献由来の根拠を説明する入口になる。 |
| 17 | [雄の視覚系コネクトーム解析コード](https://github.com/reiserlab/male-drosophila-visual-system-connectome-code) | Nernらの2025年視覚系論文を再現する補助コード。掲載済みのCell Type Explorerとは役割が異なるが、同一研究の関連リソースとしてまとめる選択肢もある。 |
| 18 | [EOScircuits](https://github.com/FlyBrainLab/EOScircuits) | FlyBrainLab向けの触角・触角葉・キノコ体の実行可能な嗅覚回路ライブラリ。全脳ゲームデモではない。2020–2021年の研究にも基づく既存基盤。 |

## D. 身体・ロボット・実用課題：3候補

| No. | 候補・一次ソース | 確認した内容と限界 |
|---|---|---|
| 19 | [Ommatid](https://github.com/FutureJJ/ommatid) / [実験計画](https://github.com/FutureJJ/ommatid/blob/main/docs/experiment.md) | FlyVisとMaleCNSモデルを六脚ロボットにつなぐ実験。READMEの状態日付は9月11日。第1段階は事前登録した反射を確立できず、見かけの反応の一部を入力由来の問題として訂正。第2段階はdry run。ロボット歩行成功として掲載しない。GitHub本文は検索インデックス経由で確認、通常のopenは失敗。 |
| 20 | [Fly Space Program](https://github.com/steph4n-gh/fly-space-program) | 配線モデルと学習した読み出しによる仮想ロケット制御。READMEは10課題・未知初期条件で60/80着陸、視覚を遮る対照では0/80と報告。失敗20例も残す。実機のFly Cubeや全ミッション達成とは区別する。公開日未確定。 |
| 21 | [FlyOCR](https://github.com/jerryjliu/fly_ocr) / [研究報告](https://github.com/jerryjliu/fly_ocr/blob/main/docs/research-report.md) | 印刷文字を固定MaleCNS回路へ入れ、小さな学習済みデコーダで文字に戻す。報告では通常の線形分類器やCNNが上回る比較も公開。対照実験の条件が違う数値を混ぜず、生物配線の優位性を実証したとはしない。公開日未確定。 |

## E. 音楽・文字・服飾・個別実験：5候補

| No. | 候補・一次ソース | 内容・確認範囲 |
|---|---|---|
| 22 | [Music on the Fly](https://github.com/matsuo-koya/music-on-the-fly) | 松尾公也氏のブラウザ音楽作品。FlyWire配線を人工的ダイナミクスと音楽規則に結び、MIDIや映像を書き出せる。表示座標は解剖座標ではない。作者紹介記事は2026-09-18。 |
| 23 | [Music in the Bodyの作者紹介](https://www.techno-edge.net/article/2026/09/18/5507.html) / [リポジトリ](https://github.com/matsuo-koya/music-in-the-body) | 同日の記事で説明されるMaleCNS版。脳と腹側神経索の配線を音楽へ使う。筋肉や身体物理の再現ではない。作者記事は確認済みだがリポジトリ本文は取得失敗、コード内容・ライセンス詳細は要再確認。 |
| 24 | [Faiku](https://github.com/xyzzyapps/faiku) | 日本語・英語の文字を2D軌跡で描く、キノコ体学習を使う実験。MaleCNS版と8チャネルの簡略版を分けて説明する。見本の文字・詩を描くことと、意味を理解して作句することを混同しない。公開日未確定。 |
| 25 | [Fruit Fly Fashion](https://github.com/jtc268/fruit-fly-fashion) | MaleCNSのスパイクベクトルで印刷図案の位置・角度・大きさを変える服飾アート。元図案と色は人が与える。ハエがゼロから服をデザインするという説明は避ける。公開日未確定。 |
| 26 | [fly-odor-onoff](https://github.com/yukincom/fly-odor-onoff) | 日本語資料もある臭気ON/OFF実験。Minecraft由来モデルを使い、DM1/VA2の4細胞で刺激後に活動が残る現象と入力遮断を調べる。全回路を修正した成果や、生体検証済みの結果ではない。単なるミラーではなく介入実験として確認。公開日未確定。 |

## 掲載済み情報との照合

- **MaleCNSの日付**：前回同様、公式ではv1.0データ公開2026-06-08／論文公開2026-09-03。日付の意味を明確にする候補。出典：[公式](https://male-cns.janelia.org/)。
- **ConnectomeLens / Wired Different**：一覧で違う表示名が見つかったが、同じ[リポジトリ](https://github.com/dhruvin-sarkar/ConnectomeLens)。既存項目に比較結果が記載済みなので新規件数へ含めない。
- **fly-connectome-template**：Web UIとREADMEへの帰属表示を求める[独自ライセンス](https://github.com/cobanov/fly-connectome-template/blob/main/LICENSE)はローカルに反映済み。新たな変更として扱わない。
- **drosophila-brain-mlx**：[現行README](https://github.com/Kisame76/drosophila-brain-mlx)のBrian2比較、M4 Pro計測、シャッフル対照はローカル記述に反映済み。新規成果として重複追加しない。
- **FlyDrones**：[現行リポジトリ](https://github.com/spikecalls/FlyDrones)も確認対象にしたが、今回、更新日を伴う新しい実機成功の根拠は確定していない。「ドローン群の自律操縦を達成」といった拡散表現を追加しない。

## 編集上の優先順位

1. **直近の話題を補う**：Music on the Fly / Music in the Body（作者記事9月18日）、前回のFlyLab（作者投稿9月19日）。
2. **用途の幅を補う**：FlyOCR、train-your-fly、DROCAT、cocoa、Connecto。ゲーム以外に何ができるかを説明しやすい。
3. **研究を補う**：味覚Cell論文、視覚方向マップのプレプリント、FLYNN、FlyGM。査読状態・公開時期・シミュレーション環境を明記。
4. **失敗や限界も説明する**：Ommatid、Fly Space Program、fly-odor-onoff。成功デモの紹介だけでなく、どの条件で何が確かめられたかを掲載する。

前回6候補と今回26候補の合計は32。全件をすぐ独立エントリにする前提ではなく、重複、初出日、ライセンス、カテゴリ適合、デモURLを確定してから採否を決める。

## 発見に使った索引

- [cobanov/awesome-fly](https://github.com/cobanov/awesome-fly)
- [townie/awesome-fruit-fly](https://github.com/townie/awesome-fruit-fly)

索引は候補発見に使い、説明の根拠は各作者・研究機関・論文へ戻した。索引の説明とREADMEで不一致がある場合、未確認事項として残す。
