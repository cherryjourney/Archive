import type { Scenario } from "@/data/scenarios";
import { featureGroups } from "@/data/features";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionKicker from "@/components/ui/SectionKicker";
import ScenarioPlaceholder from "@/components/marketing/ScenarioPlaceholder";
import { ArrowRight } from "lucide-react";

const bgColor = (index: number) =>
  index % 2 === 0 ? "var(--bg-base)" : "var(--bg-deep)";

const prevBgColor = (index: number) =>
  index % 2 === 0 ? "var(--bg-deep)" : "var(--bg-base)";

export default function ScenarioSection({
  scenario,
  index,
}: {
  scenario: Scenario;
  index: number;
}) {
  const isReversed = scenario.reversed ?? false;
  const current = bgColor(index);
  const prev = prevBgColor(index);

  // Find feature names from moduleIds
  const moduleNames = scenario.moduleIds
    .map((id) => {
      for (const group of featureGroups) {
        const f = group.features.find((x) => x.id === id);
        if (f) return f.name;
      }
      return null;
    })
    .filter(Boolean) as string[];

  return (
    <section
      className="relative flex min-h-screen items-center"
      style={{
        background: `linear-gradient(to bottom, ${prev} 0%, ${current} 400px, ${current} 100%)`,
      }}
    >
      <div className="grid w-full items-center gap-20 py-28 md:grid-cols-2 md:gap-28" style={{maxWidth:"1200px",marginLeft:"auto",marginRight:"auto",paddingLeft:"40px",paddingRight:"40px"}}>
        {/* Text column */}
        <AnimatedSection className={isReversed ? "md:order-2 text-center md:text-left" : "text-center md:text-left"}>
          <SectionKicker>
            {scenario.number} · {scenario.id.toUpperCase()}
          </SectionKicker>
          <h2
            className="mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            {scenario.title}
          </h2>
          <p
            className="mb-6 text-xl italic leading-relaxed"
            style={{ color: "var(--amber-soft)" }}
          >
            &ldquo;{scenario.quote}&rdquo;
          </p>
          <p
            className="mx-auto mb-8 max-w-[480px] text-lg leading-relaxed md:mx-0"
            style={{ color: "var(--text-secondary)" }}
          >
            {scenario.description}
          </p>
          <div className="flex flex-wrap justify-center gap-3 md:justify-start">
            {moduleNames.map((name) => (
              <span
                key={name}
                className="rounded-full px-4 py-2 text-sm tracking-wide"
                style={{
                  backgroundColor: "rgba(120, 150, 230, 0.06)",
                  color: "var(--accent-blue-soft)",
                }}
              >
                {name}
              </span>
            ))}
          </div>
          <div className="mt-8">
            <a
              href="/features"
              className="inline-flex items-center gap-2 text-[15px] transition-colors duration-150 hover:underline"
              style={{ color: "var(--amber)" }}
            >
              查看全部功能 <ArrowRight size={15} />
            </a>
          </div>
        </AnimatedSection>

        {/* Image placeholder */}
        <AnimatedSection delay={0.15} className={isReversed ? "md:order-1" : ""}>
          <ScenarioPlaceholder type={scenario.id as "life" | "reading" | "research"} />
        </AnimatedSection>
      </div>
    </section>
  );
}
