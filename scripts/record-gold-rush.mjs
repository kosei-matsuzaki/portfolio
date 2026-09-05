/**
 * GOLD RUSH（artifacts/medal）の実プレイをヘッドレス Chromium で録画し、
 * public/video/gold-rush/ に置く mp4 とポスター画像のもとを作る。
 *
 * 前提（このリポジトリの依存には入れていない。録り直すときだけ用意する）:
 *   1. 適当な作業ディレクトリで  npm i puppeteer-core
 *   2. Chromium 本体のパスを CHROME_PATH に（未指定なら Playwright のキャッシュを見る）
 *   3. ゲームをビルドして 4322 番で配信しておく
 *        cd ../artifacts/medal && npm run build
 *        cd dist && python3 -m http.server 4322
 *   4. ffmpeg
 *
 * `?debug` で有効になる `window.__medal` を使ってミニゲームを直接起動している
 * （E2E テストと同じ入口）。開発者パネルは CSS で隠して映像には入れない。
 *
 * 使い方:
 *   node scripts/record-gold-rush.mjs              # 4 クリップすべて
 *   node scripts/record-gold-rush.mjs bowl         # 指定したクリップだけ
 *
 * 後処理は record-fluid-lab.mjs と同じ（mp4 変換 → ポスター切り出し → xfade で連結）。
 *
 * 置き終わったら `npm run sizes` と
 * `npm run assets:sync -- --recorded=gold-rush`（録画時点の記録）を実行する。
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

/** ミニゲームが `kind` に入るまで待つ（連鎖 bowl → chinchiro を拾うため） */
async function waitState(page, kind, limitMs = 60000) {
  const t0 = Date.now();
  for (;;) {
    if ((await api(page, "state")) === kind) return true;
    if (Date.now() - t0 > limitMs) throw new Error(`state never reached ${kind}`);
    await sleep(400);
  }
}

const CLIPS = {
  // 基本ループ: 盤面を満たしてから連続投入し、押し出されたメダルが払い出される
  gameplay: {
    async prepare(page) {
      await api(page, "pauseChuckers", true);   // 途中ですごろくに飛ばない
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
  // すごろく: 左トレイで実物理のサイコロを振り、奥のモニターでコマが進む
  sugoroku: {
    async prepare(page) {
      await api(page, "pauseChuckers", true);
      await api(page, "fill", 90);
      await api(page, "boardPos", 11);          // 効果マスが続く区間から始める
      await sleep(2500);
      await api(page, "force", "sugoroku");
      await sleep(400);
    },
    seconds: 16,
    // 1 手は 6 秒ほどで終わるので、idle に戻るたびに次の手を回して手が止まらないようにする
    async act(page) {
      for (let i = 0; i < 30; i++) {
        if ((await api(page, "state")) === "idle") await api(page, "force", "sugoroku");
        await sleep(500);
      }
    },
  },
  // 抽選ボウル: 台形壁に直付けした漏斗をボールが回りながら落ちる
  bowl: {
    async prepare(page) {
      await api(page, "pauseChuckers", true);
      await api(page, "fill", 90);
      await api(page, "addJackpot", 24000);
      await sleep(2500);
      await api(page, "force", "bowl");
      await sleep(400);
    },
    seconds: 9,   // 1 回の抽選は 4.7 秒ほど。ループで見せるので余韻まで
    async act() { await sleep(8500); },
  },
  // チンチロ: ボウルの結果を賭け金にして、実物理のサイコロ 3 個で倍率を決める
  chinchiro: {
    async prepare(page) {
      await api(page, "pauseChuckers", true);
      await api(page, "fill", 90);
      await api(page, "addJackpot", 24000);
      await sleep(2500);
      await api(page, "force", "bowl");
      await waitState(page, "chinchiro");       // ボウルの結果がそのまま賭け金になる
      await sleep(500);
    },
    seconds: 12,   // 目なしで 3 投まで粘ることがあるので、必ず結果まで入る長さに
    async act() { await sleep(11500); },
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
