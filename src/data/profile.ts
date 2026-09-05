/* ============================================================
   プロフィール（このファイルを書き換えるだけで全ページに反映される）

   ★要確認・要記入マーク付きの項目は、事実に合わせて必ず修正してください。
   ============================================================ */

export const profile = {
  /** ローマ字表記（ヒーローの大見出し） */
  nameEn: "Kosei Matsuzaki",
  /** ★要記入: 漢字表記。空文字のままなら表示されません */
  nameJa: "",
  /** 所属（本人確認済み） */
  affiliation: "東京大学大学院 情報理工学系研究科 電子情報学専攻 修士1年",
  /** ★要記入: 研究室名（例: 〇〇研究室）。空なら非表示 */
  lab: "",
  /** ★要確認: 修了予定（2026年4月入学 + 標準の2年から算出） */
  graduation: "2028年3月 修士課程修了見込み",
  /** ヒーローのキャッチコピー */
  tagline: "作りたい仕組みを、自分で設計して、数字で確かめる。",
  /** ヒーロー下の紹介文（2〜3文） */
  intro:
    "最適化アルゴリズムを研究しながら、機械学習・数値シミュレーション・3D ゲーム・モバイルアプリまで領域を絞らずに個人開発をしています。" +
    "探索アルゴリズムやニューラルネットの推論エンジンはライブラリに任せず自分で書き、" +
    "効いた改善も効かなかった改善も数字で確かめて残しています。",

  /** 連絡先（★公開したくない場合は空文字にすると非表示になります） */
  email: "sunl19ht.matsuzaki@gmail.com",
  github: "https://github.com/kosei-matsuzaki",

  /** ヒーロー横のキーワード */
  keywords: [
    "機械学習 / 最適化",
    "グラフィックス・数値シミュレーション",
    "フルスタック Web",
    "モバイルアプリ",
  ],

  /** 学歴（古い順に並べる＝この配列の順にそのまま上から表示される） */
  education: [
    {
      range: "2019.04 – 2022.03",
      title: "渋谷教育学園幕張高等学校",
      note: "卒業",
    },
    {
      range: "2022.04 – 2026.03",
      title: "東京大学 工学部 電子情報工学科",
      note: "理科一類で入学し、電子情報工学科へ進学して卒業",
    },
    {
      range: "2026.04 –",
      title: "東京大学大学院 情報理工学系研究科 電子情報学専攻",
      note: "修士課程 在学中（2028年3月 修了見込み）",
    },
  ],

  /** 資格（note が空なら補足は出ません） */
  certifications: [
    { title: "実用英語技能検定 準1級", note: "中学3年時に取得" },
    { title: "普通自動車第一種運転免許（AT限定）", note: "" },
  ],

  /** ヒーロー下の数値サマリ */
  stats: [
    { value: "7", label: "個人開発作品" },
    { value: "2", label: "研究テーマ" },
    { value: "1", label: "チーム開発（インターン）" },
  ],

  /** 自分の強み（現在サイトには表示していない。出したくなったら
   *  components/sections.tsx の AboutDetails に並べ直す） */
  strengths: [
    {
      title: "中身を自分で実装する",
      body: "Transformer の推論エンジン、αβ 探索、進化計算、流体ソルバ、物理ベースの抽選機構。既製のライブラリで済ませられる部分でも、仕組みを理解するために素の言語で書き直してきました。",
    },
    {
      title: "うまくいかなかったことも数字で残す",
      body: "改善案は複数シードの A/B で判定し、棄却したものも記録します。競馬 AI では 10 方向の改善が全て効かなかったという結果から「市場効率の壁」を定量的に確認しました。",
    },
    {
      title: "設計とドキュメントで開発を回す",
      body: "依存方向・命名規約・仕様を先に文書化し、テスト（backend 1,000 件超 / E2E など）で守る進め方をとります。AI コーディングエージェントもこの枠組みの中で使っています。",
    },
  ],

  /** スキル（Skills セクション） */
  skills: [
    {
      category: "言語",
      items: ["Python", "TypeScript / JavaScript", "C++", "C#", "Dart", "Rust"],
    },
    {
      category: "機械学習 / 数値計算",
      items: [
        "PyTorch",
        "PyTorch Lightning",
        "NumPy / SciPy",
        "scikit-learn",
        "進化計算・メタヒューリスティクス",
        "BBOB / IOH Experimenter",
      ],
    },
    {
      category: "Web / アプリ",
      items: [
        "FastAPI",
        "React / Vite",
        "Next.js",
        "Tailwind CSS",
        "Flutter / Riverpod / drift",
        "SQLAlchemy + Alembic / SQLite",
      ],
    },
    {
      category: "グラフィックス / ゲーム",
      items: [
        "WebGL2 / GLSL",
        "three.js",
        "Rapier (物理)",
        "Unity",
        "SDL2 / Emscripten (WebAssembly)",
        "Web Audio",
        "流体シミュレーション (FLIP/PIC・浅水方程式)",
        "シェーダ・レイキャスティング",
      ],
    },
    {
      category: "開発基盤",
      items: [
        "Git / GitHub Flow",
        "GitHub Actions",
        "pytest / Vitest / Playwright",
        "Docker (devcontainer)",
        "AWS Amplify",
        "Claude Code",
      ],
    },
  ],
} as const;

export type Profile = typeof profile;
