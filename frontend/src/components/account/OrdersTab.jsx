import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, MessageCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import OrderItemsList from '../orders/OrderItemsList.jsx';
import OrderStatusBadge from '../orders/OrderStatusBadge.jsx';
import OrderTimeline from '../orders/OrderTimeline.jsx';
import OrderTotals from '../orders/OrderTotals.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import * as orderApi from '../../services/orderApi.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDate } from '../../utils/format.js';
import { CUSTOMER_CANCELLABLE } from '../../utils/orders.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

function OrderCard({ order }) {
  const queryClient = useQueryClient();
  const { money, whatsappLink } = useSettings();
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canCancel = CUSTOMER_CANCELLABLE.includes(order.status);
  const address = order.shippingAddress;
  const detailsId = `order-details-${order.id}`;

  const handleCancel = async () => {
    if (!window.confirm(`Cancel order ${order.orderId}? This cannot be undone.`)) return;

    setCancelling(true);
    try {
      await orderApi.cancelMyOrder(order.orderId, 'Cancelled by customer');
      toast.success('Your order has been cancelled');
      await queryClient.invalidateQueries({ queryKey: ['account', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // stock was restored
      queryClient.invalidateQueries({ queryKey: ['product'] });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setCancelling(false);
      queryClient.invalidateQueries({ queryKey: ['account', 'orders'] }); // status may have moved on
    }
  };

  return (
    <li className="rounded-2xl border border-charcoal/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <p className="font-mono text-sm font-semibold tracking-wide">{order.orderId}</p>
          <p className="mt-0.5 text-xs text-charcoal/60">
            {formatDate(order.createdAt)} &middot; {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <OrderStatusBadge status={order.status} />
          <p className="font-semibold">{money(order.total)}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={detailsId}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition hover:text-gold-dark"
        >
          {open ? 'Hide details' : 'View details'}
          <ChevronDown size={16} className={cn('transition', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div id={detailsId} className="space-y-8 border-t border-charcoal/10 p-5">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 font-serif text-lg">Items</h3>
              <OrderItemsList items={order.items} showReview={order.status === 'Delivered'} />
              <div className="mt-5 border-t border-charcoal/10 pt-4">
                <OrderTotals order={order} />
              </div>
            </div>
            <div>
              <h3 className="mb-4 font-serif text-lg">Progress</h3>
              <OrderTimeline status={order.status} history={order.statusHistory} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-serif text-lg">Delivery address</h3>
            <p className="text-sm leading-relaxed text-charcoal/80">
              {address.fullName}, {address.phone}
              <br />
              {address.address}, {address.city}, {address.province} {address.postalCode}
            </p>
            {order.notes && <p className="mt-2 text-sm text-charcoal/60">Note: {order.notes}</p>}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              href={whatsappLink(`Hello Crystal Zone! I need help with my order ${order.orderId}.`)}
              variant="outline"
              size="sm"
              icon={MessageCircle}
            >
              Message us
            </Button>
            <Button to={`${ROUTES.trackOrder}?orderId=${encodeURIComponent(order.orderId)}`} variant="outline" size="sm">
              Track order
            </Button>
            {canCancel && (
              <Button variant="ghost" size="sm" loading={cancelling} onClick={handleCancel} className="text-red-700 hover:bg-red-50">
                Cancel order
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function OrdersTab() {
  const query = useInfiniteQuery({
    queryKey: ['account', 'orders'],
    queryFn: ({ pageParam }) => orderApi.getMyOrders({ page: pageParam, limit: 5 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasMore ? last.pagination.page + 1 : undefined),
    staleTime: 0,
  });

  if (query.isPending) {
    return (
      <div className="space-y-4" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (query.isError && !query.data) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-8" />;
  }

  const orders = query.data.pages.flatMap((page) => page.orders);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        message="When you place an order it will appear here so you can follow its progress."
        action={<Button to={ROUTES.shop}>Start shopping</Button>}
        className="py-10"
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="mb-6 font-serif text-2xl">My orders</h2>
      <ul className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </ul>

      {query.isFetchNextPageError && <Alert className="mt-6">Could not load more orders. Please try again.</Alert>}
      {query.hasNextPage && (
        <div className="mt-8 text-center">
          <Button variant="outline" loading={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>
            Load older orders
          </Button>
        </div>
      )}

      <p className="mt-8 text-sm text-charcoal/60">
        Need help with an order?{' '}
        <Link to={ROUTES.contact} className="underline underline-offset-4 hover:text-gold-dark">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}