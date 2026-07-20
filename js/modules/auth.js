// ============================================================
// auth.js
// Central authentication module. Wraps Firebase Auth + creates/
// reads the matching Firestore `users/{uid}` doc that stores role
// (buyer/seller/admin) and profile info.
//
// Every page that needs to know "who is logged in" should import
// `onAuthChange()` and react to the callback — never read
// `auth.currentUser` directly on page load, since Firebase auth
// state resolves asynchronously.
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const googleProvider = new GoogleAuthProvider();

// Cache of the current user's Firestore profile doc (role, name, etc.)
// so pages don't need to re-fetch it on every check.
let currentUserProfile = null;
let profileReadyResolvers = [];

/* ============================================================
   Registration
   ============================================================ */

/**
 * Registers a new buyer or seller with email/password.
 * Creates the Firestore `users/{uid}` doc and sends a verification email.
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @param {"buyer"|"seller"} params.role
 * @param {string} [params.phone]
 */
export async function registerWithEmail({ name, email, password, role, phone = "" }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  await updateProfile(user, { displayName: name });

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    name,
    email,
    role, // "buyer" | "seller"
    phone,
    profileImage: "",
    status: role === "seller" ? "pending" : "active", // sellers need admin approval
    emailVerified: false,
    createdAt: serverTimestamp(),
  });

  // If registering as a seller, also create a sellerApplications doc for admin review.
  if (role === "seller") {
    await setDoc(doc(db, "sellerApplications", user.uid), {
      uid: user.uid,
      name,
      email,
      phone,
      status: "pending", // pending | approved | rejected
      appliedAt: serverTimestamp(),
    });
  }

  await sendEmailVerification(user);

  return user;
}

/* ============================================================
   Login
   ============================================================ */

export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/**
 * Google sign-in. If this is the user's first time, creates a
 * matching `users/{uid}` doc defaulted to the "buyer" role
 * (role can be upgraded later via a "Become a Seller" flow).
 */
export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;

  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || "Traveler",
      email: user.email,
      role: "buyer",
      phone: "",
      profileImage: user.photoURL || "",
      status: "active",
      emailVerified: user.emailVerified,
      createdAt: serverTimestamp(),
    });
  }

  return user;
}

/* ============================================================
   Password reset & email verification
   ============================================================ */

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error("No user is currently signed in.");
  return sendEmailVerification(auth.currentUser);
}

/* ============================================================
   Logout
   ============================================================ */

export function logout() {
  currentUserProfile = null;
  return signOut(auth);
}

/* ============================================================
   Profile helpers
   ============================================================ */

/** Fetches (and caches) the Firestore profile doc for a given uid. */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

/** Updates fields on the current user's Firestore profile doc. */
export async function updateUserProfile(uid, fields) {
  await updateDoc(doc(db, "users", uid), fields);
  if (currentUserProfile && currentUserProfile.uid === uid) {
    currentUserProfile = { ...currentUserProfile, ...fields };
  }
}

/** Returns the cached profile doc for the currently signed-in user (or null). */
export function getCachedProfile() {
  return currentUserProfile;
}

/**
 * Resolves once the very first auth-state + profile check has completed.
 * Useful for route guards that need to know synchronously-ish whether
 * to redirect before rendering protected content.
 */
export function whenAuthReady() {
  return new Promise((resolve) => {
    if (authResolved) return resolve(currentUserProfile);
    profileReadyResolvers.push(resolve);
  });
}

let authResolved = false;

/* ============================================================
   Global auth-state observer
   ============================================================
   Fires on: initial page load, login, logout, token refresh.
   `callback(user, profile)` — both null when logged out.
   ============================================================ */

const listeners = [];

export function onAuthChange(callback) {
  listeners.push(callback);
  // If we've already resolved once, fire immediately with cached state
  // so late-subscribing components don't wait for the next auth event.
  if (authResolved) {
    callback(auth.currentUser, currentUserProfile);
  }
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      currentUserProfile = await getUserProfile(user.uid);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      currentUserProfile = null;
    }
  } else {
    currentUserProfile = null;
  }

  authResolved = true;
  profileReadyResolvers.forEach((resolve) => resolve(currentUserProfile));
  profileReadyResolvers = [];

  listeners.forEach((cb) => cb(user, currentUserProfile));
});

/* ============================================================
   Route guards
   ============================================================ */

/**
 * Redirects to /pages/login.html unless a user is signed in.
 * Call at the top of any protected page's controller script.
 * Optionally restrict to specific roles.
 * @param {string[]} [allowedRoles] e.g. ["seller"], ["admin"]
 */
export async function requireAuth(allowedRoles = null) {
  const profile = await whenAuthReady();
  const user = auth.currentUser;

  if (!user) {
    window.location.href = `/pages/login.html?redirect=${encodeURIComponent(
      window.location.pathname + window.location.search
    )}`;
    return null;
  }

  if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
    window.location.href = "/index.html";
    return null;
  }

  return { user, profile };
      }
  
