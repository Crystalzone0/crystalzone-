/**
 * Cash on Delivery: nothing to charge online. The customer pays the courier,
 * so the payment stays "pending" until the order is marked Delivered.
 */
export default {
  id: 'cod',
  label: 'Cash on Delivery',

  /** Called once, right after the order is saved. Must return the payment state for the order. */
  async createPayment() {
    return { paymentStatus: 'pending', paymentReference: '', redirectUrl: null };
  },
};