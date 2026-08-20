/**
 * public/images 配下の PNG / JPEG / WebP の実寸を読み取り、
 * src/data/imageSizes.ts を再生成する。
 *
 *   npm run sizes
 *
 * 画像を追加・差し替えたときに実行すること（レイアウトのずれ防止）。
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const imagesDir = join(root, "public", "images");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** PNG / JPEG / WebP のヘッダから幅・高さを取得 */
function dimensions(file) {
  const buf = readFileSync(file);

  // PNG: IHDR の 16..24 バイト目
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }

  // JPEG: SOFn マーカーを走査
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  // WebP: RIFF コンテナ内の VP8 / VP8L / VP8X チャンクから読む
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" &&
      buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8 ") {
      // ロッシー: フレームヘッダの 14 バイト目から 14bit ずつ
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === "VP8L") {
      // ロスレス: 21..24 バイト目に (w-1) 14bit + (h-1) 14bit をパック
      const bits = buf.readUInt32LE(21);
      return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8X") {
      // 拡張: 24..30 バイト目に (w-1) / (h-1) を 24bit リトルエンディアンで持つ
      const u24 = (o) => buf[o] | (buf[o + 1] << 8) | (buf[o + 2] << 16);
      return { w: u24(24) + 1, h: u24(27) + 1 };
    }
  }

  return null;
}

const entries = walk(imagesDir)
  .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  .map((f) => [`/images/${relative(imagesDir, f).split("\\").join("/")}`, dimensions(f)])
  .filter(([, d]) => d)
  .sort(([a], [b]) => a.localeCompare(b));

const body = entries
  .map(([src, d]) => `  ${JSON.stringify(src)}: { w: ${d.w}, h: ${d.h} },`)
  .join("\n");

const out = `/* 画像の実寸（レイアウトのずれ＝CLS を防ぐために next/image へ渡す）
   このファイルは \`npm run sizes\` で自動生成されます。手で編集しないこと。 */

export const imageSizes: Record<string, { w: number; h: number }> = {
${body}
};

export function sizeOf(src: string) {
  return imageSizes[src] ?? { w: 1600, h: 900 };
}

export function isPortrait(src: string) {
  const { w, h } = sizeOf(src);
  return h > w;
}
`;

writeFileSync(join(root, "src", "data", "imageSizes.ts"), out);
console.log(`imageSizes.ts を更新しました（${entries.length} 件）`);
