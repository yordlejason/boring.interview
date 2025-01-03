import { AuthService } from '../src/services/AuthService';
import { DecodedToken } from '../src/types/DecodedToken';
import { jwtDecode } from 'jwt-decode';

jest.mock('jwt-decode');

describe('AuthService', () => {
  const validToken = 'valid.token';
  const expiredToken = 'expired.token';
  const decodedValidToken: DecodedToken = { exp: Math.floor(Date.now() / 1000) + 3600 };
  const decodedExpiredToken: DecodedToken = { exp: Math.floor(Date.now() / 1000) - 3600 };

  beforeEach(() => {
    (jwtDecode as jest.Mock).mockImplementation((token: string) => {
      if (token === validToken) return decodedValidToken;
      if (token === expiredToken) return decodedExpiredToken;
      throw new Error('Invalid token');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('storeToken should return true for valid token', () => {
    const result = AuthService.storeToken(validToken);
    expect(result).toBe(true);
    expect(document.cookie).toContain('authToken=valid.token');
  });

  test('storeToken should return false for expired token', () => {
    const result = AuthService.storeToken(expiredToken);
    expect(result).toBe(false);
    expect(document.cookie).not.toContain('authToken=expired.token');
  });

  test('signOut should clear the auth token cookie', () => {
    document.cookie = 'authToken=valid.token';
    AuthService.signOut();
    expect(document.cookie).not.toContain('authToken=valid.token');
  });

  test('handleGoogleResponse should return true for valid response', () => {
    const response = { credential: validToken };
    const result = AuthService.handleGoogleResponse(response);
    expect(result).toBe(true);
  });

  test('handleGoogleResponse should return false for invalid response', () => {
    const response = { credential: expiredToken };
    const result = AuthService.handleGoogleResponse(response);
    expect(result).toBe(false);
  });
});
