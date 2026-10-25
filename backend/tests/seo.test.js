import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { renderHtml, resolvePage } from '../src/services/seoService.js';
import { api, clearDb, makeCategory, makeProduct, startDb, stopDb } from './helpers.js';

let category;
beforeAll(startDb);
afterAll(stopDb);
beforeEach(async () => {
  await clearDb();
  category = await makeCategory('Earrings');
});

describe('sitemap and robots', () => {
  it('lists visible products and categories, and never hidden ones', async () => {
    const visible = await makeProduct(category, { name: 'Visible Pair' });
    const hiddenProduct = await makeProduct(category, { name: 'Hidden Pair', isActive: false });
    const hiddenCategory = await makeCategory('Secret', { isActive: false });
    const inHiddenCategory = await makeProduct(hiddenCategory, { name: 'Secret Pair' });

    const res = await api().get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('xml');
    expect(res.text).toContain('<loc>http://localhost:5173/</loc>');
    expect(res.text).toContain(`/product/${visible.slug}`);
    expect(res.text).toContain(`/category/${category.slug}`);
    expect(res.text).not.toContain(hiddenProduct.slug);
    expect(res.text).not.toContain(inHiddenCategory.slug);
    expect(res.text).not.toContain('/admin');
    expect(res.text).not.toContain('/cart');
  });

  it('blocks search engines everywhere except a real production site', async () => {
    const res = await api().get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Disallow: /');
    expect(res.text).not.toContain('Sitemap:'); // not production, so nothing is offered to crawlers
  });
});

describe('page metadata for crawlers and link previews', () => {
  it('describes a product with its real name, price and availability', async () => {
    const product = await makeProduct(category, { name: 'Gold Hoop Earrings', price: 1500, salePrice: 1200, stock: 4 });
    const meta = await resolvePage(`/product/${product.slug}`);

    expect(meta.status).toBe(200);
    expect(meta.title).toBe('Gold Hoop Earrings | Crystal Zone');
    expect(meta.canonical).toBe(`http://localhost:5173/product/${product.slug}`);
    expect(meta.type).toBe('product');
    expect(meta.extra).toContainEqual(['product:price:amount', '1200']);
    expect(meta.extra).toContainEqual(['product:availability', 'in stock']);
    expect(meta.jsonLd[0].offers).toMatchObject({ price: 1200, priceCurrency: 'PKR', availability: 'https://schema.org/InStock' });
    expect(meta.jsonLd[1]['@type']).toBe('BreadcrumbList');
  });

  it('answers a real 404 for unknown, hidden and malformed addresses', async () => {
    const hiddenCategory = await makeCategory('Secret', { isActive: false });
    const secret = await makeProduct(hiddenCategory);
    const hidden = await makeProduct(category, { isActive: false });

    for (const path of ['/product/does-not-exist', `/product/${secret.slug}`, `/product/${hidden.slug}`, '/category/nothing', '/asdf', '/product/Bad Slug!']) {
      const meta = await resolvePage(path);
      expect(meta.status, path).toBe(404);
      expect(meta.robots, path).toContain('noindex');
    }
  });

  it('marks private pages and search results noindex, and public pages indexable', async () => {
    for (const path of ['/cart', '/checkout', '/account', '/admin/orders', '/wishlist', '/login']) {
      expect((await resolvePage(path)).robots, path).toBe('noindex, nofollow');
    }
    expect((await resolvePage('/shop', { q: 'ring' })).robots).toBe('noindex, follow');
    expect((await resolvePage('/shop')).robots).toBe('index, follow');
    for (const path of ['/', '/about', '/faq', '/contact', '/privacy-policy', '/terms', '/shipping-returns', '/track-order']) {
      expect((await resolvePage(path)).status, path).toBe(200);
    }
  });

  it('puts the right title and tags into the page, with everything escaped', async () => {
    const template = '<html><head><title>Generic</title><meta name="description" content="Generic"></head><body></body></html>';
    const meta = {
      status: 200,
      robots: 'index, follow',
      type: 'product',
      title: 'Ring "Deluxe" $& <b>bold</b> | Crystal Zone',
      description: 'A </script><script>alert(1)</script> test',
      image: 'https://res.cloudinary.com/demo/image/upload/a.jpg',
      canonical: 'https://example.com/product/ring',
      siteName: 'Crystal Zone',
      extra: [],
      jsonLd: [{ '@type': 'Product', name: '</script><script>alert(1)</script>' }],
    };

    const html = renderHtml(template, meta);
    expect(html).toContain('<title>Ring &quot;Deluxe&quot; $&amp; &lt;b&gt;bold&lt;/b&gt; | Crystal Zone</title>');
    expect(html).not.toContain('Generic');
    expect(html.match(/<\/head>/g)).toHaveLength(1);
    expect(html).not.toContain('<script>alert(1)</script>'); // no way to break out of the page
    expect(html).toContain('property="og:image" content="https://res.cloudinary.com/demo/image/upload/a.jpg"');
    expect(html).toContain('data-ssr-seo');
  });
});