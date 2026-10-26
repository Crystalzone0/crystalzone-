import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../../context/SettingsContext.jsx';

const absolute = (value) => (/^https?:\/\//i.test(value) ? value : `${window.location.origin}${value}`);

/**
 * Sets the page title, description, canonical URL and Open Graph tags.
 * <Seo title="Rings" description="..." image={product.primaryImage} />
 * jsonLd: optional structured data object (or array of objects) for products, breadcrumbs ...
 */
export default function Seo({ title, description, image, path, type = 'website', noindex = false, jsonLd }) {
  const { settings } = useSettings();

  // The server pre-fills these tags for crawlers and link previews that do not run JavaScript.
  // As soon as this component has its own, the server's copies are removed so no tag appears twice.
  useEffect(() => {
    document.querySelectorAll('[data-ssr-seo]').forEach((node) => node.remove());
  }, []);

  const fullTitle = title ? `${title} | ${settings.storeName}` : `${settings.storeName} | ${settings.tagline}`;
  const text =
    description ||
    `${settings.storeName}: ${settings.tagline}. Shop earrings, rings, lockets, watches, bracelets, bangles and bags.`;
  const url = `${window.location.origin}${path ?? window.location.pathname}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={text} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={settings.storeName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={text} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={absolute(image)} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={text} />
      {image && <meta name="twitter:image" content={absolute(image)} />}

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}