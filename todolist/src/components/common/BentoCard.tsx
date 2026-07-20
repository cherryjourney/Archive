import type { CSSProperties, ReactNode } from 'react';

interface BentoCardProps {
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
  interactive?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

export default function BentoCard({
  children,
  span = 1,
  rowSpan = 1,
  interactive = false,
  onClick,
  style,
  className = '',
}: BentoCardProps) {
  return (
    <div
      className={`bento-card${interactive ? ' interactive' : ''} ${className}`}
      onClick={onClick}
      style={{
        gridColumn: `span ${span}`,
        gridRow: `span ${rowSpan}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
