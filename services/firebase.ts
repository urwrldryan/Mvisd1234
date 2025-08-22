
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc as firestoreAddDoc,
  setDoc,
  getDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  onSnapshot as firestoreOnSnapshot,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
  QueryOrderByConstraint,
} from 'firebase/firestore';

import { firebaseConfig } from '../firebaseConfig.ts';
import { User, UploadItem, ChatMessage, AuditLogEntry, UserRole } from '../types.ts';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Type Helpers ---
type CollectionName = 'users' | 'uploads' | 'chatMessages' | 'auditLog';
type DocumentData = User | UploadItem | ChatMessage | AuditLogEntry;

// --- Real-time Data (Firestore) ---

// This function converts Firestore timestamps to JS Date objects.
const fromFirestore = (docData: any) => {
    if (docData && docData.timestamp && docData.timestamp instanceof Timestamp) {
        return { ...docData, timestamp: docData.timestamp.toDate() };
    }
    return docData;
};

export const onSnapshot = <T extends DocumentData>(
  collectionName: CollectionName,
  callback: (data: (T & { id: string })[]) => void,
  orderByClause?: QueryOrderByConstraint
) => {
  const collectionRef = collection(db, collectionName);
  const q = orderByClause ? query(collectionRef, orderByClause) : query(collectionRef);
  return firestoreOnSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...fromFirestore(doc.data()),
    }));
    callback(data as (T & { id: string })[]);
  });
};

export const addDoc = async (collectionName: CollectionName, data: Omit<DocumentData, 'id'>) => {
  const documentData = { ...data };
  // For document types that are expected to have a timestamp,
  // we replace any client-side date with a server-side timestamp for consistency.
  if ('timestamp' in documentData) {
    (documentData as any).timestamp = serverTimestamp();
  }
  return await firestoreAddDoc(collection(db, collectionName), documentData);
};

export const updateDoc = async (collectionName: CollectionName, id: string, data: Partial<DocumentData>) => {
  const docRef = doc(db, collectionName, id);
  return await firestoreUpdateDoc(docRef, data);
};

export const deleteDoc = async (collectionName: CollectionName, id: string) => {
  const docRef = doc(db, collectionName, id);
  return await firestoreDeleteDoc(docRef);
};


// --- Authentication (Firebase Auth) ---

export const onAuthUserChanged = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const registerWithEmail = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithEmail = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
    return signOut(auth);
};

export const changePassword = (newPassword: string) => {
    if (auth.currentUser) {
        return updatePassword(auth.currentUser, newPassword);
    }
    throw new Error("No authenticated user found.");
};


// --- User Profile Management (Firestore) ---

export const createUserProfile = async (uid: string, data: { username: string; email: string; role: UserRole }) => {
  // Use the Firebase Auth UID as the document ID for a direct 1-to-1 mapping.
  const userRef = doc(db, 'users', uid);
  return await setDoc(userRef, data);
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, uid, ...docSnap.data() } as User;
  }
  return null;
};

export const findUserByUsername = async (username: string): Promise<User | undefined> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, uid: userDoc.id, ...userDoc.data() } as User;
    }
    return undefined;
};