import React, { useState, useEffect, useRef, useMemo } from 'react';
import UserIcon from './UserIcon.jsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// --- ICONS ---
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> );
const SolvedIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500 hover:text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> );
const TakeOverIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500 hover:text-blue-500" title="Falar diretamente com o cliente."><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> );
const PaperclipIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> );
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> );

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
  const [editorHtml, setEditorHtml] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);
  const allSupervisionTypes = ["Social", "Administração", "Esporte, Cultura e Artes"];

  // --- TURNDOWN SERVICE SETUP ---
  const turndownService = useMemo(() => {
    const service = new TurndownService({
        headingStyle: 'atx', // Use # for headings instead of underlining
        codeBlockStyle: 'fenced', // Use ``` for code blocks
        bulletListMarker: '-', // Use - for bullet points
        strongDelimiter: '**' // Use ** for bold (Standard Markdown)
    });

    // Use GFM plugin for Strikethrough (~~), Tables, etc.
    service.use(gfm);

    // Custom Rules to handle inline styles from Quill (e.g. <span style="font-weight: bold">)
    service.addRule('styledBold', {
        filter: function (node) {
            return (
                node.nodeName === 'SPAN' &&
                (node.style.fontWeight === 'bold' || parseInt(node.style.fontWeight) >= 700)
            );
        },
        replacement: function (content) {
            return '**' + content + '**';
        }
    });

    service.addRule('styledItalic', {
        filter: function (node) {
            return (
                node.nodeName === 'SPAN' &&
                (node.style.fontStyle === 'italic')
            );
        },
        replacement: function (content) {
            return '_' + content + '_';
        }
    });

    service.addRule('styledStrike', {
        filter: function (node) {
            return (
                node.nodeName === 'SPAN' &&
                (node.style.textDecoration.includes('line-through'))
            );
        },
        replacement: function (content) {
            return '~~' + content + '~~';
        }
    });

    return service;
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversation]);

  // Clear editor when conversation changes
  useEffect(() => {
      setEditorHtml('');
      setAttachedFile(null);
  }, [conversation?.composite_id]);

  const handleSend = () => {
    // Check if there is text (stripping HTML tags to check for empty content)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorHtml;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (textContent.trim() || attachedFile) {
        let textToSend = '';

        if (textContent.trim()) {
            // Convert HTML to Markdown using Turndown
            const markdown = turndownService.turndown(editorHtml);

            // --- SIGNATURE LOGIC ---
            const nameToDisplay = currentUser.name || currentUser.username || 'Assistente';
            textToSend = `**${nameToDisplay}:**\n\n${markdown}`;
        }

        onSendMessage({ text: textToSend, file: attachedFile });
        setEditorHtml('');
        setAttachedFile(null);
    }
  };

  // Setup Quill modules (Toolbar & Keyboard bindings)
  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }]
    ],
    keyboard: {
        bindings: {
            enter: {
                key: 13,
                shiftKey: false,
                handler: () => { return true; } // Let the event propagate to wrapper
            }
        }
    }
  }), []);

  const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  const handleFileChange = (e) => { if (e.target.files && e.target.files[0]) { setAttachedFile(e.target.files[0]); } };
  const handleTypeChange = (e) => { const newType = e.target.value; if (newType) { onInitiateTransfer(conversation.composite_id, newType); e.target.value = ""; } };


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
  const isInputDisabled = conversation.status !== 'open' || !conversation.human_supervision;

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

      <div className="flex-grow p-6 overflow-y-auto bg-cover bg-center" style={{ backgroundImage: "url('[https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg](https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg)')" }}>
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
            const nameAlignment = isUserMessage ? 'text-right mr-2' : 'text-left';
            let senderName = msg.sender === 'user'
                ? (conversation.user_name || 'Cliente')
                : msg.sender === 'bot' ? 'Indaiatuba IA' : msg.sender;

            let bgColor = 'bg-green-100';
            if (isUserMessage) {
                bgColor = 'bg-white';
            } else if (isBotMessage) {
                bgColor = 'bg-yellow-100';
            }

            const displayText = msg.text ? msg.text.replace(/^\*\*[^*]+:\*\*\s+/, '') : '';

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
                                            {displayText}
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

        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 transition-shadow">
          <div className="flex items-end p-2 relative">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
             <button onClick={() => fileInputRef.current.click()} className="p-2 text-gray-500 hover:text-blue-500 transition-colors self-end mb-2" disabled={isInputDisabled} title="Anexar arquivo"><PaperclipIcon /></button>

             {/* EDITOR CONTAINER */}
             <div className="flex-grow mx-2" style={{ maxWidth: 'calc(100% - 80px)' }} onKeyDown={handleKeyDown}>
                {!isInputDisabled ? (
                    <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={editorHtml}
                        onChange={setEditorHtml}
                        modules={modules}
                        placeholder={attachedFile ? "Adicione uma legenda (opcional)" : "Digite uma mensagem"}
                        className="custom-quill-editor"
                    />
                ) : (
                    <div className="p-3 text-gray-400 italic bg-gray-50 rounded">
                        {conversation.status !== 'open' ? "Conversa encerrada" : "Assuma a conversa para enviar mensagens"}
                    </div>
                )}
             </div>

             <button onClick={handleSend} className="p-2 ml-1 text-blue-500 hover:text-blue-600 transition-colors duration-200 disabled:text-gray-300 self-end mb-2" disabled={isInputDisabled}><SendIcon /></button>
          </div>

          <style>{`
            .custom-quill-editor .ql-container {
                border: none !important;
                font-family: inherit;
                font-size: 0.875rem;
            }
            .custom-quill-editor .ql-toolbar {
                border: none !important;
                border-bottom: 1px solid #f3f4f6 !important;
                padding: 4px 0px;
            }
            .custom-quill-editor .ql-editor {
                min-height: 44px;
                max-height: 160px;
                overflow-y: auto;
                padding: 8px 0px;
            }
            .custom-quill-editor .ql-editor.ql-blank::before {
                color: #9ca3af;
                font-style: normal;
                left: 0;
            }
          `}</style>
        </div>
      </footer>
    </div>
  );
}