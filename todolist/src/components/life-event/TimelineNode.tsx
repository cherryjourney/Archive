import React from 'react';

interface Props {
  dotColor: string;
  isBirth?: boolean;
  isOngoing?: boolean;
  isHighlighted?: boolean;
  yearLabel?: string;
  showLine?: boolean;
  id?: string;
  isYearSpacer?: boolean;
  customLineHeight?: number;
}

export default function TimelineNode({
  dotColor, isBirth, isOngoing, isHighlighted, yearLabel, showLine = true, id,
  isYearSpacer, customLineHeight,
}: Props) {
  const dotSize = isBirth ? 16 : isOngoing ? 14 : isYearSpacer ? 8 : 12;
  return (
    <div
      id={id}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: 50, flexShrink: 0, position: 'relative',
      }}
    >
      {yearLabel && (
        <span style={{
          fontSize: isBirth ? 12 : 13,
          lineHeight: '18px',
          color: isYearSpacer ? '#94A3B8' : '#64748B',
          whiteSpace: 'nowrap',
          marginBottom: 4,
          fontWeight: isBirth || isYearSpacer ? 600 : 400,
        }}>
          {yearLabel}
        </span>
      )}
      <div style={{
        width: dotSize, height: dotSize, borderRadius: '50%',
        background: dotColor,
        boxShadow: (isOngoing || isBirth) ? `0 0 ${isBirth ? 6 : 10}px ${dotColor}` : 'none',
        flexShrink: 0, zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isHighlighted && (
          <span style={{ fontSize: isBirth ? 9 : 7, color: '#fff', lineHeight: 1 }}>★</span>
        )}
      </div>
      {showLine && (
        <div style={{
          width: 1.5,
          height: customLineHeight ?? undefined,
          flex: customLineHeight ? 'none' : 1,
          minHeight: customLineHeight ? undefined : (isYearSpacer ? 48 : 60),
          background: 'repeating-linear-gradient(to bottom, #CBD5E1 0px, #CBD5E1 5px, transparent 5px, transparent 14px)',
        }} />
      )}
    </div>
  );
}
