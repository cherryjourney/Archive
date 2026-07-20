interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  hover = true,
}: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border p-6 transition-all duration-200 ${hover ? "hover:-translate-y-1" : ""} ${className}`}
      style={{
        backgroundColor: "var(--surface-glass)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {children}
    </div>
  );
}
