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

export default function Register() {
  const { user, register } = useAuth();
  const location = useLocation();

  const [values, setValues] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const target = from && from.pathname !== ROUTES.register ? `${from.pathname}${from.search || ''}` : ROUTES.home;

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
      name: validators.name,
      email: validators.email,
      phone: validators.phone,
      password: validators.password,
      confirm: (v) => (v === values.password ? '' : 'Passwords do not match'),
    });
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setErrors(fieldErrors(err));
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Create account" noindex />
      <AuthCard
        title="Create your account"
        subtitle="Save your details for faster checkout and track your orders."
        footer={
          <>
            Already have an account?{' '}
            <Link to={ROUTES.login} state={location.state} className="font-medium text-gold-dark underline-offset-4 hover:underline">
              Log in
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {submitError && <Alert>{submitError}</Alert>}

          <TextField label="Full name" name="name" autoComplete="name" value={values.name} onChange={onChange} error={errors.name} required />
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
            label="Phone / WhatsApp"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="03XX XXXXXXX"
            value={values.phone}
            onChange={onChange}
            error={errors.phone}
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters, with a letter and a number."
            value={values.password}
            onChange={onChange}
            error={errors.password}
            required
          />
          <TextField
            label="Confirm password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={values.confirm}
            onChange={onChange}
            error={errors.confirm}
            required
          />

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            Create account
          </Button>

          <p className="text-center text-xs leading-relaxed text-charcoal/60">
            By creating an account you agree to our{' '}
            <Link to={ROUTES.terms} className="underline underline-offset-2 hover:text-gold-dark">Terms &amp; Conditions</Link> and{' '}
            <Link to={ROUTES.privacy} className="underline underline-offset-2 hover:text-gold-dark">Privacy Policy</Link>.
          </p>
        </form>
      </AuthCard>
    </>
  );
}