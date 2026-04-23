// GigsCourt App - Supabase Authentication Logic.

// ==================== Initialize Supabase ====================
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
    }
});

console.log('✅ Supabase client initialized');

// ==================== DOM Elements ====================
const loadingOverlay = document.getElementById('loadingOverlay');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// ==================== Helper Functions ====================
function showLoading(message = 'Please wait...') {
    const loadingText = loadingOverlay?.querySelector('p');
    if (loadingText) loadingText.textContent = message;
    if (loadingOverlay) loadingOverlay.classList.add('active');
}

function hideLoading() {
    if (loadingOverlay) loadingOverlay.classList.remove('active');
}

function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

// ==================== Check Existing Session ====================
async function checkSession() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (session) {
        console.log('User already logged in:', session.user.email);
        alert(`Welcome back ${session.user.email}! Onboarding screen coming in Phase 2.`);
    }
}

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user.email);
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
    }
});

// ==================== Check Email Verification Status ====================
async function checkEmailVerificationOnResume() {
    // Listen for app resume (user returning from email)
    document.addEventListener('resume', async () => {
        console.log('📱 App resumed - checking email verification...');
        await verifyAndRedirect();
    });
    
    // Also check immediately on load (in case user just opened the app after verifying)
    window.addEventListener('load', async () => {
        // Small delay to ensure Supabase is initialized
        setTimeout(async () => {
            await verifyAndRedirect();
        }, 1000);
    });
}

async function verifyAndRedirect() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session?.user) {
            // User is logged in - check if email is verified
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            if (user?.email_confirmed_at) {
                // Email is verified - check if this is a fresh verification
                const lastVerifiedCheck = localStorage.getItem('gigscourt_email_verified_shown');
                const verificationTime = new Date(user.email_confirmed_at).getTime();
                
                if (!lastVerifiedCheck || parseInt(lastVerifiedCheck) < verificationTime) {
                    // Fresh verification detected
                    localStorage.setItem('gigscourt_email_verified_shown', verificationTime.toString());
                    navigateTo('emailVerifiedScreen');
                    return;
                }
            }
            
            // Already verified previously or not yet - check session normally
            const currentScreen = document.querySelector('.screen.active');
            if (!currentScreen || currentScreen.id === 'welcomeScreen') {
                // Already logged in, show welcome alert
                console.log('User already logged in:', session.user.email);
            }
        }
    } catch (error) {
        console.log('Verification check:', error.message);
    }
}

// Initialize resume listener
checkEmailVerificationOnResume();

// Check session on load
checkSession();

// ==================== Global Signup Handler ====================
window.handleSignup = async function() {
    const email = document.getElementById('signupEmail')?.value.trim();
    const password = document.getElementById('signupPassword')?.value;
    const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
    const errorEl = document.getElementById('signupError');
    
    if (!email || !password) {
        if (errorEl) errorEl.textContent = 'Please enter both email and password';
        return;
    }
    
    if (password.length < 6) {
        if (errorEl) errorEl.textContent = 'Password must be at least 6 characters';
        return;
    }
    
    if (password !== confirmPassword) {
        if (errorEl) errorEl.textContent = 'Passwords do not match';
        return;
    }
    
    showLoading('Creating your account...');
    if (errorEl) errorEl.textContent = '';
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        if (data.user) {
            alert('Account created! Please check your email to verify your account, then log in.');
            document.getElementById('signupForm')?.reset();
            navigateTo('loginScreen');
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        if (errorEl) errorEl.textContent = error.message || 'Signup failed. Please try again.';
    } finally {
        hideLoading();
    }
};

// ==================== Global Login Handler ====================
window.handleLogin = async function() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    const errorEl = document.getElementById('loginError');
    
    if (!email || !password) {
        if (errorEl) errorEl.textContent = 'Please enter both email and password';
        return;
    }
    
    showLoading('Logging in...');
    if (errorEl) errorEl.textContent = '';
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        if (data.user) {
            console.log('Login successful:', data.user.email);
            alert(`Welcome ${data.user.email}! Onboarding screen coming in Phase 2.`);
            document.getElementById('loginForm')?.reset();
            navigateTo('welcomeScreen');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        if (error.message?.includes('Email not confirmed')) {
            if (errorEl) errorEl.textContent = 'Please verify your email address before logging in.';
        } else if (error.message?.includes('Invalid login credentials')) {
            if (errorEl) errorEl.textContent = 'Incorrect email or password.';
        } else {
            if (errorEl) errorEl.textContent = error.message || 'Login failed. Please try again.';
        }
    } finally {
        hideLoading();
    }
};

console.log('✅ GigsCourt Supabase auth module loaded');
