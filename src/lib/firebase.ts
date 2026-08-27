// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "medischedule-8xein",
  appId: "1:1022898407595:web:c48a38ee5ae7b0ba24cfee",
  storageBucket: "medischedule-8xein.firebasestorage.app",
  apiKey: "AIzaSyCPV2IlAE34986yN7s112tPL5A8FEGCqPI",
  authDomain: "medischedule-8xein.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "1022898407595",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { db };
