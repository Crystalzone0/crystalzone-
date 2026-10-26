import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const STYLES = {
  error: { box: 'border-red-200 bg-red-50 text-red-800', Icon: AlertTriangle },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  info: { box: 'border-gold/40 bg-gold/10 text-charcoal', Icon: Info },
};

export default function Alert({ variant = 'error', className, children }) {
  const { box, Icon } = STYLES[variant] || STYLES.info;
  return (
    <div role={variant === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', box, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}