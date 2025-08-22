import React, { useState, useEffect, useCallback } from 'react';
import { Tab, UploadItem, AlertMessage, User, AuditLogEntry, UserRole, ChatMessage } from './types.ts';
import * as firebaseService from './services/firebase.ts';
import { isFirebaseConfigValid } from './firebaseConfig.ts';
import { User as FirebaseUser } from 'firebase/auth';
import { orderBy } from 'firebase/firestore';
import MainTab from './components/MainTab.tsx';
import CommunityTab from './components/CommunityTab.tsx';
import AdminTab from './components/AdminTab.tsx';
import ChatTab from './components/ChatTab.tsx';
import ProfileTab from './components/ProfileTab.tsx';
import Tabs from './components/Tabs.tsx';
import Alert from './components/Alert.tsx';
import GuestModeBanner from './components/GuestModeBanner.tsx';

const BackgroundAnimation: React.FC = () => (
    <div className="background-shapes" aria-hidden="true">
        <div className="shape" style={{ left: '10%', width: '80px', height: '80px', animationDelay: '0s' }}></div>
        <div className="shape" style={{ left: '20%', width: '30px', height: '30px', animationDelay: '2s', animationDuration: '17s' }}></div>
        <div className="shape" style={{ left: '25%', width: '50px', height: '50px', animationDelay: '4s' }}></div>
        <div className="shape" style={{ left: '40%', width: '60px', height: '60px', animationDelay: '0s', animationDuration: '22s' }}></div>
        <div className="shape" style={{ left: '55%', width: '20px', height: '20px', animationDelay: '0s', animationDuration: '20s' }}></div>
        <div className="shape" style={{ left: '65%', width: '110px', height: '110px', animationDelay: '0s' }}></div>
        <div className="shape" style={{ left: '75%', width: '150px', height: '150px', animationDelay: '3s', animationDuration: '18s' }}></div>
        <div className="shape" style={{ left: '90%', width: '35px', height: '35px', animationDelay: '7s' }}></div>
    </div>
);

const ConnectionTimeoutError: React.FC = () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-lg ring-1 ring-yellow-500/50">
            <h1 className="text-2xl font-bold text-yellow-400">Connection Timed Out</h1>
            <p className="text-slate-300 mt-4">
                The application could not connect to the Firebase backend.
            </p>
            <div className="text-left text-slate-400 mt-4 space-y-2">
                <p>Please check the following:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Your internet connection is stable.</li>
                    <li>
                        In your <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Firebase Console</a>, ensure that <strong>Cloud Firestore</strong> is enabled for the project <code className="bg-gray-700 p-1 rounded text-sm text-yellow-300">mvisd1234</code>.
                    </li>
                    <li>
                        Your Firestore security rules allow read/write access.
                    </li>
                </ul>
            </div>
             <p className="text-slate-500 mt-6 text-sm">
                If you've just created the database, please wait a few minutes and then refresh the page.
            </p>
        </div>
    </div>
);

const App: React.FC = () => {
    if (!isFirebaseConfigValid()) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-lg ring-1 ring-red-500/50">
                    <h1 className="text-2xl font-bold text-red-400">Firebase Configuration Missing</h1>
                    <p className="text-slate-300 mt-4">
                        This application requires a connection to a Firebase project to function.
                    </p>
                    <p className="text-slate-400 mt-2">
                        Please open the <code className="bg-gray-700 p-1 rounded text-sm text-yellow-300">firebaseConfig.ts</code> file and replace the placeholder values with your project's configuration from the Firebase Console.
                    </p>
                     <p className="text-slate-500 mt-6 text-sm">
                        After updating the configuration, please refresh the page.
                    </p>
                </div>
            </div>
        );
    }
  
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuestBannerVisible, setIsGuestBannerVisible] = useState(true);
  
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [isAppLoading, setIsAppLoading] = useState(true);
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);

  const isGuestMode = !currentUser;

  useEffect(() => {
    const unsubAuth = firebaseService.onAuthUserChanged(async (user) => {
      setAuthUser(user);
      if (user) {
        const userProfile = await firebaseService.getUserProfile(user.uid);
        setCurrentUser(userProfile);
        setIsGuestBannerVisible(false);
      } else {
        setCurrentUser(null);
        setIsGuestBannerVisible(true);
      }
      setIsAppLoading(false);
    });

    const unsubUploads = firebaseService.onSnapshot<UploadItem>('uploads', setUploads, orderBy('timestamp', 'desc'));
    const unsubUsers = firebaseService.onSnapshot<User>('users', setUsers);
    const unsubAuditLog = firebaseService.onSnapshot<AuditLogEntry>('auditLog', setAuditLog, orderBy('timestamp', 'desc'));
    const unsubChat = firebaseService.onSnapshot<ChatMessage>('chatMessages', setChatMessages, orderBy('timestamp', 'asc'));

    const connectionTimer = setTimeout(() => {
        setConnectionTimedOut(true);
    }, 12000);

    return () => {
      unsubAuth();
      unsubUploads();
      unsubUsers();
      unsubAuditLog();
      unsubChat();
      clearTimeout(connectionTimer);
    };
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleUpload = useCallback(async (url: string) => {
    if (!currentUser && !isGuestMode) return;
    const submitter = currentUser?.username || 'Guest';
    const newUpload = {
      title: url.replace(/^https?:\/\//, '').split('/')[0] || url,
      url: url,
      status: 'pending' as const,
      description: 'A new user submission.',
      submittedBy: submitter,
      timestamp: new Date(), // This will be replaced by a server timestamp
    };
    await firebaseService.addDoc('uploads', newUpload);
    
    setAlert({ message: currentUser ? 'Upload successful! Pending approval.' : "Guest submission successful! Pending approval.", type: 'success' });
    setActiveTab('community');
  }, [currentUser, isGuestMode]);

  const handleApprove = useCallback(async (id: string) => {
    if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) return;
    const approvedItem = uploads.find(item => item.id === id);
    if (!approvedItem) return;
    await firebaseService.updateDoc('uploads', id, { status: 'approved' });
    const newLogEntry = { adminUsername: currentUser.username, action: 'approved' as const, uploadId: id, uploadTitle: approvedItem.title, timestamp: new Date() };
    await firebaseService.addDoc('auditLog', newLogEntry);
    setAlert({ message: `Submission has been approved.`, type: 'info' });
  }, [currentUser, uploads]);

  const handleReject = useCallback(async (id: string) => {
    if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) return;
    const rejectedItem = uploads.find(item => item.id === id);
    if (!rejectedItem) return;
    await firebaseService.deleteDoc('uploads', id);
    const newLogEntry = { adminUsername: currentUser.username, action: 'rejected' as const, uploadId: id, uploadTitle: rejectedItem.title, timestamp: new Date() };
    await firebaseService.addDoc('auditLog', newLogEntry);
    setAlert({ message: `Submission has been rejected.`, type: 'info' });
  }, [currentUser, uploads]);
  
  const handleRemove = useCallback(async (id: string) => {
    if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) return;
    await firebaseService.deleteDoc('uploads', id);
    setAlert({ message: `Post has been removed.`, type: 'info' });
  }, [currentUser]);

  const handleRegister = useCallback(async (email: string, password: string, username: string) => {
    try {
      const existingUser = await firebaseService.findUserByUsername(username);
      if (existingUser) {
        setAlert({ message: 'Username already exists.', type: 'error' });
        return;
      }
      const userCredential = await firebaseService.registerWithEmail(email, password);
      const role: UserRole = email.toLowerCase() === 'owner@example.com' ? 'owner' : 'user';
      await firebaseService.createUserProfile(userCredential.user.uid, { username, email, role });
      setAlert({ message: `Welcome, ${username}! Your account has been created.`, type: 'success' });
    } catch (error: any) {
      setAlert({ message: error.message, type: 'error' });
    }
  }, []);
  
  const handleLogin = useCallback(async (email: string, password: string) => {
    try {
      const userCredential = await firebaseService.loginWithEmail(email, password);
      const userProfile = await firebaseService.getUserProfile(userCredential.user.uid);
      setAlert({ message: `Welcome back, ${userProfile?.username}!`, type: 'success' });
    } catch (error: any) {
      setAlert({ message: 'Invalid email or password.', type: 'error' });
    }
  }, []);
  
  const handleLogout = useCallback(async () => {
    await firebaseService.logout();
    setActiveTab('main');
    setAlert({ message: 'You have been logged out.', type: 'info' });
  }, []);
  
  const handleSendMessage = useCallback(async (text: string) => {
    const username = currentUser?.username || 'Guest';
    const newMessage = { username, text, timestamp: new Date() }; // Timestamp is a placeholder
    await firebaseService.addDoc('chatMessages', newMessage);
  }, [currentUser]);

  const handleChangeUsername = useCallback(async (newUsername: string) => {
    if (!currentUser) return false;
    const existingUser = await firebaseService.findUserByUsername(newUsername);
    if (existingUser && existingUser.id !== currentUser.id) {
        setAlert({ message: 'This username is already taken.', type: 'error' });
        return false;
    }
    await firebaseService.updateDoc('users', currentUser.id, { username: newUsername });
    setAlert({ message: `Your username has been updated to ${newUsername}.`, type: 'success' });
    return true;
  }, [currentUser]);

  const handleChangePassword = useCallback(async (newPassword: string) => {
    if (!authUser) return false;
    try {
      await firebaseService.changePassword(newPassword);
      setAlert({ message: 'Your password has been changed successfully.', type: 'success' });
      return true;
    } catch (error: any) {
      setAlert({ message: `Password change failed: ${error.message}. You may need to log out and log back in.`, type: 'error' });
      return false;
    }
  }, [authUser]);

  const handleUpdateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
    if (currentUser?.role !== 'owner') return setAlert({ message: 'Only the owner can change roles.', type: 'error' });
    if (currentUser.id === userId) return setAlert({ message: 'You cannot change your own role.', type: 'error' });
    await firebaseService.updateDoc('users', userId, { role: newRole });
    setAlert({ message: 'User role updated.', type: 'success' });
  }, [currentUser]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!currentUser || !['owner', 'co-owner'].includes(currentUser.role)) return setAlert({ message: 'You do not have permission.', type: 'error' });
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;
    if (userToDelete.role === 'owner') return setAlert({ message: 'Cannot delete an owner account.', type: 'error' });
    if (currentUser.role === 'co-owner' && userToDelete.role === 'co-owner') return setAlert({ message: 'Co-owners cannot delete other co-owners.', type: 'error' });

    // Note: In a real app, deleting a user account and their associated content
    // should be handled by a Cloud Function for security and data integrity.
    await firebaseService.deleteDoc('users', userId);
    setAlert({ message: `User "${userToDelete.username}" has been deleted.`, type: 'success' });
  }, [currentUser, users]);

  useEffect(() => {
    setIsGuestBannerVisible(isGuestMode);
  }, [isGuestMode]);

  if (isAppLoading && connectionTimedOut) {
    return <ConnectionTimeoutError />;
  }

  if (isAppLoading) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h1 className="text-2xl font-bold text-slate-100">Connecting to Firebase...</h1>
                <p className="text-slate-400 mt-2">Please wait a moment.</p>
            </div>
        </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-900 text-slate-200 font-sans relative isolate overflow-hidden ${isGuestMode && isGuestBannerVisible ? 'pt-16' : ''}`}>
      <BackgroundAnimation />
      {isGuestMode && isGuestBannerVisible && <GuestModeBanner onDismiss={() => setIsGuestBannerVisible(false)} onLoginClick={() => setActiveTab('main')} />}
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl relative z-10">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-50 tracking-tight">mvisd link finders</h1>
          </div>
          <p className="text-slate-400 mt-2 text-lg">Upload, share, and moderate community content with ease.</p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-lg ring-1 ring-white/10">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />
          <div className="p-6 sm:p-8">
            {activeTab === 'main' && <MainTab currentUser={currentUser} onRegister={handleRegister} onLogin={handleLogin} onUpload={handleUpload} setAlert={setAlert} />}
            {activeTab === 'community' && <CommunityTab uploads={uploads} currentUser={currentUser} setActiveTab={setActiveTab} onRemove={handleRemove} />}
            {activeTab === 'chat' && <ChatTab messages={chatMessages} currentUser={currentUser} onSendMessage={handleSendMessage} setActiveTab={setActiveTab} />}
            {activeTab === 'profile' && currentUser && <ProfileTab currentUser={currentUser} onLogout={handleLogout} onChangeUsername={handleChangeUsername} onChangePassword={handleChangePassword} setAlert={setAlert} />}
            {activeTab === 'admin' && <AdminTab uploads={uploads} onApprove={handleApprove} onReject={handleReject} currentUser={currentUser} allUsers={users} onUpdateUserRole={handleUpdateUserRole} onDeleteUser={handleDeleteUser} auditLog={auditLog} />}
          </div>
        </main>

        <footer className="text-center mt-12 text-slate-400">
          <p>&copy; {new Date().getFullYear()} mvisd link finders. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;