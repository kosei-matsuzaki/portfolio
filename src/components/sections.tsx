import type { CSSProperties } from "react";
import { profile } from "@/data/profile";
import {
  internships,
  researchProjects,
  type Project,
} from "@/data/projects";
import {
  Container,
  IndexNo,
  RAIL,
  RAIL_GRID,
  RailDot,
  Section,
} from "@/components/ui";
import { ProjectRowBody, TechChip } from "@/components/parts";

/* ------------------------------------------------------------------ About
   学歴・資格。作品・研究・技術を見終えた人が最後に確かめる場所なので、
   ページの末尾に置く。所属や修了予定はヒーローの仕様表と年表で出しているので、
   ここには見出し・リード文を置かない。
   ------------------------------------------------------------------ */
export function AboutDetails() {
  return (
    <Container className="border-t border-border py-14 sm:py-20">
      <div className="divide-y divide-border">
        {/* 学歴（縦線＋● の年表。古い順に上から並べる） */}
        <div
          data-reveal
          className={`grid gap-3 py-6 ${RAIL_GRID} md:py-7`}
        >
          <p className="text-micro font-medium text-faint md:pt-1">
            学歴
          </p>
          <ol className="border-l border-border pl-6">
            {profile.education.map((e) => (
              <li key={e.title} className="relative pb-7 last:pb-0">
                <span className="absolute -left-[28px] top-[7px] h-[7px] w-[7px] rounded-full bg-border-strong" />
                <p className="text-micro text-faint">
                  {e.range}
                </p>
                <p className="mt-1 text-small font-medium text-fg sm:text-small-sm">
                  {e.title}
                </p>
                {e.note && (
                  <p className="mt-1 text-micro text-muted sm:text-small">
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
          <p className="text-micro font-medium text-faint md:pt-1">
            資格
          </p>
          <ul className="space-y-2.5">
            {profile.certifications.map((c) => (
              <li
                key={c.title}
                className="flex gap-2.5 text-small sm:text-small-sm"
              >
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-border-strong" />
                <span className="text-fg">
                  {c.title}
                  {c.note && (
                    <span className="ml-2 text-micro text-faint">{c.note}</span>
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
  cta,
}: {
  project: Project;
  no: string;
  badge: string;
  cta: string;
}) {
  return (
    <article
      id={`work-${project.slug}`}
      data-reveal
      style={
        project.accent
          ? ({ "--work-accent": project.accent } as CSSProperties)
          : undefined
      }
      className="scroll-mt-20 border-t border-border py-8 sm:py-10"
    >
      <div className={`grid gap-4 ${RAIL_GRID}`}>
        <div className={`${RAIL} md:pt-1`}>
          <span className="relative inline-block">
            <RailDot />
            <IndexNo>{no}</IndexNo>
          </span>
        </div>

        <ProjectRowBody
          project={project}
          badge={
            <span
              className="inline-flex w-fit border border-border px-2.5 py-0.5 text-micro text-muted"
            >
              {badge}
            </span>
          }
          cta={cta}
        />
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
              <p className="w-full text-micro font-medium text-faint">
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
