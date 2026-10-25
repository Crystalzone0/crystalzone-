import {
  Order,
  OrderItem,
  Product,
  User,
  Review,
  ContactMessage,
  NewsletterSubscriber,
  ORDER_STATUSES,
} from '../models/index.js';
import { getSettings } from './settingsService.js';
import { STORE_TIMEZONE, lastDays, startOfDay } from '../utils/dates.js';

const DAYS = 30;

/**
 * Real statistics from MongoDB. Definitions:
 *   totalSales   = value of all orders that are not cancelled (booked business)
 *   totalRevenue = value of Delivered orders (cash collected on delivery)
 *   pending      = every order that is neither Delivered nor Cancelled
 */
export async function getDashboardStats() {
  const settings = await getSettings();
  const threshold = settings.lowStockThreshold;
  const days = lastDays(DAYS);
  const since = startOfDay(days[0]);

  const [
    statusRows,
    dailyRows,
    topProducts,
    customers,
    newCustomers,
    productTotal,
    productActive,
    lowStock,
    outOfStock,
    recentOrders,
    lowStockProducts,
    newMessages,
    subscribers,
    reviews,
  ] = await Promise.all([
    Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$total' },
          items: { $sum: '$itemCount' },
        },
      },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: STORE_TIMEZONE } },
          orders: { $sum: 1 },
          sales: { $sum: '$total' },
        },
      },
    ]),
    OrderItem.aggregate([
      { $lookup: { from: Order.collection.name, localField: 'order', foreignField: '_id', as: 'parent' } },
      { $unwind: '$parent' },
      { $match: { 'parent.status': { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: '$product',
          name: { $first: '$name' },
          image: { $first: '$image' },
          units: { $sum: '$quantity' },
          revenue: { $sum: '$lineTotal' },
        },
      },
      { $sort: { units: -1, revenue: -1 } },
      { $limit: 5 },
    ]),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: since } }),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ stock: { $gt: 0, $lte: threshold } }),
    Product.countDocuments({ stock: 0 }),
    Order.find()
      .sort({ createdAt: -1, _id: -1 })
      .limit(8)
      .select('orderId customer.name total status paymentStatus itemCount createdAt'),
    Product.find({ stock: { $lte: threshold } })
      .sort({ stock: 1, _id: 1 })
      .limit(8)
      .select('name sku stock primaryImage isActive'),
    ContactMessage.countDocuments({ status: 'new' }),
    NewsletterSubscriber.countDocuments({ isActive: true }),
    Review.countDocuments(),
  ]);

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, { count: 0, amount: 0 }]));
  let itemsSold = 0;
  for (const row of statusRows) {
    if (byStatus[row._id]) byStatus[row._id] = { count: row.count, amount: row.amount };
    if (row._id !== 'Cancelled') itemsSold += row.items;
  }

  const totalOrders = Object.values(byStatus).reduce((sum, s) => sum + s.count, 0);
  const cancelled = byStatus.Cancelled;
  const delivered = byStatus.Delivered;
  const activeOrders = totalOrders - cancelled.count; // orders that count as business
  const totalSales = Object.entries(byStatus)
    .filter(([status]) => status !== 'Cancelled')
    .reduce((sum, [, s]) => sum + s.amount, 0);

  const dailyMap = new Map(dailyRows.map((r) => [r._id, r]));
  const salesByDay = days.map((date) => ({
    date,
    orders: dailyMap.get(date)?.orders || 0,
    sales: dailyMap.get(date)?.sales || 0,
  }));

  return {
    currency: settings.currency,
    lowStockThreshold: threshold,
    stats: {
      totalSales,
      totalRevenue: delivered.amount,
      averageOrderValue: activeOrders > 0 ? Math.round(totalSales / activeOrders) : 0,
      itemsSold,
      totalOrders,
      pendingOrders: totalOrders - delivered.count - cancelled.count,
      newOrders: byStatus['Order Placed'].count,
      completedOrders: delivered.count,
      cancelledOrders: cancelled.count,
      customers,
      newCustomers,
      products: productTotal,
      activeProducts: productActive,
      lowStock,
      outOfStock,
      reviews,
      newMessages,
      subscribers,
    },
    ordersByStatus: ORDER_STATUSES.map((status) => ({ status, ...byStatus[status] })),
    salesByDay,
    topProducts: topProducts.map((p) => ({
      productId: String(p._id),
      name: p.name,
      image: p.image,
      units: p.units,
      revenue: p.revenue,
    })),
    recentOrders,
    lowStockProducts,
  };
}