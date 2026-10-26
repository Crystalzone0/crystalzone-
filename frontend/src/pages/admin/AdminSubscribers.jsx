import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Mail, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ListSkeleton from '../../components/admin/ListSkeleton.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import useListParams from '../../hooks/useListParams.js';
import useSearchInput from '../../hooks/useSearchInput.js';
import * as adminApi from '../../services/adminApi.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDateTime } from '../../utils/format.js';
import { cn } from '../../utils/cn.js';

const PAGE_SIZE = 25;
const DEFAULTS = { q: '' };

export default function AdminSubscribers() {
  const queryClient = useQueryClient();
  const { params, setParams, reset } = useListParams(DEFAULTS);
  const [search, setSearch] = useSearchInput(params.q, (q) => setParams({ q }));
  const [exporting, setExporting] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const apiParams = { page: params.page, limit: PAGE_SIZE };
  if (params.q) apiParams.search = params.q.slice(0, 80);

  const query = useQuery({
    queryKey: ['admin', 'subscribers', apiParams],
    queryFn: () => adminApi.listSubscribers(apiParams),
    placeholderData: keepPreviousData,
  });

  const subscribers = query.data?.subscribers ?? [];
  const pagination = query.data?.pagination;

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await adminApi.exportSubscribers();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'crystal-zone-subscribers.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Subscribers exported');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteSubscriber(toDelete.id);
      toast.success('Subscriber removed');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      if (subscribers.length === 1 && params.page > 1) setParams({ page: params.page - 1 });
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  let body;
  if (query.isPending) {
    body = <ListSkeleton rows={5} className="h-14" />;
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-16" />;
  } else if (subscribers.length === 0) {
    body = params.q ? (
      <EmptyState icon={Mail} title="No subscribers match" message="Try a different search." action={<Button onClick={reset}>Clear search</Button>} className="py-16" />
    ) : (
      <EmptyState icon={Mail} title="No subscribers yet" message="Email addresses from your newsletter sign-up form appear here." className="py-16" />
    );
  } else {
    body = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <ul className="divide-y divide-charcoal/10 overflow-hidden rounded-2xl bg-white shadow-soft">
          {subscribers.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <a href={`mailto:${s.email}`} className="block break-all text-sm font-medium transition hover:text-gold-dark">
                  {s.email}
                </a>
                <p className="text-xs text-charcoal/60">Subscribed {formatDateTime(s.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-charcoal/10 text-charcoal/70'
                  )}
                >
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  type="button"
                  onClick={() => setToDelete(s)}
                  aria-label={`Remove ${s.email}`}
                  className="rounded-full p-2.5 text-charcoal/50 transition hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 size={17} />
                </button>
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
      <Seo title="Subscribers" noindex />
      <PageHeader
        title="Newsletter subscribers"
        description="People who signed up on your website."
        actions={
          <Button icon={Download} loading={exporting} onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />

      {query.data && (
        <div className="mb-6 grid max-w-md grid-cols-2 gap-4">
          <StatCard label="Active subscribers" value={query.data.activeCount} icon={Mail} tone="green" />
        </div>
      )}

      <SearchBox value={search} onChange={setSearch} placeholder="Search by email" label="Search subscribers" className="mb-6 max-w-xl" />

      {body}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove this subscriber?"
        message={<p><strong>{toDelete?.email}</strong> will be removed from your list. They can subscribe again from your website.</p>}
        confirmLabel="Remove"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}