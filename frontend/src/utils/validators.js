// Client-side checks for instant feedback. The server validates everything again.
export const validators = {
  name: (v = '') =>
    !v.trim() ? 'Name is required' : v.trim().length < 2 ? 'Name must be at least 2 characters' : '',

  email: (v = '') =>
    !v.trim()
      ? 'Email is required'
      : !/^\S+@\S+\.\S+$/.test(v.trim())
        ? 'Please enter a valid email address'
        : '',

  phone: (v = '') =>
    !v.trim()
      ? 'Phone number is required'
      : !/^[0-9+\-\s()]{7,20}$/.test(v.trim())
        ? 'Please enter a valid phone number'
        : '',

  password: (v = '') =>
    !v
      ? 'Password is required'
      : v.length < 8
        ? 'Password must be at least 8 characters'
        : v.length > 72
          ? 'Password must be at most 72 characters'
          : !/[A-Za-z]/.test(v)
            ? 'Password must contain at least one letter'
            : !/\d/.test(v)
              ? 'Password must contain at least one number'
              : '',

  required: (label) => (v = '') => (String(v).trim() ? '' : `${label} is required`),
};

/** rules: { fieldName: (value) => errorMessage | '' }  ->  { fieldName: errorMessage } (only failures) */
export function validateForm(values, rules) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const message = rule(values[field]);
    if (message) errors[field] = message;
  }
  return errors;
}