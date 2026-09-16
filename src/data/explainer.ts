// Editorial summaries, checked against the linked primary sources on 2026-09-16.
// Source URLs also live in the corresponding projects.json sourceRefs.
export const guideGroups = [
  { id: 'explore', ja: { title: '見る・調べる', summary: '神経細胞を探し、つながりを調べる。', level: 'ブラウザ / Python' }, en: { title: 'Explore the wiring', summary: 'Find neurons and investigate their connections.', level: 'Browser / Python' } },
  { id: 'simulate', ja: { title: '活動を計算する', summary: '刺激を与え、回路の反応を比べる。', level: 'Python / ノートブック' }, en: { title: 'Simulate activity', summary: 'Apply a stimulus and compare circuit responses.', level: 'Python / notebooks' } },
  { id: 'body', ja: { title: '身体を動かす', summary: '仮想の脚や羽を制御し、動きを確かめる。', level: 'Python / 物理シミュレーション' }, en: { title: 'Control a body', summary: 'Control virtual legs or wings and observe motion.', level: 'Python / physics simulation' } },
  { id: 'play', ja: { title: 'ゲームで試す', summary: '神経回路の出力が指し手になる過程を見る。', level: 'ブラウザで体験' }, en: { title: 'Try a game', summary: 'See how circuit output becomes a chess move.', level: 'Browser demo' } },
] as const;

type GuideText = { summary: string; features: string; io: string; needs: string; start: string; limits: string };
type GuideProject = {
  id: string; group: typeof guideGroups[number]['id']; name: string;
  checkedAt: string; sources: string[]; ja: GuideText; en: GuideText;
};

export const guideProjects: GuideProject[] = [
  {
    id: 'flywire-codex', group: 'explore', name: 'FlyWire Codex', checkedAt: '2026-09-16',
    sources: ['https://github.com/murthylab/codex', 'https://codex.flywire.ai/faq'],
    ja: {
      summary: 'まず配線図を見たい人向け。FlyWire の神経細胞と注釈をブラウザで調べる入口。',
      features: '神経細胞や注釈を探索・分析する Web アプリ。公開サービスと、自分で動かすためのコードがある。',
      io: '調べたい細胞を指定 → 細胞の情報と配線に関する情報を確認する。',
      needs: '公開サービスの探索機能はブラウザと Google ログインが必要。手元での運用には Python 環境とデータを準備する。',
      start: '詳細ページの公式サイトから探索を始める。自分で運用する場合は README のデータ初期化とローカル起動の順に進む。',
      limits: '配線や注釈を調べる道具。神経の時間変化を計算するシミュレーターとは役割が異なる。',
    },
    en: {
      summary: 'A browser entry point for exploring FlyWire neurons and annotations.',
      features: 'Explore and analyze cells and annotations in a web application, with code for local hosting.',
      io: 'Choose cells to investigate → inspect their information and connectivity.',
      needs: 'A browser and Google sign-in for interactive exploration; Python and prepared data for local hosting.',
      start: 'Open the official site from its project page. For local hosting, follow the README data setup and launch steps.',
      limits: 'A tool for exploring structure and annotations; activity over time requires a simulation model.',
    },
  },
  {
    id: 'neuprint-python', group: 'explore', name: 'neuprint-python', checkedAt: '2026-09-16',
    sources: ['https://github.com/connectome-neuprint/neuprint-python', 'https://connectome-neuprint.github.io/neuprint-python/docs/quickstart.html'],
    ja: {
      summary: '同じ条件で何度も調べたい人向け。neuPrint のデータを Python から取得する。',
      features: '細胞や接続を条件で問い合わせ、結果を表として扱う。手作業の探索から、再実行できる分析へ進める。',
      io: 'データセットと検索条件 → 神経細胞や接続の表。Python で集計や後続の分析に使う。',
      needs: 'Python、接続先サーバー、対象データセット、認証トークン。',
      start: '公式 Quickstart に沿って Client を作り、fetch_custom の検索例から細胞情報を取得する。',
      limits: '問い合わせ先が提供するデータが対象。取得した配線だけで発火や行動が生成されるわけではない。',
    },
    en: {
      summary: 'Retrieve neuPrint data from Python for repeatable analysis.',
      features: 'Query neurons and connections, then work with the returned tables.',
      io: 'Dataset and query criteria → neuron or connection tables for further analysis.',
      needs: 'Python, a server, a dataset and an authentication token.',
      start: 'Follow the official Quickstart: create a Client and try the fetch_custom query.',
      limits: 'Queries cover the data served by the chosen instance. Retrieved wiring alone does not generate activity or behavior.',
    },
  },
  {
    id: 'shiu-lif-model', group: 'simulate', name: 'Shiu et al. / Drosophila_brain_model', checkedAt: '2026-09-16',
    sources: ['https://github.com/philshiu/Drosophila_brain_model'],
    ja: {
      summary: 'この細胞を刺激すると、どこへ活動が伝わるか。細胞を止めた場合との比較もできる。',
      features: '指定した細胞の活性化と抑制。LIF は、入力を蓄え、しきい値を超えると発火する簡略モデル。',
      io: 'FlyWire の細胞 ID と刺激頻度・抑制対象 → 発火の時刻と頻度。',
      needs: 'Python、Brian 2、Jupyter と配線データ。Colab から始める方法もある。',
      start: 'example.ipynb で刺激を試す。対象のデータ版に合わせて設定する。',
      limits: '抑制は対象細胞への入出力結合をゼロにする操作。得られるのはモデルの予測で、実個体の反応との照合が必要。',
    },
    en: {
      summary: 'Stimulate cells and compare activity with a silenced-cell condition.',
      features: 'Activate or silence selected neurons. LIF models accumulate input and fire above a threshold.',
      io: 'FlyWire IDs, stimulation rates and silenced cells → spike times and rates.',
      needs: 'Python, Brian 2, Jupyter and connectivity data; a Colab route is also available.',
      start: 'Try example.ipynb and configure the intended data release.',
      limits: 'Silencing zeros connections to and from selected cells. Model predictions require comparison with biological observations.',
    },
  },
  {
    id: 'flyvis', group: 'simulate', name: 'flyvis', checkedAt: '2026-09-16',
    sources: ['https://github.com/TuragaLab/flyvis'],
    ja: {
      summary: 'ハエの視覚回路が、光や動く輪郭にどう反応するかを調べる。',
      features: '学習済みモデルでの予測、独自刺激の入力、モデルの訓練。光の点滅や動く輪郭を扱う教材がある。',
      io: '映像・視覚刺激 → モデル内の視覚ニューロンの応答。',
      needs: 'Python と PyTorch。公式教材には Colab で試せるノートブックがある。',
      start: 'Flash Responses の教材で光への応答を確認し、Custom Stimuli で自分の刺激へ進む。',
      limits: '対象は視覚系。配線の制約に学習を組み合わせており、固定配線だけを動かすデモと区別して読む。',
    },
    en: {
      summary: 'Investigate how a fly visual-system model responds to light and moving edges.',
      features: 'Use pretrained models, supply custom stimuli or train models; tutorials cover flashes and moving edges.',
      io: 'Visual stimuli or movies → modeled visual-neuron responses.',
      needs: 'Python and PyTorch; official tutorials include Colab notebooks.',
      start: 'Try Flash Responses, then move to Custom Stimuli.',
      limits: 'Models the visual system. Training is combined with wiring constraints, so this differs from fixed-network demos.',
    },
  },
  {
    id: 'flybody', group: 'body', name: 'flybody', checkedAt: '2026-09-16',
    sources: ['https://github.com/TuragaLab/flybody'],
    ja: {
      summary: '脚や羽の制御を、仮想の身体で試す。歩行・飛行の強化学習にも使える。',
      features: 'MuJoCo 上の身体モデル、歩行模倣・飛行・視覚誘導飛行の課題、訓練用コード。',
      io: '身体への制御値 → 物理計算された姿勢・移動と描画画像。',
      needs: 'Python と MuJoCo。学習や学習済み制御器の実行には追加の機械学習依存関係が必要。',
      start: '公式の tutorial notebook で身体を表示し、歩行環境に制御値を渡して変化を見る。',
      limits: '身体と課題の環境。導入するだけで実測の全脳配線につながるわけではなく、制御器を用意する。',
    },
    en: {
      summary: 'Test leg and wing control in a virtual body, including locomotion learning tasks.',
      features: 'MuJoCo body model, walking imitation, flight and vision-guided flight tasks, plus training code.',
      io: 'Body control actions → simulated posture, movement and rendered images.',
      needs: 'Python and MuJoCo; policy execution and training require extra machine-learning dependencies.',
      start: 'Open the tutorial notebook, display the body and try actions in a walking environment.',
      limits: 'Supplies a body and tasks. A controller is required; installation does not automatically connect a measured whole brain.',
    },
  },
  {
    id: 'neuromechfly', group: 'body', name: 'NeuroMechFly / FlyGym', checkedAt: '2026-09-16',
    sources: ['https://github.com/NeLy-EPFL/flygym'],
    ja: {
      summary: '身体と周囲の環境を組み合わせ、感覚から運動までの制御を試す。',
      features: '身体の物理モデルと環境の構成、対話的な表示。NeuroMechFly の研究では視覚・嗅覚と歩行を扱う。',
      io: '環境と身体の制御 → 身体の動きや感覚入力。対応する感覚機能は利用版を確認する。',
      needs: 'Python と利用版に対応する環境。現行 FlyGym と旧版 flygym-gymnasium は API が異なる。',
      start: '現行版の公式ドキュメントから導入する。旧教材を使う場合は旧版のドキュメントと環境を揃える。',
      limits: '現行版には旧版の全機能が移植されていない。身体の再現と、脳全体の再現は別の課題。',
    },
    en: {
      summary: 'Combine a virtual body and environment to study sensorimotor control.',
      features: 'Body physics, scene composition and an interactive viewer. NeuroMechFly research includes vision, smell and walking.',
      io: 'Environment and body control → motion and sensory input; sensory support depends on the version.',
      needs: 'Python and matching dependencies. Current FlyGym and legacy flygym-gymnasium have different APIs.',
      start: 'Use current documentation, or match legacy tutorials with the legacy environment.',
      limits: 'Not all legacy features are ported. Reconstructing a body and modeling an entire brain are separate tasks.',
    },
  },
  {
    id: 'fly-chess-lab', group: 'play', name: 'Fly Chess Lab', checkedAt: '2026-09-16',
    sources: ['https://github.com/tolatolatop/fly-chess'],
    ja: {
      summary: 'ブラウザでチェスを試し、神経活動と指し手の関係を観察する実験。',
      features: '盤面、神経細胞の点群表示、活動記録、手の評価、シナプスを切る対照実験。',
      io: '盤面を人が定めた方法で刺激に変換 → 回路の信号を読み出して指し手を選ぶ。',
      needs: 'WebAssembly などに対応するブラウザ。初回に接続データを読み込み、計算はブラウザ内で行う。',
      start: '詳細ページの公式サイトで対局を試し、活動記録と接続を切った場合の変化を比べる。',
      limits: '読み出しは未学習で棋力は弱い。ハエがチェスを理解する証拠ではなく、入出力の対応は人が設計している。',
    },
    en: {
      summary: 'Play in a browser and observe the link between neural signals and chess moves.',
      features: 'Board, neuron point cloud, activity records, move scores and a disconnected-synapse control.',
      io: 'Board encoded as stimuli → circuit signals projected into move scores.',
      needs: 'A browser supporting WebAssembly and related APIs; data loads initially and computation stays in the browser.',
      start: 'Open the official demo from its project page; compare activity with the disconnected control.',
      limits: 'The untrained readout plays weakly. Human-designed input and output mappings do not demonstrate fly understanding of chess.',
    },
  },
];

// Starting routes summarize the primary sources attached to each selected project.
// These are instructions for the real tools, not executable simulations on this page.
type JourneyText = {
  outcome: string; preparation: string; flow: [string, string, string];
  steps: { action: string; result: string }[]; next: string;
};
export const guideJourneys: Record<typeof guideGroups[number]['id'], {
  project: string; name: string; ja: JourneyText; en: JourneyText;
}> = {
  explore: {
    project: 'flywire-codex', name: 'FlyWire Codex',
    ja: {
      outcome: '気になる細胞を選び、どこにつながるかをたどる。',
      preparation: 'ブラウザ + Google ログイン。Python の準備は不要。',
      flow: ['細胞を検索', '配線を探索', '接続先を確認'],
      steps: [
        { action: '公式サイトを開く', result: '下の入口から詳細ページの「公式サイト」へ。ログインし、FlyWire FAFB を選ぶ。' },
        { action: '細胞の種類を検索', result: '検索欄で「T4a」を試す。該当する細胞の一覧を確認する。' },
        { action: '細胞の情報を開く', result: '検索結果の細胞を選び、入力側・出力側の接続を調べる。' },
      ],
      next: '入口の詳細ページ →「公式サイト」から始める',
    },
    en: {
      outcome: 'Choose a cell and trace which other cells it connects to.',
      preparation: 'Browser + Google sign-in. No Python setup needed.',
      flow: ['Search for cells', 'Explore wiring', 'Find connections'],
      steps: [
        { action: 'Open the official site', result: 'Use the project page below, sign in and select FlyWire FAFB.' },
        { action: 'Search a cell type', result: 'Try T4a in the search field and inspect the matching cells.' },
        { action: 'Open a cell', result: 'Inspect the selected cell and its input and output connections.' },
      ],
      next: 'Project page → Official website',
    },
  },
  simulate: {
    project: 'shiu-lif-model', name: 'Shiu model',
    ja: {
      outcome: '刺激する細胞を変え、発火の違いを比べる。',
      preparation: 'Python のノートブック操作。README に Colab で始める案内あり。',
      flow: ['刺激を指定', '回路を計算', '発火を記録'],
      steps: [
        { action: 'サンプルを開く', result: '詳細ページからリポジトリへ。README の Colab 案内、またはローカル環境で example.ipynb を開く。' },
        { action: 'まず元の条件で実行', result: 'データの版と設定を揃えてサンプルを実行。発火時刻・頻度の出力を確認する。' },
        { action: '刺激条件を変えて比較', result: '刺激頻度や抑制する細胞を変更して再実行。同じ条件の基準結果と比べる。' },
      ],
      next: '入口の詳細ページ → リポジトリの README / example.ipynb',
    },
    en: {
      outcome: 'Change neural stimulation and compare the resulting spikes.',
      preparation: 'Python notebook skills. The README also describes a Colab route.',
      flow: ['Set a stimulus', 'Run the circuit', 'Record spikes'],
      steps: [
        { action: 'Open the example', result: 'Follow the repository README to Colab or open example.ipynb locally.' },
        { action: 'Run the baseline', result: 'Match the data release and settings, then inspect spike times and rates.' },
        { action: 'Change and compare', result: 'Change stimulation or silencing, rerun and compare with the baseline.' },
      ],
      next: 'Project page → Repository README / example.ipynb',
    },
  },
  body: {
    project: 'flybody', name: 'flybody',
    ja: {
      outcome: '仮想の脚に制御値を渡し、姿勢の変化を見る。',
      preparation: 'Python + MuJoCo。まず身体の表示と制御を試す。',
      flow: ['制御値を入力', '物理を計算', '姿勢を確認'],
      steps: [
        { action: '環境を準備する', result: '詳細ページから README の Installation へ。基本構成を導入し、tutorial notebook を開く。' },
        { action: '身体を表示する', result: '教材の歩行環境を作り、ハエの画像を描画。まずモデルが表示されることを確かめる。' },
        { action: '制御値を渡してみる', result: 'env.step(action) を進め、姿勢の変化を見る。歩かせるには別途制御器が必要。' },
      ],
      next: '入口の詳細ページ → README の Installation / tutorial notebook',
    },
    en: {
      outcome: 'Send actions to virtual legs and observe changes in posture.',
      preparation: 'Python + MuJoCo. Begin with body visualization and control.',
      flow: ['Supply actions', 'Simulate physics', 'Observe posture'],
      steps: [
        { action: 'Prepare the environment', result: 'Follow the README core installation and open the tutorial notebook.' },
        { action: 'Display the body', result: 'Create the walking environment and render an image to check the model loads.' },
        { action: 'Try control actions', result: 'Advance env.step(action) and inspect posture. Walking requires a controller.' },
      ],
      next: 'Project page → README installation / tutorial notebook',
    },
  },
  play: {
    project: 'fly-chess-lab', name: 'Fly Chess Lab',
    ja: {
      outcome: '神経回路の信号が、チェスの一手になる様子を見る。',
      preparation: 'WebAssembly 対応ブラウザ。最初に接続データの読み込みあり。',
      flow: ['盤面を入力', '回路を計算', '指し手を選ぶ'],
      steps: [
        { action: '公開デモを開く', result: '詳細ページの「公式サイト」へ。初回の接続データ読み込みが終わるまで待つ。' },
        { action: '対局を試す', result: '盤面で操作し、モデルが選ぶ手と活動記録を見る。強い棋力を目指すデモではない。' },
        { action: '接続を切った結果と比較', result: 'シナプスを切る対照条件を試し、活動や着手の変化を確認する。' },
      ],
      next: '入口の詳細ページ →「公式サイト」の公開デモ',
    },
    en: {
      outcome: 'Watch circuit signals turn into a chess move.',
      preparation: 'WebAssembly-capable browser. Connection data loads on first use.',
      flow: ['Encode the board', 'Read circuit signals', 'Choose a move'],
      steps: [
        { action: 'Open the public demo', result: 'Follow the official website link and wait for the connection data to load.' },
        { action: 'Try a game', result: 'Use the board and inspect moves and activity records. Playing strength is limited.' },
        { action: 'Compare a disconnected circuit', result: 'Try the disconnected-synapse control and inspect activity and move selection.' },
      ],
      next: 'Project page → Official website demo',
    },
  },
};
