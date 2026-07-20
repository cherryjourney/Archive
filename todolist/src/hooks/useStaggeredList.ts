import { useMemo } from 'react';

/**
 * Returns CSS class strings for staggered list entrance animation.
 * Usage: <div className={classes[i]}>...</div>
 *
 * @param items   - array of items (for length)
 * @param delayMs - stagger delay per item in ms (default 30)
 * @returns array of class strings like "stagger-enter stagger-delay-0", etc.
 */
export function useStaggeredList(items: any[], delayMs: number = 30): string[] {
  return useMemo(() => {
    return items.map((_, i) => {
      return `stagger-enter stagger-delay-${i}`;
    });
  }, [items, delayMs]);
}

/**
 * Returns inline animation style for programmatic use
 */
export function getStaggerStyle(index: number, delayMs: number = 30): React.CSSProperties {
  return {
    animation: `fadeSlideIn 0.3s var(--ease-out) ${(index * delayMs) / 1000}s both`,
  };
}
