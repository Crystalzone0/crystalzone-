import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import Seo from '../../components/common/Seo.jsx';
import CartLine from '../../components/cart/CartLine.jsx';
import CartSummary from '../../components/cart/CartSummary.jsx';
import FreeShippingBar from '../../components/cart/FreeShippingBar.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { ROUTES } from '../../utils/constants.js';

function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]" aria-hidden="true">
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-28 w-24 shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

export default function Cart() {
  const { cart, items, summary, count, loading, error, refresh, updateQuantity, removeItem, clearCart, isBusy } = useCart();

  // Always show fresh prices and stock when the cart page opens.
  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const canCheckout = items.some((item) => item.available);
  const hasOutOfStock = items.some((item) => !item.available);

  const handleClear = async () => {
    if (!window.confirm('Remove all items from your cart?')) return;
    if (await clearCart()) toast.success('Cart cleared');
  };

  let content;

  if (loading && items.length === 0) {
    content = <CartSkeleton />;
  } else if (error && items.length === 0) {
    content = <ErrorState error={error} onRetry={() => refresh().catch(() => {})} />;
  } else if (items.length === 0) {
    content = (
      <EmptyState
        icon={ShoppingBag}
        title="Your cart is empty"
        message={
          cart.removedCount > 0
            ? 'The items in your cart are no longer available. Explore our collection to find something you love.'
            : 'Looks like you have not added anything yet. Explore our collection and find something you love.'
        }
        action={<Button to={ROUTES.shop}>Start shopping</Button>}
      />
    );
  } else {
    content = (
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start lg:gap-12">
        <div>
          <div className="space-y-3 empty:hidden">
            {cart.removedCount > 0 && (
              <Alert variant="info">
                {cart.removedCount === 1 ? 'An item was' : `${cart.removedCount} items were`} no longer available and removed from your cart.
              </Alert>
            )}
            {hasOutOfStock && (
              <Alert>Some items are out of stock. Remove them to continue to checkout.</Alert>
            )}
          </div>

          <ul className="divide-y divide-charcoal/10 border-y border-charcoal/10">
            {items.map((line) => (
              <CartLine
                key={line.productId}
                line={line}
                busy={isBusy(line.productId)}
                onQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
            <Link to={ROUTES.shop} className="underline underline-offset-4 transition hover:text-gold-dark">
              &larr; Continue shopping
            </Link>
            <button type="button" onClick={handleClear} className="text-charcoal/60 transition hover:text-red-700">
              Clear cart
            </button>
          </div>
        </div>

        <aside className="rounded-3xl bg-white p-6 shadow-soft lg:sticky lg:top-28" aria-label="Order summary">
          <h2 className="mb-5 font-serif text-2xl">Order summary</h2>
          <FreeShippingBar summary={summary} />
          <CartSummary summary={summary} />
          <Button to={ROUTES.checkout} size="lg" disabled={!canCheckout} className="mt-6 w-full">
            Proceed to checkout
          </Button>
          <p className="mt-4 text-center text-xs text-charcoal/60">Cash on Delivery available. No online payment needed.</p>
        </aside>
      </div>
    );
  }

  return (
    <>
      <Seo title="Your cart" noindex />
      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-cz py-8 sm:py-10">
          <Breadcrumbs items={[{ label: 'Home', to: ROUTES.home }, { label: 'Cart' }]} />
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">
            Your cart{count > 0 && <span className="ml-2 text-2xl text-charcoal/50">({count})</span>}
          </h1>
        </div>
      </section>
      <div className="container-cz py-8 sm:py-12">{content}</div>
    </>
  );
}