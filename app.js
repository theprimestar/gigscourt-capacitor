// GigsCourt App - Global Firebase Version

console.log('🚀 GigsCourt app.js loaded');

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
        signupConfirmPassword: document.getElementById('signupConfirmPassword')
    };
}

// ==================== Helper Functions ====================
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

// ==================== Global Handlers (Called from HTML) ====================
window.handleLogin = async function() {
    console.log('🔥 handleLogin called');
    
    const { loginEmail, loginPassword, loginError, loginForm, screens } = getElements();
    const email = loginEmail?.value.trim();
    const password = loginPassword?.value;
    
    if (!email || !password) {
        if (loginError) loginError.textContent = 'Please enter both email and password';
        return;
    }
    
    showLoading('Logging in...');
    if (loginError) loginError.textContent = '';
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        if (!user.emailVerified) {
            await auth.signOut();
            if (loginError) loginError.textContent = 'Please verify your email address before logging in.';
            hideLoading();
            return;
        }
        
        console.log('✅ Login successful:', user.email);
        alert(`Welcome ${user.email}! Onboarding screen coming in Phase 2.`);
        
        if (loginForm) loginForm.reset();
        hideLoading();
        
        // Navigate to welcome
        if (screens.login) screens.login.classList.remove('active');
        if (screens.welcome) screens.welcome.classList.add('active');
        
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            if (loginError) loginError.textContent = 'Incorrect email or password.';
        } else if (error.code === 'auth/invalid-email') {
            if (loginError) loginError.textContent = 'Invalid email address.';
        } else if (error.code === 'auth/user-disabled') {
            if (loginError) loginError.textContent = 'This account has been disabled.';
        } else {
            if (loginError) loginError.textContent = error.message || 'Login failed. Please try again.';
        }
        hideLoading();
    }
};

window.handleSignup = async function() {
    console.log('🔥 handleSignup called');
    
    const { signupEmail, signupPassword, signupConfirmPassword, signupError, signupForm, screens } = getElements();
    const email = signupEmail?.value.trim();
    const password = signupPassword?.value;
    const confirmPassword = signupConfirmPassword?.value;
    
    console.log('📧 Email:', email);
    console.log('🔐 Password length:', password ? password.length : 0);
    
    if (!email || !password) {
        if (signupError) signupError.textContent = 'Please enter both email and password';
        return;
    }
    
    if (password.length < 6) {
        if (signupError) signupError.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    if (password !== confirmPassword) {
        if (signupError) signupError.textContent = 'Passwords do not match';
        return;
    }
    
    showLoading('Creating your account...');
    if (signupError) signupError.textContent = '';
    
    try {
        console.log('📞 Calling Firebase createUserWithEmailAndPassword...');
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ User created:', user.uid);
        
        await user.sendEmailVerification();
        console.log('📧 Verification email sent');
        
        await auth.signOut();
        console.log('👤 Signed out');
        
        alert('Account created! Please check your email to verify your account, then log in.');
        
        if (signupForm) signupForm.reset();
        hideLoading();
        
        // Navigate to login
        if (screens.signup) screens.signup.classList.remove('active');
        if (screens.login) screens.login.classList.add('active');
        
    } catch (error) {
        console.error('❌ Signup error:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            if (signupError) signupError.textContent = 'This email is already registered.';
        } else if (error.code === 'auth/invalid-email') {
            if (signupError) signupError.textContent = 'Invalid email address.';
        } else if (error.code === 'auth/weak-password') {
            if (signupError) signupError.textContent = 'Password is too weak.';
        } else {
            if (signupError) signupError.textContent = error.message || 'Signup failed. Please try again.';
        }
        hideLoading();
    }
};

// ==================== Auth State Observer ====================
auth.onAuthStateChanged((user) => {
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

console.log('✅ GigsCourt global handlers attached');
