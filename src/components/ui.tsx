import type { ReactNode } from "react";

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
  const max = width === "read" ? "max-w-[660px]" : "max-w-[1140px]";
  return (
    <div className={`mx-auto w-full ${max} ${GUTTER} ${className}`}>
      {children}
    </div>
  );
}

/** 小ラベル（項目名・単位など）。大文字にも等幅にもしない（docs/design.md） */
export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`text-micro text-faint ${className}`}>{children}</span>
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
    size === "lg" ? "text-h2 sm:text-h2-sm" : "text-small sm:text-small-sm";
  return (
    <span
      className={`font-semibold text-[color:var(--work-accent)] ${scale} ${className}`}
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
export function RailDot({
  className = "bg-[color:var(--work-accent)]",
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`absolute top-1/2 -left-[20px] hidden h-[7px] w-[7px] -translate-y-1/2 rounded-full md:block ${className}`}
    />
  );
}

/**
 * セクション。見出しは §番号を左段、日本語の見出しと内容を右段に置く
 * レポート風の 2 カラム（md 以上）。
 */
export function Section({
  id,
  index,
  title,
  lead,
  aside,
  children,
  className = "",
}: {
  id?: string;
  /** 章番号（"01" など） */
  index?: string;
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
        {title && (
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
              <h2 className="max-w-2xl text-h1 font-semibold sm:text-h1-sm">
                {title}
              </h2>
              {lead && (
                <p className="mt-4 max-w-2xl text-small text-muted sm:text-small-sm">
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
            className="border border-border bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-[color:var(--work-accent)]"
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
      className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-small ${className}`}
    >
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <dt className="text-micro text-faint">
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
          <dt className="text-micro leading-snug text-faint">{m.label}</dt>
          <dd className="text-h2 font-semibold text-fg sm:text-h2-sm">
            {m.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ------------------------------------------------------------------
   ボタン（角丸なし）。link 用に class だけを公開する
   ------------------------------------------------------------------ */
export const btnPrimary =
  "inline-flex items-center border border-fg bg-fg px-5 py-2.5 text-small font-medium text-bg transition-colors hover:bg-transparent hover:text-fg";

export const btnGhost =
  "inline-flex items-center border border-border-strong px-5 py-2.5 text-small font-medium text-fg transition-colors hover:border-fg";
