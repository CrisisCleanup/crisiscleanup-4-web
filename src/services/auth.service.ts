import axios from 'axios';
import jwt_decode from 'jwt-decode';
import moment from 'moment';
import { omit } from 'lodash';
import type { LocationQueryValue } from 'vue-router';
import { generateRandomString, pkceChallengeFromVerifier } from '@/utils/oauth';
import * as Sentry from '@sentry/vue';

export const CLIENT_ID = import.meta.env.VITE_APP_CRISISCLEANUP_WEB_CLIENT_ID;
const tokenEndpoint = `${import.meta.env.VITE_APP_API_BASE_URL}/o/token/`;

export interface CCUJwtDecoded {
  username: string;
  iat: number;
  exp: number;
  jti: string;
  user_id: number;
  orig_iat: number;
  aud: string;
  iss: string;
}

export interface OuathToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
}

// TODO: REMOVE
const AuthService = {
  getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith('csrftoken=')) {
        return cookie.slice('csrftoken='.length);
      }
    }
    return null;
  },
  // getUser() {
  //   return
  //   try {
  //     const user = localStorage.getItem('oauth_user');
  //     if (!user) {
  //       console.error('No user found in local storage');
  //       return null;
  //     }
  //
  //     return JSON.parse(user) as Record<string, any>;
  //   } catch {
  //     console.error('Failed to parse user from local storage');
  //     return null;
  //   }
  // },
  // async logoutUser() {
  //   try {
  //     await axios.post(
  //       `${import.meta.env.VITE_APP_API_BASE_URL}/logout/`,
  //       null,
  //       {
  //         headers: {
  //           'Content-Type': 'application/x-www-form-urlencoded',
  //           'X-CSRFToken': this.getCsrfToken(),
  //           Authorization: `Bearer ${this.getAccessToken()}`,
  //         },
  //       },
  //     );
  //   } catch (error) {
  //     console.error(error);
  //   }
  //   if (this.getAccessToken()) {
  //     await Promise.allSettled([
  //       this.revokeAccessToken(this.getAccessToken() as string),
  //       this.revokeAccessToken(this.getRefreshToken() as string),
  //     ]);
  //     this.clearAuthStorage();
  //   }
  // },
  // async buildOauthAuthorizationUrl(from: string | null | LocationQueryValue[]) {
  //   const code_verifier = generateRandomString();
  //   localStorage.setItem('code_verifier', code_verifier);
  //   const code_challenge = await pkceChallengeFromVerifier(code_verifier);
  //
  //   const url = new URL(
  //     `${import.meta.env.VITE_APP_API_BASE_URL}/o/authorize/`,
  //   );
  //
  //   const params = new URLSearchParams({
  //     response_type: 'code',
  //     code_challenge: code_challenge,
  //     code_challenge_method: 'S256',
  //     client_id: CLIENT_ID,
  //     redirect_uri: `${window.location.origin}/o/callback`,
  //     state: String(from || '/'),
  //   });
  //
  //   url.search = params.toString();
  //
  //   return url.toString();
  // },
};

export { AuthService };
