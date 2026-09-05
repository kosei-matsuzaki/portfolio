"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileNav({
  items,
  github,
}: {
  items: { href: string; index: string; label: string }[];
  github: string;
}) {
  const [open, setOpen] = useState(false);

  // メニューを開いている間は背面をスクロールさせない
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center border border-border-strong text-fg transition-colors hover:border-fg"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 8h16M4 16h16" />
          )}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-40 bg-bg/97 backdrop-blur-md">
          <nav className="flex flex-col divide-y divide-border border-b border-border">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-3 px-5 py-4 transition-colors hover:bg-surface"
              >
                <span className="text-micro text-faint">
                  {item.index}
                </span>
                <span className="text-body text-fg">
                  {item.label}
                </span>
              </Link>
            ))}
            <a
              href={github}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="px-5 py-4 text-small text-muted"
            >
              GitHub
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
