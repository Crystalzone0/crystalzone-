import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function QuantitySelector({ value, onChange, max, min = 1, disabled = false, className }) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  return (
    <div
      role="group"
      aria-label="Quantity"
      className={cn('inline-flex items-center rounded-full border border-charcoal/20 bg-white', disabled && 'opacity-50', className)}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={!canDecrease}
        aria-label="Decrease quantity"
        className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-charcoal/5 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-[2.5rem] text-center text-sm font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={!canIncrease}
        aria-label="Increase quantity"
        className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-charcoal/5 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}