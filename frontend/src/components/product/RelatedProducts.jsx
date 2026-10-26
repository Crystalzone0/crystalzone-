import { useQuery } from '@tanstack/react-query';
import SectionHeading from '../common/SectionHeading.jsx';
import ProductGrid from './ProductGrid.jsx';
import useRecentlyViewed from '../../hooks/useRecentlyViewed.js';
import * as catalogApi from '../../services/catalogApi.js';

/** "You may also like": same category first, topped up with popular products. */
export function RelatedProducts({ slug }) {
  const query = useQuery({
    queryKey: ['related', slug],
    queryFn: () => catalogApi.getRelatedProducts(slug).then((res) => res.products.slice(0, 4)),
  });

  if (query.isError) return null;
  if (query.isSuccess && query.data.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="container-cz">
        <SectionHeading eyebrow="Complete the look" title="You may also like" />
        <ProductGrid products={query.data} loading={query.isPending} />
      </div>
    </section>
  );
}

/** Products the visitor opened earlier on this device. Prices and stock are always fetched fresh. */
export function RecentlyViewed({ excludeSlug }) {
  const slugs = useRecentlyViewed(excludeSlug);

  const query = useQuery({
    queryKey: ['recently-viewed', slugs.join(',')],
    queryFn: () => catalogApi.getBySlugs(slugs).then((res) => res.products),
    enabled: slugs.length > 0,
  });

  if (slugs.length === 0 || !query.data || query.data.length === 0) return null;

  return (
    <section className="pb-12 sm:pb-16">
      <div className="container-cz">
        <SectionHeading eyebrow="Pick up where you left off" title="Recently viewed" />
        <ProductGrid products={query.data} />
      </div>
    </section>
  );
}