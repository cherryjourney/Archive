import React, { useEffect, useRef } from 'react';
import { Typography } from 'antd';
import TimelineNode from './TimelineNode';
import EventCard from './EventCard';
import type { LifeEventDisplay } from '@/types/lifeEvent';
import dayjs, { Dayjs } from 'dayjs';

interface Props {
  events: LifeEventDisplay[];
  selectedId: string | null;
  birthDate: string;
  onSelect: (id: string) => void;
}

const PX_PER_MONTH = 6;
const MIN_GAP = 6;
/** Compressed gap for empty years (no events) */
const EMPTY_YEAR_GAP = 14;

function toMonths(d: Dayjs): number {
  return d.year() * 12 + d.month();
}

export default function VerticalTimeline({ events, selectedId, birthDate, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || events.length === 0) return;
    const now = dayjs().format('YYYY-MM-DD');
    const currentIdx = events.findIndex(e => e.start_date <= now && (!e.end_date || e.end_date >= now));
    const targetIdx = currentIdx >= 0 ? currentIdx : events.length - 1;
    const el = document.getElementById(`event-node-${events[targetIdx].id}`);
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [events]);

  if (events.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', padding: 40, color: 'var(--color-muted)' }}>
        <Typography.Text type="secondary" style={{ fontSize: 16, marginBottom: 8 }}>🧭</Typography.Text>
        <Typography.Text type="secondary">时间线就绪，开始记录吧</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>点击上方按钮添加第一个事件</Typography.Text>
      </div>
    );
  }

  const birthDateDayjs = dayjs(birthDate);
  const birthYear = birthDate.slice(0, 4);
  const sorted = [...events].sort((a, b) => a.start_date.localeCompare(b.start_date));

  // Collect years that have at least one event
  const eventYears = new Set(sorted.map(e => parseInt(e.start_date.slice(0, 4))));

  interface TimelinePoint {
    type: 'birth' | 'event' | 'year-marker';
    key: string;
    date: Dayjs;
    event?: LifeEventDisplay;
    eventIdx?: number;
    label?: string;
    isEmptyYear?: boolean; // year with no events → compressed gap
  }

  const points: TimelinePoint[] = [];
  points.push({ type: 'birth', key: 'birth', date: birthDateDayjs });

  // Events
  sorted.forEach((event, idx) => {
    points.push({
      type: 'event', key: event.id, date: dayjs(event.start_date),
      event, eventIdx: idx,
    });
  });

  // Year markers: January of each year from birth+1 to current year
  const startM = toMonths(birthDateDayjs);
  const currentYear = dayjs().year();
  const endM = toMonths(dayjs(`${currentYear + 1}-01-01`));

  for (let m = startM + 1; m < endM; m++) {
    const year = Math.floor(m / 12);
    const month = m % 12;
    if (month !== 0) continue; // only January
    const d = dayjs(`${year}-01-01`);
    // Skip if an event starts in January of this year
    const hasEvent = sorted.some(e => dayjs(e.start_date).isSame(d, 'month'));
    if (hasEvent) continue;

    points.push({
      type: 'year-marker',
      key: `y-${year}`,
      date: d,
      label: String(year),
      isEmptyYear: !eventYears.has(year),
    });
  }

  points.sort((a, b) => a.date.valueOf() - b.date.valueOf());

  const COL_W = 500;

  return (
    <div ref={containerRef} style={{ overflowY: 'auto', height: '100%', padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'center', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {points.map((point, idx) => {
            const isLast = idx === points.length - 1;
            const nextPoint = isLast ? null : points[idx + 1];

            // Calculate line height
            let lineHeight = MIN_GAP;
            if (nextPoint) {
              const monthGap = toMonths(nextPoint.date) - toMonths(point.date);
              if (point.type === 'year-marker' && (point as any).isEmptyYear && nextPoint.type === 'year-marker') {
                // Empty year → compressed
                lineHeight = EMPTY_YEAR_GAP;
              } else {
                lineHeight = Math.max(MIN_GAP, monthGap * PX_PER_MONTH);
              }
            }

            if (point.type === 'birth') {
              return (
                <div key="birth" style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minHeight: 44 }}>
                  <div style={{ width: COL_W }} />
                  <TimelineNode dotColor="#2563EB" isBirth yearLabel={birthYear}
                    showLine={points.length > 1} customLineHeight={lineHeight} />
                  <div style={{ width: COL_W }} />
                </div>
              );
            }

            if (point.type === 'year-marker') {
              return (
                <div key={point.key} style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minHeight: 24 }}>
                  <div style={{ width: COL_W }} />
                  <TimelineNode dotColor="#CBD5E1" yearLabel={point.label} isYearSpacer
                    showLine={!isLast} customLineHeight={lineHeight} />
                  <div style={{ width: COL_W }} />
                </div>
              );
            }

            // Event
            const event = point.event!;
            const isLeft = point.eventIdx! % 2 === 0;
            const eventMonth = point.date.month() + 1;
            const monthLabel = `${eventMonth}月`;

            return (
              <div key={event.id}
                style={{ display: 'flex', alignItems: 'flex-start', width: '100%', minHeight: 56 }}>
                {isLeft ? (
                  <div style={{ width: COL_W, display: 'flex', justifyContent: 'flex-end' }}>
                    <EventCard event={event} side="left"
                      isSelected={selectedId === event.id} onClick={() => onSelect(event.id)} />
                  </div>
                ) : (
                  <div style={{ width: COL_W }} />
                )}

                <TimelineNode dotColor={event.categoryColor}
                  isOngoing={event.isOngoing} isHighlighted={event.is_highlighted}
                  yearLabel={monthLabel} showLine={!isLast}
                  id={`event-node-${event.id}`} customLineHeight={lineHeight} />

                {!isLeft ? (
                  <div style={{ width: COL_W, display: 'flex', justifyContent: 'flex-start' }}>
                    <EventCard event={event} side="right"
                      isSelected={selectedId === event.id} onClick={() => onSelect(event.id)} />
                  </div>
                ) : (
                  <div style={{ width: COL_W }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
