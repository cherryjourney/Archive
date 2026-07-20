interface ScenarioPlaceholderProps {
  type: "life" | "reading" | "research";
}

export default function ScenarioPlaceholder({
  type,
}: ScenarioPlaceholderProps) {
  const accent = "var(--amber)";
  const surface = "rgba(120, 150, 230, 0.06)";
  const border = "rgba(120, 150, 230, 0.12)";

  return (
    <div
      className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl"
      style={{
        backgroundColor: surface,
        border: `1px solid ${border}`,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Abstract UI representation */}
      <div className="flex w-full max-w-[280px] flex-col gap-3 p-6">
        {/* Top bar */}
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <div
            className="h-1.5 w-16 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Content area - different per type */}
        {type === "life" && (
          <>
            {/* Life: calendar-like grid + map pin */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 21 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded"
                  style={{
                    backgroundColor:
                      i === 14
                        ? accent
                        : "rgba(255,255,255,0.04)",
                    opacity: i === 14 ? 1 : 0.6,
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <div
                className="h-2 flex-1 rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />
              <div
                className="h-2 flex-1 rounded"
                style={{ backgroundColor: accent, opacity: 0.5 }}
              />
            </div>
          </>
        )}
        {type === "reading" && (
          <>
            {/* Reading: cards representing papers */}
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-md"
                  style={{
                    backgroundColor:
                      i < 3
                        ? "rgba(255,255,255,0.05)"
                        : i < 6
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(255,255,255,0.03)",
                    border:
                      i === 1
                        ? `1px solid ${accent}22`
                        : "1px solid transparent",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <div
                className="h-1.5 w-10 rounded"
                style={{ backgroundColor: accent, opacity: 0.5 }}
              />
              <div
                className="h-1.5 w-6 rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />
              <div
                className="h-1.5 w-8 rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />
            </div>
          </>
        )}
        {type === "research" && (
          <>
            {/* Research: dashboard-like chart */}
            <div className="flex items-end gap-2" style={{ height: "60px" }}>
              {[40, 70, 45, 80, 55, 90, 60].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    backgroundColor:
                      i === 5
                        ? accent
                        : "rgba(120, 150, 230, 0.2)",
                    opacity: i === 5 ? 0.8 : 0.5,
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {["任务", "计划", "论文"].map((label) => (
                <div
                  key={label}
                  className="rounded-full px-2.5 py-1 text-[10px]"
                  style={{
                    backgroundColor: "rgba(120, 150, 230, 0.1)",
                    color: "var(--accent-blue-soft)",
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Bottom tag */}
        <div
          className="text-[10px] tracking-widest uppercase"
          style={{ color: accent, opacity: 0.7 }}
        >
          {type === "life"
            ? "Life"
            : type === "reading"
              ? "Reading"
              : "Research"}
        </div>
      </div>
    </div>
  );
}
