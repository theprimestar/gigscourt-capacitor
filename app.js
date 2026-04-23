// GigsCourt App - Authgear Authentication Logic

// Import Authgear configuration
import { authgearClientID, authgearEndpoint } from './authgear-config.js';

// ==================== DOM Elements ====================
const screens = {
    welcome: document.getElementById('welcomeScreen'),
    login: document.getElementById('loginScreen'),
    signup: document.getElementById('signupScreen')
};
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

// ==================== Screen Navigation ====================
function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    if (screens[screenId]) {
        screens[screenId].classList.add('active');
    }
    clearErrors();
}

function clearErrors() {
    if (loginError) loginError.textContent = '';
    if (signupError) signupError.textContent = '';
}

function showLoading(message = 'Please wait...') {
    const loadingText = loadingOverlay.querySelector('p');
    if (loadingText) loadingText.textContent = message;
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// ==================== Auth Flow ====================
async function startAuthentication() {
    if (!authgear) {
        loginError.textContent = 'Authentication service not ready. Please restart the app.';
        return;
    }
    
    showLoading('Opening secure login...');
    loginError.textContent = '';
    
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
            loginError.textContent = 'Login failed. Please try again.';
        }
    } finally {
        hideLoading();
    }
}

// ==================== Event Listeners ====================
document.getElementById('showLoginBtn').addEventListener('click', startAuthentication);
document.getElementById('showSignupBtn').addEventListener('click', startAuthentication);

document.querySelectorAll('[data-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.getAttribute('data-target');
        if (target === 'loginScreen') showScreen('login');
        if (target === 'signupScreen') showScreen('signup');
        if (target === 'welcomeScreen') showScreen('welcome');
    });
});

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen('welcome'));
});

console.log('GigsCourt Authgear module loaded');
