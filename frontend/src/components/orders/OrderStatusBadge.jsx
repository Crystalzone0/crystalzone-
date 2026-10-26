import { statusTone } from '../../utils/orders.js';
import { cn } from '../../utils/cn.js';

export default function OrderStatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider',
        statusTone(status),
        className
      )}
    >
      {status}
    </span>
  );
}