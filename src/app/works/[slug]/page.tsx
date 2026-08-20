import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProject,
  projects,
  type Section as SectionData,
} from "@/data/projects";
import { isPortrait } from "@/data/imageSizes";
import { asset } from "@/lib/asset";
import { Clip } from "@/components/Clip";
import {
  CategoryBadge,
  Container,
  Figure,
  IndexNo,
  Label,
  MetricList,
  Plate,
  RichText,
  Shot,
  TechChips,
  btnGhost,
  btnPrimary,
} from "@/components/ui";

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
        <h2 className="text-lg font-bold tracking-tight sm:text-2xl">
          {section.heading}
        </h2>
      </div>

      {section.body?.map((p) => (
        <p
          key={p}
          className="mt-4 text-[14px] leading-[1.95] text-muted sm:mt-5 sm:text-[15px]"
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
                    <figcaption className="mt-2.5 text-[12px] leading-relaxed text-faint">
                      {b.media.caption}
                    </figcaption>
                  )}
                </figure>
              )}
              <div className={i % 2 === 1 ? "sm:order-1" : undefined}>
                {b.title && (
                  <p className="text-[14px] font-bold text-fg sm:text-[15px]">
                    {b.title}
                  </p>
                )}
                <p
                  className={`text-[13px] leading-relaxed text-muted sm:text-[14px] ${
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
              <span className="absolute -left-[28px] top-[7px] h-[7px] w-[7px] rounded-full bg-accent" />
              {b.title && (
                <p className="text-[13px] font-semibold text-fg sm:text-[14px]">
                  {b.title}
                </p>
              )}
              <p
                className={`text-[13px] leading-relaxed text-muted sm:text-[14px] ${
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
        <div className="mt-6 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-strong">
                {section.table.headers.map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 py-2.5 font-mono text-[11px] font-semibold tracking-[0.1em] text-faint ${
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
                    ri === 0 ? "bg-accent/5 font-semibold text-fg" : "text-muted"
                  }`}
                >
                  {row.map((cell, i) => (
                    <td
                      key={`${row[0]}-${i}`}
                      className={`px-3 py-2.5 ${
                        i === 0 ? "text-left" : "tnum text-right font-mono"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {section.table.caption && (
            <p className="mt-3 text-[12px] leading-relaxed text-faint">
              {section.table.caption}
            </p>
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
    <article className="pb-20 sm:pb-28">
      {/* ------------------------------------------------ ヘッダ */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
        <Container width="read" className="relative py-9 sm:py-14">
          <Link
            href="/#works"
            className="font-mono text-[11px] tracking-[0.14em] text-faint transition-colors hover:text-accent"
          >
            ← 一覧に戻る
          </Link>

          <div className="mt-6">
            <CategoryBadge category={project.category} />
          </div>

          <h1 className="mt-4 text-[1.6rem] leading-[1.35] font-bold tracking-tight sm:text-4xl">
            {project.title}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted sm:text-lg">
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
                  className={l.kind === "demo" ? btnPrimary : btnGhost}
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
                    <p className="mt-3 text-[13px] leading-relaxed text-muted">
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
              <figcaption className="mt-3 text-[13px] leading-relaxed text-faint">
                {project.media.caption}
              </figcaption>
            )}
          </figure>
        ) : (
          project.cover && <Shot {...project.cover} plate="FIG. 01" priority />
        )}

        {project.note && (
          <p className="mt-6 border-l-2 border-border-strong bg-surface px-4 py-3 text-[12px] leading-relaxed text-faint sm:text-[13px]">
            <RichText>{project.note}</RichText>
          </p>
        )}

        {/* 期間・体制・使用技術の仕様表 */}
        <dl className="mt-8 divide-y divide-border sm:mt-10">
          <div className="grid gap-1 py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4">
            <dt>
              <Label className="text-faint">Period</Label>
            </dt>
            <dd className="text-[13px] text-fg sm:text-[14px]">{project.period}</dd>
          </div>
          <div className="grid gap-1 py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4">
            <dt>
              <Label className="text-faint">Role</Label>
            </dt>
            <dd className="text-[13px] leading-relaxed text-fg sm:text-[14px]">
              {project.role}
            </dd>
          </div>
          <div className="grid gap-2 py-3 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-4">
            <dt>
              <Label className="text-faint">Stack</Label>
            </dt>
            <dd>
              <TechChips items={project.stack} />
            </dd>
          </div>
        </dl>

        <p className="mt-8 text-[14px] leading-[1.95] text-fg sm:mt-10 sm:text-[15px]">
          <RichText>{project.summary}</RichText>
        </p>

        <MetricList metrics={project.metrics} className="mt-8" />

        <ul className="mt-6 space-y-2.5">
          {project.highlights.map((h) => (
            <li
              key={h}
              className="flex gap-2.5 text-[13px] leading-relaxed text-muted sm:text-[14px]"
            >
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />
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
            <figcaption className="mt-3 text-[12px] leading-relaxed text-faint sm:text-[13px]">
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
                <h2 className="text-lg font-bold tracking-tight sm:text-2xl">
                  生成 AI の活用について
                </h2>
              </div>
              <p className="mt-4 text-[14px] leading-[1.95] text-muted sm:mt-5 sm:text-[15px]">
                本プロジェクトは AI コーディングエージェント（Claude
                Code）を併用して開発しました。役割分担と、任せきりにしないための仕組みは次のとおりです。
              </p>
              <ul className="mt-5 space-y-2.5">
                {project.aiUsage.map((a) => (
                  <li
                    key={a}
                    className="flex gap-2.5 text-[13px] leading-relaxed text-muted sm:text-[14px]"
                  >
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />
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
              <h2 className="text-lg font-bold tracking-tight sm:text-2xl">
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
            href="/#works"
            className="font-mono text-[12px] font-bold tracking-[0.1em] text-accent transition-opacity hover:opacity-80"
          >
            ← ほかの作品を見る
          </Link>
        </div>
      </Container>
    </article>
  );
}
