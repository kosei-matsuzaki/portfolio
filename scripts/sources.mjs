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
 * - `emit`     : 逆向き。projects.ts から元リポジトリの作品説明を書き戻す先。
 *                `doc` は README.md（GitHub で最初に見えるのがここなので）。ファイル全体では
 *                なく `<!-- portfolio:begin -->` 〜 `<!-- portfolio:end -->` の内側だけを
 *                書き換えるので、ライセンス・クレジットなど repo 固有の記述は手書きで残せる。
 *                （`npm run docs:emit` が書き、`npm run check` がずれを見る）
 */
export const sources = [
  {
    slug: "keiba-ai",
    title: "KEIBA AI",
    repo: "artifacts/keiba-ai",
    copy: [
      { from: "docs/images", to: "public/images/keiba-ai" },
      { from: "docs/explainer/model-explainer.mp4", to: "public/video/keiba-model-explainer.mp4" },
    ],
    emit: { doc: "README.md", images: "docs/portfolio" },
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
    emit: { doc: "README.md", images: "docs/portfolio" },
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
        note: "実プレイの録画（gameplay / sugoroku / bowl / chinchiro の 4 本 + hero）。ポスター（public/images/gold-rush/*-poster.webp）も同時に作り直す",
      },
    ],
    emit: { doc: "README.md", images: "docs/portfolio" },
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
    emit: { doc: "README.md", images: "docs/portfolio" },
  },
  {
    slug: "michishirube",
    // アプリ名は 2026-08 に「ミチシルベ」→「ツミアゲ」へ改名。slug と素材のパスは旧名のまま
    title: "ツミアゲ",
    repo: "artifacts/study-app",
    copy: [],
    recorded: [
      {
        dir: "public/video/michishirube",
        command: "python3 scripts/record-michishirube.py",
        note: "Flutter の Linux 版（WSLg）を実際に操作した録画。ブラウザ製ではないので puppeteer ではなく X11 で撮る。ポスター（public/images/michishirube/*-poster.webp）も同時に作り直す",
      },
    ],
    emit: { doc: "README.md", images: "docs/portfolio" },
  },
  {
    slug: "tabishiori",
    title: "タビシオリ",
    repo: "artifacts/travel-app",
    copy: [],
    recorded: [
      {
        dir: "public/video/tabishiori",
        command: "python3 scripts/record-tabishiori.py",
        note: "Flutter の Linux 版（WSLg）を実際に操作した録画（日程 / 書類 / 費用 / 地図 の 4 本 + hero）。ツミアゲと同じ方式で、しおり一覧から 1 冊開いて下タブを辿る。ポスター（public/images/tabishiori/*-poster.webp）も同時に作り直す",
      },
    ],
    emit: { doc: "README.md", images: "docs/portfolio" },
  },
  {
    slug: "chess-ai",
    title: "Chess AI",
    repo: "artifacts/My_Chess_AI",
    copy: [{ from: "docs/images/image-10.png", to: "public/images/chess-ai/gameplay.png" }],
    emit: { doc: "README.md", images: "docs/portfolio" },
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
