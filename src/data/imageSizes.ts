/* 画像の実寸（レイアウトのずれ＝CLS を防ぐために next/image へ渡す）
   このファイルは `npm run sizes` で自動生成されます。手で編集しないこと。 */

export const imageSizes: Record<string, { w: number; h: number }> = {
  "/images/chess-ai/gameplay.png": { w: 1141, h: 691 },
  "/images/fluid-lab/earth-poster.webp": { w: 1280, h: 800 },
  "/images/fluid-lab/globe.webp": { w: 900, h: 900 },
  "/images/fluid-lab/hero-poster.webp": { w: 1280, h: 800 },
  "/images/fluid-lab/ink-poster.webp": { w: 1280, h: 800 },
  "/images/fluid-lab/water2d-poster.webp": { w: 1280, h: 800 },
  "/images/fluid-lab/water3d-poster.webp": { w: 1280, h: 800 },
  "/images/gold-rush/disc-poster.webp": { w: 1280, h: 800 },
  "/images/gold-rush/gameplay-poster.webp": { w: 1280, h: 800 },
  "/images/gold-rush/hero-poster.webp": { w: 1280, h: 800 },
  "/images/gold-rush/jpc-poster.webp": { w: 1280, h: 800 },
  "/images/gold-rush/slot-poster.webp": { w: 1280, h: 800 },
  "/images/keiba-ai/dashboard.png": { w: 1919, h: 908 },
  "/images/keiba-ai/ledger.png": { w: 1919, h: 903 },
  "/images/keiba-ai/model-explainer-poster.png": { w: 1920, h: 1080 },
  "/images/keiba-ai/models.png": { w: 1919, h: 909 },
  "/images/keiba-ai/race-detail.png": { w: 1919, h: 906 },
  "/images/keiba-ai/race-list.png": { w: 1919, h: 909 },
  "/images/michishirube/hero-poster.webp": { w: 1280, h: 800 },
  "/images/michishirube/plan-poster.webp": { w: 1280, h: 800 },
  "/images/michishirube/settings-poster.webp": { w: 1280, h: 800 },
  "/images/michishirube/stats-poster.webp": { w: 1280, h: 800 },
  "/images/michishirube/timer-poster.webp": { w: 1280, h: 800 },
  "/images/michishirube/today-poster.webp": { w: 1280, h: 800 },
  "/images/piano-studio/compose-poster.webp": { w: 1280, h: 800 },
  "/images/piano-studio/editor-poster.webp": { w: 1280, h: 800 },
  "/images/piano-studio/free-poster.webp": { w: 1280, h: 800 },
  "/images/piano-studio/hero-poster.webp": { w: 1280, h: 800 },
  "/images/piano-studio/learn-poster.webp": { w: 1280, h: 800 },
};

export function sizeOf(src: string) {
  return imageSizes[src] ?? { w: 1600, h: 900 };
}

export function isPortrait(src: string) {
  const { w, h } = sizeOf(src);
  return h > w;
}
