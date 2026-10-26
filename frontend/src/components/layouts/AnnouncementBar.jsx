import { useSettings } from '../../context/SettingsContext.jsx';

export default function AnnouncementBar() {
  const { settings, money } = useSettings();

  const text =
    settings.announcement ||
    (settings.freeShippingThreshold > 0
      ? `Free delivery on orders over ${money(settings.freeShippingThreshold)}  ·  Cash on Delivery available`
      : 'Cash on Delivery available');

  return (
    <div className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-cream/90">
      <p className="container-cz">{text}</p>
    </div>
  );
}