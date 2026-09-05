# ポートフォリオサイト

就職活動用の自己紹介・作品紹介サイト。Next.js（App Router）で作り、**静的ファイルとして書き出して GitHub Pages に公開**する構成です。

**公開URL: https://kosei-matsuzaki.github.io/portfolio/**

- 技術: Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 / next/font（Zen Old Mincho・Zen Kaku Gothic New・JetBrains Mono をビルド時に自前配信）
- 出力: `next build` で `out/` に HTML・CSS・JS を書き出し（サーバ不要）
- ページ: トップ（LP）1 枚 ＋ 作品ごとの詳細ページ（`/works/<slug>/`）

---

文書の索引は [docs/README.md](docs/README.md)。作業を始める前に読むのは
[CLAUDE.md](CLAUDE.md)（動かすコマンドと、守らないと壊れる決まりごと）。

---

## ディレクトリ

```
portfolio-site/
├── src/
│   ├── app/
│   │   ├── page.tsx              トップページ（LP。セクションを並べているだけ）
│   │   │                          作品 → 研究 → インターン → 技術 → 学歴・資格 の順
│   │   ├── layout.tsx            共通レイアウト・メタデータ
│   │   ├── globals.css           デザイントークン（色・フォント）
│   │   ├── icon.svg              favicon
│   │   └── works/[slug]/page.tsx 作品詳細ページ（データから自動生成）
│   ├── components/               UI 部品（ui.tsx が器と左段のレール、
│   │                              parts.tsx が作品データと素材を見せる部品、
│   │                              Reveal.tsx はスクロール時のフェードイン、
│   │                              Clip.tsx は静止画＋ループ動画の図版）
│   ├── data/
│   │   ├── profile.ts            ★プロフィール・スキル
│   │   ├── projects.ts           ★作品・研究・インターンの内容（サイトの中身の中核）
│   │   ├── techIcons.ts          技術ラベル → アイコンの対応表
│   │   ├── techIcons.generated.ts npm run icons が生成（手で編集しない）
│   │   └── imageSizes.ts         画像の実寸（npm run sizes が生成）
│   └── lib/asset.ts              basePath 対応のパス生成
├── public/
│   ├── images/<slug>/            スクリーンショット・動画のポスター
│   ├── video/<slug>/             ループ再生する無音動画（mp4）
│   └── .nojekyll                 GitHub Pages で _next/ を配信するために必要
├── scripts/
│   ├── sources.mjs               ★元リポジトリと素材の対応表（作品を足したらここにも）
│   ├── check-updates.mjs         npm run check（更新漏れの検出）
│   ├── sync-assets.mjs           npm run assets:sync（素材の取り込み）
│   ├── emit-docs.mjs             npm run docs:emit（元リポジトリ README の作品説明を生成）
│   ├── gen-image-sizes.mjs       npm run sizes
│   ├── gen-tech-icons.mjs        npm run icons（simple-icons からパスを取り出す）
│   ├── assets-state.json         取り込んだ時点の記録（自動生成）
│   ├── lib/projects.mjs          projects.ts を node から読む（型注釈を落として import）
│   ├── lib/assets.mjs            素材の走査・ハッシュ・git の照会
│   ├── lib/emit-doc.mjs          作品 1 件 → README の作品説明ブロック（生成と check が使う）
│   ├── record-fluid-lab.mjs      Fluid Lab の実動作を録画（任意）
│   ├── record-gold-rush.mjs      GOLD RUSH の実プレイを録画（任意）
│   ├── record-piano-studio.mjs   Piano Studio の 4 本を録画（任意）
│   ├── record-michishirube.py    ツミアゲ（Flutter）を録画（任意・X11）
│   └── record-tabishiori.py      タビシオリ（Flutter）を録画（任意・X11）
├── docs/                         見た目の規定・更新手順・残作業（docs/README.md が索引）
└── .github/workflows/deploy.yml  GitHub Pages への自動デプロイ
```
