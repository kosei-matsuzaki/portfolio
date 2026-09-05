# 中身を更新する

サイトの中身は `src/data/projects.ts` と `src/data/profile.ts` の 2 ファイルに集約
されている。ここはその直しかたと、元リポジトリとのやりとり・公開までの手順。

見た目の規定は [design.md](design.md)。動かすコマンドと壊れる決まりごとは
[../CLAUDE.md](../CLAUDE.md)。

この手順を Claude にまとめて回させるなら `/portfolio-update`(更新)と
`/portfolio-add`(追加)がある。

## 文章・数値を直す

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

## 作品を追加する

1. `scripts/sources.mjs` に元リポジトリと素材の対応を 1 件足す
2. `npm run assets:sync` で素材を取り込む（録画する作品なら `scripts/record-*.mjs` を用意）
3. `npm run sizes` を実行（画像サイズの一覧を再生成）
4. `src/data/projects.ts` の `projects` 配列に 1 要素追加する
   - `kind: "work"` → Works セクションに表示
   - `kind: "research"` → Research セクションに表示
   - `kind: "internship"` → Internship セクションに表示
5. 詳細ページ `/works/<slug>/` は自動で生成されます
6. 最後に `npm run check` が「使っていない素材」を報告しないことを確認

## 元リポジトリを更新したときの手順（★重要）

`artifacts/` などの作品リポジトリを更新したら、**このサイトの側でも取り残しが出ます**。

いちばん簡単なのは、このリポジトリで Claude Code を開いて
**`/portfolio-update`**（特定の作品だけなら `/portfolio-update fluid-lab`）を実行することです。
下の手順を Claude がひととおり実行し、判断が要る点だけを報告します。
新しい作品を足すときは **`/portfolio-add ../artifacts/新作`**。
コマンドの中身は `.claude/commands/` にあります（`.gitignore` で除外した手元だけのもので、clone には入りません）。

手で確認したい場合は `npm run check` を使ってください。

```bash
npm run check          # 何がずれているかを表示（元リポジトリを見る）
npm run assets:sync    # 画像・動画を取り込み直す
npm run sizes          # 画像サイズ表を再生成
npm run docs:emit      # 元リポジトリ README の作品説明を projects.ts から生成し直す
```

`assets:sync` は**素材をコピーするだけ**で、`assets-state.json` の
「確認時点（`head`）」と「録画時点（`recorded`）」は動かしません。
どちらも人が確かめたことを表す値なので、進めるときは作品を名指しします
（初回だけ、比較の起点として現在の版が入ります）。

```bash
npm run assets:sync -- fluid-lab                 # その作品の素材だけ取り込む
npm run assets:sync -- --recorded=michishirube   # 録り直した → 録画時点を進める
npm run assets:sync -- --reviewed=keiba-ai       # 本文・数値を実態に合わせた → 確認時点を進める
```

以前は 1 回走らせるだけで全作品の記録が現在の HEAD へ飛んでいました。
録画していない作品まで「この版で録った」ことになり、次の撮り直しの判断材料が
消えるので、明示しないと進まない形に変えてあります。

`npm run check` が見るのは次の 4 点です。

| 見るもの | 何が分かるか |
|---|---|
| 参照の整合性 | `projects.ts` が指しているのに `public/` に無い素材／逆に誰も使っていない素材 |
| 取り込み素材 | 元リポジトリの画像が変わったのに取り込んでいない |
| 録画素材 | 録画してから元リポジトリが何コミット進んだか（撮り直しの検討） |
| 書き戻し | 元リポジトリ README の作品説明ブロックが `projects.ts` と食い違っていないか |

さらに、元リポジトリのコミットが進んでいると
**「本文・数値（metrics）が実態と合っているか確認してください」** と促します。
画像は自動で追随できますが、`projects.ts` に書いた行数・テスト数・回収率などは
自動では直らないので、ここは目視で見直してください。

コミット数は **`.md` と `docs/` にしか触れていないコミットを除いて**数えています。
作品説明はこちらから書き戻すので、それを「元が進んだ、本文を見直せ」と鳴らし続けると
警告が意味を失うためです（「ドキュメントのみです」と出ているものがそれ）。

対応表は `scripts/sources.mjs` の 1 ファイルに集約してあります。
**作品を追加したら、ここにも 1 件足してください**（足さないと更新検出の対象外になります）。
取り込んだ時点の状態は `scripts/assets-state.json` に記録され、次回の比較に使われます。

参照の整合性チェックだけは元リポジトリが無くても動くので、
GitHub Actions のデプロイでも `npm run check -- --refs` として走らせています
（`projects.ts` から画像を消し忘れた、といった事故をデプロイ前に止められます）。

## 元リポジトリ README の作品説明を生成する

作品の説明はもともと「元リポジトリ」と「このサイト」の 2 か所にあり、片方だけ更新されて
必ず食い違っていました（実際、medal と piano は公開ページのほうが新しい、という逆転が
起きていました）。いまは **`projects.ts` が唯一の原本**で、リポジトリ側は生成物です。

書き戻し先は各リポジトリの **`README.md`** です。GitHub でリポジトリを開いて最初に見えるのは
root の README で、`docs/` の中は見られません。以前は `docs/PORTFOLIO.md` に書き戻していましたが、
一番読まれる場所に作品説明が無い状態だったので、README 側へ移しました。

```bash
npm run docs:emit              # emit を持つ作品すべて
npm run docs:emit gold-rush    # 指定した作品だけ
```

生成先は `scripts/sources.mjs` の `emit` に書きます。

```js
emit: { doc: "README.md", images: "docs/portfolio" },
```

ファイル全体ではなく、マーカーの内側だけを書き換えます。

```markdown
<!-- portfolio:begin -->
（ここが生成物。タイトル・諸元表・概要・図版・見どころ・本文・AI 活用）
<!-- portfolio:end -->

## ライセンス          ← マーカーの外は手書きのまま残る
```

- **生成物は「動かし方・依存・ライセンス」を持ちません。** 動かし方と設計資料は各リポジトリの
  `docs/README.md`（開発者向けの入口）、ライセンス・クレジットはマーカーの外の手書き部分の担当です
- ブロックの冒頭と末尾から、その `docs/README.md` へ送ります
- 動画は基本 portfolio-site にしか無いので、ポスター画像＋公開ページへのリンクで代えています。
  ただし mp4 の実体が元リポジトリにある作品（keiba-ai の manim 動画）は、ポスターから直接リンクします
- 元リポジトリに実物がある画像（keiba-ai の `docs/images/` など）は、`copy` の対応表を逆に辿って
  そちらを参照します。同じ画像が 1 つのリポジトリに 2 つ入ることはありません
- 参照が消えた画像は `docs/portfolio/` から削除されます（旧構成のスクショが残り続けるのを防ぐため）
- 生成物がずれていないかは `npm run check` が見ます。ずれていたら、**直すのは `projects.ts` のほう**です
- マーカーがまだ無いリポジトリでは README の先頭に差し込み、既存の本文はその下に残したうえで
  警告を出します。本文を `docs/` へ移すのは手作業です

書き出したあとは、それぞれの元リポジトリで内容を見てからコミットしてください
（未コミットの作業が残っているリポジトリでは `git add` の範囲に注意）。

## 動画を録り直す

`scripts/record-*.mjs`（Fluid Lab / GOLD RUSH / Piano Studio）が、ヘッドレス Chromium で
元リポジトリを実際に操作して録画します（前提と後処理はスクリプト冒頭のコメントに書いてあります）。
GOLD RUSH は `?debug` で有効になる `window.__medal` を使って、すごろく・抽選ボウル・チンチロを
直接起動しています。Piano Studio だけは 1600×1000 で撮って 1280×800 に縮めます
（アプリが幅 1280px 以下でインスペクタを自分から畳むため。縦横比は同じなので歪みません）。

Flutter 製の 2 本はブラウザ製ではないので専用のスクリプトを使います。
ツミアゲ（旧名ミチシルベ。slug と素材のパスは旧名のまま）は `scripts/record-michishirube.py`、
タビシオリは `scripts/record-tabishiori.py` です。
どちらも Flutter の **Linux デスクトップ版**を WSLg 上で起動し、X の GetImage で
ウィンドウから直接フレームを吸い出して ffmpeg に流し込みます
（WSLg はルートウィンドウに中身を描かないので `x11grab` では真っ黒になります）。
操作は XTEST、ツミアゲの起動タブは環境変数 `TSUMIAGE_TAB` で選びます。

**ビルドの種類はアプリごとに違います。**タビシオリは `flutter build linux --debug`。
`--release` にすると install 先が `/usr/local` になり、sudo の無い端末では
Permission denied で止まります（録画に使うのは見た目だけなので debug で足ります）。
各スクリプト冒頭の前提を必ず読んでください。
ヒーロー動画は各クリップから 7 秒ずつ切り出し、0.7 秒のクロスフェードでつないだものです。
撮り直したら `npm run sizes` のあとに
`npm run assets:sync -- --recorded=<slug>` で録画時点を進めてください。

```bash
ffmpeg -i t1.mp4 -i t2.mp4 -i t3.mp4 -i t4.mp4 -filter_complex \
"[0][1]xfade=transition=fade:duration=0.7:offset=6.3[a];\
[a][2]xfade=transition=fade:duration=0.7:offset=12.6[b];\
[b][3]xfade=transition=fade:duration=0.7:offset=18.9[c]" \
-map "[c]" -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -an -movflags +faststart hero.mp4
```

## 技術アイコンについて

使用技術・スキルのアイコンは [simple-icons](https://simpleicons.org/)（CC0）のブランドロゴを
**ビルド時にパスだけ取り出してインライン SVG として埋め込んでいます**（外部リクエストなし）。

- `src/data/techIcons.ts` … ラベル（例: `Flutter / Riverpod / drift`）→ アイコンの対応表。
  新しい技術を足したらここに 1 行追加する
- `src/data/techIcons.generated.ts` … `npm run icons` で自動生成（手で編集しない）。
  使いたいロゴが足りないときは `scripts/gen-tech-icons.mjs` の `SLUGS` に追記して再生成
- ロゴが存在しない技術（AWS・OpenAI・Playwright など）は自前の線画グリフに自動で
  フォールバックします（`src/components/TechIcon.tsx`）
- 暗い背景で潰れないよう、ブランド色は生成時に明度補正しています

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

### 別の場所に公開したくなったら

- **独自ドメイン** … Settings → Pages → Custom domain。サブディレクトリでなくなるので
  `NEXT_PUBLIC_BASE_PATH` の Variable を削除してビルドし直す
- **Vercel** … リポジトリを接続するだけ。`basePath` は不要なので Variable は設定しない。
  GitHub Pages と併用しても競合しない（同じリポジトリを両方から配信できる）

---

## 掲載方針のメモ

- `personal/` `work/` の内容は掲載していません
- ツミアゲ（旧ミチシルベ）はリポジトリ非公開のため、画面と設計の説明のみ掲載しています
- インターン（バンダイナムコスタジオ）は、ワークショップの成果物のため
  **企業名・技術内容・自分の担当範囲のみ**を掲載し、ゲーム画面とソースコードは載せていません
- 大学院の授業課題（Applied Computer Graphics）と CharacterMap は掲載していません。
  載せる場合は `src/data/projects.ts` に追記してください
- Fluid Lab の画像は `artifacts/fluid-lab/assets/*.webp`（ヘッドレス Chromium で撮った実動作画面）を
  そのまま使っています
