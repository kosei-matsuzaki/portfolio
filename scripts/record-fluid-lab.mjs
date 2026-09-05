/**
 * Fluid Lab の各モードをヘッドレス Chromium で実際に動かして録画し、
 * public/video/fluid-lab/ に置く mp4 とポスター画像のもとを作る。
 *
 * 前提（このリポジトリの依存には入れていない。録り直すときだけ用意する）:
 *   1. 適当な作業ディレクトリで  npm i puppeteer-core
 *   2. Chromium 本体（Playwright のキャッシュなど）のパスを CHROME_PATH に
 *   3. artifacts/fluid-lab/ を 4322 番で配信しておく
 *        例) npx serve -l 4322 ../artifacts/fluid-lab
 *   4. ffmpeg（mp4 変換とポスター切り出しに使う）
 *
 * 使い方:
 *   node scripts/record-fluid-lab.mjs            # 4 モードすべて
 *   node scripts/record-fluid-lab.mjs earth      # 指定したモードだけ
 *
 * 置き終わったら `npm run sizes` と
 * `npm run assets:sync -- --recorded=fluid-lab`（録画時点の記録）を実行する。
 *
 * 録画後の仕上げ（rec/ の中で実行）:
 *   ffmpeg -i <name>.webm -vf "fps=30,scale=1280:800:flags=lanczos" \
 *     -c:v libx264 -crf 28 -preset slow -pix_fmt yuv420p -an \
 *     -movflags +faststart <name>.mp4
 *   ffmpeg -ss <秒> -i <name>.mp4 -frames:v 1 -c:v libwebp -quality 82 <name>-poster.webp
 *
 * ヒーロー動画（4 モードをつないだもの）は、各クリップから 7 秒ずつ切り出して
 * xfade でつないでいる。詳しくは README の「Fluid Lab の動画を録り直す」を参照。
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME =
  process.env.CHROME_PATH ??
  process.env.HOME + "/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome";
const PAGE_URL = "http://localhost:4322/fluid-lab.html";
const W = 1280, H = 800;
const OUT = new URL("./rec/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** なめらかにドラッグする（1 フレームに 1 点ずつ動かさないと splat が出ない） */
async function drag(page, pts, stepMs = 16) {
  await page.mouse.move(pts[0].x, pts[0].y);
  await page.mouse.down();
  for (const p of pts.slice(1)) {
    await page.mouse.move(p.x, p.y);
    await sleep(stepMs);
  }
  await page.mouse.up();
}

/** 中心まわりの渦を描く軌跡 */
function spiral(cx, cy, r0, r1, turns, n, phase = 0) {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const a = phase + t * turns * Math.PI * 2;
    const r = r0 + (r1 - r0) * t;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.8 };
  });
}

const CLIPS = {
  // インク: ドラッグで発光インクを流し込む
  ink: {
    key: "1",
    warmup: 800,
    seconds: 12,
    async act(page) {
      await drag(page, spiral(W * 0.42, H * 0.5, 40, 250, 1.6, 90));
      await drag(page, spiral(W * 0.62, H * 0.45, 30, 210, -1.4, 80, Math.PI));
      await sleep(1200);
      await drag(page, spiral(W * 0.5, H * 0.6, 60, 280, 1.2, 80, 1.0));
      await sleep(2500);
      await page.keyboard.press("b");
      await sleep(2500);
    },
  },
  // 水 2D: ダムブレイクさせてから、かき混ぜる
  water2d: {
    key: "2",
    warmup: 400,
    seconds: 12,
    async act(page) {
      await page.keyboard.press("r");
      await sleep(4500);
      await drag(page, spiral(W * 0.5, H * 0.68, 60, 260, 1.4, 90));
      await sleep(2000);
      await drag(page, spiral(W * 0.45, H * 0.72, 200, 60, -1.2, 70));
      await sleep(2500);
    },
  },
  // 水 3D: かき混ぜて波が立ったところを、ゆっくり視点を回しながら撮る
  water3d: {
    key: "3",
    warmup: 3000,
    async prepare(page) {
      await page.mouse.move(W * 0.5, H * 0.5);
      for (let i = 0; i < 2; i++) {
        await page.mouse.wheel({ deltaY: -200 });
        await sleep(300);
      }
      await page.keyboard.press("x");
      await sleep(2500);
    },
    seconds: 13,
    async act(page) {
      await sleep(4500);
      await drag(
        page,
        Array.from({ length: 70 }, (_, i) => ({ x: W * 0.42 + i * 4, y: H * 0.5 })),
        30,
      );
      await sleep(4000);
    },
  },

  // 地球: 少し寄って、雨を降らせながら自転させる
  earth: {
    key: "4",
    warmup: 6000,
    async prepare(page) {
      await page.mouse.move(W * 0.5, H * 0.5);
      for (let i = 0; i < 2; i++) {
        await page.mouse.wheel({ deltaY: -200 });
        await sleep(350);
      }
      await page.keyboard.press("r");
      await sleep(3500);
    },
    seconds: 16,
    async act() {
      await sleep(15500);
    },
  },
};

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CLIPS);

for (const name of wanted) {
  const clip = CLIPS[name];
  if (!clip) throw new Error("unknown clip: " + name);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--use-gl=angle", "--hide-scrollbars", "--mute-audio"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  await page.goto(PAGE_URL, { waitUntil: "load" });
  await sleep(1200);

  await page.keyboard.press(clip.key);
  // UI（サイドバー・ヒント・エラー枠）を消して映像だけにする
  await page.addStyleTag({
    content: "#sidebar,#hint,#errBox{display:none!important}body{cursor:none}",
  });
  await sleep(clip.warmup);
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
