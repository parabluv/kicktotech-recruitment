// Firebase Client / Admin initialization using Firebase JS SDK
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch 
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyDLpg34nZ2fA8MVYHCP_guEqeWc0v5jgtA",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "myyy-afbe4.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "myyy-afbe4",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "myyy-afbe4.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "675190566511",
  appId: process.env.FIREBASE_APP_ID || "1:675190566511:web:4587a12c74d867cfe7679a",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-803356EYN1"
};

let app;
let firestoreDb;

try {
  app = initializeApp(firebaseConfig);
  firestoreDb = getFirestore(app);
  console.log('[FIREBASE] Initialized Firebase Firestore successfully for project:', firebaseConfig.projectId);
} catch (err) {
  console.error('[FIREBASE] Initialization error:', err.message);
}

module.exports = {
  app,
  firestoreDb,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch
};
