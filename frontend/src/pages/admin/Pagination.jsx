import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn.js';

function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const wanted = [...new Set([1, pages, page - 1, page, page + 1])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const list = [];
  wanted.forEach((n, i) => {
    if (i > 0 && n - wanted[i - 1] > 1) list.push('gap');
    list.push(n);
  });
  return list;
}

const arrow =
  'flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/15 bg-white transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-charcoal/15';

/** Numbered pagination. `pagination` is the object the API returns: { page, limit, total, pages }. */
export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.total === 0) return null;

  const { page, limit, total, pages } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-charcoal/60" aria-live="polite">
        Showing {from}-{to} of {total}
      </p>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1.5">
          <button type="button" className={arrow} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft size={18} />
          </button>

          {pageList(page, pages).map((item, i) =>
            item === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-charcoal/40" aria-hidden="true">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPage(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  'h-10 min-w-[2.5rem] rounded-full px-3 text-sm transition',
                  item === page ? 'bg-ink text-white' : 'border border-charcoal/15 bg-white hover:border-gold'
                )}
              >
                {item}
              </button>
            )
          )}

          <button type="button" className={arrow} onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
            <ChevronRight size={18} />
          </button>
        </nav>
      )}
    </div>
  );
}