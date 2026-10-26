import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ClipboardList, Heart, LayoutDashboard, LogOut, Menu, Package, Search, ShoppingBag, User, X } from 'lucide-react';
import MobileMenu from './MobileMenu.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import * as catalogApi from '../../services/catalogApi.js';
import useClickOutside from '../../hooks/useClickOutside.js';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const navClass = ({ isActive }) =>
  cn(
    'relative inline-flex items-center gap-1 py-2 text-[15px] tracking-wide transition-colors duration-300',
    'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 after:ease-out',
    'hover:text-gold-light hover:after:scale-x-100',
    isActive ? 'text-gold after:scale-x-100' : 'text-cream'
  );

const iconButton =
  'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-cream transition-colors duration-200 hover:text-gold active:scale-95';

const dropdownPanel =
  'invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 translate-y-1 pt-4 opacity-0 transition-[opacity,transform,visibility] duration-200 ease-out group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100';

const dropdownLink =
  'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-cream transition-colors duration-200 hover:bg-white/5 hover:text-gold-light';

/** Count bubble. It bumps once when the count goes UP (item added), and never on first load. */
function Badge({ count }) {
  const previous = useRef(count);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (count > previous.current) setBump(true);
    previous.current = count;
  }, [count]);

  if (!count) return null;
  return (
    <span
      onAnimationEnd={() => setBump(false)}
      className={cn(
        'absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-ink',
        bump && 'animate-bump'
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function MenuLink({ to, icon: Icon, children }) {
  return (
    <Link to={to} role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream transition-colors duration-200 hover:bg-white/5 hover:text-gold-light">
      <Icon size={17} aria-hidden="true" /> {children}
    </Link>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  const { data: filters } = useQuery({ queryKey: ['filters'], queryFn: catalogApi.getFilters, staleTime: 60_000 });
  const categories = filters?.categories ?? [];

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const userRef = useRef(null);

  const closeUser = useCallback(() => setUserOpen(false), []);
  useClickOutside(userRef, closeUser, userOpen);

  // Close everything when the page changes.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setUserOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`${ROUTES.shop}?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  const handleLogout = async () => {
    setUserOpen(false);
    setMenuOpen(false);
    const done = await logout();
    if (done) navigate(ROUTES.home);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-gold/20 bg-ink/95 text-cream backdrop-blur transition-shadow duration-300',
        scrolled && 'shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)]'
      )}
    >
      <div className="container-cz flex h-16 items-center justify-between gap-2 sm:h-20 lg:h-24">
        <div className="flex items-center gap-1 lg:hidden">
          <button type="button" className={iconButton} onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
        </div>

        <Link to={ROUTES.home} className="flex min-w-0 items-center gap-2.5 sm:gap-3.5" aria-label="Crystal Zone, home">
          {/* Monogram: thin double gold ring, CZ inside, and a small diamond set on top like a ring's gemstone */}
          <span
            aria-hidden="true"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold sm:h-14 sm:w-14"
          >
            <span className="absolute inset-[3px] rounded-full border border-gold/45 sm:inset-1" />
            <svg
              viewBox="0 0 24 20"
              className="absolute -top-[5px] left-1/2 h-[9px] w-[11px] -translate-x-1/2 text-gold sm:-top-[7px] sm:h-3 sm:w-[14px]"
              focusable="false"
            >
              <path d="M6 1h12l5 6-11 12L1 7z" fill="#0a0908" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M1 7h22M9 1L7 7l5 12M15 1l2 6-5 12" fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
            <span className="font-serif text-[0.95rem] font-semibold leading-none tracking-wide text-gold sm:text-2xl">CZ</span>
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate font-serif text-[0.95rem] font-semibold tracking-[0.12em] text-gold-light sm:text-[1.75rem] sm:tracking-[0.16em]">
              CRYSTAL ZONE
            </span>
            <span className="mt-1.5 hidden text-[8.5px] uppercase tracking-[0.26em] text-gold/80 sm:block">
              Artificial Jewellery &amp; Fashion Accessories
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex" aria-label="Main">
          <NavLink to={ROUTES.home} end className={navClass}>Home</NavLink>

          <div className="group relative">
            <NavLink to={ROUTES.shop} end className={navClass}>
              Shop <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180" aria-hidden="true" />
            </NavLink>
            <div className={dropdownPanel}>
              <div className="rounded-2xl border border-gold/20 bg-charcoal p-2 shadow-lift">
                <Link to={ROUTES.shop} className={dropdownLink}>All products</Link>
                <Link to={`${ROUTES.shop}?sort=newest`} className={dropdownLink}>New arrivals</Link>
                <Link to={`${ROUTES.shop}?sort=popular`} className={dropdownLink}>Best sellers</Link>
                <Link to={`${ROUTES.shop}?onSale=true`} className={dropdownLink}>On sale</Link>
              </div>
            </div>
          </div>

          <div className="group relative">
            <button type="button" className={cn(navClass({ isActive: false }), 'cursor-pointer')} aria-haspopup="true">
              Categories <ChevronDown size={14} className="transition-transform duration-300 group-hover:rotate-180" aria-hidden="true" />
            </button>
            <div className={dropdownPanel}>
              <div className="rounded-2xl border border-gold/20 bg-charcoal p-2 shadow-lift">
                {categories.length === 0 ? (
                  <Link to={ROUTES.shop} className={dropdownLink}>Browse all products</Link>
                ) : (
                  categories.map((c) => (
                    <Link key={c.id} to={ROUTES.category(c.slug)} className={dropdownLink}>
                      {c.name}
                      <span className="text-xs text-cream/50">{c.productCount}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <NavLink to={ROUTES.about} className={navClass}>About Us</NavLink>
          <NavLink to={ROUTES.contact} className={navClass}>Contact</NavLink>
        </nav>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={iconButton}
            onClick={() => setSearchOpen((o) => !o)}
            aria-label="Search products"
            aria-expanded={searchOpen}
          >
            <Search size={21} />
          </button>

          <Link to={ROUTES.wishlist} className={cn(iconButton, 'hidden sm:inline-flex')} aria-label={`Wishlist (${wishlistCount} items)`}>
            <Heart size={21} />
            <Badge count={wishlistCount} />
          </Link>

          <Link
            to={user ? ROUTES.accountOrders : ROUTES.trackOrder}
            className={iconButton}
            aria-label="Your orders"
            title="Your orders"
          >
            <ClipboardList size={21} />
          </Link>

          <div className="relative hidden lg:block" ref={userRef}>
            {user ? (
              <>
                <button
                  type="button"
                  className={iconButton}
                  onClick={() => setUserOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={userOpen}
                  aria-label="Account menu"
                >
                  <User size={21} />
                </button>
                {userOpen && (
                  <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-dropdown rounded-2xl border border-gold/20 bg-charcoal p-2 shadow-lift">
                    <div className="border-b border-white/10 px-3 pb-3 pt-2">
                      <p className="truncate text-sm font-medium text-white">{user.name}</p>
                      <p className="truncate text-xs text-cream/60">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <MenuLink to={ROUTES.account} icon={User}>My Account</MenuLink>
                      <MenuLink to={ROUTES.accountOrders} icon={Package}>My Orders</MenuLink>
                      <MenuLink to={ROUTES.trackOrder} icon={ClipboardList}>Track an order</MenuLink>
                      <MenuLink to={ROUTES.wishlist} icon={Heart}>Wishlist</MenuLink>
                      {isAdmin && <MenuLink to={ROUTES.admin.dashboard} icon={LayoutDashboard}>Admin Panel</MenuLink>}
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl border-t border-white/10 px-3 py-2.5 text-left text-sm text-cream transition-colors duration-200 hover:bg-white/5 hover:text-gold-light"
                    >
                      <LogOut size={17} aria-hidden="true" /> Log out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to={ROUTES.login} className={iconButton} aria-label="Log in or create an account" title="Log in">
                <User size={21} />
              </Link>
            )}
          </div>

          <Link to={ROUTES.cart} className={iconButton} aria-label={`Cart (${cartCount} items)`}>
            <ShoppingBag size={21} />
            <Badge count={cartCount} />
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="animate-dropdown border-t border-gold/20 bg-ink">
          <form onSubmit={submitSearch} role="search" className="container-cz flex items-center gap-3 py-3">
            <Search size={18} className="shrink-0 text-cream/50" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search rings, earrings, watches, SKU..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-cream outline-none placeholder:text-cream/40"
            />
            <button type="submit" className="btn-gold btn-sm">Search</button>
            <button type="button" onClick={() => setSearchOpen(false)} className="rounded-full p-2 text-cream transition-colors hover:text-gold" aria-label="Close search">
              <X size={18} />
            </button>
          </form>
        </div>
      )}

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        wishlistCount={wishlistCount}
      />
    </header>
  );
}