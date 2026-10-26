import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, description, actions, backTo, backLabel = 'Back' }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {backTo && (
          <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-sm text-charcoal/60 transition hover:text-gold-dark">
            <ArrowLeft size={15} aria-hidden="true" /> {backLabel}
          </Link>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-charcoal/60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}