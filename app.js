// GigsCourt App - Authentication Logic

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
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        
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
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        
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
