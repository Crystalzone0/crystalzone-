import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Eye, EyeOff, Gem, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import useListParams from '../../hooks/useListParams.js';
import useLowStockThreshold from '../../hooks/useLowStockThreshold.js';
import useSearchInput from '../../hooks/useSearchInput.js';
import * as adminApi from '../../services/adminApi.js';
import { getErrorMessage } from '../../services/api.js';
import { invalidateProductCaches } from '../../utils/admin.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const PAGE_SIZE = 15;
const DEFAULTS = { q: '', category: '', status: '', stock: '', sort: 'newest' };

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name-asc', label: 'Name A to Z' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'popular', label: 'Best selling' },
];

const HEX_ID = /^[0-9a-fA-F]{24}$/;
const pick = (value, allowed) => (allowed.includes(value) ? value : '');

const pill = (tone) => cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium', tone);

function StockPill({ stock, threshold }) {
  if (stock <= 0) return <span className={pill('bg-red-50 text-red-700')}>Out of stock</span>;
  if (stock <= threshold) return <span className={pill('bg-amber-50 text-amber-700')}>Low: {stock} left</span>;
  return <span className={pill('bg-emerald-50 text-emerald-700')}>{stock} in stock</span>;
}

function Flags({ product }) {
  const flags = [product.featured && 'Featured', product.bestSeller && 'Best seller', product.newArrival && 'New'].filter(Boolean);
  if (flags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {flags.map((f) => (
        <span key={f} className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-dark">
          {f}
        </span>
      ))}
    </div>
  );
}

function RowActions({ product, busy, onToggle, onDelete }) {
  const btn =
    'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition hover:bg-charcoal/5 disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Link to={ROUTES.admin.editProduct(product.id)} className={btn}>
        <Pencil size={14} aria-hidden="true" /> Edit
      </Link>
      {product.isActive && (
        <a href={ROUTES.product(product.slug)} target="_blank" rel="noopener noreferrer" className={btn}>
          <ExternalLink size={14} aria-hidden="true" /> View
        </a>
      )}
      <button type="button" onClick={() => onToggle(product)} disabled={busy} className={btn}>
        {product.isActive ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}
        {product.isActive ? 'Hide' : 'Show'}
      </button>
      <button type="button" onClick={() => onDelete(product)} disabled={busy} className={cn(btn, 'text-red-700 hover:bg-red-50')}>
        <Trash2 size={14} aria-hidden="true" /> Delete
      </button>
    </div>
  );
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { money } = useSettings();
  const threshold = useLowStockThreshold();
  const { params, setParams, reset } = useListParams(DEFAULTS);
  const [search, setSearch] = useSearchInput(params.q, (q) => setParams({ q }));

  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.listCategories().then((res) => res.categories),
  });
  const categories = categoriesQuery.data ?? [];

  // The URL is cleaned before it reaches the API, so a hand-edited link cannot cause a validation error.
  const apiParams = { page: params.page, limit: PAGE_SIZE, sort: pick(params.sort, SORTS.map((s) => s.value)) || 'newest' };
  if (params.q) apiParams.q = params.q.slice(0, 80);
  if (HEX_ID.test(params.category)) apiParams.category = params.category;
  if (pick(params.status, ['active', 'inactive'])) apiParams.status = params.status;
  if (pick(params.stock, ['in', 'low', 'out'])) apiParams.stockStatus = params.stock;

  const query = useQuery({
    queryKey: ['admin', 'products', apiParams],
    queryFn: () => adminApi.listProducts(apiParams),
    placeholderData: keepPreviousData,
  });

  const products = query.data?.products ?? [];
  const pagination = query.data?.pagination;
  const filtersActive = Boolean(apiParams.q || apiParams.category || apiParams.status || apiParams.stockStatus);

  const toggleActive = async (product) => {
    setBusyId(product.id);
    try {
      await adminApi.updateProduct(product.id, { isActive: !product.isActive });
      toast.success(product.isActive ? 'Product hidden from the store' : 'Product is now visible in the store');
      invalidateProductCaches(queryClient);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deleteProduct(toDelete.id);
      toast.success('Product deleted');
      invalidateProductCaches(queryClient);
      if (products.length === 1 && params.page > 1) setParams({ page: params.page - 1 });
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const select = 'input w-full py-2.5';

  let body;
  if (query.isPending) {
    body = (
      <div className="space-y-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  } else if (query.isError) {
    body = <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-16" />;
  } else if (products.length === 0) {
    body = filtersActive ? (
      <EmptyState
        icon={Search}
        title="No products match"
        message="Try a different search or clear the filters."
        action={<Button onClick={reset}>Clear filters</Button>}
        className="py-16"
      />
    ) : (
      <EmptyState
        icon={Gem}
        title="No products yet"
        message="Add your first product to start selling."
        action={<Button to={ROUTES.admin.newProduct} icon={Plus}>Add product</Button>}
        className="py-16"
      />
    );
  } else {
    body = (
      <div className={cn('transition-opacity', query.isPlaceholderData && 'opacity-60')}>
        {/* Desktop: table */}
        <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-soft md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 bg-cream text-xs uppercase tracking-wider text-charcoal/60">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10">
              {products.map((p) => (
                <tr key={p.id} className={cn(!p.isActive && 'bg-charcoal/[0.03]')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                        <ProductImage src={p.primaryImage} alt="" width={120} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <Link to={ROUTES.admin.editProduct(p.id)} className="block max-w-[16rem] truncate font-medium transition hover:text-gold-dark">
                          {p.name}
                        </Link>
                        <p className="text-xs text-charcoal/60">
                          {p.sku} &middot; {p.category?.name || 'No category'}
                        </p>
                        <Flags product={p} />
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className="font-medium">{money(p.finalPrice)}</p>
                    {p.discount > 0 && (
                      <p className="text-xs text-charcoal/50">
                        <s>{money(p.price)}</s> &middot; {p.discount}% off
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StockPill stock={p.stock} threshold={threshold} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={pill(p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-charcoal/10 text-charcoal/70')}>
                      {p.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions product={p} busy={busyId === p.id} onToggle={toggleActive} onDelete={setToDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phones and tablets: cards */}
        <ul className="space-y-3 md:hidden">
          {products.map((p) => (
            <li key={p.id} className={cn('rounded-2xl bg-white p-4 shadow-soft', !p.isActive && 'opacity-80')}>
              <div className="flex gap-3">
                <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                  <ProductImage src={p.primaryImage} alt="" width={160} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={ROUTES.admin.editProduct(p.id)} className="block font-medium leading-snug">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-charcoal/60">
                    {p.sku} &middot; {p.category?.name || 'No category'}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {money(p.finalPrice)}
                    {p.discount > 0 && <s className="ml-2 text-xs font-normal text-charcoal/50">{money(p.price)}</s>}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StockPill stock={p.stock} threshold={threshold} />
                    <span className={pill(p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-charcoal/10 text-charcoal/70')}>
                      {p.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-charcoal/10 pt-2">
                <RowActions product={p} busy={busyId === p.id} onToggle={toggleActive} onDelete={setToDelete} />
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
      <Seo title="Products" noindex />
      <PageHeader
        title="Products"
        description="Add, edit and manage what you sell."
        actions={
          <Button to={ROUTES.admin.newProduct} icon={Plus}>
            Add product
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <div role="search" className="relative sm:col-span-2 lg:col-span-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={80}
            placeholder="Search name, SKU or tag"
            aria-label="Search products"
            className="input py-2.5 pl-10"
          />
        </div>

        <select
          className={select}
          aria-label="Filter by category"
          value={HEX_ID.test(params.category) ? params.category : ''}
          onChange={(e) => setParams({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.productCount})
            </option>
          ))}
        </select>

        <select className={select} aria-label="Filter by visibility" value={pick(params.status, ['active', 'inactive'])} onChange={(e) => setParams({ status: e.target.value })}>
          <option value="">Any visibility</option>
          <option value="active">Visible in store</option>
          <option value="inactive">Hidden</option>
        </select>

        <select className={select} aria-label="Filter by stock" value={pick(params.stock, ['in', 'low', 'out'])} onChange={(e) => setParams({ stock: e.target.value })}>
          <option value="">Any stock level</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>

        <select className={select} aria-label="Sort products" value={apiParams.sort} onChange={(e) => setParams({ sort: e.target.value })}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {body}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this product?"
        message={
          <>
            <p>
              <strong>{toDelete?.name}</strong> will be removed permanently, including from carts, wishlists and reviews. Past orders
              keep their own copy of the details.
            </p>
            <p className="mt-2">If you only want to stop selling it for now, use Hide instead.</p>
          </>
        }
        confirmLabel="Delete product"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}