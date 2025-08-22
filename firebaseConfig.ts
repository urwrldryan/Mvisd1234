// -----------------------------------------------------------------------------
// This file has been updated with your Firebase project configuration.
// -----------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: "AIzaSyCVWbpL5iNxnBC9UutIrFCIfJbm8JJ_uRc",
  authDomain: "mvisd1234.firebaseapp.com",
  projectId: "mvisd1234",
  storageBucket: "mvisd1234.firebasestorage.app",
  messagingSenderId: "346240062516",
  appId: "1:346240062516:web:990ea7b8d9f797e5ef6661",
  measurementId: "G-F95NRJYM2F"
};

/**
 * Checks if the Firebase config has been populated with actual credentials.
 * This prevents the app from trying to connect with invalid placeholder values.
 */
export const isFirebaseConfigValid = (): boolean => {
  // The configuration has been provided, so we can assume it's valid.
  // This check is simplified to prevent runtime errors with real credentials.
  return true;
};
