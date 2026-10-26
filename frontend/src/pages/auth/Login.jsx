import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard.jsx';
import Seo from '../../components/common/Seo.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import TextField from '../../components/ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { validateForm, validators } from '../../utils/validators.js';
import { ROUTES } from '../../utils/constants.js';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Send the visitor back to the page that asked them to log in.
  const from = location.state?.from;
  const target = from && from.pathname !== ROUTES.login ? `${from.pathname}${from.search || ''}` : ROUTES.home;

  if (user) return <Navigate to={target} replace />;

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
      await login({ email: values.email.trim(), password: values.password });
      // On success the user is set and this page redirects automatically.
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setErrors(fieldErrors(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Log in" noindex />
      <AuthCard
        title="Welcome back"
        subtitle="Log in to see your orders, wishlist and saved addresses."
        footer={
          <>
            New to Crystal Zone?{' '}
            <Link to={ROUTES.register} state={location.state} className="font-medium text-gold-dark underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {submitError && <Alert>{submitError}</Alert>}

          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
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

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Log in
          </Button>
        </form>
      </AuthCard>
    </>
  );
}