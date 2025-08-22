
import React from 'react';
import { Tab, User } from '../types.ts';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  currentUser: User | null;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab, currentUser }) => {
  const allTabs: { id: Tab; label: string; visible: () => boolean }[] = [
    { id: 'main', label: 'Main', visible: () => true },
    { id: 'community', label: 'Community', visible: () => true },
    { id: 'chat', label: 'Chat', visible: () => !!currentUser },
    { id: 'profile', label: 'Profile', visible: () => !!currentUser },
    { id: 'admin', label: 'Admin', visible: () => !!currentUser && ['admin', 'co-owner', 'owner'].includes(currentUser.role) },
  ];
  
  const visibleTabs = allTabs.filter(tab => tab.visible());

  return (
    <nav className="flex border-b border-gray-700 overflow-x-auto">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 sm:px-6 py-4 font-semibold text-sm sm:text-base transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 rounded-t-lg flex-shrink-0
            ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'text-slate-400 hover:text-indigo-400 hover:bg-gray-700/50'
            }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default Tabs;