import React from 'react';

const SyncingIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SavedIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
);

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error';

interface SyncStatusIndicatorProps {
  status: SyncStatus;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ status }) => {
  if (status === 'idle') {
      return <div className="h-5 w-5" />; // Keep layout consistent
  }

  const config = {
    syncing: { icon: <SyncingIcon />, text: 'Syncing...', color: 'text-slate-400' },
    saved: { icon: <SavedIcon />, text: 'Saved to cloud', color: 'text-green-400' },
    error: { icon: <ErrorIcon />, text: 'Sync failed', color: 'text-red-400' },
  };

  const current = config[status as Exclude<SyncStatus, 'idle'>];

  return (
    <div className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${status !== 'idle' ? 'opacity-100' : 'opacity-0'}`}>
      {current.icon}
      <span className={`hidden sm:inline ${current.color}`}>{current.text}</span>
    </div>
  );
};

export default SyncStatusIndicator;