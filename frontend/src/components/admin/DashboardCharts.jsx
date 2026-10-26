import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { compactNumber, shortDay } from '../../utils/admin.js';
import { formatMoney } from '../../utils/format.js';

const GRID = '#2B2B2B';

/** Sales value per day for the last 30 days. */
export function SalesChart({ data, currency }) {
  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div>
      <p className="sr-only">
        Sales in the last {data.length} days: {formatMoney(totalSales, currency)} from {totalOrders} orders.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} strokeOpacity={0.1} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDay}
            tick={{ fontSize: 11, fill: '#2B2B2B' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tickFormatter={compactNumber}
            tick={{ fontSize: 11, fill: '#2B2B2B' }}
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value, name) => [name === 'sales' ? formatMoney(value, currency) : value, name === 'sales' ? 'Sales' : 'Orders']}
            labelFormatter={shortDay}
            contentStyle={{ borderRadius: 12, border: '1px solid #EDE6D9', fontSize: 12 }}
          />
          <Area type="monotone" dataKey="sales" stroke="#B8942A" strokeWidth={2} fill="#D4AF37" fillOpacity={0.18} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const STATUS_COLORS = { Delivered: '#047857', Cancelled: '#B91C1C' };

/** Number of orders in each status. */
export function StatusChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div>
      <p className="sr-only">
        Orders by status: {data.map((d) => `${d.status} ${d.count}`).join(', ')}. {total} orders in total.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} strokeOpacity={0.1} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#2B2B2B' }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="status" width={112} tick={{ fontSize: 12, fill: '#2B2B2B' }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [value, 'Orders']}
            cursor={{ fill: '#F7F3EC' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #EDE6D9', fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
            {data.map((d) => (
              <Cell key={d.status} fill={STATUS_COLORS[d.status] || '#D4AF37'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}