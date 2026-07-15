import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

// --- ICONS ---
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform -rotate-45 ml-1 mb-1"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> );
const PaperclipIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> );

export default function ChatInputArea({ conversation, onSendMessage, currentUser, isInputDisabled, isPast24hWindow }) {
  const [editorHtml, setEditorHtml] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);
  const quillRef = useRef(null);

  // --- TURNDOWN SERVICE SETUP ---
  const turndownService = useMemo(() => {
    const service = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-', // REVERTED: Use standard '-' for stability inside the engine
        strongDelimiter: '**'
    });

    service.use(gfm);

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

  useEffect(() => {
      setEditorHtml('');
      setAttachedFile(null);
  }, [conversation?.composite_id]);

  const handleSend = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorHtml;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';

    if (textContent.trim() || attachedFile) {
        let textToSend = '';

        if (textContent.trim()) {
            // 1. Convert HTML to Markdown (Standard)
            let markdown = turndownService.turndown(editorHtml);

            // 2. Fix Non-Breaking Spaces (Wrapping Issue)
            markdown = markdown.replace(/\u00A0/g, ' ');

            // 3. WHATSAPP FIX: Convert standard list hyphens (-) to Visual Bullets (•)
            // This Regex finds a hyphen at the start of a line (with optional indentation) and swaps it.
            markdown = markdown.replace(/^(\s*)-\s+/gm, '$1• ');

            const nameToDisplay = currentUser?.name || currentUser?.username || 'Assistente';
            textToSend = `**${nameToDisplay}:**\n\n${markdown}`;
        }

        onSendMessage({ text: textToSend, file: attachedFile, isTemplate: isPast24hWindow });
        setEditorHtml('');
        setAttachedFile(null);
    }
  };

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
                handler: () => { return true; }
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

  const handleFileChange = (e) => { 
      if (e.target.files && e.target.files[0]) { 
          setAttachedFile(e.target.files[0]); 
      } 
  };

  return (
    <footer className="bg-gray-50 p-4 border-t border-gray-200">
      {isPast24hWindow && !isInputDisabled && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] px-3 py-2 rounded-lg mb-3 flex items-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              O cliente não envia mensagens há mais de 24h. Sua resposta será enviada como um template padrão.
          </div>
      )}

      {attachedFile && (
          <div className="px-4 pb-2 text-sm text-gray-600 flex justify-between items-center">
              <span>Anexado: {attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="font-bold text-red-500">X</button>
          </div>
      )}

      <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all max-w-5xl mx-auto w-full">
        <div className="flex items-end p-2 relative">
           <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
           <button onClick={() => fileInputRef.current.click()} className="p-2.5 text-gray-400 hover:text-indigo-500 hover:bg-gray-50 rounded-full transition-colors self-end mb-1" disabled={isInputDisabled} title="Anexar arquivo"><PaperclipIcon /></button>

           {/* EDITOR CONTAINER */}
           <div className="flex-grow mx-2 flex flex-col" style={{ maxWidth: 'calc(100% - 100px)' }} onKeyDown={handleKeyDown}>
              {!isInputDisabled ? (
                  isPast24hWindow ? (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col overflow-hidden my-1 shadow-sm">
                          <div className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1.5 border-b border-gray-200 font-medium">
                              Temos uma mensagem do suporte: {currentUser?.name || currentUser?.username || 'Assistente'}:
                          </div>
                          <ReactQuill
                              ref={quillRef}
                              theme="snow"
                              value={editorHtml}
                              onChange={setEditorHtml}
                              modules={modules}
                              placeholder="Digite sua mensagem de suporte aqui..."
                              className="custom-quill-editor"
                          />
                          <div className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1.5 border-t border-gray-200 font-medium">
                              Por favor, responda a esta mensagem se tiver mais alguma dúvida.
                          </div>
                      </div>
                  ) : (
                      <ReactQuill
                          ref={quillRef}
                          theme="snow"
                          value={editorHtml}
                          onChange={setEditorHtml}
                          modules={modules}
                          placeholder={attachedFile ? "Adicione uma legenda (opcional)" : "Digite uma mensagem"}
                          className="custom-quill-editor"
                      />
                  )
              ) : (
                  <div className="p-3 text-gray-400 italic bg-gray-50 rounded">
                      {conversation?.status !== 'open' ? "Conversa encerrada" : "Assuma a conversa para enviar mensagens"}
                  </div>
              )}
           </div>
           <button onClick={handleSend} className="p-3 mx-1 text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors duration-200 disabled:bg-gray-300 shadow-sm self-end mb-1 flex items-center justify-center" disabled={isInputDisabled}><SendIcon /></button>
        </div>

        <style>{`
          .custom-quill-editor .ql-container {
              border: none !important;
              font-family: inherit;
              font-size: 0.95rem;
          }
          .custom-quill-editor .ql-toolbar {
              border: none !important;
              border-bottom: 1px solid #f1f5f9 !important;
              padding: 6px 8px;
          }
          .custom-quill-editor .ql-editor {
              min-height: 48px;
              max-height: 150px;
              padding: 12px;
          }
          .custom-quill-editor .ql-editor.ql-blank::before {
              font-style: normal;
              color: #94a3b8;
          }
        `}</style>
      </div>
    </footer>
  );
}
