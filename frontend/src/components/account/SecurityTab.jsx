import { useState } from 'react';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import TextField from '../ui/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { validateForm, validators } from '../../utils/validators.js';
import { focusFirstInvalid } from '../../utils/address.js';

const EMPTY = { currentPassword: '', newPassword: '', confirm: '' };

export default function SecurityTab() {
  const { changePassword } = useAuth();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const found = validateForm(values, {
      currentPassword: (v) => (v ? '' : 'Current password is required'),
      newPassword: validators.password,
      confirm: (v) => (v === values.newPassword ? '' : 'Passwords do not match'),
    });
    if (!found.newPassword && values.newPassword === values.currentPassword) {
      found.newPassword = 'New password must be different from the current password';
    }
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) {
      focusFirstInvalid();
      return;
    }

    setSaving(true);
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      setValues(EMPTY);
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
        <h2 className="font-serif text-2xl">Change password</h2>
        <p className="mt-1 text-sm text-charcoal/70">Changing your password logs you out on your other devices.</p>
      </div>

      {submitError && <Alert>{submitError}</Alert>}

      <TextField
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={onChange}
        error={errors.currentPassword}
        required
      />
      <TextField
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        value={values.newPassword}
        onChange={onChange}
        error={errors.newPassword}
        required
      />
      <TextField
        label="Confirm new password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        value={values.confirm}
        onChange={onChange}
        error={errors.confirm}
        required
      />

      <Button type="submit" loading={saving}>
        Update password
      </Button>
    </form>
  );
}