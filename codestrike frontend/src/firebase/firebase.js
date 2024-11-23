// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4GPWwoi4W5ZmjX0-cKgeW-AUAydGceGU",
  authDomain: "code-strike-daa7e.firebaseapp.com",
  projectId: "code-strike-daa7e",
  storageBucket: "code-strike-daa7e.firebasestorage.app",
  messagingSenderId: "767002715816",
  appId: "1:767002715816:web:accfbd8e41bdb7ae30849d",
  measurementId: "G-DTPWQV0W6M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore(app)
export default app;