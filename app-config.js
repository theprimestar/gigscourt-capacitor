// GigsCourt Application Configuration

// Detect the runtime environment
const isCapacitor = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

// Set the correct redirect URI based on the environment
const REDIRECT_URI = isCapacitor
  ? 'com.gigscourt.app://oauth2redirect' // For Capacitor Native App
  : 'https://gigscourt-capacitor.vercel.app/oauth-redirect'; // For Web App

const AUTHGEAR_CLIENT_ID = '28ab979e3cf4d82d';
const AUTHGEAR_ENDPOINT = 'https://gigscourt.authgear.cloud';

console.log('📱 Environment:', isCapacitor ? 'Capacitor' : 'Web');
console.log('🔗 Redirect URI:', REDIRECT_URI);
