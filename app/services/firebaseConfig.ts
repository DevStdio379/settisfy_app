import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAzI7fKDHOi2Qq6Vp9CX5flWQN4z5hXMNc",
  authDomain: "tags-1489a.firebaseapp.com",
  projectId: "tags-1489a",
  storageBucket: "tags-1489a.appspot.com",
  messagingSenderId: "662614141143",
  appId: "1:662614141143:android:0784a404398dbf0891a892",
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