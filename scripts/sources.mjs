/**
 * 作品ごとの「元」と、このサイトが持っている素材の対応表。
 *
 * ここが唯一の対応表で、`npm run assets:sync`（取り込み）と
 * `npm run check`（更新漏れの検出）の両方がこれを読む。
 * 作品を追加したら、ここにも 1 件足すこと。
 *
 * - `repo`     : private_production からの相対パス（git リポジトリなら更新を追える）
 * - `copy`     : 元リポジトリからそのままコピーする素材
 * - `recorded` : 元リポジトリを動かして録画・生成した素材（コピーではないので自動同期できない）
 */
export const sources = [
  {
    slug: "keiba-ai",
    title: "KEIBA AI",
    repo: "artifacts/keiba-ai",
    copy: [
      { from: "docs/images", to: "public/images/keiba-ai" },
      { from: "docs/model-explainer.mp4", to: "public/video/keiba-model-explainer.mp4" },
    ],
  },
  {
    slug: "fluid-lab",
    title: "Fluid Lab",
    repo: "artifacts/fluid-lab",
    copy: [],
    recorded: [
      {
        dir: "public/video/fluid-lab",
        command: "node scripts/record-fluid-lab.mjs",
        note: "4 モードの実動作。ポスター（public/images/fluid-lab/*-poster.webp）も同時に作り直す",
      },
    ],
  },
  {
    slug: "gold-rush",
    title: "GOLD RUSH",
    repo: "artifacts/medal",
    copy: [],
    recorded: [
      {
        dir: "public/video/gold-rush",
        command: "cd ../artifacts/medal && npm run build   # のあと node scripts/record-gold-rush.mjs",
        note: "実プレイの録画。ポスター（public/images/gold-rush/*-poster.webp）も同時に作り直す",
      },
    ],
  },
  {
    slug: "piano-studio",
    title: "Piano Studio",
    repo: "artifacts/piano",
    copy: [],
    recorded: [
      {
        dir: "public/video/piano-studio",
        command: "node scripts/record-piano-studio.mjs",
        note: "楽譜づくり・鍵盤演奏・AI 生成・音楽 Tips の 4 本。1600×1000 で撮って 1280×800 に縮める（1280 以下だとアプリがインスペクタを畳む）。ポスター（public/images/piano-studio/*-poster.webp）も同時に作り直す",
      },
    ],
  },
  {
    slug: "michishirube",
    title: "ミチシルベ",
    repo: "artifacts/study-app",
    copy: [],
    recorded: [
      {
        dir: "public/video/michishirube",
        command: "python3 scripts/record-michishirube.py",
        note: "Flutter の Linux 版（WSLg）を実際に操作した録画。ブラウザ製ではないので puppeteer ではなく X11 で撮る。ポスター（public/images/michishirube/*-poster.webp）も同時に作り直す",
      },
    ],
  },
  {
    slug: "chess-ai",
    title: "Chess AI",
    repo: "artifacts/My_Chess_AI",
    copy: [{ from: "My project/image-10.png", to: "public/images/chess-ai/gameplay.png" }],
  },
  {
    slug: "mc-eso",
    title: "MC-ESO",
    // 発表資料のビルド成果物。git 管理外なのでハッシュだけで更新を見る
    repo: "research",
    copy: [
      {
        from: "optimization/presentation/20260714/build/figs/p29_methods/methods.svg",
        to: "public/images/mc-eso/methods.svg",
      },
      {
        from: "optimization/presentation/20260714/build/figs/p11_waterfall/sr1e10.svg",
        to: "public/images/mc-eso/waterfall.svg",
      },
    ],
  },
];
