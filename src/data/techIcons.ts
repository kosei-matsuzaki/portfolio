import { brandIcons, type BrandIcon } from "./techIcons.generated";

/** ブランドロゴが無い技術に使う自前グリフ */
export type GlyphName =
  | "code"
  | "ai"
  | "cube"
  | "audio"
  | "chart"
  | "cloud"
  | "test"
  | "mobile"
  | "db";

export type ResolvedIcon =
  | ({ kind: "brand" } & BrandIcon)
  | { kind: "glyph"; glyph: GlyphName };

/** ラベル → アイコンの対応。上から順にマッチする */
const RULES: [RegExp, string | GlyphName][] = [
  [/claude/i, "claude"],
  [/gemini/i, "googlegemini"],
  [/openai|gpt/i, "ai"],
  [/pytorch lightning/i, "lightning"],
  [/pytorch/i, "pytorch"],
  [/numpy/i, "numpy"],
  [/scipy/i, "scipy"],
  [/scikit/i, "scikitlearn"],
  [/matplotlib/i, "chart"],
  [/jupyter/i, "jupyter"],
  [/python/i, "python"],
  [/typescript/i, "typescript"],
  [/javascript/i, "javascript"],
  [/c\+\+/i, "cplusplus"],
  [/c#/i, "dotnet"],
  [/rust/i, "rust"],
  [/flutter|dart/i, "flutter"],
  [/riverpod/i, "code"],
  [/flutter_local|通知/i, "mobile"],
  [/android|play console|google play/i, "android"],
  [/fastapi/i, "fastapi"],
  [/next\.js/i, "nextdotjs"],
  [/react/i, "react"],
  [/vite(?!st)/i, "vite"],
  [/tailwind/i, "tailwindcss"],
  [/flask/i, "flask"],
  [/sqlalchemy/i, "sqlalchemy"],
  [/sqlite|drift|alembic/i, "sqlite"],
  [/three\.js/i, "threedotjs"],
  [/webgl|glsl|シェーダ/i, "webgl"],
  [/unity/i, "unity"],
  [/webassembly|emscripten/i, "webassembly"],
  [/rapier|物理|レイキャス|レイマーチ|レンダリング|sdl/i, "cube"],
  [/web audio|tone\.js|vexflow/i, "audio"],
  [/github actions/i, "githubactions"],
  [/github/i, "github"],
  [/\bgit\b/i, "git"],
  [/docker|devcontainer/i, "docker"],
  [/pytest/i, "pytest"],
  [/vitest/i, "vitest"],
  [/playwright|テスト/i, "test"],
  [/cmake/i, "cmake"],
  [/\buv\b/i, "uv"],
  [/aws|amplify|クラウド/i, "cloud"],
  [/ioh|bbob|pycma|mealpy|進化計算|メタヒューリ|最適化/i, "chart"],
  [/stockfish/i, "test"],
  [/flip|pic|浅水|流体|数値解法/i, "chart"],
];

const GLYPHS = new Set<string>([
  "code",
  "ai",
  "cube",
  "audio",
  "chart",
  "cloud",
  "test",
  "mobile",
  "db",
]);

export function iconFor(label: string): ResolvedIcon {
  for (const [pattern, target] of RULES) {
    if (!pattern.test(label)) continue;
    if (GLYPHS.has(target)) return { kind: "glyph", glyph: target as GlyphName };
    const brand = brandIcons[target];
    if (brand) return { kind: "brand", ...brand };
  }
  return { kind: "glyph", glyph: "code" };
}
