/**
 * simple-icons から必要なブランドロゴだけを抜き出して
 * src/data/techIcons.generated.ts を生成する。
 *
 *   npm run icons
 *
 * 暗い背景で潰れないよう、輝度が低いブランド色は自動で明るく補正する。
 * （アイコンを増やしたいときは下の SLUGS に追記する）
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import * as si from "simple-icons";

const SLUGS = [
  "python", "typescript", "javascript", "cplusplus", "dotnet", "dart", "rust",
  "pytorch", "lightning", "numpy", "scipy", "scikitlearn",
  "fastapi", "react", "vite", "nextdotjs", "tailwindcss", "sqlite", "sqlalchemy",
  "flutter", "android", "apple", "flask", "uv",
  "threedotjs", "unity", "webassembly", "cmake", "webgl",
  "git", "github", "githubactions", "docker", "pytest", "vitest",
  "claude", "googlegemini", "jupyter", "googleplay",
];

/** #rrggbb → HSL */
function toHsl(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
}

/** 暗い背景でも見えるように明度を底上げした CSS 色を返す */
function readableColor(hex) {
  const { h, s, l } = toHsl(hex);
  if (s < 0.08) return "#d9dee7"; // 白黒系ロゴはニュートラルグレーに
  const lifted = Math.max(l, 0.62);
  return `hsl(${Math.round(h * 360)} ${Math.round(Math.max(s, 0.45) * 100)}% ${Math.round(lifted * 100)}%)`;
}

const entries = SLUGS.map((slug) => {
  const key = "si" + slug.charAt(0).toUpperCase() + slug.slice(1);
  const icon = si[key];
  if (!icon) {
    console.warn(`  ! simple-icons に ${slug} が見つかりません（スキップ）`);
    return null;
  }
  return [slug, { title: icon.title, path: icon.path, color: readableColor(icon.hex) }];
}).filter(Boolean);

const body = entries
  .map(([slug, v]) =>
    `  ${JSON.stringify(slug)}: {\n    title: ${JSON.stringify(v.title)},\n    color: ${JSON.stringify(v.color)},\n    path: ${JSON.stringify(v.path)},\n  },`,
  )
  .join("\n");

const out = `/* simple-icons (CC0) から生成したブランドロゴのパス。
   このファイルは \`npm run icons\` で自動生成されます。手で編集しないこと。 */

export type BrandIcon = { title: string; color: string; path: string };

export const brandIcons: Record<string, BrandIcon> = {
${body}
};
`;

const root = new URL("..", import.meta.url).pathname;
writeFileSync(join(root, "src", "data", "techIcons.generated.ts"), out);
console.log(`techIcons.generated.ts を更新しました（${entries.length} 件）`);
