import { cn } from '../../utils/cn.js';

/** Pill-shaped filter tabs with counts. tabs: [{ value, label, count? }] ("" = the "All" tab). */
export default function StatusTabs({ tabs, value, onChange, label = 'Filter by status' }) {
  return (
    <div role="group" aria-label={label} className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value || 'all'}
            type="button"
            onClick={() => onChange(tab.value)}
            aria-pressed={active}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm transition',
              active ? 'bg-ink text-white' : 'bg-white text-charcoal shadow-soft hover:bg-gold/15'
            )}
          >
            {tab.label}
            {tab.count != null && <span className={cn('ml-2 text-xs', active ? 'text-gold' : 'text-charcoal/50')}>{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}