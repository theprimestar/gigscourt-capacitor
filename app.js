// GigsCourt App - Firebase Authentication Logic

// Import Firebase
import { auth } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

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

// ==================== Auth State Observer ====================
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.emailVerified) {
            console.log('✅ User is signed in:', user.email);
            // User is authenticated and email is verified
            // We'll add navigation to main app here in Phase 2
        } else {
            console.log('⚠️ User signed in but email not verified');
        }
    } else {
        console.log('👤 No user signed in');
        showScreen('welcome');
    }
});

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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Send verification email
        await sendEmailVerification(user);
        
        // Sign out immediately (user must verify email before logging in)
        await signOut(auth);
        
        alert('Account created! Please check your email to verify your account, then log in.');
        signupForm.reset();
        showScreen('login');
        
    } catch (error) {
        console.error('Signup error:', error);
        
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
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
            await signOut(auth);
            loginError.textContent = 'Please verify your email address before logging in.';
            hideLoading();
            return;
        }
        
        console.log('✅ Login successful:', user.email);
        alert(`Welcome ${user.email}! Onboarding screen coming in Phase 2.`);
        loginForm.reset();
        showScreen('welcome');
        
    } catch (error) {
        console.error('Login error:', error);
        
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

console.log('✅ GigsCourt auth module loaded');
