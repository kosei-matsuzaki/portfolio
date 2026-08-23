/**
 * src/data/projects.ts を node のスクリプトから読む。
 *
 * projects.ts は「サイトの内容の唯一の原本」で、元リポジトリの作品説明資料
 * （docs/PORTFOLIO.md）もここから生成する。素の node は TypeScript を読めないので、
 * 型注釈だけ落としてから data: URL として import している。
 *
 * projects.ts が他のモジュールを import しはじめたらこの手は使えなくなる
 * （data: URL からの相対 import は解決できない）。そのときは中身を .mjs に移して、
 * 型は別ファイルの `declare` に寄せること。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { ROOT } from "./assets.mjs";

export async function loadProjects() {
  const file = join(ROOT, "src", "data", "projects.ts");
  const source = readFileSync(file, "utf8");
  if (/^\s*import\s/m.test(source)) {
    throw new Error(
      "projects.ts が他のモジュールを import しています。scripts/lib/projects.mjs の注意書きを読んでください",
    );
  }
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const url = "data:text/javascript;base64," + Buffer.from(js, "utf8").toString("base64");
  return (await import(url)).projects;
}
