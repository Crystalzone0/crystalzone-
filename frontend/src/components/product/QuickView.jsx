import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import ProductImage from './ProductImage.jsx';
import PriceTag from './PriceTag.jsx';
import Rating from './Rating.jsx';
import QuantitySelector from './QuantitySelector.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { MAX_LINE_QUANTITY, ROUTES } from '../../utils/constants.js';

/** Popup preview opened from a product card. Mounted only while open. */
export default function QuickView({ product, onClose }) {
  const { addItem, isBusy } = useCart();
  const [quantity, setQuantity] = useState(1);

  const outOfStock = product.stock <= 0;
  const max = Math.min(product.stock, MAX_LINE_QUANTITY);

  const handleAdd = async () => {
    const added = await addItem(product, quantity);
    if (added) onClose();
  };

  return (
    <Modal open onClose={onClose} label={`Quick view: ${product.name}`} size="lg">
      <div className="grid sm:grid-cols-2">
        <div className="aspect-square bg-cream-dark sm:aspect-auto sm:min-h-[28rem]">
          <ProductImage
            src={product.primaryImage}
            alt={product.name}
            width={800}
            sizes="(min-width: 640px) 45vw, 100vw"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-8">
          {product.category?.name && (
            <p className="text-xs uppercase tracking-[0.25em] text-gold-dark">{product.category.name}</p>
          )}
          <h2 className="mt-2 pr-8 font-serif text-2xl sm:text-3xl">{product.name}</h2>

          {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} className="mt-3" />}

          <PriceTag product={product} size="lg" className="mt-4" />

          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-charcoal/75">{product.description}</p>

          <p className="mt-4 text-sm font-medium">
            {outOfStock ? (
              <span className="uppercase tracking-wider text-red-700">OUT OF STOCK</span>
            ) : product.stock <= 5 ? (
              <span className="text-amber-700">Only {product.stock} left in stock</span>
            ) : (
              <span className="text-emerald-700">In stock</span>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantitySelector value={quantity} onChange={setQuantity} max={max} disabled={outOfStock} />
            <Button
              icon={ShoppingBag}
              loading={isBusy(product.id)}
              disabled={outOfStock}
              onClick={handleAdd}
              className="flex-1"
            >
              {outOfStock ? 'Out of stock' : 'Add to cart'}
            </Button>
          </div>

          <Link
            to={ROUTES.product(product.slug)}
            onClick={onClose}
            className="mt-5 inline-block text-sm font-medium underline underline-offset-4 transition hover:text-gold-dark"
          >
            View full details
          </Link>
        </div>
      </div>
    </Modal>
  );
}