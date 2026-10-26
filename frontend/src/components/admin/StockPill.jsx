import { cn } from '../../utils/cn.js';

/** status: "in" | "low" | "out" (as the inventory API returns it). */
export default function StockPill({ status, stock }) {
  const tone =
    status === 'out' ? 'bg-red-50 text-red-700' : status === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';
  const text = status === 'out' ? 'Out of stock' : status === 'low' ? `Low: ${stock} left` : `${stock} in stock`;

  return <span className={cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', tone)}>{text}</span>;
}