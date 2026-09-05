import type { Metadata } from "next";
import {
  JetBrains_Mono,
  Zen_Kaku_Gothic_New,
  Zen_Old_Mincho,
} from "next/font/google";
import "./globals.css";
import { profile } from "@/data/profile";
import { Reveal } from "@/components/Reveal";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/* next/font はビルド時にフォントを取得して自前で配信する（外部リクエストなし）。
   和文は unicode-range で分割配信されるので、実際に使う字だけが読み込まれる。
   subsets は「先読みする範囲」の指定で、和文の面は必要になった時点で取りに行く。 */
const bodyFont = Zen_Kaku_Gothic_New({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-src",
});

const headingFont = Zen_Old_Mincho({
  weight: ["600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif-src",
});

/* インラインコード専用。ラベルにも数値にも使わない（docs/design.md） */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-src",
});

export const metadata: Metadata = {
  title: {
    default: `${profile.nameEn} — ポートフォリオ`,
    template: `%s | ${profile.nameEn}`,
  },
  description: profile.intro,
  openGraph: {
    title: `${profile.nameEn} — ポートフォリオ`,
    description: profile.tagline,
    type: "website",
    locale: "ja_JP",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`h-full ${bodyFont.variable} ${headingFont.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <Reveal />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
