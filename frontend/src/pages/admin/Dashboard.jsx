import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Boxes, CheckCircle2, ClipboardList, Clock, Gem, Plus, RefreshCw, TrendingUp, Users, XCircle } from 'lucide-react';
import Seo from '../../components/common/Seo.jsx';
import { SalesChart, StatusChart } from '../../components/admin/DashboardCharts.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import StatCard from '../../components/admin/StatCard.jsx';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import * as adminApi from '../../services/adminApi.js';
import { formatDate, formatMoney } from '../../utils/format.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

function Card({ title, action, children, className }) {
  return (
    <section className={cn('rounded-3xl bg-white p-5 shadow-soft sm:p-6', className)}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl sm:text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-8 h-10 w-64" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const query = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.getDashboard,
    staleTime: 30_000,
    refetchOnMount: 'always',
  });

  if (query.isPending) return <DashboardSkeleton />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-24" />;

  const { stats, currency, ordersByStatus, salesByDay, topProducts, recentOrders, lowStockProducts, lowStockThreshold } = query.data;
  const money = (amount) => formatMoney(amount, currency);
  const orders = ROUTES.admin.orders;

  return (
    <>
      <Seo title="Dashboard" noindex />
      <PageHeader
        title="Dashboard"
        description="Live figures from your store."
        actions={
          <>
            <Button variant="outline" size="sm" icon={RefreshCw} loading={query.isFetching} onClick={() => query.refetch()}>
              Refresh
            </Button>
            <Button to={ROUTES.admin.newProduct} size="sm" icon={Plus}>
              Add product
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total sales" value={money(stats.totalSales)} hint="All orders except cancelled" icon={TrendingUp} />
        <StatCard label="Total revenue" value={money(stats.totalRevenue)} hint="Delivered orders (cash collected)" icon={Banknote} tone="green" />
        <StatCard label="Total orders" value={stats.totalOrders} hint={`${stats.itemsSold} items sold`} icon={ClipboardList} tone="dark" to={orders} />
        <StatCard label="Pending orders" value={stats.pendingOrders} hint={`${stats.newOrders} new, not yet confirmed`} icon={Clock} tone="amber" to={orders} />
        <StatCard label="Completed orders" value={stats.completedOrders} hint="Delivered" icon={CheckCircle2} tone="green" to={orders} />
        <StatCard label="Cancelled orders" value={stats.cancelledOrders} icon={XCircle} tone="red" to={orders} />
        <StatCard label="Customers" value={stats.customers} hint={`${stats.newCustomers} joined in 30 days`} icon={Users} to={ROUTES.admin.customers} />
        <StatCard label="Products" value={stats.products} hint={`${stats.activeProducts} visible in store`} icon={Gem} to={ROUTES.admin.products} />
        <StatCard
          label="Low stock"
          value={stats.lowStock}
          hint={`${stats.outOfStock} out of stock`}
          icon={Boxes}
          tone="amber"
          to={ROUTES.admin.inventory}
        />
        <StatCard label="Average order" value={money(stats.averageOrderValue)} hint="Excluding cancelled" icon={Banknote} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="Sales, last 30 days">
          <SalesChart data={salesByDay} currency={currency} />
        </Card>
        <Card title="Orders by status">
          <StatusChart data={ordersByStatus} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card
          title="Recent orders"
          action={
            <Link to={orders} className="text-sm underline underline-offset-4 transition hover:text-gold-dark">
              View all
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-charcoal/60">No orders yet. New orders will appear here.</p>
          ) : (
            <ul className="divide-y divide-charcoal/10">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    to={ROUTES.admin.order(order.id)}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 transition hover:bg-cream/60"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold tracking-wide">{order.orderId}</p>
                      <p className="truncate text-xs text-charcoal/60">
                        {order.customer?.name} &middot; {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <p className="w-24 text-right text-sm font-semibold">{money(order.total)}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Top products">
            {topProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-charcoal/60">Best sellers appear here after your first orders.</p>
            ) : (
              <ol className="space-y-4">
                {topProducts.map((p, i) => (
                  <li key={p.productId} className="flex items-center gap-3">
                    <span className="w-5 text-center text-sm text-charcoal/40">{i + 1}</span>
                    <div className="h-11 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                      <ProductImage src={p.image} alt="" width={120} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-charcoal/60">
                        {p.units} sold &middot; {money(p.revenue)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card
            title="Low stock"
            action={
              <Link to={ROUTES.admin.inventory} className="text-sm underline underline-offset-4 transition hover:text-gold-dark">
                Inventory
              </Link>
            }
          >
            {lowStockProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-charcoal/60">Every product has more than {lowStockThreshold} in stock.</p>
            ) : (
              <ul className="space-y-3">
                {lowStockProducts.map((p) => (
                  <li key={p.id}>
                    <Link to={ROUTES.admin.editProduct(p.id)} className="flex items-center gap-3 transition hover:text-gold-dark">
                      <div className="h-11 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-dark">
                        <ProductImage src={p.primaryImage} alt="" width={120} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-charcoal/60">{p.sku}</p>
                      </div>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-xs font-semibold',
                          p.stock <= 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                        )}
                      >
                        {p.stock <= 0 ? 'Out' : p.stock}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}