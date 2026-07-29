import { describe, it, expect } from 'vitest';
import { generateSalt, hashPassword, verifyPassword } from '../main/utils/crypto';
import { OwnerPasswordSchema } from '../shared/validation';

describe('Auth Security & Passwords', () => {
  it('should generate salt and hash passwords correctly', () => {
    const salt = generateSalt();
    expect(salt).toHaveLength(32);

    const hash1 = hashPassword('MySecretP@ss123', salt);
    const hash2 = hashPassword('MySecretP@ss123', salt);
    expect(hash1).toEqual(hash2);

    const isValid = verifyPassword('MySecretP@ss123', salt, hash1);
    expect(isValid).toBe(true);

    const isInvalid = verifyPassword('WrongPassword', salt, hash1);
    expect(isInvalid).toBe(false);
  });

  it('should validate strong password requirements using OwnerPasswordSchema', () => {
    expect(() => OwnerPasswordSchema.parse('simple')).toThrow();
    expect(() => OwnerPasswordSchema.parse('lowercase123!')).toThrow();
    expect(() => OwnerPasswordSchema.parse('UPPERCASE123!')).toThrow();
    expect(() => OwnerPasswordSchema.parse('NoSpecialChar123')).toThrow();

    const validPass = OwnerPasswordSchema.parse('StrongP@ssw0rd!');
    expect(validPass).toBe('StrongP@ssw0rd!');
  });
});
