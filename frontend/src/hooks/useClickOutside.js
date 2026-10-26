import { useEffect } from 'react';

/** Calls `handler` when the user clicks or taps outside `ref` (only while `active`). */
export default function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;

    const onPress = (event) => {
      if (ref.current && !ref.current.contains(event.target)) handler(event);
    };
    document.addEventListener('mousedown', onPress);
    document.addEventListener('touchstart', onPress);
    return () => {
      document.removeEventListener('mousedown', onPress);
      document.removeEventListener('touchstart', onPress);
    };
  }, [ref, handler, active]);
}