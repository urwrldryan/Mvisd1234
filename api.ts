import { User } from './types.ts';

// MOCK API LAYER
// This layer simulates a persistent, shared backend using localStorage. This ensures
// that all data is synchronized for any user on the same browser, mimicking how a
// real-time, multi-user application would function with a central database.

const API_LATENCY = 400; // milliseconds

// All data is now stored in localStorage to simulate a persistent, shared backend.
// The isGuest parameter is kept for compatibility but is no longer used for storage selection.
const getStorage = (isGuest: boolean): Storage => localStorage;

const getFromStorage = <T,>(storage: Storage, key: string, defaultValue: T): T => {
  try {
    const item = storage.getItem(key);
    if (!item) return defaultValue;

    const data = JSON.parse(item);
    
    // Re-hydrate date objects from ISO strings
    if ((key === 'auditLog' || key === 'chatMessages') && Array.isArray(data)) {
      return data.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      })) as T;
    }
    
    return data;
  } catch (error) {
    console.warn(`Error reading storage key “${key}”:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(storage: Storage, key: string, data: T): void => {
    storage.setItem(key, JSON.stringify(data));
};

// Generic fetch function to retrieve data from the simulated backend.
export const fetchData = <T,>(key: string, isGuest: boolean, defaultValue: T): Promise<T> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const storage = getStorage(isGuest);
            resolve(getFromStorage(storage, key, defaultValue));
        }, API_LATENCY);
    });
};

// Generic save function to persist data to the simulated backend.
export const saveData = <T,>(key: string, data: T, isGuest: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const storage = getStorage(isGuest);
                saveToStorage(storage, key, data);
                resolve();
            } catch (error) {
                console.error(`Failed to save to storage: ${key}`, error);
                reject(error);
            }
        }, API_LATENCY);
    });
};

export const getInitialUser = (): Promise<User | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                // User session is always persistent in localStorage
                const localUserItem = localStorage.getItem('currentUser');
                if (localUserItem) {
                    resolve(JSON.parse(localUserItem));
                } else {
                    resolve(null);
                }
            } catch (error) {
                console.warn(`Error reading user from storage:`, error);
                resolve(null);
            }
        }, API_LATENCY / 2); // Faster user load
    });
};

export const syncUserSession = (user: User | null): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // User session is always stored in localStorage for persistence.
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
            } else {
                // On logout, clear the user from storage.
                localStorage.removeItem('currentUser');
            }
            // Clean up legacy items from previous storage strategy
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('rememberUser');
            resolve();
        }, 100);
    });
};
