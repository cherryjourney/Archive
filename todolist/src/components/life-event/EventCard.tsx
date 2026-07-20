import React from 'react';
import type { LifeEventDisplay } from '@/types/lifeEvent';
import { formatDate } from '@/utils/lifeEventPresets';

interface Props {
  event: LifeEventDisplay;
  side: 'left' | 'right';
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Offset to align the dashed connector with the TimelineNode dot center:
 *   label line-height (18px) + margin-bottom (4px) + dotSize/2 (6px) = 28px
 * This also lands very close to the card's visual vertical midpoint (~33px),
 * so the connector reads as "in the middle of the card."
 */
const DASHED_TOP = 28;

export default function EventCard({ event, side, isSelected, onClick }: Props) {
  const dotColor = event.categoryColor;
  const isLeft = side === 'left';

  const isSingleDay = event.end_date && event.start_date === event.end_date;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: isLeft ? 'row-reverse' : 'row',
      }}
    >
      {/* Dashed connector — vertically offset to match dot center */}
      <div
        style={{
          width: 192,
          marginTop: DASHED_TOP,
          borderTop: `1.5px dashed ${isSelected ? dotColor : '#CBD5E1'}`,
          transition: 'border-color 0.15s',
          flexShrink: 0,
        }}
      />

      {/* Card body */}
      <div
        onClick={onClick}
        style={{
          background: isSelected ? `${dotColor}12` : 'var(--color-surface, #fff)',
          border: `${isSelected ? 2 : 1.5}px solid ${isSelected ? dotColor : 'var(--color-border, #E2E8F0)'}`,
          borderStyle: event.isOngoing ? 'dashed' : 'solid',
          borderRadius: 14,
          padding: '12px 18px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          maxWidth: 300,
          textAlign: isLeft ? 'right' : 'left',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#93C5FD';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = isSelected ? dotColor : 'var(--color-border, #E2E8F0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-foreground)', marginBottom: 4, lineHeight: 1.4 }}>
          {event.is_highlighted && '⭐ '}
          {event.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.4 }}>
          {isSingleDay ? (
            formatDate(event.start_date, event.startPrecision)
          ) : (
            <>
              {formatDate(event.start_date, event.startPrecision)}
              {' – '}
              {event.end_date ? formatDate(event.end_date, event.endPrecision) : '至今'}
            </>
          )}
          {!isSingleDay && event.durationText && (
            <> · {event.durationText}</>
          )}
        </div>
        {event.isOngoing && (
          <span style={{
            fontSize: 10, color: dotColor, background: `${dotColor}18`,
            padding: '2px 8px', borderRadius: 6, fontWeight: 500,
            display: 'inline-block', marginTop: 6,
          }}>
            当前
          </span>
        )}
      </div>
    </div>
  );
}
