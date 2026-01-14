import React, { useState, useEffect, useRef } from 'react';
import UserIcon from './UserIcon.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- ICONS ---
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> );
const SolvedIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500 hover:text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> );
const TakeOverIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500 hover:text-blue-500" title="Falar diretamente com o cliente."><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> );
const PaperclipIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> );
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );

// --- FORMATTING ICONS ---
const BoldIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg> );
const ItalicIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg> );
const StrikeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.3 19c-1.4 1.3-3.2 2-5.3 2-4.4 0-8-3.6-8-8 0-1.8.6-3.5 1.7-4.8"></path><path d="M10.3 4.2c1.1-.2 2.3-.2 3.4 0 4.4.7 7.7 4.5 7.7 8.8 0 1.2-.2 2.3-.5 3.3"></path><line x1="4" y1="12" x2="20" y2="12"></line></svg> );
const ListIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> );


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

export default function ChatWindow({ conversation, onSendMessage, onMarkAsSolved, onInitiateTransfer, onTakeOver, currentUser }) {
  const [newMessage, setNewMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const allSupervisionTypes = ["Social", "Administração", "Esporte, Cultura e Artes"];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);
  useEffect(() => { setNewMessage(''); setAttachedFile(null); }, [conversation?.composite_id]);

  const handleSend = () => { if (newMessage.trim() || attachedFile) { onSendMessage({ text: newMessage, file: attachedFile }); setNewMessage(''); setAttachedFile(null); } };
  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) { setAttachedFile(e.target.files[0]); } };
  const handleTypeChange = (e) => { const newType = e.target.value; if (newType) { onInitiateTransfer(conversation.composite_id, newType); e.target.value = ""; } };

  // Helper function to insert markdown at cursor position
  const insertFormat = (formatType) => {
    const input = textInputRef.current;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = newMessage;
    let newText = '';
    let newCursorPos = end;

    switch (formatType) {
        case 'bold':
            newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
            newCursorPos = end + 2;
            break;
        case 'italic':
            newText = text.substring(0, start) + '*' + text.substring(start, end) + '*' + text.substring(end);
            newCursorPos = end + 1;
            break;
        case 'strike':
            newText = text.substring(0, start) + '~~' + text.substring(start, end) + '~~' + text.substring(end);
            newCursorPos = end + 2;
            break;
        case 'list':
            const before = text.substring(0, start);
            const needsNewline = before.length > 0 && before[before.length - 1] !== '\n';
            const prefix = needsNewline ? '\n- ' : '- ';
            newText = before + prefix + text.substring(start);
            newCursorPos = start + prefix.length;
            break;
        default:
            return;
    }

    setNewMessage(newText);
    setTimeout(() => {
        input.focus();
        input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2"><UserIcon className="h-10 w-10 text-gray-400" /></div>
          <p className="mt-2 text-lg">Selecione um tópico de conversa</p>
        </div>
      </div>
    );
  }

  const needsAttention = conversation.status === 'open' && conversation.human_supervision;
  let lastMessageDate = null;
  const availableTypes = allSupervisionTypes.filter( (type) => type !== conversation.human_supervision_type );

  return (
    <div className="flex-grow flex flex-col bg-gray-100">
      <header className="flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center">
            <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center bg-gray-200 flex-shrink-0"><UserIcon className="h-6 w-6 text-gray-500" /></div>
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
        <div className="flex items-center space-x-4">
            {conversation.status === 'open' ? (
              conversation.human_supervision ? (
                <>
                  <div>
                    <select onChange={handleTypeChange} value="" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5" >
                      <option value="" disabled>Transferir</option>
                      {availableTypes.map((type) => ( <option key={type} value={type}>{type}</option> ))}
                    </select>
                  </div>
                  <button onClick={() => onMarkAsSolved(conversation.composite_id)} title="Marcar como Resolvido"><SolvedIcon /></button>
                </>
              ) : ( <button onClick={() => onTakeOver(conversation.composite_id)} title="Assumir conversa e desativar o bot"><TakeOverIcon /></button> )
            ) : ( <span className="text-xs font-semibold text-gray-500 italic">Conversa Encerrada</span> )}
        </div>
      </header>

      <div className="flex-grow p-6 overflow-y-auto bg-cover bg-center" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')" }}>
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
            const justification = isUserMessage ? 'justify-end' : 'justify-start';
            const nameAlignment = isUserMessage ? 'text-right mr-2' : 'text-left ml-2';
            let senderName = msg.sender === 'user' ? 'Cliente' : msg.sender === 'bot' ? 'Indaiatuba IA' : msg.sender;

            let bgColor = 'bg-green-100';
            if (isUserMessage) {
                bgColor = 'bg-white';
            } else if (isBotMessage) {
                bgColor = 'bg-yellow-100';
            }

            return (
              <React.Fragment key={index}>
                {dateDivider}
                <div className={`flex ${justification}`}>
                    <div className="flex flex-col max-w-lg">
                        {senderName && ( <span className={`text-xs text-gray-700 font-bold capitalize ${nameAlignment} ${bgColor} border border-gray-200 rounded-t-lg px-2 py-1 self-start`}>{senderName}</span> )}
                        <div className={`rounded-xl px-4 py-2 shadow-md ${bgColor} text-gray-800 ${senderName ? 'rounded-t-none' : ''}`}>
                            <div className="flex flex-col">
                                {msg.media_url && <MediaRenderer msg={msg} />}
                                {msg.text && (
                                    /* FIX: Wrapped ReactMarkdown in a div to handle styling */
                                    <div className={`text-sm ${msg.media_url ? 'mt-2' : ''} overflow-hidden`}>
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({node, ...props}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                                                strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                                                em: ({node, ...props}) => <span className="italic" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                                a: ({node, ...props}) => <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer" {...props} />
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-gray-400 float-right mt-1 ml-2">{messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="bg-gray-50 p-4 border-t border-gray-200">
        {attachedFile && (
            <div className="px-4 pb-2 text-sm text-gray-600 flex justify-between items-center">
                <span>Anexado: {attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} className="font-bold text-red-500">X</button>
            </div>
        )}

        {/* Input Area Container */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">

          {/* Main Input Toolbar */}
          <div className="flex items-end p-2">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
             <button onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:text-blue-500 transition-colors" disabled={conversation.status !== 'open' || !conversation.human_supervision} title="Anexar arquivo"><PaperclipIcon /></button>

             <textarea
               ref={textInputRef}
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder={ conversation.status !== 'open' ? "Conversa encerrada" : !conversation.human_supervision ? "Assuma a conversa para enviar mensagens" : attachedFile ? "Adicione uma legenda (opcional)" : "Digite uma mensagem (Shift+Enter para pular linha)" }
               className="flex-grow bg-transparent focus:outline-none text-gray-700 resize-none py-2 px-2 max-h-48 overflow-y-auto"
               rows={1}
               style={{ minHeight: '44px' }}
               disabled={conversation.status !== 'open' || !conversation.human_supervision}
             />

             <button onClick={handleSend} className="p-2 ml-1 text-blue-500 hover:text-blue-600 transition-colors duration-200 disabled:text-gray-300" disabled={conversation.status !== 'open' || !conversation.human_supervision}><SendIcon /></button>
          </div>

          {/* Formatting Toolbar */}
          {conversation.status === 'open' && conversation.human_supervision && (
              <div className="flex items-center px-3 pb-2 pt-1 border-t border-gray-100 space-x-1">
                  <button onClick={() => insertFormat('bold')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Negrito (**texto**)">
                      <BoldIcon />
                  </button>
                  <button onClick={() => insertFormat('italic')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Itálico (*texto*)">
                      <ItalicIcon />
                  </button>
                  <button onClick={() => insertFormat('strike')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Tachado (~~texto~~)">
                      <StrikeIcon />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-2"></div>
                  <button onClick={() => insertFormat('list')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors" title="Lista (- item)">
                      <ListIcon />
                  </button>
                  <span className="flex-grow"></span>
                  <span className="text-[10px] text-gray-400 select-none">Markdown Suportado</span>
              </div>
          )}
        </div>
      </footer>
    </div>
  );
}