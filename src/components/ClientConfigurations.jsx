import React, { useState, useEffect } from 'react';

export default function ClientConfigurations({ apiBaseUrl, token }) {
    const [activeTab, setActiveTab] = useState('clientInfoAndPrompt');

    const [clientName, setClientName] = useState('');
    const [website, setWebsite] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [loadingClientPrompt, setLoadingClientPrompt] = useState(false);
    const [clientPromptError, setClientPromptError] = useState('');
    const [isEditingClientPrompt, setIsEditingClientPrompt] = useState(false);
    const [savingClientPrompt, setSavingClientPrompt] = useState(false);

    const [newsUrl, setNewsUrl] = useState('');
    const [loadingNewsUrl, setLoadingNewsUrl] = useState(false);
    const [newsUrlError, setNewsUrlError] = useState('');
    const [isEditingNewsUrl, setIsEditingNewsUrl] = useState(false);
    const [savingNewsUrl, setSavingNewsUrl] = useState(false);

    const [sportsUrls, setSportsUrls] = useState([]);
    const [loadingSportsUrls, setLoadingSportsUrls] = useState(false);
    const [sportsUrlsError, setSportsUrlsError] = useState('');
    const [editingSportsUrlIndex, setEditingSportsUrlIndex] = useState(null);
    const [savingSportsUrlIndex, setSavingSportsUrlIndex] = useState(null);
    const [originalUrlToEdit, setOriginalUrlToEdit] = useState(null);

    const [googleDriverId, setGoogleDriverId] = useState('');
    const [loadingGoogleDriverId, setLoadingGoogleDriverId] = useState(false);
    const [googleDriverIdError, setGoogleDriverIdError] = useState('');
    const [isEditingGoogleDriverId, setIsEditingGoogleDriverId] = useState(false);
    const [savingGoogleDriverId, setSavingGoogleDriverId] = useState(false);

    const [originalClientInfo, setOriginalClientInfo] = useState({ name: '', website: '' });
    const [originalSystemPrompt, setOriginalSystemPrompt] = useState('');

    const [secrets, setSecrets] = useState({
        whatsapp_access_token: '',
        whatsapp_phone_number_id: '',
        tavily_api_key: '',
        google_api_key: ''
    });
    const [secretsMetadata, setSecretsMetadata] = useState(null);
    const [loadingSecrets, setLoadingSecrets] = useState(false);
    const [secretsError, setSecretsError] = useState('');
    const [isEditingSecrets, setIsEditingSecrets] = useState(false);
    const [savingSecrets, setSavingSecrets] = useState(false);

    useEffect(() => {
        // --- FETCH COMBINADO: Cliente Info e Prompt ---
        if (activeTab === 'clientInfoAndPrompt' && apiBaseUrl && token) {
            const fetchClientPromptData = async () => {
                setLoadingClientPrompt(true);
                setClientPromptError('');
                try {
                    const infoUrl = `${apiBaseUrl}/client-info`;
                    const infoResponse = await fetch(infoUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (infoResponse.ok) {
                        const infoData = await infoResponse.json();
                        setClientName(infoData.client_name || '');
                        setWebsite(infoData.website || '');
                        setOriginalClientInfo({ name: infoData.client_name || '', website: infoData.website || '' });
                    } else if (infoResponse.status !== 404) {
                        const errorData = await infoResponse.json().catch(() => ({}));
                        throw new Error(errorData.detail || `Erro ao carregar Info do Cliente: Status ${infoResponse.status}`);
                    } else {
                        setClientName('');
                        setWebsite('');
                    }

                    const promptUrl = `${apiBaseUrl}/system-prompt`;
                    const promptResponse = await fetch(promptUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (promptResponse.ok) {
                        const promptData = await promptResponse.json();
                        setSystemPrompt(promptData.prompt || '');
                        setOriginalSystemPrompt(promptData.prompt || '');
                    } else if (promptResponse.status !== 404) {
                        const errorData = await promptResponse.json().catch(() => ({}));
                        throw new Error(errorData.detail || `Erro ao carregar prompt: Status ${promptResponse.status}`);
                    } else {
                        setSystemPrompt('');
                    }
                } catch (error) {
                    setClientPromptError(error.message || 'Falha ao conectar com o servidor.');
                } finally {
                    setLoadingClientPrompt(false);
                }
            };
            fetchClientPromptData();
        } else if (activeTab === 'newsUrl' && apiBaseUrl && token) {
            const fetchNewsUrl = async () => {
                setLoadingNewsUrl(true);
                setNewsUrlError('');
                try {
                    const url = `${apiBaseUrl}/news-url`;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setNewsUrl(data.url || '');
                    } else if (response.status !== 404) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.detail || `Erro ao carregar URL de notícias: Status ${response.status}`);
                    } else {
                        setNewsUrl('');
                    }
                } catch (error) {
                    setNewsUrlError(error.message || 'Falha ao conectar com o servidor.');
                } finally {
                    setLoadingNewsUrl(false);
                }
            };
            fetchNewsUrl();
        } else if (activeTab === 'sportsUrls' && apiBaseUrl && token) {
            const fetchSportsUrls = async () => {
                setLoadingSportsUrls(true);
                setSportsUrlsError('');
                try {
                    const url = `${apiBaseUrl}/sports-urls`;
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setSportsUrls(Array.isArray(data) ? data : []);
                    } else if (response.status !== 404) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.detail || `Erro ao carregar URLs de esportes: Status ${response.status}`);
                    } else {
                        setSportsUrls([]);
                    }
                } catch (error) {
                    setSportsUrlsError(error.message || 'Falha ao conectar com o servidor.');
                } finally {
                    setLoadingSportsUrls(false);
                }
            };
            fetchSportsUrls();
        } else if (activeTab === 'googleDriverId' && apiBaseUrl && token) {
             const fetchGoogleDriverId = async () => {
                 setLoadingGoogleDriverId(true);
                 setGoogleDriverIdError('');
                 try {
                     const url = `${apiBaseUrl}/google-driver-id`;
                     const response = await fetch(url, {
                         headers: { 'Authorization': `Bearer ${token}` }
                     });
                     if (response.ok) {
                         const data = await response.json();
                         setGoogleDriverId(data.folder_id || '');
                     } else if (response.status !== 404) {
                         const errorData = await response.json().catch(() => ({}));
                         throw new Error(errorData.detail || 'Erro ao carregar Google Driver ID');
                     }
                 } catch (error) {
                     setGoogleDriverIdError(error.message);
                 } finally {
                     setLoadingGoogleDriverId(false);
                 }
             };
            fetchGoogleDriverId();
        }  else if (activeTab === 'secrets' && apiBaseUrl && token) {
            const fetchSecretsMetadata = async () => {
                setLoadingSecrets(true);
                setSecretsError('');
                try {
                    const url = `${apiBaseUrl}/secrets`;
                    const response = await fetch(url, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setSecretsMetadata(data);
                        setSecrets(prev => ({
                            ...prev,
                            whatsapp_phone_number_id: data.whatsapp_phone_number_id || ''
                        }));
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.detail || 'Erro ao carregar metadados de segredos');
                    }
                } catch (error) {
                    setSecretsError(error.message);
                } finally {
                    setLoadingSecrets(false);
                }
            };
            fetchSecretsMetadata();
        }
    }, [activeTab, apiBaseUrl, token]);

    const handleSaveClientPrompt = async () => {
        setSavingClientPrompt(true);
        setClientPromptError('');
        try {
            // Only send the Client Info request if it actually changed
            if (clientName !== originalClientInfo.name || website !== originalClientInfo.website) {
                const infoUrl = `${apiBaseUrl}/client-info`;
                const infoResponse = await fetch(infoUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ client_name: clientName, website: website })
                });

                if (!infoResponse.ok) {
                    const errorData = await infoResponse.json().catch(() => ({}));
                    throw new Error(errorData.detail || `Erro ao salvar Info do Cliente: Status ${infoResponse.status}`);
                }
                // Update original state to reflect the new saved baseline
                setOriginalClientInfo({ name: clientName, website: website });
            }

            // Only send the System Prompt request if it actually changed
            if (systemPrompt !== originalSystemPrompt) {
                const promptUrl = `${apiBaseUrl}/system-prompt`;
                const promptResponse = await fetch(promptUrl, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: systemPrompt })
                });

                if (!promptResponse.ok) {
                    const errorData = await promptResponse.json().catch(() => ({}));
                    throw new Error(errorData.detail || `Erro ao salvar prompt: Status ${promptResponse.status}`);
                }
                // Update original state
                setOriginalSystemPrompt(systemPrompt);
            }

            setIsEditingClientPrompt(false);
        } catch (error) {
            setClientPromptError(error.message || 'Falha ao salvar dados.');
        } finally {
            setSavingClientPrompt(false);
        }
    };

    const handleSaveNewsUrl = async () => {
        setSavingNewsUrl(true);
        setNewsUrlError('');
        try {
            const url = `${apiBaseUrl}/news-url`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: newsUrl })
            });

            if (response.ok) {
                setIsEditingNewsUrl(false);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Erro ao salvar URL de notícias: Status ${response.status}`);
            }
        } catch (error) {
            setNewsUrlError(error.message || 'Falha ao salvar URL de notícias.');
        } finally {
            setSavingNewsUrl(false);
        }
    };

    const handleSaveSportsUrl = async (index) => {
        setSavingSportsUrlIndex(index);
        setSportsUrlsError('');
        const currentUrl = sportsUrls[index];

        try {
            const url = `${apiBaseUrl}/sports-urls`;

            const payload = { url: currentUrl };
            if (originalUrlToEdit && originalUrlToEdit !== '') {
                payload.old_url = originalUrlToEdit;
            }
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setEditingSportsUrlIndex(null);
                setOriginalUrlToEdit(null);
            } else {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = errorData.detail || `Erro ao salvar URL de esportes: Status ${response.status}`;
                if (response.status === 400) {
                    errorMessage = `URL inválida ou inacessível: ${currentUrl}`;
                }
                setSportsUrlsError(errorMessage);
            }
        } catch (error) {
            setSportsUrlsError(error.message || 'Falha ao salvar URL de esportes.');
        } finally {
            setSavingSportsUrlIndex(null);
        }
    };

    const handleSportsUrlChange = (index, value) => {
        const newSportsUrls = [...sportsUrls];
        newSportsUrls[index] = value;
        setSportsUrls(newSportsUrls);
    };

    const handleAddSportsUrl = () => {
        setSportsUrls([...sportsUrls, '']);
        setEditingSportsUrlIndex(sportsUrls.length);
        setOriginalUrlToEdit('');
    };

    const handleRemoveSportsUrl = async (indexToRemove) => {
        const urlToRemove = sportsUrls[indexToRemove];
        setSportsUrlsError('');
        try {
            const url = `${apiBaseUrl}/sports-urls`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: urlToRemove })
            });

            if (response.ok) {
                const updatedUrls = sportsUrls.filter((_, index) => index !== indexToRemove);
                setSportsUrls(updatedUrls);
                setEditingSportsUrlIndex(null);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Erro ao remover URL de esportes: Status ${response.status}`);
            }
        } catch (error) {
            setSportsUrlsError(error.message || 'Falha ao remover URL de esportes.');
        }
    };

    const handleSaveGoogleDriverId = async () => {
        setSavingGoogleDriverId(true);
        setGoogleDriverIdError('');
        try {
            const url = `${apiBaseUrl}/google-driver-id`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ folder_id: googleDriverId })
            });

            if (response.ok) {
                setIsEditingGoogleDriverId(false);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Erro ao salvar Google Driver ID');
            }
        } catch (error) {
            setGoogleDriverIdError(error.message);
        } finally {
            setSavingGoogleDriverId(false);
        }
    };

    const handleSaveSecrets = async () => {
        setSavingSecrets(true);
        setSecretsError('');
        try {
            const url = `${apiBaseUrl}/secrets`;
            const payload = Object.fromEntries(
                Object.entries(secrets).filter(([_, v]) => v !== '')
            );

            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setIsEditingSecrets(false);
                setSecrets({ whatsapp_access_token: '', whatsapp_phone_number_id: '', tavily_api_key: '', google_api_key: '' });
                setActiveTab('secrets');
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Erro ao salvar segredos');
            }
        } catch (error) {
            setSecretsError(error.message);
        } finally {
            setSavingSecrets(false);
        }
    };

    return (
        <div className="flex-grow flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-700 mb-6">Configurações de Cliente</h2>

                <div className="border-b border-gray-200 mb-4 overflow-x-auto">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('clientInfoAndPrompt')}
                            className={`${
                                activeTab === 'clientInfoAndPrompt'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Cliente info e prompt
                        </button>
                        <button
                            onClick={() => setActiveTab('newsUrl')}
                            className={`${
                                activeTab === 'newsUrl'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            URL de notícias
                        </button>
                        <button
                            onClick={() => setActiveTab('sportsUrls')}
                            className={`${
                                activeTab === 'sportsUrls'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            URL de esportes
                        </button>
                        <button
                            onClick={() => setActiveTab('googleDriverId')}
                            className={`${activeTab === 'googleDriverId' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Google Driver ID
                        </button>
                        <button
                            onClick={() => setActiveTab('secrets')}
                            className={`${activeTab === 'secrets' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            Segredos (API Keys)
                        </button>
                    </nav>
                </div>

                {activeTab === 'clientInfoAndPrompt' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">Informações e Prompt do Sistema</h3>
                            {!loadingClientPrompt && (
                                <div>
                                    {!isEditingClientPrompt ? (
                                        <button
                                            onClick={() => setIsEditingClientPrompt(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                        >
                                            Editar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSaveClientPrompt}
                                            disabled={savingClientPrompt}
                                            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none ${savingClientPrompt ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {savingClientPrompt ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {loadingClientPrompt && <p className="text-blue-500">Carregando dados...</p>}
                        {clientPromptError && <p className="text-red-500">{clientPromptError}</p>}
                        {!loadingClientPrompt && (
                            <div className="space-y-6">
                                {/* Informações do Cliente */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
                                        <input
                                            type="text"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            readOnly={!isEditingClientPrompt}
                                            className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!isEditingClientPrompt ? 'bg-gray-100' : ''}`}
                                            placeholder="Insira o nome do cliente"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                        <input
                                            type="text"
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            readOnly={!isEditingClientPrompt}
                                            className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!isEditingClientPrompt ? 'bg-gray-100' : ''}`}
                                            placeholder="Insira o website"
                                        />
                                    </div>
                                </div>

                                {/* Prompt do Sistema */}
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Prompt do Sistema</h4>
                                    <textarea
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        readOnly={!isEditingClientPrompt}
                                        className={`w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-y overflow-auto ${!isEditingClientPrompt ? 'bg-gray-100' : ''}`}
                                        placeholder="Nenhum prompt do sistema encontrado."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'newsUrl' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">URL de Notícias</h3>
                            {!loadingNewsUrl && (
                                <div>
                                    {!isEditingNewsUrl ? (
                                        <button
                                            onClick={() => setIsEditingNewsUrl(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                        >
                                            Editar
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSaveNewsUrl}
                                            disabled={savingNewsUrl}
                                            className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none ${savingNewsUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {savingNewsUrl ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {loadingNewsUrl && <p className="text-blue-500">Carregando URL...</p>}
                        {newsUrlError && <p className="text-red-500">{newsUrlError}</p>}
                        {!loadingNewsUrl && (
                            <input
                                type="text"
                                value={newsUrl}
                                onChange={(e) => setNewsUrl(e.target.value)}
                                readOnly={!isEditingNewsUrl}
                                className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${!isEditingNewsUrl ? 'bg-gray-100' : ''}`}
                                placeholder="Nenhuma URL de notícias encontrada."
                            />
                        )}
                    </div>
                )}

                {activeTab === 'sportsUrls' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">URLs de Esportes</h3>
                            <button
                                onClick={handleAddSportsUrl}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                            >
                                Adicionar URL
                            </button>
                        </div>

                        {loadingSportsUrls && <p className="text-blue-500">Carregando URLs...</p>}
                        {sportsUrlsError && <p className="text-red-500">{sportsUrlsError}</p>}
                        {!loadingSportsUrls && (
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {sportsUrls.length === 0 && !editingSportsUrlIndex && (
                                    <p className="text-gray-500">Nenhuma URL de esportes encontrada.</p>
                                )}
                                {sportsUrls.map((url, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => handleSportsUrlChange(index, e.target.value)}
                                            readOnly={editingSportsUrlIndex !== index}
                                            className={`flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${editingSportsUrlIndex !== index ? 'bg-gray-100' : ''}`}
                                            placeholder="Adicione uma URL de esportes"
                                        />
                                        {editingSportsUrlIndex === index ? (
                                            <button
                                                onClick={() => handleSaveSportsUrl(index)}
                                                disabled={savingSportsUrlIndex === index}
                                                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none ${savingSportsUrlIndex === index ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {savingSportsUrlIndex === index ? 'Salvando...' : 'Salvar'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {setEditingSportsUrlIndex(index); setOriginalUrlToEdit(url);}}
                                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
                                            >
                                                Editar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleRemoveSportsUrl(index)}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'googleDriverId' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">Google Driver ID</h3>
                            {!loadingGoogleDriverId && (
                                <div>
                                    {!isEditingGoogleDriverId ? (
                                        <button onClick={() => setIsEditingGoogleDriverId(true)} className="px-4 py-2 bg-blue-600 text-white rounded">Editar</button>
                                    ) : (
                                        <button onClick={handleSaveGoogleDriverId} disabled={savingGoogleDriverId} className="px-4 py-2 bg-green-600 text-white rounded">
                                            {savingGoogleDriverId ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {loadingGoogleDriverId && <p className="text-blue-500">Carregando...</p>}
                        {googleDriverIdError && <p className="text-red-500">{googleDriverIdError}</p>}
                        {!loadingGoogleDriverId && (
                            <input
                                type="text"
                                value={googleDriverId}
                                onChange={(e) => setGoogleDriverId(e.target.value)}
                                readOnly={!isEditingGoogleDriverId}
                                className={`w-full p-3 border rounded-md ${!isEditingGoogleDriverId ? 'bg-gray-100' : ''}`}
                                placeholder="Insira o ID da pasta do Google Drive"
                            />
                        )}
                    </div>
                )}

                {activeTab === 'secrets' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-gray-700">Configuração de Segredos</h3>
                            {!loadingSecrets && (
                                <button
                                    onClick={() => isEditingSecrets ? handleSaveSecrets() : setIsEditingSecrets(true)}
                                    className={`px-4 py-2 text-white rounded ${isEditingSecrets ? 'bg-green-600' : 'bg-blue-600'}`}
                                >
                                    {savingSecrets ? 'Salvando...' : isEditingSecrets ? 'Salvar Alterações' : 'Editar Segredos'}
                                </button>
                            )}
                        </div>

                        {secretsError && <p className="text-red-500">{secretsError}</p>}

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: 'whatsapp_access_token', label: 'WhatsApp Access Token', meta: 'has_whatsapp_token' },
                                { id: 'tavily_api_key', label: 'Tavily API Key', meta: 'has_tavily_key' },
                                { id: 'google_api_key', label: 'Google API Key', meta: 'has_google_key' }
                            ].map((field) => (
                                <div key={field.id}>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        {field.label} {secretsMetadata?.[field.meta] && <span className="text-green-600 text-xs">(Configurado)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        placeholder={isEditingSecrets ? `Insira o novo ${field.label}` : "••••••••••••••••"}
                                        disabled={!isEditingSecrets}
                                        value={secrets[field.id]}
                                        onChange={(e) => setSecrets({ ...secrets, [field.id]: e.target.value })}
                                        className="w-full p-3 border rounded-md disabled:bg-gray-100"
                                    />
                                </div>
                            ))}

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">WhatsApp Phone Number ID</label>
                                <input
                                    type="text"
                                    disabled={!isEditingSecrets}
                                    value={secrets.whatsapp_phone_number_id}
                                    onChange={(e) => setSecrets({ ...secrets, whatsapp_phone_number_id: e.target.value })}
                                    className="w-full p-3 border rounded-md disabled:bg-gray-100"
                                    placeholder="Ex: 83390616979999"
                                />
                            </div>
                        </div>

                        {secretsMetadata?.updated_at && (
                            <p className="text-xs text-gray-400 mt-4 italic">Última atualização: {new Date(secretsMetadata.updated_at).toLocaleString()}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}