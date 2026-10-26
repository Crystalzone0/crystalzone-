import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package, User, X } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import Portal from '../ui/Portal.jsx';
import useLockBodyScroll from '../../hooks/useLockBodyScroll.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const linkClass = ({ isActive }) =>
  cn(
    'block rounded-xl px-4 py-3 text-base transition',
    isActive ? 'bg-gold/15 text-gold-dark' : 'text-charcoal hover:bg-charcoal/5'
  );

export default function MobileMenu({ open, onClose, categories, user, isAdmin, onLogout, wishlistCount }) {
  useLockBodyScroll(open);
  if (!open) return null;

  return (
    // In <body>, not inside the header: the header's backdrop-blur would otherwise squash this "fixed" menu into the header's box.
    <Portal>
      <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
        <button type="button" className="absolute inset-0 animate-fade-in bg-ink/60" onClick={onClose} aria-label="Close menu" />

        <nav className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-slide-in-left flex-col overflow-y-auto bg-white shadow-lift">
          <div className="flex items-center justify-between border-b border-charcoal/10 px-4 py-4">
            <Logo showTagline={false} />
            <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-charcoal/5" aria-label="Close menu">
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 space-y-1 px-3 py-4">
            <NavLink to={ROUTES.home} end className={linkClass}>Home</NavLink>
            <NavLink to={ROUTES.shop} end className={linkClass}>Shop All</NavLink>

            {categories.length > 0 && (
              <div className="pb-2 pl-4">
                {categories.map((c) => (
                  <NavLink key={c.id} to={ROUTES.category(c.slug)} className={linkClass}>
                    {c.name}
                  </NavLink>
                ))}
              </div>
            )}

            <NavLink to={ROUTES.about} className={linkClass}>About Us</NavLink>
            <NavLink to={ROUTES.contact} className={linkClass}>Contact</NavLink>
            <NavLink to={ROUTES.faq} className={linkClass}>FAQ</NavLink>
            <NavLink to={ROUTES.trackOrder} className={linkClass}>Track Order</NavLink>
            <NavLink to={ROUTES.wishlist} className={linkClass}>
              <span className="flex items-center justify-between">
                Wishlist
                {wishlistCount > 0 && (
                  <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-ink">{wishlistCount}</span>
                )}
              </span>
            </NavLink>
          </div>

          <div className="border-t border-charcoal/10 px-3 py-4">
            {user ? (
              <>
                <p className="truncate px-4 pb-2 text-sm font-medium">{user.name}</p>
                <Link to={ROUTES.account} className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-charcoal/5">
                  <User size={18} /> My Account
                </Link>
                <Link to={ROUTES.accountOrders} className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-charcoal/5">
                  <Package size={18} /> My Orders
                </Link>
                {isAdmin && (
                  <Link to={ROUTES.admin.dashboard} className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-charcoal/5">
                    <LayoutDashboard size={18} /> Admin Panel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-charcoal/5"
                >
                  <LogOut size={18} /> Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to={ROUTES.login} className="btn-outline btn-sm">Log in</Link>
                <Link to={ROUTES.register} className="btn-gold btn-sm">Sign up</Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </Portal>
  );
}