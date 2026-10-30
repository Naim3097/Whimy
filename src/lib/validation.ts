/** Form validation helpers for checkout, contact and newsletter forms. */
import type { Address, ContactDetails } from '../domain/types';
import { MALAYSIAN_STATES } from '../data/mock/commerce';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

type Country = 'MY' | 'SG';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

const digitsOf = (value: string) => value.replace(/[\s\-()]/g, '');

/**
 * Which country a typed number belongs to. A +65 or 65 prefix, or a bare
 * 8-digit number starting 6, 8 or 9, is a Singapore number; +60, 60 and a
 * leading 0 are Malaysian. Anything else follows the delivery country. This is
 * read from the number itself because the contact step comes before the address.
 */
export function phoneCountry(value: string, fallback: Country): Country {
  const d = digitsOf(value);
  if (d.startsWith('+65') || /^65\d{8}$/.test(d) || /^[689]\d{7}$/.test(d)) return 'SG';
  if (d.startsWith('+60') || d.startsWith('60') || d.startsWith('0')) return 'MY';
  return fallback;
}

/** Strips spaces/dashes and normalises a leading 0 to +60 (MY), or adds +65 (SG). Stored in this E.164 form. */
export function normalisePhone(value: string, country: Country): string {
  const digits = digitsOf(value);
  if (country === 'SG') return digits.startsWith('+65') ? digits : `+65${digits.replace(/^65(?=\d{8}$)/, '')}`;
  if (digits.startsWith('+60')) return digits;
  if (digits.startsWith('60')) return `+${digits}`;
  if (digits.startsWith('0')) return `+60${digits.slice(1)}`;
  return digits;
}

/** Malaysian mobile (01x) or landline (0x), or a Singapore 8-digit number. */
export function isValidPhone(value: string, country: Country): boolean {
  const n = normalisePhone(value, country);
  if (country === 'SG') return /^\+65[689]\d{7}$/.test(n);
  return /^\+601\d{8,9}$/.test(n) || /^\+60[3-9]\d{7,8}$/.test(n);
}

/**
 * A stored number written for people: "+60 12-345 6789", "+60 3-2141 0000",
 * "+65 9123 4567". Anything it doesn't recognise comes back as typed.
 */
export function formatPhone(value: string): string {
  const n = digitsOf(value);
  const sg = /^\+65(\d{4})(\d{4})$/.exec(n);
  if (sg) return `+65 ${sg[1]} ${sg[2]}`;
  const my = /^\+60(1\d|[3-9])(\d{3,4})(\d{4})$/.exec(n);
  if (my) return `+60 ${my[1]}-${my[2]} ${my[3]}`;
  return value;
}

/**
 * The address as the lines a person writes on an envelope. The state is left
 * out where it only repeats the city (Kuala Lumpur, Putrajaya, Labuan).
 */
export function addressLines(address: Address): string[] {
  const country = address.country === 'SG' ? 'Singapore' : 'Malaysia';
  const state = address.country === 'MY' && address.state && address.state.trim().toLowerCase() !== address.city.trim().toLowerCase() ? address.state : '';
  return [
    address.fullName,
    [address.line1, address.line2].filter(Boolean).join(', '),
    [[address.postcode, address.city].filter(Boolean).join(' '), state].filter(Boolean).join(', '),
    country,
  ].filter(Boolean);
}

export function isValidPostcode(value: string, country: Country): boolean {
  return country === 'SG' ? /^\d{6}$/.test(value.trim()) : /^\d{5}$/.test(value.trim());
}

/**
 * The phone is checked against the country the number itself names, so a
 * Singapore shopper can pass the contact step before choosing Singapore delivery.
 */
export function validateContact(contact: ContactDetails, country: Country): FieldErrors<ContactDetails> {
  const errors: FieldErrors<ContactDetails> = {};
  if (!contact.email.trim()) errors.email = 'Enter your email address.';
  else if (!isValidEmail(contact.email)) errors.email = 'Enter an email like name@example.com.';
  if (!contact.phone.trim()) errors.phone = 'Enter a phone number for delivery updates.';
  else if (!isValidPhone(contact.phone, phoneCountry(contact.phone, country)))
    errors.phone = digitsOf(contact.phone).startsWith('+65')
      ? 'Enter an 8-digit Singapore number, e.g. +65 8123 4567.'
      : 'Enter a Malaysian (012-345 6789) or Singapore (+65 8123 4567) number.';
  return errors;
}

export function validateAddress(address: Address): FieldErrors<Address> {
  const errors: FieldErrors<Address> = {};
  if (address.fullName.trim().length < 2) errors.fullName = 'Enter the recipient’s full name.';
  if (address.line1.trim().length < 5) errors.line1 = 'Enter a street address.';
  if (!address.postcode.trim()) errors.postcode = 'Enter a postcode.';
  else if (!isValidPostcode(address.postcode, address.country))
    errors.postcode = address.country === 'SG' ? 'Singapore postcodes have 6 digits.' : 'Malaysian postcodes have 5 digits.';
  if (address.city.trim().length < 2) errors.city = 'Enter a town or city.';
  if (address.country === 'MY' && !(MALAYSIAN_STATES as readonly string[]).includes(address.state)) errors.state = 'Choose a state.';
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}
