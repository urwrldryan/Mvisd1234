import React, { useState } from 'react';
import { User, AlertMessage } from '../types.ts';

interface ProfileTabProps {
  currentUser: User;
  onLogout: () => void;
  onChangeUsername: (newUsername: string) => Promise<boolean>;
  onChangePassword: (newPassword: string) => Promise<boolean>;
  setAlert: (alert: AlertMessage | null) => void;
}

const ProfileTab: React.FC<ProfileTabProps> = ({ currentUser, onLogout, onChangeUsername, onChangePassword, setAlert }) => {
  const [newUsername, setNewUsername] = useState(currentUser.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUsernameChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim() === currentUser.username) {
        setAlert({ message: 'This is already your username.', type: 'info' });
        return;
    }
    if (newUsername.trim().length < 3) {
        setAlert({ message: 'Username must be at least 3 characters.', type: 'error' });
        return;
    }
    await onChangeUsername(newUsername.trim());
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      setAlert({ message: 'Password must be at least 4 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ message: 'Passwords do not match.', type: 'error' });
      return;
    }
    const success = await onChangePassword(newPassword);
    if(success) {
        setNewPassword('');
        setConfirmPassword('');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-1">Your Profile</h2>
        <p className="text-slate-400">Manage your account settings and preferences.</p>
      </div>
      
      <form onSubmit={handleUsernameChange} className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-200">Change Username</h3>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Username
        </button>
      </form>
      
      <form onSubmit={handlePasswordChange} className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-200">Change Password</h3>
        <div>
          <label htmlFor="new-password"className="block text-sm font-medium text-slate-300 mb-1">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-slate-100 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Save Password
        </button>
      </form>

      <div className="pt-8 border-t border-gray-700">
         <button
            onClick={onLogout}
            className="w-full sm:w-auto px-4 py-2 font-semibold text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
            Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileTab;