import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

/**
 * 封装 Tauri invoke 调用
 * 提供 loading / error 状态
 */
export function useTauriCommand<T>(command: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (args?: Record<string, unknown>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await invoke<T>(command, args || {});
        return result;
      } catch (e) {
        const msg = typeof e === 'string' ? e : (e as Error).message;
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [command]
  );

  return { execute, loading, error };
}
