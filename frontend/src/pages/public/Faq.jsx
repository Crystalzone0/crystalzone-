import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import Seo from '../../components/common/Seo.jsx';
import Button from '../../components/ui/Button.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { POLICY } from '../../utils/policy.js';
import { ROUTES } from '../../utils/constants.js';

export default function Faq() {
  const { settings, money, whatsappLink } = useSettings();

  const delivery =
    settings.freeShippingThreshold > 0
      ? `Delivery costs ${money(settings.shippingFee)}. It is free on orders of ${money(settings.freeShippingThreshold)} or more (after discounts).`
      : `Delivery costs a flat ${money(settings.shippingFee)} per order.`;

  const faqs = [
    {
      q: 'How can I pay?',
      a: 'We currently accept Cash on Delivery. You pay the courier in cash when your order arrives, so there is nothing to pay online.',
    },
    {
      q: 'How long does delivery take?',
      a: `Orders are usually delivered within ${POLICY.deliveryTime}, depending on your city. We will contact you by phone or WhatsApp to confirm your order and delivery details.`,
    },
    { q: 'How much does delivery cost?', a: delivery },
    {
      q: 'Do I need an account to place an order?',
      a: 'No. You can check out as a guest. An account lets you save your addresses, keep your wishlist, see your order history and write reviews.',
    },
    {
      q: 'How do I track my order?',
      a: 'Open the Track Order page and enter your Order ID together with the phone number or email you used at checkout. Your Order ID is shown on the confirmation page and in your confirmation email.',
    },
    {
      q: 'Can I cancel or change my order?',
      a: 'If you have an account, you can cancel from My Account > My Orders while the order is still "Order Placed" or "Confirmed". After that, or if you ordered as a guest, please message us on WhatsApp as soon as possible and we will do our best to help.',
    },
    {
      q: 'What if my item arrives damaged or is not what I ordered?',
      a: `Please contact us within ${POLICY.returnWindow} of receiving your order and send photos on WhatsApp. See our Shipping & Returns page for the full details.`,
    },
    {
      q: 'How do I take care of my jewellery?',
      a: 'Keep it away from water, perfume and lotions, wipe it gently with a soft dry cloth after wearing, and store each piece in a dry pouch or box so it stays bright and untangled.',
    },
    {
      q: 'A product I want is out of stock. Will it come back?',
      a: 'Open the product and tap "Ask about restock" to message us on WhatsApp. We will let you know if and when it is available again.',
    },
    {
      q: 'Can I review a product?',
      a: 'Yes. Once you have received an order, log in with the account you ordered with, open the product page and write your review.',
    },
    {
      q: 'How can I contact you?',
      a: `Message us on WhatsApp or call ${settings.phone}. You can also email ${settings.email} or use the contact form.`,
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <>
      <Seo
        title="FAQ"
        description="Answers to common questions about ordering, Cash on Delivery, delivery, tracking, cancellations and returns at Crystal Zone."
        jsonLd={jsonLd}
      />

      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-cz py-8 sm:py-12">
          <Breadcrumbs items={[{ label: 'Home', to: ROUTES.home }, { label: 'FAQ' }]} />
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">Frequently asked questions</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-charcoal/70 sm:text-base">
            Quick answers about ordering, delivery and returns. Cannot find yours? Message us and we will help.
          </p>
        </div>
      </section>

      <div className="container-cz py-10 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group rounded-2xl bg-white p-5 shadow-soft transition open:shadow-lift">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-lg [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown size={20} className="shrink-0 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/75">{a}</p>
            </details>
          ))}

          <div className="rounded-2xl bg-cream-dark p-6 text-center">
            <h2 className="font-serif text-2xl">Still have a question?</h2>
            <p className="mt-2 text-sm text-charcoal/70">
              See our{' '}
              <Link to={ROUTES.shipping} className="underline underline-offset-4 hover:text-gold-dark">
                Shipping &amp; Returns
              </Link>{' '}
              page, or chat with us.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button href={whatsappLink('Hello Crystal Zone! I have a question.')}>Chat on WhatsApp</Button>
              <Button to={ROUTES.contact} variant="outline">
                Contact form
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}