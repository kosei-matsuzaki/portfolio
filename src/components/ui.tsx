import Image from "next/image";
import type { ReactNode } from "react";
import { categoryMeta, type Category } from "@/data/projects";
import { sizeOf } from "@/data/imageSizes";
import { asset } from "@/lib/asset";
import { TechIcon } from "@/components/TechIcon";

/* ------------------------------------------------------------------
   レイアウトの基準（左右の余白と最大幅はここだけで決める）
     gutter : px-5 → sm:px-8 → lg:px-10
     wide   : 一覧・セクション用の最大幅
     read   : 詳細ページの読み物カラム（1行の文字数を抑える）
   ------------------------------------------------------------------ */
export const GUTTER = "px-5 sm:px-8 lg:px-10";

export function Container({
  children,
  className = "",
  width = "wide",
}: {
  children: ReactNode;
  className?: string;
  width?: "wide" | "read";
}) {
  const max = width === "read" ? "max-w-[820px]" : "max-w-[1140px]";
  return (
    <div className={`mx-auto w-full ${max} ${GUTTER} ${className}`}>
      {children}
    </div>
  );
}

/** 等幅・字間広めの小ラベル（章番号・項目名・単位など） */
export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-mono text-[10px] tracking-[0.22em] uppercase sm:text-[11px] ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * 章・行の通し番号（§02 / 01 / R.01 など）。
 * size="lg" はセクション見出し用、既定は行の見出し用。
 */
export function IndexNo({
  children,
  size = "sm",
  className = "",
}: {
  children: ReactNode;
  size?: "sm" | "lg";
  className?: string;
}) {
  const scale =
    size === "lg" ? "text-[17px] sm:text-[20px]" : "text-[13px] sm:text-[15px]";
  return (
    <span
      className={`font-mono font-bold tracking-[0.08em] text-accent ${scale} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * 左段を md 以上で縦罫線の右に置くためのクラス。
 * **番号の付いた行（作品・研究・インターン）にだけ**使う。見出しや学歴などの
 * 「箇条書きでないもの」には引かない（線が意味を持たなくなるため）。
 */
export const RAIL = "md:border-l md:border-border md:pl-4";

/**
 * 左段 + 内容の 2 カラム。左段は通し番号だけが入る細い幅にしてある
 * （英字ラベルやカテゴリまで左段に入れると幅が要り、内容の左に余白が空きすぎる）。
 */
export const RAIL_GRID = "md:grid-cols-[5rem_minmax(0,1fr)] md:gap-8";

/**
 * 罫線の上に載せる●。`RAIL` を持つ要素の「内容の先頭」に置いた
 * 相対配置の要素の中で使う（-20px = pl-4 + 罫線 + ●の半径ぶん）。
 */
export function RailDot({ className = "bg-accent" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute top-1/2 -left-[20px] hidden h-[7px] w-[7px] -translate-y-1/2 rounded-full md:block ${className}`}
    />
  );
}

/**
 * セクション。見出しは「§番号 + 英字ラベル」を左段、内容を右段に置く
 * レポート風の 2 カラム（md 以上）。
 */
export function Section({
  id,
  index,
  eyebrow,
  title,
  lead,
  aside,
  children,
  className = "",
}: {
  id?: string;
  /** 章番号（"01" など）。省略時は eyebrow のみ */
  index?: string;
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** 見出しの左段（章番号の下）に置く補助 UI。Works の絞り込みで使う */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 border-t border-border py-14 sm:py-20 ${className}`}
    >
      <Container>
        {(eyebrow || title) && (
          <div
            data-reveal
            className={`grid gap-3 ${RAIL_GRID} ${
              aside ? "mb-7 sm:mb-9" : "mb-10 sm:mb-14"
            }`}
          >
            {/* 見出しの左段は番号だけ。縦罫線は箇条書き（番号付きの行）にだけ引く */}
            <div className="md:pt-1">
              {index && <IndexNo size="lg">§{index}</IndexNo>}
            </div>
            <div>
              {eyebrow && (
                <Label className="block text-faint">{eyebrow}</Label>
              )}
              {title && (
                <h2 className="mt-2.5 max-w-2xl text-2xl leading-tight font-bold tracking-tight sm:text-[2.1rem]">
                  {title}
                </h2>
              )}
              {lead && (
                <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-muted sm:text-[15px]">
                  {lead}
                </p>
              )}
              {aside && <div className="mt-7">{aside}</div>}
            </div>
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}

/**
 * 本文中の `...` を等幅のインラインコードとして描画する。
 * （projects.ts の文章は素のテキストなので、この記法だけを解釈する）
 */
export function RichText({ children }: { children: string }) {
  const parts = children.split(/`([^`]+)`/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="border border-border bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-accent"
          >
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  const meta = categoryMeta[category];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 self-start rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] ${meta.className}`}
    >
      <span className={`h-1 w-1 ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/**
 * 図版を置く「台」。方眼を敷いた枠で、比率の合わない図版（スマホの縦長画面など）を
 * 中央に据えるために使う。方眼にはマスクが掛かっているので、枠線にかからないよう
 * 背面の層に分けて重ねる。
 */
export function Plate({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden border border-border bg-surface-2 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <div className="relative flex h-full w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted">
      {children}
    </span>
  );
}

/** アイコン付きの技術チップ */
export function TechChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-border bg-surface-2 px-2.5 py-1 text-[12px] text-muted">
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
        <span className="font-mono text-[11px] text-faint">+{rest}</span>
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
        <span className="inline-flex items-center border border-border px-2.5 py-1 font-mono text-[12px] text-faint">
          +{rest}
        </span>
      )}
    </div>
  );
}

/** タイトル直下に置く共通の項目欄（期間・体制など） */
export function MetaLine({
  items,
  className = "",
}: {
  items: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <dl
      className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] ${className}`}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <dt className="font-mono text-[10px] tracking-[0.12em] text-faint">
            {item.label}
          </dt>
          <dd className="text-muted">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** 計測値の帯（罫線で仕切った計器風の並び） */
export function MetricList({
  metrics,
  className = "",
}: {
  metrics: readonly { value: string; label: string }[];
  className?: string;
}) {
  return (
    <dl
      className={`grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 ${className}`}
    >
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col-reverse gap-1.5 py-4 sm:px-5 sm:first:pl-0">
          <dt className="text-[11px] leading-snug text-faint">{m.label}</dt>
          <dd className="tnum font-mono text-xl font-bold tracking-tight text-fg">
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
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
          <span className="absolute top-0 left-0 border-r border-b border-border bg-bg/85 px-2 py-0.5 font-mono text-[10px] tracking-[0.18em] text-faint backdrop-blur-sm">
            {plate}
          </span>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-[13px] leading-relaxed text-faint">
          {caption}
        </figcaption>
      )}
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
      {caption && (
        <figcaption className="mt-3 text-[13px] leading-relaxed text-faint">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export function ArrowLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent"
    >
      <span className="link-underline">{children}</span>
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </a>
  );
}

/* ------------------------------------------------------------------
   ボタン（角丸なし・等幅ラベル）。link 用に class だけを公開する
   ------------------------------------------------------------------ */
export const btnPrimary =
  "inline-flex items-center gap-2 border border-accent bg-accent px-5 py-2.5 font-mono text-[12px] tracking-[0.1em] font-bold text-[#051a2b] transition-colors hover:bg-transparent hover:text-accent";

export const btnGhost =
  "inline-flex items-center gap-2 border border-border-strong px-5 py-2.5 font-mono text-[12px] tracking-[0.1em] font-bold text-fg transition-colors hover:border-accent hover:text-accent";
