import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login.jsx';
import ConversationList from './components/ConversationList.jsx';
import ChatWindow from './components/ChatWindow.jsx';

// --- API Configuration ---
const API_BASE_URL = 'http://localhost:8000'; // Adjust if your backend is elsewhere
const WEBSOCKET_URL = 'ws://localhost:8000/ws'; // Adjust for your WebSocket

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
      if (data.update === 'new_handoff_request') {
        console.log('New handoff request received: ', data);
        fetchConversations(); // Re-fetch conversations to show the new request
      }
      if (data.update === 'new_message') {
        console.log('New new message received: ', data);
        fetchConversations(); // Re-fetch conversations to show the new request
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
  }, [conversations]); // The dependency array ensures this runs ONLY when 'conversations' changes.

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
    // The full conversation object (including messages) is already fetched
    // by the /conversations endpoint in our current backend implementation.
    setSelectedConversation(conversation);
  };

  const handleSendMessage = async (text) => {
    if (!selectedConversation) return;

    const optimisticMessage = { sender: 'admin', text };
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
        // Optionally re-fetch conversations to get the latest state
        fetchConversations();
    } catch (err) {
        setError("Failed to send message.");
        // Revert optimistic update on failure
        setSelectedConversation(prev => ({
            ...prev,
            messages: prev.messages.slice(0, -1)
        }));
    }
  };


  if (!token) {
    return <Login onLogin={handleLogin} apiBaseUrl={API_BASE_URL} />;
  }

  return (
    <div className="h-screen w-screen bg-gray-200 flex font-sans antialiased text-gray-800">
      <div className="w-full h-full flex shadow-lg">
        <ConversationList
          conversations={conversations}
          onSelect={handleSelectConversation}
          selectedId={selectedConversation?.thread_id}
          onLogout={handleLogout}
        />
        <ChatWindow
          conversation={selectedConversation}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

export default App;