import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ClipboardList, RefreshCw } from 'lucide-react';
import Seo from '../../components/common/Seo.jsx';
import ListSkeleton from '../../components/admin/ListSkeleton.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import PaymentBadge from '../../components/admin/PaymentBadge.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import StatusTabs from '../../components/admin/StatusTabs.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import useListParams from '../../hooks/useListParams.js';
import useSearchInput from '../../hooks/useSearchInput.js';
import * as adminApi from '../../services/adminApi.js';
import { ALL_STATUSES, PAYMENT_STATUS_OPTIONS, paymentLabel, pick, validDate } from '../../utils/adminLists.js';
import { formatDateTime } from '../../utils/format.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const PAGE_SIZE = 15;
const DEFAULTS = { q: '', status: '', payment: '', from: '', to: '' };

export default function AdminOrders() {
  const { money } = useSettings();
  const { params, setParams, reset } = useListParams(DEFAULTS);
  const [search, setSearch] = useSearchInput(params.q, (q) => setParams({ q }));

  // The URL is cleaned before it reaches the API, so a hand-edited link cannot cause a validation error.
  const apiParams = { page: params.page, limit: PAGE_SIZE };
  if (params.q) apiParams.search = params.q.slice(0, 80);
  if (pick(params.status, ALL_STATUSES)) apiParams.status = params.status;
  if (pick(params.payment, PAYMENT_STATUS_OPTIONS)) apiParams.paymentStatus = params.payment;
  if (validDate(params.from)) apiParams.from = params.from;
  if (validDate(params.to)) apiParams.to = params.to;

  const query = useQuery({
    queryKey: ['admin', 'orders', apiParams],
    queryFn: () => adminApi.listOrders(apiParams),
    placeholderData: keepPreviousData,
  });

  const orders = query.data?.orders ?? [];
  const pagination = query.data?.pagination;
  const counts = query.data?.statusCounts ?? {};
  const allCount = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const filtersActive = Boolean(apiParams.search || apiParams.status || apiParams.paymentStatus || apiParams.from || apiParams.to);

  const tabs = [
    { value: '', label: 'All', count: query.data ? allCount : undefined },
    ...ALL_STATUSES.map((status) => ({ value: status, label: status, count: query.data ? counts[status] || 0 : undefined })),
  ];

  let body;
  if (query.isPending) {
    body = <ListSkeleton />;
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-16" />;
  } else if (orders.length === 0) {
    body = filtersActive ? (
      <EmptyState
        icon={ClipboardList}
        title="No orders match"
        message="Try a different search, or clear the filters."
        action={<Button onClick={reset}>Clear filters</Button>}
        className="py-16"
      />
    ) : (
      <EmptyState icon={ClipboardList} title="No orders yet" message="New orders will appear here as soon as customers place them." className="py-16" />
    );
  } else {
    body = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-soft md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 bg-cream text-xs uppercase tracking-wider text-charcoal/60">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10">
              {orders.map((o) => (
                <tr key={o.id} className="transition hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <Link to={ROUTES.admin.order(o.id)} className="font-mono text-sm font-semibold tracking-wide transition hover:text-gold-dark">
                      {o.orderId}
                    </Link>
                    <p className="text-xs text-charcoal/60">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-[12rem] truncate font-medium">{o.customer?.name}</p>
                    <p className="text-xs text-charcoal/60">
                      {o.customer?.phone} · {o.shippingAddress?.city}
                    </p>
                  </td>
                  <td className="px-4 py-3">{o.itemCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{money(o.total)}</td>
                  <td className="px-4 py-3">
                    <PaymentBadge status={o.paymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-3 md:hidden">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={ROUTES.admin.order(o.id)} className="block rounded-2xl bg-white p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold tracking-wide">{o.orderId}</p>
                    <p className="text-xs text-charcoal/60">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
                <p className="mt-3 truncate text-sm font-medium">{o.customer?.name}</p>
                <p className="text-xs text-charcoal/60">
                  {o.customer?.phone} · {o.shippingAddress?.city}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-charcoal/10 pt-3 text-sm">
                  <span className="text-charcoal/60">
                    {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'} · <PaymentBadge status={o.paymentStatus} className="px-2 py-0.5" />
                  </span>
                  <span className="font-semibold">{money(o.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Pagination pagination={pagination} onPage={(page) => setParams({ page })} />
      </div>
    );
  }

  return (
    <>
      <Seo title="Orders" noindex />
      <PageHeader
        title="Orders"
        description="Every order placed in your store."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} loading={query.isFetching && !query.isPlaceholderData} onClick={() => query.refetch()}>
            Refresh
          </Button>
        }
      />

      <StatusTabs tabs={tabs} value={pick(params.status, ALL_STATUSES)} onChange={(status) => setParams({ status })} />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Order ID, name, phone, email or city"
          label="Search orders"
          className="sm:col-span-2 lg:col-span-1"
        />
        <select
          className="input py-2.5"
          aria-label="Filter by payment"
          value={pick(params.payment, PAYMENT_STATUS_OPTIONS)}
          onChange={(e) => setParams({ payment: e.target.value })}
        >
          <option value="">Any payment status</option>
          {PAYMENT_STATUS_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {paymentLabel(p)}
            </option>
          ))}
        </select>
        <label className="block text-xs text-charcoal/60">
          From date
          <input
            type="date"
            className="input mt-1 py-2.5"
            value={validDate(params.from) ? params.from : ''}
            onChange={(e) => setParams({ from: e.target.value })}
          />
        </label>
        <label className="block text-xs text-charcoal/60">
          To date
          <input
            type="date"
            className="input mt-1 py-2.5"
            value={validDate(params.to) ? params.to : ''}
            onChange={(e) => setParams({ to: e.target.value })}
          />
        </label>
      </div>

      {body}
    </>
  );
}