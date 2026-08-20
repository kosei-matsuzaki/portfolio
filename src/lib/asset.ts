/** basePath（GitHub Pages のサブディレクトリ配信）を考慮した public/ 配下のパス。
 *
 *  next/link は basePath を自動で付けるが、**next/image は `unoptimized` だと付けない**
 *  （最適化サーバを通さず src をそのまま出すため）。素の <img> / <video> も同様。
 *  そのため public/ 配下を指すパスは、Image の src も含めて必ずこれを通すこと。
 *  `sizeOf()` に渡すキーは basePath なしの生パスのままにする。 */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path}`;
}
