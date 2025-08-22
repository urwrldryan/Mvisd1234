import { User, UploadItem, ChatMessage, AuditLogEntry, UserRole } from '../types.ts';

// This is a mock Firebase/Firestore service that uses localStorage to simulate a
// real-time, persistent, cloud-based backend. It's designed to have an API
// that closely mirrors the actual Firebase Firestore SDK, making it easy to swap
// out for a real implementation later.

type Collection = 'users' | 'uploads' | 'chatMessages' | 'auditLog';
type Document = User | UploadItem | ChatMessage | AuditLogEntry;

// --- Internal State and Persistence ---

const db: { [key in Collection]?: Map<string, any> } = {};

const loadCollectionFromStorage = (collection: Collection): Map<string, any> => {
    const storedData = localStorage.getItem(`firebase_db_${collection}`);
    if (storedData) {
        try {
            const parsed = JSON.parse(storedData);
            // Re-hydrate dates
            if ((collection === 'chatMessages' || collection === 'auditLog') && Array.isArray(parsed)) {
                parsed.forEach((doc: any) => {
                    if (doc.timestamp) {
                       doc.timestamp = new Date(doc.timestamp);
                    }
                });
            }
            // Convert array to Map
            const map = new Map<string, any>();
            parsed.forEach((doc: any) => map.set(doc.id.toString(), doc));
            return map;
        } catch(e) {
            console.error(`Failed to parse collection ${collection} from storage`, e);
            return new Map<string, any>();
        }
    }
    return new Map<string, any>();
};

const saveCollectionToStorage = (collection: Collection) => {
    if (db[collection]) {
        const data = Array.from(db[collection]!.values());
        localStorage.setItem(`firebase_db_${collection}`, JSON.stringify(data));
    }
};

// Initialize DB from localStorage
db.users = loadCollectionFromStorage('users');
db.uploads = loadCollectionFromStorage('uploads');
db.chatMessages = loadCollectionFromStorage('chatMessages');
db.auditLog = loadCollectionFromStorage('auditLog');


// --- Real-time Subscription (Observer Pattern) ---

type Unsubscribe = () => void;
type ListenerCallback = (data: any[]) => void;

const listeners: { [key in Collection]?: Set<ListenerCallback> } = {};

const notifyListeners = (collection: Collection) => {
    const collectionListeners = listeners[collection];
    if (collectionListeners) {
        const data = Array.from(db[collection]!.values());
        collectionListeners.forEach(callback => callback(data));
    }
};

// --- Mock Firestore API ---

/**
 * Listens for real-time updates to a collection.
 * @param collection - The name of the collection to listen to.
 * @param callback - The function to call with the collection data on any change.
 * @returns An unsubscribe function.
 */
export const onSnapshot = (collection: Collection, callback: ListenerCallback): Unsubscribe => {
    if (!listeners[collection]) {
        listeners[collection] = new Set();
    }
    listeners[collection]!.add(callback);
    
    // Immediately call the callback with the current data
    const initialData = Array.from(db[collection]?.values() ?? []);
    callback(initialData);

    return () => {
        listeners[collection]!.delete(callback);
    };
};

/**
 * Adds a new document to a collection.
 * @param collection - The name of the collection.
 * @param data - The document data to add. It should not have an 'id'.
 * @returns The newly created document with an 'id'.
 */
export const addDoc = async <T extends Omit<Document, 'id' | 'timestamp' > & { timestamp?: Date }>(collection: Collection, data: T): Promise<Document> => {
    return new Promise(resolve => {
        setTimeout(() => {
            if (!db[collection]) {
                db[collection] = new Map<string, any>();
            }
            const collectionMap = db[collection]!;
            const newDoc = { ...data, id: Date.now() } as unknown as Document;
            
            if('timestamp' in newDoc && !newDoc.timestamp) {
                (newDoc as any).timestamp = new Date();
            }

            collectionMap.set(newDoc.id.toString(), newDoc);
            
            saveCollectionToStorage(collection);
            notifyListeners(collection);
            
            resolve(newDoc);
        }, 100); // Simulate network latency
    });
};

/**
 * Updates an existing document in a collection.
 * @param collection - The name of the collection.
 * @param id - The ID of the document to update.
 * @param data - An object containing the fields to update.
 */
export const updateDoc = async (collection: Collection, id: number | string, data: Partial<Document>): Promise<void> => {
     return new Promise(resolve => {
        setTimeout(() => {
            const collectionMap = db[collection]!;
            const docId = id.toString();
            if (collectionMap.has(docId)) {
                const existingDoc = collectionMap.get(docId)!;
                const updatedDoc = { ...existingDoc, ...data };
                collectionMap.set(docId, updatedDoc);

                saveCollectionToStorage(collection);
                notifyListeners(collection);
            }
            resolve();
        }, 100);
    });
};

/**
 * Deletes a document from a collection.
 * @param collection - The name of the collection.
 * @param id - The ID of the document to delete.
 */
export const deleteDoc = async (collection: Collection, id: number | string): Promise<void> => {
     return new Promise(resolve => {
        setTimeout(() => {
            const collectionMap = db[collection]!;
            const docId = id.toString();
            if (collectionMap.has(docId)) {
                collectionMap.delete(docId);
                
                saveCollectionToStorage(collection);
                notifyListeners(collection);
            }
            resolve();
        }, 100);
    });
};

// --- User Management Specific Functions ---
export const findUserByUsername = async (username: string): Promise<User | undefined> => {
    const users = Array.from(db.users!.values()) as User[];
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
};

// --- User Session Management ---
const SESSION_KEY = 'firebase_session_user';

export const getCurrentUser = (): User | null => {
    try {
        const userJson = localStorage.getItem(SESSION_KEY);
        return userJson ? JSON.parse(userJson) : null;
    } catch {
        return null;
    }
};

export const setCurrentUser = (user: User | null) => {
    if (user) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(SESSION_KEY);
    }
};

// --- Data Seeding ---
const seedInitialData = () => {
    if (db.users?.size === 0) {
        const initialUsers: User[] = [
            { id: 1, username: 'urwrldryan', password: 'BigBooger', role: 'owner' as UserRole },
            { id: 2, username: 'sample_user', password: 'password', role: 'user' as UserRole },
        ];
        initialUsers.forEach(user => {
            db.users!.set(user.id.toString(), user);
        });
        saveCollectionToStorage('users');
    }
};

seedInitialData();