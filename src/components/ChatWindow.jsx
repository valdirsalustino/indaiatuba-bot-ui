import React, { useState, useEffect, useRef, useMemo } from 'react';
import Avatar from './Avatar.jsx';
import ChatInputArea from './ChatInputArea.jsx';
import MessageBubble from './MessageBubble.jsx';
import { isWhatsAppWindowClosed } from '../utils/whatsapp.js';

// --- ICONS ---
const SolvedIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> );
const TakeOverIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> );
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );
const PhoneIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500 hover:text-green-500" title="Reabrir conversa"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> );

export default function ChatWindow({ conversation, onSendMessage, onEditMessage, onMarkAsSolved, onInitiateTransfer, onTakeOver, onReopenThread, currentUser, departments = [], isLatestThread = false, clientName = '', showTopics = false, showLeads = false }) {
  const [editingMessageId, setEditingMessageId] = useState(null); // wamid being edited
  const [editText, setEditText] = useState('');               // current text in the edit textarea
  const messagesEndRef = useRef(null);

  const handleConfirmEdit = (compositeId, messageId) => {
    if (editText.trim() && editText.trim() !== '') {
      onEditMessage(compositeId, messageId, editText.trim());
    }
    setEditingMessageId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);

  const handleTypeChange = (e) => { const newType = e.target.value; if (newType) { onInitiateTransfer(conversation.composite_id, newType); e.target.value = ""; } };


  // --- 24h Window Detection ---
  const isPast24hWindow = useMemo(() => isWhatsAppWindowClosed(conversation?.messages), [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <Avatar size="lg" className="mx-auto mb-2" />
          <p className="mt-2 text-lg">Selecione um tópico de conversa</p>
        </div>
      </div>
    );
  }

  const needsAttention = conversation.status === 'open' && conversation.human_supervision;
  let lastMessageDate = null;
  const safeDepartments = departments.map(dep => typeof dep === 'object' ? dep.name : dep);
  const availableTypes = safeDepartments.filter( (type) => type !== conversation.human_supervision_type );
  const isInputDisabled = conversation.status !== 'open' || !conversation.human_supervision;


  return (
    <div className="flex-grow flex flex-col bg-[#f8fafc]">
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center">
            <Avatar name={conversation.user_name} seed={conversation.phone_number} size="sm" className="mr-3" />
            <div>
                <div className="flex items-center">
                  <div className="flex flex-col">
                      <h2 className="font-semibold text-gray-800">
                          {conversation.user_name || conversation.phone_number}
                      </h2> {conversation.user_name && (
                        <span className="text-xs text-gray-500">{conversation.phone_number}</span>
                      )}
                  </div>
                  <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{conversation.thread_id.replace('_', ' ')}</span>
                </div>
                {needsAttention && ( <div className="text-xs text-red-600"> Departamento: {conversation.human_supervision_type}. Hora do pedido: {new Date(conversation.last_handoff_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} </div> )}
            </div>
        </div>
        <div className="flex items-center space-x-3">
            {conversation.status === 'open' ? (
              <>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">Em andamento</span>
                {conversation.human_supervision ? (
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                        <select 
                            onChange={handleTypeChange} 
                            value="" 
                            className="appearance-none bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block px-4 py-2 pr-8 shadow-sm transition-all hover:bg-gray-50 cursor-pointer" 
                        >
                            <option value="" disabled>Transferir →</option>
                            {availableTypes.map((type) => ( <option key={type} value={type}>{type}</option> ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => onMarkAsSolved(conversation.composite_id)} 
                        title="Marcar como Resolvido"
                        className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full shadow-sm transition-colors"
                    >
                        <SolvedIcon />
                        Concluir
                    </button>
                  </div>
                ) : ( 
                  <button 
                    onClick={() => onTakeOver(conversation.composite_id)} 
                    title="Assumir conversa e desativar o bot"
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-full shadow-sm transition-colors"
                  >
                    <TakeOverIcon />
                    Assumir
                  </button> 
                )}
              </>
            ) : ( 
              <>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Conversa Encerrada</span>
                {isLatestThread && (
                  <button 
                    onClick={() => onReopenThread(conversation.composite_id)} 
                    title="Reabrir Conversa"
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    <PhoneIcon />
                    Reabrir
                  </button>
                )}
              </>
            )}
        </div>
      </header>

      {/* --- Explainability Banner --- */}
      {conversation && ((showTopics && conversation.topic) || (showLeads && conversation.lead)) && (
        <div className="bg-indigo-50 border-b border-indigo-100 p-3 space-y-2.5 flex flex-col border-l-4 border-indigo-500 shadow-inner">
          {showTopics && conversation.topic && (
            <div>
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Tópico:</span>
                <span className="font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[11px]">{conversation.topic}</span>
              </div>
              {conversation.topic_summary && (
                <p className="text-xs text-indigo-800 mt-1 pl-5 font-normal leading-relaxed">
                  {conversation.topic_summary}
                </p>
              )}
            </div>
          )}
          {showLeads && conversation.lead && (
            <div className={showTopics && conversation.topic ? "pt-2.5 border-t border-indigo-100" : ""}>
              <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Status do Lead:</span>
                <span className="font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[11px]">{conversation.lead}</span>
              </div>
              {conversation.lead_summary && (
                <p className="text-xs text-indigo-800 mt-1 pl-5 font-normal leading-relaxed">
                  {conversation.lead_summary}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-grow px-6 py-4 overflow-y-auto bg-[#f8fafc]">
        <div className="flex flex-col space-y-2">
          {conversation.messages.map((msg, index) => {
            const messageDate = new Date(msg.timestamp);
            const currentDateStr = messageDate.toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            let dateDivider = null;

            if (currentDateStr !== lastMessageDate) {
              dateDivider = ( <div key={`date-${index}`} className="flex justify-center my-3"><span className="bg-white bg-opacity-90 text-gray-600 text-xs font-semibold px-3 py-1 rounded-lg shadow-sm">{currentDateStr}</span></div> );
              lastMessageDate = currentDateStr;
            }

            const isUserMessage = msg.sender === 'user';
            const isBotMessage = msg.sender === 'bot';
            const isAdminMessage = !isUserMessage && !isBotMessage;

            const editingState = {
                editingMessageId,
                editText,
                setEditText,
                handleConfirmEdit,
                handleCancelEdit,
                setEditingMessageId,
                messagesEndRef
            };

            return (
              <React.Fragment key={index}>
                {dateDivider}
                <MessageBubble 
                    msg={msg}
                    index={index}
                    isUserMessage={isUserMessage}
                    isAdminMessage={isAdminMessage}
                    conversation={conversation}
                    clientName={clientName}
                    isInputDisabled={isInputDisabled}
                    editingState={editingState}
                />
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInputArea 
        conversation={conversation}
        onSendMessage={onSendMessage}
        currentUser={currentUser}
        isInputDisabled={isInputDisabled}
        isPast24hWindow={isPast24hWindow}
      />
    </div>
  );
}