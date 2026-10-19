import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLpg34nZ2fA8MVYHCP_guEqeWc0v5jgtA",
  authDomain: "myyy-afbe4.firebaseapp.com",
  projectId: "myyy-afbe4",
  storageBucket: "myyy-afbe4.firebasestorage.app",
  messagingSenderId: "675190566511",
  appId: "1:675190566511:web:4587a12c74d867cfe7679a",
  measurementId: "G-803356EYN1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { 
  app, 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
};
