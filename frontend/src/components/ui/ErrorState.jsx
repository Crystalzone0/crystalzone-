import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import Button from './Button.jsx';
import { cn } from '../../utils/cn.js';

/** Shown when a request fails. Understands network errors (offline) vs server errors. */
export default function ErrorState({ error, onRetry, title, className }) {
  const offline = Boolean(error?.isNetwork);
  const Icon = offline ? WifiOff : AlertTriangle;
  const heading = title || (offline ? 'You seem to be offline' : 'Something went wrong');
  const message = error?.message || 'Please try again in a moment.';

  return (
    <div role="alert" className={cn('mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center', className)}>
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
        <Icon size={28} aria-hidden="true" />
      </span>
      <h2 className="font-serif text-2xl">{heading}</h2>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{message}</p>
      {onRetry && (
        <Button variant="dark" icon={RefreshCw} onClick={onRetry} className="mt-6">
          Try again
        </Button>
      )}
    </div>
  );
}