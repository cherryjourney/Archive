import { useEffect, useRef, useCallback } from 'react';

/**
 * 自动保存 Hook
 * 在内容变化后延迟一段时间自动触发保存
 */
export function useAutoSave(
  saveFn: () => Promise<void>,
  deps: unknown[],
  delayMs: number = 2000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const debouncedSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      saveFn();
    }, delayMs);
  }, [saveFn, delayMs]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    debouncedSave();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, deps);

  return { saveNow: saveFn };
}
