import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart } from 'lucide-react';
import ProductImage from './ProductImage.jsx';
import PriceTag from './PriceTag.jsx';
import Rating from './Rating.jsx';
import QuickView from './QuickView.jsx';
import AddToCartButton from './AddToCartButton.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const BADGE_TONES = {
  gold: 'bg-gold text-ink',
  dark: 'bg-ink text-white',
  light: 'bg-white text-charcoal',
};

function Badge({ tone = 'gold', children }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider', BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

const iconButton =
  'flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-soft transition duration-200 hover:bg-white hover:text-gold-dark active:scale-90';

export default function ProductCard({ product }) {
  const wishlist = useWishlist();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  const outOfStock = product.stock <= 0;
  const wished = wishlist.isWished(product.id);
  const href = ROUTES.product(product.slug);

  const onHeart = () => {
    setPulse(true); // the heart pops once; it never animates on page load
    wishlist.toggle(product);
  };

  return (
    <article className="group relative flex flex-col transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-dark transition-shadow duration-300 group-hover:shadow-lift">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
          <ProductImage
            src={product.primaryImage}
            alt=""
            width={600}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
            className={cn(
              'h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]',
              outOfStock && 'opacity-60'
            )}
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {outOfStock ? (
            <Badge tone="dark">Sold out</Badge>
          ) : (
            <>
              {product.discount > 0 && <Badge>-{product.discount}%</Badge>}
              {product.newArrival && <Badge tone="light">New</Badge>}
              {product.bestSeller && product.discount === 0 && !product.newArrival && <Badge tone="light">Best seller</Badge>}
            </>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={onHeart}
            aria-pressed={wished}
            aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            className={iconButton}
          >
            <Heart
              size={18}
              onAnimationEnd={() => setPulse(false)}
              className={cn('transition-colors duration-200', wished ? 'fill-gold text-gold-dark' : 'text-charcoal', pulse && 'animate-heart')}
            />
          </button>
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            aria-label={`Quick view ${product.name}`}
            className={cn(iconButton, 'lg:translate-y-1 lg:opacity-0 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:opacity-100')}
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        {product.category?.name && (
          <p className="text-[11px] uppercase tracking-[0.22em] text-charcoal/60">{product.category.name}</p>
        )}
        <h3 className="mt-1.5 font-serif text-[1.15rem] leading-snug">
          <Link to={href} className="transition-colors duration-200 hover:text-gold-dark">
            {product.name}
          </Link>
        </h3>

        {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} className="mt-2" />}

        <PriceTag product={product} className="mt-2.5" />

        <AddToCartButton product={product} size="sm" className="mt-4 w-full" />
      </div>

      {quickViewOpen && <QuickView product={product} onClose={() => setQuickViewOpen(false)} />}
    </article>
  );
}