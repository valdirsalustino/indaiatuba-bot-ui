import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import Login from './components/Login.jsx';
import ConversationList from './components/ConversationList.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import UserManagement from './components/UserManagement.jsx'; // Import the new component

const API_BASE_URL = 'http://localhost:8000';
const WEBSOCKET_URL = 'ws://localhost:8000/ws';

// Helper function to get user from token
const getUserFromToken = (token) => {
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // Assuming the username is in the 'sub' claim
        return { username: decoded.sub, role: decoded.role };
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
  const [activeView, setActiveView] = useState('conversations'); // New state for view management

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
      const needsAttention = data.some(conv => conv.human_supervision === true);
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
      if (['new_handoff_request', 'new_message', 'supervision_type_changed', 'conversation_resolved'].includes(data.update)) {
        console.log('New data received: ', data);
        fetchConversations();
      }
    };
    ws.onclose = () => console.log('WebSocket disconnected');
    ws.onerror = (err) => console.error('WebSocket error:', err);

    return () => ws.close();
  }, [token, fetchConversations]);

  useEffect(() => {
    if (selectedConversation?.thread_id) {
      const updatedConversation = conversations.find(
        (conv) => conv.thread_id === selectedConversation.thread_id
      );
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
      } else {
        // If the selected conversation disappears (e.g., filtered out), deselect it
        setSelectedConversation(null);
      }
    }
  }, [conversations, selectedConversation?.thread_id]);

  const handleLogin = (newToken) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
    setCurrentUser(getUserFromToken(newToken));
    setActiveView('conversations'); // Default to conversations view on login
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setCurrentUser(null);
    setConversations([]);
    setSelectedConversation(null);
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setActiveView('conversations'); // Ensure we are in the conversation view
  };

  const handleSendMessage = async (text) => {
    if (!selectedConversation) return;

    const optimisticMessage = { sender: 'admin', text, timestamp: new Date().toISOString() };
    setSelectedConversation(prev => ({
        ...prev,
        messages: [...prev.messages, optimisticMessage]
    }));

    try {
        await fetch(`${API_BASE_URL}/conversations/${selectedConversation.thread_id}/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });
        // No need to fetch all conversations, just the current one for efficiency
        // But for simplicity, we'll stick to refetching all
        fetchConversations();
    } catch (err) {
        setError("Failed to send message.");
        // Rollback optimistic update
        setSelectedConversation(prev => ({
            ...prev,
            messages: prev.messages.slice(0, -1)
        }));
    }
  };

  const handleMarkAsSolved = async (thread_id) => {
    try {
        await fetch(`${API_BASE_URL}/conversations/${thread_id}/resolve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (selectedConversation?.thread_id === thread_id) {
            setSelectedConversation(null);
        }
        fetchConversations();
    } catch (err) {
        setError("Failed to mark as solved.");
    }
  };

  const handleUpdateSupervisionType = async (thread_id, newType) => {
    try {
        await fetch(`${API_BASE_URL}/conversations/${thread_id}/supervision-type`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ human_supervision_type: newType }),
        });
        fetchConversations();
    } catch (err) {
        setError("Failed to update supervision type.");
    }
  };

  const handleInitiateTransfer = (thread_id, newType) => {
    setModalState({
      isOpen: true,
      message: `Tem certeza que quer transferir essa conversa para o departamento "${newType}"?`,
      onConfirm: () => handleUpdateSupervisionType(thread_id, newType),
      onClose: closeModal,
    });
  };

  const handleInitiateSolve = (thread_id) => {
    setModalState({
      isOpen: true,
      message: 'Tem certeza que quer marcar essa conversa como resolvida?',
      onConfirm: () => handleMarkAsSolved(thread_id),
      onClose: closeModal,
    });
  };

  const openConfirmationModal = (message, onConfirm) => {
    setModalState({
        isOpen: true,
        message,
        onConfirm,
        onClose: closeModal,
    });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, message: '', onConfirm: () => {}, onClose: () => {} });
  };

  const handleConfirm = () => {
    modalState.onConfirm();
    closeModal();
  };

  if (!token || !currentUser) {
    return <Login onLogin={handleLogin} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className="h-screen w-screen bg-gray-200 flex font-sans antialiased text-gray-800">
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        message={modalState.message}
      />
      <div className="w-full h-full flex shadow-lg">
        <ConversationList
          conversations={conversations}
          onSelect={handleSelectConversation}
          selectedId={selectedConversation?.thread_id}
          onLogout={handleLogout}
          anyNeedsAttention={anyNeedsAttention}
          isAdmin={currentUser.role === 'Admin'}
          onShowUserManagement={() => setActiveView('userManagement')}
          onShowConversations={() => setActiveView('conversations')}
        />

        {activeView === 'conversations' && (
            <ChatWindow
                conversation={selectedConversation}
                onSendMessage={handleSendMessage}
                onMarkAsSolved={handleInitiateSolve}
                onInitiateTransfer={handleInitiateTransfer}
            />
        )}

        {activeView === 'userManagement' && currentUser.role === 'Admin' && (
            <UserManagement
                token={token}
                apiBaseUrl={API_BASE_URL}
                onAction={openConfirmationModal}
                currentUser={currentUser}
            />
        )}
      </div>
    </div>
  );
}

export default App;