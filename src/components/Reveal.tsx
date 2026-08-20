"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * スクロールで `data-reveal` の付いた要素をフェードインさせる。
 *
 * ・初期状態を隠すのは `.motion-ready`（= このコンポーネントが付ける）配下だけなので、
 *   JS が動かない環境では何も隠れない
 * ・prefers-reduced-motion: reduce のときは class を付けずに何もしない
 * ・ページ遷移のたびに監視をやり直す。これをしないと、詳細ページから一覧へ戻ったときに
 *   新しく描画された要素が誰にも監視されず、opacity:0 のまま表示されなくなる
 */
export function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    root.classList.add("motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      // 画面下端に少し入った時点で開始し、下すぎる位置での発火は避ける
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    const observe = () => {
      for (const el of document.querySelectorAll("[data-reveal]:not(.is-in)")) {
        observer.observe(el);
      }
    };
    observe();

    // 遷移直後に要素が差し替わる場合に備えて、DOM の追加も拾う
    const mutations = new MutationObserver(observe);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
      root.classList.remove("motion-ready");
    };
  }, [pathname]);

  return null;
}
