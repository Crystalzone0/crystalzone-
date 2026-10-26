import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as catalogApi from '../services/catalogApi.js';
import { BRAND } from '../utils/constants.js';
import { formatMoney } from '../utils/format.js';
import { buildWhatsAppLink } from '../utils/whatsapp.js';

// Shown until (or if) the API answers, so the header and footer never render empty.
const DEFAULTS = {
  storeName: BRAND.name,
  tagline: BRAND.tagline,
  phone: BRAND.phone,
  whatsappNumber: BRAND.whatsapp,
  email: BRAND.email,
  address: '',
  currency: BRAND.currency,
  shippingFee: 250,
  freeShippingThreshold: 5000,
  announcement: '',
  socials: { instagram: '', facebook: '', tiktok: '' },
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => catalogApi.getSettings().then((res) => res.settings),
    staleTime: 5 * 60 * 1000,
  });

  const value = useMemo(() => {
    const settings = { ...DEFAULTS, ...data, socials: { ...DEFAULTS.socials, ...data?.socials } };
    return {
      settings,
      /** money(2650) -> "Rs 2,650" using the store currency */
      money: (amount) => formatMoney(amount, settings.currency),
      /** Opens a WhatsApp chat with the store, optionally with a pre-filled message */
      whatsappLink: (message = '') => buildWhatsAppLink(settings.whatsappNumber, message),
    };
  }, [data]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}