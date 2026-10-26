import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ListSkeleton from '../../components/admin/ListSkeleton.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import StatusTabs from '../../components/admin/StatusTabs.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import useListParams from '../../hooks/useListParams.js';
import useSearchInput from '../../hooks/useSearchInput.js';
import * as adminApi from '../../services/adminApi.js';
import { getErrorMessage } from '../../services/api.js';
import { pick } from '../../utils/adminLists.js';
import { formatDate } from '../../utils/format.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const PAGE_SIZE = 15;
const DEFAULTS = { q: '', status: '' };

const pill = (tone) => cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', tone);

function StatusPill({ active }) {
  return <span className={pill(active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>{active ? 'Active' : 'Disabled'}</span>;
}

export default function AdminCustomers() {
  const queryClient = useQueryClient();
  const { money } = useSettings();
  const { params, setParams, reset } = useListParams(DEFAULTS);
  const [search, setSearch] = useSearchInput(params.q, (q) => setParams({ q }));
  const [busyId, setBusyId] = useState(null);
  const [toDisable, setToDisable] = useState(null);

  const apiParams = { page: params.page, limit: PAGE_SIZE };
  if (params.q) apiParams.search = params.q.slice(0, 80);
  if (pick(params.status, ['active', 'disabled'])) apiParams.status = params.status;

  const query = useQuery({
    queryKey: ['admin', 'customers', apiParams],
    queryFn: () => adminApi.listCustomers(apiParams),
    placeholderData: keepPreviousData,
  });

  const customers = query.data?.customers ?? [];
  const pagination = query.data?.pagination;
  const filtersActive = Boolean(apiParams.search || apiParams.status);

  const setActive = async (customer, isActive) => {
    setBusyId(customer._id);
    try {
      await adminApi.setCustomerStatus(customer._id, isActive);
      toast.success(isActive ? 'Account enabled' : 'Account disabled');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      setToDisable(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { value: '', label: 'All customers' },
    { value: 'active', label: 'Active' },
    { value: 'disabled', label: 'Disabled', count: query.data?.disabledCount },
  ];

  const toggleButton = (c) =>
    c.isActive ? (
      <button
        type="button"
        onClick={() => setToDisable(c)}
        disabled={busyId === c._id}
        className="inline-flex h-9 items-center rounded-full px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
      >
        Disable
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setActive(c, true)}
        disabled={busyId === c._id}
        className="inline-flex h-9 items-center rounded-full px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
      >
        Enable
      </button>
    );

  let body;
  if (query.isPending) {
    body = <ListSkeleton />;
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-16" />;
  } else if (customers.length === 0) {
    body = filtersActive ? (
      <EmptyState
        icon={Users}
        title="No customers match"
        message="Try a different search, or clear the filters."
        action={<Button onClick={reset}>Clear filters</Button>}
        className="py-16"
      />
    ) : (
      <EmptyState icon={Users} title="No customers yet" message="Customers who create an account will appear here. Guest orders do not create accounts." className="py-16" />
    );
  } else {
    body = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-soft md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 bg-cream text-xs uppercase tracking-wider text-charcoal/60">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Total spent</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10">
              {customers.map((c) => (
                <tr key={c._id} className={cn(!c.isActive && 'bg-charcoal/[0.03]')}>
                  <td className="px-4 py-3">
                    <Link to={ROUTES.admin.customer(c._id)} className="block max-w-[15rem] truncate font-medium transition hover:text-gold-dark">
                      {c.name}
                    </Link>
                    <p className="max-w-[15rem] truncate text-xs text-charcoal/60">
                      {c.email} · {c.phone}
                    </p>
                  </td>
                  <td className="px-4 py-3">{c.orderCount}</td>
                  <td className="whitespace-nowrap px-4 py-3">{money(c.totalSpent)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-charcoal/70">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusPill active={c.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={ROUTES.admin.customer(c._id)} className="inline-flex h-9 items-center rounded-full px-3 text-xs font-medium transition hover:bg-charcoal/5">
                        View
                      </Link>
                      {toggleButton(c)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-3 md:hidden">
          {customers.map((c) => (
            <li key={c._id} className="rounded-2xl bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={ROUTES.admin.customer(c._id)} className="block truncate font-medium">
                    {c.name}
                  </Link>
                  <p className="truncate text-xs text-charcoal/60">{c.email}</p>
                  <p className="text-xs text-charcoal/60">{c.phone}</p>
                </div>
                <StatusPill active={c.isActive} />
              </div>
              <p className="mt-3 text-sm text-charcoal/70">
                {c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'} · {money(c.totalSpent)} · joined {formatDate(c.createdAt)}
              </p>
              <div className="mt-3 flex items-center gap-1 border-t border-charcoal/10 pt-2">
                <Link to={ROUTES.admin.customer(c._id)} className="inline-flex h-9 items-center rounded-full px-3 text-xs font-medium transition hover:bg-charcoal/5">
                  View
                </Link>
                {toggleButton(c)}
              </div>
            </li>
          ))}
        </ul>

        <Pagination pagination={pagination} onPage={(page) => setParams({ page })} />
      </div>
    );
  }

  return (
    <>
      <Seo title="Customers" noindex />
      <PageHeader title="Customers" description="Everyone who has created an account." />

      <StatusTabs tabs={tabs} value={pick(params.status, ['active', 'disabled'])} onChange={(status) => setParams({ status })} label="Filter by account status" />
      <SearchBox value={search} onChange={setSearch} placeholder="Search name, email or phone" label="Search customers" className="mb-6 max-w-xl" />

      {body}

      <ConfirmDialog
        open={Boolean(toDisable)}
        title="Disable this account?"
        message={
          <p>
            <strong>{toDisable?.name}</strong> will be logged out and will not be able to log in until you enable the account again. Their past
            orders stay in your records.
          </p>
        }
        confirmLabel="Disable account"
        danger
        loading={Boolean(toDisable) && busyId === toDisable?._id}
        onConfirm={() => setActive(toDisable, false)}
        onClose={() => setToDisable(null)}
      />
    </>
  );
}