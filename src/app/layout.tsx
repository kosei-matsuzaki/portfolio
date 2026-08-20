import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { profile } from "@/data/profile";
import { Reveal } from "@/components/Reveal";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

/* next/font はビルド時にフォントを取得して自前で配信する（外部リクエストなし）。
   日本語はフォールバック（Hiragino / Noto Sans JP など）に任せる。 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
      className={`h-full ${inter.variable} ${jetbrainsMono.variable}`}
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
