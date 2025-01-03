import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from '../types/DecodedToken';

export class AuthService {
  /**
   * Stores the token in a cookie if it is valid.
   * 
   * @param {string} credential - The token to store.
   * @returns {boolean} True if the token is valid and stored, false otherwise.
   */
  static storeToken(credential: string): boolean {
    try {
      const decoded = jwtDecode<DecodedToken>(credential);
      if (decoded?.exp && decoded.exp * 1000 > Date.now()) {
        document.cookie = `authToken=${credential}; path=/; Secure; SameSite=Strict; Max-Age=21600`;
        return true;
      }
    } catch (err) {
      console.error("Token validation error:", err);
    }
    return false;
  }

  /**
   * Signs out the user by clearing the auth token cookie.
   */
  public static signOut() {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }

  /**
   * Handles the response from Google OAuth and stores the token if valid.
   * 
   * @param {unknown} response - The response from Google OAuth.
   * @returns {boolean} True if the token is valid and stored, false otherwise.
   */
  public static handleGoogleResponse(response: unknown): boolean {
    if (response && typeof response === 'object' && 'credential' in response) {
      const { credential } = response as { credential: string };
      return !!(credential && this.storeToken(credential));
    }
    return false;
  }
}