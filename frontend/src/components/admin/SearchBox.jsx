import { Search } from 'lucide-react';
import { cn } from '../../utils/cn.js';

export default function SearchBox({ value, onChange, placeholder = 'Search', label = 'Search', className }) {
  return (
    <div role="search" className={cn('relative', className)}>
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={80}
        placeholder={placeholder}
        aria-label={label}
        className="input py-2.5 pl-10"
      />
    </div>
  );
}