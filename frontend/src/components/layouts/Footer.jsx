import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from '../common/Logo.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import * as catalogApi from '../../services/catalogApi.js';
import { ROUTES } from '../../utils/constants.js';

const HELP_LINKS = [
  { label: 'Track Your Order', to: ROUTES.trackOrder },
  { label: 'Shipping & Returns', to: ROUTES.shipping },
  { label: 'FAQ', to: ROUTES.faq },
  { label: 'Contact Us', to: ROUTES.contact },
];

const COMPANY_LINKS = [
  { label: 'About Us', to: ROUTES.about },
  { label: 'Privacy Policy', to: ROUTES.privacy },
  { label: 'Terms & Conditions', to: ROUTES.terms },
  { label: 'My Account', to: ROUTES.account },
];

const SOCIALS = [
  ['Instagram', 'instagram'],
  ['Facebook', 'facebook'],
  ['TikTok', 'tiktok'],
];

const linkClass = 'text-sm text-cream/70 transition hover:text-gold';

export default function Footer() {
  const { settings, whatsappLink } = useSettings();
  const { data: filters } = useQuery({ queryKey: ['filters'], queryFn: catalogApi.getFilters, staleTime: 60_000 });
  const categories = filters?.categories ?? [];

  const socials = SOCIALS.filter(([, key]) => settings.socials[key]);

  return (
    <footer className="mt-auto bg-ink text-cream">
      <div className="container-cz grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo variant="light" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/70">
            Elegant artificial jewellery and fashion accessories, chosen to make every day feel a little more precious.
            Pay when your order arrives, with Cash on Delivery.
          </p>
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {socials.map(([label, key]) => (
                <li key={key}>
                  <a href={settings.socials[key]} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Shop categories">
          <h2 className="font-serif text-lg text-white">Shop</h2>
          <ul className="mt-4 space-y-2.5">
            <li><Link to={ROUTES.shop} className={linkClass}>All Products</Link></li>
            {categories.map((c) => (
              <li key={c.id}><Link to={ROUTES.category(c.slug)} className={linkClass}>{c.name}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Help and company">
          <h2 className="font-serif text-lg text-white">Help</h2>
          <ul className="mt-4 space-y-2.5">
            {HELP_LINKS.map((l) => (
              <li key={l.to}><Link to={l.to} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
          <h2 className="mt-8 font-serif text-lg text-white">Company</h2>
          <ul className="mt-4 space-y-2.5">
            {COMPANY_LINKS.map((l) => (
              <li key={l.to}><Link to={l.to} className={linkClass}>{l.label}</Link></li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-serif text-lg text-white">Get in touch</h2>
          <ul className="mt-4 space-y-3 text-sm text-cream/70">
            <li className="flex items-start gap-3">
              <Phone size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="transition hover:text-gold">{settings.phone}</a>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
              <a href={`mailto:${settings.email}`} className="break-all transition hover:text-gold">{settings.email}</a>
            </li>
            {settings.address && (
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
                <span>{settings.address}</span>
              </li>
            )}
          </ul>
          <a
            href={whatsappLink('Hello Crystal Zone! I would like some help.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold btn-sm mt-5"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-cz flex flex-col items-center justify-between gap-2 py-5 text-xs text-cream/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
          <p>Cash on Delivery available</p>
        </div>
      </div>
    </footer>
  );
}