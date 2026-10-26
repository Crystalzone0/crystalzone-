import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Seo from '../../components/common/Seo.jsx';
import AdminCard from '../../components/admin/AdminCard.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import TextField from '../../components/ui/TextField.jsx';
import * as adminApi from '../../services/adminApi.js';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { focusFirstInvalid } from '../../utils/address.js';
import { validators } from '../../utils/validators.js';

const NETWORKS = ['instagram', 'facebook', 'tiktok'];
const WHOLE = /^\d+$/;

function toValues(s) {
  return {
    storeName: s.storeName ?? '',
    tagline: s.tagline ?? '',
    announcement: s.announcement ?? '',
    phone: s.phone ?? '',
    whatsappNumber: s.whatsappNumber ?? '',
    email: s.email ?? '',
    address: s.address ?? '',
    currency: s.currency ?? 'PKR',
    shippingFee: String(s.shippingFee ?? 0),
    freeShippingThreshold: String(s.freeShippingThreshold ?? 0),
    lowStockThreshold: String(s.lowStockThreshold ?? 5),
    instagram: s.socials?.instagram ?? '',
    facebook: s.socials?.facebook ?? '',
    tiktok: s.socials?.tiktok ?? '',
  };
}

/** Same rules the server applies (the server still checks everything again). */
function validate(v) {
  const e = {};

  const name = v.storeName.trim();
  if (name.length < 2) e.storeName = 'Store name must be at least 2 characters';
  else if (name.length > 80) e.storeName = 'Store name must be at most 80 characters';

  if (v.tagline.length > 160) e.tagline = 'Tagline must be at most 160 characters';
  if (v.announcement.length > 200) e.announcement = 'Announcement must be at most 200 characters';

  const phone = validators.phone(v.phone);
  if (phone) e.phone = phone;

  const digits = v.whatsappNumber.replace(/[\s()+-]/g, '');
  if (!/^\d{10,15}$/.test(digits)) e.whatsappNumber = 'Enter a valid WhatsApp number, for example 03305255596';

  const email = validators.email(v.email);
  if (email) e.email = email;

  if (v.address.length > 300) e.address = 'Address must be at most 300 characters';

  const currency = v.currency.trim();
  if (currency.length < 1 || currency.length > 5) e.currency = 'Currency must be 1 to 5 characters, e.g. PKR';

  for (const [field, label, max] of [
    ['shippingFee', 'Delivery fee', 1_000_000],
    ['freeShippingThreshold', 'Free delivery amount', 1_000_000],
    ['lowStockThreshold', 'Low stock limit', 1000],
  ]) {
    if (!WHOLE.test(v[field]) || Number(v[field]) > max) e[field] = `${label} must be a whole number from 0 to ${max.toLocaleString('en-US')}`;
  }

  for (const n of NETWORKS) {
    const url = v[n].trim();
    if (url && !/^https:\/\/\S+$/.test(url)) e[n] = 'Link must start with https://';
    else if (url.length > 300) e[n] = 'Link is too long';
  }

  return e;
}

function SettingsForm({ settings }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(() => toValues(settings));
  const [saved, setSaved] = useState(() => toValues(settings));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const onText = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onNumber = (event) => {
    const { name } = event.target;
    const value = event.target.value.replace(/\D/g, '').slice(0, 7);
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const found = validate(values);
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) {
      setSubmitError('Please fix the highlighted fields.');
      focusFirstInvalid();
      return;
    }

    const payload = {
      storeName: values.storeName.trim(),
      tagline: values.tagline.trim(),
      announcement: values.announcement.trim(),
      phone: values.phone.trim(),
      whatsappNumber: values.whatsappNumber.trim(),
      email: values.email.trim(),
      address: values.address.trim(),
      currency: values.currency.trim().toUpperCase(),
      shippingFee: Number(values.shippingFee),
      freeShippingThreshold: Number(values.freeShippingThreshold),
      lowStockThreshold: Number(values.lowStockThreshold),
      socials: {
        instagram: values.instagram.trim(),
        facebook: values.facebook.trim(),
        tiktok: values.tiktok.trim(),
      },
    };

    setSaving(true);
    try {
      const data = await adminApi.updateSettings(payload);
      const next = toValues(data.settings); // e.g. 03305255596 comes back as 923305255596
      setValues(next);
      setSaved(next);
      queryClient.setQueryData(['admin', 'settings'], data.settings);
      queryClient.invalidateQueries({ queryKey: ['admin'] }); // low-stock counts depend on the limit
      queryClient.invalidateQueries({ queryKey: ['settings'] }); // the storefront header, footer, cart and WhatsApp links
      toast.success('Settings saved');
    } catch (err) {
      const mapped = fieldErrors(err);
      for (const n of NETWORKS) if (mapped[`socials.${n}`]) mapped[n] = mapped[`socials.${n}`];
      setErrors(mapped);
      setSubmitError(getErrorMessage(err));
      focusFirstInvalid();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {submitError && <Alert className="mb-6">{submitError}</Alert>}

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <AdminCard title="Store" description="Shown across your website.">
          <div className="space-y-5">
            <TextField label="Store name" name="storeName" value={values.storeName} onChange={onText} error={errors.storeName} maxLength={80} required />
            <TextField label="Tagline" name="tagline" value={values.tagline} onChange={onText} error={errors.tagline} maxLength={160} />
            <TextField
              label="Announcement bar"
              name="announcement"
              value={values.announcement}
              onChange={onText}
              error={errors.announcement}
              maxLength={200}
              hint="Shown at the top of every page. Leave empty to show the default free delivery message."
            />
          </div>
        </AdminCard>

        <AdminCard title="Contact details" description="Used in the footer, on the contact page and for WhatsApp links.">
          <div className="space-y-5">
            <TextField label="Phone" name="phone" type="tel" inputMode="tel" value={values.phone} onChange={onText} error={errors.phone} required />
            <TextField
              label="WhatsApp number"
              name="whatsappNumber"
              type="tel"
              inputMode="tel"
              value={values.whatsappNumber}
              onChange={onText}
              error={errors.whatsappNumber}
              hint="Type it like 03305255596. It is saved in the international format WhatsApp needs (923305255596)."
              required
            />
            <TextField label="Email" name="email" type="email" inputMode="email" value={values.email} onChange={onText} error={errors.email} required />
            <TextField
              as="textarea"
              rows={3}
              label="Address (optional)"
              name="address"
              value={values.address}
              onChange={onText}
              error={errors.address}
              maxLength={300}
            />
          </div>
        </AdminCard>

        <AdminCard title="Delivery and inventory" description="Applied to every cart and order straight away.">
          <div className="space-y-5">
            <TextField label="Currency" name="currency" value={values.currency} onChange={onText} error={errors.currency} maxLength={5} inputClassName="uppercase" required />
            <TextField label="Delivery fee" name="shippingFee" inputMode="numeric" value={values.shippingFee} onChange={onNumber} error={errors.shippingFee} required />
            <TextField
              label="Free delivery from"
              name="freeShippingThreshold"
              inputMode="numeric"
              value={values.freeShippingThreshold}
              onChange={onNumber}
              error={errors.freeShippingThreshold}
              hint="Orders reaching this amount after discounts get free delivery. Enter 0 to turn free delivery off."
              required
            />
            <TextField
              label="Low stock limit"
              name="lowStockThreshold"
              inputMode="numeric"
              value={values.lowStockThreshold}
              onChange={onNumber}
              error={errors.lowStockThreshold}
              hint="A product with this many units or fewer is flagged as low stock."
              required
            />
          </div>
        </AdminCard>

        <AdminCard title="Social media" description="Links appear in the footer. Leave empty to hide one.">
          <div className="space-y-5">
            <TextField label="Instagram" name="instagram" inputMode="url" placeholder="https://instagram.com/yourpage" value={values.instagram} onChange={onText} error={errors.instagram} />
            <TextField label="Facebook" name="facebook" inputMode="url" placeholder="https://facebook.com/yourpage" value={values.facebook} onChange={onText} error={errors.facebook} />
            <TextField label="TikTok" name="tiktok" inputMode="url" placeholder="https://tiktok.com/@yourpage" value={values.tiktok} onChange={onText} error={errors.tiktok} />
          </div>
        </AdminCard>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-charcoal/10 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-charcoal/60" aria-live="polite">
            {dirty ? 'You have unsaved changes' : 'Changes appear in your store within about 30 seconds.'}
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              disabled={!dirty || saving}
              onClick={() => {
                setValues(saved);
                setErrors({});
                setSubmitError('');
              }}
            >
              Discard
            </Button>
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save settings
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function AdminSettings() {
  const query = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => adminApi.getSettings().then((res) => res.settings),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  return (
    <>
      <Seo title="Settings" noindex />
      <PageHeader title="Settings" description="Your store details, delivery rules and links." />

      {query.isPending ? (
        <div className="grid gap-6 xl:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-3xl" />
          ))}
        </div>
      ) : query.isError && !query.data ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-16" />
      ) : (
        <SettingsForm settings={query.data} />
      )}
    </>
  );
}