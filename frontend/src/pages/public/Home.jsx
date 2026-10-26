import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Gem, Gift, Heart, MessageCircle, Sparkles, Truck } from 'lucide-react';
import Seo from '../../components/common/Seo.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import NewsletterForm from '../../components/common/NewsletterForm.jsx';
import ProductSection from '../../components/product/ProductSection.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import { Stars } from '../../components/product/Rating.jsx';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import * as catalogApi from '../../services/catalogApi.js';
import * as engagementApi from '../../services/engagementApi.js';
import { ROUTES } from '../../utils/constants.js';
import Hero from '../../components/home/Hero.jsx';
const HOME_LIMIT = 4;


// ------------------------------------------------------------------ categories

function CategoryTile({ category }) {
  const hasImage = Boolean(category.image?.url);

  return (
    <Link to={ROUTES.category(category.slug)} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-charcoal">
      {hasImage ? (
        <ProductImage
          src={category.image.url}
          alt=""
          width={600}
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
          className="h-full w-full object-cover opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-8xl text-gold/25">{category.name.charAt(0)}</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-4 pt-14 sm:p-5">
        <h3 className="font-serif text-xl text-white sm:text-2xl">{category.name}</h3>
        <p className="mt-0.5 text-xs text-cream/70">
          {category.productCount} {category.productCount === 1 ? 'piece' : 'pieces'}
        </p>
      </div>
    </Link>
  );
}

function Categories({ query }) {
  if (query.isError) return null; // the header menu already reports this problem
  if (query.isSuccess && query.data.categories.length === 0) return null;

  return (
    <section className="bg-[#161411] py-14 text-cream sm:py-20" aria-labelledby="categories-heading">
      <div className="container-cz">
        <div className="mb-10 text-center sm:mb-12">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">Shop by category</p>
          <div className="mt-3 flex items-center justify-center gap-4 sm:gap-8">
            <span aria-hidden="true" className="hidden h-px w-16 bg-gold/50 sm:block lg:w-28" />
            <h2 id="categories-heading" className="font-serif text-3xl text-cream sm:text-4xl">Browse Our Categories</h2>
            <span aria-hidden="true" className="hidden h-px w-16 bg-gold/50 sm:block lg:w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {query.isPending
            ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl !bg-white/10" />)
            : query.data.categories.map((c) => <CategoryTile key={c.id} category={c} />)}
        </div>
        <div className="mt-10 text-center">
          <Link
            to={ROUTES.shop}
            className="inline-flex min-h-[3rem] items-center rounded-full border border-gold px-8 text-xs font-medium uppercase tracking-[0.22em] text-gold-light transition-colors duration-300 hover:bg-gold hover:text-ink"
          >
            View all products
          </Link>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ promo, lifestyle, benefits, reviews

function PromoBanner({ saleCount }) {
  if (!saleCount) return null;

  return (
    <section className="container-cz">
      <div className="relative overflow-hidden rounded-3xl bg-charcoal px-6 py-12 text-center sm:px-12 sm:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border border-gold/20" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full border border-gold/20" />
        <p className="relative text-xs uppercase tracking-[0.35em] text-gold">Limited offers</p>
        <h2 className="relative mt-3 font-serif text-4xl text-white sm:text-5xl">Sparkle for less</h2>
        <p className="relative mx-auto mt-3 max-w-md text-sm text-cream/75 sm:text-base">
          {saleCount} {saleCount === 1 ? 'piece is' : 'pieces are'} on sale right now. Grab your favourites before they are gone.
        </p>
        <Button to={`${ROUTES.shop}?onSale=true`} size="lg" className="relative mt-7">
          Shop the sale
        </Button>
      </div>
    </section>
  );
}

const OCCASIONS = [
  { icon: Sparkles, title: 'Everyday elegance', text: 'Light, easy pieces that go from morning to evening.' },
  { icon: Heart, title: 'Festive sparkle', text: 'Statement earrings, bangles and lockets for special days.' },
  { icon: Gift, title: 'Thoughtful gifting', text: 'Something beautiful for someone you love, delivered to their door.' },
];

function Lifestyle({ products }) {
  const tiles = [0, 1, 2].map((i) => products[i]);

  const tile = (product, className) =>
    product ? (
      <Link key={product.id} to={ROUTES.product(product.slug)} className={`group block overflow-hidden rounded-2xl bg-cream-dark ${className}`}>
        <ProductImage
          src={product.primaryImage}
          alt={product.name}
          width={600}
          sizes="(min-width: 1024px) 22vw, 45vw"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
    ) : (
      <div aria-hidden="true" className={`flex items-center justify-center rounded-2xl bg-cream-dark text-gold ${className}`}>
        <Gem size={36} strokeWidth={1.25} />
      </div>
    );

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container-cz grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="grid grid-cols-2 gap-4">
          {tile(tiles[0], 'aspect-[3/4]')}
          <div className="mt-10 space-y-4">
            {tile(tiles[1], 'aspect-square')}
            {tile(tiles[2], 'aspect-[4/5]')}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">The Crystal Zone way</p>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Jewellery made to be worn, gifted and remembered</h2>
          <p className="mt-4 text-sm leading-relaxed text-charcoal/75 sm:text-base">
            Great style should not be reserved for special occasions. Our pieces are chosen to make ordinary moments feel
            a little brighter, and special ones unforgettable.
          </p>

          <ul className="mt-8 space-y-5">
            {OCCASIONS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-serif text-lg">{title}</h3>
                  <p className="text-sm text-charcoal/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>

          <Button to={ROUTES.shop} variant="dark" size="lg" className="mt-9">
            Explore the collection
          </Button>
        </div>
      </div>
    </section>
  );
}

function WhyChoose({ freeShippingThreshold, money }) {
  const items = [
    { icon: Banknote, title: 'Cash on Delivery', text: 'Pay when your order reaches your door. No online payment needed.' },
    { icon: Gem, title: 'Elegant, affordable designs', text: 'Beautiful artificial jewellery that looks stunning without the luxury price tag.' },
    freeShippingThreshold > 0
      ? { icon: Truck, title: `Free delivery over ${money(freeShippingThreshold)}`, text: 'Enjoy free delivery once your order total reaches the amount.' }
      : { icon: Truck, title: 'Delivered to your door', text: 'Order online and we bring your jewellery to your address.' },
    { icon: MessageCircle, title: 'Friendly WhatsApp support', text: 'Not sure what to choose? Message us and we will happily help.' },
  ];

  return (
    <section className="py-16 sm:py-24">
      <div className="container-cz">
        <SectionHeading align="center" eyebrow="Why Crystal Zone" title="Shop with confidence" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white p-6 text-center shadow-soft">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                <Icon size={12} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-serif text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reviews({ reviews }) {
  if (!reviews || reviews.length === 0) return null; // never show made-up reviews

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container-cz">
        <SectionHeading align="center" eyebrow="Kind words" title="Loved by our customers" />
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.slice(0, 3).map((review) => (
            <figure key={review.id} className="flex h-full flex-col rounded-2xl bg-cream p-6">
              <Stars value={review.rating} size={18} />
              <blockquote className="mt-4 line-clamp-6 flex-1 text-sm leading-relaxed text-charcoal/80">
                {review.comment}
              </blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-medium">{review.name}</span>
                <span className="text-charcoal/50"> on </span>
                <Link to={ROUTES.product(review.product.slug)} className="underline-offset-2 transition hover:text-gold-dark hover:underline">
                  {review.product.name}
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="bg-charcoal py-16 text-center sm:py-20">
      <div className="container-cz">
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Stay in the loop</p>
        <h2 className="mt-3 font-serif text-3xl text-white sm:text-4xl">New arrivals and special offers</h2>
        <p className="mx-auto mb-8 mt-3 max-w-md text-sm text-cream/70">
          Join our list to hear about new collections and sales first.
        </p>
        <NewsletterForm />
      </div>
    </section>
  );
}

function WhatsAppCta({ link }) {
  return (
    <section className="bg-gold py-14 text-center">
      <div className="container-cz">
        <h2 className="font-serif text-3xl text-ink sm:text-4xl">Need help choosing the perfect piece?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink/80">
          Send us a message on WhatsApp. We are happy to help with sizes, gifts and orders.
        </p>
        <Button href={link} variant="dark" size="s" icon={MessageCircle} className="mt-7">
          Chat on WhatsApp
        </Button>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ page

export default function Home() {
  const { settings, money, whatsappLink } = useSettings();

  const home = useQuery({ queryKey: ['home'], queryFn: () => catalogApi.getHome(HOME_LIMIT) });
  const filters = useQuery({ queryKey: ['filters'], queryFn: catalogApi.getFilters, staleTime: 60_000 });
  const sale = useQuery({
    queryKey: ['on-sale-count'],
    queryFn: () => catalogApi.getProducts({ onSale: 'true', limit: 1 }).then((res) => res.pagination.total),
  });
  const reviews = useQuery({
    queryKey: ['featured-reviews'],
    queryFn: () => engagementApi.getFeaturedReviews().then((res) => res.reviews),
    staleTime: 5 * 60 * 1000,
  });

  const loading = home.isPending;
  const data = home.data || {};
  const featured = data.featured || [];
  const bestSellers = data.bestSellers || [];
  const newArrivals = data.newArrivals || [];
  const trending = data.trending || [];

  const chat = whatsappLink('Hello Crystal Zone! I would like some help.');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.storeName,
    url: window.location.origin,
    telephone: settings.phone,
    email: settings.email,
  };

  return (
    <>
      <Seo
        description="Crystal Zone: elegant artificial jewellery and fashion accessories. Shop earrings, rings, lockets, watches, bracelets, bangles and bags with Cash on Delivery."
        jsonLd={jsonLd}
      />

      <Hero whatsappLink={chat} />
      <Categories query={filters} />

      {home.isError ? (
        <ErrorState error={home.error} onRetry={() => home.refetch()} title="We could not load our collection" />
      ) : (
        <>
          {!loading && featured.length > 0 && (
            <ProductSection eyebrow="Handpicked" title="Featured collection" products={featured} to={ROUTES.shop} className="pt-0 sm:pt-0" />
          )}
          <ProductSection
            eyebrow="Customer favourites"
            title="Best sellers"
            products={bestSellers}
            loading={loading}
            to={`${ROUTES.shop}?sort=popular`}
          />
        </>
      )}

      <PromoBanner saleCount={sale.data} />

      {!home.isError && (
        <ProductSection
          eyebrow="Just landed"
          title="New arrivals"
          products={newArrivals}
          loading={loading}
          to={`${ROUTES.shop}?sort=newest`}
        />
      )}

      <Lifestyle products={trending.length ? trending : bestSellers} />

      {!home.isError && (
        <ProductSection
          eyebrow="Popular right now"
          title="Trending products"
          products={trending}
          loading={loading}
          to={`${ROUTES.shop}?sort=popular`}
        />
      )}

      <WhyChoose freeShippingThreshold={settings.freeShippingThreshold} money={money} />
      <Reviews reviews={reviews.data} />
      <Newsletter />
      <WhatsAppCta link={chat} />
    </>
  );
}