import { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn.js';

/**
 * Fades and lifts its content into place the first time it scrolls into view.
 * Shows immediately for visitors who prefer reduced motion, in browsers without IntersectionObserver,
 * and on paper. Once visible it keeps "transform: none", so it can never trap fixed-position children.
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className, children, ...props }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    // threshold 0 + a small bottom margin: triggers as soon as the top edge enters, even for very tall blocks.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none print:translate-y-0 print:opacity-100',
        visible ? 'transform-none opacity-100' : 'translate-y-4 opacity-0',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}