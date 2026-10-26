import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, PackageSearch } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import Seo from '../../components/common/Seo.jsx';
import OrderItemsList from '../../components/orders/OrderItemsList.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import OrderTimeline from '../../components/orders/OrderTimeline.jsx';
import OrderTotals from '../../components/orders/OrderTotals.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import * as orderApi from '../../services/orderApi.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';
import { PAYMENT_LABELS, PAYMENT_STATUS_LABELS } from '../../utils/orders.js';
import { focusFirstInvalid } from '../../utils/address.js';
import { ROUTES } from '../../utils/constants.js';

function TrackingResult({ order, whatsappLink, onReset }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-soft">
        <div>
          <p className="text-xs uppercase tracking-wider text-charcoal/60">Order ID</p>
          <p className="font-mono text-xl font-semibold tracking-wide">{order.orderId}</p>
          <p className="mt-1 text-xs text-charcoal/60">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} className="px-4 py-1.5 text-sm" />
      </div>

      {order.status === 'Cancelled' && (
        <Alert>
          This order was cancelled{order.cancelledAt ? ` on ${formatDateTime(order.cancelledAt)}` : ''}.
          {order.cancelReason ? ` Reason: ${order.cancelReason}` : ''} If you have questions, please message us on WhatsApp.
        </Alert>
      )}
      {order.status === 'Delivered' && order.deliveredAt && (
        <Alert variant="success">Delivered on {formatDateTime(order.deliveredAt)}. We hope you love it!</Alert>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <div className="rounded-3xl bg-white p-6 shadow-soft">
          <h2 className="font-serif text-2xl">Order progress</h2>
          <div className="mt-6">
            <OrderTimeline status={order.status} history={order.statusHistory} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <h2 className="font-serif text-xl">Delivery</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
              {order.customerName}
              <br />
              {order.city}, {order.province}
            </p>
            <p className="mt-3 text-xs text-charcoal/60">
              {PAYMENT_LABELS[order.paymentMethod] || 'Payment'} &middot;{' '}
              {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <h2 className="font-serif text-xl">Summary</h2>
            <div className="mt-4">
              <OrderTotals order={order} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="font-serif text-2xl">Items in this order</h2>
        <div className="mt-5">
          <OrderItemsList items={order.items} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {whatsappLink && (
          <Button href={whatsappLink} icon={MessageCircle}>
            Message us about this order
          </Button>
        )}
        <Button variant="outline" onClick={onReset}>
          Track another order
        </Button>
      </div>
    </div>
  );
}

export default function TrackOrder() {
  const [params] = useSearchParams();
  const [values, setValues] = useState({ orderId: (params.get('orderId') || '').toUpperCase().slice(0, 30), contact: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: name === 'orderId' ? value.toUpperCase() : value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const found = {};
    if (values.orderId.trim().length < 6) found.orderId = 'Please enter your Order ID (for example CZ-260930-K7M2QX)';
    if (values.contact.trim().length < 5) found.contact = 'Please enter the phone number or email used for the order';
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) {
      focusFirstInvalid();
      return;
    }

    setLoading(true);
    try {
      const data = await orderApi.trackOrder({ orderId: values.orderId.trim(), contact: values.contact.trim() });
      setResult({ order: data.order, whatsappLink: data.whatsappLink });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setValues({ orderId: '', contact: '' });
    setSubmitError('');
  };

  return (
    <>
      <Seo title="Track your order" description="Track your Crystal Zone order with your Order ID and the phone number or email used at checkout." />
      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-cz py-8 sm:py-12">
          <Breadcrumbs items={[{ label: 'Home', to: ROUTES.home }, { label: 'Track order' }]} />
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">Track your order</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-charcoal/70 sm:text-base">
            Enter your Order ID and the phone number or email you used at checkout to see where your order is.
          </p>
        </div>
      </section>

      <div className="container-cz py-8 sm:py-12">
        {result ? (
          <div className="mx-auto max-w-4xl">
            <TrackingResult order={result.order} whatsappLink={result.whatsappLink} onReset={reset} />
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mx-auto max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-soft sm:p-8">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
              <PackageSearch size={26} aria-hidden="true" />
            </span>

            {submitError && <Alert>{submitError}</Alert>}

            <TextField
              label="Order ID"
              name="orderId"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="CZ-260930-K7M2QX"
              value={values.orderId}
              onChange={onChange}
              error={errors.orderId}
              maxLength={30}
              required
            />
            <TextField
              label="Phone number or email"
              name="contact"
              autoComplete="off"
              placeholder="03XX XXXXXXX or you@example.com"
              hint="Use the same phone number or email you entered at checkout."
              value={values.contact}
              onChange={onChange}
              error={errors.contact}
              maxLength={120}
              required
            />

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Track order
            </Button>
          </form>
        )}
      </div>
    </>
  );
}