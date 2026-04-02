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

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: 'AIzaSyBMGaDc0CK7Sz52834vWYCdiZoHK6rIYp8',
  authDomain: 'stories-a02bd.firebaseapp.com',
  projectId: 'stories-a02bd',
  storageBucket: 'stories-a02bd.firebasestorage.app',
  messagingSenderId: '772155057015',
  appId: '1:772155057015:web:02c2d7abae8a1df34ab772',
  measurementId: 'G-L46VJF6538',
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
