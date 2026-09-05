import Image from "next/image";
import Link from "next/link";
import { profile } from "@/data/profile";
import { sizeOf } from "@/data/imageSizes";
import { asset } from "@/lib/asset";
import { Container, Label, btnGhost, btnPrimary } from "@/components/ui";

/** ヒーロー右側の作品コラージュ（lg 以上でのみ表示） */
const collage = [
  {
    src: "/images/keiba-ai/race-detail.png",
    alt: "KEIBA AI のレース詳細画面",
    plate: "PL.01",
    className: "left-0 top-0 w-[78%]",
  },
  {
    src: "/images/fluid-lab/earth-poster.webp",
    alt: "Fluid Lab の地球モード",
    plate: "PL.02",
    className: "right-0 top-[31%] w-[70%]",
  },
  {
    src: "/images/gold-rush/gameplay-poster.webp",
    alt: "GOLD RUSH のプレイ画面",
    plate: "PL.03",
    className: "left-[5%] bottom-0 w-[64%]",
  },
];

function HeroCollage() {
  return (
    <div className="relative hidden aspect-square w-full lg:block" aria-hidden>
      {collage.map((c, i) => {
        const { w, h } = sizeOf(c.src);
        return (
          <div
            key={c.src}
            className={`absolute overflow-hidden border border-border-strong bg-surface shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)] ${c.className}`}
            style={{ zIndex: i + 1 }}
          >
            <Image
              src={asset(c.src)}
              alt={c.alt}
              width={w}
              height={h}
              sizes="420px"
              className="h-auto w-full"
            />
            <span className="absolute top-0 left-0 border-r border-b border-border-strong bg-bg/80 px-1.5 py-0.5 text-micro text-faint">
              {c.plate}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 氏名・所属・関心領域を仕様表のように並べる */
function SpecSheet() {
  const rows = [
    {
      label: "氏名",
      value: profile.nameJa
        ? `${profile.nameJa}（${profile.nameEn}）`
        : profile.nameEn,
    },
    {
      label: "所属",
      value: `${profile.affiliation}${profile.lab ? ` ${profile.lab}` : ""}`,
    },
    { label: "関心", value: profile.keywords.join(" / ") },
  ];

  return (
    <dl className="mt-8 divide-y divide-border">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid gap-1 py-2.5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-baseline sm:gap-4"
        >
          <dt>
            <Label className="text-faint">{row.label}</Label>
          </dt>
          <dd className="text-small text-muted sm:text-small-sm">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** ページ最上部の見せ場。About（強み・学歴・資格）と同じセクションに入る */
export function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
      <div className="pointer-events-none absolute inset-0 glow" aria-hidden />

      <Container className="relative pt-14 pb-14 sm:pt-20 sm:pb-20 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <h1 className="max-w-2xl text-display font-semibold sm:text-display-sm">
              {profile.tagline}
            </h1>

            <SpecSheet />

            <p className="mt-7 max-w-xl text-body text-muted sm:text-body-sm">
              {profile.intro}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/#works" className={btnPrimary}>
                作品を見る
              </Link>
              <a
                href={profile.github}
                target="_blank"
                rel="noreferrer"
                className={btnGhost}
              >
                GitHub
              </a>
            </div>
          </div>

          <HeroCollage />
        </div>

        <dl className="mt-14 grid max-w-xl grid-cols-3 divide-x divide-border sm:mt-16">
          {profile.stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 py-4 pl-4 first:pl-0 sm:pl-5">
              <dd className="text-h1 font-semibold text-fg sm:text-h1-sm">
                {s.value}
              </dd>
              <dt className="text-micro leading-snug text-faint">{s.label}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}
