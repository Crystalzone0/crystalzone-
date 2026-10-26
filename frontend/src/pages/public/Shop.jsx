import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { SearchX, SlidersHorizontal } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import Seo from '../../components/common/Seo.jsx';
import ProductGrid from '../../components/product/ProductGrid.jsx';
import FilterPanel from '../../components/shop/FilterPanel.jsx';
import FilterDrawer from '../../components/shop/FilterDrawer.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import NotFound from '../errors/NotFound.jsx';
import * as catalogApi from '../../services/catalogApi.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

/** Reads and cleans the URL, so a hand-edited or old link can never send the API an invalid value. */
function parseParams(searchParams) {
  const number = (key) => {
    const raw = searchParams.get(key);
    if (raw === null || raw.trim() === '') return '';
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : '';
  };
  const availability = searchParams.get('availability');
  const sort = searchParams.get('sort');

  return {
    q: (searchParams.get('q') || '').trim().slice(0, 80),
    minPrice: number('minPrice'),
    maxPrice: number('maxPrice'),
    onSale: searchParams.get('onSale') === 'true',
    availability: ['in-stock', 'out-of-stock'].includes(availability) ? availability : '',
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : 'newest',
  };
}

export default function Shop() {
  const { slug } = useParams(); // present on /category/:slug
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const filtersQuery = useQuery({ queryKey: ['filters'], queryFn: catalogApi.getFilters, staleTime: 60_000 });
  const categories = filtersQuery.data?.categories ?? [];
  const priceRange = filtersQuery.data?.priceRange;

  const params = useMemo(() => parseParams(searchParams), [searchParams]);
  const categorySlug = (slug || searchParams.get('category') || '').toLowerCase().slice(0, 100);
  const category = categories.find((c) => c.slug === categorySlug);
  const categoryMissing = Boolean(slug) && filtersQuery.isSuccess && !category;

  const apiParams = useMemo(() => {
    const p = { sort: params.sort, limit: PAGE_SIZE };
    if (params.q) p.q = params.q;
    if (categorySlug) p.category = categorySlug;
    if (params.minPrice !== '') p.minPrice = params.minPrice;
    if (params.maxPrice !== '') p.maxPrice = params.maxPrice;
    if (params.onSale) p.onSale = 'true';
    if (params.availability) p.availability = params.availability;
    return p;
  }, [params, categorySlug]);

  const query = useInfiniteQuery({
    queryKey: ['products', apiParams],
    queryFn: ({ pageParam }) => catalogApi.getProducts({ ...apiParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
    placeholderData: keepPreviousData,
    enabled: !categoryMissing,
  });

  const items = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const page of query.data?.pages ?? []) {
      for (const product of page.products) {
        if (!seen.has(product.id)) {
          seen.add(product.id);
          list.push(product);
        }
      }
    }
    return list;
  }, [query.data]);

  const pages = query.data?.pages ?? [];
  const total = pages.length ? pages[pages.length - 1].pagination.total : 0;

  const activeCount =
    (params.q ? 1 : 0) +
    (params.minPrice !== '' || params.maxPrice !== '' ? 1 : 0) +
    (params.onSale ? 1 : 0) +
    (params.availability ? 1 : 0);

  const update = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === '' || value == null || value === false) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const selectCategory = useCallback(
    (nextSlug) => {
      const next = new URLSearchParams(searchParams);
      next.delete('category');
      navigate({
        pathname: nextSlug ? ROUTES.category(nextSlug) : ROUTES.shop,
        search: next.toString() ? `?${next.toString()}` : '',
      });
    },
    [navigate, searchParams]
  );

  const clearAll = useCallback(() => setSearchParams(new URLSearchParams(), { replace: true }), [setSearchParams]);

  if (categoryMissing) return <NotFound />;

  const heading = category ? category.name : params.q ? `Results for \u201C${params.q}\u201D` : 'Shop all jewellery';
  const intro =
    category?.description ||
    (category
      ? `Explore our ${category.name.toLowerCase()} collection.`
      : 'Earrings, rings, lockets, watches, bracelets, bangles and bags. Filter by price, category and availability to find your piece.');

  const crumbs = [
    { label: 'Home', to: ROUTES.home },
    { label: 'Shop', to: category ? ROUTES.shop : undefined },
    ...(category ? [{ label: category.name }] : []),
  ];

  const panel = (
    <FilterPanel
      params={params}
      categories={categories}
      activeCategory={categorySlug}
      priceRange={priceRange}
      onChange={update}
      onSelectCategory={selectCategory}
      onClear={clearAll}
      activeCount={activeCount}
    />
  );

  const loadMoreFailed = query.isFetchNextPageError;
  const showInitialError = query.isError && items.length === 0;
  const showEmpty = query.isSuccess && items.length === 0;
  const showSkeleton = query.isPending && !query.isError;

  return (
    <>
      <Seo
        title={category ? category.name : params.q ? `Search: ${params.q}` : 'Shop'}
        description={
          category
            ? `Shop ${category.name.toLowerCase()} at Crystal Zone. Elegant artificial jewellery with Cash on Delivery.`
            : 'Shop earrings, rings, lockets, watches, bracelets, bangles and bags at Crystal Zone. Cash on Delivery available.'
        }
      />

      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-cz py-8 sm:py-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">{heading}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal/70 sm:text-base">{intro}</p>
        </div>
      </section>

      <section className="container-cz py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">{panel}</div>
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-charcoal/70" aria-live="polite">
                {query.isSuccess ? `${total} ${total === 1 ? 'product' : 'products'}` : '\u00A0'}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="btn-outline btn-sm lg:hidden"
                  aria-haspopup="dialog"
                >
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  Filters{activeCount > 0 ? ` (${activeCount})` : ''}
                </button>

                <label className="flex items-center gap-2 text-sm">
                  <span className="hidden text-charcoal/60 sm:inline">Sort by</span>
                  <select
                    value={params.sort}
                    onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}
                    className="input w-auto py-2 pr-8"
                    aria-label="Sort products"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {showInitialError ? (
              <ErrorState error={query.error} onRetry={() => query.refetch()} />
            ) : showSkeleton ? (
              <ProductGrid loading skeletonCount={6} className="lg:grid-cols-3" />
            ) : showEmpty ? (
              <EmptyState
                icon={SearchX}
                title="No products found"
                message={
                  activeCount > 0
                    ? 'We could not find anything matching your filters. Try removing a filter or searching for something else.'
                    : 'There are no products here yet. Please check back soon.'
                }
                action={
                  activeCount > 0 ? (
                    <Button onClick={clearAll}>Clear all filters</Button>
                  ) : (
                    <Button to={ROUTES.home}>Back to home</Button>
                  )
                }
              />
            ) : (
              <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
                <ProductGrid products={items} className="lg:grid-cols-3" />

                {loadMoreFailed && <Alert className="mt-8">We could not load more products. Please try again.</Alert>}
                {query.hasNextPage && (
                  <div className="mt-10 text-center">
                    <Button variant="outline" size="lg" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
                      Load more
                    </Button>
                    <p className="mt-3 text-xs text-charcoal/50">
                      Showing {items.length} of {total}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <FilterDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        footerLabel={query.isSuccess ? `Show ${total} ${total === 1 ? 'product' : 'products'}` : 'Show results'}
      >
        {panel}
      </FilterDrawer>
    </>
  );
}