import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
}

export class AuthService {
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
}