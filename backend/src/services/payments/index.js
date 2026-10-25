import AppError from '../../utils/AppError.js';
import cod from './codProvider.js';

/**
 * Payment provider registry.
 *
 * To add an online payment method later (JazzCash, Easypaisa, Stripe ...):
 *   1. create services/payments/<name>Provider.js exporting { id, label, createPayment(order) }
 *   2. register it below
 *   3. add its id to PAYMENT_METHODS in models/Order.js
 * createPayment may return a redirectUrl and a paymentReference for the customer to complete payment.
 */
const providers = { [cod.id]: cod };

export function getPaymentProvider(method) {
  const provider = providers[method];
  if (!provider) throw new AppError('This payment method is not available', 400);
  return provider;
}

export const listPaymentMethods = () => Object.values(providers).map(({ id, label }) => ({ id, label }));