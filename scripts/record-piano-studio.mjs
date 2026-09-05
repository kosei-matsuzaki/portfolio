/**
 * Piano Studio（artifacts/piano）の実動作をヘッドレス Chromium で録画し、
 * public/video/piano-studio/ に置く mp4 とポスター画像のもとを作る。
 *
 * 前提（このリポジトリの依存には入れていない。録り直すときだけ用意する）:
 *   1. 適当な作業ディレクトリで  npm i puppeteer-core
 *   2. Chromium 本体のパスを CHROME_PATH に（未指定なら Playwright のキャッシュを見る）
 *   3. アプリを 4325 番で配信しておく（ビルド不要）
 *        npx serve -l 4325 ../artifacts/piano
 *   4. ffmpeg
 *
 * サイトが暗い配色なので、アプリもダークテーマに固定して撮っている。
 * 音は出せない（画面録画に音声は乗らない）ので、動画は無音・ループ前提。
 *
 * ■ 1600×1000 で撮って 1280×800 に縮める理由
 * アプリは幅 1280px 以下でインスペクタ（右の「いま鳴っている和音／選択中の音符」）を
 * 自分から畳む。1280 で撮ると、このアプリの主役表示が映らない。
 * 縦横比は 1.6 で同じなので、そのまま縮小すれば歪まない。
 *
 * 使い方:
 *   node scripts/record-piano-studio.mjs             # 4 本すべて
 *   node scripts/record-piano-studio.mjs compose     # 指定したものだけ
 *
 * 後処理は record-fluid-lab.mjs と同じ（mp4 変換 → ポスター切り出し → xfade で連結）。
 *
 * 置き終わったら `npm run sizes` と
 * `npm run assets:sync -- --recorded=piano-studio`（録画時点の記録）を実行する。
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = process.env.CHROME_PATH ??
  process.env.HOME + "/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome";
const PAGE_URL = "http://localhost:4325/index.html";
const W = 1600, H = 1000;
const OUT = new globalThis.URL("./rec-piano/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 和音を押して離す（白鍵 A 段 = ド レ ミ ファ ソ ラ シ ド レ ミ） */
async function chord(page, keys, holdMs) {
  for (const k of keys) await page.keyboard.down(k);
  await sleep(holdMs);
  for (const k of keys) await page.keyboard.up(k);
}

/** 「王道進行 I–V–vi–IV」を 4 小節ぶん置く。
 *  新規の楽譜は 1 小節の休符から始まるので、置いたあと先頭の休符を消して
 *  ちょうど 4 小節（＝折り返しも縦スクロールも起きない）にそろえる。 */
async function seedSong(page) {
  await page.select("#ed-prog", "ohdo");
  await sleep(500);
  await page.click("#ed-prog-add");
  await sleep(1200);
  await page.keyboard.press("Home");
  await sleep(400);
  await page.keyboard.press("Delete");
  await sleep(500);
  await page.keyboard.press("End");
  await sleep(500);
  // キャレット追従で楽譜が数十 px 送られ、上端のテンポ表記が切れるので戻す
  await page.evaluate(() => {
    const el = document.getElementById("ed-staff");
    if (el) el.scrollTop = 0;
  });
  await sleep(400);
}

const CLIPS = {
  // 楽譜制作: 進行を置き、パートを足し、PC キーでメロディを弾き入れて再生する
  score: {
    seconds: 21,
    async act(page) {
      await seedSong(page);
      await page.click("#ed-part-add");
      await sleep(1100);
      for (const k of ["a", "d", "g", "h", "g", "d", "a", "d"]) {
        await page.keyboard.press(k);
        await sleep(400);
      }
      await sleep(800);
      // キーのコードの積み方を切り替える（チップの表示が C → Cmaj7 → C9 と変わる）
      await page.click('#ed-dia-ext .seg-btn[data-ext="seventh"]');
      await sleep(1300);
      await page.click('#ed-dia-ext .seg-btn[data-ext="ninth"]');
      await sleep(1300);
      await page.click('#ed-dia-ext .seg-btn[data-ext="triad"]');
      await sleep(900);
      await page.click("#ed-play");
      await sleep(9500);
    },
  },
  // 弾いた和音の表示: 試し弾きに切り替えて弾くと、インスペクタが和音名・構成音・度数・五線を出す
  play: {
    async prepare(page) {
      await seedSong(page);
      await page.click("#kbd-input");   // 楽譜に入力 → 試し弾き
      await sleep(900);
    },
    seconds: 15,
    async act(page) {
      const prog = [
        ["a", "d", "g"],       // C
        ["g", "j", "l"],       // G
        ["h", "k", ";"],       // Am
        ["f", "h", "k"],       // F
      ];
      for (let round = 0; round < 2; round++) {
        for (const c of prog) {
          await chord(page, c, 1400);
          await sleep(350);
        }
      }
    },
  },
  // AI 生成: ドロワーを開いて生成 → セクション付きの進行を再生 → そのまま楽譜へ取り込む
  compose: {
    async prepare(page) {
      await page.click("#open-ai");
      await sleep(1000);
      await page.click("#cmp-generate");
      await sleep(9000);                // 生成が終わって進行と楽譜が出そろうまで
    },
    seconds: 20,
    async act(page) {
      await sleep(1200);
      await page.click("#cmp-play");
      await sleep(14000);
      await page.click("#cmp-stop");
      await sleep(500);
      await page.click("#cmp-to-editor");  // 生成した曲を楽譜として開く
      await sleep(3000);
    },
  },
  // 音楽 Tips: 全 52 パートのカリキュラムを、作りながら引ける参照物としてドロワーで開く
  tips: {
    async prepare(page) {
      await seedSong(page);
      await page.click("#open-tips");
      await sleep(1800);
      const items = await page.$$(".lesson-item");
      await items[13].click();          // コード編の 1 本目（Part 14）
      await sleep(1500);
    },
    seconds: 15,
    async act(page) {
      for (let i = 0; i < 6; i++) {
        await sleep(2100);
        await page.click("#slide-next");
      }
    },
  },
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CLIPS);

for (const name of wanted) {
  const clip = CLIPS[name];
  if (!clip) throw new Error("unknown clip: " + name);

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: "new",
    args: ["--no-sandbox", "--use-gl=angle", "--hide-scrollbars",
           "--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  // サイト側が暗い配色なので、アプリもダークテーマで撮る
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("piano-theme", "dark"); } catch { /* noop */ }
  });
  await page.goto(PAGE_URL, { waitUntil: "load" });
  await sleep(2500);
  // 「最初のユーザー操作」で AudioContext が有効になる作りなので一度クリックしておく
  await page.mouse.click(W / 2, H - 30);
  await page.addStyleTag({ content: "body{cursor:none}" });
  await sleep(500);

  if (clip.prepare) await clip.prepare(page);

  const path = `${OUT}${name}.webm`;
  const recorder = await page.screencast({ path });
  const done = sleep(clip.seconds * 1000);
  await clip.act(page);
  await done;
  await recorder.stop();
  await browser.close();
  console.log("recorded", name);
}
