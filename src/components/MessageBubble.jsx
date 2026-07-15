import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PencilIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> );
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );

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

const MESSAGE_THEMES = {
  user: {
    bgColor: 'bg-gray-100 border border-gray-200',
    textColor: 'text-gray-800',
    borderRadius: 'rounded-2xl rounded-tl-sm', // Left aligned tail
    linkColor: 'text-blue-600 hover:text-blue-800'
  },
  admin: {
    bgColor: 'bg-indigo-600 text-white shadow-sm',
    textColor: 'text-white',
    borderRadius: 'rounded-2xl rounded-tr-sm', // Right aligned tail
    linkColor: 'text-indigo-200 hover:text-white'
  },
  default: {
    bgColor: 'bg-white border border-gray-200 shadow-sm',
    textColor: 'text-gray-800',
    borderRadius: 'rounded-2xl rounded-tr-sm', // Right aligned tail
    linkColor: 'text-blue-600 hover:text-blue-800'
  }
};

export default function MessageBubble({ 
    msg, 
    index,
    isUserMessage, 
    isAdminMessage, 
    conversation, 
    clientName, 
    isInputDisabled, 
    editingState
}) {
    const messageDate = new Date(msg.timestamp);
    const role = isUserMessage ? 'user' : (isAdminMessage ? 'admin' : 'default');
    const theme = MESSAGE_THEMES[role];
    const justification = isUserMessage ? 'justify-start' : 'justify-end';
    const nameAlignment = isUserMessage ? 'text-left self-start' : 'text-right self-end';

    let senderName = msg.sender === 'user'
        ? (conversation.user_name || 'Cliente')
        : msg.sender === 'bot' ? (clientName ? `${clientName} - IA` : 'IA') : msg.sender;

    let rawText = msg.text || msg.body || msg.caption || msg.message || '';
    if (typeof rawText !== 'string') {
        rawText = String(rawText);
    }

    let displayText = rawText
        .replace(/Media received:.*$/ig, '')
        .replace(/^\*\*[^*]+:\*\*\s+/, '') 
        .replace(/\u00A0/g, ' ')
        .replace(/^-\s+/gm, '• ')
        .trim();

    const {
        editingMessageId,
        editText,
        setEditText,
        handleConfirmEdit,
        handleCancelEdit,
        setEditingMessageId,
        messagesEndRef
    } = editingState;

    const canEdit = isAdminMessage && msg.content_type === 'text' && !!msg.message_id && !isInputDisabled;
    const isBeingEdited = editingMessageId !== null && editingMessageId === msg.message_id;

    return (
        <div className={`flex ${justification} group`}>
            <div className="flex flex-col max-w-lg">
                {senderName && ( <span className={`text-[11px] font-medium text-gray-500 mb-1 ${nameAlignment} px-1`}>{senderName}</span> )}
                <div className={`${theme.borderRadius} px-4 py-2 ${theme.bgColor} ${theme.textColor} relative group-hover:shadow-md transition-shadow`}>
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
                                            a: ({node, ...props}) => <a className={`${theme.linkColor} underline`} target="_blank" rel="noopener noreferrer" {...props} />
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
    );
}
