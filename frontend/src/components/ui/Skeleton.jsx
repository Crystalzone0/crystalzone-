import { cn } from '../../utils/cn.js';

/** Loading placeholder. Size it with className, e.g. <Skeleton className="h-4 w-24" /> */
export default function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}