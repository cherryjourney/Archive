import AnimatedSection from "@/components/ui/AnimatedSection";
import AmberButton from "@/components/ui/AmberButton";
import GlowingOrb from "@/components/ui/GlowingOrb";
import SectionKicker from "@/components/ui/SectionKicker";
import Link from "next/link";

export default function CTASection() {
  return (
    <section
      className="relative flex min-h-[80vh] items-center overflow-hidden text-center"
      style={{
        background:
          "radial-gradient(ellipse at 30% 40%, rgba(90, 130, 230, 0.18) 0%, rgba(201, 168, 92, 0.08) 50%, transparent 70%)",
      }}
    >
      <GlowingOrb color="blue" className="-left-20 -top-20" />
      <GlowingOrb color="amber" className="-bottom-20 -right-20" />

      <div className="relative z-10 w-full py-32" style={{maxWidth:"800px",marginLeft:"auto",marginRight:"auto",paddingLeft:"40px",paddingRight:"40px"}}>
        <AnimatedSection>
          <SectionKicker>Download</SectionKicker>
          <h1
            className="mb-8"
            style={{ color: "var(--text-primary)" }}
          >
            现在就开始，存下你的痕迹。
          </h1>
          <p
            className="mx-auto mb-12 max-w-[520px] text-xl leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Windows 版 · 8.2MB · V5.0.1 · 完全免费
          </p>
          <div className="flex flex-col items-center gap-5">
            <AmberButton href="/download" size="lg">
              立即下载
            </AmberButton>
            <Link
              href="/changelog"
              className="text-[15px] transition-colors duration-150 hover:underline"
              style={{ color: "var(--amber)" }}
            >
              查看更新日志 →
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
