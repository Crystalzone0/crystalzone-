import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, MessageCircle, Phone, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import AdminCard from '../../components/admin/AdminCard.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import * as adminApi from '../../services/adminApi.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDate, formatDateTime } from '../../utils/format.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';
import { ROUTES } from '../../utils/constants.js';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { money } = useSettings();
  const key = ['admin', 'customer', id];

  const query = useQuery({
    queryKey: key,
    queryFn: () => adminApi.getCustomer(id),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const [saving, setSaving] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  if (query.isPending) {
    return (
      <div aria-hidden="true">
        <Skeleton className="mb-8 h-10 w-72" />
        <Skeleton className="mb-6 h-28 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }
  if (query.error && [400, 404].includes(query.error.status)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Customer not found"
        message="This customer does not exist."
        action={<Button to={ROUTES.admin.customers}>Back to customers</Button>}
        className="py-24"
      />
    );
  }
  if (query.isError && !query.data) return <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-24" />;

  const { customer, orders, addresses } = query.data;

  const setActive = async (isActive) => {
    setSaving(true);
    try {
      await adminApi.setCustomerStatus(customer._id, isActive);
      toast.success(isActive ? 'Account enabled' : 'Account disabled');
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      setConfirmDisable(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const chat = buildWhatsAppLink(customer.phone, `Hello ${customer.name}, this is Crystal Zone.`);

  return (
    <>
      <Seo title={customer.name} noindex />
      <PageHeader
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        backTo={ROUTES.admin.customers}
        backLabel="Customers"
        actions={
          customer.isActive ? (
            <Button variant="outline" onClick={() => setConfirmDisable(true)} className="border-red-200 text-red-700 hover:border-red-400 hover:text-red-800">
              Disable account
            </Button>
          ) : (
            <Button loading={saving} onClick={() => setActive(true)}>
              Enable account
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders" value={customer.orderCount} hint="Excluding cancelled" />
        <StatCard label="Total spent" value={money(customer.totalSpent)} tone="green" />
        <StatCard label="Last order" value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : 'Never'} tone="dark" />
        <StatCard label="Account" value={customer.isActive ? 'Active' : 'Disabled'} tone={customer.isActive ? 'green' : 'red'} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-start">
        <div className="space-y-6">
          <AdminCard title="Account">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-gold-dark" aria-hidden="true" />
                <a href={`mailto:${customer.email}`} className="break-all transition hover:text-gold-dark">
                  {customer.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="shrink-0 text-gold-dark" aria-hidden="true" />
                <a href={`tel:${customer.phone.replace(/\s/g, '')}`} className="transition hover:text-gold-dark">
                  {customer.phone}
                </a>
              </li>
            </ul>
            <p className="mt-4 text-xs text-charcoal/60">
              Last login: {customer.lastLoginAt ? formatDateTime(customer.lastLoginAt) : 'Never'}
            </p>
            <Button href={chat} variant="outline" size="sm" icon={MessageCircle} className="mt-4">
              Message on WhatsApp
            </Button>
          </AdminCard>

          <AdminCard title="Saved addresses">
            {addresses.length === 0 ? (
              <p className="text-sm text-charcoal/60">No saved addresses.</p>
            ) : (
              <ul className="space-y-4">
                {addresses.map((a) => (
                  <li key={a.id} className="text-sm leading-relaxed text-charcoal/80">
                    <p className="font-medium text-ink">
                      {a.label || 'Address'}
                      {a.isDefault && <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-dark">Default</span>}
                    </p>
                    {a.fullName}, {a.phone}
                    <br />
                    {a.address}, {a.city}, {a.province} {a.postalCode}
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>

        <AdminCard title="Orders" description={orders.length === 50 ? 'Showing the latest 50 orders.' : undefined}>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-charcoal/60">This customer has not placed an order yet.</p>
          ) : (
            <ul className="divide-y divide-charcoal/10">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link to={ROUTES.admin.order(o.id)} className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-cream/60">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold tracking-wide">{o.orderId}</p>
                      <p className="text-xs text-charcoal/60">
                        {formatDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={o.status} />
                      <p className="w-24 text-right text-sm font-semibold">{money(o.total)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <ConfirmDialog
        open={confirmDisable}
        title="Disable this account?"
        message={
          <p>
            <strong>{customer.name}</strong> will be logged out and will not be able to log in until you enable the account again. Their past
            orders stay in your records.
          </p>
        }
        confirmLabel="Disable account"
        danger
        loading={saving}
        onConfirm={() => setActive(false)}
        onClose={() => setConfirmDisable(false)}
      />
    </>
  );
}