import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('applies defaults for optional configuration', () => {
    const config = validateEnvironment({});

    expect(config.PORT).toBe(3000);
    expect(config.DATABASE_FILE_PATH).toBe('data/kudwa-ledger.sqlite');
    expect(config.GEMINI_MODEL).toBe('gemini-2.5-flash');
  });

  it('rejects invalid ports', () => {
    expect(() => validateEnvironment({ PORT: 'not-a-port' })).toThrow();
    expect(() => validateEnvironment({ PORT: '70000' })).toThrow();
  });
});
