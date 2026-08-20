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
 * 使い方:
 *   node scripts/record-piano-studio.mjs             # 4 モードすべて
 *   node scripts/record-piano-studio.mjs compose     # 指定したモードだけ
 *
 * 後処理は record-fluid-lab.mjs と同じ（mp4 変換 → ポスター切り出し → xfade で連結）。
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = process.env.CHROME_PATH ??
  process.env.HOME + "/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome";
const PAGE_URL = "http://localhost:4325/index.html";
const W = 1280, H = 800;
const OUT = new globalThis.URL("./rec-piano/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const tab = (page, mode) =>
  page.click(`#mode-tabs .tab[data-mode="${mode}"]`);

/** 和音を押して離す（白鍵 A 段 = ド レ ミ ファ ソ ラ シ ド レ ミ ファ ソ） */
async function chord(page, keys, holdMs) {
  for (const k of keys) await page.keyboard.down(k);
  await sleep(holdMs);
  for (const k of keys) await page.keyboard.up(k);
}

const CLIPS = {
  // 自由演奏: PC キーで和音を弾くと鍵盤が光り、コード名が判定される
  free: {
    async prepare(page) {
      await tab(page, "free");
      await sleep(800);
    },
    seconds: 14,
    async act(page) {
      const prog = [
        ["a", "d", "g"],       // C
        ["g", "j", "l"],       // G
        ["h", "k", ";"],       // Am
        ["f", "h", "k"],       // F
      ];
      for (let round = 0; round < 2; round++) {
        for (const c of prog) {
          await chord(page, c, 1200);
          await sleep(250);
        }
      }
    },
  },
  // コード学習: 楽譜・鍵盤・リズムで音楽理論をスライドで進む
  learn: {
    async prepare(page) {
      await tab(page, "learn");
      await sleep(1500);
    },
    seconds: 14,
    async act(page) {
      for (let i = 0; i < 6; i++) {
        await sleep(2000);
        await page.click("#slide-next");
      }
    },
  },
  // AI 作曲: 生成 → 再生
  compose: {
    async prepare(page) {
      await tab(page, "compose");
      await sleep(1200);
    },
    seconds: 18,
    async act(page) {
      await page.click("#cmp-generate");
      await sleep(6000);
      await page.click("#cmp-play");
      await sleep(11000);
    },
  },
  // 楽譜エディタ: 生成曲を取り込んで編集・再生
  editor: {
    async prepare(page) {
      await tab(page, "compose");
      await sleep(1000);
      await page.click("#cmp-generate");
      await sleep(6500);
      await page.click("#cmp-to-editor");
      await sleep(2000);
    },
    seconds: 14,
    async act(page) {
      await sleep(2500);
      await page.click("#ed-play");
      await sleep(10500);
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
