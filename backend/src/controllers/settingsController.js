import asyncHandler from '../utils/asyncHandler.js';
import { getSettings } from '../services/settingsService.js';
import { buildWhatsAppLink } from '../utils/whatsapp.js';

/** GET /api/settings: public store info used by the header, footer, cart, checkout and WhatsApp links. */
export const getPublicSettings = asyncHandler(async (_req, res) => {
  const s = await getSettings();

  res.set('Cache-Control', 'public, max-age=30');
  res.json({
    success: true,
    settings: {
      storeName: s.storeName,
      tagline: s.tagline,
      phone: s.phone,
      whatsappNumber: s.whatsappNumber,
      whatsappLink: buildWhatsAppLink('Hello Crystal Zone! I would like some help.', s.whatsappNumber),
      email: s.email,
      address: s.address,
      currency: s.currency,
      shippingFee: s.shippingFee,
      freeShippingThreshold: s.freeShippingThreshold,
      announcement: s.announcement,
      socials: s.socials,
    },
  });
});