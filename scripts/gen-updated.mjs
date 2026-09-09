/**
 * 作品ごとの「このサイトを最後に直した日」を git 履歴から出し、
 * src/data/updatedAt.ts を再生成する。
 *
 *   npm run updated
 *
 * 見るのは 2 つ。どちらか新しいほうを採る。
 *
 *   1. src/data/projects.ts の**その作品のエントリだけ**（`git log -L` で
 *      行範囲を履歴に沿って追う。ほかの作品を直しても日付は動かない）
 *   2. その作品が参照している素材（エントリ内の /images/… /video/… から拾う）
 *
 * まだコミットしていない変更がその作品に掛かっているときは今日にする。
 * こうすると「直す → ビルド → コミット」で日付が 1 コミット遅れない。
 *
 * git を読めない環境（履歴なしの clone・tarball）では**書き換えずに終わる**。
 * 生成物はコミットしてあるので、その値がそのまま使われる。
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const SOURCE = "src/data/projects.ts";
const OUT = join(root, "src", "data", "updatedAt.ts");

function git(...args) {
  return execFileSync("git", ["-C", root, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD

/** projects.ts を作品ごとに切り、行範囲と参照している素材を返す */
function entries(text) {
  // このリポジトリの作業ツリーは CRLF。行末をそろえてから比べる
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  const out = [];
  let start = null;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i] === "  {") start = i;
    else if (lines[i] === "  }," && start !== null) {
      const body = lines.slice(start, i + 1).join("\n");
      const slug = body.match(/slug: "([^"]+)"/)?.[1];
      // 行番号は 1 始まり。git log -L も 1 始まり
      if (slug) {
        out.push({
          slug,
          from: start + 1,
          to: i + 1,
          assets: [...new Set(body.match(/\/(?:images|video)\/[^"]+/g) ?? [])].map(
            (p) => "public" + p,
          ),
        });
      }
      start = null;
    }
  }
  return out;
}

/** その行範囲を最後に変えたコミットの日付 */
function lastCommitOfRange(from, to) {
  const log = git(
    "log",
    "--no-patch",
    "--format=%cs",
    "-1",
    `-L${from},${to}:${SOURCE}`,
  );
  return log.split("\n")[0] || null;
}

/** それらのパスを最後に変えたコミットの日付 */
function lastCommitOfPaths(paths) {
  if (!paths.length) return null;
  return git("log", "--format=%cs", "-1", "--", ...paths) || null;
}

/** 作業ツリーに未コミットの変更が掛かっているか */
function dirty(entry, changedLines) {
  if (changedLines.some((n) => n >= entry.from && n <= entry.to)) return true;
  if (!entry.assets.length) return false;
  return git("status", "--porcelain", "--", ...entry.assets).length > 0;
}

/** projects.ts の未コミット差分が触っている行番号（新しいほうの側） */
function uncommittedLines() {
  const diff = git("diff", "--unified=0", "HEAD", "--", SOURCE);
  const out = [];
  for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const at = Number(m[1]);
    const len = m[2] === undefined ? 1 : Number(m[2]);
    for (let i = 0; i < Math.max(len, 1); i += 1) out.push(at + i);
  }
  return out;
}

try {
  git("rev-parse", "--is-inside-work-tree");
} catch {
  console.log("git の履歴が読めないので updatedAt.ts はそのままにします");
  process.exit(0);
}

const text = readFileSync(join(root, SOURCE), "utf8");
const changedLines = uncommittedLines();

const rows = entries(text).map((e) => {
  const dates = [lastCommitOfRange(e.from, e.to), lastCommitOfPaths(e.assets)];
  if (dirty(e, changedLines)) dates.push(today());
  const date = dates.filter(Boolean).sort().at(-1) ?? today();
  return [e.slug, date];
});

const body = rows.map(([slug, date]) => `  "${slug}": "${date}",`).join("\n");
writeFileSync(
  OUT,
  `// 生成物。手で書き換えない（npm run updated が上書きする）
// 作品ごとの「このサイトを最後に直した日」。出どころは scripts/gen-updated.mjs
export const updatedAt: Record<string, string> = {
${body}
};
`,
  "utf8",
);

console.log(`updatedAt.ts を更新しました（${rows.length} 件）`);
for (const [slug, date] of rows) console.log(`  ${date}  ${slug}`);
