import { initializeApp } from 'firebase/app'
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithCredential,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'

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

// initializeAuth with explicit persistence for Capacitor WebViews.
// Falls back to getAuth if already initialized (e.g. by another module).
let auth = null
if (app) {
  try {
    auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    })
  } catch {
    auth = getAuth(app)
  }
}

const googleProvider = new GoogleAuthProvider()
const appleProvider = new OAuthProvider('apple.com')

export async function sendMagicLink(email) {
  const actionCodeSettings = {
    url: window.location.origin + '/auth?finishSignIn=true',
    handleCodeInApp: true,
    iOS: { bundleId: 'com.narrative.stories' },
  }
  await sendSignInLinkToEmail(auth, email, actionCodeSettings)
  localStorage.setItem('narrative-email-for-signin', email)
}

export function isEmailLink(url) {
  return isSignInWithEmailLink(auth, url)
}

export async function completeEmailSignIn(url) {
  const email = localStorage.getItem('narrative-email-for-signin')
  if (!email) throw new Error('Email not found — try signing in again')
  const result = await signInWithEmailLink(auth, email, url)
  localStorage.removeItem('narrative-email-for-signin')
  return result
}

export async function loginWithGoogle() {
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    const result = await FirebaseAuthentication.signInWithGoogle()
    const credential = GoogleAuthProvider.credential(
      result.credential?.idToken,
      result.credential?.accessToken,
    )
    return signInWithCredential(auth, credential)
  }
  return signInWithPopup(auth, googleProvider)
}

export async function loginWithApple() {
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    const result = await FirebaseAuthentication.signInWithApple()
    const credential = appleProvider.credential({
      idToken: result.credential?.idToken,
      rawNonce: result.credential?.nonce,
    })
    return signInWithCredential(auth, credential)
  }
  return signInWithPopup(auth, appleProvider)
}

export async function logout() {
  if (Capacitor.isNativePlatform()) {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
    await FirebaseAuthentication.signOut()
  }
  return signOut(auth)
}

export function onAuthChange(callback) {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, callback)
}

export { auth }
