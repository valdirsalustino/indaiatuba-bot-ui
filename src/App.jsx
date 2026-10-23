// src/App.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login.jsx';
import ConversationList from './components/ConversationList.jsx';
import ChatWindow from './components/ChatWindow.jsx';
import ConfirmationModal from './components/ConfirmationModal.jsx';
import UserManagement from './components/UserManagement.jsx';
import ClientConfigurations from './components/ClientConfigurations.jsx';
import Dashboard from './components/Dashboard.jsx';
import CalendarIntegration from './components/CalendarIntegration.jsx';
import OAuthCallback from './components/OAuthCallback.jsx';
import AdminCalendarView from './components/AdminCalendarView.jsx';
import TopNavbar from './components/TopNavbar.jsx';
import NewConversationModal from './components/NewConversationModal.jsx';
import AppointmentDetailsModal from './components/AppointmentDetailsModal.jsx';
import CalendarEventModal from './components/CalendarEventModal.jsx';
import { useToast } from './context/ToastContext.jsx';
import { RealtimeProvider } from './context/RealtimeContext.jsx';
import { useConversationRealtime } from './hooks/useConversationRealtime.js';

// Logic to determine WebSocket protocol
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

const getUserFromToken = (token, expectedTenant) => {
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // Check if the token is expired
        if (decoded.exp * 1000 < Date.now()) {
            console.log("Token expired.");
            return null;
        }
        // Reject tokens issued for a different tenant or missing the tenant claim
        if (!decoded.tenant || (expectedTenant && decoded.tenant !== expectedTenant)) {
            console.log("Token tenant mismatch or missing tenant claim.");
            return null;
        }
        return { username: decoded.sub, role: decoded.role, name: decoded.name, tenant: decoded.tenant };
    } catch (e) {
        console.error("Invalid token:", e);
        return null;
    }
};

const getTenantFromUrl = () => {
    const hostname = window.location.hostname;
    
    // For local development with Google OAuth, subdomains in redirect URIs are not allowed.
    // Allow an override via Vite env var, or fallback to a default if accessed via pure localhost.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return import.meta.env.VITE_DEFAULT_TENANT || 'indaiatubadayhospital';
    }

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

function ConversationRealtimeBridge(props) {
    useConversationRealtime(props);
    return null;
}

function App() {
  const { addToast } = useToast();
  const [tenant, setTenant] = useState(getTenantFromUrl());

  // Dynamic base URLs that include the tenant name
  const apiBaseUrl = tenant ? `/api/${tenant}` : '/api';
  const websocketUrl = tenant
    ? `${wsProtocol}//${window.location.host}/ws/${tenant}`
    : `${wsProtocol}//${window.location.host}/ws`;

  const [isValidTenant, setIsValidTenant] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));
  const [currentUser, setCurrentUser] = useState(() => getUserFromToken(localStorage.getItem('admin_token'), getTenantFromUrl()));
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('conversations');
  const [activeTab, setActiveTab] = useState('Novos');
  const [departments, setDepartments] = useState([]);
  const [clientName, setClientName] = useState('');
  const [features, setFeatures] = useState({ enable_google_calendar_scheduling: false });
  const [showTopics, setShowTopics] = useState(false);
  const [showLeads, setShowLeads] = useState(false);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [isSubmittingNewConversation, setIsSubmittingNewConversation] = useState(false);
  const [filterTopic, setFilterTopic] = useState('');
  const [filterLead, setFilterLead] = useState('');
  const [classificationLabels, setClassificationLabels] = useState({ topics: [], leads: [] });

  const filterTopicRef = useRef('');
  const filterLeadRef = useRef('');


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

  // Traceability & Scheduling states
  const [traceabilityAppointmentId, setTraceabilityAppointmentId] = useState(null);
  const [isTraceabilityModalOpen, setIsTraceabilityModalOpen] = useState(false);
  const [scheduleModalState, setScheduleModalState] = useState({ isOpen: false, initialOrigin: null });
  const [doctors, setDoctors] = useState([]);


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

      if (response.status === 401) {
          // Token is invalid or expired
          handleLogout();
          throw new Error('Authentication failed');
      }
      
      if (response.status === 403) {
          throw new Error('Forbidden: You do not have permission.');
      }

      return response;
  }, [handleLogout]);

  // Updated fetchConversations to handle pagination
  const fetchConversations = useCallback(async (currentSkip = 0, isLoadMore = false, topicParam = undefined, leadParam = undefined) => {
    if (!token) return;
    setIsLoading(true);
    isLoadingRef.current = true;
    setError(null);
    try {
      const activeTopic = topicParam !== undefined ? topicParam : filterTopicRef.current;
      const activeLead = leadParam !== undefined ? leadParam : filterLeadRef.current;

      let url = `${apiBaseUrl}/conversations?limit=${LIMIT}&skip=${currentSkip}`;
      if (activeTopic) {
        url += `&topic=${encodeURIComponent(activeTopic)}`;
      }
      if (activeLead) {
        url += `&lead=${encodeURIComponent(activeLead)}`;
      }

      // Using the dynamic apiBaseUrl
      const response = await authFetch(url);
      if (!response.ok) throw new Error('Failed to fetch conversations.');

      const serverData = await response.json();

      // If the server returns fewer items than the limit, there are no more pages
      if (serverData.length < LIMIT) {
        setHasMore(false);
      }

      setConversations(prevConversations => {
        // Build localMap from all prevConversations to preserve any real-time websocket messages
        const localMap = new Map(prevConversations.map(c => [c.composite_id, c]));
        
        // If it's a new page being loaded, append it. Otherwise, initialize it.
        const baseConversations = isLoadMore ? prevConversations : [];

        const newConversations = serverData.map(serverConv => {
          const localConv = localMap.get(serverConv.composite_id);

          if (!localConv) return serverConv;

          const serverMsgs = serverConv.messages || [];
          const localMsgs = localConv.messages || [];

          const serverMsgSignatures = new Set();
          serverMsgs.forEach(m => {
            if (m.message_id) {
              serverMsgSignatures.add(m.message_id);
            }
            const cleanMediaKey = m.media_url ? m.media_url.split('?')[0] : '';
            if (m.timestamp && (m.text || cleanMediaKey)) {
              const timeNumeric = new Date(m.timestamp).getTime();
              serverMsgSignatures.add(`${timeNumeric}-${m.text || ''}-${cleanMediaKey}`);
              if (m.text) {
                serverMsgSignatures.add(`${timeNumeric}-${m.text}`);
              }
            }
          });

          const mergedMessages = [...serverMsgs];

          localMsgs.forEach(localMsg => {
            const hasIdMatch = localMsg.message_id && serverMsgSignatures.has(localMsg.message_id);
            
            const timeNumeric = localMsg.timestamp ? new Date(localMsg.timestamp).getTime() : null;
            const cleanLocalMediaKey = localMsg.media_url ? localMsg.media_url.split('?')[0] : '';
            const fallbackKey = `${timeNumeric}-${localMsg.text || ''}-${cleanLocalMediaKey}`;
            const legacyFallbackKey = `${timeNumeric}-${localMsg.text}`;
            const hasFallbackMatch = timeNumeric && (
              serverMsgSignatures.has(fallbackKey) ||
              (localMsg.text && serverMsgSignatures.has(legacyFallbackKey))
            );
            
            if (!hasIdMatch && !hasFallbackMatch) {
              mergedMessages.push(localMsg);
            }
          });

          mergedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          const lastMsg = mergedMessages.length > 0
            ? mergedMessages[mergedMessages.length - 1]
            : null;

          const lastMsgPreview = lastMsg
            ? (lastMsg.text || (lastMsg.content_type && lastMsg.content_type !== 'text'
                ? `[${lastMsg.content_type.charAt(0).toUpperCase() + lastMsg.content_type.slice(1)}]`
                : serverConv.last_message))
            : serverConv.last_message;

          return {
            ...serverConv,
            messages: mergedMessages,
            last_message: lastMsgPreview,
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

    } catch (err) {
      if (err.message !== 'Authentication failed') {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
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

  const fetchClientInfo = useCallback(async () => {
    if (!token) return;
    try {
        const response = await authFetch(`${apiBaseUrl}/client-info`);
        if (response.ok) {
            const data = await response.json();
            setClientName(data.client_name || '');
        }
    } catch (error) {
        console.error("Failed to fetch client info:", error);
    }
  }, [token, apiBaseUrl, authFetch]);

  const fetchFeatures = useCallback(async () => {
    if (!token) return;
    try {
        const response = await authFetch(`${apiBaseUrl}/features`);
        if (response.ok) {
            const data = await response.json();
            setFeatures(data);
        }
    } catch (error) {
        console.error("Failed to fetch features:", error);
    }
  }, [token, apiBaseUrl, authFetch]);

  const fetchClassificationLabels = useCallback(async () => {
    if (!token) return;
    try {
        const response = await authFetch(`${apiBaseUrl}/classifications/labels`);
        if (response.ok) {
            const data = await response.json();
            setClassificationLabels(data);
        }
    } catch (error) {
        console.error("Failed to fetch classification labels:", error);
    }
  }, [token, apiBaseUrl, authFetch]);

  const handleFilterChange = (newTopic, newLead) => {
    setFilterTopic(newTopic);
    setFilterLead(newLead);
    filterTopicRef.current = newTopic;
    filterLeadRef.current = newLead;
    setSkip(0);
    setHasMore(true);
    setConversations([]);
    fetchConversations(0, false, newTopic, newLead);
  };


  // Expose a loadMore function to pass to the ConversationList
  const loadMoreConversations = () => {
    if (!isLoadingRef.current && hasMore) {
        isLoadingRef.current = true;
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
    if (initialToken && !getUserFromToken(initialToken, tenant)) {
        handleLogout();
    }
  }, [handleLogout, tenant]);

  // Initial Fetch on load
  useEffect(() => {
    if (token) {
        setSkip(0);
        setHasMore(true);
        fetchConversations(0, false);
    }
  }, [token, fetchConversations]);

  useEffect(() => {
    if (selectedConversation?.composite_id) {
      const updatedConversation = conversations.find(
        (conv) => conv.composite_id === selectedConversation.composite_id
      );
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
      }
    }
  }, [conversations, selectedConversation?.composite_id]);

  useEffect(() => {
    if (token && (activeView === 'conversations' || activeView === 'userManagement')) {
        fetchDepartments();
        fetchClientInfo();
        fetchFeatures();
        fetchClassificationLabels();
    }
  }, [token, activeView, fetchDepartments, fetchClientInfo, fetchFeatures, fetchClassificationLabels]);


  const handleLogin = (newToken) => {
    localStorage.setItem('admin_token', newToken);
    const user = getUserFromToken(newToken, tenant);
    if(user){
        setToken(newToken);
        setCurrentUser(user);
        const returnTo = sessionStorage.getItem('returnTo');
        if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
            sessionStorage.removeItem('returnTo');
            window.history.replaceState(null, '', returnTo);
            const apptMatch = returnTo.match(/^\/appointments\/([^/?#]+)/);
            if (apptMatch) {
              setTraceabilityAppointmentId(apptMatch[1]);
              setIsTraceabilityModalOpen(true);
            }
            const convMatch = returnTo.match(/^\/conversations\/([^/?#]+)/);
            if (convMatch) {
              loadAndSelectConversation(decodeURIComponent(convMatch[1]));
            }
            setActiveView('conversations');
        } else {
            setActiveView('conversations');
        }
    } else {
        handleLogout();
    }
  };

  // Fetch doctors for scheduling
  useEffect(() => {
    if (!token) return;
    authFetch(`${apiBaseUrl}/users`)
      .then(res => res.ok ? res.json() : [])
      .then(users => {
        if (Array.isArray(users)) {
          setDoctors(users.filter(u => u.role === 'Médico'));
        }
      })
      .catch(err => console.error("Error fetching doctors:", err));
  }, [token, apiBaseUrl, authFetch]);

  // Direct URL deep-link handling
  useEffect(() => {
    if (!token || !currentUser) return;
    const pathname = window.location.pathname;
    const apptMatch = pathname.match(/^\/appointments\/([^/?#]+)/);
    if (apptMatch) {
      setTraceabilityAppointmentId(apptMatch[1]);
      setIsTraceabilityModalOpen(true);
    }
    const convMatch = pathname.match(/^\/conversations\/([^/?#]+)/);
    if (convMatch) {
      loadAndSelectConversation(decodeURIComponent(convMatch[1]));
    }
  }, [token, currentUser]);

  const handleSaveAppointmentFromChat = async (eventData) => {
    try {
      const res = await authFetch(`${apiBaseUrl}/calendar/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao agendar consulta.');
      }
      addToast('Consulta agendada com sucesso!', 'success');
      setScheduleModalState({ isOpen: false, initialOrigin: null });
      if (selectedConversation?.composite_id) {
        loadAndSelectConversation(selectedConversation.composite_id);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };


  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setActiveView('conversations');
  };

  const loadAndSelectConversation = async (compositeId, errorMessage = "Failed to fetch conversation") => {
    try {
      const res = await authFetch(`${apiBaseUrl}/conversations/${compositeId}`);
      if (res.ok) {
        const fetchedConv = await res.json();
        setConversations(prev => {
          if (prev.some(c => c.composite_id === fetchedConv.composite_id)) return prev;
          return [fetchedConv, ...prev];
        });
        setActiveTab('Novos');
        handleSelectConversation(fetchedConv);
      }
    } catch (err) {
      console.error(errorMessage, err);
    }
  };

  const handleNewConversationSubmit = async (phoneNumber, clientName) => {
    setIsSubmittingNewConversation(true);
    try {
      const payload = { phone_number: phoneNumber };
      if (clientName) {
        payload.client_name = clientName;
      }
      
      const response = await authFetch(`${apiBaseUrl}/conversations/proactive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const responseData = await response.json();
        setIsNewConversationModalOpen(false);
        
        if (responseData.composite_id) {
          await loadAndSelectConversation(responseData.composite_id, "Failed to fetch new proactive conversation");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.composite_id) {
          setIsNewConversationModalOpen(false);
          addToast(errorData.detail || 'Já existe uma conversa ativa com este número.', 'warning');
          await loadAndSelectConversation(errorData.composite_id, "Failed to fetch existing proactive conversation");
        } else {
          addToast(errorData.detail || 'Erro ao iniciar conversa.', 'error');
        }
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      addToast(error.message || 'Erro de conexão.', 'error');
    } finally {
      setIsSubmittingNewConversation(false);
    }
  };


  const handleSendMessage = async (messageData) => {
    if (!selectedConversation) return;

    const formData = new FormData();
    if (messageData.file) formData.append('file', messageData.file);
    if (messageData.text) formData.append('text', messageData.text);
    if (messageData.isTemplate) formData.append('is_template_fallback', 'true');

    try {
        const response = await authFetch(`${apiBaseUrl}/conversations/${selectedConversation.composite_id}/send`, {
            method: 'POST',
            body: formData,
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to send message.');
        }
    } catch (err) {
        if (err.message !== 'Authentication failed') {
            setError(err.message || "Failed to send message.");
        }
    }
  };

  const handleEditMessage = async (compositeId, messageId, newText) => {
    try {
        const response = await authFetch(
            `${apiBaseUrl}/conversations/${compositeId}/messages/${encodeURIComponent(messageId)}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ new_text: newText }),
            }
        );
        if (!response.ok) {
            const err = await response.json();
            setError(err.detail || 'Failed to edit message.');
        }
        // WebSocket will broadcast the update; no need to refetch
    } catch (err) {
        if (err.message !== 'Authentication failed') {
            setError('Failed to edit message.');
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
      return true;
      // No need to refetch here, websocket will handle it
    } catch (err) {
        if (err.message !== 'Authentication failed') {
            setError(err.message);
        }
        return false;
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

  const handleReopenThread = (compositeId) => {
    setModalState({
      isOpen: true,
      message: 'Tem certeza que deseja reabrir esta conversa para enviar uma mensagem ao cliente?',
      onConfirm: async () => {
        const success = await handleApiCall(
          `${apiBaseUrl}/conversations/${compositeId}/reopen`,
          { method: 'POST' }
        );
        if (success) {
            setActiveTab('Novos');
        }
      },
    });
  };

  // DYNAMICALLY CALCULATE if any needs attention so it perfectly matches the real state
  const anyNeedsAttention = conversations.some(conv => conv.status === 'open' && conv.human_supervision === true);

  const isLatestThread = React.useMemo(() => {
    if (!selectedConversation) return false;
    const allConvsForPhone = conversations.filter(c => c.phone_number === selectedConversation.phone_number);
    allConvsForPhone.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
    return allConvsForPhone.length > 0 && allConvsForPhone[0].composite_id === selectedConversation.composite_id;
  }, [conversations, selectedConversation]);

  const isCalendarEnabled = features?.enable_google_calendar_scheduling || false;


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
    if (window.location.pathname.startsWith('/appointments/') || window.location.pathname.startsWith('/conversations/')) {
      sessionStorage.setItem('returnTo', window.location.pathname + window.location.search);
    }
    return (
      <Routes>
        <Route path="/calendar/callback" element={<OAuthCallback apiBaseUrl={apiBaseUrl} token={null} />} />
        <Route path="*" element={<Login onLogin={handleLogin} apiBaseUrl={apiBaseUrl} />} />
      </Routes>
    );
  }

  return (
    <RealtimeProvider
      token={token}
      apiBaseUrl={apiBaseUrl}
      websocketUrl={websocketUrl}
      onAuthFailure={handleLogout}
    >
      <ConversationRealtimeBridge
        conversationsRef={conversationsRef}
        setConversations={setConversations}
        authFetch={authFetch}
        apiBaseUrl={apiBaseUrl}
        fetchConversations={fetchConversations}
        addToast={addToast}
        setActiveView={setActiveView}
        setActiveTab={setActiveTab}
        handleSelectConversation={handleSelectConversation}
        currentUser={currentUser}
      />
      <Routes>
        <Route path="/calendar/callback" element={<OAuthCallback apiBaseUrl={apiBaseUrl} token={token} />} />
        <Route path="*" element={
          <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-800 overflow-hidden">
            <ConfirmationModal
              isOpen={modalState.isOpen}
              onClose={() => setModalState({ ...modalState, isOpen: false })}
              onConfirm={() => {
                if (modalState.onConfirm) {
                  modalState.onConfirm();
                }
                setModalState({ ...modalState, isOpen: false });
              }}
              message={modalState.message}
              isAlert={modalState.isAlert}
            />
            
            <TopNavbar
              onLogout={handleLogout}
              isAdmin={currentUser.role === 'Admin'}
              isDoctor={currentUser.role === 'Médico'}
              isCalendarEnabled={isCalendarEnabled}
              onShowUserManagement={() => setActiveView('userManagement')}
              onShowClientConfigs={() => setActiveView('clientConfigurations')}
              onShowDashboard={() => setActiveView('dashboard')}
              onShowConversations={() => setActiveView('conversations')}
              onShowCalendar={() => setActiveView('calendar')}
              onShowAdminCalendar={() => setActiveView('adminCalendar')}
              currentUser={currentUser}
              clientName={clientName}
              activeView={activeView}
            />

            <div className="w-full flex-grow flex overflow-hidden">
              {activeView !== 'dashboard' && (
                <ConversationList
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  conversations={conversations}
                  onSelect={handleSelectConversation}
                  selectedId={selectedConversation?.composite_id}
                  anyNeedsAttention={anyNeedsAttention}
                  currentUser={currentUser}
                  onLoadMore={loadMoreConversations}
                  showTopics={showTopics}
                  setShowTopics={setShowTopics}
                  showLeads={showLeads}
                  setShowLeads={setShowLeads}
                  enableLeadClassification={features?.enable_lead_classification || false}
                  classificationLabels={classificationLabels}
                  filterTopic={filterTopic}
                  filterLead={filterLead}
                  onFilterChange={handleFilterChange}
                  onNewConversation={() => setIsNewConversationModalOpen(true)}
                />
              )}

              {activeView === 'conversations' && (
                  <ChatWindow
                      conversation={selectedConversation}
                      onSendMessage={handleSendMessage}
                      onEditMessage={handleEditMessage}
                      onMarkAsSolved={handleMarkAsSolved}
                      onInitiateTransfer={handleUpdateSupervisionType}
                      onTakeOver={handleTakeOverConversation}
                      onReopenThread={handleReopenThread}
                      currentUser={currentUser}
                      departments={departments}
                      isLatestThread={isLatestThread}
                      clientName={clientName}
                      showTopics={showTopics}
                      showLeads={showLeads}
                      onOpenScheduleModal={(conv) => {
                        setScheduleModalState({
                          isOpen: true,
                          initialOrigin: {
                            composite_id: conv.composite_id,
                            client_name: conv.user_name || ''
                          }
                        });
                      }}
                      onViewTraceability={(appointmentId) => {
                        setTraceabilityAppointmentId(appointmentId);
                        setIsTraceabilityModalOpen(true);
                      }}
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

              {activeView === 'dashboard' && currentUser.role === 'Admin' && (
                  <Dashboard 
                      onClose={() => setActiveView('conversations')} 
                      apiBaseUrl={apiBaseUrl} 
                      token={token} 
                  />
              )}

              {activeView === 'calendar' && isCalendarEnabled && (
                  <CalendarIntegration
                      currentUser={currentUser}
                      apiBaseUrl={apiBaseUrl}
                      token={token}
                  />
              )}

              {activeView === 'adminCalendar' && ['Admin', 'Secretaria', 'Médico'].includes(currentUser.role) && isCalendarEnabled && (
                  <AdminCalendarView
                      currentUser={currentUser}
                      apiBaseUrl={apiBaseUrl}
                      token={token}
                      onOpenTraceability={(appointmentId) => {
                        setTraceabilityAppointmentId(appointmentId);
                        setIsTraceabilityModalOpen(true);
                      }}
                  />
              )}

              <NewConversationModal
                isOpen={isNewConversationModalOpen}
                onClose={() => setIsNewConversationModalOpen(false)}
                onSubmit={handleNewConversationSubmit}
                apiBaseUrl={apiBaseUrl}
                authFetch={authFetch}
                onCheckPhone={async (phone) => {
                  const res = await authFetch(`${apiBaseUrl}/conversations/check-phone/${encodeURIComponent(phone)}`);
                  if (res.ok) {
                    return await res.json();
                  }
                  return { exists: false };
                }}
                isSubmitting={isSubmittingNewConversation}
              />

              <AppointmentDetailsModal
                isOpen={isTraceabilityModalOpen}
                onClose={() => {
                  setIsTraceabilityModalOpen(false);
                  setTraceabilityAppointmentId(null);
                  if (window.location.pathname.startsWith('/appointments/')) {
                    window.history.replaceState(null, '', '/');
                  }
                }}
                appointmentId={traceabilityAppointmentId}
                apiBaseUrl={apiBaseUrl}
                token={token}
                onOpenConversation={(compositeId) => {
                  setIsTraceabilityModalOpen(false);
                  setTraceabilityAppointmentId(null);
                  loadAndSelectConversation(compositeId);
                }}
                addToast={addToast}
              />

              <CalendarEventModal
                isOpen={scheduleModalState.isOpen}
                onClose={() => setScheduleModalState({ isOpen: false, initialOrigin: null })}
                onSave={handleSaveAppointmentFromChat}
                doctors={doctors}
                initialOrigin={scheduleModalState.initialOrigin}
              />
            </div>
          </div>
        } />
      </Routes>
    </RealtimeProvider>
  );
}

export default App;