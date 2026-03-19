// src/App.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import Login from './components/Login.jsx';
import ConversationList from './components/ConversationList.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import UserManagement from './components/UserManagement.jsx';
import ClientConfigurations from './components/ClientConfigurations.jsx';

// Logic to determine WebSocket protocol
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

const getUserFromToken = (token) => {
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // Check if the token is expired
        if (decoded.exp * 1000 < Date.now()) {
            console.log("Token expired.");
            return null;
        }
        return { username: decoded.sub, role: decoded.role, name: decoded.name };
    } catch (e) {
        console.error("Invalid token:", e);
        return null;
    }
};

const getTenantFromUrl = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    const isLocalhost = hostname.includes('localhost');
    const hasSubdomain = isLocalhost ? parts.length > 1 : parts.length > 2;

    if (hasSubdomain && parts[0] !== 'www') {
        let extractedTenant = parts[0];
        
        // Clean up the '-test' suffix if running in the test environment
        if (extractedTenant.endsWith('-test')) {
            extractedTenant = extractedTenant.replace(/-test$/, ''); 
        }
        
        return extractedTenant;
    }
    return null;
};

function App() {
  const [tenant, setTenant] = useState(getTenantFromUrl());

  // Dynamic base URLs that include the tenant name
  const apiBaseUrl = tenant ? `/api/${tenant}` : '/api';
  const websocketUrl = tenant
    ? `${wsProtocol}//${window.location.host}/ws/${tenant}`
    : `${wsProtocol}//${window.location.host}/ws`;

  const [isValidTenant, setIsValidTenant] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [currentUser, setCurrentUser] = useState(() => getUserFromToken(localStorage.getItem('admin_token')));
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anyNeedsAttention, setAnyNeedsAttention] = useState(false);
  const [activeView, setActiveView] = useState('conversations');
  const [departments, setDepartments] = useState([]);

  // Pagination States
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;

  const conversationsRef = useRef(conversations);
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setCurrentUser(null);
  }, []);

  const authFetch = useCallback(async (url, options = {}) => {
      const currentToken = localStorage.getItem('admin_token');
      if (!currentToken) {
        handleLogout();
        throw new Error('No token found');
      }

      const headers = {
          ...options.headers,
          'Authorization': `Bearer ${currentToken}`,
      };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401 || response.status === 403) {
          // Token is invalid or expired
          handleLogout();
          throw new Error('Authentication failed');
      }

      return response;
  }, [handleLogout]);

  // Updated fetchConversations to handle pagination
  const fetchConversations = useCallback(async (currentSkip = 0, isLoadMore = false) => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      // Using the dynamic apiBaseUrl
      const response = await authFetch(`${apiBaseUrl}/conversations?days=30&limit=${LIMIT}&skip=${currentSkip}`);
      if (!response.ok) throw new Error('Failed to fetch conversations.');

      const serverData = await response.json();

      // If the server returns fewer items than the limit, there are no more pages
      if (serverData.length < LIMIT) {
        setHasMore(false);
      }

      setConversations(prevConversations => {
        // If it's a new page being loaded, append it. Otherwise, initialize it.
        const baseConversations = isLoadMore ? prevConversations : [];
        const localMap = new Map(baseConversations.map(c => [c.composite_id, c]));

        const newConversations = serverData.map(serverConv => {
          const localConv = localMap.get(serverConv.composite_id);

          if (!localConv) return serverConv;

          const serverMsgs = serverConv.messages || [];
          const localMsgs = localConv.messages || [];

          const serverMsgSignatures = new Set(
            serverMsgs.map(m => `${m.timestamp}-${m.text}`)
          );

          const mergedMessages = [...serverMsgs];

          localMsgs.forEach(localMsg => {
            const key = `${localMsg.timestamp}-${localMsg.text}`;
            if (!serverMsgSignatures.has(key)) {
              mergedMessages.push(localMsg);
            }
          });

          mergedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          const lastMsg = mergedMessages.length > 0
            ? mergedMessages[mergedMessages.length - 1]
            : null;

          return {
            ...serverConv,
            messages: mergedMessages,
            last_message: lastMsg ? lastMsg.text : serverConv.last_message,
            last_updated: lastMsg ? lastMsg.timestamp : serverConv.last_updated
          };
        });

        if (isLoadMore) {
           // Filter out duplicates in case a conversation moved up the list while paginating
           const existingIds = new Set(baseConversations.map(c => c.composite_id));
           const trulyNew = newConversations.filter(c => !existingIds.has(c.composite_id));
           return [...baseConversations, ...trulyNew];
        }
        return newConversations;
      });

      setAnyNeedsAttention(prev => prev || serverData.some(
        conv => conv.status === 'open' && conv.human_supervision === true
      ));

    } catch (err) {
      if (err.message !== 'Authentication failed') {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, authFetch, apiBaseUrl]);

  const fetchDepartments = useCallback(async () => {
    if (!token) return;
    try {
        const response = await authFetch(`${apiBaseUrl}/departments`);
        if (response.ok) {
            const data = await response.json();
            setDepartments(Array.isArray(data) ? data : []);
        }
    } catch (error) {
        console.error("Failed to fetch departments:", error);
    }
  }, [token, apiBaseUrl, authFetch]);

  // Expose a loadMore function to pass to the ConversationList
  const loadMoreConversations = () => {
    if (!isLoading && hasMore) {
        const nextSkip = skip + LIMIT;
        setSkip(nextSkip);
        fetchConversations(nextSkip, true);
    }
  };

  useEffect(() => {
    // If there is no subdomain at all, immediately fail validation
    if (!tenant) {
        setIsValidTenant(false);
        return;
    }

    const validateTenant = async () => {
        try {
            const response = await fetch(`/api/available-clients`);

            if (!response.ok) {
                throw new Error('Failed to fetch available clients.');
            }

            const validClients = await response.json();

            if (validClients.includes(tenant)) {
                setIsValidTenant(true);
            } else {
                setIsValidTenant(false);
            }
        } catch (error) {
            console.error("Error validating tenant:", error);
            setIsValidTenant(false);
        }
    };

    validateTenant();
  }, [tenant]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    const initialToken = localStorage.getItem('admin_token');
    if (initialToken && !getUserFromToken(initialToken)) {
        handleLogout();
    }
  }, [handleLogout]);

  // Initial Fetch on load
  useEffect(() => {
    if (token) {
        setSkip(0);
        setHasMore(true);
        fetchConversations(0, false);
    }
  }, [token, fetchConversations]);

  // WebSocket Connection with Auto-Reconnect
  useEffect(() => {
    if (!token) return;

    let ws;
    let reconnectTimeout;

    const connectWebSocket = () => {
      ws = new WebSocket(websocketUrl);

      ws.onopen = () => console.log('WebSocket connected');

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.update === 'new_message' && data.data) {
            const isKnownConversation = conversationsRef.current.some(
              c => c.composite_id === data.composite_id
            );

            if (!isKnownConversation) {
              fetchConversations(0, false); // Refresh from top if a brand new thread comes in
              return;
            }

            setConversations(prevConversations => {
              const targetIndex = prevConversations.findIndex(
                  c => c.composite_id === data.composite_id
              );

              if (targetIndex === -1) return prevConversations;

              const targetConv = prevConversations[targetIndex];
              const currentMessages = targetConv.messages || [];

              const isDuplicate = currentMessages.some(msg =>
                  msg.text === data.data.text &&
                  msg.timestamp === data.data.timestamp
              );
              if (isDuplicate) return prevConversations;

              let contentType = 'text';
              if (data.data.media_url) {
                const url = data.data.media_url.toLowerCase();
                const cleanUrl = decodeURIComponent(url.split('?')[0]);

                const imageRegex = /\.(jpg|jpeg|png|gif|webp)($|[;\s%])/;
                const videoRegex = /\.(mp4|mov|avi|webm)($|[;\s%])/;
                const audioRegex = /\.(mp3|wav|ogg|opus)($|[;\s%])/;

                if (imageRegex.test(cleanUrl)) contentType = 'image';
                else if (videoRegex.test(cleanUrl)) contentType = 'video';
                else if (audioRegex.test(cleanUrl)) contentType = 'audio';
                else contentType = 'document';
              }

              const newMessage = {
                  text: data.data.text,
                  sender: data.data.sender,
                  timestamp: data.data.timestamp,
                  media_url: data.data.media_url,
                  content_type: contentType
              };

              const updatedConv = {
                  ...targetConv,
                  messages: [...currentMessages, newMessage],
                  last_message: newMessage.text,
                  last_updated: newMessage.timestamp
              };

              const otherConvs = [
                  ...prevConversations.slice(0, targetIndex),
                  ...prevConversations.slice(targetIndex + 1)
              ];

              return [updatedConv, ...otherConvs];
            });
          }
          else if (['new_handoff_request', 'conversation_resolved', 'supervision_type_changed', 'conversation_taken_over'].includes(data.update)) {
            fetchConversations(0, false); // Refresh top items
          }
        } catch (e) {
          console.error("Error parsing websocket message", e);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected. Attempting to reconnect in 3 seconds...');
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (err) => {
        console.error("WebSocket encountered an error:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
        clearTimeout(reconnectTimeout);
        if (ws && ws.readyState === 1) {
            ws.close();
        }
    };
  }, [token, fetchConversations, websocketUrl]);

  useEffect(() => {
    if (selectedConversation?.composite_id) {
      const updatedConversation = conversations.find(
        (conv) => conv.composite_id === selectedConversation.composite_id
      );
      setSelectedConversation(updatedConversation || null);
    }
  }, [conversations, selectedConversation?.composite_id]);

  useEffect(() => {
    if (token && (activeView === 'conversations' || activeView === 'userManagement')) {
        fetchDepartments();
    }
  }, [token, activeView, fetchDepartments]);

  const handleLogin = (newToken) => {
    localStorage.setItem('admin_token', newToken);
    const user = getUserFromToken(newToken);
    if(user){
        setToken(newToken);
        setCurrentUser(user);
        setActiveView('conversations');
    } else {
        handleLogout();
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setActiveView('conversations');
  };

  const handleSendMessage = async (messageData) => {
    if (!selectedConversation) return;

    const formData = new FormData();
    if (messageData.file) formData.append('file', messageData.file);
    if (messageData.text) formData.append('text', messageData.text);

    try {
        await authFetch(`${apiBaseUrl}/conversations/${selectedConversation.composite_id}/send`, {
            method: 'POST',
            body: formData,
        });
    } catch (err) {
        if (err.message !== 'Authentication failed') {
            setError("Failed to send message.");
        }
    }
  };

  const handleApiCall = async (url, options) => {
    try {
      const response = await authFetch(url, options);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'An error occurred.');
      }
      // No need to refetch here, websocket will handle it
    } catch (err) {
        if (err.message !== 'Authentication failed') {
            setError(err.message);
        }
    }
  };

  const handleMarkAsSolved = (compositeId) => {
    setModalState({
      isOpen: true,
      message: 'Tem certeza que deseja marcar esta conversa como resolvida?',
      onConfirm: () => handleApiCall(
        `${apiBaseUrl}/conversations/${compositeId}/resolve`,
        { method: 'POST' }
      ),
    });
  };

  const handleUpdateSupervisionType = (compositeId, newType) => {
     setModalState({
      isOpen: true,
      message: `Tem certeza que deseja transferir a conversa para o departamento ${newType}?`,
      onConfirm: () => handleApiCall(
        `${apiBaseUrl}/conversations/${compositeId}/supervision-type`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ human_supervision_type: newType }),
        }
      ),
    });
  };

  const handleTakeOverConversation = (compositeId) => {
    setModalState({
      isOpen: true,
      message: 'Tem certeza que deseja assumir esta conversa? O bot será desativado para este tópico.',
      onConfirm: () => handleApiCall(
        `${apiBaseUrl}/conversations/${compositeId}/take-over`,
        { method: 'POST' }
      ),
    });
  };

  if (isValidTenant === null) {
      return <div className="flex items-center justify-center h-screen bg-gray-200">Validando cliente...</div>;
  }

  if (isValidTenant === false) {
      // The 404 Not Found UI
      return (
          <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-100 font-sans">
              <h1 className="text-6xl font-bold text-gray-800">404</h1>
              <p className="text-xl text-gray-600 mt-4">Página não encontrada.</p>
              <p className="text-md text-gray-500 mt-2">O cliente "{tenant}" não existe em nossa base de dados.</p>
          </div>
      );
  }

  if (!token || !currentUser) {
    return <Login onLogin={handleLogin} apiBaseUrl={apiBaseUrl} />;
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
          onShowClientConfigs={() => setActiveView('clientConfigurations')}
          onShowConversations={() => setActiveView('conversations')}
          currentUser={currentUser}
          onLoadMore={loadMoreConversations}
        />

        {activeView === 'conversations' && (
            <ChatWindow
                conversation={selectedConversation}
                onSendMessage={handleSendMessage}
                onMarkAsSolved={handleMarkAsSolved}
                onInitiateTransfer={handleUpdateSupervisionType}
                onTakeOver={handleTakeOverConversation}
                currentUser={currentUser}
                departments={departments}
            />
        )}

        {activeView === 'userManagement' && currentUser.role === 'Admin' && (
            <UserManagement
                token={token}
                apiBaseUrl={apiBaseUrl}
                onAction={(message, onConfirm) => setModalState({ isOpen: true, message, onConfirm })}
                currentUser={currentUser}
                departments={departments}
            />
        )}

        {activeView === 'clientConfigurations' && currentUser.role === 'Admin' && (
            <ClientConfigurations
                token={token}
                apiBaseUrl={apiBaseUrl}
                onClose={() => setActiveView('conversations')}
                onAction={(message, onConfirm) => setModalState({ isOpen: true, message, onConfirm })}
            />
        )}
      </div>
    </div>
  );
}

export default App;
