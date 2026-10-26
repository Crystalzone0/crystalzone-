import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/** items: [{ label, to? }]. The last item is the current page (no link). */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-charcoal/60">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.to && !last ? (
                <Link to={item.to} className="transition hover:text-gold-dark">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'text-charcoal' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight size={12} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}