import React, { useState, useEffect, useCallback } from 'react';
import { Tab, UploadItem, AlertMessage, User, AuditLogEntry, UserRole, ChatMessage } from './types.ts';
import * as firebaseService from './services/firebase.ts';
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [alert, setAlert] = useState<AlertMessage | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuestBannerVisible, setIsGuestBannerVisible] = useState(true);
  
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [isAppLoading, setIsAppLoading] = useState(true);

  const isGuestMode = !currentUser;

  // Set up real-time listeners for all data collections on component mount.
  useEffect(() => {
    const user = firebaseService.getCurrentUser();
    setCurrentUser(user);
    setIsGuestBannerVisible(!user);
    
    // The unsubscribe functions returned by onSnapshot will be called on cleanup.
    const unsubUploads = firebaseService.onSnapshot('uploads', (data: UploadItem[]) => setUploads(data.sort((a, b) => b.id - a.id)));
    const unsubUsers = firebaseService.onSnapshot('users', (data: User[]) => setUsers(data));
    const unsubAuditLog = firebaseService.onSnapshot('auditLog', (data: AuditLogEntry[]) => setAuditLog(data.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())));
    const unsubChat = firebaseService.onSnapshot('chatMessages', (data: ChatMessage[]) => setChatMessages(data.sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime())));

    setIsAppLoading(false);

    // Cleanup listeners on unmount to prevent memory leaks.
    return () => {
      unsubUploads();
      unsubUsers();
      unsubAuditLog();
      unsubChat();
    };
  }, []);

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
    const newUpload: Omit<UploadItem, 'id'> = {
      title: url.replace(/^https?:\/\//, '').split('/')[0] || url,
      url: url,
      status: 'pending',
      description: 'A new user submission.',
      submittedBy: submitter
    };
    await firebaseService.addDoc('uploads', newUpload);
    
    if (currentUser) {
      setAlert({ message: 'Upload successful! Your submission is pending approval.', type: 'success' });
    }
    setActiveTab('community');
  }, [currentUser]);

  const handleApprove = useCallback(async (id: number) => {
    if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) return;
    
    const approvedItem = uploads.find(item => item.id === id);
    if (!approvedItem) return;

    await firebaseService.updateDoc('uploads', id, { status: 'approved' });
    
    const newLogEntry: Omit<AuditLogEntry, 'id'> = { adminUsername: currentUser.username, action: 'approved', uploadId: id, uploadTitle: approvedItem.title, timestamp: new Date() };
    await firebaseService.addDoc('auditLog', newLogEntry);

    setAlert({ message: `Submission #${id} has been approved.`, type: 'info' });
  }, [currentUser, uploads]);

  const handleReject = useCallback(async (id: number) => {
    if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) return;
    
    const rejectedItem = uploads.find(item => item.id === id);
    if (!rejectedItem) return;
    
    await firebaseService.deleteDoc('uploads', id);

    const newLogEntry: Omit<AuditLogEntry, 'id'> = { adminUsername: currentUser.username, action: 'rejected', uploadId: id, uploadTitle: rejectedItem.title, timestamp: new Date() };
    await firebaseService.addDoc('auditLog', newLogEntry);

    setAlert({ message: `Submission #${id} has been rejected and removed.`, type: 'info' });
  }, [currentUser, uploads]);
  
  const handleRemove = useCallback(async (id: number) => {
    if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) return;
    await firebaseService.deleteDoc('uploads', id);
    setAlert({ message: `Post #${id} has been removed.`, type: 'info' });
  }, [currentUser]);

  const handleRegister = useCallback(async (username: string, password: string) => {
      const existingUser = await firebaseService.findUserByUsername(username);
      if (existingUser) {
          setAlert({ message: 'Username already exists.', type: 'error' });
          return;
      }
      
      const role: UserRole = username.toLowerCase() === 'urwrldryan' ? 'owner' : 'user';
      const newUser: Omit<User, 'id'> = { username, password, role };
      const createdUser = await firebaseService.addDoc('users', newUser) as User;
      
      firebaseService.setCurrentUser(createdUser);
      setCurrentUser(createdUser);
      setAlert({ message: `Welcome, ${username}! Your account has been created.`, type: 'success' });
  }, []);
  
  const handleLogin = useCallback(async (username: string, password: string) => {
      const user = await firebaseService.findUserByUsername(username);
      if (user && user.password === password) {
          firebaseService.setCurrentUser(user);
          setCurrentUser(user);
          setAlert({ message: `Welcome back, ${user.username}!`, type: 'success' });
      } else {
          setAlert({ message: 'Invalid username or password.', type: 'error' });
      }
  }, []);
  
  const handleLogout = useCallback(async () => {
      firebaseService.setCurrentUser(null);
      setCurrentUser(null);
      setActiveTab('main');
      setAlert({ message: 'You have been logged out.', type: 'info' });
  }, []);
  
  const handleSendMessage = useCallback(async (text: string) => {
    const username = currentUser?.username || 'Guest';
    const newMessage: Omit<ChatMessage, 'id'> = { username: username, text, timestamp: new Date() };
    await firebaseService.addDoc('chatMessages', newMessage);
  }, [currentUser]);

  const handleChangeUsername = useCallback(async (newUsername: string) => {
    if (!currentUser) return false;
    const existingUser = await firebaseService.findUserByUsername(newUsername);
    if (existingUser && existingUser.id !== currentUser.id) {
        setAlert({ message: 'This username is already taken.', type: 'error' });
        return false;
    }
    const oldUsername = currentUser.username;
    
    // Update the user document
    await firebaseService.updateDoc('users', currentUser.id, { username: newUsername });

    // In a real app, this would be a cloud function. Here we simulate cascading updates.
    const updatePromises: Promise<void>[] = [];
    uploads.filter(u => u.submittedBy === oldUsername).forEach(u => updatePromises.push(firebaseService.updateDoc('uploads', u.id, { submittedBy: newUsername })));
    chatMessages.filter(m => m.username === oldUsername).forEach(m => updatePromises.push(firebaseService.updateDoc('chatMessages', m.id, { username: newUsername })));
    auditLog.filter(l => l.adminUsername === oldUsername).forEach(l => updatePromises.push(firebaseService.updateDoc('auditLog', l.id, { adminUsername: newUsername })));
    await Promise.all(updatePromises);

    const updatedUser = { ...currentUser, username: newUsername };
    firebaseService.setCurrentUser(updatedUser);
    setCurrentUser(updatedUser);
    
    setAlert({ message: `Your username has been updated to ${newUsername}.`, type: 'success' });
    return true;
  }, [currentUser, users, uploads, chatMessages, auditLog]);

  const handleChangePassword = useCallback(async (newPassword: string) => {
    if (!currentUser) return false;
    
    await firebaseService.updateDoc('users', currentUser.id, { password: newPassword });

    const updatedUser = { ...currentUser, password: newPassword };
    firebaseService.setCurrentUser(updatedUser);
    setCurrentUser(updatedUser);
    setAlert({ message: 'Your password has been changed successfully.', type: 'success' });
    return true;
  }, [currentUser, users]);

  const handleUpdateUserRole = useCallback(async (userId: number, newRole: UserRole) => {
    if (currentUser?.role !== 'owner') {
        setAlert({ message: 'Only the owner can change user roles.', type: 'error' });
        return;
    }
    if (currentUser.id === userId) {
        setAlert({ message: 'You cannot change your own role.', type: 'error' });
        return;
    }
    await firebaseService.updateDoc('users', userId, { role: newRole });
    setAlert({ message: 'User role has been updated.', type: 'success' });
  }, [currentUser]);

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

      await firebaseService.deleteDoc('users', userId);
      setAlert({ message: `User "${userToDelete.username}" has been deleted.`, type: 'success' });
  }, [currentUser, users]);

  useEffect(() => {
    setIsGuestBannerVisible(isGuestMode);
  }, [isGuestMode]);

  if (isAppLoading) {
    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h1 className="text-2xl font-bold text-slate-100">Connecting to the cloud...</h1>
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
