import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User, Tab } from '../types.ts';

interface ChatTabProps {
  messages: ChatMessage[];
  currentUser: User | null;
  onSendMessage: (text: string) => void;
  setActiveTab: (tab: Tab) => void;
}

const ChatTab: React.FC<ChatTabProps> = ({ messages, currentUser, onSendMessage, setActiveTab }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const currentUsername = currentUser?.username || 'Guest';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[70vh] sm:h-[65vh]">
      <div className="flex-shrink-0 mb-4">
        <h2 className="text-2xl font-bold text-slate-100">Community Chat</h2>
        {!currentUser && (
            <p className="text-sm text-slate-400">You are chatting as a Guest. Your messages are visible to everyone. <button onClick={() => setActiveTab('main')} className="font-semibold text-indigo-400 hover:underline">Login</button> to chat with your username.</p>
        )}
      </div>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
        {messages.map((msg) => {
          const isCurrentUser = msg.username === currentUsername;
          return (
            <div key={msg.id} className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                  isCurrentUser
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-700 text-slate-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm break-words">
                  <span
                    className={`font-bold mr-2 ${
                      isCurrentUser ? 'text-white/80' : 'text-indigo-300'
                    }`}
                  >
                    ({msg.username}):
                  </span>
                  {msg.text}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleFormSubmit} className="mt-4 pt-4 border-t border-gray-700 flex gap-4 flex-shrink-0">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 text-slate-100 placeholder:text-slate-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          autoComplete="off"
        />
        <button
          type="submit"
          className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400/50 disabled:cursor-not-allowed transition"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatTab;