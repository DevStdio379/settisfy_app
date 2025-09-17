import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBx3aj1vw6Ahu0iVG3mYOrhp09Bk_GBeYI",
  authDomain: "settisfy-2c8ca.firebaseapp.com",
  projectId: "settisfy-2c8ca",
  storageBucket: "settisfy-2c8ca.firebasestorage.app",
  messagingSenderId: "50548318614",
  appId: "1:50548318614:android:20498e99a22f69c6a5bdb7",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);
const storage = getStorage(app);

export { db, auth, storage };