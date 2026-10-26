import { paymentLabel, paymentTone } from '../../utils/adminLists.js';
import { cn } from '../../utils/cn.js';

export default function PaymentBadge({ status, className }) {
  return (
    <span className={cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', paymentTone(status), className)}>
      {paymentLabel(status)}
    </span>
  );
}