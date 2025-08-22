
import React, { useState } from 'react';
import { UploadItem, User, AuditLogEntry, UserRole } from '../types.ts';
import PreviewModal from './PreviewModal.tsx';

interface AdminTabProps {
  uploads: UploadItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  currentUser: User | null;
  allUsers: User[];
  auditLog: AuditLogEntry[];
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onDeleteUser: (userId: string) => void;
}

const PendingItem: React.FC<{ item: UploadItem, onApprove: (id: string) => void, onReject: (id: string) => void, onPreview: (url: string) => void }> = ({ item, onApprove, onReject, onPreview }) => (
  <li className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div className="flex-grow">
      <h3 className="font-semibold text-slate-100">{item.title}</h3>
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline truncate block max-w-xs sm:max-w-sm md:max-w-md">
        {item.url}
      </a>
      <p className="text-xs text-slate-500 mt-1">By: {item.submittedBy}</p>
    </div>
    <div className="flex-shrink-0 flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-center">
       <button 
        onClick={() => onPreview(item.url)}
        className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition"
      >
        Preview
      </button>
      <button 
        onClick={() => onApprove(item.id)}
        className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
      >
        Approve
      </button>
      <button 
        onClick={() => onReject(item.id)}
        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
      >
        Reject
      </button>
    </div>
  </li>
);

const ManagementDashboard: React.FC<{
  currentUser: User;
  allUsers: User[];
  auditLog: AuditLogEntry[];
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  onDeleteUser: (userId: string) => void;
}> = ({ currentUser, allUsers, auditLog, onUpdateUserRole, onDeleteUser }) => {
  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      onDeleteUser(user.id);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
        case 'owner': return 'bg-purple-500/20 text-purple-300';
        case 'co-owner': return 'bg-teal-500/20 text-teal-300';
        case 'admin': return 'bg-sky-500/20 text-sky-300';
        default: return 'bg-gray-500/20 text-gray-300';
    }
  };
  
  const availableRoles: UserRole[] = ['owner', 'co-owner', 'admin', 'user'];

  return (
    <div className="mt-12 pt-8 border-t border-gray-700 space-y-12">
        <h3 className="text-2xl font-bold text-slate-100 capitalize">{currentUser.role} Dashboard</h3>

        <div>
            <h4 className="text-xl font-bold text-slate-100">User Management</h4>
            <p className="text-slate-400 mb-4">List of all registered users.</p>
            <div className="bg-gray-800/50 rounded-lg border border-gray-700">
                <ul className="divide-y divide-gray-700">
                    {allUsers.map(user => (
                        <li key={user.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <span className="font-semibold text-slate-300">{user.username}</span>
                                <span className="text-sm text-slate-400 ml-2">({user.email})</span>
                                <span className={`ml-3 px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                                    {user.role}
                                </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-2 self-end sm:self-center">
                                {currentUser.role === 'owner' && currentUser.id !== user.id && (
                                    <select 
                                        value={user.role}
                                        onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserRole)}
                                        className="bg-gray-700 border border-gray-600 text-white text-xs rounded-md focus:ring-indigo-500 focus:border-indigo-500 px-2 py-1.5"
                                    >
                                       {availableRoles.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                )}
                                {(currentUser.role === 'owner' || currentUser.role === 'co-owner') && currentUser.id !== user.id && user.role !== 'owner' && !(currentUser.role === 'co-owner' && user.role === 'co-owner') && (
                                    <button
                                        onClick={() => handleDelete(user)}
                                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div>
            <h4 className="text-xl font-bold text-slate-100">Activity Log</h4>
            <p className="text-slate-400 mb-4">A log of all moderation actions.</p>
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
                {auditLog.length > 0 ? (
                    <ul className="divide-y divide-gray-700">
                        {auditLog.map((log) => (
                            <li key={log.id} className="p-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="text-sm text-slate-200">
                                            Admin <strong className="font-semibold text-indigo-400">{log.adminUsername}</strong>{' '}
                                            <span className={log.action === 'approved' ? 'text-green-400' : 'text-red-400'}>
                                                {log.action}
                                            </span>{' '}
                                            submission: "{log.uploadTitle}"
                                        </p>
                                    </div>
                                    <div className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap text-right">
                                        {log.timestamp.toLocaleDateString()}
                                        <br/>
                                        {log.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-6 text-center text-slate-400">No admin activity recorded yet.</p>
                )}
            </div>
        </div>
    </div>
  );
}

const AdminTab: React.FC<AdminTabProps> = (props) => {
  const { uploads, onApprove, onReject, currentUser, allUsers, auditLog, onUpdateUserRole, onDeleteUser } = props;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!currentUser || !['admin', 'co-owner', 'owner'].includes(currentUser.role)) {
    return (
        <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-100">Access Denied</h2>
            <p className="mt-2 text-slate-400">You do not have the required permissions to view this page.</p>
        </div>
    );
  }
  
  const pendingUploads = uploads.filter(item => item.status === 'pending');

  return (
    <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-1">Moderation Panel</h2>
                <p className="text-slate-400">Logged in as <strong className="font-semibold text-indigo-400">{currentUser.username}</strong> ({currentUser.role}).</p>
            </div>
        </div>

      {pendingUploads.length > 0 ? (
        <>
            <h3 className="text-xl font-bold text-slate-100 mb-4">Pending Submissions ({pendingUploads.length})</h3>
            <ul className="space-y-4">
                {pendingUploads.map(item => (
                    <PendingItem 
                        key={item.id} 
                        item={item} 
                        onApprove={onApprove} 
                        onReject={onReject} 
                        onPreview={(url) => setPreviewUrl(url)}
                    />
                ))}
            </ul>
        </>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-slate-300">All clear!</h3>
          <p className="text-slate-400 mt-1">There are no pending submissions to review.</p>
        </div>
      )}
      
      {(currentUser.role === 'owner' || currentUser.role === 'co-owner') && (
        <ManagementDashboard
          currentUser={currentUser}
          allUsers={allUsers}
          auditLog={auditLog}
          onUpdateUserRole={onUpdateUserRole}
          onDeleteUser={onDeleteUser}
        />
      )}

      {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
};

export default AdminTab;