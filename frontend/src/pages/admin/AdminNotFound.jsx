import { Link } from 'react-router-dom';
import Seo from '../../components/common/Seo.jsx';
import { ROUTES } from '../../utils/constants.js';

export default function AdminNotFound() {
  return (
    <div className="py-20 text-center">
      <Seo title="Page not found" noindex />
      <p className="font-serif text-7xl text-gold">404</p>
      <h1 className="mt-3 font-serif text-3xl">Admin page not found</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-charcoal/70">This admin page does not exist, or has not been added yet.</p>
      <Link to={ROUTES.admin.dashboard} className="btn-gold mt-8">
        Back to dashboard
      </Link>
    </div>
  );
}