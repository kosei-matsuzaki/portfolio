/**
 * projects.ts の 1 作品ぶんを、元リポジトリの README.md に埋める「作品説明ブロック」に組み立てる。
 *
 * GitHub でリポジトリを開いたとき最初に見えるのは root の README.md なので、作品説明はそこに置く。
 * README のうち <!-- portfolio:begin --> 〜 <!-- portfolio:end --> の内側だけをこの生成器が持ち、
 * 外側（ライセンス・クレジットなど元リポジトリ固有の記述）は手書きのまま残す。
 * 動かし方・設計資料は docs/ に移し、ブロックの冒頭と末尾から docs/README.md へ送る。
 *
 * 生成する側とチェックする側の両方から呼ぶので、ここは「文字列を作るだけ」に留めて
 * ファイル I/O を持たせていない（同じ入力なら必ず同じ出力になる、が check の前提）。
 *
 * 載せないもの:
 *   - 動かし方・依存・ライセンス … docs/ と README 手書き部の担当。二重に書かない
 *   - 動画 … mp4 は portfolio-site にしか無いので、公開ページへのリンクで代える
 */
import { basename, join, posix, relative } from "node:path";
import { ROOT, WORKSPACE, expand } from "./assets.mjs";

export const SITE = "https://kosei-matsuzaki.github.io/portfolio";
export const BEGIN = "<!-- portfolio:begin -->";
export const END = "<!-- portfolio:end -->";
/** 開発者向けの入口。全リポジトリで同じ場所に置く */
export const DOCS_INDEX = "docs/README.md";

/** 生成物が参照する画像（/images/... のサイト内パス）を作品から集める */
export function collectImages(project) {
  const out = [];
  const push = (p) => {
    if (p && !out.includes(p)) out.push(p);
  };
  push(project.media?.poster);
  push(project.cover?.src);
  for (const s of project.shots ?? []) push(s.src);
  for (const sec of project.sections ?? []) {
    push(sec.figure?.src);
    for (const b of sec.bullets ?? []) push(b.media?.poster);
  }
  return out;
}

const slash = (p) => p.split("\\").join("/");

/**
 * サイト内パス（/images/...）→ 元リポジトリに既にある同じ画像のパス。
 *
 * keiba-ai のように「元リポジトリの画像を portfolio-site へコピーしている」作品は、
 * 書き戻すと同じ画像が 1 つのリポジトリに 2 つ入ってしまう。copy の対応表を逆に辿って、
 * 元からあるほうを参照する。
 */
function originalsInRepo(src) {
  const map = new Map();
  const repoDir = join(WORKSPACE, src.repo);
  for (const def of src.copy ?? []) {
    const { missing, pairs } = expand(def, src.repo);
    if (missing) continue;
    for (const [from, to] of pairs) {
      const site = "/" + slash(relative(join(ROOT, "public"), to));
      map.set(slash(site), slash(relative(repoDir, from)));
    }
  }
  return map;
}

/**
 * 書き込み先（README.md）から見た画像の相対パスを返す関数を作る。
 * 元リポジトリに実物があればそれを、無ければ書き出し先（docs/portfolio/…）を指す。
 */
export function makeHref(src) {
  const originals = originalsInRepo(src);
  const docDir = posix.dirname(slash(src.emit.doc));
  const imageDir = slash(src.emit.images);
  return (sitePath) => {
    const original = originals.get(slash(sitePath));
    const target = original ?? posix.join(imageDir, basename(sitePath));
    const rel = posix.relative(docDir, target) || basename(target);
    // 「My project/」のように空白を含むパスがある（Markdown のリンクが途中で切れる）
    return rel.replace(/ /g, "%20");
  };
}

/**
 * 元リポジトリに実物がある素材だけを解決する関数を作る（無ければ null）。
 * mp4 のように portfolio-site へコピーしてきた実体が元リポジトリにある場合、
 * README からその実体を直接指せる。
 */
export function makeOriginalHref(src) {
  const originals = originalsInRepo(src);
  const docDir = posix.dirname(slash(src.emit.doc));
  return (sitePath) => {
    const original = originals.get(slash(sitePath));
    if (!original) return null;
    const rel = posix.relative(docDir, original) || basename(original);
    return rel.replace(/ /g, "%20");
  };
}

/** 書き出しが必要な画像だけ（元リポジトリに実物があるものは除く） */
export function imagesToCopy(project, src) {
  const originals = originalsInRepo(src);
  return collectImages(project).filter((p) => !originals.has(slash(p)));
}

const esc = (s) => String(s).replace(/\|/g, "\\|");

function figure(media, href) {
  const lines = [`![${media.alt}](${href})`];
  if (media.caption) lines.push("", `*${media.caption}*`);
  return lines;
}

/**
 * 作品説明ブロック（マーカー込み）を組み立てる。
 *
 * @param project projects.ts の 1 要素
 * @param src     sources.mjs の 1 要素（emit / copy を見る）
 */
export function renderBlock(project, src) {
  const href = makeHref(src);
  const original = makeOriginalHref(src);
  const docsIndex =
    posix.relative(posix.dirname(slash(src.emit.doc)), DOCS_INDEX) || DOCS_INDEX;
  const L = [];

  L.push(BEGIN);
  L.push("<!-- ここから portfolio:end までは自動生成です。直接編集しても次の生成で消えます。");
  L.push(`     原本 : portfolio-site/src/data/projects.ts （slug: ${project.slug}）`);
  L.push("     生成 : cd portfolio-site && npm run docs:emit");
  L.push("     点検 : cd portfolio-site && npm run check");
  L.push("     マーカーの外（ライセンス・クレジットなど）は手書きのまま残ります -->");
  L.push("");
  L.push(`# ${project.title}`);
  L.push("");
  L.push(`> ${project.subtitle}`);
  L.push("");

  /* --- 行き先の案内 ------------------------------------------------------ */
  // GitHub で最初に見えるのはここ。作品ページ（動画つき）と開発者向けの入口を並べる。
  const demoLink = (project.links ?? []).find((l) => l.kind === "demo");
  // 公開ページに動画があるかどうかで案内の文言を変える（静止画だけの作品に「動画つき」と書かない）
  const hasVideo = Boolean(
    project.video ||
      project.media?.video ||
      (project.sections ?? []).some((sec) => (sec.bullets ?? []).some((b) => b.media?.video)),
  );
  const worksLabel = hasVideo ? "作品ページ（動画つき）" : "作品ページ";
  const nav = [];
  if (demoLink) nav.push(`**[▶ デモ](${demoLink.href})**`);
  nav.push(`**[${worksLabel}](${SITE}/works/${project.slug}/)**`);
  nav.push(`**[開発者向けドキュメント](${docsIndex})**`);
  L.push(nav.join(" ・ "));
  L.push("");

  /* --- 諸元表 ------------------------------------------------------------ */
  L.push("| 項目 | 内容 |");
  L.push("| --- | --- |");
  L.push(`| 期間 | ${esc(project.period)} |`);
  L.push(`| 体制 | ${esc(project.role)} |`);
  L.push(`| 使用技術 | ${esc(project.stack.join(" / "))} |`);
  for (const m of project.metrics ?? []) {
    L.push(`| ${esc(m.label)} | ${esc(m.value)} |`);
  }
  L.push("");

  if (project.note) {
    L.push(`> **注記** — ${project.note}`);
    L.push("");
  }

  /* --- 概要と主図版 ------------------------------------------------------ */
  L.push(project.summary);
  L.push("");

  const cover = project.media ?? project.cover;
  if (cover) {
    const media = project.media ?? {
      poster: project.cover.src,
      alt: project.cover.alt,
      caption: project.cover.caption,
    };
    L.push(...figure(media, href(media.poster)));
    L.push("");
  }

  /* --- 解説動画 ---------------------------------------------------------- */
  // mp4 の実体が元リポジトリにある作品（keiba-ai の manim 動画）だけ、ポスターから直接リンクする。
  // 実体が portfolio-site にしか無い録画は、公開ページへのリンクで代える。
  if (project.video) {
    const mp4 = original(project.video.src);
    const poster = original(project.video.poster);
    if (mp4 && poster) {
      L.push(`[![${project.video.caption}](${poster})](${mp4})`);
      L.push("");
      L.push(`*${project.video.caption}（サムネイルをクリックで再生・ダウンロード）*`);
      L.push("");
    }
  }

  if (project.highlights?.length) {
    L.push("**見どころ**");
    L.push("");
    for (const h of project.highlights) L.push(`- ${h}`);
    L.push("");
  }

  /* --- 本文 -------------------------------------------------------------- */
  for (const sec of project.sections ?? []) {
    L.push(`## ${sec.heading}`);
    L.push("");
    for (const p of sec.body ?? []) {
      L.push(p);
      L.push("");
    }
    for (const b of sec.bullets ?? []) {
      if (b.title) {
        L.push(`### ${b.title}`);
        L.push("");
      }
      L.push(b.text);
      L.push("");
      if (b.media) {
        L.push(...figure(b.media, href(b.media.poster)));
        L.push("");
      }
    }
    if (sec.table) {
      L.push(`| ${sec.table.headers.map(esc).join(" | ")} |`);
      L.push(`| ${sec.table.headers.map(() => "---").join(" | ")} |`);
      for (const row of sec.table.rows) {
        L.push(`| ${row.map(esc).join(" | ")} |`);
      }
      L.push("");
      if (sec.table.caption) {
        L.push(`*${sec.table.caption}*`);
        L.push("");
      }
    }
    if (sec.figure) {
      L.push(
        ...figure({ alt: sec.figure.alt, caption: sec.figure.caption }, href(sec.figure.src)),
      );
      L.push("");
    }
  }

  /* --- 図版のみの作品（shots）------------------------------------------- */
  if (project.shots?.length) {
    L.push("## 画面");
    L.push("");
    for (const s of project.shots) {
      L.push(...figure({ alt: s.alt, caption: s.caption }, href(s.src)));
      L.push("");
    }
  }

  /* --- AI の活用 --------------------------------------------------------- */
  if (project.aiUsage?.length) {
    L.push("## 生成 AI の活用について");
    L.push("");
    for (const a of project.aiUsage) L.push(`- ${a}`);
    L.push("");
  }

  /* --- 締め -------------------------------------------------------------- */
  L.push("---");
  L.push("");
  const tail = [
    `動かし方・設計資料・開発メモは **[${docsIndex}](${docsIndex})** にまとめています。`,
    `${hasVideo ? "動画つきの詳しい版" : "詳しい版"}: ${SITE}/works/${project.slug}/`,
  ];
  if (demoLink) tail.push(`デモ: ${demoLink.href}`);
  L.push(tail.join("  \n"));
  L.push("");
  L.push(END);

  return L.join("\n");
}

/** README から生成ブロックを取り出す。マーカーが無ければ null */
export function extractBlock(text) {
  const from = text.indexOf(BEGIN);
  const to = text.indexOf(END);
  if (from === -1 || to === -1 || to < from) return null;
  return text.slice(from, to + END.length);
}

/**
 * README の生成ブロックだけを差し替えた全文を返す。
 * マーカーがまだ無いリポジトリでは先頭に差し込む（既存の本文は消さない）。
 */
export function spliceBlock(text, block) {
  if (text == null) return block + "\n";
  const from = text.indexOf(BEGIN);
  const to = text.indexOf(END);
  if (from === -1 || to === -1 || to < from) {
    const rest = text.replace(/^\s+/, "");
    return block + "\n" + (rest ? "\n" + rest : "");
  }
  return text.slice(0, from) + block + text.slice(to + END.length);
}
