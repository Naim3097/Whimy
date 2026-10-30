import { describe, expect, it } from 'vitest';
import {
  addressLines,
  formatPhone,
  isValidEmail,
  isValidPhone,
  isValidPostcode,
  normalisePhone,
  phoneCountry,
  validateAddress,
  validateContact,
} from './validation';

const contact = (phone: string) => ({ email: 'test@example.com', phone, marketingOptIn: false });

describe('validation', () => {
  it('checks email format', () => {
    expect(isValidEmail('babe@example.com')).toBe(true);
    expect(isValidEmail('babe@example')).toBe(false);
    expect(isValidEmail('no spaces@example.com')).toBe(false);
  });

  it('accepts Malaysian mobiles and landlines, and Singapore numbers', () => {
    expect(isValidPhone('012-345 6789', 'MY')).toBe(true);
    expect(isValidPhone('011-1234 5678', 'MY')).toBe(true);
    expect(isValidPhone('+60 3-2141 0000', 'MY')).toBe(true);
    expect(isValidPhone('12345', 'MY')).toBe(false);
    expect(isValidPhone('9123 4567', 'SG')).toBe(true);
    expect(isValidPhone('1234 5678', 'SG')).toBe(false);
    expect(normalisePhone('012-345 6789', 'MY')).toBe('+60123456789');
  });

  it('reads the country from the number itself', () => {
    expect(phoneCountry('+65 8000 0000', 'MY')).toBe('SG');
    expect(phoneCountry('65 8000 0000', 'MY')).toBe('SG');
    expect(phoneCountry('8000 0000', 'MY')).toBe('SG');
    expect(phoneCountry('012-345 6789', 'SG')).toBe('MY');
    expect(phoneCountry('+60 12-345 6789', 'SG')).toBe('MY');
    expect(phoneCountry('12345', 'SG')).toBe('SG');
  });

  it('lets a Singapore number through the contact step while delivery is still Malaysia', () => {
    // The contact step comes before the address, so the delivery country is still the default, MY.
    for (const phone of ['+65 8000 0000', '8000 0000', '65 8000 0000', '+65 9123 4567', '6512 3456']) {
      expect(validateContact(contact(phone), 'MY')).toEqual({});
    }
    expect(normalisePhone('65 8000 0000', phoneCountry('65 8000 0000', 'MY'))).toBe('+6580000000');
    expect(normalisePhone('6512 3456', 'SG')).toBe('+6565123456');
    // Stored numbers pass again at Place order, whatever the delivery country.
    expect(validateContact(contact('+6580000000'), 'MY')).toEqual({});
    expect(validateContact(contact('+60123456789'), 'SG')).toEqual({});
  });

  it('explains both formats when a number is neither', () => {
    expect(validateContact(contact('12345'), 'MY').phone).toBe('Enter a Malaysian (012-345 6789) or Singapore (+65 8123 4567) number.');
    expect(validateContact(contact('+65 1234'), 'MY').phone).toBe('Enter an 8-digit Singapore number, e.g. +65 8123 4567.');
  });

  it('writes stored numbers for people', () => {
    expect(formatPhone('+60123456789')).toBe('+60 12-345 6789');
    expect(formatPhone('+601112345678')).toBe('+60 11-1234 5678');
    expect(formatPhone('+60321410000')).toBe('+60 3-2141 0000');
    expect(formatPhone('+6591234567')).toBe('+65 9123 4567');
    expect(formatPhone('not a number')).toBe('not a number');
  });

  it('checks postcodes per country', () => {
    expect(isValidPostcode('50450', 'MY')).toBe(true);
    expect(isValidPostcode('5045', 'MY')).toBe(false);
    expect(isValidPostcode('238823', 'SG')).toBe(true);
  });

  it('reports every missing contact and address field', () => {
    expect(Object.keys(validateContact({ email: '', phone: '', marketingOptIn: false }, 'MY'))).toEqual(['email', 'phone']);
    const errors = validateAddress({ fullName: '', line1: '', postcode: '', city: '', state: '', country: 'MY' });
    expect(Object.keys(errors).sort()).toEqual(['city', 'fullName', 'line1', 'postcode', 'state']);
    // Singapore addresses have no state.
    expect(validateAddress({ fullName: 'Mia Tan', line1: '1 Orchard Road', postcode: '238823', city: 'Singapore', state: '', country: 'SG' })).toEqual({});
  });

  it('writes the address without repeating a city as its state', () => {
    const kl = { fullName: 'Test Buyer', line1: '1 Jalan Ujian', postcode: '50000', city: 'Kuala Lumpur', state: 'Kuala Lumpur', country: 'MY' as const };
    expect(addressLines(kl)).toEqual(['Test Buyer', '1 Jalan Ujian', '50000 Kuala Lumpur', 'Malaysia']);
    expect(addressLines({ ...kl, line2: 'Unit 3', city: 'Petaling Jaya', state: 'Selangor' })).toEqual([
      'Test Buyer',
      '1 Jalan Ujian, Unit 3',
      '50000 Petaling Jaya, Selangor',
      'Malaysia',
    ]);
    expect(addressLines({ ...kl, postcode: '238823', city: 'Singapore', state: '', country: 'SG' })).toEqual([
      'Test Buyer',
      '1 Jalan Ujian',
      '238823 Singapore',
      'Singapore',
    ]);
  });
});
