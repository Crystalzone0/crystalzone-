import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Portal from './Portal.jsx';
import useLockBodyScroll from '../../hooks/useLockBodyScroll.js';
import { cn } from '../../utils/cn.js';

const SIZES = { md: 'sm:max-w-md', lg: 'sm:max-w-4xl', xl: 'sm:max-w-6xl' };
const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: Escape and backdrop click close it, focus stays inside while open
 * and returns to the button that opened it. Bottom sheet on phones, centered card on larger screens.
 */
export default function Modal({ open, onClose, label, size = 'lg', className, children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return undefined;

    const previous = document.activeElement;
    panelRef.current?.focus();

    const onKey = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const nodes = panelRef.current.querySelectorAll(FOCUSABLE);
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Close"
          onClick={onClose}
          className="absolute inset-0 animate-fade-in cursor-default bg-ink/60"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className={cn(
            'relative max-h-[92dvh] w-full animate-sheet-up overflow-y-auto rounded-t-3xl bg-white shadow-lift outline-none sm:animate-pop sm:rounded-3xl',
            SIZES[size],
            className
          )}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-charcoal shadow-soft transition hover:bg-cream"
          >
            <X size={20} />
          </button>
          {children}
        </div>
      </div>
    </Portal>
  );
}