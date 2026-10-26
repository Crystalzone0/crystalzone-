import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import ListSkeleton from '../../components/admin/ListSkeleton.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import StatusTabs from '../../components/admin/StatusTabs.jsx';
import { Stars } from '../../components/product/Rating.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import useListParams from '../../hooks/useListParams.js';
import useSearchInput from '../../hooks/useSearchInput.js';
import * as adminApi from '../../services/adminApi.js';
import { getErrorMessage } from '../../services/api.js';
import { pick } from '../../utils/adminLists.js';
import { formatDate } from '../../utils/format.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const PAGE_SIZE = 15;
const DEFAULTS = { q: '', status: '', rating: '' };
const RATINGS = ['1', '2', '3', '4', '5'];

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const { params, setParams, reset } = useListParams(DEFAULTS);
  const [search, setSearch] = useSearchInput(params.q, (q) => setParams({ q }));
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const apiParams = { page: params.page, limit: PAGE_SIZE };
  if (params.q) apiParams.search = params.q.slice(0, 80);
  if (pick(params.status, ['approved', 'hidden'])) apiParams.status = params.status;
  if (pick(params.rating, RATINGS)) apiParams.rating = Number(params.rating);

  const query = useQuery({
    queryKey: ['admin', 'reviews', apiParams],
    queryFn: () => adminApi.listReviews(apiParams),
    placeholderData: keepPreviousData,
  });

  const reviews = query.data?.reviews ?? [];
  const pagination = query.data?.pagination;
  const filtersActive = Boolean(apiParams.search || apiParams.status || apiParams.rating);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
    // A hidden or deleted review changes a product's rating in the store.
    for (const key of ['product', 'products', 'featured-reviews', 'home', 'reviews']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const moderate = async (review) => {
    const next = review.status === 'hidden' ? 'approved' : 'hidden';
    setBusyId(review.id);
    try {
      await adminApi.moderateReview(review.id, next);
      toast.success(next === 'hidden' ? 'Review hidden from the store' : 'Review approved');
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteReview(toDelete.id);
      toast.success('Review deleted');
      refresh();
      if (reviews.length === 1 && params.page > 1) setParams({ page: params.page - 1 });
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { value: '', label: 'All reviews' },
    { value: 'approved', label: 'Approved' },
    { value: 'hidden', label: 'Hidden' },
  ];

  let body;
  if (query.isPending) {
    body = <ListSkeleton rows={4} className="h-32" />;
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-16" />;
  } else if (reviews.length === 0) {
    body = filtersActive ? (
      <EmptyState
        icon={Star}
        title="No reviews match"
        message="Try a different search, or clear the filters."
        action={<Button onClick={reset}>Clear filters</Button>}
        className="py-16"
      />
    ) : (
      <EmptyState icon={Star} title="No reviews yet" message="Customers can review a product after their order has been delivered." className="py-16" />
    );
  } else {
    body = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <ul className="space-y-4">
          {reviews.map((r) => {
            const hidden = r.status === 'hidden';
            return (
              <li key={r.id} className={cn('rounded-2xl bg-white p-5 shadow-soft', hidden && 'bg-charcoal/[0.04]')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Stars value={r.rating} size={16} />
                    <p className="mt-2 text-sm">
                      <span className="font-medium">{r.name}</span>
                      {r.user?.email && <span className="text-charcoal/60"> · {r.user.email}</span>}
                    </p>
                    {r.product && (
                      <p className="text-xs text-charcoal/60">
                        on{' '}
                        <a href={ROUTES.product(r.product.slug)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-gold-dark">
                          {r.product.name}
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                        hidden ? 'bg-charcoal/10 text-charcoal/70' : 'bg-emerald-50 text-emerald-700'
                      )}
                    >
                      {hidden ? 'Hidden' : 'Approved'}
                    </span>
                    <p className="mt-1 text-xs text-charcoal/50">{formatDate(r.createdAt)}</p>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-charcoal/80">{r.comment}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-charcoal/10 pt-3">
                  <Button variant="outline" size="sm" icon={hidden ? Eye : EyeOff} loading={busyId === r.id} onClick={() => moderate(r)}>
                    {hidden ? 'Approve' : 'Hide'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    disabled={busyId === r.id}
                    onClick={() => setToDelete(r)}
                    className="text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>

        <Pagination pagination={pagination} onPage={(page) => setParams({ page })} />
      </div>
    );
  }

  return (
    <>
      <Seo title="Reviews" noindex />
      <PageHeader title="Reviews" description="Moderate what customers say. Hidden reviews disappear from the store and from product ratings." />

      <StatusTabs tabs={tabs} value={pick(params.status, ['approved', 'hidden'])} onChange={(status) => setParams({ status })} label="Filter by review status" />

      <div className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr]">
        <SearchBox value={search} onChange={setSearch} placeholder="Search review text or customer name" label="Search reviews" />
        <select className="input py-2.5" aria-label="Filter by rating" value={pick(params.rating, RATINGS)} onChange={(e) => setParams({ rating: e.target.value })}>
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? '' : 's'}
            </option>
          ))}
        </select>
      </div>

      {body}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this review?"
        message="It will be removed permanently and the product rating will be recalculated. To keep a record, use Hide instead."
        confirmLabel="Delete review"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}