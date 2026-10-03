import React, { useState, useEffect, useRef } from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import useUserSearch from '../hooks/useUserSearch';

export default function NewConversationModal({ isOpen, onClose, onSubmit, onCheckPhone, isSubmitting, apiBaseUrl, authFetch }) {
  const [step, setStep] = useState(1);
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [existingUser, setExistingUser] = useState(null);

  const { query, setQuery, results, isLoading: isSearchLoading, error: searchError, setResults } = useUserSearch(apiBaseUrl, authFetch, 300);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Track selected index for keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPhoneNumber('');
      setClientName('');
      setExistingUser(null);
      setIsCheckingPhone(false);
      setQuery('');
      setResults([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  }, [isOpen, setQuery, setResults]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  if (!isOpen) return null;

  const handleSelectUser = (user) => {
    setPhoneNumber(`+${user.phone_number.replace(/^\+/, '')}`);
    setExistingUser(user.user_name || user.phone_number);
    setQuery('');
    setShowDropdown(false);
    setStep(2);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectUser(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) return;
    
    setIsCheckingPhone(true);
    try {
      const result = await onCheckPhone(phoneNumber);
      if (result.exists) {
        setExistingUser(result.user_name);
      } else {
        setExistingUser(null);
      }
      setStep(2);
    } catch (err) {
      console.error("Error checking phone number:", err);
      setExistingUser(null);
      setStep(2);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) return;
    onSubmit(phoneNumber, existingUser ? null : clientName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Iniciar Nova Conversa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {step === 1 ? (
          <div className="p-4 space-y-6">
            
            {/* Search Existing Contact */}
            <div className="relative" ref={dropdownRef}>
              <label htmlFor="searchContact" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar Contato Existente
              </label>
              <input
                type="text"
                id="searchContact"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Digite o nome ou número..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCheckingPhone}
                autoComplete="off"
              />
              
              {showDropdown && query.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {isSearchLoading ? (
                    <div className="p-3 text-sm text-gray-500 text-center">Buscando...</div>
                  ) : searchError ? (
                    <div className="p-3 text-sm text-red-500 text-center">Erro ao buscar</div>
                  ) : results.length > 0 ? (
                    <ul className="py-1">
                      {results.map((user, idx) => (
                        <li 
                          key={user.phone_number}
                          onClick={() => handleSelectUser(user)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`px-4 py-2 cursor-pointer flex justify-between items-center transition-colors ${selectedIndex === idx ? 'bg-blue-50' : 'hover:bg-blue-50'}`}
                        >
                          <span className="font-medium text-gray-900 truncate pr-2 flex-grow">{user.user_name || 'Desconhecido'}</span>
                          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">+{user.phone_number}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">Nenhum contato encontrado</div>
                  )}
                </div>
              )}
            </div>

            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Ou inicie com um novo número</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* New Phone Number */}
            <form onSubmit={handleVerify}>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Telefone (WhatsApp)
              </label>
              <PhoneInput
                international
                defaultCountry="BR"
                value={phoneNumber}
                onChange={setPhoneNumber}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 bg-white text-gray-700"
                disabled={isCheckingPhone}
                id="phoneNumber"
              />
              <p className="mt-1 text-xs text-gray-500">
                Digite o número com o DDD.
              </p>
              
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
                  disabled={isCheckingPhone}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center"
                  disabled={isCheckingPhone || !phoneNumber || !isValidPhoneNumber(phoneNumber)}
                >
                  {isCheckingPhone ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verificando...
                    </>
                  ) : (
                    "Verificar"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Número</p>
              <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded-md">{phoneNumber}</p>
            </div>

            {existingUser ? (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Cliente Encontrado</p>
                <p className="text-sm text-gray-900 bg-gray-100 p-2 rounded-md">{existingUser}</p>
              </div>
            ) : (
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome do Cliente"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
                <p className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                  Esse nome é temporário e será substituído pelo nome da conta do cliente quando ele responder.
                </p>
              </div>
            )}
            
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md transition-colors"
                disabled={isSubmitting}
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center"
                disabled={isSubmitting || (!existingUser && !clientName)}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  "Iniciar Conversa"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
