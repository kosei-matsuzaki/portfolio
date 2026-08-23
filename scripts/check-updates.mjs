/**
 * サイトの内容が元リポジトリから取り残されていないかを点検する。
 *
 *   npm run check              # 全部
 *   npm run check -- --refs    # 参照の整合性だけ（元リポジトリが無い CI 用）
 *
 * 見るのは 4 点:
 *   1. 参照の整合性 … src/ から参照しているのに public/ に無い素材、逆に誰も使っていない素材
 *   2. 取り込み素材 … 元リポジトリの画像が変わったのに取り込んでいない
 *   3. 録画素材     … 録画してから元リポジトリが進んでいる（撮り直しの検討）
 *   4. 書き戻し     … 元リポジトリの作品説明資料が projects.ts と食い違っている
 *
 * 1 は元リポジトリが無くても動くので、CI でも実行できる。
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { sources } from "./sources.mjs";
import {
  ROOT,
  WORKSPACE,
  c,
  commitsSince,
  existingAssets,
  expand,
  gitHead,
  loadState,
  referencedAssets,
  sha,
} from "./lib/assets.mjs";
import { loadProjects } from "./lib/projects.mjs";
import { imagesToCopy, renderDoc } from "./lib/emit-doc.mjs";

const refsOnly = process.argv.includes("--refs");
const state = loadState();
let warnings = 0;
let errors = 0;

/* ------------------------------------------------------- 1. 参照の整合性 */
console.log(c.bold("\n■ 参照の整合性"));
const refs = referencedAssets();
const files = existingAssets();

const missing = [...refs].filter((r) => !files.has(r));
const unused = [...files].filter((f) => !refs.has(f));

if (missing.length) {
  errors += missing.length;
  console.log(c.red(`  ✗ 参照されているのに public/ に無い素材が ${missing.length} 件`));
  for (const m of missing) console.log(c.red(`      ${m}`));
} else {
  console.log(c.green("  ✓ 参照している素材はすべて存在します"));
}

if (unused.length) {
  warnings += unused.length;
  console.log(c.yellow(`  ! どこからも参照されていない素材が ${unused.length} 件`));
  for (const u of unused) console.log(c.yellow(`      ${u}`));
  console.log(c.dim("      （消してよければ削除し、sources.mjs の対応表も直してください）"));
} else {
  console.log(c.green("  ✓ 使っていない素材はありません"));
}

if (refsOnly) {
  console.log(errors ? c.red("\n参照エラーあり") : c.green("\n参照 OK"));
  process.exit(errors ? 1 : 0);
}

/* ------------------------------------------- 2 / 3. 元リポジトリとのずれ */
console.log(c.bold("\n■ 元リポジトリとのずれ"));

for (const src of sources) {
  const repoDir = join(WORKSPACE, src.repo);
  if (!existsSync(repoDir)) {
    console.log(`\n${c.bold(src.title)}  ${c.dim("元リポジトリが見つかりません: " + src.repo)}`);
    continue;
  }

  const git = gitHead(src.repo);
  const prev = state[src.slug];
  const lines = [];

  // --- コピー素材: 元のハッシュと取り込み済みのハッシュを比べる
  for (const def of src.copy ?? []) {
    const { missing: gone, pairs } = expand(def, src.repo);
    if (gone) {
      lines.push(c.red(`✗ 元が見つかりません: ${def.from}`));
      errors++;
      continue;
    }
    for (const [from, to] of pairs) {
      if (!existsSync(to)) {
        lines.push(c.yellow(`! 未取り込み: ${def.to}`));
        warnings++;
        continue;
      }
      if (sha(from) !== sha(to)) {
        lines.push(c.yellow(`! 元の画像が変わっています: ${def.from}`));
        warnings++;
      }
    }
  }

  // --- 元リポジトリのコミットが進んでいるか
  if (git && prev?.head && git.head !== prev.head) {
    const n = commitsSince(src.repo, prev.head);
    const code = commitsSince(src.repo, prev.head, { codeOnly: true });
    if (code === 0) {
      // docs:emit の書き戻しなど、ドキュメントだけのコミット。本文の見直しは要らない
      lines.push(c.dim(`· 取り込み後に ${n} コミット進んでいますが、ドキュメントのみです`));
    } else {
      lines.push(
        c.yellow(
          `! 取り込み後にコード変更が ${code ?? "?"} コミット進んでいます（最新: ${git.short} ${git.date} ${git.subject}）`,
        ),
      );
      warnings++;
      lines.push(c.dim("  → 本文・数値（metrics）が実態と合っているか確認してください"));
    }
  }
  if (git && !prev) {
    lines.push(c.dim("· まだ一度も取り込んでいません（npm run assets:sync）"));
  }

  // --- 録画素材: 録画時点より元が進んでいるか
  for (const rec of src.recorded ?? []) {
    const at = prev?.recorded?.[rec.dir];
    const dir = join(WORKSPACE, "portfolio-site", rec.dir);
    if (!existsSync(dir)) {
      lines.push(c.red(`✗ 録画素材がありません: ${rec.dir}`));
      errors++;
    } else if (git && at && at !== git.head) {
      const code = commitsSince(src.repo, at, { codeOnly: true });
      if (code === 0) continue; // ドキュメントだけの変更で見た目は動かない
      lines.push(
        c.yellow(`! 録画後にコード変更が ${code ?? "?"} コミット進んでいます（${rec.dir}）`),
      );
      lines.push(c.dim(`  → 見た目が変わっていれば撮り直し: ${rec.command}`));
      warnings++;
    }
  }

  const stamp = git ? `${git.short}${git.dirty ? " +未コミット" : ""}` : "git 管理外";
  console.log(`\n${c.bold(src.title)} ${c.dim(src.repo + " @ " + stamp)}`);
  if (lines.length) {
    for (const l of lines) console.log("  " + l);
  } else {
    console.log(c.green("  ✓ ずれなし"));
  }
}

/* ------------------------------------- 4. 元リポジトリへの書き戻し */
console.log(c.bold("\n■ 元リポジトリの作品説明資料（projects.ts から生成）"));

const projects = new Map((await loadProjects()).map((p) => [p.slug, p]));
let emitted = 0;

for (const src of sources) {
  if (!src.emit) continue;
  emitted++;
  const repoDir = join(WORKSPACE, src.repo);
  const label = `${src.title} ${c.dim(src.repo + "/" + src.emit.doc)}`;
  const project = projects.get(src.slug);

  if (!existsSync(repoDir)) {
    console.log(`  ${c.dim("· " + src.title + ": 元リポジトリが見つかりません")}`);
    continue;
  }
  if (!project) {
    console.log(`  ${c.red("✗ " + label + " … projects.ts に slug がありません")}`);
    errors++;
    continue;
  }

  const stale = [];
  const docPath = join(repoDir, src.emit.doc);
  if (!existsSync(docPath)) {
    stale.push("未生成");
  } else if (readFileSync(docPath, "utf8") !== renderDoc(project, src)) {
    stale.push("本文が projects.ts と違います");
  }
  for (const sitePath of imagesToCopy(project, src)) {
    const to = join(repoDir, src.emit.images, basename(sitePath));
    const from = join(ROOT, "public", sitePath.replace(/^\//, ""));
    if (!existsSync(to) || sha(from) !== sha(to)) {
      stale.push(`図版が古い: ${basename(sitePath)}`);
    }
  }

  if (stale.length) {
    warnings += stale.length;
    console.log(`  ${c.yellow("! " + label)}`);
    for (const t of stale) console.log(c.yellow(`      ${t}`));
  } else {
    console.log(`  ${c.green("✓")} ${label}`);
  }
}
if (!emitted) console.log(c.dim("  （sources.mjs に emit を持つ作品がありません）"));

/* ------------------------------------------------------------- まとめ */
console.log(
  "\n" +
    (errors
      ? c.red(`要対応 ${errors} 件 / 要確認 ${warnings} 件`)
      : warnings
        ? c.yellow(`要確認 ${warnings} 件`)
        : c.green("すべて最新です")),
);
if (warnings || errors) {
  console.log(
    c.dim(
      "\n取り込み直す: npm run assets:sync && npm run sizes\n" +
        "録画し直す  : scripts/record-*.mjs（冒頭のコメントに手順）\n" +
        "本文を直す  : src/data/projects.ts\n" +
        "書き戻す    : npm run docs:emit（そのあと各リポジトリでコミット）",
    ),
  );
}
process.exit(errors ? 1 : 0);
