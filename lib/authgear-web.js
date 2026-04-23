// Authgear Web SDK v3.0.0 - Self-hosted version
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.authgear = {}));
})(this, (function (exports) { 'use strict';

    // SDK code begins here
    class Authgear {
        constructor(options) {
            this.endpoint = options.endpoint;
            this.clientID = options.clientID;
            this.sessionType = options.sessionType || 'cookie';
            this.isThirdPartyWebviewMessageEnabled = options.isThirdPartyWebviewMessageEnabled || false;
            this.refreshTokenEndpoint = `${this.endpoint}/oauth2/token`;
            this.authorizeEndpoint = `${this.endpoint}/oauth2/authorize`;
            this.userInfoEndpoint = `${this.endpoint}/oauth2/userinfo`;
            this.revokeEndpoint = `${this.endpoint}/oauth2/revoke`;
            this.settingsEndpoint = `${this.endpoint}/.well-known/openid-configuration`;
            this._refreshToken = null;
            this._idToken = null;
            this._sessionState = null;
            this._userInfo = null;
        }

        async fetchSessionState() {
            try {
                const token = await this._getStoredRefreshToken();
                if (!token) {
                    return 'NO_SESSION';
                }
                const payload = this._parseJWT(token);
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp && payload.exp > now) {
                    return 'AUTHENTICATED';
                }
                return 'EXPIRED';
            } catch (e) {
                return 'NO_SESSION';
            }
        }

        async fetchUserInfo() {
            if (this._userInfo) {
                return this._userInfo;
            }
            const token = await this._getStoredIdToken();
            if (!token) {
                return null;
            }
            const response = await fetch(this.userInfoEndpoint, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                this._userInfo = await response.json();
                return this._userInfo;
            }
            return null;
        }

        async authenticate(options) {
            const redirectUri = options.redirectUri;
            const uiLocales = options.uiLocales || ['en'];
            const state = this._generateState();
            const codeVerifier = this._generateCodeVerifier();
            const codeChallenge = await this._generateCodeChallenge(codeVerifier);
            
            sessionStorage.setItem('authgear_state', state);
            sessionStorage.setItem('authgear_code_verifier', codeVerifier);
            sessionStorage.setItem('authgear_redirect_uri', redirectUri);

            const params = new URLSearchParams({
                client_id: this.clientID,
                response_type: 'code',
                redirect_uri: redirectUri,
                scope: 'openid offline_access https://authgear.com/scopes/full-access',
                state: state,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                ui_locales: uiLocales.join(' ')
            });

            window.location.href = `${this.authorizeEndpoint}?${params.toString()}`;
        }

        async handleRedirectCallback() {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');
            const storedState = sessionStorage.getItem('authgear_state');
            const codeVerifier = sessionStorage.getItem('authgear_code_verifier');
            const redirectUri = sessionStorage.getItem('authgear_redirect_uri');

            if (!code || state !== storedState) {
                throw new Error('Invalid state or missing code');
            }

            const body = new URLSearchParams({
                client_id: this.clientID,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            });

            const response = await fetch(this.refreshTokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString()
            });

            if (!response.ok) {
                throw new Error('Token exchange failed');
            }

            const data = await response.json();
            await this._storeTokens(data.refresh_token, data.id_token);
            
            sessionStorage.removeItem('authgear_state');
            sessionStorage.removeItem('authgear_code_verifier');
            sessionStorage.removeItem('authgear_redirect_uri');

            return data;
        }

        async logout(options) {
            const token = await this._getStoredRefreshToken();
            if (token) {
                const body = new URLSearchParams({
                    client_id: this.clientID,
                    token: token
                });
                await fetch(this.revokeEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: body.toString()
                });
            }
            await this._clearStoredTokens();
            if (options?.redirectUri) {
                window.location.href = options.redirectUri;
            }
        }

        async _storeTokens(refreshToken, idToken) {
            this._refreshToken = refreshToken;
            this._idToken = idToken;
            if (this.sessionType === 'cookie') {
                localStorage.setItem('authgear_refresh_token', refreshToken);
                localStorage.setItem('authgear_id_token', idToken);
            }
        }

        async _getStoredRefreshToken() {
            if (this._refreshToken) return this._refreshToken;
            if (this.sessionType === 'cookie') {
                return localStorage.getItem('authgear_refresh_token');
            }
            return null;
        }

        async _getStoredIdToken() {
            if (this._idToken) return this._idToken;
            if (this.sessionType === 'cookie') {
                return localStorage.getItem('authgear_id_token');
            }
            return null;
        }

        async _clearStoredTokens() {
            this._refreshToken = null;
            this._idToken = null;
            this._userInfo = null;
            if (this.sessionType === 'cookie') {
                localStorage.removeItem('authgear_refresh_token');
                localStorage.removeItem('authgear_id_token');
            }
        }

        _generateState() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }

        _generateCodeVerifier() {
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            return btoa(String.fromCharCode(...array))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        }

        async _generateCodeChallenge(verifier) {
            const encoder = new TextEncoder();
            const data = encoder.encode(verifier);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return btoa(String.fromCharCode(...new Uint8Array(hash)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        }

        _parseJWT(token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                return JSON.parse(jsonPayload);
            } catch (e) {
                return {};
            }
        }
    }

    exports.Authgear = Authgear;
    Object.defineProperty(exports, '__esModule', { value: true });

}));
