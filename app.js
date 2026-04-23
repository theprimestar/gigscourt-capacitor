// GigsCourt App - Supabase Authentication Logic

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

// ==================== Initialize Firebase ====================
// Firebase is loaded via global script in index.html
const db = firebase.firestore();
console.log('✅ Firebase Firestore initialized');

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
        const onboardingComplete = await checkOnboardingStatus(session.user.id);
        if (onboardingComplete) {
            alert(`Welcome back ${session.user.email}! Home screen coming soon.`);
            // TODO: Navigate to home screen in Phase 3
        } else {
            navigateTo('onboardingScreen');
            initOnboarding();
        }
    }
}

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        console.log('User signed in:', session.user.email);
        const onboardingComplete = await checkOnboardingStatus(session.user.id);
        if (!onboardingComplete) {
            navigateTo('onboardingScreen');
            initOnboarding();
        }
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
    }
});

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
            document.getElementById('loginForm')?.reset();
            navigateTo('welcomeScreen');
            
            // Check onboarding status
            const onboardingComplete = await checkOnboardingStatus(data.user.id);
            if (onboardingComplete) {
                alert(`Welcome ${data.user.email}! Home screen coming soon.`);
                // TODO: Navigate to home screen in Phase 3
            } else {
                navigateTo('onboardingScreen');
                initOnboarding();
            }
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

// ==================== Onboarding Functions ====================
let currentStep = 1;
let selectedServices = [];
let uploadedPhotoUrl = '';
let selectedLat = null;
let selectedLng = null;

// Check if user has completed onboarding
async function checkOnboardingStatus(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        return doc.exists && doc.data().onboardingComplete === true;
    } catch (error) {
        console.error('Onboarding check error:', error);
        return false;
    }
}

// Initialize onboarding
async function initOnboarding() {
    currentStep = 1;
    selectedServices = [];
    uploadedPhotoUrl = '';
    selectedLat = null;
    selectedLng = null;
    showOnboardingStep(1);
    await loadServicesList();
    initLocationMap();
}

// Show specific onboarding step
function showOnboardingStep(step) {
    // Hide all steps
    document.querySelectorAll('.onboarding-step').forEach(s => s.classList.remove('active'));
    // Show target step
    const target = document.getElementById('step' + step);
    if (target) target.classList.add('active');
    
    // Update progress bar
    document.getElementById('progressFill').style.width = (step * 25) + '%';
    document.getElementById('progressText').textContent = 'Step ' + step + ' of 4';
    
    currentStep = step;
}

// Navigate between steps
window.goToStep = function(step) {
    // Basic validation
    if (currentStep === 1 && step > 1) {
        const name = document.getElementById('displayName')?.value.trim();
        if (!name) {
            alert('Please enter your full name.');
            return;
        }
    }
    if (currentStep === 3 && step > 3) {
        if (!selectedLat || !selectedLng) {
            alert('Please select your workspace location on the map.');
            return;
        }
    }
    showOnboardingStep(step);
};

// Handle photo selection
window.handlePhotoSelect = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Preview the image
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('profilePhotoPreview');
        const placeholder = document.getElementById('photoPlaceholder');
        preview.src = e.target.result;
        preview.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
    
    // Upload to ImageKit
    showLoading('Uploading photo...');
    try {
        // We'll implement ImageKit upload here in the next phase
        // For now, store as base64 for testing
        uploadedPhotoUrl = reader.result;
        console.log('Photo ready for upload');
    } catch (error) {
        console.error('Photo upload error:', error);
        alert('Failed to upload photo. Please try again.');
    } finally {
        hideLoading();
    }
};

// Load services list from Supabase
async function loadServicesList() {
    try {
        const { data, error } = await supabaseClient.rpc('get_approved_services');
        if (error) throw error;
        
        const grid = document.getElementById('servicesGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (data && Array.isArray(data)) {
            data.forEach(category => {
                if (category.services && Array.isArray(category.services)) {
                    category.services.forEach(service => {
                        const chip = document.createElement('div');
                        chip.className = 'service-chip';
                        chip.textContent = service.name;
                        chip.onclick = function() {
                            this.classList.toggle('selected');
                            if (this.classList.contains('selected')) {
                                selectedServices.push(service.id);
                            } else {
                                selectedServices = selectedServices.filter(id => id !== service.id);
                            }
                        };
                        grid.appendChild(chip);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Failed to load services:', error);
    }
}

// Request a custom service
window.requestCustomService = async function() {
    const input = document.getElementById('customServiceInput');
    const name = input?.value.trim();
    if (!name) {
        alert('Please enter a service name.');
        return;
    }
    
    const user = (await supabaseClient.auth.getSession()).data.session?.user;
    if (!user) return;
    
    try {
        // Save to pending_services in Supabase
        const { error } = await supabaseClient
            .from('pending_services')
            .insert({
                name: name,
                submitted_by: user.id,
                status: 'pending'
            });
        
        if (error) throw error;
        
        alert('Service request submitted! It will be reviewed shortly.');
        input.value = '';
    } catch (error) {
        console.error('Custom service request error:', error);
        alert('Failed to submit request. Please try again.');
    }
};

// Initialize the location map
function initLocationMap() {
    const mapContainer = document.getElementById('locationMap');
    if (!mapContainer) return;
    
    // Use OpenStreetMap via Leaflet (loaded from CDN)
    if (typeof L !== 'undefined') {
        const map = L.map('locationMap').setView([9.0765, 7.3986], 6); // Default to Nigeria
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        let marker = null;
        
        map.on('click', function(e) {
            if (marker) {
                marker.setLatLng(e.latlng);
            } else {
                marker = L.marker(e.latlng).addTo(map);
            }
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;
            console.log('Location selected:', selectedLat, selectedLng);
        });
        
        // Try to get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    map.setView([position.coords.latitude, position.coords.longitude], 13);
                },
                function() {
                    console.log('Geolocation not available');
                }
            );
        }
    } else {
        // Fallback if Leaflet not loaded
        mapContainer.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <p style="margin-bottom:15px;">📍 Map loading...</p>
                <button class="secondary-btn" onclick="window.useCurrentLocation()">
                    Use Current Location
                </button>
            </div>
        `;
    }
}

// Fallback: Use current location
window.useCurrentLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                selectedLat = position.coords.latitude;
                selectedLng = position.coords.longitude;
                document.getElementById('locationMap').innerHTML = 
                    '<p style="color:#27ae60;">✅ Location set: ' + 
                    selectedLat.toFixed(4) + ', ' + selectedLng.toFixed(4) + '</p>';
            },
            function() {
                alert('Unable to get your location. Please enable location services.');
            }
        );
    }
};

// Complete onboarding and save all data
window.completeOnboarding = async function() {
    const user = (await supabaseClient.auth.getSession()).data.session?.user;
    if (!user) return;
    
    const name = document.getElementById('displayName')?.value.trim();
    const addressDesc = document.getElementById('addressDescription')?.value.trim();
    
    if (!name) {
        showOnboardingStep(1);
        alert('Please enter your full name.');
        return;
    }
    
    showLoading('Saving your profile...');
    
    try {
        // 1. Save to Firestore
        await db.collection('users').doc(user.id).set({
            displayName: name,
            email: user.email,
            photoURL: uploadedPhotoUrl || '',
            services: selectedServices,
            addressText: addressDesc || '',
            onboardingComplete: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // 2. Save location to Supabase (if provided)
        if (selectedLat && selectedLng) {
            const { error: locError } = await supabaseClient
                .from('provider_locations')
                .upsert({
                    user_id: user.id,
                    lat: selectedLat,
                    lng: selectedLng,
                    services: JSON.stringify(selectedServices),
                    last_gig_date: null,
                    updated_at: new Date().toISOString()
                });
            
            if (locError) console.error('Location save error:', locError);
        }
        
        console.log('✅ Onboarding complete for:', user.email);
        alert('Welcome to GigsCourt! Home screen is coming next.');
        navigateTo('welcomeScreen');
        // TODO: Navigate to home screen in Phase 3
        
    } catch (error) {
        console.error('Onboarding save error:', error);
        alert('Failed to save profile. Please try again.');
    } finally {
        hideLoading();
    }
};

// ==================== Email Verification Check ====================
async function checkEmailVerificationOnResume() {
    document.addEventListener('resume', async () => {
        console.log('📱 App resumed - checking email verification...');
        await verifyAndRedirect();
    });
    
    window.addEventListener('load', async () => {
        setTimeout(async () => {
            await verifyAndRedirect();
        }, 1000);
    });
}

async function verifyAndRedirect() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session?.user) {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            if (user?.email_confirmed_at) {
                const lastVerifiedCheck = localStorage.getItem('gigscourt_email_verified_shown');
                const verificationTime = new Date(user.email_confirmed_at).getTime();
                
                if (!lastVerifiedCheck || parseInt(lastVerifiedCheck) < verificationTime) {
                    localStorage.setItem('gigscourt_email_verified_shown', verificationTime.toString());
                    navigateTo('emailVerifiedScreen');
                    return;
                }
            }
        }
    } catch (error) {
        console.log('Verification check:', error.message);
    }
}

checkEmailVerificationOnResume();

console.log('✅ GigsCourt Supabase auth module loaded');
