import React from 'react';
import UserIcon from './UserIcon';

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

// The `getAvatar` function is no longer needed and has been removed.
export default function ConversationList({ conversations, onSelect, selectedId, onLogout }) {
  return (
    <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
      <header className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Conversations</h1>
        <button onClick={onLogout} title="Logout" className="text-gray-500 hover:text-red-500 transition-colors">
            <LogoutIcon />
        </button>
      </header>
      <div className="flex-grow overflow-y-auto">
        {conversations.map(conv => (
          <div
            key={conv.thread_id}
            onClick={() => onSelect(conv)}
            className={`flex items-center p-3 cursor-pointer transition-colors duration-200 relative ${selectedId === conv.thread_id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          >
            {conv.needs_attention && (
                <span className="absolute left-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            )}

            <div className="w-12 h-12 rounded-full mr-4 flex items-center justify-center bg-gray-200 flex-shrink-0">
                <UserIcon className="h-8 w-8 text-gray-500" />
            </div>

            <div className="flex-grow overflow-hidden">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-gray-700 truncate">{conv.thread_id}</h2>
                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{new Date(conv.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className={`text-sm truncate ${conv.needs_attention ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                {conv.last_message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}