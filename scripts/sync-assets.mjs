/**
 * 元リポジトリの画像・動画を public/ へ取り込み、取り込んだ時点の状態を
 * scripts/assets-state.json に記録する。
 *
 *   npm run assets:sync
 *
 * 記録した状態は `npm run check` が「元が更新されたのに取り込んでいない」
 * ことを検出するのに使う。対応表は scripts/sources.mjs。
 *
 * 取り込んだあとは `npm run sizes`（画像サイズ表の再生成）も忘れずに。
 */
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, relative, join } from "node:path";
import { sources } from "./sources.mjs";
import { ROOT, STATE_FILE, expand, gitHead, sha, c } from "./lib/assets.mjs";

const state = {};
let copied = 0;
let unchanged = 0;
const problems = [];

for (const src of sources) {
  const git = gitHead(src.repo);
  const entry = { repo: src.repo, head: git?.head ?? null, copied: {} };

  console.log(
    `\n${c.bold(src.title)} ${c.dim(src.repo + (git ? ` @ ${git.short}` : " (git 管理外)"))}`,
  );
  if (git?.dirty) {
    console.log(c.yellow("  ! 作業ツリーに未コミットの変更があります"));
  }

  for (const def of src.copy ?? []) {
    const { missing, pairs } = expand(def, src.repo);
    if (missing) {
      problems.push(`${src.title}: 元が見つかりません → ${def.from}`);
      console.log(c.red(`  ✗ 見つかりません: ${def.from}`));
      continue;
    }
    for (const [from, to] of pairs) {
      const rel = "/" + relative(join(ROOT, "public"), to).split("\\").join("/");
      const before = existsSync(to) ? sha(to) : null;
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
      const after = sha(to);
      entry.copied[rel] = after;
      if (before === after) {
        unchanged++;
      } else {
        copied++;
        console.log(`  ${c.green("↻")} ${rel}`);
      }
    }
  }

  // 録画で作った素材は自動同期できないので、いつの版から作ったかだけ記録する
  if (src.recorded?.length) {
    entry.recorded = {};
    for (const rec of src.recorded) {
      entry.recorded[rec.dir] = git?.head ?? null;
      console.log(c.dim(`  · 録画素材 ${rec.dir} は ${git?.short ?? "?"} 時点として記録`));
    }
  }

  state[src.slug] = entry;
}

writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + "\n");

console.log(
  `\n更新 ${copied} 件 / 変更なし ${unchanged} 件。状態を ${relative(ROOT, STATE_FILE)} に記録しました。`,
);
if (problems.length) {
  console.log(c.red("\n未解決:"));
  for (const p of problems) console.log(c.red("  - " + p));
}
console.log(c.dim("\n続けて `npm run sizes` を実行してください。"));
