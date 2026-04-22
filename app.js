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

console.log('🚀 app.js loaded');

// ==================== DOM Elements (Queried when needed) ====================
function getElements() {
    return {
        screens: {
            welcome: document.getElementById('welcomeScreen'),
            login: document.getElementById('loginScreen'),
            signup: document.getElementById('signupScreen')
        },
        loadingOverlay: document.getElementById('loadingOverlay'),
        loginForm: document.getElementById('loginForm'),
        signupForm: document.getElementById('signupForm'),
        loginError: document.getElementById('loginError'),
        signupError: document.getElementById('signupError'),
        loginEmail: document.getElementById('loginEmail'),
        loginPassword: document.getElementById('loginPassword'),
        signupEmail: document.getElementById('signupEmail'),
        signupPassword: document.getElementById('signupPassword'),
        signupConfirmPassword: document.getElementById('signupConfirmPassword'),
        showLoginBtn: document.getElementById('showLoginBtn'),
        showSignupBtn: document.getElementById('showSignupBtn')
    };
}

// ==================== Screen Navigation ====================
function showScreen(screenId) {
    const { screens } = getElements();
    
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    
    if (screens[screenId]) {
        screens[screenId].classList.add('active');
        console.log('✅ Navigated to:', screenId);
    } else {
        console.error('❌ Screen not found:', screenId);
    }
    
    // Clear errors
    const { loginError, signupError } = getElements();
    if (loginError) loginError.textContent = '';
    if (signupError) signupError.textContent = '';
}

// ==================== Loading State ====================
function showLoading(message = 'Please wait...') {
    const { loadingOverlay } = getElements();
    const loadingText = loadingOverlay?.querySelector('p');
    if (loadingText) loadingText.textContent = message;
    if (loadingOverlay) loadingOverlay.classList.add('active');
}

function hideLoading() {
    const { loadingOverlay } = getElements();
    if (loadingOverlay) loadingOverlay.classList.remove('active');
}

// ==================== Attach Event Listeners ====================
function attachEventListeners() {
    console.log('📌 Attaching event listeners...');
    
    const elements = getElements();
    
    // Navigation buttons
    if (elements.showLoginBtn) {
        elements.showLoginBtn.addEventListener('click', () => {
            console.log('🖱️ Login button clicked');
            showScreen('login');
        });
        console.log('✅ Login button listener attached');
    } else {
        console.error('❌ Login button not found');
    }
    
    if (elements.showSignupBtn) {
        elements.showSignupBtn.addEventListener('click', () => {
            console.log('🖱️ Signup button clicked');
            showScreen('signup');
        });
        console.log('✅ Signup button listener attached');
    } else {
        console.error('❌ Signup button not found');
    }
    
    // Back buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('🖱️ Back button clicked');
            showScreen('welcome');
        });
    });
    
    // Data-target buttons
    document.querySelectorAll('[data-target]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = btn.getAttribute('data-target');
            if (target === 'loginScreen') showScreen('login');
            if (target === 'signupScreen') showScreen('signup');
            if (target === 'welcomeScreen') showScreen('welcome');
        });
    });
    
    // Signup form
    if (elements.signupForm) {
        elements.signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const { signupEmail, signupPassword, signupConfirmPassword, signupError } = getElements();
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
                
                await sendEmailVerification(user);
                await signOut(auth);
                
                alert('Account created! Please check your email to verify your account, then log in.');
                elements.signupForm.reset();
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
        console.log('✅ Signup form listener attached');
    }
    
    // Login form
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const { loginEmail, loginPassword, loginError } = getElements();
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
                elements.loginForm.reset();
                showScreen('welcome');
                
            } catch (error) {
                console.error('Login error:', error);
                
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    loginError.textContent = 'Incorrect email or password.';
                } else if (error.code === 'auth/invalid-email') {
                    loginError.textContent = 'Invalid email address.';
                } else if (error.code === 'auth/user-disabled') {
                    loginError.textContent = 'This account has been disabled.';
                } else {
                    loginError.textContent = error.message || 'Login failed. Please try again.';
                }
            } finally {
                hideLoading();
            }
        });
        console.log('✅ Login form listener attached');
    }
}

// ==================== Auth State Observer ====================
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (user.emailVerified) {
            console.log('✅ User is signed in:', user.email);
        } else {
            console.log('⚠️ User signed in but email not verified');
        }
    } else {
        console.log('👤 No user signed in');
    }
});

// ==================== Initialize App ====================
function initializeApp() {
    console.log('🚀 Initializing GigsCourt...');
    
    // Try to attach listeners immediately
    if (document.readyState === 'loading') {
        // DOM still loading, wait for it
        document.addEventListener('DOMContentLoaded', () => {
            attachEventListeners();
            showScreen('welcome');
        });
    } else {
        // DOM already ready
        attachEventListeners();
        showScreen('welcome');
    }
}

// Start the app
initializeApp();

console.log('✅ GigsCourt module loaded');
