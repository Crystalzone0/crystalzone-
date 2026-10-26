import { Link } from 'react-router-dom';
import Seo from '../../components/common/Seo.jsx';
import { ROUTES } from '../../utils/constants.js';

export default function NotFound() {
  return (
    <section className="bg-cream py-20 sm:py-28">
      <Seo title="Page not found" noindex />
      <div className="container-cz text-center">
        <p className="font-serif text-7xl text-gold sm:text-8xl">404</p>
        <h1 className="mt-4 font-serif text-3xl sm:text-4xl">This page has slipped away</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-charcoal/70">
          The page you are looking for does not exist or may have moved. Let us help you find something beautiful instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={ROUTES.shop} className="btn-gold">Shop the collection</Link>
          <Link to={ROUTES.home} className="btn-outline">Back to home</Link>
        </div>
      </div>
    </section>
  );
}