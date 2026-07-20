import { featureGroups } from "@/data/features";
import AnimatedSection from "@/components/ui/AnimatedSection";
import SectionKicker from "@/components/ui/SectionKicker";

// Dynamically import all Lucide icons
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Calendar,
  Timer,
  GanttChart,
  Hourglass,
  Milestone,
  MapPin,
  ClipboardList,
  Package,
  FileText,
  FlaskConical,
  GraduationCap,
  Wallet,
  FileBarChart,
  Link,
  Tag,
  Bell,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Calendar,
  Timer,
  GanttChart,
  Hourglass,
  Milestone,
  MapPin,
  ClipboardList,
  Package,
  FileText,
  FlaskConical,
  GraduationCap,
  Wallet,
  FileBarChart,
  Link,
  Tag,
  Bell,
};

export default function FeatureGrid() {
  return (
    <section
      style={{
        background: "linear-gradient(to bottom, var(--bg-deep) 0%, var(--bg-base) 400px, var(--bg-base) 100%)",
      }}
    >
      <div style={{maxWidth:"1200px",marginLeft:"auto",marginRight:"auto",paddingLeft:"40px",paddingRight:"40px"}} className="py-36">
        <AnimatedSection className="text-center">
          <SectionKicker>Modules</SectionKicker>
          <h2 style={{ color: "var(--text-primary)" }}>
            20 个模块，4 个维度
          </h2>
          <p
            className="mx-auto mt-4 mb-20 max-w-[600px] text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            从核心任务管理到学术论文追踪，从时间线上的人生轨迹到旅途中的点点滴滴——一处存迹。
          </p>
        </AnimatedSection>

        <div className="grid gap-10 md:grid-cols-2">
          {featureGroups.map((group, gi) => (
            <AnimatedSection key={group.id} delay={gi * 0.1}>
              <div
                className="h-full rounded-2xl p-8"
                style={{ backgroundColor: "rgba(120, 150, 230, 0.03)" }}
              >
                <div
                  className="mb-6 text-xs tracking-[0.2em] uppercase"
                  style={{ color: "var(--amber)" }}
                >
                  {group.name} · {group.nameEn}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {group.features.map((f) => {
                    const Icon = iconMap[f.icon];
                    return (
                      <div
                        key={f.id}
                        className="rounded-xl p-4 transition-colors duration-200"
                        style={{
                          backgroundColor: "rgba(120, 150, 230, 0.04)",
                        }}
                      >
                        {Icon && (
                          <Icon size={20} color="var(--amber)" />
                        )}
                        <div
                          className="mt-3 text-[15px]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {f.name}
                        </div>
                        <div
                          className="mt-1.5 text-sm leading-relaxed"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {f.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection className="mt-10 text-center" delay={0.4}>
          <a
            href="/features"
            className="inline-flex items-center gap-1.5 text-sm transition-colors duration-150 hover:underline"
            style={{ color: "var(--amber)" }}
          >
            查看全部功能 →
          </a>
        </AnimatedSection>
      </div>
    </section>
  );
}
