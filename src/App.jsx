// src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import Login from './components/Login.jsx';
import ConversationList from './components/ConversationList.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import UserManagement from './components/UserManagement.jsx';

const API_BASE_URL = '/api'; // The path we defined in the reverse proxy config

// Logic to determine WebSocket protocol
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WEBSOCKET_URL = `${wsProtocol}//${window.location.host}/ws`;
// const API_BASE_URL = 'http://localhost:8000';
// const WEBSOCKET_URL = 'ws://localhost:8000/ws';

const getUserFromToken = (token) => {
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        return { username: decoded.sub, role: decoded.role, name: decoded.name };
    } catch (e) {
        console.error("Invalid token:", e);
        return null;
    }
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [currentUser, setCurrentUser] = useState(() => getUserFromToken(localStorage.getItem('admin_token')));
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anyNeedsAttention, setAnyNeedsAttention] = useState(false);
  const [activeView, setActiveView] = useState('conversations');

  const [modalState, setModalState] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch conversations.');
      const data = await response.json();
      setConversations(data);
      const needsAttention = data.some(conv => conv.status === 'open' && conv.human_supervision === true);
      setAnyNeedsAttention(needsAttention);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(WEBSOCKET_URL);
    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (['new_handoff_request', 'new_message', 'supervision_type_changed', 'conversation_resolved', 'conversation_taken_over'].includes(data.update)) {
        fetchConversations();
      }
    };
    ws.onclose = () => console.log('WebSocket disconnected');
    return () => ws.close();
  }, [token, fetchConversations]);

  useEffect(() => {
    if (selectedConversation?.composite_id) {
      const updatedConversation = conversations.find(
        (conv) => conv.composite_id === selectedConversation.composite_id
      );
      setSelectedConversation(updatedConversation || null);
    }
  }, [conversations, selectedConversation?.composite_id]);

  const handleLogin = (newToken) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
    setCurrentUser(getUserFromToken(newToken));
    setActiveView('conversations');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setCurrentUser(null);
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setActiveView('conversations');
  };

  const handleSendMessage = async (messageData) => {
    if (!selectedConversation) return;

    const formData = new FormData();
    if (messageData.file) {
        formData.append('file', messageData.file);
    }
    if (messageData.text) {
        formData.append('text', messageData.text);
    }

    try {
        await fetch(`${API_BASE_URL}/conversations/${selectedConversation.composite_id}/send`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });
        // The websocket will trigger a refetch, so no need for optimistic update here
    } catch (err) {
        setError("Failed to send message.");
    }
  };

  const handleApiCall = async (url, options, successMessage) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An error occurred.');
      }
      // No need to refetch here, websocket will handle it
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkAsSolved = (compositeId) => {
    setModalState({
      isOpen: true,
      message: 'Tem certeza que deseja marcar esta conversa como resolvida?',
      onConfirm: () => handleApiCall(
        `${API_BASE_URL}/conversations/${compositeId}/resolve`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        },
        'Conversation marked as resolved.'
      ),
    });
  };

  const handleUpdateSupervisionType = (compositeId, newType) => {
     setModalState({
      isOpen: true,
      message: `Tem certeza que deseja transferir a conversa para o departamento ${newType}?`,
      onConfirm: () => handleApiCall(
        `${API_BASE_URL}/conversations/${compositeId}/supervision-type`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ human_supervision_type: newType }),
        },
        'Conversation transferred.'
      ),
    });
  };

  const handleTakeOverConversation = (compositeId) => {
    setModalState({
      isOpen: true,
      message: 'Tem certeza que deseja assumir esta conversa? O bot será desativado para este tópico.',
      onConfirm: () => handleApiCall(
        `${API_BASE_URL}/conversations/${compositeId}/take-over`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        },
        'Conversation taken over.'
      ),
    });
  };


  if (!token || !currentUser) {
    return <Login onLogin={handleLogin} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className="h-screen w-screen bg-gray-200 flex font-sans antialiased text-gray-800">
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={() => {
          modalState.onConfirm();
          setModalState({ ...modalState, isOpen: false });
        }}
        message={modalState.message}
      />
      <div className="w-full h-full flex shadow-lg">
        <ConversationList
          conversations={conversations}
          onSelect={handleSelectConversation}
          selectedId={selectedConversation?.composite_id}
          onLogout={handleLogout}
          anyNeedsAttention={anyNeedsAttention}
          isAdmin={currentUser.role === 'Admin'}
          onShowUserManagement={() => setActiveView('userManagement')}
          onShowConversations={() => setActiveView('conversations')}
          currentUser={currentUser}
        />

        {activeView === 'conversations' && (
            <ChatWindow
                conversation={selectedConversation}
                onSendMessage={handleSendMessage}
                onMarkAsSolved={handleMarkAsSolved}
                onInitiateTransfer={handleUpdateSupervisionType}
                onTakeOver={handleTakeOverConversation}
                currentUser={currentUser}
            />
        )}

        {activeView === 'userManagement' && currentUser.role === 'Admin' && (
            <UserManagement
                token={token}
                apiBaseUrl={API_BASE_URL}
                onAction={(message, onConfirm) => setModalState({ isOpen: true, message, onConfirm })}
                currentUser={currentUser}
            />
        )}
      </div>
    </div>
  );
}

export default App;
