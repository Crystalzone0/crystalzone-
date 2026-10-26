import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import ProductImage from '../product/ProductImage.jsx';
import PriceTag from '../product/PriceTag.jsx';
import QuantitySelector from '../product/QuantitySelector.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

/** One product in the cart. `line` is a cart line from the API. */
export default function CartLine({ line, busy, onQuantity, onRemove }) {
  const { money } = useSettings();
  const href = ROUTES.product(line.slug);

  return (
    <li className="flex gap-4 py-6 sm:gap-6">
      <Link to={href} tabIndex={-1} aria-hidden="true" className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-dark sm:h-36 sm:w-28">
        <ProductImage
          src={line.image}
          alt=""
          width={300}
          className={cn('h-full w-full object-cover', !line.available && 'opacity-50')}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.category && <p className="text-[11px] uppercase tracking-[0.2em] text-charcoal/50">{line.category}</p>}
            <h3 className="font-serif text-lg leading-snug">
              <Link to={href} className="transition hover:text-gold-dark">
                {line.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-xs text-charcoal/50">SKU: {line.sku}</p>
          </div>
          {line.available && <p className="shrink-0 text-right font-semibold">{money(line.lineTotal)}</p>}
        </div>

        <PriceTag product={line} size="sm" className="mt-2" />

        {!line.available ? (
          <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-red-700" role="alert">
            OUT OF STOCK. Remove it to continue.
          </p>
        ) : line.adjusted ? (
          <p className="mt-2 text-sm text-amber-700" role="status">
            Only {line.maxQuantity} available, so we updated the quantity.
          </p>
        ) : line.stock <= 5 ? (
          <p className="mt-2 text-xs text-amber-700">Only {line.stock} left in stock</p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <QuantitySelector
            value={line.quantity}
            max={line.maxQuantity}
            disabled={busy || !line.available}
            onChange={(quantity) => onQuantity(line.productId, quantity)}
          />
          <button
            type="button"
            onClick={() => onRemove(line.productId)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm text-charcoal/60 transition hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 size={16} aria-hidden="true" />
            Remove
            <span className="sr-only"> {line.name} from cart</span>
          </button>
        </div>
      </div>
    </li>
  );
}