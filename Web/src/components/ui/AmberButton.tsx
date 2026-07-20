import Link from "next/link";

interface AmberButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "px-5 py-2.5 text-xs",
  md: "px-7 py-3 text-sm",
  lg: "px-9 py-4 text-base",
};

export default function AmberButton({
  href,
  onClick,
  children,
  className = "",
  size = "md",
}: AmberButtonProps) {
  const baseStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, var(--accent-blue), var(--amber))",
    color: "#fff",
    borderRadius: "100px",
    letterSpacing: "0.04em",
    transition: "transform 200ms ease, box-shadow 200ms ease",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  };

  const hoverStyle = {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 32px rgba(201, 168, 92, 0.3)",
  };

  const classes = `${sizeMap[size]} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        style={baseStyle}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, hoverStyle);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, {
            transform: "translateY(0)",
            boxShadow: "none",
          });
        }}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={classes}
      style={baseStyle}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverStyle);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, {
          transform: "translateY(0)",
          boxShadow: "none",
        });
      }}
    >
      {children}
    </button>
  );
}
