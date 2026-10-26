import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Mail, MessageCircle, Phone, ShieldAlert, Truck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import AdminCard from '../../components/admin/AdminCard.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import PaymentBadge from '../../components/admin/PaymentBadge.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import OrderTotals from '../../components/orders/OrderTotals.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import * as adminApi from '../../services/adminApi.js';
import { getErrorMessage } from '../../services/api.js';
import { FINAL_STATUSES } from '../../utils/adminLists.js';
import { invalidateProductCaches, refId } from '../../utils/admin.js';
import { formatDateTime } from '../../utils/format.js';
import { PAYMENT_LABELS } from '../../utils/orders.js';
import { ORDER_STEPS } from '../../utils/orders.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';
import { ROUTES } from '../../utils/constants.js';

// Routine progress steps for the dropdown. Delivered and Cancelled are final, so they have their own confirmed buttons.
const DROPDOWN_STATUSES = ORDER_STEPS.filter((s) => s !== 'Delivered');
const NOT_SHIPPABLE = ['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

function DetailSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-8 h-10 w-72" />
      <Skeleton className="mb-6 h-40 rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { money } = useSettings();
  const key = ['admin', 'order', id];

  const query = useQuery({
    queryKey: key,
    queryFn: () => adminApi.getOrder(id).then((res) => res.order),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const [working, setWorking] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(null); // null | 'deliver' | 'cancel'
  const [reason, setReason] = useState('');

  if (query.isPending) return <DetailSkeleton />;
  if (query.error && [400, 404].includes(query.error.status)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Order not found"
        message="This order does not exist."
        action={<Button to={ROUTES.admin.orders}>Back to orders</Button>}
        className="py-24"
      />
    );
  }
  if (query.isError && !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-24" />;

  const order = query.data;
  const isFinal = FINAL_STATUSES.includes(order.status);
  const canShip = !NOT_SHIPPABLE.includes(order.status);
  const address = order.shippingAddress;
  const accountId = order.user ? refId(order.user) : '';
  const history = [...(order.statusHistory || [])].reverse();
  const busy = Boolean(working);

  const customerChat = buildWhatsAppLink(
    order.customer.phone,
    `Hello ${order.customer.name}, this is Crystal Zone about your order ${order.orderId} (${money(order.total)}).`
  );

  /** Runs a status change, stores the fresh order the server returns, and refreshes everything that depends on it. */
  const apply = async (label, request) => {
    setWorking(label);
    try {
      const data = await request();
      queryClient.setQueryData(key, data.order);
      invalidateProductCaches(queryClient); // lists, dashboard, customer totals and (after a cancel) stock
      toast.success(data.message || 'Order updated');
      setStatus('');
      setNote('');
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      queryClient.invalidateQueries({ queryKey: key }); // the order may have changed elsewhere
      return false;
    } finally {
      setWorking('');
    }
  };

  const updateStatus = (event) => {
    event.preventDefault();
    if (!status || busy) return;
    apply('status', () => adminApi.updateOrderStatus(order.id, status, note.trim()));
  };

  const ship = () => apply('ship', () => adminApi.shipOrder(order.id, note.trim()));

  const confirmAction = async () => {
    const ok =
      confirm === 'deliver'
        ? await apply('deliver', () => adminApi.deliverOrder(order.id, note.trim()))
        : await apply('cancel', () => adminApi.cancelOrder(order.id, reason.trim() || 'Cancelled by store'));
    if (ok) {
      setConfirm(null);
      setReason('');
    }
  };

  return (
    <>
      <Seo title={`Order ${order.orderId}`} noindex />
      <PageHeader
        title={order.orderId}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        backTo={ROUTES.admin.orders}
        backLabel="Orders"
        actions={
          <>
            <PaymentBadge status={order.paymentStatus} className="px-4 py-1.5 text-sm" />
            <OrderStatusBadge status={order.status} className="px-4 py-1.5 text-sm" />
          </>
        }
      />

      {order.status === 'Cancelled' && (
        <Alert className="mb-6">
          This order was cancelled{order.cancelledAt ? ` on ${formatDateTime(order.cancelledAt)}` : ''}.
          {order.cancelReason ? ` Reason: ${order.cancelReason}` : ''} Its stock has been returned to your inventory.
        </Alert>
      )}
      {order.status === 'Delivered' && (
        <Alert variant="success" className="mb-6">
          Delivered{order.deliveredAt ? ` on ${formatDateTime(order.deliveredAt)}` : ''}. The Cash on Delivery payment is marked as paid.
        </Alert>
      )}

      <AdminCard title="Update order" description={isFinal ? 'This order is final and can no longer be changed.' : undefined} className="mb-6">
        {!isFinal && (
          <div className="space-y-5">
            <form onSubmit={updateStatus} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
              <label className="block text-sm">
                <span className="field-label">Move to</span>
                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">Choose a status</option>
                  {DROPDOWN_STATUSES.filter((s) => s !== order.status).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="field-label">Note (optional, kept in the history)</span>
                <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="e.g. Handed to TCS, tracking 123456" />
              </label>
              <Button type="submit" disabled={!status} loading={working === 'status'}>
                Update status
              </Button>
            </form>

            <div className="flex flex-wrap gap-3 border-t border-charcoal/10 pt-5">
              <Button variant="outline" icon={Truck} disabled={!canShip || (busy && working !== 'ship')} loading={working === 'ship'} onClick={ship}>
                Mark shipped
              </Button>
              <Button variant="dark" icon={CheckCircle2} disabled={busy} onClick={() => setConfirm('deliver')}>
                Mark delivered
              </Button>
              <Button
                variant="outline"
                icon={XCircle}
                disabled={busy}
                onClick={() => setConfirm('cancel')}
                className="border-red-200 text-red-700 hover:border-red-400 hover:text-red-800"
              >
                Cancel order
              </Button>
            </div>
          </div>
        )}
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="space-y-6">
          <AdminCard title={`Items (${order.itemCount})`}>
            <ul className="divide-y divide-charcoal/10">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                    <ProductImage src={item.image} alt="" width={200} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{item.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-charcoal/60">{item.sku}</p>
                    <p className="mt-1 text-sm text-charcoal/70">
                      {item.quantity} &times; {money(item.paidPrice)}
                      {item.unitPrice > item.paidPrice && <s className="ml-2 text-xs text-charcoal/50">{money(item.unitPrice)}</s>}
                    </p>
                    <Link to={ROUTES.admin.editProduct(item.product)} className="mt-1 inline-block text-xs underline underline-offset-4 hover:text-gold-dark">
                      View product
                    </Link>
                  </div>
                  <p className="shrink-0 font-semibold">{money(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-charcoal/10 pt-5">
              <OrderTotals order={order} />
            </div>
          </AdminCard>

          <AdminCard title="Status history">
            <ol className="space-y-4">
              {history.map((entry, i) => (
                <li key={`${entry.status}-${i}`} className="flex gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">{entry.status}</p>
                    <p className="text-xs text-charcoal/60">
                      {formatDateTime(entry.at)} · {entry.changedBy?.name || 'System'}
                    </p>
                    {entry.note && <p className="mt-1 text-sm text-charcoal/75">{entry.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Customer">
            <p className="font-medium">{order.customer.name}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-gold-dark" aria-hidden="true" />
                <a href={`tel:${order.customer.phone.replace(/\s/g, '')}`} className="transition hover:text-gold-dark">
                  {order.customer.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-gold-dark" aria-hidden="true" />
                <a href={`mailto:${order.customer.email}`} className="break-all transition hover:text-gold-dark">
                  {order.customer.email}
                </a>
              </li>
            </ul>
            <Button href={customerChat} variant="outline" size="sm" icon={MessageCircle} className="mt-4">
              Message on WhatsApp
            </Button>
            <p className="mt-4 text-xs text-charcoal/60">
              {accountId ? (
                <>
                  Registered customer.{' '}
                  <Link to={ROUTES.admin.customer(accountId)} className="underline underline-offset-4 hover:text-gold-dark">
                    View account
                  </Link>
                  {order.user?.isActive === false && <span className="ml-1 text-red-700">(disabled)</span>}
                </>
              ) : (
                'Guest checkout (no account).'
              )}
            </p>
          </AdminCard>

          <AdminCard title="Delivery address">
            <p className="text-sm leading-relaxed text-charcoal/80">
              {address.fullName}
              <br />
              {address.phone}
              <br />
              {address.address}
              <br />
              {address.city}, {address.province} {address.postalCode}
            </p>
            {order.notes && (
              <p className="mt-4 rounded-xl bg-cream p-3 text-sm">
                <span className="font-medium">Customer note:</span> {order.notes}
              </p>
            )}
          </AdminCard>

          <AdminCard title="Payment">
            <p className="text-sm">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
            <div className="mt-2">
              <PaymentBadge status={order.paymentStatus} />
            </div>
          </AdminCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'deliver'}
        title="Mark this order as delivered?"
        message="This records that the customer received the order and paid in cash. A delivered order is final and cannot be changed afterwards. The customer will then be able to review the products."
        confirmLabel="Mark delivered"
        loading={working === 'deliver'}
        onConfirm={confirmAction}
        onClose={() => setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === 'cancel'}
        title="Cancel this order?"
        message={
          <>
            <p>The stock of every item will be returned to your inventory. A cancelled order is final and cannot be reopened.</p>
            <label className="mt-4 block">
              <span className="field-label">Reason (optional)</span>
              <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. Customer changed their mind" />
            </label>
          </>
        }
        confirmLabel="Cancel order"
        danger
        loading={working === 'cancel'}
        onConfirm={confirmAction}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}