import { validateEnv } from './env.validation.js';

describe('validateEnv', () => {
  const valid = {
    NODE_ENV: 'test',
    PORT: '3000',
    WEB_ORIGIN: 'http://localhost:5173',
    DATABASE_URL: 'postgresql://eateat:eateat@localhost:5432/eateat?schema=public',
  };

  it('accepts a local postgres configuration', () => {
    const env = validateEnv(valid);

    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_URL).toContain('postgresql://');
  });

  it('rejects a missing database url', () => {
    expect(() => validateEnv({ ...valid, DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });

  it('rejects an invalid port', () => {
    expect(() => validateEnv({ ...valid, PORT: '0' })).toThrow(/PORT/);
  });
});
