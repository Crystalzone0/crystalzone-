import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn.js';

const TONES = {
  gold: 'bg-gold/15 text-gold-dark',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-700',
  dark: 'bg-ink text-gold',
};

export default function StatCard({ label, value, hint, icon: Icon, tone = 'gold', to }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-charcoal/60">{label}</p>
        {Icon && (
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', TONES[tone])}>
            <Icon size={17} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 truncate font-serif text-2xl sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-charcoal/50">{hint}</p>}
    </>
  );

  const classes = 'block rounded-2xl bg-white p-5 shadow-soft';

  return to ? (
    <Link to={to} className={cn(classes, 'transition hover:shadow-lift')}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}