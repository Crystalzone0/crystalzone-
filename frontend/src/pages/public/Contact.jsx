import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import Seo from '../../components/common/Seo.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { submitContact } from '../../services/engagementApi.js';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { focusFirstInvalid } from '../../utils/address.js';
import { validateForm, validators } from '../../utils/validators.js';
import { ROUTES } from '../../utils/constants.js';

const EMPTY = { name: '', email: '', phone: '', message: '' };

const rules = {
  name: validators.name,
  email: validators.email,
  phone: (v = '') => (v.trim() ? validators.phone(v) : ''),
  message: (v = '') =>
    v.trim().length < 5
      ? 'Please write a short message (at least 5 characters)'
      : v.length > 2000
        ? 'Message must be at most 2000 characters'
        : '',
};

function InfoCard({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-4 rounded-2xl bg-white p-5 shadow-soft">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="font-serif text-lg">{title}</h3>
        <div className="mt-1 break-words text-sm leading-relaxed text-charcoal/75">{children}</div>
      </div>
    </div>
  );
}

export default function Contact() {
  const { user } = useAuth();
  const { settings, whatsappLink } = useSettings();

  const [values, setValues] = useState(EMPTY);
  const [trap, setTrap] = useState(''); // honeypot: humans never see or fill this
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Pre-fill for logged-in customers (never overwrites what they already typed).
  useEffect(() => {
    if (!user) return;
    setValues((v) => ({
      ...v,
      name: v.name || user.name || '',
      email: v.email || user.email || '',
      phone: v.phone || user.phone || '',
    }));
  }, [user]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;

    const found = validateForm(values, rules);
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) {
      focusFirstInvalid();
      return;
    }

    setSending(true);
    try {
      await submitContact({
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
        ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
        website: trap,
      });
      setSent(true);
      toast.success('Message sent. Thank you!');
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setErrors(fieldErrors(err));
    } finally {
      setSending(false);
    }
  };

  const tel = settings.phone.replace(/\s/g, '');

  return (
    <>
      <Seo
        title="Contact us"
        description="Contact Crystal Zone by phone, WhatsApp or email, or send us a message. We are happy to help with orders, sizes and gifts."
      />

      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-cz py-8 sm:py-12">
          <Breadcrumbs items={[{ label: 'Home', to: ROUTES.home }, { label: 'Contact' }]} />
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">Get in touch</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-charcoal/70 sm:text-base">
            Questions about an order, a size or a gift? Send us a message or reach us directly. We are happy to help.
          </p>
        </div>
      </section>

      <div className="container-cz grid gap-8 py-10 sm:py-14 lg:grid-cols-[22rem_1fr] lg:gap-12">
        <div className="space-y-4">
          <InfoCard icon={Phone} title="Call us">
            <a href={`tel:${tel}`} className="transition hover:text-gold-dark">
              {settings.phone}
            </a>
          </InfoCard>

          <InfoCard icon={MessageCircle} title="WhatsApp">
            <p>The quickest way to reach us.</p>
            <a
              href={whatsappLink('Hello Crystal Zone! I have a question.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-medium underline underline-offset-4 transition hover:text-gold-dark"
            >
              Start a chat
            </a>
          </InfoCard>

          <InfoCard icon={Mail} title="Email">
            <a href={`mailto:${settings.email}`} className="transition hover:text-gold-dark">
              {settings.email}
            </a>
          </InfoCard>

          {settings.address && (
            <InfoCard icon={MapPin} title="Address">
              {settings.address}
            </InfoCard>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
          {sent ? (
            <div className="py-10 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={32} aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-serif text-3xl">Message sent</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-charcoal/70">
                Thank you for contacting us. We will get back to you shortly. For anything urgent, please message us on WhatsApp.
              </p>
              <Button
                variant="outline"
                className="mt-7"
                onClick={() => {
                  setSent(false);
                  setValues((v) => ({ ...v, message: '' }));
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <h2 className="font-serif text-2xl">Send us a message</h2>
              {submitError && <Alert>{submitError}</Alert>}

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField label="Your name" name="name" autoComplete="name" value={values.name} onChange={onChange} error={errors.name} required />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={onChange}
                  error={errors.email}
                  required
                />
              </div>
              <TextField
                label="Phone / WhatsApp (optional)"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="03XX XXXXXXX"
                value={values.phone}
                onChange={onChange}
                error={errors.phone}
              />
              <TextField
                as="textarea"
                rows={6}
                label="Message"
                name="message"
                maxLength={2000}
                placeholder="How can we help?"
                value={values.message}
                onChange={onChange}
                error={errors.message}
                required
              />

              {/* Honeypot (hidden from people and screen readers; bots tend to fill every field) */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Leave this field empty
                  <input type="text" name="cz_hp" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
                </label>
              </div>

              <Button type="submit" size="lg" loading={sending}>
                Send message
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}