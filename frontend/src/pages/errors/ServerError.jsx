import { AlertTriangle, RefreshCw } from 'lucide-react';
import Logo from '../../components/common/Logo.jsx';
import { isChunkLoadError } from '../../utils/lazyWithRetry.js';

/** Self-contained (no layout, no data), so it still works when other parts of the app have failed. */
export default function ServerError({ error, onRetry }) {
  const outdated = isChunkLoadError(error);
  const reload = () => window.location.reload();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12 text-center">
      <Logo />
      <span className="mb-5 mt-12 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
        {outdated ? <RefreshCw size={28} aria-hidden="true" /> : <AlertTriangle size={28} aria-hidden="true" />}
      </span>
      <h1 className="font-serif text-3xl sm:text-4xl">{outdated ? 'A new version is available' : 'Something went wrong'}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-charcoal/70">
        {outdated
          ? 'We have just updated the store. Please reload the page to continue.'
          : 'We hit an unexpected problem. Please try again, or go back to the home page.'}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-gold" onClick={outdated ? reload : onRetry || reload}>
          {outdated ? 'Reload page' : 'Try again'}
        </button>
        <a href="/" className="btn-outline">
          Back to home
        </a>
      </div>
    </div>
  );
}