import React, { useState } from 'react';
import UserIcon from './UserIcon';

// --- ICONS (Added SearchIcon) ---
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-red-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

const ManageUsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

const formatDisplayDate = (timestamp) => {
  const messageDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = messageDate.getFullYear() === today.getFullYear() &&
                  messageDate.getMonth() === today.getMonth() &&
                  messageDate.getDate() === today.getDate();

  const isYesterday = messageDate.getFullYear() === yesterday.getFullYear() &&
                      messageDate.getMonth() === yesterday.getMonth() &&
                      messageDate.getDate() === yesterday.getDate();

  if (isToday) {
    return messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  if (isYesterday) {
    return 'Ontem';
  }
  return messageDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};


export default function ConversationList({ conversations, onSelect, selectedId, onLogout, anyNeedsAttention, isAdmin, onShowUserManagement, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');

  const sortedConversations = [...conversations].sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));

  const filteredConversations = sortedConversations.filter(conv => {
    const query = searchQuery.toLowerCase();
    // If there's no query, show all conversations (that are open or recently closed)
    if (!query) {
        return conv.status.startsWith('open') || conv.status.startsWith('closed');
    }

    // Check if the phone number matches
    if (conv.phone_number.includes(query)) {
        return true;
    }

    // Check if any message text includes the query
    // This assumes `conv.messages` is available. If not, this part needs adjustment based on available data.
    if (conv.messages && Array.isArray(conv.messages)) {
        return conv.messages.some(msg => msg.text && msg.text.toLowerCase().includes(query));
    }

    return false;
  });

  return (
    <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
      <header className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800 mr-2">Conversas</h1>
            {anyNeedsAttention && <AlertIcon />}
        </div>
        <div className="flex items-center space-x-4">
            {isAdmin && (
                <button onClick={onShowUserManagement} title="Manage Users" className="text-gray-500 hover:text-blue-500 transition-colors">
                    <ManageUsersIcon />
                </button>
            )}
            <button onClick={onLogout} title="Logout" className="text-gray-500 hover:text-red-500 transition-colors">
                <LogoutIcon />
            </button>
        </div>
      </header>

      {/* --- Search Bar --- */}
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
            </div>
            <input
                type="text"
                placeholder="Pesquisar ou começar uma nova conversa"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
        </div>
      </div>


      <div className="flex-grow overflow-y-auto">
        {filteredConversations.map(conv => {
          const needsAttention = conv.status === 'open' && conv.human_supervision;
          const isClosed = conv.status !== 'open';

          return (
            <div
              key={conv.composite_id}
              onClick={() => onSelect(conv)}
              className={`flex items-center p-3 cursor-pointer transition-colors duration-200 relative ${selectedId === conv.composite_id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              <div className="w-12 h-12 rounded-full mr-4 flex items-center justify-center bg-gray-200 flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-gray-500" />
              </div>
              <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="flex flex-col">
                        <h2 className="font-semibold text-gray-700 truncate">
                            {conv.user_name || conv.phone_number}
                        </h2> {conv.user_name && (
                            <span className="text-xs text-gray-500">{conv.phone_number}</span>
                        )}
                    </div>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{conv.thread_id.replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatDisplayDate(conv.last_updated)}</span>
                </div>
                <p className={`text-sm truncate ${isClosed ? 'italic text-gray-400' : needsAttention ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  {isClosed ? `Tópico encerrado (${conv.status.split('_').pop()})` : conv.last_message}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {currentUser && (
        <footer className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center bg-gray-300 text-gray-600 font-bold flex-shrink-0">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold text-sm text-gray-800 capitalize">{currentUser.name || currentUser.username}</p>
                    <p className="text-xs text-gray-500">{currentUser.role}</p>
                </div>
            </div>
        </footer>
      )}
    </div>
  );
}