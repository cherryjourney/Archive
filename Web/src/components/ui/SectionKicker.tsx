interface SectionKickerProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionKicker({
  children,
  className = "",
}: SectionKickerProps) {
  return (
    <div
      className={`mb-4 text-xs tracking-[0.28em] uppercase ${className}`}
      style={{ color: "var(--amber)" }}
    >
      {children}
    </div>
  );
}
