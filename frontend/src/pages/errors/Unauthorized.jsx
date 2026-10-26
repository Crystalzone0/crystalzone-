import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Seo from '../../components/common/Seo.jsx';
import { ROUTES } from '../../utils/constants.js';

export default function Unauthorized() {
  return (
    <section className="bg-cream py-20 sm:py-28">
      <Seo title="Access denied" noindex />
      <div className="container-cz text-center">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert size={28} aria-hidden="true" />
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl">Access denied</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-charcoal/70">
          You do not have permission to view this page. If you are a store administrator, please sign in with your admin account.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={ROUTES.home} className="btn-gold">Back to home</Link>
          <Link to={ROUTES.admin.login} className="btn-outline">Admin sign in</Link>
        </div>
      </div>
    </section>
  );
}