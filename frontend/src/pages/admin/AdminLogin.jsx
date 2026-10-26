import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Logo from '../../components/common/Logo.jsx';
import Seo from '../../components/common/Seo.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { validateForm, validators } from '../../utils/validators.js';
import { ROUTES } from '../../utils/constants.js';

export default function AdminLogin() {
  const { user, adminLogin } = useAuth();
  const location = useLocation();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const target =
    from && from.pathname.startsWith('/admin') && from.pathname !== ROUTES.admin.login
      ? `${from.pathname}${from.search || ''}`
      : ROUTES.admin.dashboard;

  // Only real admins are redirected. A customer who opens this page can still sign in as an admin.
  if (user?.role === 'admin') return <Navigate to={target} replace />;

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const found = validateForm(values, {
      email: validators.email,
      password: (v) => (v ? '' : 'Password is required'),
    });
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await adminLogin({ email: values.email.trim(), password: values.password });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setErrors(fieldErrors(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-12">
      <Seo title="Admin login" noindex />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="light" showTagline={false} />
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-lift">
          <h1 className="text-center font-serif text-2xl">Admin sign in</h1>
          <p className="mt-1 text-center text-sm text-charcoal/60">Store owners and staff only.</p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
            {submitError && <Alert>{submitError}</Alert>}
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              value={values.email}
              onChange={onChange}
              error={errors.email}
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={onChange}
              error={errors.password}
              required
            />
            <Button type="submit" variant="dark" size="lg" loading={submitting} className="w-full">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-cream/60">
          <Link to={ROUTES.home} className="hover:text-gold">&larr; Back to the store</Link>
        </p>
      </div>
    </div>
  );
}