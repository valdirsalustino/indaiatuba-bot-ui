import React from 'react';
import UserIcon from './UserIcon';

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);


export default function ConversationList({ conversations, onSelect, selectedId, onLogout, anyNeedsAttention }) {
  return (
    <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
      <header className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800 mr-2">Conversas</h1>
            {anyNeedsAttention && <AlertIcon />}
        </div>
        <button onClick={onLogout} title="Logout" className="text-gray-500 hover:text-red-500 transition-colors">
            <LogoutIcon />
        </button>
      </header>
      <div className="flex-grow overflow-y-auto">
        {conversations.map(conv => {
          const needsAttention = conv.human_supervision;
          return (
            <div
              key={conv.thread_id}
              onClick={() => onSelect(conv)}
              className={`flex items-center p-3 cursor-pointer transition-colors duration-200 relative ${selectedId === conv.thread_id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              {needsAttention && (
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
                <p className={`text-sm truncate ${needsAttention ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  {conv.last_message}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}