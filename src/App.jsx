import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login.jsx';
import ConversationList from './components/ConversationList.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';

const API_BASE_URL = 'http://localhost:8000';
const WEBSOCKET_URL = 'ws://localhost:8000/ws';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anyNeedsAttention, setAnyNeedsAttention] = useState(false);

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
      if (data.update === 'new_handoff_request' || data.update === 'new_message' || data.update === 'supervision_type_changed' || data.update === 'conversation_resolved') {
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
      }
    }
  }, [conversations, selectedConversation?.thread_id]);

  const handleLogin = (newToken) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setConversations([]);
    setSelectedConversation(null);
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
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
        fetchConversations();
    } catch (err) {
        setError("Failed to send message.");
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
            headers: {
                'Authorization': `Bearer ${token}`,
            },
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
      message: `Are you sure you want to re-assign this conversation to "${newType}"?`,
      onConfirm: () => handleUpdateSupervisionType(thread_id, newType),
    });
  };

  const handleInitiateSolve = (thread_id) => {
    setModalState({
      isOpen: true,
      message: 'Are you sure you want to mark this conversation as solved?',
      onConfirm: () => handleMarkAsSolved(thread_id),
    });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, message: '', onConfirm: () => {} });
  };

  const handleConfirm = () => {
    modalState.onConfirm();
    closeModal();
  };

  if (!token) {
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
        />
        <ChatWindow
          conversation={selectedConversation}
          onSendMessage={handleSendMessage}
          onMarkAsSolved={handleInitiateSolve}
          onInitiateTransfer={handleInitiateTransfer}
        />
      </div>
    </div>
  );
}

export default App;