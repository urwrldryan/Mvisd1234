import React, { useState, useEffect, useCallback } from 'react';
import { Tab, UploadItem, AlertMessage, User, AuditLogEntry, UserRole, ChatMessage } from './types.ts';
import MainTab from './components/MainTab.tsx';
import CommunityTab from './components/CommunityTab.tsx';
import AdminTab from './components/AdminTab.tsx';
import ChatTab from './components/ChatTab.tsx';
import ProfileTab from './components/ProfileTab.tsx';
import Tabs from './components/Tabs.tsx';
import Alert from './components/Alert.tsx';
import SyncStatusIndicator from './components/SyncStatusIndicator.tsx';
import GuestModeBanner from './components/GuestModeBanner.tsx';

const getFromStorage = <T,>(storage: Storage, key: string, defaultValue: T): T => {
  try {
    const item = storage.getItem(key);
    if (!item) return defaultValue;

    const data = JSON.parse(item);
    
    if ((key === 'auditLog' || key === 'chatMessages') && Array.isArray(data)) {
      return data.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      })) as T;
    }
    
    return data;
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const getInitialUser = (): User | null => {
    try {
        const localUserItem = localStorage.getItem('currentUser');
        if (localUserItem) return JSON.parse(localUserItem);
        
        const sessionUserItem = sessionStorage.getItem('currentUser');
        if (sessionUserItem) return JSON.parse(sessionUserItem);

        return null;
    } catch (error) {
        console.warn(`Error reading user from storage:`, error);
        return null;
    }
};


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


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(getInitialUser);
  const [isGuestBannerVisible, setIsGuestBannerVisible] = useState(true);

  const isGuestMode = !currentUser;
  const dataStorage = isGuestMode ? sessionStorage : localStorage;

  const [uploads, setUploads] = useState<UploadItem[]>(() => getFromStorage(dataStorage, 'uploads', []));
  const [users, setUsers] = useState<User[]>(() => getFromStorage(localStorage, 'users', [
    { id: 1, username: 'urwrldryan', password: 'BigBooger', role: 'owner' },
    { id: 2, username: 'sample_user', password: 'password', role: 'user' },
  ]));
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => getFromStorage(dataStorage, 'auditLog', []));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => getFromStorage(dataStorage, 'chatMessages', []));
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');

  const saveState = useCallback(async (key: string, data: any) => {
    // User data is always persistent, other data depends on login state.
    const storage = key === 'users' ? localStorage : dataStorage;
    setSyncStatus('syncing');
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network latency
    try {
      storage.setItem(key, JSON.stringify(data));
      setSyncStatus('saved');
    } catch (error) {
      console.error(`Failed to save to storage: ${key}`, error);
      setSyncStatus('error');
    }
  }, [dataStorage]);

  const removeState = useCallback(async (key: string) => {
    const storage = dataStorage;
    setSyncStatus('syncing');
    await new Promise(resolve => setTimeout(resolve, 400));
    try {
      storage.removeItem(key);
      setSyncStatus('saved');
    } catch (error) {
      console.error(`Failed to remove from storage: ${key}`, error);
      setSyncStatus('error');
    }
  }, [dataStorage]);
  
  // Reload data from appropriate storage on login/logout
  useEffect(() => {
    const newStorage = !currentUser ? sessionStorage : localStorage;
    setUploads(getFromStorage(newStorage, 'uploads', []));
    setChatMessages(getFromStorage(newStorage, 'chatMessages', []));
    setAuditLog(getFromStorage(newStorage, 'auditLog', []));
    
    // Users are always loaded from localStorage, but we can re-fetch to be safe
    setUsers(getFromStorage(localStorage, 'users', []));

    if (currentUser) {
        setIsGuestBannerVisible(false);
    } else {
        setIsGuestBannerVisible(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (syncStatus === 'saved' || syncStatus === 'error') {
      const timer = setTimeout(() => setSyncStatus('idle'), 2500);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);
  
  useEffect(() => {
    const syncUserSession = async () => {
      if (currentUser) {
        const remember = localStorage.getItem('rememberUser') === 'true';
        if (remember) {
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          sessionStorage.removeItem('currentUser');
        } else {
          sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
          localStorage.removeItem('currentUser');
        }
      } else {
        // On logout
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');
      }
    };
    syncUserSession();
  }, [currentUser]);


  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only listen to localStorage changes for cross-tab sync (sessionStorage doesn't fire this event)
      if (e.storageArea !== localStorage) return;
      
      if (e.key === 'chatMessages' && e.newValue) {
        setChatMessages(getFromStorage(localStorage, 'chatMessages', []));
      }
      if (e.key === 'uploads' && e.newValue) {
        setUploads(getFromStorage(localStorage, 'uploads', []));
      }
      if (e.key === 'users' && e.newValue) {
        setUsers(getFromStorage(localStorage, 'users', []));
      }
      if (e.key === 'auditLog' && e.newValue) {
        setAuditLog(getFromStorage(localStorage, 'auditLog', []));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleUpload = useCallback(async (url: string) => {
    if (!currentUser) {
        setAlert({ message: 'Login to save submissions permanently. This link will be lost when you close the tab.', type: 'info' });
    }
    const submitter = currentUser?.username || 'Guest';
    const newUpload: UploadItem = {
      id: Date.now(),
      title: url.replace(/^https?:\/\//, '').split('/')[0] || url,
      url: url,
      status: 'pending',
      description: 'A new user submission.',
      submittedBy: submitter
    };
    const updatedUploads = [newUpload, ...uploads];
    setUploads(updatedUploads);
    await saveState('uploads', updatedUploads);
    
    if (currentUser) {
      setAlert({ message: 'Upload successful! Your submission is pending approval.', type: 'success' });
    }
    setActiveTab('community');
  }, [currentUser, uploads, saveState]);

  const handleApprove = useCallback(async (id: number) => {
    if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) return;
    let approvedItem: UploadItem | undefined;
    
    const updatedUploads = uploads.map(item => {
      if (item.id === id) {
        approvedItem = { ...item, status: 'approved' };
        return approvedItem;
      }
      return item;
    });
    setUploads(updatedUploads);
    await saveState('uploads', updatedUploads);
    
    if (approvedItem) {
      const newLogEntry = { adminUsername: currentUser.username, action: 'approved' as const, uploadId: id, uploadTitle: approvedItem!.title, timestamp: new Date() };
      const updatedLog = [newLogEntry, ...auditLog];
      setAuditLog(updatedLog);
      await saveState('auditLog', updatedLog);
    }
    setAlert({ message: `Submission #${id} has been approved.`, type: 'info' });
  }, [currentUser, uploads, auditLog, saveState]);

  const handleReject = useCallback(async (id: number) => {
    if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) return;
    const rejectedItem = uploads.find(item => item.id === id);

    const updatedUploads = uploads.filter(item => item.id !== id);
    setUploads(updatedUploads);
    await saveState('uploads', updatedUploads);

    if (rejectedItem) {
      const newLogEntry = { adminUsername: currentUser.username, action: 'rejected' as const, uploadId: id, uploadTitle: rejectedItem.title, timestamp: new Date() };
      const updatedLog = [newLogEntry, ...auditLog];
      setAuditLog(updatedLog);
      await saveState('auditLog', updatedLog);
    }
    setAlert({ message: `Submission #${id} has been rejected and removed.`, type: 'info' });
  }, [uploads, currentUser, auditLog, saveState]);
  
  const handleRemove = useCallback(async (id: number) => {
    if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) return;
    const updatedUploads = uploads.filter(item => item.id !== id);
    setUploads(updatedUploads);
    await saveState('uploads', updatedUploads);
    setAlert({ message: `Post #${id} has been removed.`, type: 'info' });
  }, [currentUser, uploads, saveState]);

  const handleRegister = useCallback(async (username: string, password: string) => {
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
          setAlert({ message: 'Username already exists.', type: 'error' });
          return;
      }
      
      const role: UserRole = username.toLowerCase() === 'urwrldryan' ? 'owner' : 'user';

      const newUser: User = { id: Date.now(), username, password, role };
      
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      await saveState('users', updatedUsers);
      
      localStorage.removeItem('rememberUser');
      setCurrentUser(newUser);
      setAlert({ message: `Welcome, ${username}! Your account has been created.`, type: 'success' });
  }, [users, saveState]);
  
  const handleLogin = useCallback(async (username: string, password: string, rememberMe: boolean) => {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) {
          if (rememberMe) {
            localStorage.setItem('rememberUser', 'true');
          } else {
            localStorage.removeItem('rememberUser');
          }
          setCurrentUser(user);
          setAlert({ message: `Welcome back, ${user.username}!`, type: 'success' });
      } else {
          setAlert({ message: 'Invalid username or password.', type: 'error' });
      }
  }, [users]);
  
  const handleLogout = useCallback(async () => {
      setCurrentUser(null);
      setActiveTab('main');
      localStorage.removeItem('rememberUser');
      setAlert({ message: 'You have been logged out.', type: 'info' });
  }, []);
  
  const handleSendMessage = useCallback(async (text: string) => {
    const username = currentUser?.username || 'Guest';
    const newMessage: ChatMessage = { id: Date.now(), username: username, text, timestamp: new Date() };
    
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    await saveState('chatMessages', updatedMessages);
  }, [currentUser, chatMessages, saveState]);

  const handleChangeUsername = useCallback(async (newUsername: string) => {
    if (!currentUser) return false;
    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase() && u.id !== currentUser.id)) {
        setAlert({ message: 'This username is already taken.', type: 'error' });
        return false;
    }
    const oldUsername = currentUser.username;
    
    const updatedUser = { ...currentUser, username: newUsername };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    const updatedUploads = uploads.map(u => u.submittedBy === oldUsername ? { ...u, submittedBy: newUsername } : u);
    const updatedChatMessages = chatMessages.map(m => m.username === oldUsername ? { ...m, username: newUsername } : m);
    const updatedAuditLog = auditLog.map(l => l.adminUsername === oldUsername ? { ...l, adminUsername: newUsername } : l);

    await Promise.all([
        saveState('users', updatedUsers),
        saveState('uploads', updatedUploads),
        saveState('chatMessages', updatedChatMessages),
        saveState('auditLog', updatedAuditLog),
    ]);

    setUsers(updatedUsers);
    setUploads(updatedUploads);
    setChatMessages(updatedChatMessages);
    setAuditLog(updatedAuditLog);
    setCurrentUser(updatedUser);
    
    setAlert({ message: `Your username has been updated to ${newUsername}.`, type: 'success' });
    return true;
  }, [currentUser, users, uploads, chatMessages, auditLog, saveState]);

  const handleChangePassword = useCallback(async (newPassword: string) => {
    if (!currentUser) return false;
    
    const updatedUser = { ...currentUser, password: newPassword };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    await saveState('users', updatedUsers);

    setCurrentUser(updatedUser);
    setAlert({ message: 'Your password has been changed successfully.', type: 'success' });
    return true;
  }, [currentUser, users, saveState]);

  const handleUpdateUserRole = useCallback(async (userId: number, newRole: UserRole) => {
    if (currentUser?.role !== 'owner') {
        setAlert({ message: 'Only the owner can change user roles.', type: 'error' });
        return;
    }
    if (currentUser.id === userId) {
        setAlert({ message: 'You cannot change your own role.', type: 'error' });
        return;
    }
    const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updatedUsers);
    await saveState('users', updatedUsers);
    setAlert({ message: 'User role has been updated.', type: 'success' });
  }, [currentUser, users, saveState]);

  const handleDeleteUser = useCallback(async (userId: number) => {
      if (!currentUser || !['owner', 'co-owner'].includes(currentUser.role)) {
          setAlert({ message: 'You do not have permission to delete users.', type: 'error' });
          return;
      }
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) return;

      if (userToDelete.role === 'owner') {
          setAlert({ message: 'Cannot delete an owner account.', type: 'error' });
          return;
      }
      if (currentUser.role === 'co-owner' && userToDelete.role === 'co-owner') {
          setAlert({ message: 'Co-owners cannot delete other co-owners.', type: 'error' });
          return;
      }

      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      await saveState('users', updatedUsers);
      setAlert({ message: `User "${userToDelete.username}" has been deleted.`, type: 'success' });
  }, [currentUser, users, saveState]);

  return (
    <div className={`min-h-screen bg-gray-900 text-slate-200 font-sans relative isolate overflow-hidden ${isGuestMode && isGuestBannerVisible ? 'pt-16' : ''}`}>
      <BackgroundAnimation />
      {isGuestMode && isGuestBannerVisible && <GuestModeBanner onDismiss={() => setIsGuestBannerVisible(false)} onLoginClick={() => setActiveTab('main')} />}
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="container mx-auto p-4 sm:p-6 md:p-8 max-w-5xl relative z-10">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-50 tracking-tight">mvisd link finders</h1>
            <SyncStatusIndicator status={syncStatus} />
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