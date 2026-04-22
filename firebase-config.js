// Firebase Configuration for GigsCourt
import { Capacitor } from '@capacitor/core';
import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  indexedDBLocalPersistence, 
  getAuth 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqvDHUPuGtZGMephb3dN_31eruuBXnbFE",
  authDomain: "gigscourt2.firebaseapp.com",
  projectId: "gigscourt2",
  storageBucket: "gigscourt2.firebasestorage.app",
  messagingSenderId: "505136313803",
  appId: "1:505136313803:web:2b61e6916efdaf8723324e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// KEY FIX: Use indexedDBLocalPersistence on native platforms
// This prevents the infinite spinner issue in Capacitor WebView
let auth;
if (Capacitor.isNativePlatform()) {
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence
  });
  console.log('✅ Firebase Auth initialized with native persistence');
} else {
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized for web');
}

// Initialize Firestore
const db = getFirestore(app);

// Export instances
export { auth, db };

console.log('✅ Firebase configured for GigsCourt');
