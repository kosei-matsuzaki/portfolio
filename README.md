# ポートフォリオサイト

就職活動用の自己紹介・作品紹介サイト。Next.js（App Router）で作り、**静的ファイルとして書き出して GitHub Pages に公開**する構成です。

**公開URL: https://kosei-matsuzaki.github.io/portfolio/**

- 技術: Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 / next/font（Inter・JetBrains Mono をビルド時に自前配信）
- 出力: `next build` で `out/` に HTML・CSS・JS を書き出し（サーバ不要）
- ページ: トップ（LP）1 枚 ＋ 作品ごとの詳細ページ（`/works/<slug>/`）

---

## 最初にやること（★要記入）

`src/data/profile.ts` の以下を実際の内容に直してください。推定で埋めてある項目があります。

| 項目 | 現在の値 | 備考 |
|---|---|---|
| `nameJa` | 空 | 氏名の漢字表記。空のままなら表示されません |
| `lab` | 空 | 研究室名。空なら非表示 |
| `graduation` | 2028年3月 修士課程修了見込み | **推定値**（2026年4月入学＋標準の2年から算出） |

`affiliation`（東京大学大学院 情報理工学系研究科 電子情報学専攻 修士1年）と、
`education` / `certifications`（About セクションに出る学歴の年表・資格）は本人確認済みです。

> 連絡先セクションは設けていません（`profile.email` はデータだけ残してあり、サイトには出ません）。

また `src/data/projects.ts` の `automl-zero-llm` は「学部の研究（〜2026年2月）」として書いていますが、
卒業研究かどうか等の位置づけが違う場合は `period` / `role` / 本文を修正してください。

---

## 開発

```bash
npm install          # 初回のみ
npm run dev          # http://localhost:3000 で確認しながら編集
npm run build        # out/ に静的書き出し
npx serve out        # 書き出した結果をローカルで確認（任意）
```

---

## ディレクトリ

```
portfolio-site/
├── src/
│   ├── app/
│   │   ├── page.tsx              トップページ（LP。セクションを並べているだけ）
│   │   │                          先頭の #about だけは Hero ＋ AboutDetails の 2 段構成
│   │   ├── layout.tsx            共通レイアウト・メタデータ
│   │   ├── globals.css           デザイントークン（色・フォント）
│   │   ├── icon.svg              favicon
│   │   └── works/[slug]/page.tsx 作品詳細ページ（データから自動生成）
│   ├── components/               UI 部品（Reveal.tsx はスクロール時のフェードイン、
│   │                              Clip.tsx は静止画＋ループ動画の図版）
│   ├── data/
│   │   ├── profile.ts            ★プロフィール・スキル
│   │   ├── projects.ts           ★作品・研究・インターンの内容（サイトの中身の中核）
│   │   └── imageSizes.ts         画像の実寸（自動生成）
│   └── lib/asset.ts              basePath 対応のパス生成
├── public/
│   ├── images/<slug>/            スクリーンショット・動画のポスター
│   ├── video/<slug>/             ループ再生する無音動画（mp4）
│   └── .nojekyll                 GitHub Pages で _next/ を配信するために必要
├── scripts/
│   ├── sources.mjs               ★元リポジトリと素材の対応表（作品を足したらここにも）
│   ├── check-updates.mjs         npm run check（更新漏れの検出）
│   ├── sync-assets.mjs           npm run assets:sync（素材の取り込み）
│   ├── assets-state.json         取り込んだ時点の記録（自動生成）
│   ├── gen-image-sizes.mjs       npm run sizes
│   ├── record-fluid-lab.mjs      Fluid Lab の実動作を録画（任意）
│   ├── record-gold-rush.mjs      GOLD RUSH の実プレイを録画（任意）
│   ├── record-piano-studio.mjs   Piano Studio の 4 モードを録画（任意）
│   └── record-michishirube.py    ミチシルベ（Flutter）を録画（任意・X11）
└── .github/workflows/deploy.yml  GitHub Pages への自動デプロイ
```

---

## 内容を更新する

### 文章・数値を直す

`src/data/projects.ts` を編集するだけです。1 作品が 1 オブジェクトで、
`summary`（カードの説明）・`metrics`（数値）・`sections`（詳細ページの本文）を持ちます。

`sections` は次の 4 種類を組み合わせられます。

```ts
{
  heading: "見出し",
  body: ["段落1", "段落2"],                       // 段落
  bullets: [{ title: "小見出し", text: "説明" }],  // 縦線＋● の箇条書き
  // bullets の各項目に media を付けると、図版と説明を左右交互に並べる形になる
  bullets: [{ title: "...", text: "...", media: { poster, video, alt, caption } }],
  table: { headers: [...], rows: [[...]], caption: "..." }, // 比較表（1行目が強調される）
  figure: { src: "/images/...", alt: "...", caption: "...", light: true }, // 図版
}
```

### 作品を追加する

1. `scripts/sources.mjs` に元リポジトリと素材の対応を 1 件足す
2. `npm run assets:sync` で素材を取り込む（録画する作品なら `scripts/record-*.mjs` を用意）
3. `npm run sizes` を実行（画像サイズの一覧を再生成）
4. `src/data/projects.ts` の `projects` 配列に 1 要素追加する
   - `kind: "work"` → Works セクションに表示
   - `kind: "research"` → Research セクションに表示
   - `kind: "internship"` → Internship セクションに表示
5. 詳細ページ `/works/<slug>/` は自動で生成されます
6. 最後に `npm run check` が「使っていない素材」を報告しないことを確認

### 元リポジトリを更新したときの手順（★重要）

`artifacts/` などの作品リポジトリを更新したら、**このサイトの側でも取り残しが出ます**。

いちばん簡単なのは、`private_production/` で Claude Code を開いて
**`/portfolio-update`**（特定の作品だけなら `/portfolio-update fluid-lab`）を実行することです。
下の手順を Claude がひととおり実行し、判断が要る点だけを報告します。
新しい作品を足すときは **`/portfolio-add artifacts/新作`**。
コマンドの中身は `private_production/.claude/commands/` にあります。

手で確認したい場合は `npm run check` を使ってください。

```bash
npm run check          # 何がずれているかを表示（元リポジトリを見る）
npm run assets:sync    # 画像・動画を取り込み直す
npm run sizes          # 画像サイズ表を再生成
```

`npm run check` が見るのは次の 3 点です。

| 見るもの | 何が分かるか |
|---|---|
| 参照の整合性 | `projects.ts` が指しているのに `public/` に無い素材／逆に誰も使っていない素材 |
| 取り込み素材 | 元リポジトリの画像が変わったのに取り込んでいない |
| 録画素材 | 録画してから元リポジトリが何コミット進んだか（撮り直しの検討） |

さらに、元リポジトリのコミットが進んでいると
**「本文・数値（metrics）が実態と合っているか確認してください」** と促します。
画像は自動で追随できますが、`projects.ts` に書いた行数・テスト数・回収率などは
自動では直らないので、ここは目視で見直してください。

対応表は `scripts/sources.mjs` の 1 ファイルに集約してあります。
**作品を追加したら、ここにも 1 件足してください**（足さないと更新検出の対象外になります）。
取り込んだ時点の状態は `scripts/assets-state.json` に記録され、次回の比較に使われます。

参照の整合性チェックだけは元リポジトリが無くても動くので、
GitHub Actions のデプロイでも `npm run check -- --refs` として走らせています
（`projects.ts` から画像を消し忘れた、といった事故をデプロイ前に止められます）。

### 図版に動画を使う

作品の図版は静止画だけでなく、ループ再生する無音動画を使えます。`projects.ts` で
`Media`（`poster` ＋ 任意の `video`）を書くと、`Clip` コンポーネントが描画します。

```ts
// 作品の主図版（一覧のカバー＋詳細ページ冒頭）
media: {
  poster: "/images/<slug>/hero-poster.webp",
  video: "/video/<slug>/hero.mp4",   // 省略すると静止画だけ
  alt: "...",
  caption: "...",
},

// 箇条書きに図版を付けると、図と説明が左右交互に並ぶ
bullets: [{ title: "...", text: "...", media: { poster, video, alt, caption } }],
```

再生の決まり:

- **一覧**はホバー（フォーカス）中だけ再生。触るまで動画を読み込まないので一覧は軽いまま
- **詳細ページ**は画面に入ったら再生・出たら停止
- どちらも `preload="none"` で、実際に再生する直前まで `src` を差しません
- `prefers-reduced-motion: reduce` の環境では自動再生せず、再生ボタンを出します

動画は **1280×800・無音・mp4 (H.264)** に揃えています。ポスターは同じ寸法の WebP で、
`npm run sizes` の対象なのでレイアウトのずれは起きません。

**スマホアプリだけは例外**です。390×844 の縦長画面を 16:10 に収めると中身が読めなくなるので、
`Media` に `portrait: true` を付けて実寸の比率のまま置きます。置き方は 3 か所とも変えています。

| 場所 | 見せ方 |
|---|---|
| 一覧のカード | `Plate`（方眼を敷いた台）の中に正方形で端末を立てる。他のカードと高さが揃う |
| 詳細ページの主図版 | `Plate` の中に端末を置き、右に説明（`FIG. 01` ＋ キャプション）を添える |
| 箇条書きの図版 | 幅 260px の端末をそのまま置き、キャプションは下 |

端末は `Clip` の `shape="device"`（角丸＋縁＋影）で、スマホらしく見えるようにしています。

### 動画を録り直す

`scripts/record-*.mjs`（Fluid Lab / GOLD RUSH / Piano Studio）が、ヘッドレス Chromium で
元リポジトリを実際に操作して録画します（前提と後処理はスクリプト冒頭のコメントに書いてあります）。
GOLD RUSH は `?debug` で有効になる `window.__medal` を使って、スロット・円盤・JP チャレンジを
直接起動しています。

ミチシルベだけはブラウザ製ではないので `scripts/record-michishirube.py` を使います。
Flutter の **Linux デスクトップ版**（元リポジトリで `flutter build linux --release`）を WSLg 上で
起動し、X の GetImage でウィンドウから直接フレームを吸い出して ffmpeg に流し込みます
（WSLg はルートウィンドウに中身を描かないので `x11grab` では真っ黒になります）。
操作は XTEST、起動タブは環境変数 `MICHISHIRUBE_TAB` で選びます。
ヒーロー動画は各クリップから 7 秒ずつ切り出し、0.7 秒のクロスフェードでつないだものです。

```bash
ffmpeg -i t1.mp4 -i t2.mp4 -i t3.mp4 -i t4.mp4 -filter_complex \
"[0][1]xfade=transition=fade:duration=0.7:offset=6.3[a];\
[a][2]xfade=transition=fade:duration=0.7:offset=12.6[b];\
[b][3]xfade=transition=fade:duration=0.7:offset=18.9[c]" \
-map "[c]" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -an -movflags +faststart hero.mp4
```

### 技術アイコンについて

使用技術・スキルのアイコンは [simple-icons](https://simpleicons.org/)（CC0）のブランドロゴを
**ビルド時にパスだけ取り出してインライン SVG として埋め込んでいます**（外部リクエストなし）。

- `src/data/techIcons.ts` … ラベル（例: `Flutter / Riverpod / drift`）→ アイコンの対応表。
  新しい技術を足したらここに 1 行追加する
- `src/data/techIcons.generated.ts` … `npm run icons` で自動生成（手で編集しない）。
  使いたいロゴが足りないときは `scripts/gen-tech-icons.mjs` の `SLUGS` に追記して再生成
- ロゴが存在しない技術（AWS・OpenAI・Playwright など）は自前の線画グリフに自動で
  フォールバックします（`src/components/TechIcon.tsx`）
- 暗い背景で潰れないよう、ブランド色は生成時に明度補正しています

### 余白・最大幅・レスポンシブの基準

左右の余白と最大幅は **`src/components/ui.tsx` の `Container` / `GUTTER` に集約**しています。
新しいブロックを足すときも必ず `<Container>` で包んでください（直接 `px-*` を書かない）。

| 種類 | 最大幅 | 用途 |
|---|---|---|
| `<Container>` | 1140px | トップページの各セクション・ヘッダー・フッター |
| `<Container width="read">` | 820px | 作品詳細ページ（本文・画像・表すべて同じ幅で揃える） |

- 左右の余白（gutter）は `px-5 → sm:px-8 → lg:px-10` の 1 系統のみ
- セクションの上下は `py-16 sm:py-24` に統一（`Section` コンポーネントが持っています）
- 画面幅 768px 未満ではヘッダーがハンバーガーメニューに切り替わります（`MobileNav.tsx`）
- 一覧カードでは技術を**アイコンのみ**（`TechIcons`）、詳細ページでは**アイコン＋名前**
  （`TechChips`）で出し分けて、一覧の文字量を抑えています

### 見た目の決まりごと

デザインの方向性は「実験ノート／計測レポート」です。次の 4 点を守れば全体の統一が保てます。

- **面ではなく罫線で区切る**：`bg-surface` のカードを積むのではなく、`border-t border-border` の
  行として並べる（Works・Research・Skills はすべてこの形）
- **左端に番号の段を作る**：セクション見出し（`§01` ＋ 英字ラベル）も、各行の見出し
  （通し番号 ＋ カテゴリバッジ）も `md:grid-cols-[11rem_minmax(0,1fr)]` の左段に置く。
  Works・Research・Internship・Skills と最上部の自己紹介で同じ形なので、
  新しいブロックもこの grid に合わせる。§番号は Works=01 から始まり、
  最上部（ヒーロー＋強み・学歴・資格）は 1 つの `#about` セクションで番号を持たない
- **角丸は使わない**：ボタン・バッジ・画像枠すべて直角。例外は箇条書きの ● だけ
  （詳細ページの `bullets` は左に縦線を通し、項目ごとに丸いポチを置く）
- **番号・数値・ラベルは等幅**：`font-mono`（JetBrains Mono）。数値には `tnum` を付けて桁を揃える。
  本文は `font-sans`（Inter ＋ 日本語はフォールバック）

配色は `src/app/globals.css` の `@theme` ブロックだけで全体が決まります。
アクセント（`--color-accent`）はリンク・章番号・強調に使う 1 色で、カテゴリ色
（teal / violet / amber / blue / pink）とは役割を分けています。

### 左段と縦罫線（レール）

セクション見出しの `§NN` も各行の通し番号も、幅 `5rem` の細い左段に入ります。
**左段には番号しか置きません**。英字ラベル・カテゴリ・分類名をここに入れると幅が要り、
内容の左に余白が空きすぎるためです（一度そうして作り直しました）。

縦罫線を引くのは **番号の付いた行（作品・研究・インターン）だけ** です。
セクション見出し・学歴・資格・Skills の分類のような「箇条書きでないもの」には引きません
（引くと線が意味を持たなくなるため）。

- `RAIL_GRID` … 左段 + 内容の 2 カラム（`ui.tsx`）。**全ブロック共通**
- `RAIL` … 左段に付ける罫線と余白。**番号付きの行にだけ**付ける
- `RailDot` … 罫線の上に置く●。`relative` な要素の中で使う

狭い画面では罫線を出さず、素直に縦積みに戻ります。

### 期間（period）の書き方

`projects.ts` の `period` は **開始年月〜終了年月** に統一します。

```
"2024年11月〜2025年1月"   同じ年をまたぐときは年を 2 回書く
"2026年6月〜7月"          同じ年なら年は 1 回
"2026年3月〜"             継続中は開始年月だけ
"2026年8月"               開始と終了が同じ月のときだけ 1 つ
```

「（継続開発中）」「（約3週間）」のような補足は入れません（継続中かどうかは `〜` で分かる）。
年月は元リポジトリの最初と最後のコミット、または `docs/PORTFOLIO.md` の記載で裏を取ること。

### 動き（モーション）

`data-reveal` を付けた要素が、画面に入ったときにフェードインします
（`src/components/Reveal.tsx` ＋ `globals.css` の `.motion-ready`）。

- 初期状態を隠すのは JS が動いたときだけなので、JS 無効でも本文は必ず見えます
- `prefers-reduced-motion: reduce` の環境では一切適用されません
- 新しいブロックにも効かせたいときは、その要素に `data-reveal` を付けるだけです

### 本文中のコード表記

`projects.ts` の文章では `` `EXT_color_buffer_float` `` のようにバッククォートで囲むと、
詳細ページで等幅のインラインコードとして描画されます（`RichText`）。それ以外の記法は解釈しません。

---

## 公開（GitHub Pages）

**公開済みです。** → https://kosei-matsuzaki.github.io/portfolio/

| 項目 | 値 |
|---|---|
| リポジトリ | `kosei-matsuzaki/portfolio`（公開） |
| ビルド | GitHub Actions（`.github/workflows/deploy.yml`） |
| `NEXT_PUBLIC_BASE_PATH` | `/portfolio`（リポジトリの Variables に登録済み） |

### 更新のしかた

**`main` に push するだけ**で、ビルドから公開まで自動で走ります。

```bash
npm run check                 # 元リポジトリとのずれを確認
npx tsc --noEmit && npm run lint && npm run build
git add -A && git commit -m "..." && git push
```

デプロイの結果は `gh run list` か、GitHub の Actions タブで確認できます。
CI では元リポジトリが無いので、参照の整合性だけ（`npm run check -- --refs`）を見ています。
`projects.ts` から画像を消し忘れた、といった事故はここで止まります。

### ローカルでサブディレクトリ配信を確認する

本番と同じ `/portfolio/` 配下での見え方を確かめたいとき:

```bash
NEXT_PUBLIC_BASE_PATH=/portfolio npm run build
npx serve out               # http://localhost:3000/portfolio/ で確認
```

### 注意: `next/image` は basePath を自動で付けない

`images.unoptimized: true`（静的書き出しに必須）だと、**`next/image` は `src` をそのまま出力します**。
`next/link` は自動で付くのに Image は付かないので、サブディレクトリ配信だと画像だけ 404 になります。
実際に公開直後にこれで壊しました。

`public/` 配下を指すパスは、`<img>` / `<video>` だけでなく **`<Image>` の `src` も
`asset()`（`src/lib/asset.ts`）を通してください**。
`sizeOf()` に渡すキーは basePath なしの生パスのままにします。

```tsx
<Image src={asset(shot.src)} width={w} height={h} />   // ✓
<Image src={shot.src} />                                // ✗ サブディレクトリで 404
```

### 別の場所に公開したくなったら

- **独自ドメイン** … Settings → Pages → Custom domain。サブディレクトリでなくなるので
  `NEXT_PUBLIC_BASE_PATH` の Variable を削除してビルドし直す
- **Vercel** … リポジトリを接続するだけ。`basePath` は不要なので Variable は設定しない。
  GitHub Pages と併用しても競合しない（同じリポジトリを両方から配信できる）

---

## 掲載方針のメモ

- `personal/` `work/` の内容は掲載していません
- ミチシルベはリポジトリ非公開のため、画面と設計の説明のみ掲載しています
- インターン（バンダイナムコスタジオ）は、ワークショップの成果物のため
  **企業名・技術内容・自分の担当範囲のみ**を掲載し、ゲーム画面とソースコードは載せていません
- 大学院の授業課題（Applied Computer Graphics）と CharacterMap は掲載していません。
  載せる場合は `src/data/projects.ts` に追記してください
- Fluid Lab の画像は `artifacts/fluid-lab/assets/*.webp`（ヘッドレス Chromium で撮った実動作画面）を
  そのまま使っています
