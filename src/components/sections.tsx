import Link from "next/link";
import { profile } from "@/data/profile";
import {
  internships,
  researchProjects,
  shortRole,
  type Project,
} from "@/data/projects";
import {
  Container,
  IndexNo,
  MetaLine,
  RAIL,
  RAIL_GRID,
  RailDot,
  RichText,
  Section,
  TechChip,
  TechIcons,
} from "@/components/ui";

/* ------------------------------------------------------------------ About
   ヒーローと同じセクションに入る下半分（学歴・資格）。
   所属や修了予定はヒーローの仕様表と学歴の年表で出しているので、
   ここには見出し・リード文を置かない。
   ------------------------------------------------------------------ */
export function AboutDetails() {
  return (
    <Container className="pb-14 sm:pb-20">
      <div className="divide-y divide-border">
        {/* 学歴（縦線＋● の年表。古い順に上から並べる） */}
        <div
          data-reveal
          className={`grid gap-3 py-6 ${RAIL_GRID} md:py-7`}
        >
          <p className="text-[12px] font-semibold tracking-wide text-accent md:pt-1">
            学歴
          </p>
          <ol className="border-l border-border pl-6">
            {profile.education.map((e) => (
              <li key={e.title} className="relative pb-7 last:pb-0">
                <span className="absolute -left-[28px] top-[7px] h-[7px] w-[7px] rounded-full bg-accent" />
                <p className="font-mono text-[11px] tracking-[0.06em] text-faint">
                  {e.range}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-fg sm:text-[14px]">
                  {e.title}
                </p>
                {e.note && (
                  <p className="mt-1 text-[12px] leading-relaxed text-muted sm:text-[13px]">
                    {e.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* 資格 */}
        <div
          data-reveal
          className={`grid gap-3 py-6 ${RAIL_GRID} md:py-7`}
        >
          <p className="text-[12px] font-semibold tracking-wide text-accent md:pt-1">
            資格
          </p>
          <ul className="space-y-2.5">
            {profile.certifications.map((c) => (
              <li
                key={c.title}
                className="flex gap-2.5 text-[13px] leading-relaxed sm:text-[14px]"
              >
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span className="text-fg">
                  {c.title}
                  {c.note && (
                    <span className="ml-2 text-[12px] text-faint">{c.note}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}

/* ------------------------------------------------- 研究・インターン共通の行 */
function WideRow({
  project,
  no,
  badge,
  badgeClass,
  cta,
}: {
  project: Project;
  no: string;
  badge: string;
  badgeClass: string;
  cta: string;
}) {
  const href = `/works/${project.slug}/`;

  return (
    <article
      data-reveal
      className="border-t border-border py-8 sm:py-10"
    >
      <div className={`grid gap-4 ${RAIL_GRID}`}>
        <div className={`${RAIL} md:pt-1`}>
          <span className="relative inline-block">
            <RailDot />
            <IndexNo>{no}</IndexNo>
          </span>
        </div>

        <div>
          <span
            className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.12em] ${badgeClass}`}
          >
            {badge}
          </span>
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

          <p className="mt-5 max-w-3xl text-[13px] leading-relaxed text-faint sm:text-[14px]">
            <RichText>{project.summary}</RichText>
          </p>

          <TechIcons items={project.stack} max={8} className="mt-5" />

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href={href}
              className="font-mono text-[12px] font-bold tracking-[0.1em] text-accent transition-opacity hover:opacity-80"
            >
              {cta} →
            </Link>
            {project.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] tracking-[0.1em] text-faint transition-colors hover:text-fg"
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

/* --------------------------------------------------------------- Research */
export function ResearchSection() {
  return (
    <Section
      id="research"
      index="02"
      eyebrow="Research"
      title="研究"
      lead="手法を提案するだけでなく、公平に比較できる実験基盤をつくり、うまくいかなかった結果も含めて報告することを重視しています。"
    >
      <div>
        {researchProjects.map((p, i) => (
          <WideRow
            key={p.slug}
            project={p}
            no={`R.${String(i + 1).padStart(2, "0")}`}
            badge="研究"
            badgeClass="border-blue/35 bg-blue/10 text-blue"
            cta="研究の詳細を見る"
          />
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- Internship */
export function InternshipSection() {
  return (
    <Section
      id="internship"
      index="03"
      eyebrow="Internship"
      title="インターンシップ"
      lead="チームで開発した経験です。"
    >
      <div>
        {internships.map((p, i) => (
          <WideRow
            key={p.slug}
            project={p}
            no={`I.${String(i + 1).padStart(2, "0")}`}
            badge="チーム開発"
            badgeClass="border-pink/35 bg-pink/10 text-pink"
            cta="担当した内容を見る"
          />
        ))}
      </div>
    </Section>
  );
}

/* ----------------------------------------------------------------- Skills */
export function SkillsSection() {
  return (
    <Section
      id="skills"
      index="04"
      eyebrow="Skills"
      title="使える技術"
      lead="実際に作品・研究で使ったものだけを挙げています。"
    >
      <div className="divide-y divide-border">
        {profile.skills.map((group) => (
          <div
            key={group.category}
            data-reveal
            className={`grid gap-3 py-5 ${RAIL_GRID} md:py-6`}
          >
            {/* 分類名は幅が要るので左段には入れず、チップの上に置く */}
            <div className="hidden md:block" aria-hidden />
            <div className="flex flex-wrap gap-1.5">
              <p className="w-full text-[12px] font-semibold tracking-wide text-accent">
                {group.category}
              </p>
              {group.items.map((item) => (
                <TechChip key={item} label={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
