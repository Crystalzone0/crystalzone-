import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Gem, Gift, MessageCircle } from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs.jsx';
import SectionHeading from '../../components/common/SectionHeading.jsx';
import Seo from '../../components/common/Seo.jsx';
import Button from '../../components/ui/Button.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import * as catalogApi from '../../services/catalogApi.js';
import { ROUTES } from '../../utils/constants.js';

const VALUES = [
  {
    icon: Gem,
    title: 'Chosen with care',
    text: 'Every piece is picked for its design, finish and how well it wears, so you can shine every day without overspending.',
  },
  {
    icon: Banknote,
    title: 'Pay on delivery',
    text: 'Order online and pay in cash when your parcel arrives. No cards and no online payment needed.',
  },
  {
    icon: MessageCircle,
    title: 'Real, friendly support',
    text: 'Questions about sizes, gifts or an order? Message us on WhatsApp and a real person will help.',
  },
  {
    icon: Gift,
    title: 'Made for gifting',
    text: 'From birthdays to weddings, our pieces make thoughtful presents that are easy to send to someone you love.',
  },
];

export default function About() {
  const { whatsappLink } = useSettings();
  const filters = useQuery({ queryKey: ['filters'], queryFn: catalogApi.getFilters, staleTime: 60_000 });
  const categories = filters.data?.categories ?? [];

  return (
    <>
      <Seo
        title="About us"
        description="Crystal Zone offers elegant artificial jewellery and fashion accessories: earrings, rings, lockets, watches, bracelets, bangles and bags, delivered with Cash on Delivery."
      />

      <section className="bg-ink text-cream">
        <div className="container-cz py-14 sm:py-20">
          <Breadcrumbs items={[{ label: 'Home', to: ROUTES.home }, { label: 'About us' }]} />
          <p className="mt-8 text-xs uppercase tracking-[0.35em] text-gold">Our story</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-white sm:text-6xl">
            Jewellery that makes every day feel a little more precious
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-cream/75">
            Crystal Zone (CZ) is an online boutique for artificial jewellery and fashion accessories. We believe beautiful style
            should be within everyone&apos;s reach, so we bring together elegant pieces you will love to wear and give.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="container-cz grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">What we do</p>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl">Style you can wear from morning to evening</h2>
          </div>
          <div className="space-y-4 text-sm leading-relaxed text-charcoal/80 sm:text-base">
            <p>
              Our collection covers the pieces people reach for most: earrings, rings, lockets, watches, bracelets, bangles and
              bags. Whether you want something simple for everyday or a statement piece for a special occasion, you will find
              it here.
            </p>
            <p>
              We keep shopping simple. Browse online, order in a few taps, and pay when your order arrives at your door. If you
              ever need help, we are one WhatsApp message away.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-20">
        <div className="container-cz">
          <SectionHeading align="center" eyebrow="What we stand for" title="The Crystal Zone promise" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-cream p-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-gold-dark">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-serif text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-14 sm:py-20">
          <div className="container-cz">
            <SectionHeading align="center" eyebrow="Explore" title="Find your favourite" />
            <ul className="flex flex-wrap justify-center gap-3">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to={ROUTES.category(c.slug)}
                    className="inline-block rounded-full border border-charcoal/20 bg-white px-6 py-3 text-sm transition hover:border-gold hover:text-gold-dark"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="bg-gold py-14 text-center">
        <div className="container-cz">
          <h2 className="font-serif text-3xl text-ink sm:text-4xl">Ready to find something you love?</h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button to={ROUTES.shop} variant="dark" size="lg">
              Shop the collection
            </Button>
            <Button
              href={whatsappLink('Hello Crystal Zone! I would like some help.')}
              variant="outline"
              size="lg"
              icon={MessageCircle}
              className="border-ink/40 text-ink hover:border-ink hover:text-ink"
            >
              Chat on WhatsApp
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}