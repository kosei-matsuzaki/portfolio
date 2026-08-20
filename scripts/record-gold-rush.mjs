/**
 * GOLD RUSH（artifacts/medal）の実プレイをヘッドレス Chromium で録画し、
 * public/video/gold-rush/ に置く mp4 とポスター画像のもとを作る。
 *
 * 前提（このリポジトリの依存には入れていない。録り直すときだけ用意する）:
 *   1. 適当な作業ディレクトリで  npm i puppeteer-core
 *   2. Chromium 本体のパスを CHROME_PATH に（未指定なら Playwright のキャッシュを見る）
 *   3. ゲームをビルドして 4322 番で配信しておく
 *        cd ../artifacts/medal && npm run build
 *        npx serve -l 4322 ../artifacts/medal/dist
 *   4. ffmpeg
 *
 * `?debug` で有効になる `window.__medal` を使ってミニゲームを直接起動している
 * （E2E テストと同じ入口）。開発者パネルは CSS で隠して映像には入れない。
 *
 * 使い方:
 *   node scripts/record-gold-rush.mjs              # 4 クリップすべて
 *   node scripts/record-gold-rush.mjs jpc          # 指定したクリップだけ
 *
 * 後処理は record-fluid-lab.mjs と同じ（mp4 変換 → ポスター切り出し → xfade で連結）。
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = process.env.CHROME_PATH ??
  process.env.HOME + "/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome";
const PAGE_URL = "http://localhost:4322/index.html?debug";
const W = 1280, H = 800;
const OUT = new globalThis.URL("./rec-medal/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = (page, fn, ...a) => page.evaluate((f, args) => window.__medal[f](...args), fn, a);

const CLIPS = {
  // 基本ループ: 盤面を満たしてから連続投入し、押し出されたメダルが払い出される
  gameplay: {
    async prepare(page) {
      await api(page, "fill", 150);
      await sleep(3500);
    },
    seconds: 14,
    async act(page) {
      for (let i = 0; i < 5; i++) {
        await page.keyboard.down("Space");
        await sleep(1400);
        await page.keyboard.up("Space");
        await sleep(1100);
      }
    },
  },
  // スロット: ストックを積んで連続抽選
  slot: {
    async prepare(page) {
      await api(page, "fill", 90);
      await api(page, "addStock", 9);
      await sleep(2500);
      await api(page, "force", "slot");
      await sleep(600);
    },
    seconds: 14,
    async act() { await sleep(13500); },
  },
  // 円盤チャレンジ: 回転円盤にボールを投げ込み、実物理で穴が決まる
  disc: {
    async prepare(page) {
      await api(page, "fill", 90);
      await sleep(2000);
      await api(page, "force", "disc");
      await sleep(600);
    },
    seconds: 14,
    async act() { await sleep(13500); },
  },
  // JP チャレンジ: 振り子のボールが回転盤の U 字ポケットに噛むか
  jpc: {
    async prepare(page) {
      await api(page, "fill", 90);
      await api(page, "addJackpot", 18000);
      await sleep(2000);
      await api(page, "force", "jackpot");
      await sleep(600);
    },
    seconds: 16,
    async act() { await sleep(15500); },
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
  await page.goto(PAGE_URL, { waitUntil: "load" });
  await sleep(6000);   // Rapier の初期化 + 筐体の組み立てを待つ

  // 開発者パネルは映像に入れない（デバッグ API だけ使う）
  await page.addStyleTag({
    content: "#dev-panel,#dev-toggle{display:none!important}body{cursor:none}",
  });

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
