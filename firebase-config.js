// GigsCourt Firebase Configuration (Global Compat Version)

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
firebase.initializeApp(firebaseConfig);

// Get Auth instance
const auth = firebase.auth();

// CRITICAL FIX: Set persistence to INDEXEDDB for Capacitor WebView
auth.setPersistence(firebase.auth.Auth.Persistence.INDEXEDDB)
  .then(() => {
    console.log('✅ Firebase Auth persistence set to INDEXEDDB');
  })
  .catch((error) => {
    console.error('❌ Failed to set persistence:', error);
  });

// Get Firestore instance (for later use)
const db = firebase.firestore();

console.log('✅ Firebase initialized (global compat mode)');
