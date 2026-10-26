import TextField from '../ui/TextField.jsx';
import { PROVINCES } from '../../utils/address.js';

/** Full name, phone, address, city, province, postal code. `onChange` receives the input event. */
export default function AddressFields({ values, errors, onChange }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField
        label="Full name"
        name="fullName"
        autoComplete="name"
        value={values.fullName}
        onChange={onChange}
        error={errors.fullName}
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
        as="textarea"
        rows={3}
        label="Complete address"
        name="address"
        autoComplete="street-address"
        placeholder="House / flat number, street, area"
        maxLength={300}
        value={values.address}
        onChange={onChange}
        error={errors.address}
        className="sm:col-span-2"
        required
      />
      <TextField
        label="City"
        name="city"
        autoComplete="address-level2"
        value={values.city}
        onChange={onChange}
        error={errors.city}
        required
      />
      <TextField
        as="select"
        label="Province"
        name="province"
        autoComplete="address-level1"
        value={values.province}
        onChange={onChange}
        error={errors.province}
        required
      >
        <option value="">Select province</option>
        {PROVINCES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </TextField>
      <TextField
        label="Postal code (optional)"
        name="postalCode"
        autoComplete="postal-code"
        inputMode="text"
        value={values.postalCode}
        onChange={onChange}
        error={errors.postalCode}
      />
    </div>
  );
}