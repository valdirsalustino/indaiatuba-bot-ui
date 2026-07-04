// src/components/ConversationList.jsx

import React, { useState } from 'react';
import Avatar from './Avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
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

const normalizeLastMessage = (message) => {
  if (!message) return '';
  const match = message.match(/^Media received: (.*?)\.?$/);
  if (match) {
    return `[${match[1]}]`;
  }
  return message;
};

export default function ConversationList({
  conversations,
  onSelect,
  selectedId,
  anyNeedsAttention,
  currentUser,
  onLoadMore,
  showTopics,
  setShowTopics,
  showLeads,
  setShowLeads,
  enableLeadClassification = false,
  classificationLabels = { topics: [], leads: [] },
  filterTopic = '',
  filterLead = '',
  onFilterChange,
  activeTab = 'Novos',
  setActiveTab
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Detect scroll reaching the bottom
  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    // If the user scrolls within 10 pixels of the bottom, trigger load more
    if (scrollHeight - scrollTop <= clientHeight + 10) {
        if (onLoadMore) {
            onLoadMore();
        }
    }
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    const aNeedsAttention = a.status === 'open' && a.human_supervision;
    const bNeedsAttention = b.status === 'open' && b.human_supervision;

    if (aNeedsAttention && !bNeedsAttention) return -1; // a comes first
    if (!aNeedsAttention && bNeedsAttention) return 1;  // b comes first

    return new Date(b.last_updated) - new Date(a.last_updated);
  });

  const filteredConversations = sortedConversations.filter(conv => {
    // 1. Tab filtering
    let tabMatch = false;
    if (activeTab === 'Novos') {
      tabMatch = conv.status === 'open';
    } else if (activeTab === 'Robô') {
      tabMatch = conv.status === 'closed_by_timeout' || conv.status === 'closed_by_user';
    } else if (activeTab === 'Departamento') {
      tabMatch = conv.status === 'closed_by_assistant';
    }

    if (!tabMatch) return false;

    // 2. Search filtering
    const query = searchQuery.toLowerCase();
    if (!query) {
        return true;
    }
    if (conv.phone_number.includes(query)) {
        return true;
    }
    if (conv.messages && Array.isArray(conv.messages)) {
        return conv.messages.some(msg => msg.text && msg.text.toLowerCase().includes(query));
    }
    return false;
  });

  const getTabCount = (tabName) => {
    return sortedConversations.filter(conv => {
        if (tabName === 'Novos') return conv.status === 'open';
        if (tabName === 'Robô') return conv.status === 'closed_by_timeout' || conv.status === 'closed_by_user';
        if (tabName === 'Departamento') return conv.status === 'closed_by_assistant';
        return false;
    }).length;
  };

  const TabButton = ({ name, title }) => {
    const isNovosTab = name === 'Novos';
    const isAlertState = isNovosTab && anyNeedsAttention;

    return (
      <button
        title={title}
        onClick={() => setActiveTab(name)}
        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 border-b-2 transition-colors relative ${
          activeTab === name 
            ? 'border-indigo-600 text-indigo-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        <span className="relative flex items-center">
            {name}
            {isAlertState && activeTab !== 'Novos' && (
                <span className="absolute -top-1 -right-2.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            )}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
          isAlertState 
            ? 'bg-red-100 text-red-700 font-bold shadow-sm' 
            : activeTab === name ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {getTabCount(name)}
        </span>
      </button>
    );
  };

  return (
    <div className="w-full md:w-[360px] lg:w-[400px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-0">
      
      {/* Tabs */}
      <div className="flex w-full border-b border-gray-200 bg-white">
        <TabButton 
          name="Novos" 
          title="Todas as conversas ativas no momento, incluindo robô e assistentes." 
        />
        <TabButton 
          name="Departamento" 
          title="Conversas encerradas direcionadas ao seu departamento." 
        />
        <TabButton 
          name="Robô" 
          title="Conversas encerradas pelo Robô ou pelo Cliente que não precisaram de atendimento humano." 
        />
      </div>

      {/* --- Collapsible Filter Panel — between header and search bar --- */}
      {isFiltersOpen && (
        <div className="bg-gray-50 p-3.5 border-b border-gray-200 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Filtros e Visualização</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Column 1: Toggles */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visualização</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-xs font-semibold text-gray-600">Ver Tópicos</span>
                  <button
                    onClick={() => setShowTopics(!showTopics)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                      showTopics ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                        showTopics ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {enableLeadClassification && (
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-xs font-semibold text-gray-600">Ver Leads</span>
                    <button
                      onClick={() => setShowLeads(!showLeads)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
                        showLeads ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                          showLeads ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Filters */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtros</h4>
              <div className="space-y-2">
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-gray-500 mb-1">Filtrar por Tópico</label>
                  <select
                    value={filterTopic}
                    onChange={(e) => onFilterChange(e.target.value, filterLead)}
                    className="w-full bg-white border border-gray-300 text-gray-700 text-xs rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-sm"
                  >
                    <option value="">Todos os tópicos</option>
                    {classificationLabels?.topics?.map(topic => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>
                {enableLeadClassification && (
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-500 mb-1">Filtrar por Lead</label>
                    <select
                      value={filterLead}
                      onChange={(e) => onFilterChange(filterTopic, e.target.value)}
                      className="w-full bg-white border border-gray-300 text-gray-700 text-xs rounded-lg p-1.5 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-sm"
                    >
                      <option value="">Todos os leads</option>
                      {classificationLabels?.leads?.map(lead => (
                        <option key={lead} value={lead}>{lead}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Search Bar & Filter Toggle --- */}
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center space-x-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Buscar atendimento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-all"
          />
        </div>
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          title="Filtros e Visualização"
          className={`p-2 rounded-lg transition-colors ${isFiltersOpen ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-200'}`}
        >
            <FilterIcon />
        </button>
      </div>

      {/* Added the onScroll handler to this specific div */}
      <div className="flex-grow overflow-y-auto" onScroll={handleScroll}>
        {filteredConversations.map(conv => {
          const needsAttention = conv.status === 'open' && conv.human_supervision;
          const isClosed = conv.status !== 'open';
          const textStyle = isClosed ? 'italic text-gray-400' : needsAttention ? 'text-red-600 font-bold' : 'text-gray-500';

          let bgClass = 'hover:bg-gray-50';
          if (selectedId === conv.composite_id) {
            bgClass = 'bg-indigo-50/50';
          }

          return (
            <div
              key={conv.composite_id}
              onClick={() => onSelect(conv)}
              className={`flex items-center p-4 cursor-pointer transition-colors duration-200 relative border-b border-gray-100 group ${bgClass}`}
            >
              {selectedId === conv.composite_id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-r-md"></div>
              )}
              <div className="relative mr-3 flex-shrink-0">
                  <Avatar name={conv.user_name} seed={conv.phone_number} size="md" />
                  {/* Whatsapp icon or indicator could go here */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" className="text-green-500 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </div>
              </div>
              <div className="flex-grow overflow-hidden">
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex flex-col">
                      <h2 className={`text-sm font-semibold truncate ${needsAttention ? 'text-gray-900' : 'text-gray-800'}`}>
                          {conv.user_name || conv.phone_number}
                      </h2>
                  </div>
                  <span className={`text-[11px] flex-shrink-0 ml-2 whitespace-nowrap mt-0.5 ${needsAttention ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                    {formatDisplayDate(conv.last_updated)}
                  </span>
                </div>

                {/* --- RENDER LAST MESSAGE --- */}
                <div className={`text-sm truncate mt-1 ${textStyle}`}>
                    {isClosed ? (
                        `Tópico encerrado (${conv.status.split('_').pop()})`
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            allowedElements={['strong', 'em', 'del', 'span', 'a']}
                            unwrapDisallowed={true}
                            components={{
                                a: ({node, ...props}) => <span {...props} />,
                            }}
                        >
                            {normalizeLastMessage(conv.last_message)}
                        </ReactMarkdown>
                    )}
                </div>

                {/* --- RENDER TOPIC & LEAD BADGES --- */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {/* Always show department if open and has supervision */}
                    {conv.status === 'open' && conv.human_supervision && conv.human_supervision_type && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {conv.human_supervision_type}
                        </span>
                    )}

                    {showTopics && conv.topic && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                        {conv.topic}
                      </span>
                    )}
                    {showLeads && conv.lead && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                        conv.lead.toLowerCase().includes('quente') 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : conv.lead.toLowerCase().includes('frio') 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {conv.lead}
                      </span>
                    )}
                </div>

              </div>
            </div>
          )
        })}
      </div>
      
      {/* We don't render the footer here anymore since TopNavbar has the user info, 
          but we can keep a small subtle branding or leave it empty. */}
    </div>
  );
}