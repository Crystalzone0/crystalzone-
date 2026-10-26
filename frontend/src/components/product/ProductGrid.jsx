import ProductCard from './ProductCard.jsx';
import ProductCardSkeleton from './ProductCardSkeleton.jsx';
import { cn } from '../../utils/cn.js';

/**
 * 2 columns on phones, 3 on tablets. Pass className="lg:grid-cols-4" (or 3) for larger screens.
 * Cards fade up in a short stagger (each row of up to 4 cards, left to right). The animation leaves nothing behind
 * once it finishes, so quick view dialogs and card hover effects are unaffected.
 */
export default function ProductGrid({ products = [], loading = false, skeletonCount = 4, className = 'lg:grid-cols-4' }) {
  return (
    <div className={cn('grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3', className)}>
      {loading
        ? Array.from({ length: skeletonCount }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((product, i) => (
            <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${(i % 4) * 70}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
    </div>
  );
}