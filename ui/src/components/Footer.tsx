export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      style={{
        position: "relative",
        padding: "clamp(32px, 4vw, 48px) clamp(20px, 4vw, 48px)",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--container)",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Left — brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <img
            src="/logo.svg"
            alt=""
            width={20}
            height={20}
            style={{ opacity: 0.5 }}
            aria-hidden
          />
          <span
            style={{
              fontFamily: "var(--font-heading), system-ui, sans-serif",
              fontSize: 13,
              color: "var(--ink-faint)",
              letterSpacing: "0.01em",
            }}
          >
            Archive · 存迹
          </span>
        </div>

        {/* Right — meta */}
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-faint)",
            opacity: 0.6,
          }}
        >
          &copy; {year} · 以认真的态度，做认真的工具
        </div>
      </div>
    </footer>
  );
}
