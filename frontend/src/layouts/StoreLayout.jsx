import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementBar from '../components/layouts/AnnouncementBar.jsx';
import Header from '../components/layouts/Header.jsx';
import Footer from '../components/layouts/Footer.jsx';
import WhatsAppButton from '../components/layouts/WhatsAppButton.jsx';
import PageLoader from '../components/ui/PageLoader.jsx';

/** Header, footer and WhatsApp button stay on screen while a page's code loads. */
export default function StoreLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          {/* A new key per page: each page fades in softly (about a quarter of a second). Filters and tabs, which only change the query string, do not retrigger it. */}
          <div key={pathname} className="animate-page">
            <Outlet />
          </div>
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}