import Image from "next/image";
import Link from "next/link";
import { categoryMeta, shortRole, works, type Project } from "@/data/projects";
import { sizeOf } from "@/data/imageSizes";
import { asset } from "@/lib/asset";
import { Clip } from "@/components/Clip";
import {
  CategoryBadge,
  IndexNo,
  MetaLine,
  Plate,
  RAIL,
  RAIL_GRID,
  RailDot,
  RichText,
  Section,
  TechIcons,
} from "@/components/ui";
import {
  WorksFilterControls,
  WorksFilterList,
  WorksFilterProvider,
} from "@/components/WorksFilter";

/**
 * 作品 1 件 = 図版 + 記述の 1 行（通し番号つきの目録として並べる）。
 * 見出しの付け方（左段に通し番号とカテゴリ、右段に本文）は
 * Research / Internship の行（sections.tsx の WideRow）と揃えている。
 */
function WorkRow({ project, no }: { project: Project; no: string }) {
  const media = project.media;
  const cover = project.cover;
  const size = cover ? sizeOf(cover.src) : { w: 1600, h: 900 };
  const href = `/works/${project.slug}/`;

  return (
    <article
      data-category={project.category}
      data-reveal
      className="group border-t border-border py-9 sm:py-12"
    >
      <div className={`grid gap-4 ${RAIL_GRID}`}>
        {/* 左段は通し番号だけ。カテゴリは見出しの上に置く（左に余白を作らないため） */}
        <div className={`${RAIL} md:pt-1`}>
          <span className="relative inline-block">
            <RailDot className={categoryMeta[project.category].dot} />
            <IndexNo>{no}</IndexNo>
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-8">
          <Link href={href} className="block self-start">
            {media?.portrait ? (
              /* スマホの縦長画面は、方眼の台に端末を立てて他のカードと高さを揃える */
              <Plate className="aspect-square w-full">
                <Clip
                  poster={media.poster}
                  video={media.video}
                  alt={media.alt}
                  playOn="hover"
                  shape="device"
                  sizes="(max-width: 1024px) 60vw, 240px"
                  className="aspect-[390/844] h-[94%] w-auto"
                />
              </Plate>
            ) : media ? (
              /* 動画がある作品は、ホバー（またはフォーカス）中だけ再生する */
              <Clip
                poster={media.poster}
                video={media.video}
                alt={media.alt}
                playOn="hover"
                sizes="(max-width: 1024px) 100vw, 500px"
                className="aspect-[16/10] w-full"
              />
            ) : (
              <div className="relative aspect-[16/10] w-full overflow-hidden border border-border bg-surface-2">
                {cover && (
                  <Image
                    src={asset(cover.src)}
                    alt={cover.alt}
                    width={size.w}
                    height={size.h}
                    sizes="(max-width: 1024px) 100vw, 500px"
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.035]"
                  />
                )}
              </div>
            )}
          </Link>

          <div className="flex flex-col">
            <CategoryBadge category={project.category} />
            <h3 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
              <Link href={href} className="transition-colors hover:text-accent">
                {project.title}
              </Link>
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted sm:text-[14px]">
              {project.subtitle}
            </p>

            <MetaLine
              className="mt-4"
              items={[
                { label: "期間", value: project.period },
                { label: "体制", value: shortRole(project.role) },
              ]}
            />

            <p className="mt-4 line-clamp-4 text-[13px] leading-relaxed text-faint sm:text-[14px]">
              <RichText>{project.summary}</RichText>
            </p>

            <TechIcons items={project.stack} max={6} className="mt-5" />

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                href={href}
                className="font-mono text-[12px] font-bold tracking-[0.1em] text-accent transition-opacity hover:opacity-80"
              >
                詳しく見る →
              </Link>
              {project.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] tracking-[0.1em] text-faint transition-colors hover:text-fg"
                >
                  {l.kind === "demo" ? "デモ ↗" : "GitHub ↗"}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function WorksSection() {
  return (
    <WorksFilterProvider>
      <Section
        id="works"
        index="01"
        eyebrow="Works"
        title="個人開発の作品"
        lead="機械学習・グラフィックス・ゲーム・モバイルアプリまで、作りたいものに合わせて技術を選んで作ってきました。"
        aside={<WorksFilterControls />}
      >
        <WorksFilterList>
          {works.map((p, i) => (
            <WorkRow
              key={p.slug}
              project={p}
              no={String(i + 1).padStart(2, "0")}
            />
          ))}
        </WorksFilterList>
      </Section>
    </WorksFilterProvider>
  );
}
