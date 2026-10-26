import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Reveal from './Reveal.jsx';
import { cn } from '../../utils/cn.js';

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  to,
  linkLabel = 'View all',
  align = 'left',
  light = false,
  className,
}) {
  const centered = align === 'center';

  return (
    <Reveal
      className={cn(
        'mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10',
        centered && 'flex-col items-center text-center',
        className
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <p className={cn('text-xs uppercase tracking-[0.3em]', light ? 'text-gold' : 'text-gold-dark')}>{eyebrow}</p>
        )}
        <h2 className={cn('mt-2 font-serif text-3xl sm:text-4xl', light && 'text-white')}>{title}</h2>
        {subtitle && (
          <p className={cn('mt-3 text-sm leading-relaxed sm:text-base', light ? 'text-cream/70' : 'text-charcoal/70')}>
            {subtitle}
          </p>
        )}
      </div>

      {to && (
        <Link
          to={to}
          className={cn(
            'group inline-flex items-center gap-2 text-sm font-medium transition',
            light ? 'text-gold hover:text-white' : 'text-charcoal hover:text-gold-dark'
          )}
        >
          {linkLabel}
          <ArrowRight size={16} className="transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      )}
    </Reveal>
  );
}