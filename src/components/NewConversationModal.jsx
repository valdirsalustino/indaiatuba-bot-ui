import React, { useState, useEffect } from 'react';

export default function NewConversationModal({ isOpen, onClose, onSubmit, onCheckPhone, isSubmitting }) {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [existingUser, setExistingUser] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPhoneNumber('');
      setClientName('');
      setExistingUser(null);
      setIsCheckingPhone(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    const sanitizedNumber = phoneNumber.replace(/\D/g, '');
    if (!sanitizedNumber) return;
    
    setIsCheckingPhone(true);
    try {
      const result = await onCheckPhone(sanitizedNumber);
      if (result.exists) {
        setExistingUser(result.user_name);
      } else {
        setExistingUser(null);
      }
      setStep(2);
    } catch (err) {
      console.error("Error checking phone number:", err);
      // Proceed to step 2 anyway as a fallback, acting as new user
      setExistingUser(null);
      setStep(2);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const sanitizedNumber = phoneNumber.replace(/\D/g, '');
    if (!sanitizedNumber) return;
    onSubmit(sanitizedNumber, existingUser ? null : clientName);
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
          <form onSubmit={handleVerify} className="p-4 space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Número de Telefone (WhatsApp)
              </label>
              <input
                type="text"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+5511999999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isCheckingPhone}
              />
              <p className="mt-1 text-xs text-gray-500">
                Formato internacional (+55 seguido do DDD e número).
              </p>
            </div>
            
            <div className="flex justify-end pt-2">
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center"
                disabled={isCheckingPhone || !phoneNumber}
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center"
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
