import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, Pencil, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import ListSkeleton from '../../components/admin/ListSkeleton.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import SearchBox from '../../components/admin/SearchBox.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import StatusTabs from '../../components/admin/StatusTabs.jsx';
import StockPill from '../../components/admin/StockPill.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import useListParams from '../../hooks/useListParams.js';
import useSearchInput from '../../hooks/useSearchInput.js';
import * as adminApi from '../../services/adminApi.js';
import { getErrorMessage } from '../../services/api.js';
import { HEX_ID, pick } from '../../utils/adminLists.js';
import { invalidateProductCaches } from '../../utils/admin.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const PAGE_SIZE = 20;
const DEFAULTS = { q: '', category: '', stock: '' };
const MAX_STOCK = 1_000_000;

/** Number box with Save. Enter also saves. "Out" sets the stock to 0 straight away. */
function StockCell({ item, saving, onSave }) {
  const [text, setText] = useState(String(item.stock));
  useEffect(() => setText(String(item.stock)), [item.stock]);

  const value = text === '' ? null : Number(text);
  const valid = value !== null && Number.isInteger(value) && value >= 0 && value <= MAX_STOCK;
  const changed = valid && value !== item.stock;

  const submit = () => {
    if (changed && !saving) onSave(item, value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 7))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        aria-label={`Stock quantity for ${item.name}`}
        aria-invalid={!valid || undefined}
        className={cn('input w-24 py-2 text-center', !valid && 'border-red-400')}
      />
      <Button size="sm" onClick={submit} disabled={!changed} loading={saving}>
        Save
      </Button>
      {item.stock > 0 && (
        <button
          type="button"
          onClick={() => onSave(item, 0)}
          disabled={saving}
          className="text-xs text-charcoal/60 underline underline-offset-4 transition hover:text-red-700 disabled:opacity-50"
        >
          Out
        </button>
      )}
    </div>
  );
}

export default function AdminInventory() {
  const queryClient = useQueryClient();
  const { money } = useSettings();
  const { params, setParams, reset } = useListParams(DEFAULTS);
  const [search, setSearch] = useSearchInput(params.q, (q) => setParams({ q }));
  const [busyId, setBusyId] = useState(null);

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.listCategories().then((res) => res.categories),
  });
  const categories = categoriesQuery.data ?? [];

  const apiParams = { page: params.page, limit: PAGE_SIZE };
  if (params.q) apiParams.q = params.q.slice(0, 80);
  if (HEX_ID.test(params.category)) apiParams.category = params.category;
  if (pick(params.stock, ['in', 'low', 'out'])) apiParams.stockStatus = params.stock;

  const query = useQuery({
    queryKey: ['admin', 'inventory', apiParams],
    queryFn: () => adminApi.getInventory(apiParams),
    placeholderData: keepPreviousData,
  });

  const summary = query.data?.summary;
  const items = query.data?.items ?? [];
  const pagination = query.data?.pagination;
  const filtersActive = Boolean(apiParams.q || apiParams.category || apiParams.stockStatus);

  const saveStock = async (item, stock) => {
    setBusyId(item.id);
    try {
      await adminApi.setStock(item.id, stock);
      toast.success(stock === 0 ? `${item.name} is now out of stock` : 'Stock updated');
      invalidateProductCaches(queryClient);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { value: '', label: 'All', count: summary?.totalProducts },
    { value: 'in', label: 'In stock', count: summary ? summary.totalProducts - summary.outOfStock : undefined },
    { value: 'low', label: 'Low stock', count: summary?.lowStock },
    { value: 'out', label: 'Out of stock', count: summary?.outOfStock },
  ];

  let body;
  if (query.isPending) {
    body = <ListSkeleton />;
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-16" />;
  } else if (items.length === 0) {
    body = filtersActive ? (
      <EmptyState
        icon={Boxes}
        title="No products match"
        message="Try a different search or clear the filters."
        action={<Button onClick={reset}>Clear filters</Button>}
        className="py-16"
      />
    ) : (
      <EmptyState
        icon={Boxes}
        title="No products yet"
        message="Inventory appears here once you add products."
        action={<Button to={ROUTES.admin.newProduct}>Add product</Button>}
        className="py-16"
      />
    );
  } else {
    body = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
       <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-soft md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 bg-cream text-xs uppercase tracking-wider text-charcoal/60">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                        <ProductImage src={item.image} alt="" width={120} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <Link to={ROUTES.admin.editProduct(item.id)} className="block max-w-[15rem] truncate font-medium transition hover:text-gold-dark">
                          {item.name}
                        </Link>
                        <p className="text-xs text-charcoal/60">
                          {item.category || 'No category'}
                          {!item.isActive && ' · Hidden'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{item.sku}</td>
                  <td className="whitespace-nowrap px-4 py-3">{money(item.finalPrice)}</td>
                  <td className="px-4 py-3">
                    <StockPill status={item.status} stock={item.stock} />
                  </td>
                  <td className="px-4 py-3">
                    <StockCell item={item} saving={busyId === item.id} onSave={saveStock} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-3 md:hidden">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl bg-white p-4 shadow-soft">
              <div className="flex gap-3">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                  <ProductImage src={item.image} alt="" width={160} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={ROUTES.admin.editProduct(item.id)} className="block font-medium leading-snug">
                    {item.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-charcoal/60">{item.sku}</p>
                  <div className="mt-2">
                    <StockPill status={item.status} stock={item.stock} />
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-charcoal/10 pt-3">
                <StockCell item={item} saving={busyId === item.id} onSave={saveStock} />
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
      <Seo title="Inventory" noindex />
      <PageHeader
        title="Inventory"
        description="Check stock levels and update quantities. Stock drops automatically when orders are placed."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} loading={query.isFetching && !query.isPlaceholderData} onClick={() => query.refetch()}>
            Refresh
          </Button>
        }
      />

      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-5">
          <StatCard label="Products tracked" value={summary.totalProducts} icon={Boxes} />
          <StatCard label="Units in stock" value={summary.totalUnits} icon={Boxes} tone="dark" />
          <StatCard label="Stock value" value={money(summary.stockValue)} hint="At current selling prices" icon={Boxes} tone="green" />
          <StatCard label="Low stock" value={summary.lowStock} hint={`${summary.lowStockThreshold} or fewer left`} icon={Boxes} tone="amber" />
          <StatCard label="Out of stock" value={summary.outOfStock} icon={Boxes} tone="red" />
        </div>
      )}

      <StatusTabs tabs={tabs} value={pick(params.stock, ['in', 'low', 'out'])} onChange={(stock) => setParams({ stock })} label="Filter by stock level" />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, SKU or tag" label="Search inventory" />
        <select
          className="input py-2.5"
          aria-label="Filter by category"
          value={HEX_ID.test(params.category) ? params.category : ''}
          onChange={(e) => setParams({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {body}
    </>
  );
}