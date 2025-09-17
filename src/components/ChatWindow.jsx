import React, { useState, useEffect, useRef } from 'react';
import UserIcon from './UserIcon';

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const SolvedIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-500 hover:text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
);


export default function ChatWindow({ conversation, onSendMessage, onMarkAsSolved }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  if (!conversation) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
            <UserIcon className="h-10 w-10 text-gray-400" />
          </div>
          <p className="mt-2 text-lg">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const needsAttention = conversation.messages.some(msg => msg.human_supervision);
  let lastMessageDate = null;

  return (
    <div className="flex-grow flex flex-col bg-gray-100">
      <header className="flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center">
            <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center bg-gray-200 flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-500" />
            </div>
            <h2 className="font-semibold text-gray-800">{conversation.thread_id}</h2>
        </div>
        {needsAttention && (
            <button onClick={() => onMarkAsSolved(conversation.thread_id)} title="Mark as Solved">
                <SolvedIcon />
            </button>
        )}
      </header>

      <div className="flex-grow p-6 overflow-y-auto bg-cover bg-center" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')" }}>
        <div className="flex flex-col space-y-2">
          {conversation.messages.map((msg, index) => {
            const messageDate = new Date(msg.timestamp);
            const currentDateStr = messageDate.toLocaleString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
            let dateDivider = null;

            if (currentDateStr !== lastMessageDate) {
              dateDivider = (
                <div key={`date-${index}`} className="flex justify-center my-3">
                  <span className="bg-white bg-opacity-90 text-gray-600 text-xs font-semibold px-3 py-1 rounded-lg shadow-sm">
                    {currentDateStr}
                  </span>
                </div>
              );
              lastMessageDate = currentDateStr;
            }

            return (
              <React.Fragment key={index}>
                {dateDivider}
                <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-xl px-4 py-2 max-w-lg shadow-md ${msg.sender === 'user' ? 'bg-green-100 text-gray-800' : 'bg-white text-gray-800'}`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                    <span className="text-xs text-gray-400 float-right mt-1 ml-2">{messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="bg-gray-50 p-4 border-t border-gray-200">
        <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite uma mensagem"
            className="flex-grow bg-transparent focus:outline-none text-gray-700"
          />
          <button onClick={handleSend} className="ml-3 text-blue-500 hover:text-blue-600 transition-colors duration-200">
            <SendIcon />
          </button>
        </div>
      </footer>
    </div>
  );
}