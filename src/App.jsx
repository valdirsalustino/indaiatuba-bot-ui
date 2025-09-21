import React, { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import Login from './components/Login.jsx';
import ConversationList from './components/ConversationList.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import UserManagement from './components/UserManagement.jsx';

const API_BASE_URL = 'http://localhost:8000';
const WEBSOCKET_URL = 'ws://localhost:8000/ws';

// Helper function to get user from token
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
      // A conversation needs attention if it's open and requires human supervision.
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
        console.log('New data received via WebSocket: ', data);
        fetchConversations(); // Refetch all conversations on any relevant update
      }
    };
    ws.onclose = () => console.log('WebSocket disconnected');
    ws.onerror = (err) => console.error('WebSocket error:', err);

    return () => ws.close();
  }, [token, fetchConversations]);

  // This effect ensures that the selected conversation details are always up-to-date.
  useEffect(() => {
    if (selectedConversation?.composite_id) {
      const updatedConversation = conversations.find(
        (conv) => conv.composite_id === selectedConversation.composite_id
      );
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
      } else {
        setSelectedConversation(null);
      }
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
    setConversations([]);
    setSelectedConversation(null);
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setActiveView('conversations');
  };

  const handleSendMessage = async (text) => {
    if (!selectedConversation) return;

    const senderName = (currentUser.name || currentUser.username).toLowerCase();
    const optimisticMessage = { sender: senderName, text, timestamp: new Date().toISOString() };

    setSelectedConversation(prev => ({
        ...prev,
        messages: [...prev.messages, optimisticMessage]
    }));

    try {
        // Use the composite_id for the API call
        await fetch(`${API_BASE_URL}/conversations/${selectedConversation.composite_id}/send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });
        fetchConversations(); // Refetch to get the confirmed message
    } catch (err) {
        setError("Failed to send message.");
        // Rollback optimistic update on failure
        setSelectedConversation(prev => ({
            ...prev,
            messages: prev.messages.slice(0, -1)
        }));
    }
  };

  const handleMarkAsSolved = async (compositeId) => {
    try {
        await fetch(`${API_BASE_URL}/conversations/${compositeId}/resolve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (selectedConversation?.composite_id === compositeId) {
            setSelectedConversation(null);
        }
        fetchConversations();
    } catch (err) {
        setError("Failed to mark as solved.");
    }
  };

  const handleUpdateSupervisionType = async (compositeId, newType) => {
    try {
        await fetch(`${API_BASE_URL}/conversations/${compositeId}/supervision-type`, {
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

  const handleTakeOverConversation = async (compositeId) => {
    try {
        await fetch(`${API_BASE_URL}/conversations/${compositeId}/take-over`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        fetchConversations();
    } catch (err) {
        setError("Failed to take over conversation.");
    }
  };

  // Modal handlers now operate on the compositeId
  const handleInitiateTakeOver = (compositeId) => {
    setModalState({
      isOpen: true,
      message: 'Tem certeza que quer falar diretamente com o cliente? O bot será desativado para esta conversa até que ela seja resolvida.',
      onConfirm: () => handleTakeOverConversation(compositeId),
      onClose: closeModal,
    });
  };

  const handleInitiateTransfer = (compositeId, newType) => {
    setModalState({
      isOpen: true,
      message: `Tem certeza que quer transferir essa conversa para o departamento "${newType}"?`,
      onConfirm: () => handleUpdateSupervisionType(compositeId, newType),
      onClose: closeModal,
    });
  };

  const handleInitiateSolve = (compositeId) => {
    setModalState({
      isOpen: true,
      message: 'Tem certeza que quer marcar essa conversa como resolvida?',
      onConfirm: () => handleMarkAsSolved(compositeId),
      onClose: closeModal,
    });
  };

  const openConfirmationModal = (message, onConfirm) => {
    setModalState({ isOpen: true, message, onConfirm, onClose: closeModal });
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
          selectedId={selectedConversation?.composite_id}
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
                onTakeOver={handleInitiateTakeOver}
                currentUser={currentUser}
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
