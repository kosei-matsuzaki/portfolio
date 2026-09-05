import { Hero } from "@/components/Hero";
import { WorksSection } from "@/components/WorksSection";
import {
  AboutDetails,
  InternshipSection,
  ResearchSection,
  SkillsSection,
} from "@/components/sections";

export default function Home() {
  return (
    <>
      {/* 2 分しか見ない人に先に届けるのは作品。学歴・資格は読み終えた人が見る場所へ回す */}
      <section id="about" className="scroll-mt-20">
        <Hero />
      </section>

      <WorksSection />
      <ResearchSection />
      <InternshipSection />
      <SkillsSection />
      <AboutDetails />
    </>
  );
}
