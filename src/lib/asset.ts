/** basePath（GitHub Pages のサブディレクトリ配信）を考慮した public/ 配下のパス。
 *  next/image や next/link は自動で basePath を付けるが、
 *  素の <img> / <video> は付かないのでこのヘルパを通す。 */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path}`;
}
