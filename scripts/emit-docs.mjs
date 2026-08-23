/**
 * 元リポジトリの README.md にある作品説明ブロックを projects.ts から生成する。
 *
 *   npm run docs:emit            # sources.mjs で emit を持つ作品すべて
 *   npm run docs:emit gold-rush  # 指定した slug だけ
 *
 * なぜこれがあるか:
 *   作品の説明はもともと「元リポジトリ」と「portfolio-site」の 2 か所にあり、片方だけ
 *   更新されて必ず食い違っていた。原本を projects.ts に一本化し、リポジトリ側は生成物と
 *   して持つ。GitHub 上で読める形は残しつつ、書く場所は 1 つになる。
 *
 * なぜ README なのか:
 *   GitHub でリポジトリを開いて最初に見えるのは root の README.md で、docs/ の中は
 *   見られない。作品説明は README に置き、動かし方・設計資料は docs/README.md に送る。
 *
 * 生成するもの:
 *   <repo>/README.md の <!-- portfolio:begin --> 〜 <!-- portfolio:end --> の内側
 *     （マーカーの外は手書き。ライセンス・クレジットなど repo 固有の記述はそこに残す）
 *   <repo>/docs/portfolio/     ブロックが参照する画像（参照が消えたファイルは削除する）
 *
 * 生成物がずれていないかは `npm run check` が見る。
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { sources } from "./sources.mjs";
import { ROOT, WORKSPACE, c } from "./lib/assets.mjs";
import { loadProjects } from "./lib/projects.mjs";
import { BEGIN, imagesToCopy, renderBlock, spliceBlock } from "./lib/emit-doc.mjs";

const only = process.argv.slice(2);
const projects = await loadProjects();
const bySlug = new Map(projects.map((p) => [p.slug, p]));

let wrote = 0;
let same = 0;
const problems = [];

for (const src of sources) {
  if (!src.emit) continue;
  if (only.length && !only.includes(src.slug)) continue;

  const project = bySlug.get(src.slug);
  if (!project) {
    problems.push(`${src.title}: projects.ts に slug ${src.slug} がありません`);
    continue;
  }
  const repoDir = join(WORKSPACE, src.repo);
  if (!existsSync(repoDir)) {
    problems.push(`${src.title}: 元リポジトリが見つかりません（${src.repo}）`);
    continue;
  }

  console.log(`\n${c.bold(src.title)} ${c.dim(src.repo)}`);

  /* --- 本文 --------------------------------------------------------------- */
  const docPath = join(repoDir, src.emit.doc);
  const before = existsSync(docPath) ? readFileSync(docPath, "utf8") : null;
  const after = spliceBlock(before, renderBlock(project, src));
  mkdirSync(dirname(docPath), { recursive: true });
  if (before === after) {
    same++;
    console.log(c.dim(`  · ${src.emit.doc}（変更なし）`));
  } else {
    const isNew = before == null || !before.includes(BEGIN);
    writeFileSync(docPath, after);
    wrote++;
    console.log(`  ${c.green("↻")} ${src.emit.doc}`);
    if (isNew) {
      // 手書きの本文が下に丸ごと残っている。docs/ へ移して README を整えるのは人の仕事
      console.log(
        c.yellow(`      マーカーが無かったので先頭に差し込みました。既存の本文の行き先を確認してください`),
      );
    }
  }

  /* --- 画像 --------------------------------------------------------------- */
  // 元リポジトリに実物がある画像（keiba-ai の docs/images など）は本文がそちらを指すので
  // ここでは何も書かない。書き出しが 1 枚も無ければディレクトリごと作らない。
  const imgDir = join(repoDir, src.emit.images);
  const wanted = imagesToCopy(project, src);
  if (!wanted.length) {
    if (existsSync(imgDir)) {
      rmSync(imgDir, { recursive: true, force: true });
      console.log(`  ${c.yellow("×")} ${src.emit.images}（参照が無くなったので削除）`);
    }
    continue;
  }
  mkdirSync(imgDir, { recursive: true });
  const keep = new Set();
  for (const sitePath of wanted) {
    const from = join(ROOT, "public", sitePath.replace(/^\//, ""));
    if (!existsSync(from)) {
      problems.push(`${src.title}: 図版が見つかりません（${sitePath}）`);
      continue;
    }
    const name = basename(sitePath);
    keep.add(name);
    const to = join(imgDir, name);
    const changed =
      !existsSync(to) || !readFileSync(from).equals(readFileSync(to));
    copyFileSync(from, to);
    if (changed) console.log(`  ${c.green("↻")} ${src.emit.images}/${name}`);
  }
  // 参照が消えた画像は残さない（旧構成のスクショが残り続けるのを防ぐ）
  for (const name of readdirSync(imgDir)) {
    if (keep.has(name)) continue;
    rmSync(join(imgDir, name), { recursive: true, force: true });
    console.log(`  ${c.yellow("×")} ${src.emit.images}/${name}（参照が無くなったので削除）`);
  }
}

console.log(`\n更新 ${wrote} 件 / 変更なし ${same} 件`);
if (problems.length) {
  console.log(c.red("\n未解決:"));
  for (const p of problems) console.log(c.red("  - " + p));
  process.exit(1);
}
console.log(
  c.dim("\n生成先はそれぞれの元リポジトリです。内容を確かめてから各リポジトリでコミットしてください。"),
);
