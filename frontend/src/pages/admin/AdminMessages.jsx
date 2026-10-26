import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, MessageCircle, MessageSquare, Phone, Trash2 } from 'lucide-react';
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
import useListParams from '../../hooks/useListParams.js';
import useSearchInput from '../../hooks/useSearchInput.js';
import * as adminApi from '../../services/adminApi.js';
import { getErrorMessage } from '../../services/api.js';
import { pick } from '../../utils/adminLists.js';
import { formatDateTime } from '../../utils/format.js';
import { buildWhatsAppLink } from '../../utils/whatsapp.js';
import { cn } from '../../utils/cn.js';

const PAGE_SIZE = 15;
const DEFAULTS = { q: '', status: '' };
const STATUSES = ['new', 'read', 'resolved'];
const LABELS = { new: 'New', read: 'Read', resolved: 'Resolved' };
const TONES = { new: 'bg-gold/25 text-gold-dark', read: 'bg-charcoal/10 text-charcoal/70', resolved: 'bg-emerald-50 text-emerald-700' };

// The next actions offered for each status: [label, status to set]
const ACTIONS = {
  new: [['Mark as read', 'read'], ['Mark resolved', 'resolved']],
  read: [['Mark resolved', 'resolved'], ['Mark as unread', 'new']],
  resolved: [['Reopen', 'read']],
};

export default function AdminMessages() {
  const queryClient = useQueryClient();
  const { params, setParams, reset } = useListParams(DEFAULTS);
  const [search, setSearch] = useSearchInput(params.q, (q) => setParams({ q }));
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const apiParams = { page: params.page, limit: PAGE_SIZE };
  if (params.q) apiParams.search = params.q.slice(0, 80);
  if (pick(params.status, STATUSES)) apiParams.status = params.status;

  const query = useQuery({
    queryKey: ['admin', 'messages', apiParams],
    queryFn: () => adminApi.listMessages(apiParams),
    placeholderData: keepPreviousData,
  });

  const messages = query.data?.messages ?? [];
  const pagination = query.data?.pagination;
  const counts = query.data?.statusCounts ?? {};
  const filtersActive = Boolean(apiParams.search || apiParams.status);

  const setStatus = async (message, status) => {
    setBusyId(message.id);
    try {
      await adminApi.updateMessage(message.id, status);
      queryClient.invalidateQueries({ queryKey: ['admin'] }); // also updates the dashboard's "new messages"
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteMessage(toDelete.id);
      toast.success('Message deleted');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      if (messages.length === 1 && params.page > 1) setParams({ page: params.page - 1 });
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const tabs = [
    { value: '', label: 'All', count: query.data ? STATUSES.reduce((sum, s) => sum + (counts[s] || 0), 0) : undefined },
    ...STATUSES.map((s) => ({ value: s, label: LABELS[s], count: query.data ? counts[s] || 0 : undefined })),
  ];

  let body;
  if (query.isPending) {
    body = <ListSkeleton rows={4} className="h-36" />;
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-16" />;
  } else if (messages.length === 0) {
    body = filtersActive ? (
      <EmptyState
        icon={MessageSquare}
        title="No messages match"
        message="Try a different search, or clear the filters."
        action={<Button onClick={reset}>Clear filters</Button>}
        className="py-16"
      />
    ) : (
      <EmptyState icon={MessageSquare} title="No messages yet" message="Messages sent through your Contact page appear here." className="py-16" />
    );
  } else {
    body = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className={cn('rounded-2xl bg-white p-5 shadow-soft', m.status === 'new' && 'border-l-4 border-gold')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{m.name}</p>
                  <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-charcoal/70">
                    <li className="flex items-center gap-1.5">
                      <Mail size={14} className="text-gold-dark" aria-hidden="true" />
                      <a href={`mailto:${m.email}`} className="break-all transition hover:text-gold-dark">
                        {m.email}
                      </a>
                    </li>
                    {m.phone && (
                      <li className="flex items-center gap-1.5">
                        <Phone size={14} className="text-gold-dark" aria-hidden="true" />
                        <a href={`tel:${m.phone.replace(/\s/g, '')}`} className="transition hover:text-gold-dark">
                          {m.phone}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
                <div className="text-right">
                  <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', TONES[m.status])}>{LABELS[m.status]}</span>
                  <p className="mt-1 text-xs text-charcoal/50">{formatDateTime(m.createdAt)}</p>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-charcoal/80">{m.message}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-charcoal/10 pt-3">
                {(ACTIONS[m.status] || []).map(([label, next]) => (
                  <Button key={next} variant="outline" size="sm" disabled={busyId === m.id} onClick={() => setStatus(m, next)}>
                    {label}
                  </Button>
                ))}
                <Button
                  href={`mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Crystal Zone')}`}
                  variant="ghost"
                  size="sm"
                  icon={Mail}
                >
                  Reply by email
                </Button>
                {m.phone && (
                  <Button
                    href={buildWhatsAppLink(m.phone, `Hello ${m.name}, this is Crystal Zone replying to your message.`)}
                    variant="ghost"
                    size="sm"
                    icon={MessageCircle}
                  >
                    WhatsApp
                  </Button>
                )}
                <Button variant="ghost" size="sm" icon={Trash2} disabled={busyId === m.id} onClick={() => setToDelete(m)} className="ml-auto text-red-700 hover:bg-red-50">
                  Delete
                </Button>
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
      <Seo title="Messages" noindex />
      <PageHeader title="Contact messages" description="Messages your customers send from the Contact page." />

      <StatusTabs tabs={tabs} value={pick(params.status, STATUSES)} onChange={(status) => setParams({ status })} />
      <SearchBox value={search} onChange={setSearch} placeholder="Search name, email, phone or message" label="Search messages" className="mb-6 max-w-xl" />

      {body}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this message?"
        message={<p>The message from <strong>{toDelete?.name}</strong> will be removed permanently.</p>}
        confirmLabel="Delete message"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}