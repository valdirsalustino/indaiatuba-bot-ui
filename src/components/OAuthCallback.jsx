import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OAuthCallback({ apiBaseUrl, token }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Processando autenticação...');
    const [error, setError] = useState(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
            setError("Nenhum código de autorização encontrado.");
            return;
        }

        const handleAuth = async () => {
            try {
                // The backend endpoint extracts tenant from the URL, so we can use the generic apiBaseUrl
                // However, state might contain "tenant:username", so we could also parse it
                const response = await fetch(`${apiBaseUrl}/calendar/auth/google/callback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ code })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || 'Falha ao vincular a conta do Google.');
                }

                setStatus('Conta vinculada com sucesso! Redirecionando...');
                
                // Redirect back to the main app after a short delay
                setTimeout(() => {
                    navigate('/'); // Back to the root layout
                }, 2000);
            } catch (err) {
                setError(err.message);
            }
        };

        handleAuth();
    }, [apiBaseUrl, searchParams, token, navigate]);

    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-gray-100 font-sans">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Conectando Agenda</h1>
                
                {error ? (
                    <div className="text-red-600 mb-6">
                        <svg className="w-12 h-12 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>{error}</p>
                        <button 
                            onClick={() => navigate('/')}
                            className="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                        >
                            Voltar para o Início
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">{status}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
