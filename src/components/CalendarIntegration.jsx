import React, { useState, useEffect } from 'react';

export default function CalendarIntegration({ currentUser, apiBaseUrl, token }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleConnectGoogle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const redirectUri = encodeURIComponent(`${window.location.origin}/calendar/callback`);
            const response = await fetch(`${apiBaseUrl}/calendar/auth/google/url?redirect_uri=${redirectUri}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Falha ao gerar a URL de autenticação do Google.');
            }
            
            const data = await response.json();
            // Redirect user to the Google OAuth consent screen
            window.location.href = data.url;
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    // If the user is an Admin, they shouldn't even be here, but just in case:
    if (currentUser.role === 'Admin') {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
                <div className="bg-white p-8 rounded shadow-md max-w-md w-full text-center border-l-4 border-yellow-500">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
                    <p className="text-gray-600">Apenas médicos podem conectar agendas pessoais.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-gray-50 h-full">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">Integração de Agenda</h1>
            </header>

            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Google Calendar</h2>
                    <p className="text-gray-600 mb-6">
                        Conecte seu Google Calendar para permitir que o assistente gerencie seus agendamentos automaticamente. 
                        Isso é necessário para sincronizar suas consultas e bloquear horários ocupados.
                    </p>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 border border-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleConnectGoogle}
                        disabled={isLoading}
                        className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-md shadow-sm font-medium transition-colors ${
                            isLoading 
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>{isLoading ? 'Redirecionando...' : 'Conectar com Google'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
