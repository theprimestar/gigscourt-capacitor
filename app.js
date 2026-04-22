// GigsCourt App - Authentication Logic

// ==================== Plugin State ====================
let FirebaseAuthentication = null;
let pluginReady = false;

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

// ==================== Initialize Firebase Plugin ====================
async function initFirebase() {
    try {
        const module = await import('@capacitor-firebase/authentication');
        FirebaseAuthentication = module.FirebaseAuthentication;
        
        // Wait for native SDK to be ready
        await FirebaseAuthentication.addListener('authStateChange', (user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        });
        
        pluginReady = true;
        console.log('✅ Firebase Authentication plugin ready');
        
        // Check current auth state
        const result = await FirebaseAuthentication.getCurrentUser();
        if (result.user) {
            console.log('User already signed in:', result.user.email);
        }
    } catch (error) {
        console.error('❌ Firebase plugin initialization failed:', error);
        // Show error on screen instead of crashing
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#e74c3c;color:white;padding:20px;z-index:9999;';
        errorDiv.textContent = `Firebase init error: ${error.message}`;
        document.body.appendChild(errorDiv);
    }
}

// Call initialization immediately
initFirebase();

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

// ==================== Error Messages ====================
function getAuthErrorMessage(code) {
    const messages = {
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'This email is already registered',
        'auth/weak-password': 'Password must be at least 6 characters',
        'auth/network-request-failed': 'Network error. Check your connection',
        'auth/too-many-requests': 'Too many attempts. Try again later'
    };
    return messages[code] || 'An error occurred. Please try again';
}

// ==================== Wait for Plugin Ready ====================
async function ensurePluginReady() {
    if (pluginReady && FirebaseAuthentication) {
        return true;
    }
    
    // Wait up to 5 seconds for plugin to be ready
    for (let i = 0; i < 50; i++) {
        if (pluginReady && FirebaseAuthentication) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Firebase plugin not ready. Please restart the app.');
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
        await ensurePluginReady();
        
        const result = await FirebaseAuthentication.createUserWithEmailAndPassword({
            email: email,
            password: password
        });
        
        await FirebaseAuthentication.sendEmailVerification();
        await FirebaseAuthentication.signOut();
        
        alert('Account created! Please check your email to verify your account, then log in.');
        signupForm.reset();
        showScreen('login');
        
    } catch (error) {
        console.error('Signup error:', error);
        signupError.textContent = getAuthErrorMessage(error.code || error.message);
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
        await ensurePluginReady();
        
        const result = await FirebaseAuthentication.signInWithEmailAndPassword({
            email: email,
            password: password
        });
        
        const user = result.user;
        
        if (!user.emailVerified) {
            await FirebaseAuthentication.signOut();
            alert('Please verify your email address before logging in. Check your inbox.');
            hideLoading();
            return;
        }
        
        console.log('User signed in with verified email:', user.email);
        alert(`Welcome ${user.email}! Onboarding screen coming in Phase 2.`);
        loginForm.reset();
        
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = getAuthErrorMessage(error.code || error.message);
    } finally {
        hideLoading();
    }
});

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
    btn.addEventListener('click', () => {
        showScreen('welcome');
    });
});

// ==================== Initialize ====================
console.log('GigsCourt auth module loaded');
