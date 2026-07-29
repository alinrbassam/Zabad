import { describe, it, expect } from 'vitest';
import { UserCreateSchema } from '../shared/validation';

describe('User Management Validation', () => {
  it('should validate new user creation schema', () => {
    const newUser = {
      fullName: 'John Doe',
      username: 'johndoe',
      password: 'CashierPass123!',
      pin: '1234',
      phone: '555-0199',
      email: 'john@store.com',
      roleId: 'role-cashier-id',
    };

    const parsed = UserCreateSchema.parse(newUser);
    expect(parsed.username).toBe('johndoe');
    expect(parsed.pin).toBe('1234');
  });

  it('should reject invalid PIN code formats', () => {
    const invalidPinUser = {
      fullName: 'John Doe',
      username: 'johndoe',
      password: 'CashierPass123!',
      pin: 'abc', // NaN
      roleId: 'role-id',
    };

    expect(() => UserCreateSchema.parse(invalidPinUser)).toThrow();
  });
});
