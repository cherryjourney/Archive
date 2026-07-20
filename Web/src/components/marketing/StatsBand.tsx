"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { stats as statsData } from "@/data/stats";

function CountUp({
  target,
  duration = 600,
}: {
  target: number;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (isInView && !hasStarted.current && target > 0) {
      hasStarted.current = true;
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    }

    if (target === 0) {
      setCount(0);
    }
  }, [isInView, target, duration]);

  return <span ref={ref}>{count}</span>;
}

export default function StatsBand() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--bg-base) 0%, var(--bg-deep) 400px, var(--bg-deep) 100%)",
      }}
    >
      <div className="grid grid-cols-2 gap-y-16 py-32 md:grid-cols-4 md:gap-12" style={{maxWidth:"1200px",marginLeft:"auto",marginRight:"auto",paddingLeft:"40px",paddingRight:"40px"}}>
        {statsData.map((stat, i) => (
          <div key={i} className="text-center">
            <div
              className="text-5xl tabular-nums"
              style={{
                color: "var(--amber)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <CountUp target={stat.value} />
              <span
                className="text-2xl"
                style={{ color: "var(--amber-soft)" }}
              >
                {stat.suffix}
              </span>
            </div>
            <div
              className="mt-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
