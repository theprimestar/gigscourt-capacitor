// GigsCourt App - Authgear Authentication Logic

// Import Authgear configuration
import { authgearClientID, authgearEndpoint } from './authgear-config.js';

// ==================== DOM Elements ====================
const loadingOverlay = document.getElementById('loadingOverlay');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// ==================== Initialize Authgear ====================
let authgear = null;

async function initAuthgear() {
    try {
        const { Authgear } = await import('@authgear/capacitor');
        
        authgear = new Authgear({
            endpoint: authgearEndpoint,
            clientID: authgearClientID,
            isThirdPartyWebviewMessageEnabled: false
        });
        
        console.log('✅ Authgear initialized');
        
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
            redirectUri: 'com.gigscourt.app://oauth2redirect',
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
