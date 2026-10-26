import { useState } from 'react';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { validateForm, validators } from '../../utils/validators.js';
import { focusFirstInvalid } from '../../utils/address.js';

export default function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [values, setValues] = useState({ name: user.name, phone: user.phone });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const changed = values.name.trim() !== user.name || values.phone.trim() !== user.phone;

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const found = validateForm(values, { name: validators.name, phone: validators.phone });
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) {
      focusFirstInvalid();
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: values.name.trim(), phone: values.phone.trim() });
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-5">
      <div>
        <h2 className="font-serif text-2xl">Profile</h2>
        <p className="mt-1 text-sm text-charcoal/70">Your details are used to pre-fill checkout.</p>
      </div>

      {submitError && <Alert>{submitError}</Alert>}

      <TextField label="Full name" name="name" autoComplete="name" value={values.name} onChange={onChange} error={errors.name} required />
      <TextField
        label="Phone / WhatsApp"
        name="phone"
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        value={values.phone}
        onChange={onChange}
        error={errors.phone}
        required
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        value={user.email}
        readOnly
        hint="Your email is your login and cannot be changed here. Message us on WhatsApp if you need to change it."
        inputClassName="bg-cream text-charcoal/70"
      />

      <Button type="submit" loading={saving} disabled={!changed}>
        Save changes
      </Button>
    </form>
  );
}