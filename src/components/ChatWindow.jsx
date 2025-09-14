import React, { useState, useEffect, useRef } from 'react';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-gray-400">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export default function ChatWindow({ conversation, onSendMessage }) {
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
          <UserIcon />
          <p className="mt-2 text-lg">Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const getAvatar = (name) => `https://placehold.co/100x100/7B46E4/FFFFFF?text=${name.charAt(0).toUpperCase()}`;

  let lastMessageDate = null;

  return (
    <div className="flex-grow flex flex-col bg-gray-100">
      <header className="flex items-center p-3 bg-white border-b border-gray-200 shadow-sm">
         <img src={getAvatar(conversation.thread_id)} alt={conversation.thread_id} className="w-10 h-10 rounded-full mr-3" />
         <h2 className="font-semibold text-gray-800">{conversation.thread_id}</h2>
      </header>

      <div className="flex-grow p-6 overflow-y-auto bg-cover bg-center" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')" }}>
        <div className="flex flex-col space-y-2">
          {conversation.messages.map((msg, index) => {
            const messageDate = new Date(msg.timestamp);
            const currentDateStr = messageDate.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
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