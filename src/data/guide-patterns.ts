// Primary sources read on 2026-09-16; URLs are also in projects.json sourceRefs.
type PatternCopy = { title: string; flow: [string, string, string]; note: string; brain: string; body: string };
type Pattern = { id: string; project: string; name: string; sources: string[]; ja: PatternCopy; en: PatternCopy };
export const simulationPatterns: Pattern[] = [
  {
    id: 'game', project: 'mario64-fly', name: 'Fly64', sources: ['https://github.com/ornata/fly'],
    ja: { title: '脳をゲームにつなぐ', flow: ['ゲームの画面', '脳のモデル', 'キー・移動操作'], brain: '全脳または部分回路', body: 'ハエの身体は省略', note: 'Fly64 は神経活動をマリオの操作へ変換する。ハエの脚や筋肉は計算しない。入力と出力の対応は作者が設計している。' },
    en: { title: 'Brain controls a game', flow: ['Game images', 'Neural model', 'Game controls'], brain: 'Whole network or a subcircuit', body: 'Fly body omitted', note: 'Fly64 maps neural activity to Mario controls. Fly legs and muscles are not simulated; the input and output mappings are designed by the author.' },
  },
  {
    id: 'brain', project: 'shiu-lif-model', name: 'Shiu model', sources: ['https://github.com/philshiu/Drosophila_brain_model'],
    ja: { title: '脳だけを実験する', flow: ['刺激・抑制', '脳のモデル', '発火の記録'], brain: '神経活動を計算', body: '使わない', note: '指定した細胞を刺激・抑制し、発火時刻や頻度を調べる。身体を動かさなくても、回路の応答を比較できる。' },
    en: { title: 'Experiment on the brain', flow: ['Stimulate / silence', 'Neural model', 'Spike records'], brain: 'Simulated neural activity', body: 'No body needed', note: 'Stimulate or silence cells and examine spike times and rates. Circuit responses can be compared without moving a body.' },
  },
  {
    id: 'body', project: 'flybody', name: 'flybody', sources: ['https://github.com/TuragaLab/flybody'],
    ja: { title: '身体を人工の制御器で動かす', flow: ['人工の制御器', 'MuJoCo の身体', '姿勢・接触'], brain: '全脳モデルは必須ではない', body: '身体の物理を計算', note: '身体と歩行・飛行の課題を用意し、制御器からの指令で動かす。強化学習で制御器を訓練する方法もある。' },
    en: { title: 'Control a body with an artificial policy', flow: ['Artificial controller', 'Body in MuJoCo', 'Posture / contact'], brain: 'Whole-brain model not required', body: 'Body physics simulated', note: 'A controller supplies actions to body and locomotion environments. Reinforcement learning can be used to train the controller.' },
  },
  {
    id: 'coupled', project: 'fly-exe', name: 'Fly.exe', sources: ['https://github.com/Ibtisam-Mohammad/Fly.exe'],
    ja: { title: '脳と身体を両方計算する', flow: ['脳のモデル', '指令への変換', 'MuJoCo の身体'], brain: '神経活動を計算', body: '身体の物理を計算', note: 'Fly.exe は NeuroMechFly の身体と脳を連動させる。ただし歩行のリズムは別のパターン生成器が担う。全ての脚の動きが実測配線から直接出るわけではない。' },
    en: { title: 'Couple brain and body simulations', flow: ['Neural model', 'Action mapping', 'Body in MuJoCo'], brain: 'Simulated neural activity', body: 'Body physics simulated', note: 'Fly.exe couples its brain to a NeuroMechFly body. A separate pattern generator supplies the gait; measured wiring does not directly generate every leg movement.' },
  },
  {
    id: 'robot', project: 'neurohex', name: 'NeuroHex', sources: ['https://github.com/shakeabhishek/project-neurohex'],
    ja: { title: '脳で実物のロボットを動かす', flow: ['カメラの入力', '部分回路のモデル', '実物のモーター'], brain: '部分回路を計算', body: '実機なので物理計算は不要', note: 'NeuroHex は逃避に関わる回路の出力をサーボへ渡す。実際の脚の動かし方には、用意された歩行パターンを使う。' },
    en: { title: 'Drive a physical robot', flow: ['Camera input', 'Neural subcircuit', 'Real motors'], brain: 'Simulated subcircuit', body: 'Physical hardware', note: 'NeuroHex maps escape-circuit output to servos. Its leg movements use a programmed gait.' },
  },
];

type Learning = { id: string; project: string; name: string; sources: string[]; trained: number | null; ja: { title: string; flow: [string, string, string]; note: string; target: string }; en: { title: string; flow: [string, string, string]; note: string; target: string } };
export const learningPatterns: Learning[] = [
  {
    id: 'fixed', project: 'mario64-fly', name: 'Fly64', sources: ['https://github.com/ornata/fly'], trained: null,
    ja: { title: '学習なし', flow: ['神経回路', '固定の変換', 'ゲーム操作'], target: 'なし', note: '活動は変化するが、プレイの経験で操作が上達する学習は行わない。' },
    en: { title: 'No training', flow: ['Neural circuit', 'Fixed mapping', 'Game action'], target: 'None', note: 'Activity changes, but gameplay experience does not train better control.' },
  },
  {
    id: 'readout', project: 'fly-dino', name: 'Fly Dino', sources: ['https://github.com/cobanov/flyjump'], trained: 1,
    ja: { title: '読み出し部分を学習', flow: ['固定の神経回路', '操作を選ぶ層', 'ゲーム操作'], target: '操作を選ぶ層', note: '神経活動をジャンプなどに変換する部分を訓練する。Fly Dino は部分回路を固定して使う。' },
    en: { title: 'Train the readout', flow: ['Fixed circuit', 'Action readout', 'Game action'], target: 'Action readout', note: 'Train the mapping from activity to actions such as jumping. Fly Dino keeps its neural subcircuit fixed.' },
  },
  {
    id: 'controller', project: 'flybody', name: 'flybody', sources: ['https://github.com/TuragaLab/flybody'], trained: 1,
    ja: { title: '身体の制御器を学習', flow: ['環境の観測', '人工の制御器', '身体への指令'], target: '人工の制御器', note: '強化学習の課題で動作を学ばせる。実測の全脳配線を訓練しているとは限らない。' },
    en: { title: 'Train a body controller', flow: ['Observations', 'Artificial controller', 'Body actions'], target: 'Artificial controller', note: 'Learn control in reinforcement-learning tasks. This need not involve training a measured whole-brain network.' },
  },
];
