import React from 'react';

interface GuestModeBannerProps {
  onDismiss: () => void;
  onLoginClick: () => void;
}

const InfoCircleIcon: React.FC<{className: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
);

const GuestModeBanner: React.FC<GuestModeBannerProps> = ({ onDismiss, onLoginClick }) => {
  return (
    <div className="bg-blue-900/50 text-blue-200 p-3 fixed top-0 left-0 right-0 z-50 ring-1 ring-inset ring-blue-500/30 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between gap-4 max-w-5xl px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <InfoCircleIcon className="h-6 w-6 text-blue-400 flex-shrink-0" />
          <p className="text-sm">
            <span className="font-semibold">You are in Guest Mode.</span> Your submissions and chats are now shared with everyone.{' '}
            <button onClick={onLoginClick} className="font-bold underline hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 rounded">
              Log in or register
            </button>
            {' '}to be credited for your contributions.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-full hover:bg-blue-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Dismiss guest mode notification"
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default GuestModeBanner;
