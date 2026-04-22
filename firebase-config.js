// Firebase configuration for GigsCourt
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

// Auth instance for use throughout the app
const auth = firebase.auth();

// Firestore instance (we'll use this later)
const db = firebase.firestore();

console.log('Firebase initialized for GigsCourt');
