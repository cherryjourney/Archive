import React, { useState } from 'react';

interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sourceColor?: string;
  targetColor?: string;
  isBlocking?: boolean;
  label?: string;
  onClick?: () => void;
}

/** Single SVG connection line with bezier curve, gradient, and arrow */
export default function ConnectionLine({
  x1, y1, x2, y2,
  sourceColor = '#8b85b0',
  targetColor = '#8b85b0',
  isBlocking,
  label,
  onClick,
}: ConnectionLineProps) {
  const [hovered, setHovered] = useState(false);

  // Unique IDs for gradient and marker (per line instance)
  const gradId = `grad-${Math.round(x1)}-${Math.round(y1)}-${Math.round(x2)}-${Math.round(y2)}`;
  const arrowId = `arrow-${gradId}`;

  // Horizontal bezier curve: control point offset proportional to distance
  const dx = Math.max(Math.abs(x2 - x1) * 0.4, 30);
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

  const strokeWidth = (isBlocking ? 2.5 : 2) * (hovered ? 1.3 : 1);
  const opacity = hovered ? 1 : 0.65;

  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} />
          <stop offset="100%" stopColor={targetColor} />
        </linearGradient>
        <marker
          id={arrowId}
          viewBox="0 0 10 10"
          refX={9}
          refY={5}
          markerWidth={6}
          markerHeight={6}
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={targetColor} />
        </marker>
      </defs>

      {/* Invisible wider hit area for easier hover/click */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onClick}
      />

      {/* Visible line */}
      <path
        d={d}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        markerEnd={`url(#${arrowId})`}
        style={{
          cursor: onClick ? 'pointer' : 'default',
          opacity,
          transition: 'opacity 0.15s ease, stroke-width 0.15s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Label tooltip on hover */}
      {hovered && label && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          textAnchor="middle"
          fontSize={11}
          fill="var(--text-primary, #0F172A)"
          style={{ pointerEvents: 'none' }}
        >
          {label}
        </text>
      )}
    </>
  );
}
