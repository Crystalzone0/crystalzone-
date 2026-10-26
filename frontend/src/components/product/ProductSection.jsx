import SectionHeading from '../common/SectionHeading.jsx';
import ProductGrid from './ProductGrid.jsx';
import { cn } from '../../utils/cn.js';

/** Titled product row for the home page. Renders nothing when there are no products to show. */
export default function ProductSection({ eyebrow, title, subtitle, products = [], loading = false, to, linkLabel, className }) {
  if (!loading && products.length === 0) return null;

  return (
    <section className={cn('py-14 sm:py-20', className)}>
      <div className="container-cz">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} to={to} linkLabel={linkLabel} />
        <ProductGrid products={products} loading={loading} />
      </div>
    </section>
  );
}