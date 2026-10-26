import { useEffect, useRef, useState } from 'react';
import useDebounce from './useDebounce.js';

/**
 * A search box that writes to the URL only after the user pauses typing, and follows the URL when it
 * changes from outside ("clear filters", back button) without eating a space the user just typed.
 *   const [text, setText] = useSearchInput(params.q, (q) => setParams({ q }));
 */
export default function useSearchInput(urlValue, commit, delay = 400) {
  const [text, setText] = useState(urlValue);
  const debounced = useDebounce(text, delay);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    const next = debounced.trim();
    if (next !== urlValue) commitRef.current(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    setText((prev) => (prev.trim() === urlValue ? prev : urlValue));
  }, [urlValue]);

  return [text, setText];
}