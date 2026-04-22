// GigsCourt App - Firebase Authentication with Native Persistence

// Import Capacitor plugins
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Preferences } from '@capacitor/preferences';

// ==================== DOM Elements ====================
const screens = {
    welcome: document.getElementById('welcomeScreen'),
    login: document.getElementById('loginScreen'),
    signup: document.getElementById('signupScreen')
};

const loadingOverlay = document.getElementById('loadingOverlay');

// Form Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// Input Elements
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupConfirmPassword = document.getElementById('signupConfirmPassword');

// ==================== Persistent Storage Keys ====================
const STORAGE_KEYS = {
    USER: 'gigscourt_user',
    SESSION: 'gigscourt_session'
};

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

// ==================== Loading State ====================
function showLoading(message = 'Please wait...') {
    const loadingText = loadingOverlay.querySelector('p');
    if (loadingText) loadingText.textContent = message;
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    loadingOverlay.classList.remove('active');
}

// ==================== Save User to Native Storage ====================
async function saveUserToNativeStorage(user) {
    try {
        await Preferences.set({
            key: STORAGE_KEYS.USER,
            value: JSON.stringify({
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                displayName: user.displayName,
                photoURL: user.photoURL
            })
        });
        console.log('✅ User saved to native storage');
    } catch (error) {
        console.error('❌ Failed to save user to native storage:', error);
    }
}

// ==================== Get User from Native Storage ====================
async function getUserFromNativeStorage() {
    try {
        const { value } = await Preferences.get({ key: STORAGE_KEYS.USER });
        if (value) {
            return JSON.parse(value);
        }
    } catch (error) {
        console.error('❌ Failed to read user from native storage:', error);
    }
    return null;
}

// ==================== Clear Native Storage ====================
async function clearNativeStorage() {
    try {
        await Preferences.remove({ key: STORAGE_KEYS.USER });
        await Preferences.remove({ key: STORAGE_KEYS.SESSION });
        console.log('✅ Native storage cleared');
    } catch (error) {
        console.error('❌ Failed to clear native storage:', error);
    }
}

// ==================== Handle Successful Authentication ====================
async function handleAuthSuccess(user) {
    await saveUserToNativeStorage(user);
    
    // Sign in to Firebase web layer using the native credential
    try {
        const { getAuth, signInWithCredential, GoogleAuthProvider } = await import('firebase/auth');
        const auth = getAuth();
        
        // Get the ID token from the native user
        const idToken = await FirebaseAuthentication.getIdToken();
        
        if (idToken.token) {
            // Create credential and sign in to web layer
            const credential = GoogleAuthProvider.credential(idToken.token);
            await signInWithCredential(auth, credential);
            console.log('✅ Web layer authenticated');
        }
    } catch (error) {
        console.warn('Web layer sign-in skipped or failed:', error.message);
        // Continue anyway - native auth is sufficient
    }
    
    console.log('✅ Authentication successful:', user.email);
    alert(`Welcome ${user.email}! Onboarding screen coming in Phase 2.`);
    showScreen('welcome');
}

// ==================== Check Existing Session ====================
async function checkExistingSession() {
    try {
        // First, check native storage for a saved user (fast, offline-capable)
        const savedUser = await getUserFromNativeStorage();
        
        if (savedUser) {
            console.log('📱 Found user in native storage:', savedUser.email);
        }
        
        // Then, verify with Firebase native layer
        const result = await FirebaseAuthentication.getCurrentUser();
        
        if (result.user) {
            console.log('✅ User is authenticated:', result.user.email);
            await handleAuthSuccess(result.user);
        } else if (savedUser) {
            // User was in storage but not authenticated (session expired)
            console.log('⚠️ Session expired, clearing storage');
            await clearNativeStorage();
            showScreen('welcome');
        } else {
            // No user, show welcome screen
            showScreen('welcome');
        }
    } catch (error) {
        console.error('❌ Session check failed:', error);
        showScreen('welcome');
    }
}

// ==================== Signup Logic ====================
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const confirmPassword = signupConfirmPassword.value;
    
    if (!email || !password) {
        signupError.textContent = 'Please enter both email and password';
        return;
    }
    
    if (password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match';
        return;
    }
    
    showLoading('Creating your account...');
    signupError.textContent = '';

    try {
        // Use native Firebase plugin to create user
        const result = await FirebaseAuthentication.createUserWithEmailAndPassword({
            email: email,
            password: password
        });
        
        if (result.user) {
            // Send verification email
            await FirebaseAuthentication.sendEmailVerification();
            
            // Sign out immediately (user must verify email before logging in)
            await FirebaseAuthentication.signOut();
            await clearNativeStorage();
            
            alert('Account created! Please check your email to verify your account, then log in.');
            signupForm.reset();
            showScreen('login');
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle specific error codes
        if (error.code === 'auth/email-already-in-use') {
            signupError.textContent = 'This email is already registered.';
        } else if (error.code === 'auth/invalid-email') {
            signupError.textContent = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            signupError.textContent = 'Password is too weak.';
        } else {
            signupError.textContent = error.message || 'Signup failed. Please try again.';
        }
    } finally {
        hideLoading();
    }
});

// ==================== Login Logic ====================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    if (!email || !password) {
        loginError.textContent = 'Please enter both email and password';
        return;
    }
    
    showLoading('Logging in...');
    loginError.textContent = '';
    
    try {
        // Use native Firebase plugin to sign in
        const result = await FirebaseAuthentication.signInWithEmailAndPassword({
            email: email,
            password: password
        });
        
        if (result.user) {
            if (!result.user.emailVerified) {
                // Sign out and require verification
                await FirebaseAuthentication.signOut();
                await clearNativeStorage();
                loginError.textContent = 'Please verify your email address before logging in.';
                hideLoading();
                return;
            }
            
            await handleAuthSuccess(result.user);
            loginForm.reset();
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific error codes
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            loginError.textContent = 'Incorrect email or password.';
        } else if (error.code === 'auth/invalid-email') {
            loginError.textContent = 'Invalid email address.';
        } else if (error.code === 'auth/user-disabled') {
            loginError.textContent = 'This account has been disabled.';
        } else if (error.code === 'auth/too-many-requests') {
            loginError.textContent = 'Too many failed attempts. Please try again later.';
        } else {
            loginError.textContent = error.message || 'Login failed. Please try again.';
        }
    } finally {
        hideLoading();
    }
});

// ==================== Logout Function (for future use) ====================
async function logout() {
    try {
        showLoading('Signing out...');
        await FirebaseAuthentication.signOut();
        await clearNativeStorage();
        console.log('✅ User signed out');
        showScreen('welcome');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        hideLoading();
    }
}

// ==================== Navigation Event Listeners ====================
document.getElementById('showLoginBtn').addEventListener('click', () => {
    showScreen('login');
});

document.getElementById('showSignupBtn').addEventListener('click', () => {
    showScreen('signup');
});

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

// ==================== Initialize App ====================
async function initializeApp() {
    console.log('🚀 GigsCourt initializing...');
    console.log('📱 Platform:', Capacitor.getPlatform());
    
    // Add logout to window for debugging
    window.logout = logout;
    
    // Check for existing session
    await checkExistingSession();
}

// Start the app
initializeApp();

console.log('✅ GigsCourt Firebase auth module loaded');
