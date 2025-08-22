import React, { useState, useEffect, useCallback } from 'react';
import { Tab, UploadItem, AlertMessage, User, AuditLogEntry, UserRole, ChatMessage } from './types.ts';
import * as api from './api.ts';
import MainTab from './components/MainTab.tsx';
import CommunityTab from './components/CommunityTab.tsx';
import AdminTab from './components/AdminTab.tsx';
import ChatTab from './components/ChatTab.tsx';
import ProfileTab from './components/ProfileTab.tsx';
import Tabs from './components/Tabs.tsx';
import Alert from './components/Alert.tsx';
import SyncStatusIndicator from './components/SyncStatusIndicator.tsx';
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuestBannerVisible, setIsGuestBannerVisible] = useState(true);
  
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const [isAppLoading, setIsAppLoading] = useState(true);

  const isGuestMode = !currentUser;

  const saveState = useCallback(async (key: string, data: any) => {
    setSyncStatus('syncing');
    try {
      await api.saveData(key, data, isGuestMode);
      setSyncStatus('saved');
    } catch (error) {
      console.error(`Failed to save to storage: ${key}`, error);
      setSyncStatus('error');
    }
  }, [isGuestMode]);

  // This effect runs once on mount to establish the user session and load all data.
  useEffect(() => {
    const initializeApp = async () => {
        setIsAppLoading(true);
        const user = await api.getInitialUser();
        setCurrentUser(user);
        
        const isGuest = !user;
        const initialUsers = [
            { id: 1, username: 'urwrldryan', password: 'BigBooger', role: 'owner' as UserRole },
            { id: 2, username: 'sample_user', password: 'password', role: 'user' as UserRole },
        ];

        const [uploadsData, usersData, auditLogData, chatMessagesData] = await Promise.all([
            api.fetchData<UploadItem[]>('uploads', isGuest, []),
            api.fetchData<User[]>('users', false, initialUsers),
            api.fetchData<AuditLogEntry[]>('auditLog', isGuest, []),
            api.fetchData<ChatMessage[]>('chatMessages', isGuest, []),
        ]);

        setUploads(uploadsData);
        setUsers(usersData.length > 0 ? usersData : initialUsers);
        setAuditLog(auditLogData);
        setChatMessages(chatMessagesData);
        
        setIsGuestBannerVisible(isGuest);
        setIsAppLoading(false);
    };
    initializeApp();
  }, []);
  
  // Reload all data when user logs in or out
  useEffect(() => {
    // Skip the initial load, which is handled by the effect above
    if (isAppLoading) return;

    const reloadDataForSession = async () => {
        setSyncStatus('syncing');
        const [uploadsData, usersData, auditLogData, chatMessagesData] = await Promise.all([
            api.fetchData('uploads', isGuestMode, []),
            api.fetchData('users', false, []),
            api.fetchData('auditLog', isGuestMode, []),
            api.fetchData('chatMessages', isGuestMode, []),
        ]);
        setUploads(uploadsData);
        setUsers(usersData);
        setAuditLog(auditLogData);
        setChatMessages(chatMessagesData);
        setIsGuestBannerVisible(isGuestMode);
        setSyncStatus('idle');
    };
    reloadDataForSession();
  }, [currentUser]);

  useEffect(() => {
    if (syncStatus === 'saved' || syncStatus === 'error') {
      const timer = setTimeout(() => setSyncStatus('idle'), 2500);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);
  
  useEffect(() => {
    // Don't sync until the app has loaded
    if(isAppLoading) return;
    api.syncUserSession(currentUser);
  }, [currentUser, isAppLoading]);


  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return;
      
      const reloadChangedData = async () => {
          if (e.key === 'chatMessages' && e.newValue) {
            setChatMessages(await api.fetchData('chatMessages', isGuestMode, []));
          }
          if (e.key === 'uploads' && e.newValue) {
            setUploads(await api.fetchData('uploads', isGuestMode, []));
          }
          if (e.key === 'users' && e.newValue) {
            setUsers(await api.fetchData('users', false, []));
          }
          if (e.key === 'auditLog' && e.newValue) {
            setAuditLog(await api.fetchData('auditLog', isGuestMode, []));
          }
      }
      reloadChangedData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isGuestMode]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const handleUpload = useCallback(async (url: string) => {
    if (!currentUser) {
        setAlert({ message: "You're submitting as a Guest. Your submission is shared, but you should log in to have it tied to your account.", type: 'info' });
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
      
      setCurrentUser(newUser);
      setAlert({ message: `Welcome, ${username}! Your account has been created.`, type: 'success' });
  }, [users, saveState]);
  
  const handleLogin = useCallback(async (username: string, password: string) => {
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
      if (user) {
          setCurrentUser(user);
          setAlert({ message: `Welcome back, ${user.username}!`, type: 'success' });
      } else {
          setAlert({ message: 'Invalid username or password.', type: 'error' });
      }
  }, [users]);
  
  const handleLogout = useCallback(async () => {
      setCurrentUser(null);
      setActiveTab('main');
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

  if (isAppLoading) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h1 className="text-2xl font-bold text-slate-100">Loading your space...</h1>
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
