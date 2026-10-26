import { Suspense, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LogOut, Menu, Store, X } from 'lucide-react';
import AdminNav from '../components/admin/AdminNav.jsx';
import Logo from '../components/common/Logo.jsx';
import PageLoader from '../components/ui/PageLoader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useLockBodyScroll from '../hooks/useLockBodyScroll.js';
import { ROUTES } from '../utils/constants.js';

function SidebarContent({ user, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <Logo variant="light" showTagline={false} />
        <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-gold">Admin panel</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <AdminNav onNavigate={onNavigate} />
      </div>

      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-medium text-white">{user.name}</p>
        <p className="truncate text-xs text-cream/50">{user.email}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to={ROUTES.home}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs text-cream transition hover:border-gold hover:text-gold"
          >
            <Store size={14} aria-hidden="true" /> View store
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs text-cream transition hover:border-gold hover:text-gold"
          >
            <LogOut size={14} aria-hidden="true" /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useLockBodyScroll(open);
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    if (await logout()) navigate(ROUTES.admin.login);
  };

  if (!user) return null; // AdminRoute already redirects; this only guards the moment of logging out

  return (
    <div className="min-h-screen bg-cream lg:pl-64">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink text-cream lg:block">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-ink px-4 py-3 text-cream lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="rounded-full p-2 transition hover:bg-white/10"
        >
          <Menu size={22} />
        </button>
        <span className="font-serif text-lg uppercase tracking-luxe">
          Crystal Zone <span className="text-gold">Admin</span>
        </span>
        <Link to={ROUTES.home} aria-label="View store" className="rounded-full p-2 transition hover:bg-white/10">
          <Store size={20} />
        </Link>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-[82%] max-w-xs bg-ink text-cream shadow-lift">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 rounded-full p-2 transition hover:bg-white/10"
            >
              <X size={20} />
            </button>
            <SidebarContent user={user} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <main id="admin-main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}