// GigsCourt App - Authgear Authentication Logic (Dual Platform)

// Import configuration
import { REDIRECT_URI, AUTHGEAR_CLIENT_ID, AUTHGEAR_ENDPOINT } from './app-config.js';

// ==================== Platform Detection ====================
const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

// ==================== DOM Elements ====================
const loadingOverlay = document.getElementById('loadingOverlay');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// ==================== Initialize Authgear ====================
let authgear = null;

async function initAuthgear() {
    try {
        if (isCapacitor) {
            // Native Capacitor environment
            const { Authgear } = await import('@authgear/capacitor');
            authgear = new Authgear({
                endpoint: AUTHGEAR_ENDPOINT,
                clientID: AUTHGEAR_CLIENT_ID,
                isThirdPartyWebviewMessageEnabled: false
            });
            console.log('✅ Authgear initialized (Capacitor SDK)');
        } else {
            // Web browser environment
            const { Authgear } = await import('@authgear/web');
            authgear = new Authgear({
                endpoint: AUTHGEAR_ENDPOINT,
                clientID: AUTHGEAR_CLIENT_ID
            });
            console.log('✅ Authgear initialized (Web SDK)');
        }
        
        const sessionState = await authgear.fetchSessionState();
        if (sessionState === 'AUTHENTICATED') {
            const userInfo = await authgear.fetchUserInfo();
            console.log('User already authenticated:', userInfo);
            alert(`Welcome back ${userInfo.email || 'User'}! Onboarding screen coming in Phase 2.`);
        }
    } catch (error) {
        console.error('❌ Authgear initialization failed:', error);
    }
}

initAuthgear();

// ==================== Helper Functions ====================
function showLoading(message = 'Please wait...') {
    const loadingText = loadingOverlay?.querySelector('p');
    if (loadingText) loadingText.textContent = message;
    if (loadingOverlay) loadingOverlay.classList.add('active');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
}

// ==================== Global Auth Function ====================
window.startAuthgearLogin = async function() {
    if (!authgear) {
        alert('Authentication service not ready. Please restart the app.');
        return;
    }
    
    showLoading('Opening secure login...');
    if (loginError) loginError.textContent = '';
    if (signupError) signupError.textContent = '';
    
    try {
        await authgear.authenticate({
            redirectUri: REDIRECT_URI,
            uiLocales: ['en'],
            colorScheme: 'light'
        });
        
        const userInfo = await authgear.fetchUserInfo();
        console.log('Authentication successful:', userInfo);
        alert(`Welcome ${userInfo.email || 'User'}! Onboarding screen coming in Phase 2.`);
        
    } catch (error) {
        console.error('Authentication error:', error);
        if (error.message !== 'Cancel') {
            if (loginError) loginError.textContent = 'Login failed. Please try again.';
            if (signupError) signupError.textContent = 'Signup failed. Please try again.';
        }
    } finally {
        hideLoading();
    }
};

console.log('GigsCourt Authgear module loaded');
