import Link from "next/link";
import { profile } from "@/data/profile";
import { GUTTER } from "@/components/ui";
import { MobileNav } from "@/components/MobileNav";

/** 番号はトップページのセクション（§01〜）と対応させている */
export const navItems = [
  { href: "/#works", index: "01", label: "Works" },
  { href: "/#research", index: "02", label: "Research" },
  { href: "/#internship", index: "03", label: "Internship" },
  { href: "/#skills", index: "04", label: "Skills" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-md">
      <div
        className={`mx-auto flex h-14 w-full max-w-[1140px] items-center justify-between gap-6 sm:h-16 ${GUTTER}`}
      >
        <Link
          href="/"
          className="font-mono text-[11px] tracking-[0.2em] whitespace-nowrap text-fg uppercase transition-colors hover:text-accent"
        >
          {profile.nameEn}
        </Link>

        <nav className="hidden items-center gap-4 md:flex lg:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-baseline gap-1.5 font-mono text-[11px] tracking-[0.14em] text-muted uppercase transition-colors hover:text-fg"
            >
              <span className="hidden text-[9px] text-faint transition-colors group-hover:text-accent lg:inline">
                {item.index}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <a
          href={profile.github}
          target="_blank"
          rel="noreferrer"
          className="hidden border border-border-strong px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-muted uppercase transition-colors hover:border-accent hover:text-accent md:inline-flex"
        >
          GitHub
        </a>

        <MobileNav items={navItems} github={profile.github} />
      </div>
    </header>
  );
}
