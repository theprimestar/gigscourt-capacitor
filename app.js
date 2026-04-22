// GigsCourt App - Authentication Logic

// ==================== State Management ====================
let authStateResolved = false;

// DOM Elements
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

// ==================== Email Verification ====================
async function sendVerificationEmail(user) {
    try {
        await user.sendEmailVerification();
        console.log('Verification email sent to:', user.email);
        return true;
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return false;
    }
}

function showVerificationPendingScreen(email) {
    // Create a temporary verification pending screen
    const pendingHtml = `
        <div id="verificationPendingScreen" class="screen active">
            <div class="logo-container">
                <h1 class="app-title">GigsCourt</h1>
            </div>
            <div class="auth-form">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📧</div>
                    <h3 style="margin-bottom: 15px; color: #2c3e50;">Verify Your Email</h3>
                    <p style="color: #718096; margin-bottom: 20px;">
                        We sent a verification link to<br>
                        <strong>${email}</strong>
                    </p>
                    <p style="color: #a0aec0; font-size: 14px; margin-bottom: 30px;">
                        Click the link in your email to activate your account.
                    </p>
                    <button id="resendVerificationBtn" class="secondary-btn full-width" style="margin-bottom: 10px;">
                        Resend Email
                    </button>
                    <button id="verificationLogoutBtn" class="text-link">
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Replace current screens with pending screen
    const appDiv = document.getElementById('app');
    const existingPending = document.getElementById('verificationPendingScreen');
    if (existingPending) existingPending.remove();
    
    appDiv.insertAdjacentHTML('beforeend', pendingHtml);
    
    // Add event listeners
    document.getElementById('resendVerificationBtn').addEventListener('click', async () => {
        const user = auth.currentUser;
        if (user) {
            showLoading('Sending verification email...');
            await sendVerificationEmail(user);
            hideLoading();
            alert('Verification email resent!');
        }
    });
    
    document.getElementById('verificationLogoutBtn').addEventListener('click', async () => {
        showLoading('Signing out...');
        await auth.signOut();
        hideLoading();
        location.reload();
    });
}

// ==================== Auth State Observer ====================
auth.onAuthStateChanged((user) => {
    authStateResolved = true;
    hideLoading();
    
    if (user) {
        // Check if email is verified
        if (user.emailVerified) {
            console.log('User signed in with verified email:', user.email);
            // Onboarding screen coming in Phase 2
            alert(`Welcome ${user.email}! Onboarding screen coming in Phase 2.`);
        } else {
            console.log('User signed in but email not verified:', user.email);
            showVerificationPendingScreen(user.email);
        }
    } else {
        // User is signed out
        console.log('User signed out');
        showScreen('welcome');
    }
});

// ==================== Login ====================
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
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
            showVerificationPendingScreen(user.email);
        }
        loginForm.reset();
    } catch (error) {
        loginError.textContent = getAuthErrorMessage(error.code);
    } finally {
        if (!authStateResolved) {
            // Keep loading if waiting for auth state
        } else {
            hideLoading();
        }
    }
});

// ==================== Signup ====================
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
    authStateResolved = false;
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Send verification email
        showLoading('Sending verification email...');
        const emailSent = await sendVerificationEmail(user);
        
        if (emailSent) {
            signupForm.reset();
            showVerificationPendingScreen(user.email);
        } else {
            signupError.textContent = 'Account created but verification email failed. Try resending.';
        }
    } catch (error) {
        signupError.textContent = getAuthErrorMessage(error.code);
        hideLoading();
    }
});

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
