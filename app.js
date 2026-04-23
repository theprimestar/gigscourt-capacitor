// GigsCourt App - Authgear Authentication Logic (Dual Platform)

// ==================== Platform Detection ====================
const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

// ==================== DOM Elements ====================
const loadingOverlay = document.getElementById('loadingOverlay');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// ==================== Authgear State ====================
let authgear = null;
let authgearReady = false;

// ==================== Get All Action Buttons ====================
function getActionButtons() {
    return document.querySelectorAll('button[onclick*="startAuthgearLogin"]');
}

// ==================== Enable/Disable Buttons ====================
function setButtonsEnabled(enabled) {
    const buttons = getActionButtons();
    buttons.forEach(btn => {
        if (enabled) {
            btn.removeAttribute('disabled');
            btn.style.opacity = '1';
        } else {
            btn.setAttribute('disabled', 'disabled');
            btn.style.opacity = '0.5';
        }
    });
}

// ==================== Initialize Authgear ====================
async function initAuthgear() {
    try {
        console.log('🚀 Initializing Authgear...');
        
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
            // Web browser environment - use global authgear object
            if (typeof window.authgear === 'undefined') {
                throw new Error('Authgear Web SDK not loaded. Check script tag in index.html.');
            }
            
            authgear = new window.authgear.Authgear({
                endpoint: AUTHGEAR_ENDPOINT,
                clientID: AUTHGEAR_CLIENT_ID
            });
            console.log('✅ Authgear initialized (Web SDK - Global)');
        }
        
        authgearReady = true;
        setButtonsEnabled(true);
        
        // Check existing session
        const sessionState = await authgear.fetchSessionState();
        if (sessionState === 'AUTHENTICATED') {
            const userInfo = await authgear.fetchUserInfo();
            console.log('User already authenticated:', userInfo);
            alert(`Welcome back ${userInfo.email || 'User'}! Onboarding screen coming in Phase 2.`);
        }
    } catch (error) {
        console.error('❌ Authgear initialization failed:', error);
        console.error('--- Full Error Object ---');
        console.error(error);
        if (error.cause) {
            console.error('--- Error Cause ---');
            console.error(error.cause);
        }
        alert('Failed to initialize authentication. Please check your connection and restart the app.');
    }
}

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
    if (!authgearReady || !authgear) {
        alert('Authentication service is still loading. Please wait a moment.');
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

// ==================== Start Initialization ====================
// Disable buttons immediately
setButtonsEnabled(false);

// Initialize Authgear
initAuthgear();

console.log('GigsCourt Authgear module loaded');
