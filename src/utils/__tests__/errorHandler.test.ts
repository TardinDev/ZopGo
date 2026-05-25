import { handleError, logError, isNetworkError } from '../errorHandler';

// React Native declares __DEV__ as a `const`, so it isn't a property of
// `typeof globalThis`. We need to mutate it to exercise prod-vs-dev
// branches — go through a typed view of the global object.
const devGlobal = globalThis as unknown as { __DEV__: boolean };
const originalDev = devGlobal.__DEV__;

beforeEach(() => {
  jest.clearAllMocks();
  devGlobal.__DEV__ = true;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  devGlobal.__DEV__ = originalDev;
  jest.restoreAllMocks();
});

describe('handleError', () => {
  it('returns message from Error instance', () => {
    const result = handleError(new Error('test error'));
    expect(result.message).toBe('test error');
  });

  it('returns "Unknown error" for non-Error', () => {
    const result = handleError('string error');
    expect(result.message).toBe('Unknown error');
  });

  it('returns default displayMessage for generic error', () => {
    const result = handleError(new Error('random'));
    expect(result.displayMessage).toBe('Une erreur est survenue. Veuillez réessayer.');
  });

  it('returns network displayMessage', () => {
    const result = handleError(new Error('network failure'));
    expect(result.displayMessage).toContain('connexion');
  });

  it('returns network displayMessage for fetch errors', () => {
    const result = handleError(new Error('fetch failed'));
    expect(result.displayMessage).toContain('connexion');
  });

  it('returns timeout displayMessage', () => {
    const result = handleError(new Error('timeout exceeded'));
    expect(result.displayMessage).toContain('trop de temps');
  });

  it('returns not found displayMessage', () => {
    const result = handleError(new Error('not found'));
    expect(result.displayMessage).toContain('non trouvée');
  });

  it('returns unauthorized displayMessage', () => {
    const result = handleError(new Error('unauthorized'));
    expect(result.displayMessage).toContain('reconnecter');
  });

  it('returns forbidden displayMessage', () => {
    const result = handleError(new Error('forbidden'));
    expect(result.displayMessage).toContain('permissions');
  });

  it('returns 401 displayMessage', () => {
    const result = handleError(new Error('HTTP 401'));
    expect(result.displayMessage).toContain('reconnecter');
  });

  it('logs to console.error in __DEV__', () => {
    handleError(new Error('dev error'), 'TestContext');
    expect(console.error).toHaveBeenCalled();
  });

  it('does not log in production', () => {
    devGlobal.__DEV__ = false;
    handleError(new Error('prod error'), 'ProdContext');
    expect(console.error).not.toHaveBeenCalled();
  });

  it('includes error code if present', () => {
    const err = new Error('with code') as Error & { code: string };
    err.code = 'ERR_001';
    const result = handleError(err);
    expect(result.code).toBe('ERR_001');
  });

  it('returns undefined code for non-Error', () => {
    const result = handleError('plain string');
    expect(result.code).toBeUndefined();
  });

  it('uses "app" as default context', () => {
    handleError(new Error('no context'));
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('app'),
      expect.anything(),
      expect.anything()
    );
  });
});

describe('logError', () => {
  it('logs to console in dev', () => {
    logError(new Error('dev log'), 'Ctx');
    expect(console.error).toHaveBeenCalled();
  });

  it('does not log in production', () => {
    devGlobal.__DEV__ = false;
    logError(new Error('prod log'), 'Ctx');
    expect(console.error).not.toHaveBeenCalled();
  });
});

describe('isNetworkError', () => {
  it('returns true for network error', () => {
    expect(isNetworkError(new Error('network failure'))).toBe(true);
  });

  it('returns true for fetch error', () => {
    expect(isNetworkError(new Error('fetch failed'))).toBe(true);
  });

  it('returns true for timeout error', () => {
    expect(isNetworkError(new Error('timeout'))).toBe(true);
  });

  it('returns false for generic error', () => {
    expect(isNetworkError(new Error('something else'))).toBe(false);
  });

  it('returns false for non-Error', () => {
    expect(isNetworkError('string')).toBe(false);
    expect(isNetworkError(42)).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});
