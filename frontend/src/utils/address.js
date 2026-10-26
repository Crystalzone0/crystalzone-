import { validators } from './validators.js';

export const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Azad Jammu & Kashmir',
  'Gilgit-Baltistan',
];

/** Same rules the server applies. Used by checkout and the saved-address form. */
export const addressRules = {
  fullName: validators.name,
  phone: validators.phone,
  address: (v = '') =>
    v.trim().length < 10
      ? 'Please enter your complete address (at least 10 characters)'
      : v.trim().length > 300
        ? 'Address is too long'
        : '',
  city: (v = '') => (v.trim().length < 2 ? 'City is required' : ''),
  province: (v = '') => (v.trim() ? '' : 'Province is required'),
  postalCode: (v = '') =>
    v.trim() && !/^[A-Za-z0-9\s-]{3,10}$/.test(v.trim()) ? 'Please enter a valid postal code' : '',
};

export const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  postalCode: '',
};

/** Moves keyboard focus to the first field with an error (after React has rendered the messages). */
export function focusFirstInvalid() {
  requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
}