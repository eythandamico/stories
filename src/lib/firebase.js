import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'

// Firebase project config (loaded from environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey)

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
const auth = app ? getAuth(app) : null

const googleProvider = new GoogleAuthProvider()
const appleProvider = new OAuthProvider('apple.com')

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signupWithEmail(email, password, name) {
  const result = await createUserWithEmailAndPassword(auth, email, password)
  if (name) await updateProfile(result.user, { displayName: name })
  return result
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function loginWithApple() {
  return signInWithPopup(auth, appleProvider)
}

export async function logout() {
  return signOut(auth)
}

export function onAuthChange(callback) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, callback)
}

export { auth }
