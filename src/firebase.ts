import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/chat.spaces');
googleProvider.addScope('https://www.googleapis.com/auth/chat.messages');
googleProvider.addScope('https://www.googleapis.com/auth/meetings.space.created');
googleProvider.addScope('https://www.googleapis.com/auth/meetings.space.readonly');

let cachedAccessToken: string | null = null;

export const getAccessToken = () => cachedAccessToken;
export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    const user = result.user;
    
    // Create/update user profile in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp() // setDoc with merge: true or check if exists
    }, { merge: true });
    
    return user;
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user') {
      console.error("Error signing in with Google:", error);
    }
    throw error;
  }
};

export const signInWithPhoneMock = async (phoneNumber: string) => {
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;
    
    // Create/update user profile in Firestore with mock phone number
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      phoneNumber: phoneNumber,
      displayName: phoneNumber,
      photoURL: '',
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
    
    return user;
  } catch (error: any) {
    console.warn("Firebase signInAnonymously failed (likely disabled in console). Falling back to client-side offline simulated session:", error);
    // Return a mocked user object conforming to the User type
    const simulatedUser: any = {
      uid: 'guest_whatsapp_sim_' + Date.now(),
      displayName: phoneNumber,
      phoneNumber: phoneNumber,
      email: '',
      photoURL: '',
      emailVerified: false,
      isAnonymous: true,
      metadata: {},
      providerData: [],
      delete: async () => {},
      getIdToken: async () => 'mock_id_token',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({})
    };
    return simulatedUser;
  }
};

export const logout = () => {
  cachedAccessToken = null;
  return signOut(auth);
};

export { onAuthStateChanged };
export type { User };
