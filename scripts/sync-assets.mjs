/**
 * 元リポジトリの画像・動画を public/ へ取り込み、確かめた時点を
 * scripts/assets-state.json に記録する。
 *
 *   npm run assets:sync                              # 全作品の素材を取り込む
 *   npm run assets:sync -- fluid-lab                 # 指定した作品だけ
 *   npm run assets:sync -- --recorded=michishirube   # 録り直した → 録画時点を進める
 *   npm run assets:sync -- --reviewed=keiba-ai       # 本文・数値を確かめた → 確認時点を進める
 *
 * 記録した状態は `npm run check` が「元が更新されたのに取り残されている」ことを
 * 検出するのに使う。対応表は scripts/sources.mjs。
 *
 * **素材のコピーでは記録を進めない。**`head`（本文・数値を確かめた時点）も
 * `recorded`（録画した時点）も人が確かめたことを表す値なので、フラグで名指し
 * したときだけ動く（初回だけ、比較の起点として現在の版を入れる）。以前は 1 回
 * 走らせるだけで全作品が現在の HEAD へ飛び、録画していない作品まで「この版で
 * 録った」ことになって、次の撮り直しの判断材料が消えていた。
 *
 * 取り込んだあとは `npm run sizes`（画像サイズ表の再生成）も忘れずに。
 */
import { copyFileSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, relative, join } from "node:path";
import { sources } from "./sources.mjs";
import { ROOT, STATE_FILE, commitsSince, expand, gitHead, sha, c } from "./lib/assets.mjs";

const bySlug = new Map(sources.map((s) => [s.slug, s]));

function fail(...lines) {
  for (const l of lines) console.error(l);
  process.exit(1);
}

/* ------------------------------------------------------------------ 引数 */
const FLAGS = ["recorded", "reviewed"];
const flag = { recorded: new Set(), reviewed: new Set() };
const only = new Set();

for (const arg of process.argv.slice(2)) {
  if (!arg.startsWith("--")) {
    only.add(arg);
    continue;
  }
  const [name, ...rest] = arg.slice(2).split("=");
  const value = rest.join("=");
  if (!FLAGS.includes(name)) {
    fail(c.red(`知らないフラグです: ${arg}`), c.dim(`  使えるのは ${FLAGS.map((f) => `--${f}=<作品>`).join(" / ")}`));
  }
  if (!value) {
    fail(c.red(`--${name} は作品を指定してください（例: --${name}=michishirube）`));
  }
  for (const s of value.split(",")) if (s) flag[name].add(s);
}

// 空振りするフラグは、渡した人が「進めた」と思って先に行くので先に落とす
for (const slug of [...only, ...flag.recorded, ...flag.reviewed]) {
  if (!bySlug.has(slug)) {
    fail(c.red(`知らない作品です: ${slug}`), c.dim(`  使えるのは ${[...bySlug.keys()].join(" / ")}`));
  }
}
for (const slug of flag.recorded) {
  if (!bySlug.get(slug).recorded?.length) {
    fail(c.red(`${slug} は録画素材を持っていません（sources.mjs の recorded が空）`));
  }
}
for (const slug of flag.reviewed) {
  if (!gitHead(bySlug.get(slug).repo)) {
    fail(c.red(`${slug} の元リポジトリは git 管理外なので、確認時点を記録できません`));
  }
}

// 名指しされた作品は、位置引数で絞っていても必ず対象に含める
const targets = only.size ? new Set([...only, ...flag.recorded, ...flag.reviewed]) : null;

/* ------------------------------------------------------------------ 記録 */
function loadStateStrict() {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch (e) {
    // 空の状態から書き直すと、確かめた時点（もう再生成できない値）が消える
    fail(
      c.red(`${relative(ROOT, STATE_FILE)} が読めません: ${e.message}`),
      c.dim("  上書きすると確かめた時点が失われるので中断しました（git checkout で戻せます）"),
    );
  }
}

const prevState = loadStateStrict();
const state = {};
let copied = 0;
let unchanged = 0;
const problems = [];
const behind = [];

for (const src of sources) {
  const prev = prevState[src.slug];

  if (targets && !targets.has(src.slug)) {
    if (prev) state[src.slug] = prev; // 対象外は前回の記録をそのまま持ち越す
    continue;
  }

  const git = gitHead(src.repo);
  // copied は今回コピーしたものだけを持つ（対応表から消えた素材の記録を残さない）
  const entry = { repo: src.repo, head: prev?.head ?? git?.head ?? null, copied: {} };

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

  // 録画素材は自動同期できない。撮り直したと言われたときだけ時点を進める
  if (src.recorded?.length) {
    entry.recorded = {};
    for (const rec of src.recorded) {
      if (flag.recorded.has(src.slug)) {
        entry.recorded[rec.dir] = git?.head ?? null;
        console.log(c.green(`  ↻ 録画素材 ${rec.dir} を ${git?.short ?? "?"} 時点として記録`));
      } else {
        entry.recorded[rec.dir] = prev?.recorded?.[rec.dir] ?? git?.head ?? null;
      }
    }
  }

  // 本文・数値を確かめたと言われたときだけ、確認時点を進める
  if (flag.reviewed.has(src.slug) && git) {
    entry.head = git.head;
    console.log(c.green(`  ↻ 確認時点を ${git.short} に進めた`));
  } else if (git && entry.head && entry.head !== git.head) {
    // ドキュメントだけのコミットは本文の見直しに関係ない（check と同じ判定）。
    // null は「起点のコミットが元リポジトリから消えた」なので、黙らせずに挙げる
    const code = commitsSince(src.repo, entry.head, { codeOnly: true });
    if (code === null) {
      console.log(c.yellow(`  ! 記録している起点 ${entry.head.slice(0, 7)} が元リポジトリに見つかりません`));
      behind.push(src.slug);
    } else if (code > 0) {
      behind.push(src.slug);
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
if (behind.length) {
  console.log(
    c.dim(
      `\n元リポジトリが進んでいる作品: ${behind.join(" / ")}` +
        `\n本文・数値を実態に合わせたら: npm run assets:sync -- --reviewed=${behind.join(",")}`,
    ),
  );
}
console.log(c.dim("\n続けて `npm run sizes` を実行してください。"));
