import AnimatedSection from "@/components/ui/AnimatedSection";

export default function QuoteBlock() {
  return (
    <section
      className="relative flex min-h-[70vh] items-center overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--bg-deep) 0%, var(--bg-base) 400px, var(--bg-base) 100%)",
      }}
    >
      <div className="w-full py-32 text-center" style={{maxWidth:"800px",marginLeft:"auto",marginRight:"auto",paddingLeft:"40px",paddingRight:"40px"}}>
        <AnimatedSection>
          {/* Opening quote mark */}
          <div
            className="mb-10 text-8xl leading-none italic"
            style={{ color: "var(--amber)" }}
          >
            &ldquo;
          </div>
          <blockquote
            className="mb-10 text-4xl italic leading-relaxed md:text-5xl"
            style={{ color: "var(--amber-soft)" }}
          >
            专注，是唯一的奢侈。
          </blockquote>
          <cite
            className="not-italic text-lg tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            — Archive·存迹
          </cite>
        </AnimatedSection>
      </div>
    </section>
  );
}
