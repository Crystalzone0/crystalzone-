import Breadcrumbs from './Breadcrumbs.jsx';
import Seo from './Seo.jsx';
import { ROUTES } from '../../utils/constants.js';

/** A titled block of text. Links and bullet lists inside are styled automatically. */
export function LegalSection({ title, children }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-serif text-2xl sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-charcoal/80 sm:text-base [&_a:hover]:text-gold-dark [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage({ title, seoTitle, description, intro, updated, children }) {
  return (
    <>
      <Seo title={seoTitle || title} description={description} />
      <section className="border-b border-charcoal/10 bg-white">
        <div className="container-cz py-8 sm:py-12">
          <Breadcrumbs items={[{ label: 'Home', to: ROUTES.home }, { label: title }]} />
          <h1 className="mt-4 font-serif text-4xl sm:text-5xl">{title}</h1>
          {intro && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal/70 sm:text-base">{intro}</p>}
          {updated && <p className="mt-3 text-xs text-charcoal/50">Last updated: {updated}</p>}
        </div>
      </section>
      <div className="container-cz py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">{children}</div>
      </div>
    </>
  );
}