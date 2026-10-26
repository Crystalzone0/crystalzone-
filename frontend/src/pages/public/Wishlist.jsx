import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, ShoppingBag, X } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import Seo from '../../components/common/Seo.jsx';
import PriceTag from '../../components/product/PriceTag.jsx';
import ProductGrid from '../../components/product/ProductGrid.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

function WishlistItem({ product, moving, onMove, onRemove }) {
  const outOfStock = product.stock <= 0;
  const href = ROUTES.product(product.slug);

  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream-dark">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="block h-full w-full">
          <ProductImage
            src={product.primaryImage}
            alt=""
            width={600}
            sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 46vw"
            className={cn('h-full w-full object-cover transition duration-500 group-hover:scale-105', outOfStock && 'opacity-60')}
          />
        </Link>
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          aria-label={`Remove ${product.name} from wishlist`}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-charcoal shadow-soft transition hover:bg-white hover:text-red-700"
        >
          <X size={18} />
        </button>
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        {product.category?.name && (
          <p className="text-[11px] uppercase tracking-[0.2em] text-charcoal/50">{product.category.name}</p>
        )}
        <h3 className="mt-1 font-serif text-lg leading-snug">
          <Link to={href} className="transition hover:text-gold-dark">
            {product.name}
          </Link>
        </h3>
        <PriceTag product={product} className="mt-2" />

        <Button
          size="sm"
          variant={outOfStock ? 'outline' : 'dark'}
          icon={outOfStock ? undefined : ShoppingBag}
          loading={moving}
          disabled={outOfStock}
          onClick={() => onMove(product)}
          className="mt-3 w-full"
        >
          {outOfStock ? 'Out of stock' : 'Move to cart'}
        </Button>
      </div>
    </article>
  );
}

export default function Wishlist() {
  const { user, loading: authLoading } = useAuth();
  const wishlist = useWishlist();
  const [movingId, setMovingId] = useState(null);

  const query = useQuery({
    queryKey: ['account', 'wishlist', user?._id ?? 'guest'],
    queryFn: wishlist.fetchProducts,
    enabled: !authLoading,
    staleTime: 0, // always fresh prices and stock
    refetchOnMount: 'always',
  });

  // Removing or moving a product updates the heart state, so it disappears here instantly.
  const products = (query.data ?? []).filter((p) => wishlist.isWished(p.id));

  const handleMove = async (product) => {
    setMovingId(product.id);
    try {
      await wishlist.moveToCart(product);
    } finally {
      setMovingId(null);
    }
  };

  let content;
  if (query.isPending) {
    content = <ProductGrid loading skeletonCount={4} />;
  } else if (query.isError) {
    content = <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  } else if (products.length === 0) {
    content = (
      <EmptyState
        icon={Heart}
        title="Your wishlist is empty"
        message="Tap the heart on any piece you love and it will be saved here for later."
        action={<Button to={ROUTES.shop}>Explore the collection</Button>}
      />
    );
  } else {
    content = (
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <WishlistItem
            key={product.id}
            product={product}
            moving={movingId === product.id}
            onMove={handleMove}
            onRemove={wishlist.removeItem}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <Seo title="Your wishlist" noindex />
      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-cz py-8 sm:py-10">
          <Breadcrumbs items={[{ label: 'Home', to: ROUTES.home }, { label: 'Wishlist' }]} />
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">Your wishlist</h1>
          {!user && !authLoading && (
            <p className="mt-3 text-sm text-charcoal/70">
              This wishlist is saved on this device.{' '}
              <Link to={ROUTES.login} state={{ from: { pathname: ROUTES.wishlist } }} className="font-medium underline underline-offset-4 hover:text-gold-dark">
                Log in
              </Link>{' '}
              to keep it with your account.
            </p>
          )}
        </div>
      </section>
      <div className="container-cz py-8 sm:py-12">{content}</div>
    </>
  );
}