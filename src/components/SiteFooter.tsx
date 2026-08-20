import { profile } from "@/data/profile";
import { Container, Label } from "@/components/ui";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8 sm:py-10">
      <Container className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Label className="text-faint">
          © {new Date().getFullYear()} {profile.nameEn}
        </Label>
        <p className="text-[12px] text-faint sm:text-[13px]">
          掲載作品のソースコードは各リポジトリを参照してください
        </p>
      </Container>
    </footer>
  );
}
