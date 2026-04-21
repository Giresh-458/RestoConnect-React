import { maskEmail } from '../util/maskEmail';

describe('maskEmail', () => {
  test('masks standard email addresses while keeping the domain readable', () => {
    expect(maskEmail('john.doe@example.com')).toBe('j***@example.com');
  });

  test('handles short, invalid, and missing values gracefully', () => {
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
    expect(maskEmail('invalid-email')).toBe('invalid-email');
    expect(maskEmail('')).toBe('—');
    expect(maskEmail(null)).toBe('—');
  });
});
