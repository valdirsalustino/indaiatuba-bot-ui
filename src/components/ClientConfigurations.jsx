import React, { useState, useEffect } from 'react';

export default function ClientConfigurations({ apiBaseUrl, token }) {
    const [activeTab, setActiveTab] = useState('systemPrompt');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [promptError, setPromptError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [savingPrompt, setSavingPrompt] = useState(false);

    useEffect(() => {
        if (activeTab === 'systemPrompt' && apiBaseUrl && token) {
            const fetchSystemPrompt = async () => {
                setLoadingPrompt(true);
                setPromptError('');
                try {
                    const url = `${apiBaseUrl}/system-prompt`;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setSystemPrompt(data.prompt || '');
                    } else if (response.status !== 404) { // 404 is ok, just means no prompt yet
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.detail || `Erro ao carregar prompt: Status ${response.status}`);
                    } else {
                        setSystemPrompt(''); // Explicitly clear on 404
                    }
                } catch (error) {
                    setPromptError(error.message || 'Falha ao conectar com o servidor.');
                } finally {
                    setLoadingPrompt(false);
                }
            };
            fetchSystemPrompt();
        }
    }, [activeTab, apiBaseUrl, token]);

    const handleSave = async () => {
        setSavingPrompt(true);
        setPromptError('');
        try {
            const url = `${apiBaseUrl}/system-prompt`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: systemPrompt })
            });

            if (response.ok) {
                setIsEditing(false);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Erro ao salvar prompt: Status ${response.status}`);
            }
        } catch (error)
{
            setPromptError(error.message || 'Falha ao salvar prompt.');
        } finally {
            setSavingPrompt(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-700 mb-6">Configurações de Cliente</h2>

                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('systemPrompt')}
                            className={`${
                                activeTab === 'systemPrompt'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Prompt do sistema
                        </button>
                    </nav>
                </div>

                {activeTab === 'systemPrompt' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">Prompt do Sistema</h3>
                            {!loadingPrompt && (
                                <div>
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                        >
                                            Editar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSave}
                                            disabled={savingPrompt}
                                            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none ${savingPrompt ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {savingPrompt ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {loadingPrompt && <p className="text-blue-500">Carregando prompt...</p>}
                        {promptError && <p className="text-red-500">{promptError}</p>}
                        {!loadingPrompt && !promptError && (
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                readOnly={!isEditing}
                                className={`w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y overflow-auto ${!isEditing ? 'bg-gray-100' : ''}`}
                                placeholder="Nenhum prompt do sistema encontrado."
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}