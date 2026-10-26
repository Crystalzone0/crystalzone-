import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Copy, MessageCircle, PackageSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import OrderItemsList from '../../components/orders/OrderItemsList.jsx';
import OrderTotals from '../../components/orders/OrderTotals.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import PrintButton from '../../components/common/PrintButton.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import PageLoader from '../../components/ui/PageLoader.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import * as orderApi from '../../services/orderApi.js';
import { formatDateTime } from '../../utils/format.js';
import { PAYMENT_LABELS } from '../../utils/orders.js';
import { ROUTES } from '../../utils/constants.js';

export default function OrderSuccess() {
  const location = useLocation();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const stateOrder = location.state?.order;
  const ref = params.get('order') || '';

  // Normally the order arrives with the redirect. On a reload or another device, a logged-in customer can load it.
  const fetched = useQuery({
    queryKey: ['account', 'order', ref],
    queryFn: () => orderApi.getMyOrder(ref),
    enabled: !stateOrder && Boolean(user) && Boolean(ref),
  });

  const order = stateOrder || fetched.data?.order;
   
  const address = order?.shippingAddress;

  const chatLink = location.state?.whatsappLink || fetched.data?.whatsappLink;

  if (!stateOrder && user && ref && fetched.isPending) return <PageLoader />;
  if (!order && fetched.isError && fetched.error?.status !== 404) {
    return <ErrorState error={fetched.error} onRetry={() => fetched.refetch()} className="py-24" />;
  }

 

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(order.orderId);
      toast.success('Order ID copied');
    } catch {
      toast.error('Could not copy. Please note it down.');
    }
  };

  return (
    <>
      <Seo title="Order confirmed" noindex />
      <section className="bg-cream py-10 sm:py-16">
        <div className="container-cz max-w-3xl">
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={34} aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-serif text-4xl sm:text-5xl">Thank you for your order!</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-charcoal/70">
              We have received your order and will confirm it shortly. Please keep your phone nearby, as we may call or message you to confirm.
            </p>

            <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-soft">
              <div className="text-left">
                <p className="text-xs uppercase tracking-wider text-charcoal/60">Order ID</p>
                <p className="font-mono text-lg font-semibold tracking-wide">{order.orderId}</p>
              </div>
              <button
                type="button"
                onClick={copyId}
                aria-label="Copy order ID"
                className="rounded-full p-2 text-charcoal/60 transition hover:bg-charcoal/5 hover:text-ink"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>

          {!user && (
            <Alert variant="info" className="mt-8">
              Keep your Order ID safe. To track your order you will need it together with the phone number or email you used at checkout.
            </Alert>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_20rem]">
            <div className="rounded-3xl bg-white p-6 shadow-soft">
              <h2 className="font-serif text-2xl">Your items</h2>
              <div className="mt-5">
                <OrderItemsList items={order.items} />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-white p-6 shadow-soft">
                <h2 className="font-serif text-xl">Summary</h2>
                <div className="mt-4">
                  <OrderTotals order={order} />
                </div>
                <p className="mt-4 text-xs text-charcoal/60">
                  {PAYMENT_LABELS[order.paymentMethod] || 'Payment'}: pay when your order arrives.
                </p>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-soft">
                <h2 className="font-serif text-xl">Delivering to</h2>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
                  {address.fullName}
                  <br />
                  {address.phone}
                  <br />
                  {address.address}
                  <br />
                  {address.city}, {address.province} {address.postalCode}
                </p>
                <p className="mt-3 text-xs text-charcoal/50">Placed {formatDateTime(order.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {chatLink && (
              <Button href={chatLink} icon={MessageCircle}>
                Confirm on WhatsApp
              </Button>
            )}
            <Button to={`${ROUTES.trackOrder}?orderId=${encodeURIComponent(order.orderId)}`} variant="dark">
              Track this order
            </Button>
            <Button to={ROUTES.shop} variant="outline">
              Continue shopping
            </Button>
          </div>

          {user && (
            <p className="mt-6 text-center text-sm text-charcoal/70">
              You can also find this order in{' '}
              <Link to={ROUTES.accountOrders} className="font-medium underline underline-offset-4 hover:text-gold-dark">
                My Orders
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </>
  );
}