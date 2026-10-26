import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import Button from '../ui/Button.jsx';
import PriceTag from './PriceTag.jsx';

/**
 * Phones and tablets only. Slides in at the bottom once the real "Add to cart" buttons have scrolled
 * out of view above the screen. `targetRef` points at the element holding those buttons.
 * While it is visible it sets data-sticky-bar on <html>, which lifts the WhatsApp button above it (see index.css).
 */
export default function StickyBuyBar({ product, busy, onAdd, targetRef }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      // Only after the buttons are ABOVE the viewport (not while they are still further down the page).
      setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [targetRef]);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-sticky-bar', show);
    return () => document.documentElement.removeAttribute('data-sticky-bar');
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Quick purchase"
      className="fixed inset-x-0 bottom-0 z-30 animate-sheet-up border-t border-charcoal/10 bg-white/95 py-3 shadow-lift backdrop-blur lg:hidden print:hidden"
    >
      <div className="container-cz flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{product.name}</p>
          <PriceTag product={product} size="sm" />
        </div>
        <Button icon={ShoppingBag} loading={busy} onClick={onAdd}>
          Add to cart
        </Button>
      </div>
    </div>
  );
}