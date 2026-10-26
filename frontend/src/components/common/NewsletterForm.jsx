import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import { subscribeNewsletter } from '../../services/engagementApi.js';
import { getErrorMessage } from '../../services/api.js';
import { validators } from '../../utils/validators.js';

/** Saves the address to MongoDB through the backend. Designed for a dark background. */
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const problem = validators.email(email);
    if (problem) {
      setError(problem);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await subscribeNewsletter(email.trim());
      setDoneMessage(data.message);
      setEmail('');
      toast.success(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (doneMessage) {
    return (
      <p role="status" className="rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4 text-center text-sm text-cream">
        {doneMessage}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'newsletter-error' : undefined}
          className="input flex-1 rounded-full px-5"
        />
        <Button type="submit" loading={loading}>
          Subscribe
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 text-left text-xs text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}