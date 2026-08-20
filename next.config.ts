import type { NextConfig } from "next";

// GitHub Pages で `https://<user>.github.io/<repo>/` に置く場合は
// リポジトリ名を basePath に指定する（例: NEXT_PUBLIC_BASE_PATH=/portfolio）。
// ユーザーページ（<user>.github.io）や独自ドメインの場合は空のままでよい。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // 静的書き出し（out/ に HTML/CSS/JS を出力）
  output: "export",
  // /works/keiba-ai → /works/keiba-ai/index.html （静的ホスティングで 404 を防ぐ）
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    // 画像最適化サーバを使わない（静的書き出しに必須）
    unoptimized: true,
  },
};

export default nextConfig;
