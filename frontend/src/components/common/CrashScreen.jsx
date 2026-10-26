import { isChunkLoadError } from '../../utils/lazyWithRetry.js';

/**
 * Last-resort screen for a failure in the app's top-level providers. It uses no router, no context and
 * no data, so it can always render. Plain links and a full reload are used on purpose.
 */
export default function CrashScreen({ error }) {
  const outdated = isChunkLoadError(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12 text-center">
      <p className="font-serif text-2xl font-semibold uppercase tracking-luxe text-ink">Crystal Zone</p>
      <h1 className="mt-10 font-serif text-3xl sm:text-4xl">{outdated ? 'A new version is available' : 'Something went wrong'}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-charcoal/70">
        {outdated
          ? 'We have just updated the store. Please reload the page to continue.'
          : 'The store could not start properly. Please reload the page. If the problem continues, message us on WhatsApp.'}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-gold" onClick={() => window.location.reload()}>
          Reload page
        </button>
        <a href="/" className="btn-outline">
          Back to home
        </a>
      </div>
    </div>
  );
}