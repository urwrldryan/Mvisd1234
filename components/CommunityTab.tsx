
import React from 'react';
import { UploadItem, Tab, User } from '../types.ts';

const LinkIcon: React.FC<{className: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

const UploadIcon: React.FC<{className: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3.75 12h16.5c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H3.75c-.621 0-1.125.504-1.125 1.125v4.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);


const UploadItemCard: React.FC<{ item: UploadItem; currentUser: User | null; onRemove: (id: number) => void; }> = ({ item, currentUser, onRemove }) => {
    const canRemove = currentUser && ['admin', 'co-owner', 'owner'].includes(currentUser.role);
    
    return (
        <li className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-shadow hover:shadow-md hover:bg-gray-800">
            <div className="flex-grow">
            <h3 className="font-semibold text-slate-100">{item.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{item.description}</p>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 mt-2 inline-flex items-center gap-1 group">
                <LinkIcon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition"/>
                {item.url}
            </a>
            <p className="text-xs text-slate-500 mt-2">Submitted by: <span className="font-semibold text-slate-400">{item.submittedBy}</span></p>
            </div>
            {canRemove && (
                <div className="flex-shrink-0 self-center sm:self-auto">
                    <button
                        onClick={() => onRemove(item.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                        aria-label={`Remove post titled ${item.title}`}
                    >
                        Remove
                    </button>
                </div>
            )}
        </li>
    );
}

interface CommunityTabProps {
  uploads: UploadItem[];
  currentUser: User | null;
  setActiveTab: (tab: Tab) => void;
  onRemove: (id: number) => void;
}

const CommunityTab: React.FC<CommunityTabProps> = ({ uploads, currentUser, setActiveTab, onRemove }) => {
  const approvedUploads = uploads.filter(item => item.status === 'approved');

  return (
    <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-1">Community Submissions</h2>
                <p className="text-slate-400">Here's what the community has been sharing. Approved links are available to everyone.</p>
            </div>
            {currentUser ? (
                <button
                    onClick={() => setActiveTab('main')}
                    className="w-full sm:w-auto flex-shrink-0 flex justify-center items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out"
                    aria-label="Share a new link"
                >
                    <UploadIcon className="w-5 h-5"/>
                    Share a Link
                </button>
            ) : (
                <div className="text-center sm:text-right">
                    <p className="text-slate-400">Please <button onClick={() => setActiveTab('main')} className="font-semibold text-indigo-400 hover:underline focus:outline-none">log in or register</button> to share a link.</p>
                </div>
            )}
        </div>

      {approvedUploads.length > 0 ? (
        <ul className="space-y-4">
          {approvedUploads.map((item) => (
            <UploadItemCard key={item.id} item={item} currentUser={currentUser} onRemove={onRemove} />
          ))}
        </ul>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-slate-300">No approved submissions yet.</h3>
          <p className="text-slate-400 mt-1">Check back later or submit a link to get things started!</p>
        </div>
      )}
    </div>
  );
};

export default CommunityTab;