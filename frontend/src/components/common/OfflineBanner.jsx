import { WifiOff } from 'lucide-react';
import useOnlineStatus from '../../hooks/useOnlineStatus.js';

/** Shown across the whole app (store and admin) while the device is offline. Data refreshes by itself on reconnect. */
export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[95] flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900 print:hidden"
    >
      <WifiOff size={16} className="shrink-0" aria-hidden="true" />
      You are offline. Some things will not work until your connection is back.
    </div>
  );
}