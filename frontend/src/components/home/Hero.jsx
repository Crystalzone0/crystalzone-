import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Gem, Headphones, ShieldCheck, Truck } from 'lucide-react';
import HeroDiamond from './HeroDiamond.jsx';
import { ROUTES } from '../../utils/constants.js';
import { cn } from '../../utils/cn.js';

// Edit the words here. Every slide button goes to a real page of the shop.
const SLIDES = [
  {
    eyebrow: 'Timeless elegance',
    title: 'More Than Just Jewellery',
    text: 'Discover exquisite artificial jewellery and fashion accessories that complete your style.',
    cta: 'Shop now',
    to: ROUTES.shop,
  },
  {
    eyebrow: 'Just landed',
    title: 'Fresh Pieces, Made to Shine',
    text: 'See the newest earrings, rings, bracelets and more, added to our collection.',
    cta: 'Shop new arrivals',
    to: `${ROUTES.shop}?sort=newest`,
  },
  {
    eyebrow: 'Customer favourites',
    title: 'Loved Again and Again',
    text: 'Our best sellers, chosen most often by the people who shop with us.',
    cta: 'Shop best sellers',
    to: `${ROUTES.shop}?sort=popular`,
  },
];

// Soft pools of gold light on a near-black base (no image file needed).
const HERO_BACKGROUND = [
  'radial-gradient(ellipse 48% 62% at 60% 52%, rgba(198,161,91,0.24), transparent 70%)',
  'radial-gradient(ellipse 40% 50% at 100% 15%, rgba(198,161,91,0.10), transparent 70%)',
  'radial-gradient(ellipse 45% 55% at 0% 100%, rgba(198,161,91,0.07), transparent 70%)',
  'linear-gradient(115deg, #0a0908 0%, #15110c 48%, #0a0908 100%)',
].join(',');

const SCRIPT_FONT = "'Pinyon Script', 'Snell Roundhand', 'Apple Chancery', cursive";

const arrowClass =
  'absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-gold/40 bg-ink/40 text-cream transition-colors duration-300 hover:border-gold hover:text-gold sm:flex';

function ServiceStrip() {
  const items = [
    { icon: Truck, title: 'Fast delivery', text: 'All over Pakistan' },
    { icon: ShieldCheck, title: 'Secure payments', text: '100% Safe & Reliable' },
    { icon: Gem, title: 'Premium quality', text: 'Trendy & Elegant Designs' },
    { icon: Headphones, title: '24/7 support', text: 'We’re always here' },
  ];

  return (
    <section aria-label="Our promises" className="border-y border-gold/10 bg-[#100e0c] text-cream">
      <ul className="container-cz grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-gold/15">
        {items.map(({ icon: Icon, title, text }) => (
                   <li key={title} className="flex items-center justify-center gap-2.5 px-2 py-3 sm:gap-4 sm:px-6 sm:py-8">
            <Icon size={32} strokeWidth={1.2} className="h-6 w-6 shrink-0 text-gold sm:h-8 sm:w-8" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] sm:text-xs">{title}</p>
              <p className="mt-1 text-[11px] text-cream/60 sm:text-xs">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Hero() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const go = (next) => setIndex((next + SLIDES.length) % SLIDES.length);

  return (
    <>
      <section
        aria-roledescription="carousel"
        aria-label="Featured collections"
        className="relative overflow-hidden bg-ink text-cream"
        style={{ backgroundImage: HERO_BACKGROUND }}
      >
        {/* Faint folds of light, like velvet in a jeweller's window */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-[34%] h-[150%] w-40 rotate-[24deg] bg-gradient-to-b from-gold/[0.06] to-transparent blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-10 left-[62%] h-[150%] w-56 rotate-[24deg] bg-gradient-to-b from-gold/[0.05] to-transparent blur-3xl" />

        <div className="container-cz relative grid items-center gap-4 pb-14 pt-8 sm:pb-16 sm:pt-12 lg:min-h-[630px] lg:grid-cols-[1.1fr_1fr_0.7fr] lg:gap-2 lg:py-16">
          <div key={index} aria-live="polite" className="animate-fade-up lg:pl-12">
            <p className="text-[11px] uppercase tracking-[0.4em] text-gold sm:text-xs">{slide.eyebrow}</p>
            <h1 className="mt-4 font-serif text-4xl font-normal leading-[1.05] text-white sm:mt-6 sm:text-6xl lg:text-[4.1rem]">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-cream/80 sm:mt-6 sm:text-lg">{slide.text}</p>
            <Link
              to={slide.to}
              className="mt-6 inline-flex min-h-[3rem] items-center gap-3 rounded-full border border-gold px-8 text-xs font-medium uppercase tracking-[0.22em] text-gold-light transition-colors duration-300 hover:bg-gold hover:text-ink sm:mt-9 sm:text-sm"
            >
              {slide.cta}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>

          <div className="mx-auto w-full max-w-[17rem] sm:max-w-md lg:max-w-none">
            <HeroDiamond className="h-auto w-full" />
          </div>

          <div className="hidden text-center lg:block" aria-hidden="true">
            <p className="text-5xl leading-none text-gold xl:text-6xl" style={{ fontFamily: SCRIPT_FONT }}>
              Crystal Zone
            </p>
            <p className="mt-5 text-[11px] uppercase tracking-[0.38em] text-cream/70">Shine in every detail</p>
            <span className="mx-auto mt-4 block h-px w-20 bg-cream/30" />
          </div>
        </div>

        <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className={cn(arrowClass, 'left-3 lg:left-6')}>
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className={cn(arrowClass, 'right-3 lg:right-6')}>
          <ChevronRight size={22} aria-hidden="true" />
        </button>

        <div className="absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-2 sm:bottom-4">
          {SLIDES.map((item, i) => (
            <button
              key={item.eyebrow}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1} of ${SLIDES.length}`}
              aria-current={i === index}
              className="py-3"
            >
              <span className={cn('block h-[3px] w-8 rounded-full transition-all duration-300 sm:w-10', i === index ? 'bg-gold' : 'bg-white/25 hover:bg-white/45')} />
            </button>
          ))}
        </div>
      </section>

      <ServiceStrip />
    </>
  );
}