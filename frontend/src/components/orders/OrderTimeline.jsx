import { Check, X } from 'lucide-react';
import { ORDER_STEPS } from '../../utils/orders.js';
import { formatDateTime } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

/**
 * Vertical progress timeline built from the order's real status history.
 * A cancelled order shows exactly the steps it went through, ending in "Cancelled".
 */
export default function OrderTimeline({ status, history = [] }) {
  if (status === 'Cancelled') {
    return (
      <ol className="space-y-5">
        {history.map((entry, i) => {
          const cancelled = entry.status === 'Cancelled';
          return (
            <li key={`${entry.status}-${i}`} className="flex items-start gap-3">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                  cancelled ? 'bg-red-100 text-red-700' : 'bg-gold text-ink'
                )}
              >
                {cancelled ? <X size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
              </span>
              <div>
                <p className={cn('text-sm font-medium', cancelled && 'text-red-700')}>{entry.status}</p>
                <p className="text-xs text-charcoal/60">{formatDateTime(entry.at)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  const times = new Map();
  for (const entry of history) times.set(entry.status, entry.at);
  const current = ORDER_STEPS.indexOf(status);

  return (
    <ol>
      {ORDER_STEPS.map((step, i) => {
        const done = i <= current;
        const isCurrent = i === current;
        const last = i === ORDER_STEPS.length - 1;

        return (
          <li key={step} className="relative pb-7 pl-11 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
            {!last && (
              <span
                aria-hidden="true"
                className={cn('absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px', i < current ? 'bg-gold' : 'bg-charcoal/15')}
              />
            )}
            <span
              className={cn(
                'absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2',
                done ? 'border-gold bg-gold text-ink' : 'border-charcoal/20 bg-white text-transparent',
                isCurrent && 'ring-4 ring-gold/25'
              )}
            >
              <Check size={14} aria-hidden="true" />
            </span>
            <p className={cn('text-sm', done ? 'font-medium text-ink' : 'text-charcoal/50')}>{step}</p>
            {times.get(step) && <p className="text-xs text-charcoal/60">{formatDateTime(times.get(step))}</p>}
          </li>
        );
      })}
    </ol>
  );
}