import { Truck } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext.jsx';

/** "Add Rs X more for free delivery" progress bar. Hidden when free shipping is switched off. */
export default function FreeShippingBar({ summary }) {
  const { money } = useSettings();
  const { freeShippingThreshold: threshold, freeShipping, amountToFreeShipping, subtotal, discount, itemCount } = summary;

  if (!threshold || itemCount === 0) return null;

  const progress = Math.min(100, Math.max(0, Math.round(((subtotal - discount) / threshold) * 100)));

  return (
    <div className="mb-5 rounded-2xl bg-cream p-4 text-sm">
      <p className="flex items-center gap-2">
        <Truck size={17} className="shrink-0 text-gold-dark" aria-hidden="true" />
        {freeShipping ? (
          <span className="font-medium text-emerald-700">You have unlocked free delivery!</span>
        ) : (
          <span>
            Add <strong>{money(amountToFreeShipping)}</strong> more for free delivery
          </span>
        )}
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-cream-dark"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Progress towards free delivery"
      >
        <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}