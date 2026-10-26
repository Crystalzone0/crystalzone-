import { useSettings } from '../../context/SettingsContext.jsx';

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-charcoal/70">{label}</dt>
      <dd className={tone}>{value}</dd>
    </div>
  );
}

/** Subtotal, discount, shipping and total. All numbers come from the server (never calculated here). */
export default function CartSummary({ summary }) {
  const { money } = useSettings();
  const empty = summary.itemCount === 0;

  return (
    <dl className="space-y-3 text-sm">
      <Row
        label={`Subtotal (${summary.itemCount} ${summary.itemCount === 1 ? 'item' : 'items'})`}
        value={money(summary.subtotal)}
      />
      {summary.discount > 0 && <Row label="Discount" value={`- ${money(summary.discount)}`} tone="text-emerald-700" />}
      <Row label="Shipping" value={empty ? '-' : summary.shippingFee === 0 ? 'Free' : money(summary.shippingFee)} />
      <div className="flex items-center justify-between border-t border-charcoal/10 pt-4 text-lg font-semibold">
        <dt>Total</dt>
        <dd>{money(summary.total)}</dd>
      </div>
    </dl>
  );
}