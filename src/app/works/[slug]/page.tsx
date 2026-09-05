import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import {
  getProject,
  linkMeta,
  projects,
  type Section as SectionData,
} from "@/data/projects";
import { isPortrait } from "@/data/imageSizes";
import { asset } from "@/lib/asset";
import { Clip } from "@/components/Clip";
import {
  Container,
  IndexNo,
  Label,
  MetricList,
  Plate,
  RichText,
  btnGhost,
  btnPrimary,
} from "@/components/ui";
import { CategoryBadge, Figure, Shot, TechChips } from "@/components/parts";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
  };
}

function SectionBlock({
  section,
  no,
}: {
  section: SectionData;
  no: string;
}) {
  const hasMedia = section.bullets?.some((b) => b.media) ?? false;

  return (
    <section
      data-reveal
      className="scroll-mt-24 border-t border-border py-9 first:border-t-0 first:pt-0 sm:py-12"
    >
      <div className="flex items-baseline gap-3">
        <IndexNo>§{no}</IndexNo>
        <h2 className="text-h2 font-semibold sm:text-h2-sm">
          {section.heading}
        </h2>
      </div>

      {section.body?.map((p) => (
        <p
          key={p}
          className="mt-4 text-body text-muted sm:mt-5 sm:text-body-sm"
        >
          <RichText>{p}</RichText>
        </p>
      ))}

      {/* 図版つきの箇条書き: 図と説明を左右交互に並べる */}
      {section.bullets && hasMedia && (
        /* 図版は読み物カラムより少しはみ出させて大きく見せる */
        <ul className="mt-7 space-y-8 sm:space-y-10 lg:-mx-16 xl:-mx-[7.5rem]">
          {section.bullets.map((b, i) => (
            <li
              key={b.text}
              className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] sm:items-center sm:gap-7"
            >
              {b.media && (
                <figure
                  className={[
                    i % 2 === 1 ? "sm:order-2" : "",
                    b.media.portrait ? "mx-auto w-[min(100%,260px)]" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <Clip
                    poster={b.media.poster}
                    video={b.media.video}
                    alt={b.media.alt}
                    shape={b.media.portrait ? "device" : "flat"}
                    sizes={b.media.portrait ? "260px" : "(max-width: 640px) 100vw, 460px"}
                    className={
                      b.media.portrait ? "aspect-[390/844] w-full" : "aspect-[16/10] w-full"
                    }
                  />
                  {b.media.caption && (
                    <figcaption className="mt-2.5 text-micro text-faint">
                      {b.media.caption}
                    </figcaption>
                  )}
                </figure>
              )}
              <div className={i % 2 === 1 ? "sm:order-1" : undefined}>
                {b.title && (
                  <p className="text-small font-medium text-fg sm:text-small-sm">
                    {b.title}
                  </p>
                )}
                <p
                  className={`text-small text-muted sm:text-small-sm ${
                    b.title ? "mt-2" : ""
                  }`}
                >
                  <RichText>{b.text}</RichText>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 左端に縦線を通し、項目ごとに ● を置く（線はリスト全体で連続させる） */}
      {section.bullets && !hasMedia && (
        <ul className="mt-6 border-l border-border pl-6">
          {section.bullets.map((b) => (
            <li key={b.text} className="relative pb-7 last:pb-0">
              <span className="absolute -left-[28px] top-[7px] h-[7px] w-[7px] rounded-full bg-[color:var(--work-accent)]" />
              {b.title && (
                <p className="text-small font-medium text-fg sm:text-small-sm">
                  {b.title}
                </p>
              )}
              <p
                className={`text-small text-muted sm:text-small-sm ${
                  b.title ? "mt-1.5" : ""
                }`}
              >
                <RichText>{b.text}</RichText>
              </p>
            </li>
          ))}
        </ul>
      )}

      {section.table && (
        <div className="mt-6">
          {/* 狭い画面では表が画面幅に収まらない。-mx-5 で端まで届くので、
              影が無いと「表はここで終わり」に見えて右の列が読まれない */}
          <div className="relative">
            <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[420px] border-collapse text-small sm:text-small-sm">
                <thead>
                  <tr className="border-b border-border-strong">
                    {section.table.headers.map((h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2.5 text-micro font-medium text-faint ${
                          i === 0 ? "text-left" : "text-right"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, ri) => (
                    <tr
                      key={row[0]}
                      className={`border-b border-border ${
                        ri === 0 ? "bg-surface font-medium text-fg" : "text-muted"
                      }`}
                    >
                      {row.map((cell, i) => (
                        <td
                          key={`${row[0]}-${i}`}
                          className={`px-3 py-2.5 ${
                            i === 0 ? "text-left" : "tnum text-right"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-l from-bg to-transparent sm:hidden"
            />
          </div>
          {section.table.caption && (
            <p className="mt-3 text-micro text-faint">{section.table.caption}</p>
          )}
        </div>
      )}

      {section.figure && <Figure {...section.figure} />}
    </section>
  );
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const portraitShots = project.shots?.length
    ? isPortrait(project.shots[0].src)
    : false;

  return (
    <article
      style={
        project.accent
          ? ({ "--work-accent": project.accent } as CSSProperties)
          : undefined
      }
      className="pb-20 sm:pb-28"
    >
      {/* ------------------------------------------------ ヘッダ */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
        <Container width="read" className="relative py-9 sm:py-14">
          <Link
            href={`/#work-${project.slug}`}
            className="text-small text-faint underline decoration-border-strong underline-offset-4 transition-colors hover:text-fg"
          >
            ← 一覧に戻る
          </Link>

          <div className="mt-6">
            <CategoryBadge category={project.category} />
          </div>

          <h1 className="mt-4 text-display font-semibold sm:text-display-sm">
            {project.title}
          </h1>
          {/* 作品の色はここに 1 本だけ出す（docs/design.md「作品の色」） */}
          <div
            aria-hidden
            className="mt-4 h-0.5 w-16 bg-[color:var(--work-accent)]"
          />
          <p className="mt-3 text-body text-muted sm:text-body-sm">
            {project.subtitle}
          </p>

          {project.links.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-3">
              {project.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className={linkMeta[l.kind].primary ? btnPrimary : btnGhost}
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}

        </Container>
      </header>

      {/* ------------------------------------------------ 本文（左右の余白は全ブロック共通） */}
      <Container width="read" className="pt-8 sm:pt-12">
        {/* 主図版は本文より先に置く（何が動くのかを最初に見せる） */}
        {project.media?.portrait ? (
          /* スマホの縦長画面は、方眼の台に端末を立てて説明を横に添える
             （16:10 に収めると中身が読めず、そのまま置くと横が空きすぎるため） */
          <figure>
            <Plate className="px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col items-center gap-7 sm:flex-row sm:justify-center sm:gap-10">
                <Clip
                  poster={project.media.poster}
                  video={project.media.video}
                  alt={project.media.alt}
                  priority
                  shape="device"
                  sizes="300px"
                  className="aspect-[390/844] w-[min(100%,290px)] shrink-0"
                />
                <figcaption className="max-w-[17rem] border-border sm:border-l sm:pl-7">
                  <Label className="text-faint">Fig. 01</Label>
                  {project.media.caption && (
                    <p className="mt-3 text-small text-muted sm:text-small-sm">
                      {project.media.caption}
                    </p>
                  )}
                </figcaption>
              </div>
            </Plate>
          </figure>
        ) : project.media ? (
          <figure>
            <Clip
              poster={project.media.poster}
              video={project.media.video}
              alt={project.media.alt}
              priority
              className="aspect-[16/10] w-full"
            />
            {project.media.caption && (
              <figcaption className="mt-3 text-small text-faint sm:text-small-sm">
                {project.media.caption}
              </figcaption>
            )}
          </figure>
        ) : (
          project.cover && <Shot {...project.cover} plate="FIG. 01" priority />
        )}

        {project.note && (
          <p className="mt-6 border-l-2 border-border-strong bg-surface px-4 py-3 text-micro text-faint sm:text-small">
            <RichText>{project.note}</RichText>
          </p>
        )}

        {/* 期間・体制・使用技術の仕様表 */}
        <dl className="mt-8 divide-y divide-border sm:mt-10">
          <div className="grid gap-1 py-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-4">
            <dt>
              <Label>期間</Label>
            </dt>
            <dd className="text-small text-fg sm:text-small-sm">{project.period}</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-4">
            <dt>
              <Label>体制</Label>
            </dt>
            <dd className="text-small text-fg sm:text-small-sm">
              {project.role}
            </dd>
          </div>
          <div className="grid gap-2 py-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-4">
            <dt>
              <Label>技術</Label>
            </dt>
            <dd>
              <TechChips items={project.stack} />
            </dd>
          </div>
        </dl>

        <p className="mt-8 text-body text-fg sm:mt-10 sm:text-body-sm">
          <RichText>{project.summary}</RichText>
        </p>

        <MetricList metrics={project.metrics} className="mt-8" />

        <ul className="mt-6 space-y-2.5">
          {project.highlights.map((h) => (
            <li
              key={h}
              className="flex gap-2.5 text-small text-muted sm:text-small-sm"
            >
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[color:var(--work-accent)]" />
              <span>
                <RichText>{h}</RichText>
              </span>
            </li>
          ))}
        </ul>

        {project.video && (
          <figure className="mt-10 sm:mt-12">
            <video
              controls
              preload="none"
              poster={asset(project.video.poster)}
              className="w-full border border-border bg-black"
            >
              <source src={asset(project.video.src)} type="video/mp4" />
            </video>
            <figcaption className="mt-3 text-micro text-faint sm:text-small">
              {project.video.caption}
            </figcaption>
          </figure>
        )}

        <div className="mt-12 sm:mt-16">
          {project.sections.map((s, i) => (
            <SectionBlock
              key={s.heading}
              section={s}
              no={String(i + 1).padStart(2, "0")}
            />
          ))}

          {project.aiUsage && (
            <section data-reveal className="border-t border-border py-9 sm:py-12">
              <div className="flex items-baseline gap-3">
                <IndexNo>
                  §{String(project.sections.length + 1).padStart(2, "0")}
                </IndexNo>
                <h2 className="text-h2 font-semibold sm:text-h2-sm">
                  生成 AI の活用について
                </h2>
              </div>
              <p className="mt-4 text-body text-muted sm:mt-5 sm:text-body-sm">
                本プロジェクトは AI コーディングエージェント（Claude
                Code）を併用して開発しました。役割分担と、任せきりにしないための仕組みは次のとおりです。
              </p>
              <ul className="mt-5 space-y-2.5">
                {project.aiUsage.map((a) => (
                  <li
                    key={a}
                    className="flex gap-2.5 text-small text-muted sm:text-small-sm"
                  >
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[color:var(--work-accent)]" />
                    <span>
                      <RichText>{a}</RichText>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {project.shots && project.shots.length > 0 && (
          <div className="border-t border-border pt-9 sm:pt-12">
            <div className="flex items-baseline gap-3">
              <IndexNo>Fig</IndexNo>
              <h2 className="text-h2 font-semibold sm:text-h2-sm">
                画面
              </h2>
            </div>
            <div
              className={
                portraitShots
                  ? "mt-6 grid grid-cols-2 gap-4 sm:mt-8 sm:grid-cols-4 sm:gap-5"
                  : "mt-6 grid gap-8 sm:mt-8 sm:grid-cols-2"
              }
            >
              {project.shots.map((s, i) => (
                <Shot
                  key={s.src}
                  {...s}
                  plate={`FIG. ${String(i + (project.cover ? 2 : 1)).padStart(2, "0")}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 border-t border-border pt-7 sm:mt-16">
          <Link
            href={`/#work-${project.slug}`}
            className="text-small font-medium text-fg underline decoration-[color:var(--work-accent)] decoration-2 underline-offset-4 sm:text-small-sm"
          >
            ← ほかの作品を見る
          </Link>
        </div>
      </Container>
    </article>
  );
}
