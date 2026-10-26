import { Star } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const range = [0, 1, 2, 3, 4];

/** Five stars with partial fill (4.3 stars fills 86% of the row). */
export function Stars({ value = 0, size = 16, className }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));

  return (
    <span className={cn('relative inline-flex', className)} role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`}>
      <span className="flex text-charcoal/20" aria-hidden="true">
        {range.map((i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex overflow-hidden text-gold"
        style={{ width: `${(rating / 5) * 100}%` }}
        aria-hidden="true"
      >
        {range.map((i) => (
          <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}

export default function Rating({ value = 0, count, size = 14, showValue = false, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Stars value={value} size={size} />
      {showValue && <span className="text-sm font-medium">{Number(value).toFixed(1)}</span>}
      {count != null && <span className="text-xs text-charcoal/60">({count})</span>}
    </span>
  );
}