import Image from "next/image";
import type { CSSProperties } from "react";
import Link from "next/link";
import { works, type Project } from "@/data/projects";
import { sizeOf } from "@/data/imageSizes";
import { asset } from "@/lib/asset";
import { Clip } from "@/components/Clip";
import { IndexNo, Plate, RAIL, RAIL_GRID, RailDot, Section } from "@/components/ui";
import { CategoryBadge, ProjectRowBody } from "@/components/parts";
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
      id={`work-${project.slug}`}
      data-category={project.category}
      data-reveal
      style={
        project.accent
          ? ({ "--work-accent": project.accent } as CSSProperties)
          : undefined
      }
      className="group scroll-mt-20 border-t border-border py-9 sm:py-12"
    >
      <div className={`grid gap-4 ${RAIL_GRID}`}>
        {/* 左段は通し番号だけ。カテゴリは見出しの上に置く（左に余白を作らないため） */}
        <div className={`${RAIL} md:pt-1`}>
          <span className="relative inline-block">
            <RailDot />
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
              /* 静止画だけの作品は、狭い画面で 16:10 に収めると中の文字が潰れて
                 「暗い四角」にしか見えない。枠を縦に詰めて左上に寄せ、実質の倍率を上げる */
              <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-surface-2 sm:aspect-[16/10]">
                {cover && (
                  <Image
                    src={asset(cover.src)}
                    alt={cover.alt}
                    width={size.w}
                    height={size.h}
                    sizes="(max-width: 1024px) 100vw, 500px"
                    className="h-full w-full object-cover object-left-top transition-transform duration-700 group-hover:scale-[1.035] sm:object-top"
                  />
                )}
              </div>
            )}
          </Link>

          <ProjectRowBody
            project={project}
            badge={<CategoryBadge category={project.category} />}
            cta="詳しく見る"
            dense
          />
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
