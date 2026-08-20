"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { categoryMeta, type Category } from "@/data/projects";
import { Label } from "@/components/ui";

type Key = Category | "all";

const filters: { key: Key; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "ai", label: categoryMeta.ai.label },
  { key: "game", label: categoryMeta.game.label },
  { key: "app", label: categoryMeta.app.label },
];

const FilterContext = createContext<{
  active: Key;
  setActive: Dispatch<SetStateAction<Key>>;
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
 */
export function WorksFilterProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Key>("all");
  return (
    <FilterContext.Provider value={{ active, setActive }}>
      {children}
    </FilterContext.Provider>
  );
}

/** 操作 UI。見出しのリード文の下に、角丸のボタンを横に並べる */
export function WorksFilterControls() {
  const { active, setActive } = useFilter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label className="mr-1 text-faint">Filter</Label>
      {filters.map((f) => {
        const on = active === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => setActive(f.key)}
            aria-pressed={on}
            className={`rounded-full border px-3.5 py-1 font-mono text-[11px] tracking-[0.06em] whitespace-nowrap transition-colors ${
              on
                ? "border-accent bg-accent/10 text-accent"
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
