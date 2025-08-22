import React, { useState } from 'react';
import { AlertMessage, User } from '../types.ts';

const UploadIcon: React.FC<{className: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3.75 12h16.5c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H3.75c-.621 0-1.125.504-1.125 1.125v4.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);

const UploadForm: React.FC<{
  onUpload: (url: string) => void;
  setAlert: (alert: AlertMessage | null) => void;
  username: string;
}> = ({ onUpload, setAlert, username }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
        setAlert({ message: 'Please enter a URL.', type: 'error' });
        return;
    }
    
    let processedUrl = url.trim();
    if (processedUrl && !/^https?:\/\//i.test(processedUrl)) {
      processedUrl = `https://${processedUrl}`;
    }

    setIsLoading(true);
    setTimeout(() => {
        onUpload(processedUrl);
        setUrl('');
        setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Welcome, {username}!</h2>
        <p className="mt-2 text-slate-400">Share a valuable resource with the community. Your submission will be reviewed by an admin.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-1">
            Link to Submit
          </label>
          <input
            id="url" type="text" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com/resource"
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-slate-100 placeholder:text-slate-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            required
          />
        </div>
        <button
            type="submit" disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 px-4 py-3 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400/50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
        >
            {isLoading ? (
                <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Submitting...</>
            ) : (
                <><UploadIcon className="w-5 h-5"/>Submit for Review</>
            )}
        </button>
      </form>
    </div>
  );
};

const AuthForm: React.FC<{
    onRegister: (email: string, password: string, username: string) => void;
    onLogin: (email: string, password: string) => void;
    setAlert: (alert: AlertMessage | null) => void;
}> = ({ onRegister, onLogin, setAlert }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setAlert({ message: 'Email and password cannot be empty.', type: 'error' });
            return;
        }
        if (isLogin) {
            onLogin(email, password);
        } else {
            if(!username.trim()) {
                setAlert({ message: 'Username cannot be empty.', type: 'error' });
                return;
            }
            if (password !== confirmPassword) {
                setAlert({ message: 'Passwords do not match.', type: 'error' });
                return;
            }
            if (password.length < 6) {
                setAlert({ message: 'Password must be at least 6 characters.', type: 'error' });
                return;
            }
            onRegister(email, password, username);
        }
    };

    return (
        <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-center text-slate-100">{isLogin ? 'User Login' : 'Create Account'}</h2>
            <p className="mt-2 text-center text-slate-400">{isLogin ? 'Log in to submit links, chat, and manage your profile.' : 'Join the community to get started.'}</p>
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                {!isLogin && (
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                        <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                )}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                    <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                {!isLogin && (
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
                        <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                )}
                <button type="submit" className="w-full px-4 py-3 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    {isLogin ? 'Login' : 'Register'}
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-400">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-indigo-400 hover:text-indigo-300">
                    {isLogin ? 'Register here' : 'Login here'}
                </button>
            </p>
        </div>
    );
};

interface MainTabProps {
  currentUser: User | null;
  onRegister: (email: string, password: string, username: string) => void;
  onLogin: (email: string, password: string) => void;
  onUpload: (url: string) => void;
  setAlert: (alert: AlertMessage | null) => void;
}

const MainTab: React.FC<MainTabProps> = ({ currentUser, onRegister, onLogin, onUpload, setAlert }) => {
  if (currentUser) {
    return <UploadForm onUpload={onUpload} setAlert={setAlert} username={currentUser.username} />;
  }
  return <AuthForm onRegister={onRegister} onLogin={onLogin} setAlert={setAlert} />;
};

export default MainTab;