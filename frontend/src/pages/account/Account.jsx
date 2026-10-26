import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, LayoutDashboard, Lock, LogOut, MapPin, Package, User } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import Seo from '../../components/common/Seo.jsx';
import AddressesTab from '../../components/account/AddressesTab.jsx';
import OrdersTab from '../../components/account/OrdersTab.jsx';
import ProfileTab from '../../components/account/ProfileTab.jsx';
import SecurityTab from '../../components/account/SecurityTab.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'security', label: 'Password', icon: Lock },
];

export default function Account() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [params] = useSearchParams();

  const requested = params.get('tab');
  const tab = TABS.some((t) => t.id === requested) ? requested : 'profile';

  const handleLogout = async () => {
    if (await logout()) navigate(ROUTES.home);
  };

  return (
    <>
      <Seo title="My account" noindex />
      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-cz py-8 sm:py-12">
          <Breadcrumbs items={[{ label: 'Home', to: ROUTES.home }, { label: 'My account' }]} />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl">Hello, {user.name.split(' ')[0]}</h1>
              <p className="mt-2 text-sm text-charcoal/70">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to={ROUTES.wishlist} className="btn-outline btn-sm">
                <Heart size={15} aria-hidden="true" /> Wishlist
              </Link>
              {isAdmin && (
                <Link to={ROUTES.admin.dashboard} className="btn-outline btn-sm">
                  <LayoutDashboard size={15} aria-hidden="true" /> Admin panel
                </Link>
              )}
              <button type="button" onClick={handleLogout} className="btn-dark btn-sm">
                <LogOut size={15} aria-hidden="true" /> Log out
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-cz py-8 sm:py-12">
        <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-12">
          <nav aria-label="Account sections" className="mb-8 flex gap-2 overflow-x-auto pb-1 lg:mb-0 lg:flex-col lg:overflow-visible">
            {TABS.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                to={`${ROUTES.account}?tab=${id}`}
                replace
                aria-current={tab === id ? 'page' : undefined}
                className={cn(
                  'flex shrink-0 items-center gap-3 rounded-full px-5 py-2.5 text-sm transition lg:rounded-xl',
                  tab === id ? 'bg-ink text-white' : 'bg-white text-charcoal hover:bg-gold/15'
                )}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="min-w-0 rounded-3xl bg-white p-5 shadow-soft sm:p-8">
            {tab === 'profile' && <ProfileTab />}
            {tab === 'orders' && <OrdersTab />}
            {tab === 'addresses' && <AddressesTab />}
            {tab === 'security' && <SecurityTab />}
          </div>
        </div>
      </div>
    </>
  );
}