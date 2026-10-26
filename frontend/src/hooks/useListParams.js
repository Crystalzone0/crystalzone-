import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps an admin list's filters and page in the URL (shareable, back button works).
 *   const { params, setParams, reset } = useListParams({ q: '', status: '' });
 * Every default is a string. `params.page` is always a number >= 1.
 * setParams({ status: 'active' }) goes back to page 1 unless the patch includes `page`.
 */
export default function useListParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsKey = JSON.stringify(defaults);

  const params = useMemo(() => {
    const base = JSON.parse(defaultsKey);
    const result = {};
    for (const key of Object.keys(base)) {
      result[key] = String(searchParams.get(key) ?? base[key]).slice(0, 100);
    }
    const page = parseInt(searchParams.get('page') || '1', 10);
    result.page = Number.isInteger(page) && page >= 1 ? Math.min(page, 1000) : 1;
    return result;
  }, [searchParams, defaultsKey]);

  const setParams = useCallback(
    (patch) => {
      const base = JSON.parse(defaultsKey);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            const isDefault = key === 'page' ? Number(value) <= 1 : value === base[key];
            if (value === '' || value == null || isDefault) next.delete(key);
            else next.set(key, String(value));
          }
          if (!('page' in patch)) next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [defaultsKey, setSearchParams]
  );

  const reset = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams]);

  return { params, setParams, reset };
}