import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn.js';

/** CZ monogram + wordmark. variant="light" is for dark backgrounds. Shrinks on phones so the header never overflows. */
export default function Logo({ variant = 'dark', className, showTagline = true }) {
  const light = variant === 'light';

  return (
    <Link to="/" className={cn('inline-flex min-w-0 items-center gap-2.5 sm:gap-3', className)} aria-label="Crystal Zone - home">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border sm:h-10 sm:w-10',
          light ? 'border-gold bg-white/5' : 'border-gold bg-ink'
        )}
      >
        <span className="font-serif text-base font-bold leading-none text-gold sm:text-lg">CZ</span>
      </span>
      <span className="min-w-0 leading-none">
        <span
          className={cn(
            'block truncate font-serif text-[0.95rem] font-semibold uppercase tracking-[0.14em] sm:text-2xl sm:tracking-luxe',
            light ? 'text-white' : 'text-ink'
          )}
        >
          Crystal Zone
        </span>
        {showTagline && (
          <span className="mt-1 hidden text-[10px] uppercase tracking-[0.32em] text-gold sm:block">
            Jewellery &amp; Accessories
          </span>
        )}
      </span>
    </Link>
  );
}