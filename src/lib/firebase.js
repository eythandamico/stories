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
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

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
  return onAuthStateChanged(auth, callback)
}

export { auth }
