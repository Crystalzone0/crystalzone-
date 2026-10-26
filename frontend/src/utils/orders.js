export const ORDER_STEPS = [
  'Order Placed',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

// A customer can cancel their own order only until it starts being processed (the server enforces this too).
export const CUSTOMER_CANCELLABLE = ['Order Placed', 'Confirmed'];

const TONES = {
  'Order Placed': 'bg-sky-50 text-sky-800',
  Confirmed: 'bg-indigo-50 text-indigo-800',
  Processing: 'bg-amber-50 text-amber-800',
  Packed: 'bg-orange-50 text-orange-800',
  Shipped: 'bg-violet-50 text-violet-800',
  'Out for Delivery': 'bg-fuchsia-50 text-fuchsia-800',
  Delivered: 'bg-emerald-50 text-emerald-800',
  Cancelled: 'bg-red-50 text-red-700',
};

export const statusTone = (status) => TONES[status] || 'bg-charcoal/5 text-charcoal';

export const PAYMENT_LABELS = { cod: 'Cash on Delivery' };
export const PAYMENT_STATUS_LABELS = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
};