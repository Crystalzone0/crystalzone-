import { useEffect, useId, useState } from 'react';
import { Search } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { cn } from '../../utils/cn.js';

const AVAILABILITY = [
  { value: '', label: 'All products' },
  { value: 'in-stock', label: 'In stock' },
  { value: 'out-of-stock', label: 'Out of stock' },
];

const numText = (n) => (n === '' || n == null ? '' : String(n));

function toWhole(text) {
  const trimmed = String(text).trim();
  if (!trimmed) return '';
  const n = Math.floor(Number(trimmed));
  return Number.isFinite(n) && n >= 0 ? n : '';
}

const rowClass = (active) =>
  cn(
    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition',
    active ? 'bg-gold/15 font-medium text-gold-dark' : 'hover:bg-charcoal/5'
  );

/**
 * Search, category, price, sale and availability filters.
 * It never talks to the API: it reports changes through onChange / onSelectCategory / onClear,
 * and the Shop page keeps everything in the URL.
 */
export default function FilterPanel({
  params,
  categories,
  activeCategory,
  priceRange,
  onChange,
  onSelectCategory,
  onClear,
  activeCount,
}) {
  const uid = useId();
  const { money } = useSettings();

  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebounce(search, 400);
  const [minPrice, setMinPrice] = useState(numText(params.minPrice));
  const [maxPrice, setMaxPrice] = useState(numText(params.maxPrice));

  // URL -> inputs (back button, "clear filters", header search)
  useEffect(() => setSearch(params.q), [params.q]);
  useEffect(() => {
    setMinPrice(numText(params.minPrice));
    setMaxPrice(numText(params.maxPrice));
  }, [params.minPrice, params.maxPrice]);

  // inputs -> URL (after the visitor stops typing)
  useEffect(() => {
    if (debouncedSearch.trim() !== params.q) onChange({ q: debouncedSearch.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const applyPrice = (event) => {
    event.preventDefault();
    let min = toWhole(minPrice);
    let max = toWhole(maxPrice);
    if (min !== '' && max !== '' && min > max) [min, max] = [max, min];
    onChange({ minPrice: min, maxPrice: max });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">Filters</h2>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="text-sm text-gold-dark underline underline-offset-4 hover:text-ink">
            Clear all
          </button>
        )}
      </div>

      <div role="search">
        <label htmlFor={`${uid}-search`} className="field-label">
          Search
        </label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" aria-hidden="true" />
          <input
            id={`${uid}-search`}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={80}
            placeholder="Name, SKU or keyword"
            className="input pl-10"
          />
        </div>
      </div>

      <fieldset>
        <legend className="field-label">Category</legend>
        <ul className="space-y-1">
          <li>
            <button type="button" onClick={() => onSelectCategory('')} aria-pressed={!activeCategory} className={rowClass(!activeCategory)}>
              All categories
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelectCategory(c.slug)}
                aria-pressed={activeCategory === c.slug}
                className={rowClass(activeCategory === c.slug)}
              >
                {c.name}
                <span className="text-xs text-charcoal/50">{c.productCount}</span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <form onSubmit={applyPrice}>
        <p className="field-label">Price</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            aria-label="Minimum price"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="input px-3"
          />
          <span className="text-charcoal/40" aria-hidden="true">-</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            aria-label="Maximum price"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="input px-3"
          />
        </div>
        {priceRange && priceRange.max > 0 && (
          <p className="mt-2 text-xs text-charcoal/60">
            Our range: {money(priceRange.min)} to {money(priceRange.max)}
          </p>
        )}
        <button type="submit" className="btn-outline btn-sm mt-3 w-full">
          Apply price
        </button>
      </form>

      <fieldset>
        <legend className="field-label">Offers</legend>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-charcoal/5">
          <input
            type="checkbox"
            checked={params.onSale}
            onChange={(e) => onChange({ onSale: e.target.checked ? 'true' : '' })}
            className="h-4 w-4 accent-gold"
          />
          On sale only
        </label>
      </fieldset>

      <fieldset>
        <legend className="field-label">Availability</legend>
        {AVAILABILITY.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-charcoal/5">
            <input
              type="radio"
              name={`${uid}-availability`}
              checked={params.availability === option.value}
              onChange={() => onChange({ availability: option.value })}
              className="h-4 w-4 accent-gold"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}