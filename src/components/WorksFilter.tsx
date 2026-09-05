"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { categoryMeta, works, type Category } from "@/data/projects";

const STORE_KEY = "works-filter";

type Key = Category | "all";

/* 分類は works から作る。作品が 1 件も無い分類はボタンに出ないので、
   絞り込んで 0 件になる画面は起きない（docs/design.md「状態」） */
const filters: { key: Key; label: string }[] = [
  { key: "all", label: "すべて" },
  ...(["ai", "game", "app", "research"] as const)
    .filter((c) => works.some((w) => w.category === c))
    .map((c) => ({ key: c as Key, label: categoryMeta[c].label })),
];

/**
 * 絞り込みの状態は React の外（sessionStorage）に置く。
 * 作品の詳細ページから戻ったときに選択が消えないようにするため。
 *
 * 最初に読むときだけ、戻り先の #work-<slug> と突き合わせる。
 * その作品が隠れる絞り込みなら "all" に戻す（着地した先が空になるのを防ぐ）。
 */
let current: Key | null = null;
const listeners = new Set<() => void>();

function read(): Key {
  if (current !== null) return current;
  let saved: Key = "all";
  try {
    const v = sessionStorage.getItem(STORE_KEY);
    if (v && filters.some((f) => f.key === v)) saved = v as Key;
  } catch {
    /* ストレージが使えない環境では絞り込みを覚えないだけ */
  }
  const slug = location.hash.match(/^#work-(.+)$/)?.[1];
  const target = slug && works.find((w) => w.slug === slug);
  if (target && saved !== "all" && target.category !== saved) saved = "all";
  current = saved;
  return current;
}

function write(next: Key) {
  current = next;
  try {
    sessionStorage.setItem(STORE_KEY, next);
  } catch {
    /* 覚えられなくても絞り込み自体は動く */
  }
  for (const fn of listeners) fn();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

const FilterContext = createContext<{
  active: Key;
  setActive: (next: Key) => void;
} | null>(null);

function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("WorksFilterProvider の外で使われています");
  return ctx;
}

/**
 * 絞り込みの状態だけをクライアント側で持つ。
 * 操作 UI（見出しの左段）と一覧（本文）は離れた場所に置きたいので、
 * 状態は context で共有し、children はサーバー描画のまま通す。
 *
 * 作品の詳細ページから戻ったときに絞り込みが消えないよう sessionStorage に覚える。
 * ただし戻り先が #work-<slug> のとき、その作品が隠れる絞り込みだったら "all" に戻す
 * （そうしないと、戻った先に何も無い画面に着地する）。
 */
export function WorksFilterProvider({ children }: { children: ReactNode }) {
  const active = useSyncExternalStore(subscribe, read, () => "all" as Key);

  return (
    <FilterContext.Provider value={{ active, setActive: write }}>
      {children}
    </FilterContext.Provider>
  );
}

/** 操作 UI。見出しのリード文の下に、直角のボタンを横に並べる */
export function WorksFilterControls() {
  const { active, setActive } = useFilter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((f) => {
        const on = active === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => setActive(f.key)}
            aria-pressed={on}
            className={`border px-3.5 py-1 text-micro whitespace-nowrap transition-colors ${
              on
                ? "border-fg bg-fg/10 text-fg"
                : "border-border text-muted hover:border-border-strong hover:text-fg"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

/** 一覧。表示・非表示は CSS 側（globals.css）が data 属性を見て切り替える */
export function WorksFilterList({ children }: { children: ReactNode }) {
  const { active } = useFilter();
  return (
    <div data-works-filter={active} className="flex flex-col">
      {children}
    </div>
  );
}
