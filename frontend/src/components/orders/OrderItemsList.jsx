import { Link } from 'react-router-dom';
import ProductImage from '../product/ProductImage.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { ROUTES } from '../../utils/constants.js';

/** Products of a placed order. `showReview` adds a "Write a review" link (for delivered orders). */
export default function OrderItemsList({ items = [], showReview = false }) {
  const { money } = useSettings();

  return (
    <ul className="divide-y divide-charcoal/10">
      {items.map((item, i) => (
        <li key={`${item.slug}-${i}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
          <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
            <ProductImage src={item.image} alt="" width={200} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            {item.slug ? (
              <Link to={ROUTES.product(item.slug)} className="text-sm font-medium transition hover:text-gold-dark">
                {item.name}
              </Link>
            ) : (
              <p className="text-sm font-medium">{item.name}</p>
            )}
            <p className="mt-0.5 text-xs text-charcoal/60">
              {item.quantity} &times; {money(item.paidPrice)}
            </p>
            {showReview && item.slug && (
              <Link
                to={`${ROUTES.product(item.slug)}#reviews`}
                className="mt-1 inline-block text-xs text-gold-dark underline underline-offset-2 hover:text-ink"
              >
                Write a review
              </Link>
            )}
          </div>
          <p className="shrink-0 text-sm font-medium">{money(item.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}