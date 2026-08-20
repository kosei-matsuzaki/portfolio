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
      {/* 導入（ヒーロー）と自己紹介（強み・学歴・資格）は 1 つのセクション */}
      <section id="about" className="scroll-mt-20">
        <Hero />
        <AboutDetails />
      </section>

      <WorksSection />
      <ResearchSection />
      <InternshipSection />
      <SkillsSection />
    </>
  );
}
