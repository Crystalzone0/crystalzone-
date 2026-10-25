import fs from 'node:fs';
import path from 'node:path';
import { Category, Product } from '../models/index.js';
import { env } from '../config/env.js';
import { CATEGORY_POPULATE, buildFilter } from './productService.js';
import { getSettings } from './settingsService.js';

const SLUG = /^[a-z0-9-]+$/;
const SITEMAP_TTL_MS = 10 * 60 * 1000;
const MAX_SITEMAP_URLS = 50_000; // the sitemap protocol limit

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** JSON for a <script> block: "<" is escaped so the data can never close the tag. */
const safeJson = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

/** Every public URL is built from APP_URL, never from the visitor's request. */
const abs = (p) => `${env.APP_URL}${p}`;

const PRIVATE_PREFIXES = ['/cart', '/checkout', '/wishlist', '/login', '/register', '/account', '/order-success', '/unauthorized', '/admin'];

const PAGES = {
  '/': {
    title: '',
    changefreq: 'daily',
    priority: '1.0',
    description: (s) => `${s.storeName}: ${s.tagline}. Shop earrings, rings, lockets, watches, bracelets, bangles and bags with Cash on Delivery.`,
  },
  '/shop': {
    title: 'Shop',
    changefreq: 'daily',
    priority: '0.9',
    description: (s) => `Shop earrings, rings, lockets, watches, bracelets, bangles and bags at ${s.storeName}. Cash on Delivery available.`,
  },
  '/about': {
    title: 'About us',
    changefreq: 'monthly',
    priority: '0.5',
    description: (s) => `${s.storeName} offers elegant artificial jewellery and fashion accessories, delivered with Cash on Delivery.`,
  },
  '/contact': {
    title: 'Contact us',
    changefreq: 'monthly',
    priority: '0.5',
    description: (s) => `Contact ${s.storeName} by phone, WhatsApp or email, or send us a message. We are happy to help with orders, sizes and gifts.`,
  },
  '/faq': {
    title: 'FAQ',
    changefreq: 'monthly',
    priority: '0.5',
    description: () => 'Answers to common questions about ordering, Cash on Delivery, delivery, tracking, cancellations and returns.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    changefreq: 'yearly',
    priority: '0.3',
    description: (s) => `How ${s.storeName} collects, uses and protects your personal information.`,
  },
  '/terms': {
    title: 'Terms & Conditions',
    changefreq: 'yearly',
    priority: '0.3',
    description: (s) => `The terms that apply when you browse and shop at ${s.storeName}.`,
  },
  '/shipping-returns': {
    title: 'Shipping & Returns',
    changefreq: 'yearly',
    priority: '0.4',
    description: (s) => `Delivery times, delivery charges, Cash on Delivery and the returns process at ${s.storeName}.`,
  },
  '/track-order': {
    title: 'Track your order',
    sitemap: false, // useful to customers, not to search results
    description: (s) => `Track your ${s.storeName} order with your Order ID and the phone number or email used at checkout.`,
  },
};

// ------------------------------------------------------------------ helpers

function summarize(text, max = 155) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > 80 ? cut.slice(0, space) : cut).replace(/[\s.,;:!-]+$/, '')}\u2026`;
}

let defaultImage;
function fallbackImage() {
  if (defaultImage === undefined) {
    // Put a 1200x630 picture at frontend/public/og-default.jpg and previews of pages without a photo will use it.
    defaultImage = fs.existsSync(path.join(env.distPath, 'og-default.jpg')) ? abs('/og-default.jpg') : '';
  }
  return defaultImage;
}

/** Cloudinary photos are served as a 1200px JPEG for link previews (some scrapers cannot read WebP/AVIF). */
export function ogImage(url) {
  if (!url) return fallbackImage();
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/upload/f_')) {
    return url.replace('/upload/', '/upload/f_jpg,q_auto,c_limit,w_1200/');
  }
  return url;
}

function normalisePath(raw) {
  let p = String(raw || '/').replace(/\/{2,}/g, '/').toLowerCase();
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

const base = (settings, over) => ({
  status: 200,
  robots: 'index, follow',
  type: 'website',
  image: '',
  canonical: '',
  siteName: settings.storeName,
  extra: [],
  jsonLd: [],
  ...over,
});

const notFoundMeta = (settings) =>
  base(settings, {
    status: 404,
    robots: 'noindex, nofollow',
    title: `Page not found | ${settings.storeName}`,
    description: 'The page you are looking for does not exist.',
  });

// ------------------------------------------------------------------ page metadata

async function productMeta(settings, slug) {
  const filter = await buildFilter({});
  const product = await Product.findOne({ ...filter, slug }).populate(CATEGORY_POPULATE);
  if (!product) return notFoundMeta(settings);

  const url = abs(`/product/${product.slug}`);
  const images = product.images.map((i) => i.url).filter((u) => u.startsWith('https://'));
  const primary = product.primaryImage || images[0] || '';
  const inStock = product.stock > 0;
  const price = product.effectivePrice;

  const crumbs = [
    ['Home', abs('/')],
    ['Shop', abs('/shop')],
    ...(product.category ? [[product.category.name, abs(`/category/${product.category.slug}`)]] : []),
    [product.name, url],
  ];

  return base(settings, {
    title: `${product.name} | ${settings.storeName}`,
    description: summarize(product.description),
    canonical: url,
    type: 'product',
    image: ogImage(primary),
    extra: [
      ['product:price:amount', String(price)],
      ['product:price:currency', settings.currency],
      ['product:availability', inStock ? 'in stock' : 'out of stock'],
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: summarize(product.description, 500),
        sku: product.sku,
        ...(images.length ? { image: images } : {}),
        ...(product.category ? { category: product.category.name } : {}),
        brand: { '@type': 'Brand', name: settings.storeName },
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: settings.currency,
          price,
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
        ...(product.reviewCount > 0
          ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount } }
          : {}),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
      },
    ],
  });
}

async function categoryMeta(settings, slug) {
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return notFoundMeta(settings);

  return base(settings, {
    title: `${category.name} | ${settings.storeName}`,
    description:
      summarize(category.description) ||
      `Shop ${category.name.toLowerCase()} at ${settings.storeName}. Elegant artificial jewellery with Cash on Delivery.`,
    canonical: abs(`/category/${category.slug}`),
    image: ogImage(category.image?.url),
  });
}

/** What the page at `rawPath` should say about itself. Never reflects any part of the request into the output. */
export async function resolvePage(rawPath, query = {}) {
  const settings = await getSettings();
  const p = normalisePath(rawPath);

  if (PRIVATE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`))) {
    return base(settings, {
      robots: 'noindex, nofollow',
      title: `${settings.storeName} | ${settings.tagline}`,
      description: PAGES['/'].description(settings),
    });
  }

  const product = /^\/product\/([^/]+)$/.exec(p);
  if (product) return SLUG.test(product[1]) ? productMeta(settings, product[1]) : notFoundMeta(settings);

  const category = /^\/category\/([^/]+)$/.exec(p);
  if (category) return SLUG.test(category[1]) ? categoryMeta(settings, category[1]) : notFoundMeta(settings);

  const page = PAGES[p];
  if (!page) return notFoundMeta(settings);

  const meta = base(settings, {
    title: page.title ? `${page.title} | ${settings.storeName}` : `${settings.storeName} | ${settings.tagline}`,
    description: page.description(settings),
    canonical: abs(p),
    image: ogImage(''),
  });

  // Search results and filtered lists are not worth indexing (the canonical link points at the plain page).
  if (p === '/shop' && Object.keys(query).some((key) => key === 'q')) meta.robots = 'noindex, follow';

  if (p === '/') {
    const sameAs = Object.values(settings.socials || {}).filter((u) => typeof u === 'string' && u.startsWith('https://'));
    meta.jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: settings.storeName,
      url: env.APP_URL,
      telephone: settings.phone,
      email: settings.email,
      ...(sameAs.length ? { sameAs } : {}),
    });
  }

  return meta;
}

// ------------------------------------------------------------------ HTML

function buildHead(meta) {
  const m = (attrs) => `<meta ${attrs} data-ssr-seo />`;
  const lines = [
    m(`name="description" content="${esc(meta.description)}"`),
    ...(meta.robots !== 'index, follow' ? [m(`name="robots" content="${esc(meta.robots)}"`)] : []),
    ...(meta.canonical ? [`<link rel="canonical" href="${esc(meta.canonical)}" data-ssr-seo />`] : []),
    m(`property="og:site_name" content="${esc(meta.siteName)}"`),
    m(`property="og:type" content="${esc(meta.type)}"`),
    m(`property="og:title" content="${esc(meta.title)}"`),
    m(`property="og:description" content="${esc(meta.description)}"`),
    ...(meta.canonical ? [m(`property="og:url" content="${esc(meta.canonical)}"`)] : []),
    ...(meta.image ? [m(`property="og:image" content="${esc(meta.image)}"`)] : []),
    m(`name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}"`),
    m(`name="twitter:title" content="${esc(meta.title)}"`),
    m(`name="twitter:description" content="${esc(meta.description)}"`),
    ...(meta.image ? [m(`name="twitter:image" content="${esc(meta.image)}"`)] : []),
    ...meta.extra.map(([property, content]) => m(`property="${esc(property)}" content="${esc(content)}"`)),
    ...meta.jsonLd.map((data) => `<script type="application/ld+json" data-ssr-seo>${safeJson(data)}</script>`),
  ];
  return lines.map((line) => `    ${line}`).join('\n');
}

/** Puts the page's own title and tags into the built index.html (replacing its generic ones). */
export function renderHtml(template, meta) {
  const withoutDefaults = template
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '');

  const injected = `    <title>${esc(meta.title)}</title>\n${buildHead(meta)}\n  </head>`;
  // A function (not a string) so "$" characters in a product name are never treated as replacement patterns.
  return withoutDefaults.replace('</head>', () => injected);
}

// ------------------------------------------------------------------ sitemap and robots

let sitemapCache = { xml: '', at: 0 };

export async function getSitemapXml() {
  if (sitemapCache.xml && Date.now() - sitemapCache.at < SITEMAP_TTL_MS) return sitemapCache.xml;

  const filter = await buildFilter({});
  const [categories, products] = await Promise.all([
    Category.find({ isActive: true }).select('slug updatedAt').sort({ sortOrder: 1, name: 1 }).lean(),
    Product.find(filter).select('slug name updatedAt primaryImage').sort({ updatedAt: -1, _id: -1 }).limit(MAX_SITEMAP_URLS).lean(),
  ]);

  const entries = [];
  for (const [p, cfg] of Object.entries(PAGES)) {
    if (cfg.sitemap !== false) entries.push({ loc: abs(p), changefreq: cfg.changefreq, priority: cfg.priority });
  }
  for (const c of categories) {
    entries.push({ loc: abs(`/category/${c.slug}`), lastmod: c.updatedAt, changefreq: 'weekly', priority: '0.8' });
  }
  for (const p of products) {
    entries.push({
      loc: abs(`/product/${p.slug}`),
      lastmod: p.updatedAt,
      changefreq: 'weekly',
      priority: '0.7',
      image: p.primaryImage && p.primaryImage.startsWith('https://') ? { loc: p.primaryImage, title: p.name } : null,
    });
  }

  const body = entries
    .slice(0, MAX_SITEMAP_URLS)
    .map((e) =>
      [
        '  <url>',
        `    <loc>${esc(e.loc)}</loc>`,
        e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString()}</lastmod>` : '',
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : '',
        e.priority ? `    <priority>${e.priority}</priority>` : '',
        e.image ? `    <image:image><image:loc>${esc(e.image.loc)}</image:loc><image:title>${esc(e.image.title)}</image:title></image:image>` : '',
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n');

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    `${body}\n</urlset>\n`;

  sitemapCache = { xml, at: Date.now() };
  return xml;
}

export function getRobotsTxt() {
  // Only a real production site on a real address is open to search engines.
  const indexable = env.isProd && !/localhost|127\.0\.0\.1/.test(env.APP_URL);
  if (!indexable) return 'User-agent: *\nDisallow: /\n';

  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /account',
    'Disallow: /wishlist',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /order-success',
    'Disallow: /*?q=',
    '',
    `Sitemap: ${abs('/sitemap.xml')}`,
    '',
  ].join('\n');
}