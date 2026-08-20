"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { sizeOf } from "@/data/imageSizes";
import { asset } from "@/lib/asset";

/** OS の「視差効果を減らす」設定を購読する（SSR では false 扱い） */
function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * 静止画（ポスター）の上に動画を重ねて再生する図版。
 *
 * ・動画の読み込みは「実際に再生する直前」まで行わない（`src` を後から差す）ので、
 *   ページを開いただけで数 MB を落とすことはない
 * ・`playOn="inview"` は画面に入ったら再生・出たら停止（詳細ページ用）
 * ・`playOn="hover"`  はホバー／フォーカス中だけ再生（一覧用。触るまで通信しない）
 * ・prefers-reduced-motion: reduce のときは自動再生せず、再生ボタンを出す
 * ・動画が無い（video 未指定）ときは、ただの静止画として振る舞う
 */
export function Clip({
  poster,
  video,
  alt,
  playOn = "inview",
  priority = false,
  className = "",
  fit = "cover",
  shape = "flat",
  sizes = "(max-width: 768px) 100vw, 900px",
}: {
  poster: string;
  video?: string;
  alt: string;
  playOn?: "inview" | "hover";
  priority?: boolean;
  className?: string;
  /** 枠と図版の比率が違うとき、切り取る（cover）か収める（contain）か */
  fit?: "cover" | "contain";
  /** device にするとスマホ端末のように角を丸めて縁を立たせる */
  shape?: "flat" | "device";
  sizes?: string;
}) {
  const { w, h } = sizeOf(poster);
  // クラス名は動的に組み立てない（Tailwind が拾えなくなる）
  const objectFit = fit === "contain" ? "object-contain" : "object-cover";
  const frame =
    shape === "device"
      ? "rounded-[1.6rem] border-border-strong shadow-[0_30px_70px_-30px_rgba(0,0,0,0.95)]"
      : "border-border";
  const reduced = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const wanted = useRef(false);

  /** 再生要求。初回はここで初めて動画の src を差す */
  const request = useCallback(
    (on: boolean) => {
      wanted.current = on;
      if (on && video) setSrc(asset(video));
      const el = videoRef.current;
      if (!el) return;
      if (on) {
        el.play()
          .then(() => setPlaying(true))
          .catch(() => {});
      } else {
        el.pause();
        setPlaying(false);
      }
    },
    [video],
  );

  // 画面に入ったら再生・出たら停止
  useEffect(() => {
    if (!video || playOn !== "inview" || reduced) return;
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      ([entry]) => request(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [video, playOn, reduced, request]);

  // src を差した直後は、要素が生成されてから再生する
  useEffect(() => {
    if (!src || !wanted.current) return;
    videoRef.current
      ?.play()
      .then(() => setPlaying(true))
      .catch(() => {});
  }, [src]);

  const hoverProps =
    video && playOn === "hover" && !reduced
      ? {
          onMouseEnter: () => request(true),
          onMouseLeave: () => request(false),
          onFocus: () => request(true),
          onBlur: () => request(false),
        }
      : {};

  return (
    <div
      ref={hostRef}
      {...hoverProps}
      className={`relative overflow-hidden border bg-surface-2 ${frame} ${className}`}
    >
      <Image
        src={poster}
        alt={alt}
        width={w}
        height={h}
        priority={priority}
        sizes={sizes}
        className={`h-full w-full ${objectFit}`}
      />

      {video && (
        <video
          ref={videoRef}
          src={src ?? undefined}
          poster={asset(poster)}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          tabIndex={-1}
          className={`absolute inset-0 h-full w-full ${objectFit} transition-opacity duration-300 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* 一覧では「触れば動く」ことが分からないので、小さく合図を出す */}
      {video && playOn === "hover" && !reduced && !playing && (
        <span className="pointer-events-none absolute right-2 bottom-2 border border-border-strong bg-bg/80 px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-faint backdrop-blur-sm">
          ▶ 触れると動く
        </span>
      )}

      {/* 動きを減らす設定のときは、自分の操作で再生できるようにする */}
      {video && reduced && (
        <button
          type="button"
          onClick={() => request(!playing)}
          aria-label={playing ? "動画を停止" : "動画を再生"}
          className="absolute right-2 bottom-2 border border-border-strong bg-bg/85 px-2.5 py-1 font-mono text-[11px] tracking-[0.1em] text-fg backdrop-blur-sm transition-colors hover:border-accent hover:text-accent"
        >
          {playing ? "■ 停止" : "▶ 再生"}
        </button>
      )}
    </div>
  );
}
