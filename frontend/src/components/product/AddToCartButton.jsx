import { useEffect, useRef, useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { cn } from '../../utils/cn.js';

/**
 * One "Add to cart" button for the whole store. On success it briefly turns gold and says "Added" with a small tick,
 * then returns to normal. Out of stock products show a disabled "Out of stock" button.
 */
export default function AddToCartButton({ product, quantity = 1, size = 'md', variant = 'dark', className, label = 'Add to cart' }) {
  const { addItem, isBusy } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const outOfStock = product.stock <= 0;

  const handleClick = async () => {
    const ok = await addItem(product, quantity);
    if (!ok) return;
    setAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Button
      size={size}
      variant={outOfStock ? 'outline' : variant}
      icon={added ? Check : outOfStock ? undefined : ShoppingBag}
      iconClassName={added ? 'animate-tick' : undefined}
      loading={isBusy(product.id)}
      disabled={outOfStock}
      onClick={handleClick}
      className={cn(added && 'bg-gold text-ink hover:bg-gold hover:text-ink', className)}
    >
      {outOfStock ? 'Out of stock' : added ? 'Added' : label}
    </Button>
  );
}