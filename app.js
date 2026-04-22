// GigsCourt App - Authentication Logic (Corrected)

// ==================== DOM Elements ====================
const screens = {
    welcome: document.getElementById('welcomeScreen'),
    login: document.getElementById('loginScreen'),
    signup: document.getElementById('signupScreen')
};
const loadingOverlay = document.getElementById('loadingOverlay');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupConfirmPassword = document.getElementById('signupConfirmPassword');

// ==================== State Management ====================
let authReady = false;

// ==================== Helper Functions ====================
function showScreen(screenId) {
    Object.values(screens).forEach(screen => { if (screen) screen.classList.remove('active'); });
    if (screens[screenId]) screens[screenId].classList.add('active');
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

function getAuthErrorMessage(code) { /* ... error messages unchanged ... */ }

// ==================== Auth State Observer (FIXED) ====================
auth.onAuthStateChanged((user) => {
    authReady = true;
    hideLoading();
    
    if (user) {
        if (user.emailVerified) {
            alert(`Welcome ${user.email}! Onboarding screen coming in Phase 2.`);
        } else {
            showVerificationPendingScreen(user.email);
        }
    } else {
        showScreen('welcome');
    }
});

// ==================== Signup Logic (FIXED) ====================
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // ... (validation logic unchanged) ...

    showLoading('Creating your account...');
    signupError.textContent = '';
    authReady = false; // Reset state flag

    try {
        // 1. Create the user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // 2. Send verification email
        showLoading('Sending verification email...');
        await user.sendEmailVerification();
        
        // 3. Sign the user OUT immediately.
        // This forces them to verify their email before using the app,
        // which is a security best practice and prevents the spinner issue.
        await auth.signOut();
        
        // 4. Show success message and redirect to login
        alert('Account created! Please check your email to verify your account, then log in.');
        signupForm.reset();
        showScreen('login');
        
    } catch (error) {
        signupError.textContent = getAuthErrorMessage(error.code);
    } finally {
        // Only hide loading if auth state hasn't resolved to prevent flicker
        if (authReady) hideLoading();
    }
});

// ==================== Login Logic (UNCHANGED) ====================
// ... (rest of the file remains the same) ...
