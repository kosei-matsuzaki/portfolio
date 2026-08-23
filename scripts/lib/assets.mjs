/** sync-assets.mjs と check-updates.mjs が共有する小道具（依存なし） */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// URL#pathname は Windows で "/C:/..." を返してしまい、そのままでは
// join / existsSync が全部外れる（元リポジトリが「見つかりません」になる）。
export const ROOT = fileURLToPath(new URL("../../", import.meta.url)); // portfolio-site/
export const WORKSPACE = fileURLToPath(new URL("../../../", import.meta.url)); // private_production/
export const STATE_FILE = join(ROOT, "scripts", "assets-state.json");

export function sha(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 16);
}

/** ディレクトリを再帰的に辿ってファイルの絶対パスを返す（存在しなければ空） */
export function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** copy 定義（ファイル / ディレクトリのどちらでもよい）を [src, dest] の一覧に展開する。
 *  `entry.from` は元リポジトリからの相対パス */
export function expand(entry, repoRel) {
  const from = join(WORKSPACE, repoRel, entry.from);
  const to = join(ROOT, entry.to);
  if (!existsSync(from)) return { missing: true, pairs: [] };
  if (statSync(from).isDirectory()) {
    return {
      missing: false,
      pairs: walk(from).map((f) => [f, join(to, relative(from, f))]),
    };
  }
  return { missing: false, pairs: [[from, to]] };
}

/** git リポジトリなら HEAD（と作業ツリーの汚れ）を返す。git 管理外なら null */
export function gitHead(repoRel) {
  const dir = join(WORKSPACE, repoRel);
  if (!existsSync(join(dir, ".git"))) return null;
  const run = (...args) =>
    execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" }).trim();
  try {
    return {
      head: run("rev-parse", "HEAD"),
      short: run("rev-parse", "--short", "HEAD"),
      subject: run("log", "-1", "--format=%s"),
      date: run("log", "-1", "--format=%ad", "--date=short"),
      dirty: run("status", "--porcelain").length > 0,
    };
  } catch {
    return null;
  }
}

/** 指定コミット以降のコミット数（分からなければ null） */
export function commitsSince(repoRel, from) {
  const dir = join(WORKSPACE, repoRel);
  try {
    return +execFileSync("git", ["-C", dir, "rev-list", "--count", `${from}..HEAD`], {
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

export function loadState() {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

/* ---------------------------------------------------------------- 参照の整合性 */

/** src/ 以下で参照している /images/... ・ /video/... のパスを集める */
export function referencedAssets() {
  const files = walk(join(ROOT, "src")).filter((f) => /\.(tsx?|mjs|css)$/.test(f));
  const refs = new Set();
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(/["'`](\/(?:images|video)\/[^"'`\s)]+)["'`]/g)) {
      refs.add(m[1]);
    }
  }
  return refs;
}

/** public/images ・ public/video に実在するファイルのパス（/images/... 形式） */
export function existingAssets() {
  const out = new Set();
  for (const kind of ["images", "video"]) {
    const base = join(ROOT, "public", kind);
    for (const f of walk(base)) {
      out.add("/" + kind + "/" + relative(base, f).split("\\").join("/"));
    }
  }
  return out;
}

/* ---------------------------------------------------------------- 表示 */

export const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};
