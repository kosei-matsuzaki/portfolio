@AGENTS.md

<!-- claude-keeper:generated -->

# portfolio-site

就職活動用の自己紹介・作品紹介サイト。Next.js（App Router）で作り、静的ファイルとして
書き出して GitHub Pages に公開する。読むのは、面接の前に 1〜3 分だけ開く採用担当。

## 動かす

```bash
npm run dev            # http://localhost:3000
npm run build          # out/ に静的書き出し
npm run lint
npm run check          # 元リポジトリとのずれを見る（../artifacts/** が要る）
npm run check -- --refs  # 参照の整合性だけ（元リポジトリが無くても通る。CI もこれ）
npm run assets:sync    # 元リポジトリから画像・動画を取り込む（記録は --recorded= / --reviewed= で進める）
npm run sizes          # 画像サイズ表を再生成
npm run docs:emit      # 元リポジトリ README の作品説明を projects.ts から生成
npm run icons          # 技術アイコンを simple-icons から再生成
```

変更したら必ず: `npx tsc --noEmit && npm run lint && npm run build && npm run check`

## どこに何があるか

- `src/data/projects.ts` — 作品・研究・インターンの中身。**サイトの中核**
- `src/data/profile.ts` — プロフィール・学歴・スキル・`stats`
- `src/components/` — UI 部品。器と左段のレールは `ui.tsx`、作品データを描くのは `parts.tsx`
- `src/app/` — 入口。トップ 1 枚と `works/[slug]/`
- `src/lib/asset.ts` — basePath 対応のパス生成
- `scripts/` — 素材の取り込み・生成・録画。対応表は `sources.mjs`
- `public/images/<slug>/` `public/video/<slug>/` — 素材

## 決まりごと

- **`public/` を指すパスは `asset()`（`src/lib/asset.ts`）を通す。**
  `images.unoptimized: true`（静的書き出しに必須）だと `next/image` は `src` を
  そのまま出力するので、`<Image>` も例外ではない。`next/link` は自動で付くのに
  Image は付かず、サブディレクトリ配信（`/portfolio/`）で画像だけ 404 になる。
  実際に公開直後にこれで壊した。`sizeOf()` に渡すキーは basePath なしの生パスのまま:

  ```tsx
  <Image src={asset(shot.src)} width={w} height={h} />   // ✓
  <Image src={shot.src} />                                // ✗ サブディレクトリで 404
  ```

- **新しいブロックは `<Container>`（`src/components/ui.tsx`）で包む。**
  `px-*` を直接書くと左右の余白の 1 系統が崩れる
- **`src/data/projects.ts` が作品説明の唯一の原本。**各元リポジトリ `README.md` の
  `<!-- portfolio:begin -->` 〜 `<!-- portfolio:end -->` は `npm run docs:emit` の
  生成物なので手で編集しない（次の生成で消える）。ずれていたら直すのは `projects.ts`
- **作品を足したら `scripts/sources.mjs` にも足す。**書かないと更新検出の対象外になる
- **`metrics` は実際に数えた値だけ書く。**推測で書かない。確認できないなら現状のまま残す
- **`main` への push がそのまま公開になる。**ワークフローは `cancel-in-progress` なので、
  デプロイ中に続けて push すると前の実行が打ち切られる。まとめてから push する

## 触らないもの

- `src/data/techIcons.generated.ts` — `npm run icons` が上書きする
- `src/data/imageSizes.ts` — `npm run sizes` が上書きする
- `scripts/assets-state.json` — `npm run assets:sync` が書く取り込み記録
- `AGENTS.md` — `next dev` が生成・再追加する
- `out/` `.next/` — ビルド成果物

## 文書

- 索引 — `docs/README.md`
- 見た目の規定（方向性・余白・レール・図版・モーション・表記）— `docs/design.md`
- 中身の更新手順（取り込み・録画・書き戻し・公開・掲載方針）— `docs/operations.md`
- 残作業 — `docs/TODO.md`

## 体制

規約は `.claude/policy.yml`、役は `.claude/agents/`、まとめて回すのは `/standup`。
**`.claude/` は `.gitignore` で除外してあるので、clone しても入らない**（手元だけのもの）。

- `docs-auditor` — docs と実装の食い違い。docs か `scripts/` を直したあと
- `duplication-auditor` — 文書どうしの二重管理。docs を切り出したあと
- `code-steward` — 伸びた・散った・溜まったコード。作品を足したあと
- `critic` — 載せる作品・並び順・書く粒度。作品を足す前
- `user-voice` — 採用担当の 2 分。画面や並びを変えたあと
- `reviewer` — コミット前の差分。**push すると本番なので毎回**

<!-- /claude-keeper:generated -->
