import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import Seo from '../../components/common/Seo.jsx';
import AddressFields from '../../components/common/AddressFields.jsx';
import CartSummary from '../../components/cart/CartSummary.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import * as addressApi from '../../services/addressApi.js';
import * as cartApi from '../../services/cartApi.js';
import * as orderApi from '../../services/orderApi.js';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { EMPTY_ADDRESS, addressRules, focusFirstInvalid } from '../../utils/address.js';
import { validateForm, validators } from '../../utils/validators.js';
import { MAX_LINE_QUANTITY, ROUTES } from '../../utils/constants.js';
import { newIdempotencyKey } from '../../utils/id.js';

const HEX_ID = /^[0-9a-fA-F]{24}$/;
const NO_ADDRESSES = [];
const INITIAL_VALUES = { ...EMPTY_ADDRESS, email: '', notes: '' };

const warn = (error) => console.warn('Checkout: a follow-up step failed (the order itself was saved):', error);

/** Runs a follow-up step. Whatever happens inside, it can never throw or reject into the order flow. */
function safely(task) {
  try {
    const result = task();
    if (result && typeof result.catch === 'function') result.catch(warn);
  } catch (error) {
    warn(error);
  }
}

/** "Buy now" passes { productId, quantity } in the navigation state. Anything odd is ignored. */
function readBuyNow(state) {
  const item = state?.buyNow;
  if (!item || typeof item.productId !== 'string' || !HEX_ID.test(item.productId)) return null;
  const quantity = Number(item.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) return null;
  return { productId: item.productId, quantity };
}

function SummaryCard({ lines, summary }) {
  const { money } = useSettings();

  return (
    <div>
      <ul className="divide-y divide-charcoal/10">
        {lines.map((line) => (
          <li key={line.productId} className="flex items-center gap-3 py-3 first:pt-0">
            <div className="relative shrink-0">
              <div className="h-16 w-14 overflow-hidden rounded-lg bg-cream-dark">
                <ProductImage src={line.image} alt="" width={200} className="h-full w-full object-cover" />
              </div>
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-charcoal px-1 text-[10px] font-semibold text-white">
                {line.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{line.name}</p>
              <p className="text-xs text-charcoal/60">{line.sku}</p>
            </div>
            <p className="text-sm font-medium">{money(line.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-charcoal/10 pt-4">
        <CartSummary summary={summary} />
        {summary.amountToFreeShipping > 0 && (
          <p className="mt-3 text-xs text-charcoal/60">
            Add {money(summary.amountToFreeShipping)} more to get free delivery.
          </p>
        )}
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_26rem]" aria-hidden="true">
      <div className="space-y-5">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-80 rounded-3xl" />
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const cart = useCart();
  const { money } = useSettings();

  const buyNow = readBuyNow(location.state);

  // "Buy now": live price and stock for just that product (nothing is written to the cart).
  const buyNowQuery = useQuery({
    queryKey: ['buy-now', buyNow?.productId, buyNow?.quantity],
    queryFn: () => cartApi.validateGuestCart([buyNow]).then((res) => res.cart),
    enabled: Boolean(buyNow),
    staleTime: 0,
  });

  const view = buyNow
    ? {
        items: buyNowQuery.data?.items ?? [],
        summary: buyNowQuery.data?.summary,
        loading: buyNowQuery.isPending,
        error: buyNowQuery.isError ? buyNowQuery.error : null,
        reload: () => buyNowQuery.refetch(),
      }
    : {
        items: cart.items,
        summary: cart.summary,
        loading: cart.loading,
        error: cart.error,
        reload: () => cart.refresh().catch(() => {}),
      };

  const lines = view.items.filter((line) => line.available);

  const addressesQuery = useQuery({
    queryKey: ['account', 'addresses'],
    queryFn: () => addressApi.listAddresses().then((res) => res.addresses),
    enabled: Boolean(user),
  });
  const addresses = addressesQuery.data || NO_ADDRESSES;

  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [saveAddress, setSaveAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const alertRef = useRef(null);
  const addressPrefilled = useRef(false);
  // Same order details = same key, so pressing the button again after a dropped connection cannot create a second order.
  const attemptRef = useRef({ key: '', fingerprint: '' });
  // Synchronous locks (a ref changes instantly, state does not): a second click or Enter in the same instant can never
  // start a second request, and once the server has accepted the order nothing here can run or report an error again.
  const inFlightRef = useRef(false);
  const completedRef = useRef(false);

  // Pre-fill contact details for logged-in customers.
  useEffect(() => {
    if (!user) return;
    setValues((v) => ({
      ...v,
      fullName: v.fullName || user.name || '',
      email: v.email || user.email || '',
      phone: v.phone || user.phone || '',
    }));
  }, [user]);

  const fillFromAddress = (a, force = false) =>
    setValues((v) =>
      !force && v.address.trim()
        ? v
        : {
            ...v,
            fullName: a.fullName,
            phone: a.phone,
            address: a.address,
            city: a.city,
            province: a.province,
            postalCode: a.postalCode || '',
          }
    );

  // Pre-fill the default saved address once (never overwrites what the customer already typed).
  useEffect(() => {
    if (addressPrefilled.current || addresses.length === 0) return;
    addressPrefilled.current = true;
    fillFromAddress(addresses.find((a) => a.isDefault) || addresses[0]);
  }, [addresses]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const showProblem = () => alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  /** The ONLY place an order error is shown: the server request failed, so no order was created. */
  const showOrderError = (err) => {
    if (err.status === 409 && Array.isArray(err.errors) && err.errors.length > 0) {
      // Stock or price changed while the customer was checking out: show exactly what happened.
      setSubmitError('Some items in your order changed. Please review the details below.');
      setConflicts(err.errors.map((item) => item.message));
      view.reload();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } else if (err.isNetwork) {
      setSubmitError(
        'We could not confirm your order because the connection was interrupted. Please press "Place order" again. If your order already went through, you will not get a duplicate.'
      );
    } else {
      setSubmitError(getErrorMessage(err));
      setErrors(fieldErrors(err));
    }
    showProblem();
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (inFlightRef.current || completedRef.current) return;

    const found = validateForm(values, { ...addressRules, email: validators.email });
    setErrors(found);
    setSubmitError('');
    setConflicts([]);
    if (Object.keys(found).length > 0) {
      focusFirstInvalid();
      return;
    }

    inFlightRef.current = true;
    setSubmitting(true);

    // Only what the customer chose is sent. Prices and totals are always calculated by the server.
    const payload = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      province: values.province,
      paymentMethod: 'cod',
      items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
    };
    if (values.postalCode.trim()) payload.postalCode = values.postalCode.trim();
    if (values.notes.trim()) payload.notes = values.notes.trim();

    const fingerprint = JSON.stringify(payload);
    if (attemptRef.current.fingerprint !== fingerprint) {
      attemptRef.current = { key: newIdempotencyKey(), fingerprint }; // changed details = a new attempt
    }

    // ---- Step 1: ask the server to place the order. Only this step can produce an error message. ----
    let result;
    try {
      if (import.meta.env.DEV) console.debug('[checkout] sending order request', attemptRef.current.key);
      result = await orderApi.placeOrder(payload, attemptRef.current.key);
    } catch (err) {
      if (import.meta.env.DEV) console.warn('[checkout] order request failed', { status: err.status, message: err.message });
      inFlightRef.current = false;
      setSubmitting(false);
      showOrderError(err);
      return;
    }

    // ---- Step 2: the order exists. From here on nothing may show an error or start a second request. ----
    completedRef.current = true;
    const boughtIds = lines.map((line) => line.productId);

    safely(() => cart.afterOrder(boughtIds)); // bought items leave the cart
    safely(() => {
      queryClient.invalidateQueries({ queryKey: ['account', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // stock changed
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
    });
    safely(() => {
      // Optional: remember the address for next time.
      const alreadySaved = addresses.some((a) => (a.address || '').trim().toLowerCase() === payload.address.toLowerCase());
      if (!user || !saveAddress || alreadySaved) return undefined;
      return addressApi
        .createAddress({
          label: 'Home',
          fullName: payload.fullName,
          phone: payload.phone,
          address: payload.address,
          city: payload.city,
          province: payload.province,
          ...(payload.postalCode ? { postalCode: payload.postalCode } : {}),
        })
        .then(() => queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] }));
    });

    // Success feedback: exactly one message. Older toasts go first, and the fixed id means it can never stack twice.
    toast.dismiss();
    toast.success('Order placed successfully!', { id: 'order-placed' });

    const orderId = result?.order?.orderId;
    const search = orderId ? `?order=${encodeURIComponent(orderId)}` : '';
    try {
      navigate(`${ROUTES.orderSuccess}${search}`, {
        replace: true,
        state: { order: result?.order, whatsappLink: result?.whatsappLink },
      });
    } catch (error) {
      warn(error);
      window.location.assign(`${ROUTES.orderSuccess}${search}`); // the order is safe either way
    }
  };

  // ---- states before the form ----
  let blocked = null;
  if (view.loading && lines.length === 0) {
    blocked = <CheckoutSkeleton />;
  } else if (view.error && lines.length === 0) {
    blocked = <ErrorState error={view.error} onRetry={view.reload} />;
  } else if (lines.length === 0) {
    blocked = (
      <EmptyState
        icon={ShoppingBag}
        title={view.items.length > 0 ? 'These items are unavailable' : 'Your cart is empty'}
        message={
          view.items.length > 0
            ? 'The items you selected are out of stock right now. Have a look at more pieces from our collection.'
            : 'Add something you love to your cart before checking out.'
        }
        action={<Button to={ROUTES.shop}>Continue shopping</Button>}
      />
    );
  }

  const summary = view.summary;

  const placeOrderButton = summary && (
    <div>
      <Button type="submit" size="lg" loading={submitting} className="w-full">
        Place order &middot; {money(summary.total)}
      </Button>
      {submitting && (
        <p role="status" className="mt-3 text-center text-xs text-charcoal/60">
          Placing your order. Please do not close this page.
        </p>
      )}
    </div>
  );

  return (
    <>
      <Seo title="Checkout" noindex />
      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-cz py-8 sm:py-10">
          <Breadcrumbs
            items={[
              { label: 'Home', to: ROUTES.home },
              ...(buyNow ? [] : [{ label: 'Cart', to: ROUTES.cart }]),
              { label: 'Checkout' },
            ]}
          />
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">Checkout</h1>
        </div>
      </section>

      <div className="container-cz py-8 sm:py-12">
        {blocked || (
          <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-start lg:gap-12">
            <div className="space-y-8">
              <div ref={alertRef} className="scroll-mt-28 space-y-3 empty:hidden">
                {submitError && (
                  <Alert>
                    <p>{submitError}</p>
                    {conflicts.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {conflicts.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    )}
                    {conflicts.length > 0 && !buyNow && (
                      <Link to={ROUTES.cart} className="mt-3 inline-block font-medium underline underline-offset-4">
                        Review your cart
                      </Link>
                    )}
                  </Alert>
                )}
                {view.items.length > lines.length && (
                  <Alert variant="info">
                    Out-of-stock items are not included in this order. They stay in your cart.
                  </Alert>
                )}
              </div>

              <section aria-labelledby="contact-heading">
                <h2 id="contact-heading" className="font-serif text-2xl">Contact</h2>
                {!user && (
                  <p className="mt-1 text-sm text-charcoal/70">
                    Checking out as a guest.{' '}
                    <Link
                      to={ROUTES.login}
                      state={{ from: location }}
                      className="font-medium underline underline-offset-4 hover:text-gold-dark"
                    >
                      Log in
                    </Link>{' '}
                    to use your saved details.
                  </p>
                )}
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  hint="Your order confirmation is sent here."
                  value={values.email}
                  onChange={onChange}
                  error={errors.email}
                  className="mt-5"
                  required
                />
              </section>

              <section aria-labelledby="delivery-heading">
                <h2 id="delivery-heading" className="font-serif text-2xl">Delivery address</h2>

                {addresses.length > 1 && (
                  <div className="mt-4">
                    <label htmlFor="saved-address" className="field-label">Use a saved address</label>
                    <select
                      id="saved-address"
                      className="input"
                      defaultValue=""
                      onChange={(e) => {
                        const chosen = addresses.find((a) => a.id === e.target.value);
                        if (chosen) fillFromAddress(chosen, true);
                        setErrors({});
                      }}
                    >
                      <option value="">Choose an address</option>
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}: {a.address.slice(0, 40)}, {a.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-5">
                  <AddressFields values={values} errors={errors} onChange={onChange} />
                </div>

                <TextField
                  as="textarea"
                  rows={3}
                  label="Order notes (optional)"
                  name="notes"
                  maxLength={500}
                  placeholder="Anything we should know? For example delivery timing or gift wrapping."
                  value={values.notes}
                  onChange={onChange}
                  error={errors.notes}
                  className="mt-5"
                />

                {user && addresses.length < 5 && (
                  <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(e) => setSaveAddress(e.target.checked)}
                      className="h-4 w-4 accent-gold"
                    />
                    Save this address for next time
                  </label>
                )}
              </section>

              <section aria-labelledby="payment-heading">
                <h2 id="payment-heading" className="font-serif text-2xl">Payment</h2>
                <div className="mt-4 flex items-start gap-4 rounded-2xl border border-gold bg-gold/10 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
                    <Banknote size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium">Cash on Delivery</p>
                    <p className="mt-0.5 text-sm text-charcoal/70">
                      Pay in cash when your order arrives at your door. No online payment needed.
                    </p>
                  </div>
                </div>
              </section>

              {/* Phones: compact summary and the place order button after the form */}
              {summary && (
                <div className="space-y-4 lg:hidden">
                  <details className="rounded-2xl bg-white p-4 shadow-soft">
                    <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                      <span>Order summary ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'})</span>
                      <span>{money(summary.total)}</span>
                    </summary>
                    <div className="mt-4">
                      <SummaryCard lines={lines} summary={summary} />
                    </div>
                  </details>
                  {placeOrderButton}
                </div>
              )}
            </div>

            {summary && (
              <aside className="hidden rounded-3xl bg-white p-6 shadow-soft lg:sticky lg:top-28 lg:block" aria-label="Order summary">
                <h2 className="mb-5 font-serif text-2xl">Order summary</h2>
                <SummaryCard lines={lines} summary={summary} />
                <div className="mt-6">{placeOrderButton}</div>
                <p className="mt-4 text-center text-xs text-charcoal/60">
                  By placing your order you agree to our{' '}
                  <Link to={ROUTES.terms} className="underline underline-offset-2 hover:text-gold-dark">Terms</Link> and{' '}
                  <Link to={ROUTES.shipping} className="underline underline-offset-2 hover:text-gold-dark">Shipping &amp; Returns</Link>.
                </p>
              </aside>
            )}
          </form>
        )}
      </div>
    </>
  );
}