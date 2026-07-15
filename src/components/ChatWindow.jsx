import React, { useState, useEffect, useRef, useMemo } from 'react';
import Avatar from './Avatar.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatInputArea from './ChatInputArea.jsx';
import { isWhatsAppWindowClosed } from '../utils/whatsapp.js';

// --- ICONS ---
const SolvedIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> );
const TakeOverIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> );
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );
const PhoneIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500 hover:text-green-500" title="Reabrir conversa"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> );
const PencilIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );

// --- Media Renderer Component ---
const MediaRenderer = ({ msg }) => {
    switch (msg.content_type) {
        case 'image':
            return <img src={msg.media_url} alt="User upload" className="rounded-lg max-w-xs lg:max-w-md" />;
        case 'video':
            return ( <video controls src={msg.media_url} className="rounded-lg max-w-xs lg:max-w-md"> Your browser does not support the video tag. </video> );
        case 'audio':
            return ( <audio controls src={msg.media_url} className="mt-2" style={{ minWidth: '250px' }}> Your browser does not support the audio element. </audio> );
        case 'document':
            return ( <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"> <DownloadIcon /> Baixar Documento </a> );
        default:
            return null;
    }
};

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
            const justification = isUserMessage ? 'justify-start' : 'justify-end';
            const nameAlignment = isUserMessage ? 'text-left self-start' : 'text-right self-end';
            let senderName = msg.sender === 'user'
                ? (conversation.user_name || 'Cliente')
                : msg.sender === 'bot' ? (clientName ? `${clientName} - IA` : 'IA') : msg.sender;

            let bgColor = 'bg-white border border-gray-200 shadow-sm'; // Default (Bot)
            let textColor = 'text-gray-800';
            let borderRadius = 'rounded-2xl rounded-tr-sm'; // Right aligned tail

            if (isUserMessage) {
                bgColor = 'bg-gray-100 border border-gray-200';
                textColor = 'text-gray-800';
                borderRadius = 'rounded-2xl rounded-tl-sm'; // Left aligned tail
            } else if (isAdminMessage) {
                bgColor = 'bg-indigo-600 text-white shadow-sm';
                textColor = 'text-white';
                borderRadius = 'rounded-2xl rounded-tr-sm'; // Right aligned tail
            }

            // CLEAN DISPLAY TEXT: Remove bold signature and replace non-breaking spaces
            // NOTE: We also convert standard hyphens to bullets here purely for display consistency in the Admin UI
            let rawText = msg.text || msg.body || msg.caption || msg.message || '';
            if (typeof rawText !== 'string') {
              rawText = String(rawText);
            }

            let displayText = rawText
              .replace(/Media received:.*$/ig, '')
              .replace(/^\*\*[^*]+:\*\*\s+/, '') // Keeps your old bold signature cleaner
              .replace(/\u00A0/g, ' ')
              .replace(/^-\s+/gm, '• ')
              .trim();

            // Can this message be edited? Only admin text messages with a tracked wamid.
            const canEdit = isAdminMessage && msg.content_type === 'text' && !!msg.message_id && !isInputDisabled;
            const isBeingEdited = editingMessageId !== null && editingMessageId === msg.message_id;

            return (
              <React.Fragment key={index}>
                {dateDivider}
                <div className={`flex ${justification} group`}>
                    <div className="flex flex-col max-w-lg">
                        {senderName && ( <span className={`text-[11px] font-medium text-gray-500 mb-1 ${nameAlignment} px-1`}>{senderName}</span> )}
                        <div className={`${borderRadius} px-4 py-2 ${bgColor} ${textColor} relative group-hover:shadow-md transition-shadow`}>
                            <div className="flex flex-col">
                                {msg.media_url && <MediaRenderer msg={msg} />}
                                {isBeingEdited ? (
                                    <div className="flex flex-col gap-2 mt-1">
                                        <textarea
                                            className="w-full text-sm text-gray-800 bg-white border border-blue-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            rows={3}
                                            value={editText}
                                            onChange={e => setEditText(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleConfirmEdit(conversation.composite_id, msg.message_id); }
                                                if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                            autoFocus
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={handleCancelEdit} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 bg-white">Cancelar</button>
                                            <button onClick={() => handleConfirmEdit(conversation.composite_id, msg.message_id)} className="text-xs text-white px-2 py-1 rounded bg-blue-500 hover:bg-blue-600">Salvar</button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 italic">✏️ Uma mensagem de correção será enviada ao cliente no WhatsApp.</p>
                                    </div>
                                ) : (
                                    msg.text && (
                                        <div className={`text-sm ${msg.media_url ? 'mt-2' : ''} overflow-hidden`}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap break-words" {...props} />,
                                                    strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                                                    em: ({node, ...props}) => <span className="italic" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                    li: ({node, ...props}) => <li className="mb-1 break-words" {...props} />,
                                                    a: ({node, ...props}) => <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer" {...props} />
                                                }}
                                            >
                                                {displayText}
                                            </ReactMarkdown>
                                        </div>
                                    )
                                )}
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-1">
                                {msg.is_edited && (
                                    <span className="text-[10px] text-gray-400 italic flex items-center gap-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        Editado
                                    </span>
                                )}
                                {canEdit && !isBeingEdited && (
                                    <button
                                        title="Editar mensagem"
                                        onClick={() => {
                                            setEditingMessageId(msg.message_id);
                                            setEditText(displayText);
                                            const isLastMessage = index === conversation.messages.length - 1;
                                            if (isLastMessage) {
                                                setTimeout(() => {
                                                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-black/10 text-gray-400 hover:text-gray-600"
                                    >
                                        <PencilIcon />
                                    </button>
                                )}
                                <span className={`text-[10px] ${isAdminMessage ? 'text-indigo-200' : 'text-gray-400'}`}>{messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
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