import { useEffect } from 'react';
import { X } from 'lucide-react';
import Portal from '../ui/Portal.jsx';
import useLockBodyScroll from '../../hooks/useLockBodyScroll.js';

/** Slide-in filter panel for phones and tablets. `onClose` must be a stable function (useCallback). */
export default function FilterDrawer({ open, onClose, footerLabel, children }) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
        <button type="button" className="absolute inset-0 animate-fade-in bg-ink/60" onClick={onClose} aria-label="Close filters" />

        <div className="absolute inset-y-0 right-0 flex w-[90%] max-w-sm animate-slide-in-right flex-col bg-white shadow-lift">
          <div className="flex items-center justify-end border-b border-charcoal/10 px-3 py-3">
            <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-charcoal/5" aria-label="Close filters">
              <X size={22} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
          <div className="border-t border-charcoal/10 p-4">
            <button type="button" onClick={onClose} className="btn-gold w-full">
              {footerLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}