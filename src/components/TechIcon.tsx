import type { ReactNode } from "react";
import { iconFor, type GlyphName } from "@/data/techIcons";

/** ブランドロゴが無い技術に使う自前グリフ（線画） */
const glyphs: Record<GlyphName, ReactNode> = {
  code: (
    <>
      <path d="M8.5 5.5 3 12l5.5 6.5" />
      <path d="m15.5 5.5 5.5 6.5-5.5 6.5" />
    </>
  ),
  ai: (
    <>
      <rect x="7.5" y="7.5" width="9" height="9" rx="2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M8 2.5v3M16 2.5v3M8 18.5v3M16 18.5v3M2.5 8h3M2.5 16h3M18.5 8h3M18.5 16h3" />
    </>
  ),
  cube: (
    <>
      <path d="M12 2.5 3.5 7v10L12 21.5 20.5 17V7z" />
      <path d="m3.5 7 8.5 4.6L20.5 7M12 11.6v9.9" />
    </>
  ),
  audio: <path d="M3.5 10.5v3M8 7v10M12 3.5v17M16 7v10M20.5 10.5v3" />,
  chart: (
    <>
      <path d="M4 3.5v17h16" />
      <path d="M8 16.5v-4M12 16.5v-8M16 16.5v-6" />
    </>
  ),
  cloud: (
    <path d="M7 18.5h9.5a4.25 4.25 0 0 0 .6-8.45A6.25 6.25 0 0 0 5.2 11 3.75 3.75 0 0 0 7 18.5Z" />
  ),
  test: (
    <>
      <circle cx="12" cy="12" r="8.75" />
      <path d="m8.5 12.2 2.5 2.5 4.5-5" />
    </>
  ),
  mobile: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.75 18.25h2.5" />
    </>
  ),
  db: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3.25" />
      <path d="M4.5 6v12c0 1.8 3.4 3.25 7.5 3.25s7.5-1.45 7.5-3.25V6" />
      <path d="M4.5 12c0 1.8 3.4 3.25 7.5 3.25S19.5 13.8 19.5 12" />
    </>
  ),
};

export function TechIcon({
  label,
  className = "h-4 w-4",
}: {
  label: string;
  className?: string;
}) {
  const icon = iconFor(label);

  if (icon.kind === "brand") {
    return (
      <svg
        viewBox="0 0 24 24"
        role="img"
        aria-hidden
        className={`shrink-0 ${className}`}
        style={{ color: icon.color }}
        fill="currentColor"
      >
        <path d={icon.path} />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`shrink-0 text-muted ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyphs[icon.glyph]}
    </svg>
  );
}
