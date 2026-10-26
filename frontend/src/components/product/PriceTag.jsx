import { useSettings } from '../../context/SettingsContext.jsx';
import { cn } from '../../utils/cn.js';

const SIZES = {
  sm: { now: 'text-base', was: 'text-xs' },
  md: { now: 'text-lg', was: 'text-sm' },
  lg: { now: 'text-3xl', was: 'text-lg' },
};

/** Sale price + struck-through regular price, or just the regular price. */
export default function PriceTag({ product, size = 'md', className }) {
  const { money } = useSettings();
  const s = SIZES[size] || SIZES.md;

  const onSale = product.salePrice != null && product.salePrice < product.price;
  const current = product.finalPrice ?? (onSale ? product.salePrice : product.price);

  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
      {onSale && <span className="sr-only">Sale price</span>}
      <span className={cn('font-semibold text-ink', s.now)}>{money(current)}</span>
      {onSale && (
        <>
          <span className="sr-only">Regular price</span>
          <s className={cn('text-charcoal/50', s.was)}>{money(product.price)}</s>
        </>
      )}
    </p>
  );
}