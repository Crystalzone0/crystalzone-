import { useSettings } from '../../context/SettingsContext.jsx';

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-charcoal/70">{label}</dt>
      <dd className={tone}>{value}</dd>
    </div>
  );
}

/** Subtotal, discount, shipping and total of a placed order (values saved by the server). */
export default function OrderTotals({ order }) {
  const { money } = useSettings();

  return (
    <dl className="space-y-2 text-sm">
      <Row label="Subtotal" value={money(order.subtotal)} />
      {order.discount > 0 && <Row label="Discount" value={`- ${money(order.discount)}`} tone="text-emerald-700" />}
      <Row label="Shipping" value={order.shippingFee === 0 ? 'Free' : money(order.shippingFee)} />
      <div className="flex items-center justify-between border-t border-charcoal/10 pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd>{money(order.total)}</dd>
      </div>
    </dl>
  );
}