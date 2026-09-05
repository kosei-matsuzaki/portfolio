import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  categoryMeta,
  linkMeta,
  shortRole,
  type Category,
  type Project,
} from "@/data/projects";
import { sizeOf } from "@/data/imageSizes";
import { asset } from "@/lib/asset";
import { TechIcon } from "@/components/TechIcon";
import { MetaLine, RichText } from "@/components/ui";

/* ------------------------------------------------------------------
   作品データと素材に触る部品。
   ui.tsx は器（余白・レール・ボタン）で data を知らないので、
   projects.ts の型や public/ の画像を見るものはこちらへ置く。
   ------------------------------------------------------------------ */

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex w-fit items-center self-start border border-border px-2.5 py-0.5 text-micro text-muted">
      {categoryMeta[category].label}
    </span>
  );
}

/** アイコン付きの技術チップ */
export function TechChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-border bg-surface-2 px-2.5 py-1 text-micro text-muted">
      <TechIcon label={label} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/** 一覧用：アイコンだけを並べる（文字量を増やさずに技術を伝える） */
export function TechIcons({
  items,
  max = 6,
  className = "",
}: {
  items: readonly string[];
  max?: number;
  className?: string;
}) {
  const shown = items.slice(0, max);
  const rest = items.length - shown.length;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {shown.map((s) => (
        <span
          key={s}
          title={s}
          className="flex h-8 w-8 items-center justify-center border border-border bg-surface-2 transition-colors hover:border-border-strong"
        >
          <TechIcon label={s} className="h-[17px] w-[17px]" />
        </span>
      ))}
      {rest > 0 && (
        <span className="text-micro text-faint">+{rest}</span>
      )}
    </div>
  );
}

export function TechChips({
  items,
  max,
  className = "",
}: {
  items: readonly string[];
  max?: number;
  className?: string;
}) {
  const shown = max ? items.slice(0, max) : items;
  const rest = max ? items.length - shown.length : 0;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {shown.map((s) => (
        <TechChip key={s} label={s} />
      ))}
      {rest > 0 && (
        <span className="inline-flex items-center border border-border px-2.5 py-1 text-micro text-faint">
          +{rest}
        </span>
      )}
    </div>
  );
}

/** 外部リンクの印。文言に「↗」を足さず、記号を別要素として小さく置く */
function ExternalMark() {
  return (
    <svg
      viewBox="0 0 10 10"
      aria-hidden
      className="h-2 w-2 shrink-0 self-center opacity-70"
    >
      <path
        d="M3 1h6v6M9 1 1.5 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/** 図版のキャプション。Shot と Figure で体裁を揃える（docs/design.md の図版の項） */
function Caption({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <figcaption className="mt-3 text-small text-faint sm:text-small-sm">
      {children}
    </figcaption>
  );
}

/** キャプション付きスクリーンショット（図版番号つき） */
export function Shot({
  src,
  alt,
  caption,
  plate,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  caption?: string;
  /** "FIG. 02" のような図版番号 */
  plate?: string;
  priority?: boolean;
  className?: string;
}) {
  const { w, h } = sizeOf(src);
  return (
    <figure className={className}>
      <div className="relative overflow-hidden border border-border bg-surface-2">
        <Image
          src={asset(src)}
          alt={alt}
          width={w}
          height={h}
          priority={priority}
          sizes="(max-width: 768px) 100vw, 900px"
          className="h-auto w-full"
        />
        {plate && (
          <span className="absolute top-0 left-0 border-r border-b border-border bg-bg/85 px-2 py-0.5 text-micro text-faint backdrop-blur-sm">
            {plate}
          </span>
        )}
      </div>
      <Caption>{caption}</Caption>
    </figure>
  );
}

/** 白背景の図版（研究発表資料の SVG など） */
export function Figure({
  src,
  alt,
  caption,
  light = false,
}: {
  src: string;
  alt: string;
  caption?: string;
  light?: boolean;
}) {
  return (
    <figure className="mt-6">
      <div
        className={`overflow-hidden border border-border ${
          light ? "figure-light" : "bg-surface-2 p-3"
        }`}
      >
        {/* SVG はサイズ不定のため通常の img で扱う */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset(src)}
          alt={alt}
          loading="lazy"
          className="mx-auto h-auto w-full max-w-2xl"
        />
      </div>
      <Caption>{caption}</Caption>
    </figure>
  );
}

/**
 * 作品 1 件の記述（バッジ → 見出し → 概要 → 期間・体制 → 技術 → リンク）。
 * Works の一覧カードと Research / Internship の横長の行が同じ並びを使う。
 *
 * dense は「狭い段に置く」という 1 つの事情で、3 つの見せ方が同時に決まる:
 * 概要を 4 行で切り、アイコンを 6 個までにし、リンクは短い名前（linkMeta.short）にする。
 * 広い段では概要を切らず、アイコンを 8 個まで出し、リンクは label をそのまま出す。
 */
export function ProjectRowBody({
  project,
  badge,
  cta,
  dense = false,
}: {
  project: Project;
  badge: ReactNode;
  cta: string;
  dense?: boolean;
}) {
  const href = `/works/${project.slug}/`;

  return (
    <div className="flex flex-col">
      {badge}
      <h3 className="mt-3 text-h2 font-semibold sm:text-h2-sm">
        <Link href={href} className="link-underline">
          {project.title}
        </Link>
      </h3>
      <p className="mt-2 text-small text-muted sm:text-small-sm">
        {project.subtitle}
      </p>

      <MetaLine
        className="mt-4"
        items={[
          { label: "期間", value: project.period },
          { label: "体制", value: shortRole(project.role) },
        ]}
      />

      <p
        className={`text-small text-faint sm:text-small-sm ${
          dense ? "mt-4 line-clamp-4" : "mt-5 max-w-3xl"
        }`}
      >
        <RichText>{project.summary}</RichText>
      </p>

      <TechIcons items={project.stack} max={dense ? 6 : 8} className="mt-5" />

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link
          href={href}
          className="text-small font-medium text-fg underline decoration-[color:var(--work-accent)] decoration-2 underline-offset-4 sm:text-small-sm"
        >
          {cta}
        </Link>
        {project.links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-baseline gap-1 text-small text-faint underline decoration-border-strong underline-offset-4 transition-colors hover:text-fg"
          >
            {dense ? linkMeta[l.kind].short : l.label}
            <ExternalMark />
          </a>
        ))}
      </div>
    </div>
  );
}
