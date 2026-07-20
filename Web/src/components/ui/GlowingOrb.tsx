export default function GlowingOrb({
  color = "blue",
  className = "",
}: {
  color?: "blue" | "amber";
  className?: string;
}) {
  const gradient =
    color === "amber"
      ? "radial-gradient(circle, rgba(201, 168, 92, 0.5) 0%, transparent 70%)"
      : "radial-gradient(circle, rgba(90, 130, 230, 0.45) 0%, transparent 70%)";

  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background: gradient,
        filter: "blur(8px)",
      }}
    />
  );
}
