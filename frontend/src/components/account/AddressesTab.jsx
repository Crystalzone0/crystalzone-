import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AddressFields from '../common/AddressFields.jsx';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import ErrorState from '../ui/ErrorState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import TextField from '../ui/TextField.jsx';
import * as addressApi from '../../services/addressApi.js';
import { fieldErrors, getErrorMessage } from '../../services/api.js';
import { EMPTY_ADDRESS, addressRules, focusFirstInvalid } from '../../utils/address.js';
import { validateForm } from '../../utils/validators.js';

const MAX_ADDRESSES = 5;

function AddressForm({ address, onDone }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(address);

  const [values, setValues] = useState(() =>
    address
      ? {
          label: address.label || 'Home',
          fullName: address.fullName,
          phone: address.phone,
          address: address.address,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode || '',
          isDefault: address.isDefault,
        }
      : { ...EMPTY_ADDRESS, label: 'Home', isDefault: false }
  );
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

    const found = validateForm(values, addressRules);
    setErrors(found);
    setSubmitError('');
    if (Object.keys(found).length > 0) {
      focusFirstInvalid();
      return;
    }

    const payload = {
      label: values.label.trim() || 'Home',
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      province: values.province,
      isDefault: values.isDefault,
    };
    // A blank postal code is left out (the server treats "not provided" as "keep as it is").
    if (values.postalCode.trim()) payload.postalCode = values.postalCode.trim();

    setSaving(true);
    try {
      if (isEdit) await addressApi.updateAddress(address.id, payload);
      else await addressApi.createAddress(payload);
      await queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });
      toast.success('Address saved');
      onDone();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
      setErrors(fieldErrors(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-charcoal/10 bg-cream p-5 sm:p-6">
      <h3 className="font-serif text-xl">{isEdit ? 'Edit address' : 'Add a new address'}</h3>
      {submitError && <Alert>{submitError}</Alert>}

      <TextField
        label="Label"
        name="label"
        placeholder="Home, Office..."
        maxLength={30}
        value={values.label}
        onChange={onChange}
        error={errors.label}
      />
      <AddressFields values={values} errors={errors} onChange={onChange} />

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={values.isDefault}
          disabled={isEdit && address.isDefault}
          onChange={(e) => setValues((v) => ({ ...v, isDefault: e.target.checked }))}
          className="h-4 w-4 accent-gold"
        />
        {isEdit && address.isDefault ? 'This is your default address' : 'Make this my default address'}
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={saving}>
          Save address
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function AddressesTab() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [busyId, setBusyId] = useState(null);

  const query = useQuery({
    queryKey: ['account', 'addresses'],
    queryFn: () => addressApi.listAddresses().then((res) => res.addresses),
  });
  const addresses = query.data ?? [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['account', 'addresses'] });

  const makeDefault = async (address) => {
    setBusyId(address.id);
    try {
      await addressApi.updateAddress(address.id, { isDefault: true });
      await refresh();
      toast.success('Default address updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (address) => {
    if (!window.confirm('Delete this address?')) return;
    setBusyId(address.id);
    try {
      await addressApi.deleteAddress(address.id);
      await refresh();
      toast.success('Address deleted');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl">Saved addresses</h2>
          <p className="mt-1 text-sm text-charcoal/70">Saved addresses speed up checkout.</p>
        </div>
        {!editing && addresses.length < MAX_ADDRESSES && query.isSuccess && (
          <Button icon={Plus} size="sm" onClick={() => setEditing('new')}>
            Add address
          </Button>
        )}
      </div>

      {editing && (
        <AddressForm address={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
      )}

      {query.isPending ? (
        <div className="space-y-4" aria-hidden="true">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} className="py-8" />
      ) : addresses.length === 0 && !editing ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          message="Add your delivery address once and it will be ready at checkout."
          action={<Button onClick={() => setEditing('new')}>Add an address</Button>}
          className="py-10"
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col rounded-2xl border border-charcoal/10 bg-white p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{a.label || 'Address'}</p>
                {a.isDefault && (
                  <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-dark">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal/80">
                {a.fullName}
                <br />
                {a.phone}
                <br />
                {a.address}
                <br />
                {a.city}, {a.province} {a.postalCode}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => setEditing(a)}
                  disabled={busyId === a.id}
                  className="inline-flex items-center gap-1.5 transition hover:text-gold-dark disabled:opacity-50"
                >
                  <Pencil size={14} aria-hidden="true" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(a)}
                  disabled={busyId === a.id}
                  className="inline-flex items-center gap-1.5 transition hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={14} aria-hidden="true" /> Delete
                </button>
                {!a.isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(a)}
                    disabled={busyId === a.id}
                    className="underline underline-offset-4 transition hover:text-gold-dark disabled:opacity-50"
                  >
                    Make default
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}