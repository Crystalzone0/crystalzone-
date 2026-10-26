import { ORDER_STEPS } from './orders.js';

export const HEX_ID = /^[0-9a-fA-F]{24}$/;
export const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A YYYY-MM-DD string the server will accept (so a hand-edited URL can never cause a 400). */
export const validDate = (value) => DATE_ONLY.test(value) && !Number.isNaN(Date.parse(value));

/** Returns `value` if it is one of `allowed`, otherwise ''. */
export const pick = (value, allowed) => (allowed.includes(value) ? value : '');

export const ALL_STATUSES = [...ORDER_STEPS, 'Cancelled'];
export const FINAL_STATUSES = ['Delivered', 'Cancelled'];
export const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

const PAYMENT_LABELS = { pending: 'Pending', paid: 'Paid', failed: 'Failed', refunded: 'Refunded' };
const PAYMENT_TONES = {
  pending: 'bg-amber-50 text-amber-800',
  paid: 'bg-emerald-50 text-emerald-800',
  failed: 'bg-red-50 text-red-700',
  refunded: 'bg-charcoal/10 text-charcoal/70',
};

export const paymentLabel = (status) => PAYMENT_LABELS[status] || status;
export const paymentTone = (status) => PAYMENT_TONES[status] || 'bg-charcoal/10 text-charcoal/70';