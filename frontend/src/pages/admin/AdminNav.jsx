import { NavLink } from 'react-router-dom';
import { Boxes, ClipboardList, Gem, LayoutDashboard, Mail, MessageSquare, Settings, Star, Tags, Users } from 'lucide-react';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

const NAV = [
  { to: ROUTES.admin.dashboard, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.admin.products, label: 'Products', icon: Gem },
  { to: ROUTES.admin.inventory, label: 'Inventory', icon: Boxes },
  { to: ROUTES.admin.orders, label: 'Orders', icon: ClipboardList },
  { to: ROUTES.admin.customers, label: 'Customers', icon: Users },
  { to: ROUTES.admin.reviews, label: 'Reviews', icon: Star },
  { to: ROUTES.admin.messages, label: 'Messages', icon: MessageSquare },
  { to: ROUTES.admin.subscribers, label: 'Subscribers', icon: Mail },
  { to: ROUTES.admin.categories, label: 'Categories', icon: Tags },
  { to: ROUTES.admin.settings, label: 'Settings', icon: Settings },
];

export default function AdminNav({ onNavigate }) {
  return (
    <nav aria-label="Admin" className="space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition',
              isActive ? 'bg-gold font-medium text-ink' : 'text-cream/75 hover:bg-white/10 hover:text-white'
            )
          }
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}