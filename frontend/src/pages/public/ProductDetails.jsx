import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Heart, MessageCircle, ShoppingBag, Truck } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import Seo from '../../components/common/Seo.jsx';
import ImageGallery from '../../components/product/ImageGallery.jsx';
import PriceTag from '../../components/product/PriceTag.jsx';
import ProductReviews from '../../components/product/ProductReviews.jsx';
import QuantitySelector from '../../components/product/QuantitySelector.jsx';
import StickyBuyBar from '../../components/product/StickyBuyBar.jsx';
import Rating from '../../components/product/Rating.jsx';
import { RecentlyViewed, RelatedProducts } from '../../components/product/RelatedProducts.jsx';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import NotFound from '../errors/NotFound.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { recordRecentlyViewed } from '../../hooks/useRecentlyViewed.js';
import * as catalogApi from '../../services/catalogApi.js';
import { absoluteUrl, orderedImages } from '../../utils/image.js';
import { MAX_LINE_QUANTITY, ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';
import AddToCartButton from '../../components/product/AddToCartButton.jsx';

const LOW_STOCK = 5;

function DetailsSkeleton() {
  return (
    <div className="container-cz py-8 sm:py-12" aria-hidden="true">
      <Skeleton className="h-4 w-64" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings, money, whatsappLink } = useSettings();
  const { addItem, isBusy } = useCart();
  const wishlist = useWishlist();
    const [qty, setQty] = useState(1);
  const buyRef = useRef(null); // the Add to cart / Buy now row, watched by the sticky bar
  const query = useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogApi.getProduct(slug).then((res) => res.product),
  });
  const product = query.data;

  useEffect(() => setQty(1), [slug]);
  useEffect(() => {
    if (product?.slug) recordRecentlyViewed(product.slug);
  }, [product?.slug]);

  if (query.isPending) return <DetailsSkeleton />;
  if (query.error?.status === 404) return <NotFound />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-24" />;

  const outOfStock = product.stock <= 0;
  const max = Math.min(product.stock, MAX_LINE_QUANTITY);
  const quantity = Math.min(qty, Math.max(max, 1));
  const wished = wishlist.isWished(product.id);
  const images = orderedImages(product);
  const category = product.category;
  const onSale = product.discount > 0 && product.salePrice != null;
  const url = absoluteUrl(ROUTES.product(product.slug));

  const handleAdd = () => addItem(product, quantity);

  // "Buy now" checks out just this item and leaves the cart untouched (checkout reads this state).
  const handleBuyNow = () => {
    if (outOfStock) return;
    navigate(ROUTES.checkout, { state: { buyNow: { productId: product.id, quantity } } });
  };

  const chatLink = whatsappLink(
    outOfStock
      ? `Hello Crystal Zone! "${product.name}" (SKU: ${product.sku}) is out of stock. Will it be available again? ${url}`
      : `Hello Crystal Zone! I am interested in "${product.name}" (SKU: ${product.sku}). ${url}`
  );

  const crumbs = [
    { label: 'Home', to: ROUTES.home },
    { label: 'Shop', to: ROUTES.shop },
    ...(category ? [{ label: category.name, to: ROUTES.category(category.slug) }] : []),
    { label: product.name },
  ];

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      sku: product.sku,
      ...(images.length ? { image: images.map(absoluteUrl) } : {}),
      ...(category ? { category: category.name } : {}),
      brand: { '@type': 'Brand', name: settings.storeName },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: settings.currency,
        price: product.finalPrice ?? product.price,
        availability: outOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
      ...(product.reviewCount > 0
        ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount } }
        : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.label,
        ...(c.to ? { item: absoluteUrl(c.to) } : {}),
      })),
    },
  ];

  return (
    <>
      <Seo
        title={product.name}
        description={product.description.replace(/\s+/g, ' ').slice(0, 155)}
        image={images[0]}
        path={ROUTES.product(product.slug)}
        type="product"
        jsonLd={jsonLd}
      />

      <div className="container-cz py-8 sm:py-12">
        <Breadcrumbs items={crumbs} />

        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <ImageGallery key={product.id} images={images} alt={product.name} />

          <div className="lg:pt-2">
            {category && (
              <Link
                to={ROUTES.category(category.slug)}
                className="text-xs uppercase tracking-[0.25em] text-gold-dark transition hover:text-ink"
              >
                {category.name}
              </Link>
            )}
            <h1 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">{product.name}</h1>

            <div className="mt-3">
              {product.reviewCount > 0 ? (
                <a href="#reviews" className="inline-block transition hover:opacity-80">
                  <Rating value={product.rating} count={product.reviewCount} size={16} showValue />
                </a>
              ) : (
                <a href="#reviews" className="text-sm text-charcoal/60 underline-offset-4 hover:underline">
                  No reviews yet
                </a>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <PriceTag product={product} size="lg" />
              {onSale && (
                <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink">
                  Save {product.discount}%
                </span>
              )}
            </div>
            {onSale && (
              <p className="mt-1 text-sm text-charcoal/60">You save {money(product.price - product.salePrice)} on this piece.</p>
            )}

            <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-charcoal/75">{product.description}</p>
            <a href="#description" className="mt-1 inline-block text-sm underline underline-offset-4 hover:text-gold-dark">
              Read more
            </a>

            <p className="mt-5">
              {outOfStock ? (
                <span className="inline-flex rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-red-700">
                  OUT OF STOCK
                </span>
              ) : (
                <span
                  className={cn(
                    'inline-flex items-center gap-2 text-sm font-medium',
                    product.stock <= LOW_STOCK ? 'text-amber-700' : 'text-emerald-700'
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', product.stock <= LOW_STOCK ? 'bg-amber-500' : 'bg-emerald-500')} />
                  {product.stock <= LOW_STOCK ? `Only ${product.stock} left in stock` : 'In stock'}
                </span>
              )}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <QuantitySelector value={quantity} onChange={setQty} max={max} disabled={outOfStock} />
              <p className="text-xs text-charcoal/50">SKU: {product.sku}</p>
            </div>

           <div ref={buyRef} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                icon={ShoppingBag}
                loading={isBusy(product.id)}
                disabled={outOfStock}
                onClick={handleAdd}
                className="flex-1"
              >
<AddToCartButton product={product} quantity={quantity} size="lg" variant="gold" className="flex-1" />
                Buy now
              </Button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button variant="outline" icon={Heart} onClick={() => wishlist.toggle(product)} aria-pressed={wished}>
                {wished ? 'Saved to wishlist' : 'Add to wishlist'}
              </Button>
              <Button variant="outline" icon={MessageCircle} href={chatLink}>
                {outOfStock ? 'Ask about restock' : 'Ask on WhatsApp'}
              </Button>
            </div>

            <ul className="mt-8 space-y-3 rounded-2xl bg-white p-5 text-sm shadow-soft">
              <li className="flex items-center gap-3">
                <Banknote size={18} className="shrink-0 text-gold-dark" aria-hidden="true" />
                Cash on Delivery available
              </li>
              {settings.freeShippingThreshold > 0 && (
                <li className="flex items-center gap-3">
                  <Truck size={18} className="shrink-0 text-gold-dark" aria-hidden="true" />
                  Free delivery over {money(settings.freeShippingThreshold)}
                </li>
              )}
              <li className="flex items-center gap-3">
                <MessageCircle size={18} className="shrink-0 text-gold-dark" aria-hidden="true" />
                Questions? Message us on WhatsApp
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 grid gap-12 border-t border-charcoal/10 pt-12 lg:grid-cols-2">
          <section id="description" className="scroll-mt-28">
            <h2 className="font-serif text-2xl sm:text-3xl">Description</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-charcoal/80">{product.description}</p>
            {product.tags?.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
                {product.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      to={`${ROUTES.shop}?q=${encodeURIComponent(tag)}`}
                      className="rounded-full bg-cream-dark px-3 py-1 text-xs text-charcoal/70 transition hover:bg-gold/20 hover:text-ink"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="specifications" className="scroll-mt-28">
            <h2 className="font-serif text-2xl sm:text-3xl">Specifications</h2>
            <dl className="mt-4 divide-y divide-charcoal/10 text-sm">
              {product.specifications?.map((spec) => (
                <div key={spec.key} className="grid grid-cols-3 gap-4 py-3">
                  <dt className="text-charcoal/60">{spec.key}</dt>
                  <dd className="col-span-2">{spec.value}</dd>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-charcoal/60">SKU</dt>
                <dd className="col-span-2">{product.sku}</dd>
              </div>
              {category && (
                <div className="grid grid-cols-3 gap-4 py-3">
                  <dt className="text-charcoal/60">Category</dt>
                  <dd className="col-span-2">{category.name}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <section id="reviews" className="mt-16 scroll-mt-28 border-t border-charcoal/10 pt-12">
          <h2 className="mb-8 font-serif text-2xl sm:text-3xl">Customer reviews</h2>
          <ProductReviews product={product} />
        </section>
      </div>

      {!outOfStock && <StickyBuyBar product={product} busy={isBusy(product.id)} onAdd={handleAdd} targetRef={buyRef} />}
      <RelatedProducts slug={product.slug} />
      <RecentlyViewed excludeSlug={product.slug} />
    </>
  );
}