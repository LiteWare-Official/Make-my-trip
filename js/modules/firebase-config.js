// ============================================================
// firebase-config.js
// Initializes Firebase App, Auth, Firestore, and Storage.
// Every other module imports its Firebase handles from here,
// so this is the ONLY file that should ever call initializeApp().
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// --- Firebase project configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDDVo8nKThbH-z-Y1R11hd7bJRucbpCk_I",
  authDomain: "make-my-trip-1d1c.firebaseapp.com",
  projectId: "make-my-trip-1d1c1",
  storageBucket: "make-my-trip-1d1c1.firebasestorage.app",
  messagingSenderId: "747752392128",
  appId: "1:747752392128:web:dea7a5ad09e9355fd03425",
  measurementId: "G-1YJZQ43SEV",
};

// --- Initialize core services ---
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Keep users logged in across tab refreshes / browser restarts.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Auth persistence could not be set:", err.message);
});

// Enable offline cache so listings/bookings are still readable
// (read-only) when the connection briefly drops. Fails silently
// in browsers/tabs that don't support it (e.g. multiple tabs open).
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Offline persistence disabled: multiple tabs open.");
  } else if (err.code === "unimplemented") {
    console.warn("Offline persistence not supported in this browser.");
  }
});
